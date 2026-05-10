/* ═══════════════════════════════════════
   CalmFlow - script.js
   Study Dashboard Application Logic
   ═══════════════════════════════════════ */

// ── Color Presets ──
const COLOR_PRESETS = [
  '#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#74b9ff',
  '#fd79a8', '#a29bfe', '#55efc4', '#fab1a0', '#81ecec',
  '#2d3436', '#636e72', '#0984e3', '#00cec9', '#e84393',
  '#d63031', '#ffeaa7', '#55a3e8', '#b2bec3', '#dfe6e9'
];

// ── Helper Functions ──
function loadData(key, defaultValue) {
  try { return JSON.parse(localStorage.getItem(key)) || defaultValue; }
  catch { return defaultValue; }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function padTwo(n) {
  return String(n).padStart(2, '0');
}

function dateToKey(date) {
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())}`;
}

function formatMinutes(m) {
  if (m >= 60) {
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    return mins ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${m}m`;
}

function getDeadlineLabel(deadline) {
  if (!deadline) return { text: '', className: '' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline + 'T00:00:00');
  const daysLeft = Math.ceil((deadlineDate - today) / 86400000);

  if (daysLeft < 0) return { text: `${Math.abs(daysLeft)}d overdue`, className: 'deadline-overdue' };
  if (daysLeft === 0) return { text: 'Today', className: 'deadline-soon' };
  if (daysLeft === 1) return { text: 'Tomorrow', className: 'deadline-soon' };
  if (daysLeft <= 3) return { text: `${daysLeft} days left`, className: 'deadline-soon' };
  return { text: deadline.slice(5).replace('-', '/'), className: 'deadline-ok' };
}

function getPriorityClass(priority) {
  return priority === 'high' ? 'priority-high' : priority === 'mid' ? 'priority-mid' : 'priority-low';
}

function getPriorityLabel(priority) {
  return priority === 'high' ? 'High' : priority === 'mid' ? 'Mid' : 'Low';
}

// ── Application State ──
let events = loadData('cf-events', []);
let schedules = loadData('cf-schedules', {});
let memos = loadData('cf-memos', {});
let todos = loadData('cf-todos', []);
let subjects = loadData('cf-subjects', [
  { id: 's1', name: 'Math', color: '#6c5ce7' },
  { id: 's2', name: 'English', color: '#00b894' },
  { id: 's3', name: 'Science', color: '#74b9ff' },
  { id: 's4', name: 'Japanese', color: '#fd79a8' },
  { id: 's5', name: 'Social Studies', color: '#fdcb6e' }
]);
let studyLog = loadData('cf-studylog', []);
let goals = loadData('cf-goals', { daily: 120, monthly: 3000 });

let currentSubject = subjects[0]?.id || null;
let calendarDate = new Date();
let viewDate = null;
let todoFilter = 'all';
let editingEventId = null;

// Timer state
let timerSeconds = 25 * 60;
let timerMax = 25 * 60;
let timerInterval = null;
let timerRunning = false;
let timerStartTime = null;
let timerMode = 'pomodoro'; // 'pomodoro' or 'stopwatch'

// Stopwatch state
let stopwatchSeconds = 0;
let stopwatchInterval = null;
let stopwatchRunning = false;

// Per-picker color storage (each color picker has its own selected color)
const pickerColors = {};

function getPickerColor(id) {
  return pickerColors[id] || COLOR_PRESETS[0];
}

// ── Color Picker (native input) ──
function createColorPicker(pickerId, defaultColor) {
  pickerColors[pickerId] = defaultColor || pickerColors[pickerId] || COLOR_PRESETS[0];
  const color = pickerColors[pickerId];
  return `<input type="color" id="picker-${pickerId}" class="color-swatch"
    value="${color}" onchange="pickerColors['${pickerId}']=this.value">`;
}

// ── Clock ──
function updateClock() {
  const now = new Date();
  const options = {
    year: 'numeric', month: 'short', day: 'numeric',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
  };
  document.getElementById('clock').textContent = now.toLocaleString('en-US', options);
}
setInterval(updateClock, 1000);
updateClock();

// ── Navigation ──
document.querySelectorAll('.nav-btn').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const panelId = 'page-' + button.dataset.panel;
    document.getElementById(panelId).classList.add('active');
    button.classList.add('active');

    // Re-render the selected page
    if (button.dataset.panel === 'todo') renderTodos();
    if (button.dataset.panel === 'timer') renderTimer();
    if (button.dataset.panel === 'blocker') renderBlocker();
  });
});

// ── Modal Helpers ──
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

document.querySelectorAll('.modal-backdrop').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
  });
});

// ════════════════════════════════════════
// CALENDAR
// ════════════════════════════════════════

