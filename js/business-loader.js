// Gulf Coast Radar - Business Profile Loader
// Automatically loads all business profiles from /data/businesses/ folder
// This allows you to add/update businesses without modifying code

class BusinessProfileLoader {
  constructor() {
    this.businesses = [];
    this.loaded = false;
    this.loadPromise = null;
  }

  // Load all business profiles from the businesses folder
  async loadAllProfiles() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadProfiles();
    return this.loadPromise;
  }

  async _loadProfiles() {
    try {
      // First, try to load the businesses directory index
      // This file lists all available business profile files
      const indexResponse = await fetch('/data/businesses/index.json');

      if (!indexResponse.ok) {
        console.warn('No business index found, using hardcoded list');
        // Fallback: load known business files
        await this.loadKnownBusinesses();
        return this.businesses;
      }

      const index = await indexResponse.json();
      console.log(`Loading ${index.files.length} business profiles...`);

      // Load all business profile files in parallel
      const loadPromises = index.files.map(filename =>
        this.loadBusinessFile(filename)
      );

      await Promise.all(loadPromises);

      this.loaded = true;
      console.log(`✅ Loaded ${this.businesses.length} business profiles`);

      // Dispatch event so other components know businesses are loaded
      window.dispatchEvent(new CustomEvent('businessesLoaded', {
        detail: { businesses: this.businesses }
      }));

      return this.businesses;

    } catch (error) {
      console.error('Error loading business profiles:', error);
      // Fallback to hardcoded businesses if loading fails
      await this.loadKnownBusinesses();
      return this.businesses;
    }
  }

  // Load a single business profile file
  async loadBusinessFile(filename) {
    try {
      const response = await fetch(`/data/businesses/${filename}`);
      if (!response.ok) {
        console.warn(`Failed to load ${filename}`);
        return null;
      }

      const business = await response.json();

      // Validate required fields
      if (!business.id || !business.name || !business.category) {
        console.warn(`Invalid business profile in ${filename} - missing required fields`);
        return null;
      }

      this.businesses.push(business);
      return business;

    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      return null;
    }
  }

  // Fallback: Load known businesses from hardcoded list
  async loadKnownBusinesses() {
    const knownFiles = [
      'the-hangout.json',
      'the-gulf.json',
      'cobalt-restaurant.json',
      'gts-on-the-bay.json',
      'tacky-jacks.json',
      'ginny-lane.json',
      'bahama-bobs.json',
      'sea-n-suds.json',
      'original-oyster-house.json',
      'lulus.json',
      'pink-pony-pub.json',
      'flora-bama.json'
    ];

    const loadPromises = knownFiles.map(filename =>
      this.loadBusinessFile(filename).catch(() => null)
    );

    await Promise.all(loadPromises);
  }

  // Get all businesses
  getBusinesses() {
    return this.businesses;
  }

  // Get businesses by category
  getByCategory(category) {
    return this.businesses.filter(b => b.category === category);
  }

  // Get business by ID
  getById(id) {
    return this.businesses.find(b => b.id === id);
  }

  // Get businesses by location
  getByLocation(location) {
    return this.businesses.filter(b =>
      b.location && b.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  // Search businesses by name, cuisine, tags, etc.
  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.businesses.filter(b => {
      // Search in name
      if (b.name.toLowerCase().includes(lowerQuery)) return true;

      // Search in cuisine
      if (b.cuisine && b.cuisine.toLowerCase().includes(lowerQuery)) return true;

      // Search in tags
      if (b.tags && b.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;

      // Search in description
      if (b.description && b.description.toLowerCase().includes(lowerQuery)) return true;

      return false;
    });
  }

  // Get businesses with specific tags
  getByTags(tags) {
    const searchTags = Array.isArray(tags) ? tags : [tags];
    return this.businesses.filter(b =>
      b.tags && searchTags.some(tag =>
        b.tags.some(bTag => bTag.toLowerCase().includes(tag.toLowerCase()))
      )
    );
  }

  // Get restaurants only
  getRestaurants() {
    return this.getByCategory('restaurants');
  }

  // Get services only
  getServices() {
    return this.getByCategory('services');
  }

  // Get attractions only
  getAttractions() {
    return this.getByCategory('attractions');
  }

  // Get all categories
  getCategories() {
    const categories = new Set(this.businesses.map(b => b.category));
    return Array.from(categories);
  }

  // Get all unique tags
  getAllTags() {
    const tags = new Set();
    this.businesses.forEach(b => {
      if (b.tags) {
        b.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }
}

// Create global instance
window.businessLoader = new BusinessProfileLoader();

// Auto-load on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.businessLoader.loadAllProfiles();
  });
} else {
  window.businessLoader.loadAllProfiles();
}

// For backward compatibility, create businessData array
// This will be populated after businesses are loaded
window.businessData = [];

window.addEventListener('businessesLoaded', (event) => {
  window.businessData = event.detail.businesses;
  console.log('businessData array updated with', window.businessData.length, 'businesses');
});
