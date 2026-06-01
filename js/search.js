// Global Search Functionality for Gulf Coast Radar

class GlobalSearch {
  constructor() {
    this.searchInput = null;
    this.suggestionsContainer = null;
    this.overlay = null;
    this.currentQuery = '';
    this.recentSearches = this.loadRecentSearches();
    this.debounceTimer = null;
    this.currentHighlightIndex = -1;
    this.allBusinesses = typeof allBusinesses !== 'undefined' ? allBusinesses : [];

    // Pagination state
    this.currentPage = 1;
    this.itemsPerPage = 20;
    this.allResults = null;

    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.createSearchHTML();
    this.attachEventListeners();
    this.setupKeyboardShortcuts();
    this.listenForBusinessUpdates();
  }

  listenForBusinessUpdates() {
    // Listen for when businesses are dynamically loaded
    window.addEventListener('allBusinessesUpdated', (event) => {
      console.log('🔍 Search updating with new business data...');
      this.allBusinesses = event.detail.businesses || [];
      console.log(`✅ Search now has ${this.allBusinesses.length} businesses`);
    });
  }

  createSearchHTML() {
    // Don't add search bar on profile pages
    if (window.location.pathname.includes('profile.html')) return;

    // Find or create search container in header
    const header = document.querySelector('.gcr-header');
    if (!header) return;

    // Check if search already exists
    if (document.querySelector('.search-container')) return;

    const searchHTML = `
      <div class="search-container">
        <div class="search-input-wrapper">
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>

          <input
            type="text"
            class="search-input"
            placeholder="Search restaurants, activities, locations..."
            autocomplete="off"
            aria-label="Search"
          />

          <button class="search-clear-btn" aria-label="Clear search">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>

          <span class="search-keyboard-hint">
            <kbd>⌘K</kbd>
          </span>

          <button class="search-voice-btn" aria-label="Voice search" title="Voice search">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
              <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5z"/>
            </svg>
          </button>
        </div>

        <div class="search-filters">
          <label class="search-filter-label">
            <input type="checkbox" class="search-filter-checkbox" id="filter-restaurants" checked>
            <span class="search-filter-text">Restaurants</span>
          </label>
          <label class="search-filter-label">
            <input type="checkbox" class="search-filter-checkbox" id="filter-menu" checked>
            <span class="search-filter-text">Menu Items</span>
          </label>
          <label class="search-filter-label">
            <input type="checkbox" class="search-filter-checkbox" id="filter-everything" checked>
            <span class="search-filter-text">Everything</span>
          </label>
        </div>

        <div class="search-suggestions" id="search-suggestions">
          <!-- Dynamic content -->
        </div>
      </div>

      <div class="search-overlay" id="search-overlay"></div>
    `;

    // Insert after category tabs
    const categoryTabs = header.querySelector('.category-tabs');
    if (categoryTabs) {
      categoryTabs.insertAdjacentHTML('afterend', searchHTML);
    } else {
      // Fallback: insert after site title if category tabs not found
      const siteTitle = header.querySelector('.site-title');
      if (siteTitle) {
        siteTitle.insertAdjacentHTML('afterend', searchHTML);
      }
    }

    // Cache references
    this.searchInput = document.querySelector('.search-input');
    this.suggestionsContainer = document.getElementById('search-suggestions');
    this.overlay = document.getElementById('search-overlay');
  }