function getEventsForDate(dateKey) {
  return events.filter(e => dateKey >= e.startDate && dateKey <= (e.endDate || e.startDate));
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let html = `
    <div class="card" style="padding:12px">
      <div class="calendar-header">
        <button class="calendar-nav" onclick="calendarDate.setMonth(calendarDate.getMonth()-1);renderCalendar()">◀</button>
        <h3>${year} / ${month + 1}</h3>
        <button class="calendar-nav" onclick="calendarDate.setMonth(calendarDate.getMonth()+1);renderCalendar()">▶</button>
      </div>

      <!-- Date search -->
      <div style="display:flex;gap:5px;align-items:center;margin-bottom:10px">
        <input type="date" class="input" id="date-search" style="width:140px">
        <button class="btn btn-small" onclick="jumpToDate()">Go</button>
        <button class="btn-outline btn-small" onclick="calendarDate=new Date();renderCalendar()" style="margin-left:auto">Today</button>
      </div>

      <div class="calendar-grid">
        ${dayNames.map(d => `<div class="day-name">${d}</div>`).join('')}`;

  // Previous month padding
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="day-cell other-month"><span class="day-number">${daysInPrevMonth - firstDay + 1 + i}</span></div>`;
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const key = `${year}-${padTwo(month + 1)}-${padTwo(day)}`;
    const dayEvents = getEventsForDate(key);

    // Build event chips
    let chipsHtml = '';
    dayEvents.slice(0, 3).forEach(event => {
      const isMultiDay = event.endDate && event.endDate !== event.startDate;

      if (isMultiDay) {
        let chipClass = 'event-chip';
        if (key === event.startDate) chipClass += ' event-chip-start';
        else if (key === event.endDate) chipClass += ' event-chip-end';
        else chipClass += ' event-chip-mid';

        const label = key === event.startDate
          ? (event.allDay ? event.title : (event.startTime ? `${event.startTime.slice(0, 5)} ${event.title}` : event.title))
          : '&nbsp;';

        chipsHtml += `<div class="${chipClass}" style="background:${event.color}"
          onclick="event.stopPropagation();editEvent('${event.id}')">${label}</div>`;
      } else {
        const label = event.allDay ? event.title : (event.startTime ? `${event.startTime.slice(0, 5)} ${event.title}` : event.title);
        chipsHtml += `<div class="event-chip" style="background:${event.color}"
          onclick="event.stopPropagation();editEvent('${event.id}')">${label}</div>`;
      }
    });

    if (dayEvents.length > 3) {
      chipsHtml += `<div style="font-size:.44rem;color:var(--text-dim)">+${dayEvents.length - 3}</div>`;
    }

    html += `
      <div class="day-cell${isToday ? ' today' : ''}" onclick="focusAddEvent('${key}')">
        <span class="day-number" onclick="event.stopPropagation();openDayView('${key}')">${day}</span>
        ${chipsHtml}
      </div>`;
  }

  // Next month padding
  const remaining = 42 - firstDay - daysInMonth;
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="day-cell other-month"><span class="day-number">${i}</span></div>`;
  }

  html += `</div></div>`;

  // Add event form
  pickerColors['calendar-add'] = pickerColors['calendar-add'] || COLOR_PRESETS[0];
  html += `
    <div class="card">
      <div class="card-label">Add Event</div>
      <div class="input-row">
        <input type="text" id="add-event-title" placeholder="Event title..." style="flex:2;min-width:80px">
        <input type="date" id="add-event-start-date" style="width:125px">
        <input type="time" id="add-event-start-time" value="09:00" style="width:100px">
        <input type="date" id="add-event-end-date" style="width:125px">
        <input type="time" id="add-event-end-time" value="10:00" style="width:100px">
        <label style="font-size:.66rem"><input type="checkbox" id="add-event-allday"> All Day</label>
        ${createColorPicker('calendar-add')}
        <button class="btn" onclick="addEventFromCalendar()">Add</button>
      </div>
    </div>`;

  document.getElementById('calendar-month').innerHTML = html;

  // Set default dates
  const todayKey = dateToKey(new Date());
  document.getElementById('add-event-start-date').value = todayKey;
  document.getElementById('add-event-end-date').value = todayKey;
  document.getElementById('date-search').value = todayKey;
}

function jumpToDate() {
  const value = document.getElementById('date-search').value;
  if (!value) return;
  const date = new Date(value + 'T00:00:00');
  calendarDate = new Date(date.getFullYear(), date.getMonth(), 1);
  renderCalendar();
  openDayView(value);
}

function focusAddEvent(dateKey) {
  document.getElementById('add-event-start-date').value = dateKey;
  document.getElementById('add-event-end-date').value = dateKey;
  document.getElementById('add-event-title').focus();
}

function addEventFromCalendar() {
  const title = document.getElementById('add-event-title').value.trim();
  if (!title) return;

  const allDay = document.getElementById('add-event-allday').checked;
  events.push({
    id: 'e' + Date.now(),
    title: title,
    startDate: document.getElementById('add-event-start-date').value,
    endDate: document.getElementById('add-event-end-date').value,
    startTime: allDay ? null : document.getElementById('add-event-start-time').value,
    endTime: allDay ? null : document.getElementById('add-event-end-time').value,
    allDay: allDay,
    color: getPickerColor('calendar-add')
  });

  saveData('cf-events', events);
  document.getElementById('add-event-title').value = '';
  renderCalendar();
}

function deleteEvent(id) {
  events = events.filter(e => e.id !== id);
  saveData('cf-events', events);
  renderCalendar();
  if (viewDate) renderDayView();
}

