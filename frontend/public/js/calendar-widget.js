// frontend/public/js/calendar-widget.js
// Widgetul „Calendar" din dashboard: arată primele 3 deadline-uri nerezolvate.
// Este învelit într-o funcție ca să nu intre în conflict cu variabilele din dashboard-*.js.
(function () {
  const token = localStorage.getItem('token');
  const body = document.getElementById('calendar-widget-body');
  if (!token || !body) return; // fără token, dashboard-*.js oricum te trimite la login

  const DAY_MS = 24 * 60 * 60 * 1000;
  const MAX_ITEMS = 3;

  function escapeHTML(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatTime(d) {
    return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
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

  // Culoarea marginii din stânga: portocaliu dacă expiră în 2 zile, altfel albastru
  function accentColor(date) {
    return (date - new Date()) <= 2 * DAY_MS ? '#f59e0b' : '#4f46e5';
  }

  function emptyHTML(text) {
    return `<div class="empty-widget-state"><p>${text}</p></div>`;
  }

  function render(events) {
    if (events.length === 0) {
      body.innerHTML = emptyHTML('Nu ai nicio activitate programată.');
      return;
    }
    body.innerHTML = `<ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px;">
      ${events.map(ev => `
        <li data-id="${ev.id}" style="padding:8px 10px; border:1px solid rgba(148,163,184,0.35); border-left:4px solid ${accentColor(ev.date)}; border-radius:8px; cursor:pointer;">
          <div style="font-size:13px; font-weight:600; color:inherit;">📝 ${escapeHTML(ev.title)}</div>
          <div style="font-size:11px; opacity:0.7; margin-top:2px;">
            ${escapeHTML(ev.classroomName)} • ${relativeLabel(ev.date)}, ${formatTime(ev.date)}
          </div>
        </li>`).join('')}
    </ul>`;
  }

  // Click pe o temă: elevul ajunge în editor, profesorul în calendar
  body.addEventListener('click', (e) => {
    const item = e.target.closest('li[data-id]');
    if (!item) return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isTeacher = user.role === 'teacher' || user.role === 'profesor';
    window.location.href = isTeacher
      ? '/calendar.html'
      : `/dashboard-student.html?openHomework=${item.dataset.id}`;
  });

  async function load() {
    try {
      const res = await fetch('/api/classrooms', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const classrooms = await res.json();
      if (!Array.isArray(classrooms)) throw new Error('Răspuns neașteptat');

      const now = new Date();
      const events = [];
      classrooms.forEach(c => {
        (c.homeworks || []).forEach(hw => {
          if (!hw.dueDate || hw.isCompleted) return;       // fără deadline sau deja rezolvată
          const date = new Date(hw.dueDate);
          if (date < now) return;                           // deja expirată
          events.push({
            id: hw._id,
            title: hw.title,
            date,
            xp: hw.xpReward || 10,
            classroomName: c.name || c.title || 'Clasă'
          });
        });
      });

      // Ordinea: cel mai apropiat deadline; la ore identice, XP mai mare; apoi alfabetic
      events.sort((a, b) =>
        a.date - b.date ||
        b.xp - a.xp ||
        a.title.localeCompare(b.title, 'ro')
      );

      render(events.slice(0, MAX_ITEMS));
    } catch (err) {
      console.error('Eroare widget calendar:', err);
      body.innerHTML = emptyHTML('Nu am putut încărca calendarul.');
    }
  }

  load();
})();