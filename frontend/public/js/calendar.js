// frontend/public/js/calendar.js
// Calendarul: ia temele din /api/classrooms și le așază pe zilele lunii.
document.addEventListener('DOMContentLoaded', () => {

  // ---------- 1. Autentificare (la fel ca în celelalte pagini) ----------
  const savedUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  if (!savedUser || !token) { window.location.href = '/login.html'; return; }

  const user = JSON.parse(savedUser);
  const isTeacher = user.role === 'teacher' || user.role === 'profesor';

  document.querySelector('.user-name').textContent = user.name || user.email;
  document.querySelector('.user-role').textContent = isTeacher ? 'profesor' : 'elev';
  renderSidebar(isTeacher ? 'teacher' : 'student', 'calendar');

  // ---------- 2. Stare ----------
  const now = new Date();
  let viewYear = now.getFullYear();
  let viewMonth = now.getMonth();   // 0 = ianuarie ... 11 = decembrie
  let eventsByDay = {};             // { '2026-11-10': [eveniment, eveniment], ... }
  let allEvents = [];               // toate evenimentele, sortate după dată

  const DAY_MS = 24 * 60 * 60 * 1000;
  const statusLabels = { done: 'Rezolvat', soon: 'Urmează curând', late: 'Expirat', future: '' };

  // ---------- 3. Funcții ajutătoare ----------
  function escapeHTML(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Cheia unei zile, în ora locală: '2026-11-10'
  function dayKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatTime(d) {
    return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  }

  // Culoarea unui eveniment: done / late / soon / future
  function getStatus(ev) {
    if (ev.completed) return 'done';
    const diff = ev.date - new Date();
    if (diff < 0) return 'late';
    if (diff <= 2 * DAY_MS) return 'soon';
    return 'future';
  }

  // „azi", „mâine", „în 5 zile"
  function relativeLabel(date) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(date); target.setHours(0, 0, 0, 0);
    const diff = Math.round((target - today) / DAY_MS);
    if (diff === 0) return 'azi';
    if (diff === 1) return 'mâine';
    return `în ${diff} zile`;
  }

  // ---------- 4. Încărcarea datelor ----------
  async function loadEvents() {
    try {
      const res = await fetch('/api/classrooms', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 401) { localStorage.clear(); window.location.href = '/login.html'; return; }
      const classrooms = await res.json();
      if (!Array.isArray(classrooms)) throw new Error('Răspuns neașteptat de la server');

      // Transformăm temele din toate clasele într-o listă simplă de evenimente
      allEvents = [];
      classrooms.forEach(c => {
        (c.homeworks || []).forEach(hw => {
          if (!hw.dueDate) return; // temele fără deadline nu apar în calendar
          allEvents.push({
            id: hw._id,
            title: hw.title,
            date: new Date(hw.dueDate),
            classroomName: c.name || c.title || 'Clasă',
            xp: hw.xpReward || 10,
            completed: !!hw.isCompleted   // doar elevul primește acest câmp
          });
        });
      });
      allEvents.sort((a, b) =>
        a.date - b.date ||
        b.xp - a.xp ||
        a.title.localeCompare(b.title, 'ro')
      );

      // Grupăm pe zile, ca să le găsim rapid când desenăm grila
      eventsByDay = {};
      allEvents.forEach(ev => {
        const key = dayKey(ev.date);
        (eventsByDay[key] = eventsByDay[key] || []).push(ev);
      });

      renderGrid();
      renderUpcoming();
    } catch (err) {
      console.error('Eroare la încărcarea calendarului:', err);
      showToast('Nu am putut încărca calendarul.', 'error');
      renderGrid();
      renderUpcoming();
    }
  }

  // ---------- 5. Desenarea grilei lunii ----------
  function renderGrid() {
    const grid = document.getElementById('cal-grid');
    const title = document.getElementById('cal-title');
    title.textContent = new Date(viewYear, viewMonth, 1)
      .toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

    const first = new Date(viewYear, viewMonth, 1);
    const offset = (first.getDay() + 6) % 7; // săptămâna începe luni (luni = 0)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
    const todayKey = dayKey(new Date());

    let html = '';
    for (let i = 0; i < totalCells; i++) {
      // Zilele din afara lunii (ex: 31 oct) se calculează automat de Date
      const d = new Date(viewYear, viewMonth, 1 - offset + i);
      const key = dayKey(d);
      const events = eventsByDay[key] || [];
      const classes = ['cal-cell'];
      if (d.getMonth() !== viewMonth) classes.push('other-month');
      if (key === todayKey) classes.push('today');

      const chips = events.slice(0, 2).map(ev =>
        `<div class="cal-ev ${getStatus(ev)}" title="${escapeHTML(ev.title)}">${escapeHTML(ev.title)}</div>`
      ).join('');
      const more = events.length > 2 ? `<div class="cal-more">+${events.length - 2} mai multe</div>` : '';

      html += `<div class="${classes.join(' ')}" data-date="${key}">
        <span class="cal-daynum">${d.getDate()}</span>${chips}${more}
      </div>`;
    }
    grid.innerHTML = html;
  }

  // ---------- 6. Panoul „Urmează în curând" ----------
  function eventItemHTML(ev) {
    const status = getStatus(ev);
    const icon = ev.completed ? '✅' : '📝';
    const statusText = statusLabels[status] ? ` • ${statusLabels[status]}` : '';
    return `<li class="cal-up-item ${status}" data-id="${ev.id}" data-date="${dayKey(ev.date)}">
      <div class="cal-up-title">${icon} ${escapeHTML(ev.title)}</div>
      <div class="cal-up-meta">${escapeHTML(ev.classroomName)} • ${formatTime(ev.date)} • +${ev.xp} XP${statusText}</div>
    </li>`;
  }

  function renderUpcoming() {
    const list = document.getElementById('upcoming-list');
    const empty = document.getElementById('upcoming-empty');
    const upcoming = allEvents
      .filter(ev => ev.date >= new Date() && !ev.completed)
      .slice(0, 3);

    if (upcoming.length === 0) {
      list.innerHTML = '';
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';
    list.innerHTML = upcoming.map(ev => `
      <li class="cal-up-item ${getStatus(ev)}" data-id="${ev.id}" data-date="${dayKey(ev.date)}">
        <div class="cal-up-title">📝 ${escapeHTML(ev.title)}</div>
        <div class="cal-up-meta">${escapeHTML(ev.classroomName)} • ${relativeLabel(ev.date)}, ${formatTime(ev.date)} • +${ev.xp} XP</div>
      </li>`).join('');
  }

  // ---------- 7. Modalul unei zile ----------
  const dayModal = document.getElementById('day-modal');

  function openDayModal(key) {
    const [y, m, d] = key.split('-').map(Number);
    document.getElementById('day-modal-title').textContent = new Date(y, m - 1, d)
      .toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });

    const events = eventsByDay[key] || [];
    document.getElementById('day-modal-list').innerHTML = events.length
      ? events.map(eventItemHTML).join('')
      : '<li style="color:var(--cal-muted);">Nicio temă în această zi.</li>';

    dayModal.style.display = 'flex';
    dayModal.removeAttribute('hidden');
  }

  function closeDayModal() {
    dayModal.setAttribute('hidden', '');
    dayModal.style.display = 'none';
  }

  // Click pe o temă: elevul ajunge în editor, profesorul vede ziua
  function handleEventClick(id, key) {
    if (isTeacher) { openDayModal(key); return; }
    window.location.href = `/dashboard-student.html?openHomework=${id}`;
  }

  // ---------- 8. Evenimente (click-uri) ----------
  document.getElementById('cal-prev').addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderGrid();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderGrid();
  });
  document.getElementById('cal-today').addEventListener('click', () => {
    const t = new Date();
    viewYear = t.getFullYear();
    viewMonth = t.getMonth();
    renderGrid();
  });

  // Click pe o zi din grilă
  document.getElementById('cal-grid').addEventListener('click', (e) => {
    const cell = e.target.closest('.cal-cell');
    if (cell) openDayModal(cell.dataset.date);
  });

  // Click pe o temă din panoul lateral sau din modal
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.cal-up-item');
    if (item) handleEventClick(item.dataset.id, item.dataset.date);
  });

  // Închiderea modalului: butonul X, click pe fundal, tasta Escape
  document.getElementById('day-modal-close').addEventListener('click', closeDayModal);
  dayModal.addEventListener('click', (e) => { if (e.target === dayModal) closeDayModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDayModal(); });

  // ---------- 9. Pornire ----------
  loadEvents();
});