function editEvent(id) {
  const ev = events.find(e => e.id === id);
  if (!ev) return;
  editingEventId = id;
  pickerColors['edit-event'] = ev.color;

  document.getElementById('edit-event-body').innerHTML = `
    <button class="modal-close" onclick="closeModal('edit-event-modal')">&times;</button>
    <h3>Edit Event</h3>
    <div style="margin-bottom:8px">
      <label class="form-label">Title</label>
      <input type="text" class="input" id="edit-title" value="${ev.title}" style="width:100%">
    </div>
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <div><label class="form-label">Start Date</label><input type="date" class="input" id="edit-start-date" value="${ev.startDate}" style="width:130px"></div>
      <div><label class="form-label">Start Time</label><input type="time" class="input" id="edit-start-time" value="${ev.startTime || '09:00'}" style="width:105px"></div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <div><label class="form-label">End Date</label><input type="date" class="input" id="edit-end-date" value="${ev.endDate || ev.startDate}" style="width:130px"></div>
      <div><label class="form-label">End Time</label><input type="time" class="input" id="edit-end-time" value="${ev.endTime || '10:00'}" style="width:105px"></div>
    </div>
    <div style="margin-bottom:8px">
      <label style="font-size:.72rem"><input type="checkbox" id="edit-allday" ${ev.allDay ? 'checked' : ''}> All Day</label>
    </div>
    <div style="margin-bottom:8px">
      <label class="form-label">Color</label>
      ${createColorPicker('edit-event', ev.color)}
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-success" onclick="saveEditedEvent()" style="flex:1">Save</button>
      <button class="btn btn-danger" onclick="deleteEvent('${id}');closeModal('edit-event-modal')" style="flex:1">Delete</button>
    </div>`;

  document.getElementById('edit-event-modal').classList.add('show');
}

function saveEditedEvent() {
  const ev = events.find(e => e.id === editingEventId);
  if (!ev) return;

  const allDay = document.getElementById('edit-allday').checked;
  ev.title = document.getElementById('edit-title').value.trim() || ev.title;
  ev.startDate = document.getElementById('edit-start-date').value;
  ev.endDate = document.getElementById('edit-end-date').value;
  ev.startTime = allDay ? null : document.getElementById('edit-start-time').value;
  ev.endTime = allDay ? null : document.getElementById('edit-end-time').value;
  ev.allDay = allDay;
  ev.color = getPickerColor('edit-event');

  saveData('cf-events', events);
  closeModal('edit-event-modal');
  renderCalendar();
  if (viewDate) renderDayView();
}

// ════════════════════════════════════════
// DAY VIEW
// ════════════════════════════════════════

function openDayView(key) {
  viewDate = new Date(key + 'T00:00:00');
  document.getElementById('calendar-month').style.display = 'none';
  document.getElementById('calendar-day').style.display = 'block';
  renderDayView();
}

function closeDayView() {
  viewDate = null;
  document.getElementById('calendar-month').style.display = 'block';
  document.getElementById('calendar-day').style.display = 'none';
  renderCalendar();
}

function navigateDay(direction) {
  viewDate.setDate(viewDate.getDate() + direction);
  renderDayView();
}