  attachEventListeners() {
    if (!this.searchInput) return;

    // Input events
    this.searchInput.addEventListener('input', (e) => this.handleInput(e));
    this.searchInput.addEventListener('focus', () => this.handleFocus());
    this.searchInput.addEventListener('blur', (e) => this.handleBlur(e));
    this.searchInput.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Clear button
    const clearBtn = document.querySelector('.search-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearSearch());
    }

    // Voice search button
    const voiceBtn = document.querySelector('.search-voice-btn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => this.startVoiceSearch());
    }

    // Overlay click
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.closeSuggestions());
    }

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        this.closeSuggestions();
      }
    });

    // Filter checkboxes
    const filterRestaurants = document.getElementById('filter-restaurants');
    const filterMenu = document.getElementById('filter-menu');
    const filterEverything = document.getElementById('filter-everything');

    if (filterRestaurants && filterMenu && filterEverything) {
      // When "Everything" is checked/unchecked, update other checkboxes
      filterEverything.addEventListener('change', () => {
        if (filterEverything.checked) {
          filterRestaurants.checked = true;
          filterMenu.checked = true;
        }
        this.performSearch();
      });

      // When individual checkboxes change, update "Everything"
      filterRestaurants.addEventListener('change', () => {
        filterEverything.checked = filterRestaurants.checked && filterMenu.checked;
        this.performSearch();
      });

      filterMenu.addEventListener('change', () => {
        filterEverything.checked = filterRestaurants.checked && filterMenu.checked;
        this.performSearch();
      });
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.searchInput?.focus();
      }

      // Escape to close
      if (e.key === 'Escape') {
        this.closeSuggestions();
        this.searchInput?.blur();
      }
    });
  }

  handleInput(e) {
    this.currentQuery = e.target.value.trim();

    // Debounce search
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.performSearch();
    }, 300);
  }

  handleFocus() {
    if (this.currentQuery) {
      this.performSearch();
    } else {
      this.showRecentSearches();
    }

    this.overlay?.classList.add('active');
  }

  handleBlur(e) {
    // Delay to allow click on suggestions
    setTimeout(() => {
      if (!document.activeElement?.closest('.search-container')) {
        this.closeSuggestions();
      }
    }, 200);
  }

  handleKeyDown(e) {
    const items = this.suggestionsContainer?.querySelectorAll('.suggestion-item, .recent-search-item');
    if (!items || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.currentHighlightIndex = Math.min(this.currentHighlightIndex + 1, items.length - 1);
      this.updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.currentHighlightIndex = Math.max(this.currentHighlightIndex - 1, -1);
      this.updateHighlight(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.currentHighlightIndex >= 0 && items[this.currentHighlightIndex]) {
        items[this.currentHighlightIndex].click();
      } else if (this.currentQuery) {
        this.goToSearchResults();
      }
    }
  }

  updateHighlight(items) {
    items.forEach((item, index) => {
      item.classList.toggle('highlighted', index === this.currentHighlightIndex);
    });

    // Scroll highlighted item into view
    if (this.currentHighlightIndex >= 0) {
      items[this.currentHighlightIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }

  performSearch() {
    if (!this.currentQuery) {
      this.showRecentSearches();
      return;
    }

    // Reset to page 1 when query changes
    this.currentPage = 1;
    const results = this.searchEverything(this.currentQuery);
    this.allResults = results; // Store all results for pagination
    this.displayResults(results);
  }

  searchEverything(query) {
    // Get filter settings
    const filterRestaurants = document.getElementById('filter-restaurants')?.checked ?? true;
    const filterMenu = document.getElementById('filter-menu')?.checked ?? true;

    // Search based on filters
    const businessResults = filterRestaurants ? this.searchBusinesses(query) : { businesses: [], locations: [], tags: [] };
    const menuResults = filterMenu ? this.searchMenuItems(query) : [];
    const drinkResults = filterMenu ? this.searchDrinks(query) : [];

    return {
      ...businessResults,
      menuItems: menuResults,
      drinks: drinkResults
    };
  }

  searchMenuItems(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    this.allBusinesses.forEach(business => {
      if (!business.menu || business.menu.length === 0) return;

      business.menu.forEach(item => {
        let matchScore = 0;

        // Name match
        if (item.name.toLowerCase().includes(lowerQuery)) {
          matchScore += 10;
        }

        // Description match
        if (item.description?.toLowerCase().includes(lowerQuery)) {
          matchScore += 5;
        }

        // Category match
        if (item.category?.toLowerCase().includes(lowerQuery)) {
          matchScore += 3;
        }

        if (matchScore > 0) {
          results.push({
            ...item,
            businessId: business.id,
            businessName: business.name,
            businessLocation: business.location,
            businessImage: (business.images && business.images[0]) || business.image,
            matchScore,
            type: 'menu-item'
          });
        }
      });
    });

    // Sort by match score
    results.sort((a, b) => b.matchScore - a.matchScore);
    return results; // Return all results for pagination
  }

  searchDrinks(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    this.allBusinesses.forEach(business => {
      if (!business.drinks || business.drinks.length === 0) return;

      business.drinks.forEach(item => {
        let matchScore = 0;

        // Name match
        if (item.name.toLowerCase().includes(lowerQuery)) {
          matchScore += 10;
        }

        // Description match
        if (item.description?.toLowerCase().includes(lowerQuery)) {
          matchScore += 5;
        }

        // Category match
        if (item.category?.toLowerCase().includes(lowerQuery)) {
          matchScore += 3;
        }

        if (matchScore > 0) {
          results.push({
            ...item,
            businessId: business.id,
            businessName: business.name,
            businessLocation: business.location,
            businessImage: (business.images && business.images[0]) || business.image,
            matchScore,
            type: 'drink'
          });
        }
      });
    });

    // Sort by match score
    results.sort((a, b) => b.matchScore - a.matchScore);
    return results; // Return all results for pagination
  }

  searchBusinesses(query) {
    const lowerQuery = query.toLowerCase();
    const results = {
      businesses: [],
      categories: new Set(),
      locations: new Set(),
      tags: new Set()
    };

    this.allBusinesses.forEach(business => {
      let matchScore = 0;
      let matchType = null;

      // Name match (highest priority)
      if (business.name.toLowerCase().includes(lowerQuery)) {
        matchScore += 10;
        matchType = 'name';
      }

      // Cuisine match
      if (business.cuisine?.toLowerCase().includes(lowerQuery)) {
        matchScore += 8;
        matchType = matchType || 'cuisine';
      }

      // Category match
      if (business.category?.toLowerCase().includes(lowerQuery)) {
        matchScore += 6;
        matchType = matchType || 'category';
        results.categories.add(business.category);
      }

      // Location match
      if (business.location?.toLowerCase().includes(lowerQuery)) {
        matchScore += 7;
        matchType = matchType || 'location';
        results.locations.add(business.location);
      }

      // Tags match
      if (business.tags) {
        business.tags.forEach(tag => {
          if (tag.toLowerCase().includes(lowerQuery)) {
            matchScore += 5;
            matchType = matchType || 'tag';
            results.tags.add(tag);
          }
        });
      }

      // Description match
      if (business.description?.toLowerCase().includes(lowerQuery)) {
        matchScore += 3;
        matchType = matchType || 'description';
      }

      if (matchScore > 0) {
        results.businesses.push({
          ...business,
          matchScore,
          matchType
        });
      }
    });

    // Sort by match score
    results.businesses.sort((a, b) => b.matchScore - a.matchScore);

    // Limit results
    results.businesses = results.businesses.slice(0, 6);

    return results;
  }

  displayResults(results) {
    if (!this.suggestionsContainer) return;

    let html = '';

    // Calculate pagination for menu items and drinks
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    // Combine menu items and drinks for pagination
    const allItems = [
      ...(results.menuItems || []).map(item => ({ ...item, itemType: 'menu' })),
      ...(results.drinks || []).map(item => ({ ...item, itemType: 'drink' }))
    ];

    const paginatedItems = allItems.slice(startIndex, endIndex);
    const totalPages = Math.ceil(allItems.length / this.itemsPerPage);

    // Group paginated items by type
    const menuItems = paginatedItems.filter(item => item.itemType === 'menu');
    const drinkItems = paginatedItems.filter(item => item.itemType === 'drink');

    // Menu Items
    if (menuItems.length > 0) {
      html += `
        <div class="suggestions-section">
          <div class="suggestions-header">Menu Items</div>
          ${menuItems.map(item => this.createMenuItemSuggestion(item)).join('')}
        </div>
      `;
    }

    // Drinks
    if (drinkItems.length > 0) {
      html += `
        <div class="suggestions-section">
          <div class="suggestions-header">Drinks</div>
          ${drinkItems.map(item => this.createDrinkSuggestion(item)).join('')}
        </div>
      `;
    }

    // Businesses
    if (results.businesses && results.businesses.length > 0) {
      html += `
        <div class="suggestions-section">
          <div class="suggestions-header">Businesses</div>
          ${results.businesses.map(business => this.createBusinessSuggestion(business)).join('')}
        </div>
      `;
    }

    // Categories
    if (results.categories && results.categories.size > 0) {
      html += `
        <div class="suggestions-section">
          <div class="suggestions-header">Categories</div>
          ${Array.from(results.categories).slice(0, 3).map(cat => this.createCategorySuggestion(cat)).join('')}
        </div>
      `;
    }

    // Locations
    if (results.locations && results.locations.size > 0) {
      html += `
        <div class="suggestions-section">
          <div class="suggestions-header">Locations</div>
          ${Array.from(results.locations).map(loc => this.createLocationSuggestion(loc)).join('')}
        </div>
      `;
    }

    // Tags
    if (results.tags && results.tags.size > 0) {
      html += `
        <div class="suggestions-section">
          <div class="suggestions-header">Features</div>
          ${Array.from(results.tags).slice(0, 4).map(tag => this.createTagSuggestion(tag)).join('')}
        </div>
      `;
    }

    // Pagination controls
    if (allItems.length > 0 && totalPages > 1) {
      html += `
        <div class="search-pagination">
          <button
            class="pagination-btn"
            id="prev-page"
            ${this.currentPage === 1 ? 'disabled' : ''}
          >
            ← Previous
          </button>
          <div class="pagination-info">
            Page ${this.currentPage} of ${totalPages}
            <span class="pagination-count">(${allItems.length} results)</span>
          </div>
          <button
            class="pagination-btn"
            id="next-page"
            ${this.currentPage === totalPages ? 'disabled' : ''}
          >
            Next →
          </button>
        </div>
      `;
    }

    // View all results link (only show if there are businesses too)
    const hasBusinesses = results.businesses && results.businesses.length > 0;
    if (hasBusinesses) {
      html += `
        <a href="search-results.html?q=${encodeURIComponent(this.currentQuery)}" class="view-all-results">
          View all results for "${this.currentQuery}"
        </a>
      `;
    }

    // Empty state
    if (html === '') {
      html = `
        <div class="search-empty-state">
          <div class="search-empty-icon">🔍</div>
          <div class="search-empty-title">No results found</div>
          <div class="search-empty-description">Try searching for something else</div>
        </div>
      `;
    }

    this.suggestionsContainer.innerHTML = html;
    this.suggestionsContainer.classList.add('active');
    this.currentHighlightIndex = -1;

    // Attach click handlers
    this.attachSuggestionHandlers();
    this.attachPaginationHandlers();
  }

  attachPaginationHandlers() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.displayResults(this.allResults);
          // Scroll to top of suggestions
          this.suggestionsContainer.scrollTop = 0;
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const allItems = [
          ...(this.allResults.menuItems || []),
          ...(this.allResults.drinks || [])
        ];
        const totalPages = Math.ceil(allItems.length / this.itemsPerPage);

        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.displayResults(this.allResults);
          // Scroll to top of suggestions
          this.suggestionsContainer.scrollTop = 0;
        }
      });
    }
  }

  createMenuItemSuggestion(item) {
    return `
      <button class="suggestion-item" data-menu-item='${JSON.stringify(item).replace(/'/g, "&apos;")}'>
        <div class="suggestion-icon menu-item">🍽️</div>
        <div class="suggestion-content">
          <div class="suggestion-name">${this.highlightMatch(item.name)}</div>
          <div class="suggestion-meta">${item.businessName} • ${item.price}</div>
        </div>
        <div class="suggestion-badge">${item.category}</div>
      </button>
    `;
  }

  createDrinkSuggestion(item) {
    return `
      <button class="suggestion-item" data-drink-item='${JSON.stringify(item).replace(/'/g, "&apos;")}'>
        <div class="suggestion-icon drink-item">🍹</div>
        <div class="suggestion-content">
          <div class="suggestion-name">${this.highlightMatch(item.name)}</div>
          <div class="suggestion-meta">${item.businessName} • ${item.price}</div>
        </div>
        <div class="suggestion-badge">${item.category}</div>
      </button>
    `;
  }

  createBusinessSuggestion(business) {
    const icon = this.getCategoryIcon(business.category);
    return `
      <button class="suggestion-item" data-business-id="${business.id}">
        <div class="suggestion-icon business">${icon}</div>
        <div class="suggestion-content">
          <div class="suggestion-name">${this.highlightMatch(business.name)}</div>
          <div class="suggestion-meta">${business.cuisine || business.category} • ${business.location}</div>
        </div>
        ${business.rating ? `<div class="suggestion-badge">⭐ ${business.rating}</div>` : ''}
      </button>
    `;
  }

  createCategorySuggestion(category) {
    const icon = this.getCategoryIcon(category);
    return `
      <button class="suggestion-item" data-category="${category}">
        <div class="suggestion-icon category">${icon}</div>
        <div class="suggestion-content">
          <div class="suggestion-name">${this.highlightMatch(category)}</div>
          <div class="suggestion-meta">Browse all ${category}</div>
        </div>
      </button>
    `;
  }

  createLocationSuggestion(location) {
    return `
      <button class="suggestion-item" data-location="${location}">
        <div class="suggestion-icon location">📍</div>
        <div class="suggestion-content">
          <div class="suggestion-name">${this.highlightMatch(location)}</div>
          <div class="suggestion-meta">View businesses in ${location}</div>
        </div>
      </button>
    `;
  }

  createTagSuggestion(tag) {
    return `
      <button class="suggestion-item" data-tag="${tag}">
        <div class="suggestion-icon tag">🏷️</div>
        <div class="suggestion-content">
          <div class="suggestion-name">${this.highlightMatch(tag)}</div>
          <div class="suggestion-meta">Filter by ${tag}</div>
        </div>
      </button>
    `;
  }

  getCategoryIcon(category) {
    const icons = {
      restaurants: '🍽️',
      activities: '🏄',
      'coffee-sweets': '☕',
      shopping: '🛍️',
      entertainment: '🎭',
      bars: '🍺',
      hotels: '🏨'
    };
    return icons[category] || '📍';
  }

  highlightMatch(text) {
    if (!this.currentQuery) return text;

    const regex = new RegExp(`(${this.currentQuery})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  }

  attachSuggestionHandlers() {
    const suggestions = this.suggestionsContainer?.querySelectorAll('.suggestion-item');

    suggestions?.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();

        const businessId = item.dataset.businessId;
        const category = item.dataset.category;
        const location = item.dataset.location;
        const tag = item.dataset.tag;
        const menuItemData = item.dataset.menuItem;
        const drinkItemData = item.dataset.drinkItem;

        if (menuItemData) {
          // Menu item clicked - go to menu items results page
          try {
            const menuItem = JSON.parse(menuItemData);
            this.saveRecentSearch(this.currentQuery);
            window.location.href = `menu-search.html?q=${encodeURIComponent(this.currentQuery)}&type=menu`;
          } catch (error) {
            console.error('Error parsing menu item data:', error);
          }
        } else if (drinkItemData) {
          // Drink clicked - go to drinks results page
          try {
            const drink = JSON.parse(drinkItemData);
            this.saveRecentSearch(this.currentQuery);
            window.location.href = `menu-search.html?q=${encodeURIComponent(this.currentQuery)}&type=drinks`;
          } catch (error) {
            console.error('Error parsing drink data:', error);
          }
        } else if (businessId) {
          this.saveRecentSearch(this.currentQuery);
          window.location.href = `profile.html?id=${businessId}`;
        } else if (category) {
          this.saveRecentSearch(category);
          window.location.href = `${category}.html`;
        } else if (location || tag) {
          this.saveRecentSearch(location || tag);
          this.goToSearchResults(location || tag);
        }
      });
    });
  }

  showRecentSearches() {
    if (this.recentSearches.length === 0) {
      this.suggestionsContainer.innerHTML = `
        <div class="search-empty-state">
          <div class="search-empty-icon">🔍</div>
          <div class="search-empty-title">Start searching</div>
          <div class="search-empty-description">Try "seafood", "Orange Beach", or "happy hour"</div>
        </div>
      `;
      this.suggestionsContainer.classList.add('active');
      return;
    }

    const html = `
      <div class="suggestions-section">
        <div class="suggestions-header">Recent Searches</div>
        ${this.recentSearches.map((search, index) => `
          <div class="recent-search-item" data-search="${search}">
            <svg class="recent-search-icon" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
            </svg>
            <div class="recent-search-text">${search}</div>
            <button class="recent-search-delete" data-index="${index}" aria-label="Delete">
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
        `).join('')}
      </div>
    `;

    this.suggestionsContainer.innerHTML = html;
    this.suggestionsContainer.classList.add('active');

    // Attach handlers
    const items = this.suggestionsContainer.querySelectorAll('.recent-search-item');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.recent-search-delete')) return;

        const search = item.dataset.search;
        this.searchInput.value = search;
        this.currentQuery = search;
        this.performSearch();
      });
    });

    // Delete buttons
    const deleteButtons = this.suggestionsContainer.querySelectorAll('.recent-search-delete');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        this.deleteRecentSearch(index);
        this.showRecentSearches();
      });
    });
  }

  clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
      this.currentQuery = '';
      this.showRecentSearches();
      this.searchInput.focus();
    }
  }

  closeSuggestions() {
    this.suggestionsContainer?.classList.remove('active');
    this.overlay?.classList.remove('active');
    this.currentHighlightIndex = -1;
  }

  goToSearchResults(query = null) {
    const searchQuery = query || this.currentQuery;
    if (searchQuery) {
      this.saveRecentSearch(searchQuery);
      window.location.href = `search-results.html?q=${encodeURIComponent(searchQuery)}`;
    }
  }

  startVoiceSearch() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search is not supported in your browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    const voiceBtn = document.querySelector('.search-voice-btn');
    if (voiceBtn) {
      voiceBtn.style.color = '#EF4444';
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (this.searchInput) {
        this.searchInput.value = transcript;
        this.currentQuery = transcript;
        this.performSearch();
      }
    };

    recognition.onend = () => {
      if (voiceBtn) {
        voiceBtn.style.color = '#4A90E2';
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (voiceBtn) {
        voiceBtn.style.color = '#4A90E2';
      }
    };
  }

  // Recent searches management
  loadRecentSearches() {
    try {
      const saved = localStorage.getItem('gcr_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveRecentSearch(query) {
    if (!query) return;

    // Remove if already exists
    this.recentSearches = this.recentSearches.filter(s => s.toLowerCase() !== query.toLowerCase());

    // Add to beginning
    this.recentSearches.unshift(query);

    // Keep only last 10
    this.recentSearches = this.recentSearches.slice(0, 10);

    // Save to localStorage
    try {
      localStorage.setItem('gcr_recent_searches', JSON.stringify(this.recentSearches));
    } catch (e) {
      console.error('Failed to save recent searches:', e);
    }
  }

  deleteRecentSearch(index) {
    this.recentSearches.splice(index, 1);
    try {
      localStorage.setItem('gcr_recent_searches', JSON.stringify(this.recentSearches));
    } catch (e) {
      console.error('Failed to delete recent search:', e);
    }
  }
}

// Initialize search when script loads
const globalSearch = new GlobalSearch();
