// Calendar Modal JavaScript

let currentCalendarDate = new Date();
let selectedDate = null;

window.openCalendarModal = function(businessId = null) {
  const modal = document.getElementById('calendar-modal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Store which business this calendar is for (null = master calendar)
  modal.dataset.businessId = businessId || '';

  // Reset to current month and select today
  currentCalendarDate = new Date();
  const today = new Date().toISOString().split('T')[0];
  selectedDate = today;

  renderCalendar();
};

window.closeCalendarModal = function() {
  const modal = document.getElementById('calendar-modal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
};

window.previousMonth = function() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  renderCalendar();
};

window.nextMonth = function() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  renderCalendar();
};

window.selectDate = function(dateString) {
  selectedDate = dateString;
  renderCalendar();
};

function renderCalendar() {
  const modal = document.getElementById('calendar-modal');
  const businessId = modal.dataset.businessId;

  const monthYear = currentCalendarDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  document.getElementById('calendar-month-year').textContent = monthYear;

  // Render calendar grid
  renderCalendarGrid();

  // Always ensure we have a selected date (default to today)
  if (!selectedDate) {
    selectedDate = new Date().toISOString().split('T')[0];
  }

  // Render events for selected date
  renderEventsForDate(selectedDate, businessId);
}

function renderCalendarGrid() {
  const grid = document.getElementById('calendar-grid');

  if (!grid) {
    console.error('Calendar grid element not found!');
    return;
  }

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const today = new Date().toISOString().split('T')[0];

  let html = '';

  // Add day headers
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayHeaders.forEach(day => {
    html += `<div class="calendar-day-header">${day}</div>`;
  });

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    const prevMonthDate = new Date(year, month, 0 - (startingDayOfWeek - i - 1));
    const dateString = prevMonthDate.toISOString().split('T')[0];
    html += `
      <div class="calendar-day other-month" onclick="selectDate('${dateString}')">
        <div class="calendar-day-number">${prevMonthDate.getDate()}</div>
      </div>
    `;
  }

  // Add all days in the current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateString === today;
    const isSelected = dateString === selectedDate;

    const events = getEventsByDate(dateString);
    const eventDots = events.length > 0 ? `
      <div class="calendar-day-dots">
        ${events.slice(0, 3).map(() => '<div class="calendar-day-dot"></div>').join('')}
      </div>
    ` : '';

    const classes = ['calendar-day'];
    if (isToday) classes.push('today');
    if (isSelected) classes.push('selected');

    html += `
      <div class="${classes.join(' ')}" onclick="selectDate('${dateString}')">
        <div class="calendar-day-number">${day}</div>
        ${eventDots}
      </div>
    `;
  }

  // Add days from next month to fill the grid
  const totalCells = startingDayOfWeek + daysInMonth;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthDate = new Date(year, month + 1, i);
    const dateString = nextMonthDate.toISOString().split('T')[0];
    html += `
      <div class="calendar-day other-month" onclick="selectDate('${dateString}')">
        <div class="calendar-day-number">${i}</div>
      </div>
    `;
  }

  console.log('Rendering calendar grid, HTML length:', html.length);
  grid.innerHTML = html;
  console.log('Calendar grid rendered successfully');
}

function renderEventsForDate(dateString, businessId = null) {
  const eventsContainer = document.getElementById('calendar-events-list');
  const eventsTitle = document.getElementById('calendar-events-date');

  const date = new Date(dateString + 'T12:00:00');
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  eventsTitle.textContent = `Events for ${formattedDate}`;

  let events = getEventsByDate(dateString);
  console.log(`📅 Calendar: Found ${events.length} events for ${dateString}`, businessId ? `(business: ${businessId})` : '');

  // Filter by business if this is a business-specific calendar
  if (businessId) {
    events = events.filter(e => e.businessId === businessId);
    console.log(`📅 After filtering by businessId: ${events.length} events`);
  }

  if (events.length === 0) {
    eventsContainer.innerHTML = '<div class="no-events">No events scheduled for this day</div>';
    return;
  }

  // Sort events by start time
  events.sort((a, b) => a.startTime.localeCompare(b.startTime));

  eventsContainer.innerHTML = events.map(event => `
    <div class="calendar-event-card">
      <div class="calendar-event-header">
        <div>
          <h3 class="calendar-event-title">${event.title}</h3>
          ${!businessId ? `<div class="calendar-event-business">📍 ${event.businessName}</div>` : ''}
          ${event.artist ? `<div class="calendar-event-business">🎤 ${event.artist}</div>` : ''}
          ${event.host ? `<div class="calendar-event-business">🎙️ Host: ${event.host}</div>` : ''}
        </div>
        <span class="calendar-event-type ${event.type}">${event.type.replace(/-/g, ' ')}</span>
      </div>
      <div class="calendar-event-time">🕐 ${event.startTime} - ${event.endTime}</div>
      <div class="calendar-event-description">${event.description}</div>
    </div>
  `).join('');
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  const modal = document.getElementById('calendar-modal');
  if (e.target === modal) {
    closeCalendarModal();
  }
});