function renderDayView() {
  const key = dateToKey(viewDate);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayEvents = getEventsForDate(key);
  const daySchedules = schedules[key] || [];
  const dayTodos = todos.filter(t => t.deadline === key);
  const memo = memos[key] || '';

  const allDayEvents = dayEvents.filter(e => e.allDay || !e.startTime);
  const timedEvents = dayEvents.filter(e => !e.allDay && e.startTime);

  // All-day events bar
  let allDayHtml = '';
  if (allDayEvents.length) {
    allDayHtml = '<div class="allday-bar">' +
      allDayEvents.map(e => `<div class="allday-item" style="background:${e.color}" onclick="editEvent('${e.id}')">${e.title}</div>`).join('') +
      '</div>';
  }

  // Schedule timeline (24 hours)
  let scheduleHtml = '';
  for (let hour = 0; hour < 24; hour++) {
    let blocks = '';

    // Timed events
    timedEvents.forEach(e => {
      const startHour = parseInt(e.startTime.split(':')[0]);
      const startMin = parseInt(e.startTime.split(':')[1]) || 0;
      const endHour = e.endTime ? parseInt(e.endTime.split(':')[0]) : startHour + 1;
      const endMin = e.endTime ? parseInt(e.endTime.split(':')[1]) || 0 : 0;

      if (hour === startHour) {
        const topPx = Math.round(startMin / 60 * 32);
        const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        const heightPx = Math.max(Math.round(duration / 60 * 32), 20);
        blocks += `<div class="schedule-block" style="background:${e.color};top:${topPx}px;height:${heightPx}px"
          onclick="editEvent('${e.id}')">${e.title} ${e.startTime}~${e.endTime || ''}</div>`;
      }
    });

    // Schedule arrows (not shown on calendar)
    let arrows = '';
    daySchedules.forEach(s => {
      const sh = parseInt(s.start.split(':')[0]);
      const eh = s.end ? parseInt(s.end.split(':')[0]) : sh + 1;
      if (hour === sh) {
        arrows += `<div class="schedule-arrow" style="background:${s.color};top:0;height:${(eh - sh) * 32}px">${s.title}</div>`;
      }
    });

    scheduleHtml += `
      <div class="schedule-row">
        <div class="schedule-hour">${padTwo(hour)}</div>
        <div class="schedule-content">${blocks}${arrows}</div>
      </div>`;
  }

  // Build the day view
  pickerColors['day-event'] = pickerColors['day-event'] || COLOR_PRESETS[0];
  pickerColors['day-schedule'] = pickerColors['day-schedule'] || COLOR_PRESETS[2];

  const container = document.getElementById('calendar-day');
  container.innerHTML = `
    <button class="back-button" onclick="closeDayView()">◀ Back</button>
    <div class="day-header">
      <button class="calendar-nav" onclick="navigateDay(-1)">◀</button>
      <h3>${viewDate.getFullYear()}/${viewDate.getMonth() + 1}/${viewDate.getDate()} (${dayNames[viewDate.getDay()]})</h3>
      <button class="calendar-nav" onclick="navigateDay(1)">▶</button>
    </div>

    <div class="day-grid">
      <!-- Left: Schedule -->
      <div>
        <div class="card">
          <div class="card-label">Schedule</div>
          ${allDayHtml}
          <div style="max-height:460px;overflow-y:auto">${scheduleHtml}</div>
        </div>

        <div class="card">
          <div class="card-label">Add Event</div>
          <div class="input-row">
            <input type="text" id="day-event-title" placeholder="Title..." style="flex:2;min-width:60px">
            <input type="time" id="day-event-start" value="09:00" style="width:95px">
            <input type="time" id="day-event-end" value="10:00" style="width:95px">
            <label style="font-size:.62rem"><input type="checkbox" id="day-event-allday"> All Day</label>
            ${createColorPicker('day-event')}
            <button class="btn btn-small" onclick="addEventFromDay('${key}')">Add</button>
          </div>
        </div>

        <div class="card">
          <div class="card-label">Add Schedule (not shown on calendar)</div>
          <div class="input-row">
            <input type="text" id="day-schedule-title" placeholder="..." style="flex:2;min-width:60px">
            <input type="time" id="day-schedule-start" value="09:00" style="width:95px">
            <input type="time" id="day-schedule-end" value="10:00" style="width:95px">
            ${createColorPicker('day-schedule')}
            <button class="btn btn-small" onclick="addSchedule('${key}')">Add</button>
          </div>
        </div>
      </div>

      <!-- Right: Todo, Events, Memo -->
      <div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="card-label" style="margin-bottom:0">Todo for this day</div>
            <button class="btn btn-tiny" onclick="document.getElementById('day-todo-form').style.display=document.getElementById('day-todo-form').style.display==='none'?'block':'none'">+</button>
          </div>
          <div id="day-todo-form" style="display:none;margin-top:6px">
            <div class="input-row">
              <input type="text" id="day-todo-input" placeholder="New task..." style="flex:2">
              <select id="day-todo-priority" style="width:55px">
                <option value="high">High</option>
                <option value="mid" selected>Mid</option>
                <option value="low">Low</option>
              </select>
              <button class="btn btn-small btn-success" onclick="addDayTodo('${key}')">Add</button>
            </div>
          </div>
          <div style="margin-top:6px">
            ${dayTodos.length ? dayTodos.map(t => `
              <div class="day-todo-item${t.done ? ' done' : ''}" onclick="toggleTodo('${t.id}');renderDayView()">
                <div class="day-todo-check">${t.done ? '✓' : ''}</div>
                <span style="flex:1">${t.text}</span>
                <span class="priority-badge ${getPriorityClass(t.priority)}">${getPriorityLabel(t.priority)}</span>
              </div>
            `).join('') : '<p style="color:var(--text-dim);font-size:.7rem">None</p>'}
          </div>
        </div>

        <div class="card">
          <div class="card-label">Events (click to edit)</div>
          ${dayEvents.length ? dayEvents.map(e => `
            <div class="event-row" onclick="editEvent('${e.id}')">
              <div class="event-dot" style="background:${e.color}"></div>
              <div class="event-info">${e.title}
                <div class="event-time">${e.allDay ? 'All Day' : ((e.startTime || '') + (e.endTime ? ' ~ ' + e.endTime : ''))}</div>
              </div>
              <button class="btn btn-tiny btn-danger" onclick="event.stopPropagation();deleteEvent('${e.id}')">Delete</button>
            </div>
          `).join('') : '<p style="color:var(--text-dim);font-size:.7rem">None</p>'}
        </div>

        <div class="card">
          <div class="card-label">📝 Memo</div>
          <textarea class="memo-box" placeholder="Today's memo..."
            onblur="memos['${key}']=this.value;saveData('cf-memos',memos)">${memo}</textarea>
        </div>
      </div>
    </div>`;
}

function addEventFromDay(key) {
  const title = document.getElementById('day-event-title').value.trim();
  if (!title) return;
  const allDay = document.getElementById('day-event-allday').checked;

  events.push({
    id: 'e' + Date.now(),
    title: title,
    startDate: key,
    endDate: key,
    startTime: allDay ? null : document.getElementById('day-event-start').value,
    endTime: allDay ? null : document.getElementById('day-event-end').value,
    allDay: allDay,
    color: getPickerColor('day-event')
  });

  saveData('cf-events', events);
  renderDayView();
}

function addSchedule(key) {
  const title = document.getElementById('day-schedule-title').value.trim();
  if (!title) return;

  if (!schedules[key]) schedules[key] = [];
  schedules[key].push({
    title: title,
    start: document.getElementById('day-schedule-start').value,
    end: document.getElementById('day-schedule-end').value,
    color: getPickerColor('day-schedule')
  });

  saveData('cf-schedules', schedules);
  renderDayView();
}

function addDayTodo(key) {
  const text = document.getElementById('day-todo-input').value.trim();
  if (!text) return;

  todos.push({
    id: Date.now().toString(),
    text: text,
    priority: document.getElementById('day-todo-priority').value,
    deadline: key,
    done: false
  });

  saveData('cf-todos', todos);
  renderDayView();
}

// ════════════════════════════════════════
// TODO LIST
// ════════════════════════════════════════

let dragTodoId = null;

