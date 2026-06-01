// Things To Do Page — Activity businesses (dolphin cruises, boat rentals, fishing, etc.)

const ACTIVITY_SUBTYPES = new Set([
  'dolphin_cruise', 'boat_rental', 'boat_tour', 'fishing_charter',
  'parasailing', 'jet_ski', 'watersports', 'snorkeling',
  'kayak_rental', 'paddleboard', 'tour', 'attraction',
  'golf_course', 'marina', 'activity', 'things_to_do',
]);

let allActivities = [];
let filteredActivities = [];
let selectedSubtype = 'all';
let sortBy = 'name';

function getActivities() {
  return (window.allBusinesses || []).filter(b => {
    const subtype = (b.subtype || b.cuisine || '').toLowerCase().replace(/[\s-]+/g, '_');
    const category = (b.category || '').toLowerCase();
    return ACTIVITY_SUBTYPES.has(subtype) || category === 'activity';
  });
}

async function initializeThingsToDoPage() {
  await loadMasterData();
  allActivities = getActivities();
  filteredActivities = [...allActivities];

  sortActivities();
  renderActivities();
  updateResultsTitle();
}

function sortActivities() {
  filteredActivities.sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'distance') return (a.distanceValue || 999) - (b.distanceValue || 999);
    if (sortBy === 'price') return (a.price_from || 0) - (b.price_from || 0);
    return a.name.localeCompare(b.name);
  });
}

function renderActivities() {
  const grid = document.getElementById('activities-grid');
  if (!grid) return;

  if (filteredActivities.length === 0) {
    grid.innerHTML = `
      <div class="no-results" style="text-align:center; padding: 60px 20px; color: #6B7280;">
        <div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
        <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">No activities found</h3>
        <p>Try a different filter or check back soon.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filteredActivities.map(activity => `
    <div class="business-card" data-business-id="${activity.id}" onclick="window.location.href='profile.html?id=${activity.id}'">
      <div class="business-card-header">
        <h3 class="business-name">${activity.name}</h3>
        <span class="business-category">${activity.cuisine || activity.subtype || ''}</span>
      </div>

      ${(activity.images?.[0] || activity.image) ? `
        <div class="business-image">
          <img src="${activity.images?.[0] || activity.image}" alt="${activity.name}" onerror="this.style.display='none'">
        </div>` : ''}

      <div class="business-info">
        <div class="business-info-item">📍 ${activity.location || ''}</div>
        ${activity.distanceText ? `<div class="business-info-item">🚗 ${activity.distanceText} away</div>` : ''}
        ${activity.duration_text ? `<div class="business-info-item">⏱ ${activity.duration_text}</div>` : ''}
        ${activity.price_from != null ? `<div class="business-info-item">💵 From $${activity.price_from}${activity.price_unit ? ' / ' + activity.price_unit : ''}</div>` : activity.price_range ? `<div class="business-info-item">💵 ${activity.price_range}</div>` : ''}
      </div>

      <p class="business-description">${activity.description || ''}</p>

      ${activity.tags?.length > 0 ? `
        <div class="tag-chips">
          ${activity.tags.slice(0, 4).map(tag => `<span class="tag-chip">${tag}</span>`).join('')}
        </div>` : ''}

      <div class="business-actions">
        <button class="btn btn-primary btn-large" onclick="event.stopPropagation(); window.location.href='profile.html?id=${activity.id}'">View Details</button>
        ${activity.booking_url ? `<a href="${activity.booking_url}" target="_blank" class="btn btn-secondary" onclick="event.stopPropagation()">📅 Book Now</a>` : ''}
        ${activity.phone ? `<a href="tel:${activity.phone}" class="btn btn-secondary" onclick="event.stopPropagation()">📞 Call</a>` : ''}
        ${activity.address ? `<button class="btn btn-secondary" onclick="event.stopPropagation(); openMaps('${activity.address.replace(/'/g, "\\'")}')">🗺️ Directions</button>` : ''}
      </div>
    </div>
  `).join('');
}

function updateResultsTitle() {
  const title = document.getElementById('results-title');
  if (!title) return;
  const label = selectedSubtype === 'all' ? 'Things To Do' :
    document.querySelector(`.cuisine-filter-chip[data-subtype="${selectedSubtype}"]`)?.textContent?.trim() || 'Activities';
  title.textContent = `${label} (${filteredActivities.length})`;
}

function openMaps(address) {
  const encoded = encodeURIComponent(address);
  if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
    window.location.href = `maps://maps.apple.com/?q=${encoded}`;
  } else {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initializeThingsToDoPage();

  // Subtype filter chips
  document.querySelectorAll('.cuisine-filter-chip[data-subtype]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.cuisine-filter-chip[data-subtype]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedSubtype = chip.getAttribute('data-subtype');

      filteredActivities = selectedSubtype === 'all'
        ? [...allActivities]
        : allActivities.filter(a => {
            const subtype = (a.subtype || a.cuisine || '').toLowerCase().replace(/[\s-]+/g, '_');
            return subtype === selectedSubtype;
          });

      sortActivities();
      renderActivities();
      updateResultsTitle();
    });
  });

  // Sort
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      sortBy = e.target.value;
      sortActivities();
      renderActivities();
    });
  }
});

window.addEventListener('allBusinessesUpdated', () => {
  allActivities = getActivities();
  filteredActivities = [...allActivities];
  sortActivities();
  renderActivities();
  updateResultsTitle();
});
