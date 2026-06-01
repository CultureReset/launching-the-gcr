/**
 * GCR Master Data Loader
 * Fetches live data from gcr-api-clean and maps it to the shape
 * all pages in this app expect (allBusinesses, businessesById, etc.)
 */

const GCR_API = 'https://gcr-api-clean.vercel.app';

let masterData = null;
let allBusinesses = [];
let businessesById = {};

// Map API entity → launching-gcr business shape
function mapEntity(e) {
  const tags = (e.tags || []).map(t => typeof t === 'string' ? t : (t.tag_name || '')).filter(Boolean);
  const photos = (e.photos || []).map(p => p.url || p.image_url).filter(Boolean);
  const address = [e.address_line_1, e.city, e.state].filter(Boolean).join(', ');

  return {
    // Identity
    id:           e.slug,
    slug:         e.slug,
    name:         e.name,

    // Category fields launching-gcr uses for filtering
    category:     e.entity_type   || '',
    cuisine:      e.entity_subtype ? e.entity_subtype.replace(/_/g, ' ') : '',
    subtype:      e.entity_subtype || '',

    // Display
    description:  e.description   || '',
    subtitle:     e.subtitle       || '',
    icon:         e.icon           || '📍',
    tags,

    // Location
    location:     [e.city, e.state].filter(Boolean).join(', '),
    address:      address,
    address_line_1: e.address_line_1 || '',
    city:         e.city           || '',
    state:        e.state          || '',
    latitude:     e.latitude       || null,
    longitude:    e.longitude      || null,

    // Contact / links
    phone:        e.phone          || '',
    website:      e.website_url    || '',
    booking_url:  e.booking_url    || '',
    reservation:  e.reservation_url || '',   // profile.js uses 'reservation'
    reservation_url: e.reservation_url || '',
    togoUrl:      e.order_url      || '',    // profile.js uses 'togoUrl'
    orderOnlineUrl: e.order_url    || '',
    order_url:    e.order_url      || '',
    directions_url: e.directions_url || '',
    menu_url:     e.menu_url       || '',
    // Social — profile.js uses short names
    facebook:     e.social_facebook  || '',
    instagram:    e.social_instagram || '',
    tiktok:       e.social_tiktok    || '',
    social_instagram: e.social_instagram || '',
    social_facebook:  e.social_facebook  || '',
    social_tiktok:    e.social_tiktok    || '',

    // Media
    image:        e.hero_image_url || photos[0] || '',
    images:       photos,
    hero_image_url: e.hero_image_url || '',

    // Ratings / price
    rating:       e.rating         || null,
    review_count: e.review_count   || 0,
    price_range:  e.price_range    || '',
    priceLevel:   e.price_range    || '',    // profile.js uses 'priceLevel'
    price_from:   e.price_from     || null,
    price_unit:   e.price_unit     || '',

    // Activity fields
    duration_text: e.duration_text || '',
    known_for:    e.known_for      || [],
    highlights:   e.highlights     || [],
    good_for:     e.good_for       || [],
    what_makes_it_different: e.what_makes_it_different || '',
    secondary_subtypes: e.secondary_subtypes || [],
    seo_keywords: e.seo_keywords   || [],

    // Booleans
    featured:     e.featured       || false,
    live_music:   e.live_music     || false,
    outdoor_seating: e.outdoor_seating || false,
    good_for_kids:   e.good_for_kids   || false,
    good_for_groups: e.good_for_groups || false,
    serves_breakfast: e.serves_breakfast || false,
    serves_lunch:     e.serves_lunch     || false,
    serves_dinner:    e.serves_dinner    || false,
    takeout:      e.takeout        || false,
    delivery:     e.delivery       || false,
    dine_in:      e.dine_in        || false,

    // Happy hour
    hh_days:      e.hh_days        || '',
    hh_start:     e.hh_start       || '',
    hh_end:       e.hh_end         || '',
    hh_description: e.hh_description || '',

    // Hours & hours-related data
    hours:        e.hours          || [],

    // Menu (sections + items — loaded on detail page via separate API call)
    menu:         (e.menu_sections || []).flatMap(sec =>
      (sec.items || []).map(item => ({
        name:        item.item_name || item.name || '',
        description: item.description || '',
        price:       item.price != null ? `$${item.price}` : '',
        category:    sec.section_name || '',
      }))
    ),
    menu_sections: e.menu_sections || [],
    drink_sections: e.drink_sections || [],
  };
}

async function loadMasterData() {
  if (masterData) return masterData;

  try {
    const res = await fetch(`${GCR_API}/api/gcr/entities?limit=500`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    const entities = data.entities || [];

    allBusinesses = entities.map(mapEntity);
    window.allBusinesses = allBusinesses;

    // Lookup by slug/id
    businessesById = {};
    allBusinesses.forEach(b => {
      businessesById[b.id]   = b;
      businessesById[b.slug] = b;
    });

    masterData = { businesses: allBusinesses };
    console.log(`✅ Loaded ${allBusinesses.length} businesses from GCR API`);

    // Notify all pages that data is ready
    window.dispatchEvent(new CustomEvent('allBusinessesUpdated', { detail: { businesses: allBusinesses } }));

    return masterData;
  } catch (err) {
    console.error('Failed to load from GCR API:', err);
    allBusinesses = [];
    businessesById = {};
    masterData = { businesses: [] };
    return masterData;
  }
}

function getBusinessById(id) {
  return businessesById[id] || null;
}

function getBusinessesByCategory(category) {
  return allBusinesses.filter(b => b.category === category);
}

function getBusinessesWithHappyHours() {
  return allBusinesses.filter(b => b.hh_days);
}

function getBusinessesWithSpecials() {
  return allBusinesses.filter(b => b.specials?.length > 0);
}

function getAllCategories() {
  const cats = new Set();
  allBusinesses.forEach(b => { if (b.category) cats.add(b.category); });
  return Array.from(cats).sort();
}

// Auto-load on script load
loadMasterData().catch(err => console.error('Failed to auto-load:', err));