function renderTodos() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let filtered = [...todos];

  // Apply filter
  if (todoFilter === 'active') {
    filtered = filtered.filter(t => !t.done && !(t.deadline && new Date(t.deadline + 'T00:00:00') < today));
  } else if (todoFilter === 'done') {
    filtered = filtered.filter(t => t.done);
  } else if (todoFilter === 'expired') {
    filtered = filtered.filter(t => !t.done && t.deadline && new Date(t.deadline + 'T00:00:00') < today);
  }

  // Sort by priority, then by custom order
  const priorityOrder = { high: 0, mid: 1, low: 2 };
  const sortFn = (a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  };

  // Build items with section dividers
  let items;
  if (todoFilter === 'all') {
    const active = filtered.filter(t => !t.done && !(t.deadline && new Date(t.deadline + 'T00:00:00') < today)).sort(sortFn);
    const expired = filtered.filter(t => !t.done && t.deadline && new Date(t.deadline + 'T00:00:00') < today).sort(sortFn);
    const done = filtered.filter(t => t.done).sort(sortFn);

    items = [
      ...active,
      ...(expired.length ? [{ divider: 'Expired' }, ...expired] : []),
      ...(done.length ? [{ divider: 'Done' }, ...done] : [])
    ];
  } else {
    filtered.sort(sortFn);
    items = filtered;
  }

  // Render
  const listHtml = items.map(t => {
    if (t.divider) return `<div class="section-divider">${t.divider}</div>`;

    const deadline = getDeadlineLabel(t.deadline);
    return `
      <li class="todo-item${t.done ? ' done' : ''}" draggable="true" data-id="${t.id}" onclick="toggleTodo('${t.id}')">
        <div class="drag-handle" onmousedown="event.stopPropagation()">⠿</div>
        <div class="todo-checkbox">${t.done ? '✓' : ''}</div>
        <span class="todo-text">${t.text}</span>
        <div class="todo-meta">
          ${deadline.text ? `<span class="todo-deadline ${deadline.className}">${deadline.text}</span>` : ''}
          <span class="priority-badge ${getPriorityClass(t.priority)}">${getPriorityLabel(t.priority)}</span>
        </div>
        <button class="todo-delete" onclick="event.stopPropagation();deleteTodo('${t.id}')">✕</button>
      </li>`;
  }).join('');

  document.getElementById('todo-container').innerHTML = `
    <div class="card">
      <div class="card-label">Todo List</div>
      <div style="display:flex;gap:5px;margin-bottom:6px;flex-wrap:wrap">
        <input type="text" class="input" id="todo-input" placeholder="New task..." style="flex:2;min-width:100px">
        <input type="date" class="input" id="todo-deadline" style="flex:1;min-width:115px">
        <select class="input" id="todo-priority" style="width:62px">
          <option value="high">🔴 High</option>
          <option value="mid" selected>🟡 Mid</option>
          <option value="low">🟢 Low</option>
        </select>
        <button class="btn" onclick="addTodo()">Add</button>
      </div>

      <div style="display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap">
        ${['all', 'active', 'done', 'expired'].map(f =>
          `<button class="btn-outline btn-small filter-btn${todoFilter === f ? ' active' : ''}" data-filter="${f}">
            ${f.charAt(0).toUpperCase() + f.slice(1)}
          </button>`
        ).join('')}
      </div>

      <p style="font-size:.56rem;color:var(--text-dim);margin-bottom:6px">↕ Drag to reorder</p>
      <ul class="todo-list" id="todo-list">${listHtml}</ul>
    </div>`;

  // Filter button listeners
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => { todoFilter = btn.dataset.filter; renderTodos(); });
  });

  // Enter key to add
  document.getElementById('todo-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addTodo();
  });

  // Drag and drop
  setupTodoDragDrop();
}

function setupTodoDragDrop() {
  const list = document.getElementById('todo-list');
  if (!list) return;

  list.addEventListener('dragstart', e => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    dragTodoId = li.dataset.id;
    li.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
  });

  list.addEventListener('dragend', e => {
    const li = e.target.closest('li[data-id]');
    if (li) li.style.opacity = '1';
  });

  list.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const li = e.target.closest('li[data-id]');
    if (li) li.style.borderTop = '2px solid var(--accent)';
  });

  list.addEventListener('dragleave', e => {
    const li = e.target.closest('li[data-id]');
    if (li) li.style.borderTop = '';
  });

  list.addEventListener('drop', e => {
    e.preventDefault();
    const targetLi = e.target.closest('li[data-id]');
    if (!targetLi || !dragTodoId) return;
    targetLi.style.borderTop = '';

    const fromIndex = todos.findIndex(t => t.id === dragTodoId);
    const toIndex = todos.findIndex(t => t.id === targetLi.dataset.id);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    // Move the item
    const item = todos.splice(fromIndex, 1)[0];
    todos.splice(toIndex, 0, item);

    // Update order
    todos.forEach((t, i) => t.order = i);
    saveData('cf-todos', todos);
    renderTodos();
  });
}

function addTodo() {
  const input = document.getElementById('todo-input');
  const text = input.value.trim();
  if (!text) return;

  todos.push({
    id: Date.now().toString(),
    text: text,
    priority: document.getElementById('todo-priority').value,
    deadline: document.getElementById('todo-deadline').value || null,
    done: false
  });

  input.value = '';
  saveData('cf-todos', todos);
  renderTodos();
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) todo.done = !todo.done;
  saveData('cf-todos', todos);
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveData('cf-todos', todos);
  renderTodos();
}

// ════════════════════════════════════════
// TIMER
// ════════════════════════════════════════

