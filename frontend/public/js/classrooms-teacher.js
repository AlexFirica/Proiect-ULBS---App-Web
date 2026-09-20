// frontend/public/js/classrooms-teacher.js
document.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  if (!savedUser || !token) { window.location.href = '/login.html'; return; }

  const user = JSON.parse(savedUser);
  document.querySelector('.user-name').textContent = user.name || user.email;
  document.querySelector('.user-role').textContent = 'profesor';

  let lastLoadedClassrooms = [];
  let currentClassroomId = null;

  const typeLabels = { liceu: '🏫 Liceu', optional: '✨ Opțional', club: '🎯 Club', bacalaureat: '🎓 Bacalaureat' };

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
      emptyState.style.display = '';
      container.innerHTML = '';
      return;
    }
    emptyState.style.display = 'none';
    container.innerHTML = classrooms.map(c => `
      <div class="class-card" data-id="${c.id}" data-name="${escapeHTML(c.name || c.title || '')}" style="
        background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px;
        display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        cursor: pointer; transition: transform 0.18s ease, box-shadow 0.18s ease;
      ">
        <span style="font-size: 12px; font-weight: 600; color: #6366f1; text-transform: uppercase;">${typeLabels[c.type] || c.type || ''}</span>
        <h3 style="margin: 0; font-size: 17px; color: #1e293b;">${escapeHTML(c.name || c.title || 'Clasă fără nume')}</h3>
        <div style="font-size:12px; color:#94a3b8;">${c.studentCount || 0} elevi înscriși</div>
        <div style="margin-top: 8px; display: flex; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 10px;">
          <span style="font-size: 13px; color: #64748b;">Cod invitație</span>
          <strong style="font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 13px; color: #4f46e5;">${escapeHTML(c.invite_code || '—')}</strong>
        </div>
      </div>
    `).join('');
  }
  document.getElementById('classrooms-grid').style.cssText += ';';

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.class-card');
    if (card) openClassroomModal(card.dataset.id, card.dataset.name);
  });

  // Modal creare
  const createModal = document.getElementById('create-modal');
  document.getElementById('creeaza_classroom1').addEventListener('click', () => {
    createModal.style.display = 'flex'; createModal.removeAttribute('hidden');
  });
  document.getElementById('close-modal-btn').addEventListener('click', () => {
    createModal.setAttribute('hidden', ''); createModal.style.display = 'none';
  });
  document.getElementById('save-class-btn').addEventListener('click', async () => {
    const title = document.getElementById('class-title').value.trim();
    const type = document.getElementById('class-type').value;
    if (!title) { alert('Introdu un nume pentru clasă!'); return; }
    const res = await fetch('/api/classrooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title, type })
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById('class-title').value = '';
      createModal.setAttribute('hidden', ''); createModal.style.display = 'none';
      await loadClassrooms();
    } else {
      alert(data.message || 'Eroare la crearea clasei.');
    }
  });

  // Modal detaliu
  const classroomModal = document.getElementById('classroom-modal');
  const cmTitle = document.getElementById('cm-title');
  const cmInviteCode = document.getElementById('cm-invite-code');
  const cmHomeworkList = document.getElementById('cm-homework-list');
  const cmMaterialsList = document.getElementById('cm-materials-list');
  const cmXpLabel = document.getElementById('cm-xp-label');
  const cmXpBar = document.getElementById('cm-xp-bar');
  const cmStudentsTbody = document.getElementById('cm-students-tbody');
  const cmStudentsEmpty = document.getElementById('cm-students-empty');

  document.getElementById('cm-close').addEventListener('click', () => {
    classroomModal.setAttribute('hidden', ''); classroomModal.style.display = 'none';
  });
  document.querySelectorAll('.cm-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cm-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('cm-pane-teme').hidden = tab.dataset.tab !== 'teme';
      document.getElementById('cm-pane-cursuri').hidden = tab.dataset.tab !== 'cursuri';
      document.getElementById('cm-pane-elevi').hidden = tab.dataset.tab !== 'elevi';
    });
  });

  async function openClassroomModal(id, name) {
    currentClassroomId = id;
    cmTitle.textContent = name || 'Classroom';
    classroomModal.style.display = 'flex'; classroomModal.removeAttribute('hidden');

    const cls = lastLoadedClassrooms.find(c => String(c.id) === String(id));
    cmInviteCode.textContent = cls?.invite_code ? `Cod invitație: ${cls.invite_code}` : '';
    const homeworks = cls?.homeworks || [];
    cmHomeworkList.innerHTML = homeworks.length
      ? homeworks.map(hw => `<li style="padding:10px; background:#f8fafc; border-radius:8px;">📝 ${escapeHTML(hw.title)} (+${hw.xpReward || 10} XP)</li>`).join('')
      : '<li style="color:#94a3b8;">Nicio temă momentan.</li>';

    const matRes = await fetch(`/api/classrooms/${id}/materials`, { headers: { 'Authorization': `Bearer ${token}` } });
    const materials = await matRes.json();
    cmMaterialsList.innerHTML = Array.isArray(materials) && materials.length
      ? materials.map(m => `<li style="padding:10px; background:#f8fafc; border-radius:8px; display:flex; justify-content:space-between;"><span>📄 ${escapeHTML(m.title)}</span><a href="${m.file_url}" target="_blank" style="color:#4f46e5; font-size:13px;">Deschide</a></li>`).join('')
      : '<li style="color:#94a3b8;">Niciun material încărcat.</li>';

    const stRes = await fetch(`/api/classrooms/${id}/students`, { headers: { 'Authorization': `Bearer ${token}` } });
    const students = await stRes.json();
    if (!Array.isArray(students) || students.length === 0) {
      cmStudentsTbody.innerHTML = ''; cmStudentsEmpty.style.display = '';
      cmXpLabel.textContent = '0 XP'; cmXpBar.style.width = '0%';
    } else {
      cmStudentsEmpty.style.display = 'none';
      const totalXp = students.reduce((a, s) => a + (s.xp || 0), 0);
      const pct = Math.min(100, Math.round((totalXp / (students.length * 100)) * 100));
      cmXpLabel.textContent = `${totalXp} XP (clasă)`;
      cmXpBar.style.width = `${pct}%`;
      cmStudentsTbody.innerHTML = students.map(s => `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:8px 6px;">${escapeHTML(s.name || s.email)}</td>
          <td style="padding:8px 6px;">${s.xp || 0} XP</td>
          <td style="padding:8px 6px;">Nivel ${Math.floor((s.xp || 0) / 100) + 1}</td>
        </tr>`).join('');
    }
  }

  loadClassrooms();
});

function escapeHTML(str) {
  return String(str || '').replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
