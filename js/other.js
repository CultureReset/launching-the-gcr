// Other Category Page JavaScript
let allItems = [];
let filteredItems = [];
let currentSort = 'distance';
let selectedFilter = 'all';

// Define categories to INCLUDE in "Other" - Outdoor/Activity focused
const otherCategories = [
  'watersports', 'water sports', 'activities', 'outdoors', 'outdoor',
  'kayak', 'paddleboard', 'jetski', 'fishing', 'boat', 'charter',
  'adventure', 'tour', 'excursion', 'recreation'
];

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Other category page loading...');

  // Check if data is loaded
  if (typeof allBusinesses === 'undefined' || !allBusinesses || allBusinesses.length === 0) {
    console.error('❌ No business data available!');
    document.getElementById('businesses-grid').innerHTML = `
      <div class="no-results">
        <h3>Error Loading Data</h3>
        <p>Please refresh the page or contact support.</p>
      </div>
    `;
    return;
  }

  // Get businesses IN "Other" categories
  // Exclude restaurants, coffee, and sweets (they have their own pages)
  allItems = allBusinesses.filter(b => {
    const cat = (b.category || '').toLowerCase();

    // Exclude restaurants, coffee, and sweets
    if (cat === 'restaurants' || cat === 'coffee' || cat === 'sweets') return false;

    const tags = (b.tags || []).map(t => t.toLowerCase());
    return otherCategories.some(oc => cat.includes(oc) || tags.some(tag => tag.includes(oc)));
  });

  filteredItems = [...allItems];
  console.log('✅ Found "other" businesses:', allItems.length);

  // Display immediately without distances
  displayBusinesses(filteredItems);
  updateResultsTitle();

  // Calculate distances in background
  try {
    console.log('Calculating distances...');
    allItems = await calculateDistancesForBusinesses(allItems);
    allItems = sortByDistance(allItems);
    filteredItems = [...allItems];
    console.log('Distances calculated, refreshing display');
    displayBusinesses(filteredItems);
  } catch (error) {
    console.error('Error calculating distances:', error);
  }

  setupEventListeners();
});

function setupEventListeners() {
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', handleSort);
  }

  const chips = document.querySelectorAll('.cuisine-filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedFilter = chip.getAttribute('data-filter');
      applyFilters();
    });
  });
}

function applyFilters() {
  if (selectedFilter === 'all') {
    filteredItems = [...allItems];
  } else {
    filteredItems = allItems.filter(b => {
      const cat = (b.category || '').toLowerCase();
      const subcat = (b.subcategory || '').toLowerCase();
      const tags = (b.tags || []).map(t => t.toLowerCase());
      const filter = selectedFilter.toLowerCase();

      return cat.includes(filter) || subcat.includes(filter) || tags.some(tag => tag.includes(filter));
    });
  }

  applySorting(currentSort);
  displayBusinesses(filteredItems);
  updateResultsTitle();
}

function handleSort(e) {
  currentSort = e.target.value;
  applySorting(currentSort);
  displayBusinesses(filteredItems);
}

function applySorting(sortBy) {
  filteredItems.sort((a, b) => {
    switch(sortBy) {
      case 'distance':
        if (a.distance === null || a.distance === undefined) return 1;
        if (b.distance === null || b.distance === undefined) return -1;
        return a.distance - b.distance;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
}

function displayBusinesses(businesses) {
  const grid = document.getElementById('businesses-grid');

  if (businesses.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <h3>No businesses found in this category</h3>
        <p>Check back soon for updates!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = businesses.map(business => `
    <div class="business-card" data-business-id="${business.id}" onclick="window.location.href='profile.html?id=${business.id}'">
      <div class="business-card-header-centered">
        <h3 class="business-name">${business.name}</h3>
        ${business.category ? `<span class="business-category">${business.category}</span>` : ''}
        ${business.subcategory ? `<div class="business-cuisine">${business.subcategory}</div>` : ''}
      </div>

      ${((business.images && business.images[0]) || business.image) ? `
        <div class="business-card-image-centered">
          <img src="${(business.images && business.images[0]) || business.image}" alt="${business.name}" onerror="this.style.display='none'">
        </div>
      ` : ''}

      <div class="business-card-details">
        <div class="business-info">
          <div class="business-info-item">📍 ${business.location}</div>
          ${business.distanceText ? `<div class="business-info-item">🚗 ${business.distanceText} away</div>` : ''}
        </div>

        <p class="business-description">${business.description || ''}</p>

        ${business.tags && business.tags.length > 0 ? `
          <div class="business-tags">
            ${business.tags.slice(0, 3).map(tag => `<span class="tag-chip">${tag}</span>`).join('')}
          </div>
        ` : ''}

        <div class="business-actions">
          <button class="btn btn-primary btn-large" onclick="event.stopPropagation(); window.location.href='profile.html?id=${business.id}'">View Profile</button>
          ${business.phone ? `<a href="tel:${business.phone}" class="btn btn-secondary" onclick="event.stopPropagation()">📞 Call Now</a>` : ''}
          ${business.address ? `<button class="btn btn-secondary" onclick="event.stopPropagation(); openMaps('${business.address.replace(/'/g, "\\'")}')">🗺️ Directions</button>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function updateResultsTitle() {
  const count = filteredItems.length;
  let title = selectedFilter === 'all' ? 'All Other' : selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1);
  document.getElementById('results-title').textContent = `${title} (${count})`;
}

// Platform-aware maps function
function openMaps(address) {
  const encodedAddress = encodeURIComponent(address);
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Detect iOS
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    window.location.href = `maps://maps.apple.com/?q=${encodedAddress}`;
  }
  // Detect Android
  else if (/android/i.test(userAgent)) {
    window.location.href = `geo:0,0?q=${encodedAddress}`;
  }
  // Desktop or other - use Google Maps web
  else {
    window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
  }
}

// Go back function
function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = 'index.html';
  }
}