function renderTimer() {
  const currentSub = subjects.find(s => s.id === currentSubject);

  document.getElementById('timer-container').innerHTML = `
    <!-- Subject Picker -->
    <div class="card">
      <div class="card-label">Subject</div>
      <div class="subject-picker">
        ${subjects.map(s => `
          <button class="subject-btn${s.id === currentSubject ? ' active' : ''}"
            style="${s.id === currentSubject ? 'background:' + s.color : ''}"
            onclick="currentSubject='${s.id}';renderTimer()">${s.name}</button>
        `).join('')}
        <button class="subject-add-btn" onclick="openSubjectModal()">+</button>
      </div>
    </div>

    <!-- Timer / Stopwatch -->
    <div class="card">
      <div class="timer-tabs">
        <button class="timer-tab${timerMode === 'pomodoro' ? ' active' : ''}" onclick="timerMode='pomodoro';renderTimer()">🍅 Pomodoro</button>
        <button class="timer-tab${timerMode === 'stopwatch' ? ' active' : ''}" onclick="timerMode='stopwatch';renderTimer()">⏱ Stopwatch</button>
      </div>

      ${timerMode === 'pomodoro' ? `
        <div class="timer-display" id="timer-display">${padTwo(Math.floor(timerSeconds / 60))}:${padTwo(timerSeconds % 60)}</div>
        <div class="timer-subject">${currentSub ? '📖 ' + currentSub.name : 'Select a subject'}</div>
        <div class="timer-controls">
          <button class="btn btn-success" onclick="togglePomodoro()">${timerRunning ? '⏸ Pause' : '▶ Start'}</button>
          <button class="btn btn-danger" onclick="endPomodoro()">⏹ End</button>
          <button class="btn btn-outline" onclick="resetPomodoro()">Reset</button>
        </div>
        <div class="timer-presets">
          <button class="preset-btn${timerMax === 1500 ? ' active' : ''}" onclick="setPomodoro(25)">25min</button>
          <button class="preset-btn${timerMax === 3000 ? ' active' : ''}" onclick="setPomodoro(50)">50min</button>
          <button class="preset-btn${timerMax === 300 ? ' active' : ''}" onclick="setPomodoro(5)">5min</button>
          <button class="preset-btn${timerMax === 600 ? ' active' : ''}" onclick="setPomodoro(10)">10min</button>
        </div>
        <div class="input-row" style="justify-content:center;margin-top:8px">
          <span style="font-size:.66rem;color:var(--text-dim)">Custom:</span>
          <input type="number" id="custom-time" value="30" min="1" max="180" style="width:48px">
          <span style="font-size:.66rem;color:var(--text-dim)">min</span>
          <button class="btn btn-small" onclick="setPomodoro(+document.getElementById('custom-time').value||25)">Set</button>
        </div>
      ` : `
        <div class="stopwatch-display" id="stopwatch-display">
          ${padTwo(Math.floor(stopwatchSeconds / 3600))}:${padTwo(Math.floor(stopwatchSeconds % 3600 / 60))}:${padTwo(stopwatchSeconds % 60)}
        </div>
        <div class="timer-subject">${currentSub ? '📖 ' + currentSub.name : 'Select a subject'}</div>
        <div class="timer-controls">
          <button class="btn btn-success" onclick="toggleStopwatch()">${stopwatchRunning ? '⏸ Pause' : '▶ Start'}</button>
          <button class="btn btn-danger" onclick="endStopwatch()">⏹ End & Record</button>
          <button class="btn btn-outline" onclick="resetStopwatch()">Reset</button>
        </div>
      `}
    </div>

    <!-- Goals -->
    <div class="card">
      <div class="card-label">Goals</div>
      <div class="goal-row">
        <span>Daily:</span>
        <input type="number" id="goal-daily" value="${goals.daily}" min="0" step="10"
          onchange="goals.daily=+this.value;saveData('cf-goals',goals);updateStats()">
        <span>min</span>
      </div>
      <div class="goal-bar-container">
        <div class="goal-bar-fill" id="goal-daily-bar"></div>
        <div class="goal-bar-text" id="goal-daily-text"></div>
      </div>
      <div class="goal-row">
        <span>Monthly:</span>
        <input type="number" id="goal-monthly" value="${goals.monthly}" min="0" step="60"
          onchange="goals.monthly=+this.value;saveData('cf-goals',goals);updateStats()">
        <span>min</span>
      </div>
      <div class="goal-bar-container">
        <div class="goal-bar-fill" id="goal-monthly-bar"></div>
        <div class="goal-bar-text" id="goal-monthly-text"></div>
      </div>
    </div>

    <!-- Stats -->
    <div class="card">
      <div class="card-label">Study Time</div>
      <div class="stats-grid" id="stats-grid"></div>
    </div>

    <!-- Subject Breakdown -->
    <div class="card">
      <div class="card-label">By Subject (This Month)</div>
      <div id="subject-stats"></div>
    </div>

    <!-- Log Edit -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="card-label" style="margin-bottom:0">Log Edit (Today)</div>
        <button class="btn btn-tiny" onclick="document.getElementById('manual-form').style.display=document.getElementById('manual-form').style.display==='none'?'block':'none'">+ Manual</button>
      </div>
      <div id="manual-form" style="display:none;margin-top:8px">
        <div class="input-row">
          <select class="input" id="manual-subject" style="width:80px">
            ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
          <input type="number" id="manual-minutes" placeholder="min" min="1" style="width:50px">
          <button class="btn btn-small btn-success" onclick="addManualLog()">Record</button>
        </div>
      </div>
      <div id="log-list" style="margin-top:8px"></div>
    </div>`;

  updateStats();
  renderLogList();
}

// Pomodoro functions
function updateTimerDisplay() {
  const el = document.getElementById('timer-display');
  if (el) el.textContent = `${padTwo(Math.floor(timerSeconds / 60))}:${padTwo(timerSeconds % 60)}`;
}

