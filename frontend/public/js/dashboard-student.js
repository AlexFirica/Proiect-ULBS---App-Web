// frontend/public/js/dashboard-student.js
document.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  if (!savedUser || !token) {
    window.location.href = '/login.html';
    return;
  }

  const user = JSON.parse(savedUser);
  const normalizedRole = (user.role || '').toLowerCase();
  const isTeacher = normalizedRole === 'teacher' || normalizedRole === 'profesor';

  if (isTeacher) {
    window.location.href = '/dashboard-teacher.html';
    return;
  }

  let lastLoadedClassrooms = [];
  let currentClassroomId = null;

  renderSidebar('student', 'dashboard');

  // ─── Populare date utilizator ───────────────────────────────
  const welcomeH2 = document.querySelector('.welcome-banner h2');
  if (welcomeH2) welcomeH2.textContent = `Bun venit, ${user.name || user.email}! 👋`;
  const userNameEl = document.querySelector('.user-name');
  if (userNameEl) userNameEl.textContent = user.name || user.email;
  const userRoleEl = document.querySelector('.user-role');
  if (userRoleEl) userRoleEl.textContent = 'elev';

  async function refreshUserData() {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        Object.assign(user, data.user);
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err) {
      console.error('Eroare la actualizarea datelor utilizatorului:', err);
    }
  }

  // ─── Modal înscriere în clasă ─────────────────────────────────
  const joinModal = document.getElementById('join-modal');
  const joinModalCloseBtn = document.getElementById('join-modal-close');
  const joinClassBtn = document.getElementById('join-class-btn');

  function openJoinModal() {
    document.getElementById('invite-code-input').value = '';
    joinModal.style.display = 'flex';
    joinModal.removeAttribute('hidden');
  }

  ['open-join-modal-btn', 'open-join-modal-btn-2', 'quick-join-btn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', openJoinModal);
  });

  if (joinModalCloseBtn) {
    joinModalCloseBtn.addEventListener('click', () => {
      joinModal.setAttribute('hidden', '');
      joinModal.style.display = 'none';
    });
  }

  if (joinClassBtn) {
    joinClassBtn.addEventListener('click', async () => {
      const codeInput = document.getElementById('invite-code-input');
      const invite_code = codeInput.value.trim();
      if (!invite_code) {
        showToast('Introdu codul de invitație!', 'error');
        return;
      }
      try {
        const res = await fetch('/api/classrooms/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ invite_code })
        });
        const data = await res.json();
        if (res.ok) {
          codeInput.value = '';
          joinModal.setAttribute('hidden', '');
          joinModal.style.display = 'none';
          await loadClassrooms();
          showToast('Te-ai înscris cu succes în clasă!', 'success');
        } else {
          showToast(data.message || 'Cod invalid sau eroare la înscriere.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Eroare la conectarea cu serverul.', 'error');
      }
    });
  }

  // ─── Preluare + randare classrooms ───────────────────────────
  function showSkeletons() {
    const container = document.getElementById('classrooms-grid');
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) emptyState.style.display = 'none';
    if (container) {
      container.innerHTML = Array(3).fill('<div class="skeleton-card"></div>').join('');
    }
  }

  async function loadClassrooms() {
    showSkeletons();
    try {
      const res = await fetch('/api/classrooms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.clear();
        window.location.href = '/login.html';
        return;
      }
      if (!res.ok) return;
      const classrooms = await res.json();
      lastLoadedClassrooms = classrooms;
      renderClassrooms(classrooms);
      renderStats(classrooms);
    } catch (err) {
      console.error('Eroare la încărcarea claselor:', err);
    }
  }
  window.reloadClassrooms = loadClassrooms;

  function renderStats(classrooms) {
    let pending = 0, completed = 0;
    classrooms.forEach(c => {
      (c.homeworks || []).forEach(hw => {
        if (hw.isCompleted) completed++; else pending++;
      });
    });
    const elClassrooms = document.getElementById('stat-total-classrooms');
    const elPending = document.getElementById('stat-pending-homeworks');
    const elCompleted = document.getElementById('stat-completed-homeworks');
    if (elClassrooms) elClassrooms.textContent = classrooms.length;
    if (elPending) elPending.textContent = pending;
    if (elCompleted) elCompleted.textContent = completed;

    const totalXp = user.xp || 0;
    const elTotalXp = document.getElementById('stat-total-xp');
    if (elTotalXp) elTotalXp.textContent = totalXp;

    const level = Math.floor(totalXp / 100) + 1;
    const xpIntoLevel = totalXp % 100;
    const levelLabel = document.getElementById('student-level-label');
    const xpBar = document.getElementById('student-xp-bar');
    const xpLabel = document.getElementById('student-xp-label');
    if (levelLabel) levelLabel.textContent = `Nivel ${level}`;
    if (xpBar) xpBar.style.width = `${xpIntoLevel}%`;
    if (xpLabel) xpLabel.textContent = `${totalXp} XP total (${xpIntoLevel}/100 spre nivelul ${level + 1})`;
  }

  const typeLabels = {
    liceu: '🏫 Liceu',
    optional: '✨ Opțional',
    facultate: '🏫 Facultate',
    bacalaureat: '🎓 Bacalaureat'
  };

  function renderClassrooms(classrooms) {
    const container = document.getElementById('classrooms-grid');
    const emptyState = document.querySelector('.empty-state');
    if (!container) return;

    if (!Array.isArray(classrooms) || classrooms.length === 0) {
      if (emptyState) emptyState.style.display = '';
      container.innerHTML = '';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = classrooms.map(c => {
      const pendingCount = c.pendingCount ?? (c.homeworks || []).filter(h => !h.isCompleted).length;
      return `
      <div class="class-card" data-id="${c.id}" data-name="${escapeHTML(c.name || c.title || '')}" style="
        background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px;
        display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        cursor: pointer; transition: transform 0.18s ease, box-shadow 0.18s ease;
      ">
        <span style="font-size: 12px; font-weight: 600; color: #6366f1; text-transform: uppercase; letter-spacing: 0.03em;">
          ${typeLabels[c.type] || c.type || ''}
        </span>
        <h3 style="margin: 0; font-size: 17px; color: #1e293b; display:flex; align-items:center; justify-content:space-between;">
          ${escapeHTML(c.name || c.title || 'Clasă fără nume')}
          ${pendingCount > 0
            ? `<span style="background:#fef3c7 !important; color:#b45309 !important; font-size:11px; padding:3px 8px; border-radius:999px; font-weight:700;">${pendingCount} de rezolvat</span>`
            : `<span style="background:#dcfce7 !important; color:#15803d !important; font-size:11px; padding:3px 8px; border-radius:999px; font-weight:700;">✓ La zi</span>`}
        </h3>
      </div>
    `;
    }).join('');
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.class-card');
    if (card) openClassroomModal(card.dataset.id, card.dataset.name);
  });

  // ─── Modal detaliu classroom ─────────────────────────────────
  const classroomModal = document.getElementById('classroom-modal');
  const cmClose = document.getElementById('cm-close');
  const cmTitle = document.getElementById('cm-title');
  const cmHomeworkList = document.getElementById('cm-homework-list');
  const cmMaterialsList = document.getElementById('cm-materials-list');

  if (cmClose) cmClose.addEventListener('click', () => {
    classroomModal.setAttribute('hidden', '');
    classroomModal.style.display = 'none';
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
    currentClassroomId = id;
    cmTitle.textContent = name || 'Classroom';
    classroomModal.style.display = 'flex';
    classroomModal.removeAttribute('hidden');

    const cls = lastLoadedClassrooms.find(c => String(c.id) === String(id));
    const homeworks = cls?.homeworks || [];
    cmHomeworkList.innerHTML = homeworks.length
      ? homeworks.map(hw => `
          <li data-hwid="${hw._id}" class="cm-homework-item" style="padding:10px; background:${hw.isCompleted ? '#f0fdf4' : '#f8fafc'}; border-radius:8px; cursor:pointer; transition:background 0.15s ease; display:flex; justify-content:space-between; align-items:center;">
            <span>${hw.isCompleted ? '✅' : '📝'} ${escapeHTML(hw.title)} (+${hw.xpReward || 10} XP)</span>
            ${hw.isCompleted ? '' : deadlineBadge(hw.dueDate)}
          </li>`).join('')
      : '<li style="color:#94a3b8;">Nicio temă momentan.</li>';

    await loadMaterials(id);
  }

  async function loadMaterials(classroomId) {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/materials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const materials = await res.json();
      cmMaterialsList.innerHTML = Array.isArray(materials) && materials.length
        ? materials.map(m => `
            <li class="cm-material-item" data-url="${m.file_url}" data-title="${escapeHTML(m.title)}" style="padding:10px; background:#f8fafc; border-radius:8px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
              <span>📄 ${escapeHTML(m.title)}</span>
              <span style="color:#4f46e5; font-size:13px;">Vizualizează →</span>
            </li>`).join('')
        : '<li style="color:#94a3b8;">Niciun material încărcat.</li>';
    } catch (err) {
      console.error('Eroare la încărcarea materialelor:', err);
    }
  }

  // ─── Vizualizare material ────────────────────────────────────
  const materialViewModal = document.getElementById('material-view-modal');
  const mvClose = document.getElementById('mv-close');
  const mvTitle = document.getElementById('mv-title');
  const mvBody = document.getElementById('mv-body');
  const mvDownload = document.getElementById('mv-download');

  if (cmMaterialsList) {
    cmMaterialsList.addEventListener('click', (e) => {
      const item = e.target.closest('.cm-material-item');
      if (!item) return;
      openMaterialViewer(item.dataset.url, item.dataset.title);
    });
  }

  function openMaterialViewer(url, title) {
    mvTitle.textContent = title || 'Material';
    mvDownload.href = url;
    const ext = (url.split('.').pop() || '').toLowerCase();

    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
      mvBody.innerHTML = `<img src="${url}" style="max-width:100%; display:block; margin:auto;">`;
    } else if (ext === 'pdf') {
      mvBody.innerHTML = `<iframe src="${url}" style="width:100%; height:100%; border:none;"></iframe>`;
    } else {
      mvBody.innerHTML = `<div style="padding:40px; text-align:center; color:#64748b;">
        Previzualizare indisponibilă pentru acest tip de fișier.<br><br>
        <a href="${url}" target="_blank" style="color:#4f46e5;">Deschide / descarcă fișierul</a>
      </div>`;
    }

    materialViewModal.style.display = 'flex';
    materialViewModal.removeAttribute('hidden');
  }

  if (mvClose) mvClose.addEventListener('click', () => {
    materialViewModal.setAttribute('hidden', '');
    materialViewModal.style.display = 'none';
    mvBody.innerHTML = '';
  });

  // ─── Click pe temă → compilator ───────────────────────────────
  if (cmHomeworkList) {
    cmHomeworkList.addEventListener('click', (e) => {
      const item = e.target.closest('.cm-homework-item');
      if (!item) return;
      classroomModal.setAttribute('hidden', '');
      classroomModal.style.display = 'none';
      if (typeof window.openEditorWithHomework === 'function') {
        window.openEditorWithHomework(item.dataset.hwid);
      }
    });
  }

  refreshUserData().then(loadClassrooms);

  // Deschidere automată a compilatorului dacă venim din pagina Classrooms
  const params = new URLSearchParams(window.location.search);
  const homeworkToOpen = params.get('openHomework');
  if (homeworkToOpen && typeof window.openEditorWithHomework === 'function') {
    setTimeout(() => window.openEditorWithHomework(homeworkToOpen), 300);
  }
});

function escapeHTML(str) {
  return String(str || '').replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
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
