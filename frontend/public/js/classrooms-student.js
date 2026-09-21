// frontend/public/js/classrooms-student.js
document.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  if (!savedUser || !token) { window.location.href = '/login.html'; return; }

  const user = JSON.parse(savedUser);
  document.querySelector('.user-name').textContent = user.name || user.email;
  document.querySelector('.user-role').textContent = 'elev';

  let lastLoadedClassrooms = [];
  renderSidebar('student', 'classrooms');
  const typeLabels = { liceu: '🏫 Liceu', optional: '✨ Opțional', facultate: '🏫 Facultate', bacalaureat: '🎓 Bacalaureat' };

  async function loadClassrooms() {
    const res = await fetch('/api/classrooms', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401) { localStorage.clear(); window.location.href = '/login.html'; return; }
    const classrooms = await res.json();
    lastLoadedClassrooms = classrooms;
    renderClassrooms(classrooms);
  }

  function renderClassrooms(classrooms) {
    const container = document.getElementById('classrooms-grid');
    const emptyState = document.getElementById('empty-state');
    if (!classrooms || classrooms.length === 0) {
      emptyState.style.display = ''; container.innerHTML = ''; return;
    }
    emptyState.style.display = 'none';
    container.innerHTML = classrooms.map(c => {
      const pendingCount = c.pendingCount ?? (c.homeworks || []).filter(h => !h.isCompleted).length;
      return `
      <div class="class-card" data-id="${c.id}" data-name="${escapeHTML(c.name || c.title || '')}" style="
        background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px;
        display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        cursor: pointer; transition: transform 0.18s ease, box-shadow 0.18s ease;
      ">
        <span style="font-size: 12px; font-weight: 600; color: #6366f1; text-transform: uppercase;">${typeLabels[c.type] || c.type || ''}</span>
        <h3 style="margin: 0; font-size: 17px; color: #1e293b; display:flex; justify-content:space-between;">
          ${escapeHTML(c.name || c.title || 'Clasă fără nume')}
          ${pendingCount > 0
            ? `<span style="background:#fef3c7 !important; color:#b45309 !important; font-size:11px; padding:3px 8px; border-radius:999px; font-weight:700;">${pendingCount} de rezolvat</span>`
            : `<span style="background:#dcfce7 !important; color:#15803d !important; font-size:11px; padding:3px 8px; border-radius:999px; font-weight:700;">✓ La zi</span>`}
        </h3>
      </div>`;
    }).join('');
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.class-card');
    if (card) openClassroomModal(card.dataset.id, card.dataset.name);
  });

  // Modal înscriere
  const joinModal = document.getElementById('join-modal');
  document.getElementById('open-join-modal-btn').addEventListener('click', () => {
    document.getElementById('invite-code-input').value = '';
    joinModal.style.display = 'flex'; joinModal.removeAttribute('hidden');
  });
  document.getElementById('join-modal-close').addEventListener('click', () => {
    joinModal.setAttribute('hidden', ''); joinModal.style.display = 'none';
  });
  document.getElementById('join-class-btn').addEventListener('click', async () => {
    const invite_code = document.getElementById('invite-code-input').value.trim();
    if (!invite_code) { alert('Introdu codul de invitație!'); return; }
    const res = await fetch('/api/classrooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ invite_code })
    });
    const data = await res.json();
    if (res.ok) {
      joinModal.setAttribute('hidden', ''); joinModal.style.display = 'none';
      await loadClassrooms();
    } else {
      alert(data.message || 'Cod invalid.');
    }
  });

  // Modal detaliu
  const classroomModal = document.getElementById('classroom-modal');
  const cmTitle = document.getElementById('cm-title');
  const cmHomeworkList = document.getElementById('cm-homework-list');
  const cmMaterialsList = document.getElementById('cm-materials-list');

  document.getElementById('cm-close').addEventListener('click', () => {
    classroomModal.setAttribute('hidden', ''); classroomModal.style.display = 'none';
  });
  document.querySelectorAll('.cm-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cm-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('cm-pane-teme').hidden = tab.dataset.tab !== 'teme';
      document.getElementById('cm-pane-cursuri').hidden = tab.dataset.tab !== 'cursuri';
    });
  });

  async function openClassroomModal(id, name) {
    cmTitle.textContent = name || 'Classroom';
    classroomModal.style.display = 'flex'; classroomModal.removeAttribute('hidden');

    const cls = lastLoadedClassrooms.find(c => String(c.id) === String(id));
    const homeworks = cls?.homeworks || [];
    cmHomeworkList.innerHTML = homeworks.length
      ? homeworks.map(hw => `<li data-hwid="${hw._id}" class="cm-homework-item" style="padding:10px; background:${hw.isCompleted ? '#f0fdf4' : '#f8fafc'}; border-radius:8px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;"><span>${hw.isCompleted ? '✅' : '📝'} ${escapeHTML(hw.title)} (+${hw.xpReward || 10} XP)</span>${hw.isCompleted ? '' : deadlineBadge(hw.dueDate)}</li>`).join('')
      : '<li style="color:#94a3b8;">Nicio temă momentan.</li>';

    const matRes = await fetch(`/api/classrooms/${id}/materials`, { headers: { 'Authorization': `Bearer ${token}` } });
    const materials = await matRes.json();
    cmMaterialsList.innerHTML = Array.isArray(materials) && materials.length
      ? materials.map(m => `<li style="padding:10px; background:#f8fafc; border-radius:8px; display:flex; justify-content:space-between;"><span>📄 ${escapeHTML(m.title)}</span><a href="${m.file_url}" target="_blank" style="color:#4f46e5; font-size:13px;">Deschide</a></li>`).join('')
      : '<li style="color:#94a3b8;">Niciun material încărcat.</li>';
  }

  cmHomeworkList.addEventListener('click', (e) => {
    const item = e.target.closest('.cm-homework-item');
    if (!item) return;
    window.location.href = `/dashboard-student.html?openHomework=${item.dataset.hwid}`;
  });

  loadClassrooms();
});

function escapeHTML(str) {
  return String(str || '').replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

function deadlineBadge(dueDate) {
  if (!dueDate) return '';
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffMs < 0) return `<span style="background:#fee2e2 !important; color:#b91c1c !important; font-size:10px; padding:2px 7px; border-radius:999px; font-weight:700; white-space:nowrap;">Expirată</span>`;
  if (diffDays <= 2) return `<span style="background:#fef3c7 !important; color:#b45309 !important; font-size:10px; padding:2px 7px; border-radius:999px; font-weight:700; white-space:nowrap;">Expiră ${diffDays === 0 ? 'azi' : `în ${diffDays}z`}</span>`;
  return `<span style="background:#e0e7ff !important; color:#4338ca !important; font-size:10px; padding:2px 7px; border-radius:999px; font-weight:700; white-space:nowrap;">${diffDays}z rămase</span>`;
}