function togglePomodoro() {
  if (!currentSubject) { alert('Select a subject'); return; }

  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
  } else {
    timerRunning = true;
    if (!timerStartTime) timerStartTime = Date.now();

    timerInterval = setInterval(() => {
      timerSeconds--;
      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        recordStudy(Math.round(timerMax / 60));
        timerStartTime = null;
        timerSeconds = 0;
        updateTimerDisplay();
        renderTimer();
        alert('⏰ Timer finished!');
        return;
      }
      updateTimerDisplay();
    }, 1000);
  }
  renderTimer();
}

function endPomodoro() {
  clearInterval(timerInterval);
  if (timerStartTime) {
    const elapsed = Math.round((Date.now() - timerStartTime) / 60000);
    if (elapsed > 0) recordStudy(elapsed);
  }
  timerRunning = false;
  timerStartTime = null;
  timerSeconds = timerMax;
  renderTimer();
}

function resetPomodoro() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerStartTime = null;
  timerSeconds = timerMax;
  renderTimer();
}

function setPomodoro(minutes) {
  clearInterval(timerInterval);
  timerRunning = false;
  timerStartTime = null;
  timerMax = minutes * 60;
  timerSeconds = timerMax;
  renderTimer();
}

// Stopwatch functions
function updateStopwatchDisplay() {
  const el = document.getElementById('stopwatch-display');
  if (el) {
    el.textContent = `${padTwo(Math.floor(stopwatchSeconds / 3600))}:${padTwo(Math.floor(stopwatchSeconds % 3600 / 60))}:${padTwo(stopwatchSeconds % 60)}`;
  }
}

function toggleStopwatch() {
  if (!currentSubject) { alert('Select a subject'); return; }

  if (stopwatchRunning) {
    clearInterval(stopwatchInterval);
    stopwatchRunning = false;
  } else {
    stopwatchRunning = true;
    stopwatchInterval = setInterval(() => {
      stopwatchSeconds++;
      updateStopwatchDisplay();
    }, 1000);
  }
  renderTimer();
}

function endStopwatch() {
  clearInterval(stopwatchInterval);
  const minutes = Math.round(stopwatchSeconds / 60);
  if (minutes > 0) recordStudy(minutes);
  stopwatchRunning = false;
  stopwatchSeconds = 0;
  renderTimer();
}

function resetStopwatch() {
  clearInterval(stopwatchInterval);
  stopwatchRunning = false;
  stopwatchSeconds = 0;
  renderTimer();
}

// Study recording
function recordStudy(minutes) {
  studyLog.push({
    id: 'l' + Date.now(),
    date: dateToKey(new Date()),
    subject: currentSubject,
    minutes: minutes,
    timestamp: Date.now()
  });
  saveData('cf-studylog', studyLog);
  updateStats();
  renderLogList();
}

function updateStats() {
  const now = new Date();
  const todayKey = dateToKey(now);
  const monthPrefix = `${now.getFullYear()}-${padTwo(now.getMonth() + 1)}`;

  // Calculate week range (Mon-Sun)
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek - 1));
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(dateToKey(d));
  }

  const todayMinutes = studyLog.filter(l => l.date === todayKey).reduce((sum, l) => sum + l.minutes, 0);
  const weekMinutes = studyLog.filter(l => weekDates.includes(l.date)).reduce((sum, l) => sum + l.minutes, 0);
  const monthMinutes = studyLog.filter(l => l.date.startsWith(monthPrefix)).reduce((sum, l) => sum + l.minutes, 0);
  const totalMinutes = studyLog.reduce((sum, l) => sum + l.minutes, 0);
  const todaySessions = studyLog.filter(l => l.date === todayKey).length;

  // Calculate streak
  let streak = 0;
  const checkDate = new Date(now);
  while (studyLog.some(l => l.date === dateToKey(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Render stats grid
  const statsGrid = document.getElementById('stats-grid');
  if (statsGrid) {
    const stats = [
      { value: formatMinutes(todayMinutes), label: 'Today' },
      { value: formatMinutes(weekMinutes), label: 'This Week' },
      { value: formatMinutes(monthMinutes), label: 'This Month' },
      { value: todaySessions, label: 'Sessions' },
      { value: streak + 'd', label: 'Streak' },
      { value: formatMinutes(totalMinutes), label: 'All Time' }
    ];
    statsGrid.innerHTML = stats.map(s =>
      `<div class="stat-card"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`
    ).join('');
  }

  // Goal bars
  const dailyPercent = Math.min(100, Math.round(todayMinutes / (goals.daily || 1) * 100));
  const monthlyPercent = Math.min(100, Math.round(monthMinutes / (goals.monthly || 1) * 100));

  const dailyBar = document.getElementById('goal-daily-bar');
  const dailyText = document.getElementById('goal-daily-text');
  if (dailyBar) { dailyBar.style.width = dailyPercent + '%'; dailyText.textContent = `${formatMinutes(todayMinutes)} / ${formatMinutes(goals.daily)} (${dailyPercent}%)`; }

  const monthlyBar = document.getElementById('goal-monthly-bar');
  const monthlyText = document.getElementById('goal-monthly-text');
  if (monthlyBar) { monthlyBar.style.width = monthlyPercent + '%'; monthlyText.textContent = `${formatMinutes(monthMinutes)} / ${formatMinutes(goals.monthly)} (${monthlyPercent}%)`; }

  // Subject breakdown
  const subjectMinutes = {};
  studyLog.filter(l => l.date.startsWith(monthPrefix)).forEach(l => {
    subjectMinutes[l.subject] = (subjectMinutes[l.subject] || 0) + l.minutes;
  });
  const maxMinutes = Math.max(1, ...Object.values(subjectMinutes));
  const totalSubjectMinutes = Object.values(subjectMinutes).reduce((a, b) => a + b, 0);

  const subjectStats = document.getElementById('subject-stats');
  if (subjectStats) {
    subjectStats.innerHTML = subjects.map(s => {
      const mins = subjectMinutes[s.id] || 0;
      const percent = Math.round(mins / maxMinutes * 100);
      return `
        <div class="subject-row">
          <div class="subject-dot" style="background:${s.color}"></div>
          <span class="subject-name">${s.name}</span>
          <div class="subject-bar-track"><div class="subject-bar-fill" style="width:${percent}%;background:${s.color}"></div></div>
          <span class="subject-time">${formatMinutes(mins)}</span>
        </div>`;
    }).join('') + `
      <div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border);display:flex;justify-content:space-between">
        <span style="font-size:.74rem;font-weight:600">Total</span>
        <span class="subject-time">${formatMinutes(totalSubjectMinutes)}</span>
      </div>`;
  }
}

function renderLogList() {
  const todayKey = dateToKey(new Date());
  const todayLogs = studyLog.filter(l => l.date === todayKey);
  const logList = document.getElementById('log-list');
  if (!logList) return;

  logList.innerHTML = todayLogs.length
    ? todayLogs.map(l => {
        const sub = subjects.find(s => s.id === l.subject);
        return `
          <div class="log-item">
            <div class="subject-dot" style="background:${sub?.color || '#666'}"></div>
            <span style="flex:1">${sub?.name || '?'}</span>
            <span class="subject-time">${l.minutes} min</span>
            <button class="btn btn-tiny btn-danger"
              onclick="studyLog=studyLog.filter(x=>x.id!=='${l.id}');saveData('cf-studylog',studyLog);renderTimer()">Delete</button>
          </div>`;
      }).join('')
    : '<p style="color:var(--text-dim);font-size:.7rem">None</p>';
}

function addManualLog() {
  const subjectId = document.getElementById('manual-subject').value;
  const minutes = parseInt(document.getElementById('manual-minutes').value);
  if (!minutes || minutes < 1) return;

  studyLog.push({
    id: 'l' + Date.now(),
    date: dateToKey(new Date()),
    subject: subjectId,
    minutes: minutes,
    timestamp: Date.now()
  });

  saveData('cf-studylog', studyLog);
  document.getElementById('manual-minutes').value = '';
  renderTimer();
}

// Subject modal
function openSubjectModal() {
  pickerColors['new-subject'] = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)];

  document.getElementById('add-subject-body').innerHTML = `
    <button class="modal-close" onclick="closeModal('add-subject-modal')">&times;</button>
    <h3>Add Subject</h3>
    <div style="margin-bottom:8px">
      <label class="form-label">Subject Name</label>
      <input type="text" class="input" id="new-subject-name" style="width:100%">
    </div>
    <div style="margin-bottom:8px">
      <label class="form-label">Color</label>
      ${createColorPicker('new-subject')}
    </div>
    <button class="btn" onclick="addSubject()" style="width:100%">Add</button>`;

  document.getElementById('add-subject-modal').classList.add('show');
}

function addSubject() {
  const name = document.getElementById('new-subject-name').value.trim();
  if (!name) return;

  subjects.push({
    id: 's' + Date.now(),
    name: name,
    color: getPickerColor('new-subject')
  });

  currentSubject = subjects[subjects.length - 1].id;
  saveData('cf-subjects', subjects);
  closeModal('add-subject-modal');
  renderTimer();
}

// ════════════════════════════════════════
// SITE BLOCKER
// ════════════════════════════════════════

let blockedSites = loadData('cf-blocked', ['twitter.com', 'youtube.com', 'tiktok.com']);
let focusMode = false;

function renderBlocker() {
  document.getElementById('blocker-container').innerHTML = `
    <div class="card">
      <div class="focus-banner">
        <p style="font-size:.78rem">🎯 <strong>Focus Mode</strong></p>
        <button class="btn btn-small${focusMode ? ' btn-success' : ''}" onclick="focusMode=!focusMode;renderBlocker()">
          ${focusMode ? 'ON' : 'OFF'}
        </button>
      </div>

      <div class="card-label">Block List</div>
      <div style="display:flex;gap:5px;margin-bottom:8px">
        <input type="text" class="input" id="block-input" placeholder="e.g. twitter.com" style="flex:2">
        <button class="btn" onclick="addBlockedSite()">Add</button>
      </div>

      <ul class="block-list">
        ${blockedSites.map((site, index) => `
          <li class="block-item">
            <span style="font-size:.78rem">🌐 ${site}</span>
            <div style="display:flex;gap:5px;align-items:center">
              <span class="block-status ${focusMode ? 'status-blocked' : 'status-allowed'}">
                ${focusMode ? 'Blocked' : 'Allowed'}
              </span>
              <button class="btn btn-tiny btn-danger"
                onclick="blockedSites.splice(${index},1);saveData('cf-blocked',blockedSites);renderBlocker()">✕</button>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>`;
}

function addBlockedSite() {
  const input = document.getElementById('block-input');
  const site = input.value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!site) return;

  blockedSites.push(site);
  input.value = '';
  saveData('cf-blocked', blockedSites);
  renderBlocker();
}

// ════════════════════════════════════════
// INITIALIZE
// ════════════════════════════════════════

renderCalendar();
renderTodos();
renderTimer();
renderBlocker();
