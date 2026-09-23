// frontend/public/js/dashboard-teacher.js
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

  if (!isTeacher) {
    window.location.href = '/dashboard-student.html';
    return;
  }

  let lastLoadedClassrooms = [];
  let currentClassroomId = null;

  renderSidebar('teacher', 'dashboard');

  // ─── Populare date utilizator ───────────────────────────────
  const welcomeH2 = document.querySelector('.welcome-banner h2');
  if (welcomeH2) welcomeH2.textContent = `Bun venit, ${user.name || user.email}! 👋`;
  const userNameEl = document.querySelector('.user-name');
  if (userNameEl) userNameEl.textContent = user.name || user.email;
  const userRoleEl = document.querySelector('.user-role');
  if (userRoleEl) userRoleEl.textContent = 'profesor';

  // ─── Modal creare classroom ──────────────────────────────────
  const createModal = document.getElementById('create-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const saveBtn = document.getElementById('save-class-btn');

  ['creeaza_classroom1', 'creeaza_classroom2', 'creeaza_classroom3'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => {
      createModal.style.display = 'flex';
      createModal.removeAttribute('hidden');
    });
  });

  if (closeModalBtn) closeModalBtn.addEventListener('click', () => {
    createModal.setAttribute('hidden', '');
    createModal.style.display = 'none';
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const titleInput = document.getElementById('class-title');
      const typeInput = document.getElementById('class-type');
      const title = titleInput.value.trim();
      const type = typeInput.value;

      if (!title) {
        showToast('Te rugăm să introduci un nume pentru clasă!', 'error');
        return;
      }

      try {
        const res = await fetch('/api/classrooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title, type })
        });
        const data = await res.json();
        if (res.ok) {
          titleInput.value = '';
          createModal.setAttribute('hidden', '');
          createModal.style.display = 'none';
          await loadClassrooms();
          showToast('Classroom creat cu succes!', 'success');
        } else {
          showToast(data.message || data.error || 'Eroare la crearea clasei.', 'error');
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
    const totalClassrooms = classrooms.length;
    const totalHomeworks = classrooms.reduce((acc, c) => acc + (c.homeworks?.length || 0), 0);
    const totalStudents = classrooms.reduce((acc, c) => acc + (c.studentCount || 0), 0);

    const elClassrooms = document.getElementById('stat-total-classrooms');
    const elHomeworks = document.getElementById('stat-active-homeworks');
    const elStudents = document.getElementById('stat-total-students');
    if (elClassrooms) elClassrooms.textContent = totalClassrooms;
    if (elHomeworks) elHomeworks.textContent = totalHomeworks;
    if (elStudents) elStudents.textContent = totalStudents;
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

    container.innerHTML = classrooms.map(c => `
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
        </h3>
        <div style="font-size:12px; color:#94a3b8;">${c.studentCount || 0} elevi înscriși</div>
        <div style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 10px;">
          <span style="font-size: 13px; color: #64748b;">Cod invitație</span>
          <strong style="font-family: monospace; background: #f1f5f9 !important; padding: 4px 8px; border-radius: 6px; font-size: 13px; color: #4f46e5 !important; letter-spacing: 0.05em;">${escapeHTML(c.invite_code || '—')}</strong>
        </div>
      </div>
    `).join('');
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.class-card');
    if (card) openClassroomModal(card.dataset.id, card.dataset.name);
  });

  // ─── Modal detaliu classroom ─────────────────────────────────
  const classroomModal = document.getElementById('classroom-modal');
  const cmClose = document.getElementById('cm-close');
  const cmTitle = document.getElementById('cm-title');
  const cmInviteCode = document.getElementById('cm-invite-code');
  const cmHomeworkList = document.getElementById('cm-homework-list');
  const cmMaterialsList = document.getElementById('cm-materials-list');
  const cmUploadBtn = document.getElementById('cm-upload-btn');
  const cmXpLabel = document.getElementById('cm-xp-label');
  const cmXpBar = document.getElementById('cm-xp-bar');
  const cmStudentsTbody = document.getElementById('cm-students-tbody');
  const cmStudentsEmpty = document.getElementById('cm-students-empty');

  if (cmClose) cmClose.addEventListener('click', () => {
    classroomModal.setAttribute('hidden', '');
    classroomModal.style.display = 'none';
  });

  const cmDeleteClassroomBtn = document.getElementById('cm-delete-classroom-btn');
  if (cmDeleteClassroomBtn) {
    cmDeleteClassroomBtn.addEventListener('click', async () => {
      if (!confirm('Sigur vrei să ștergi acest classroom? Toate temele și materialele asociate vor rămâne, dar clasa dispare definitiv. Acțiunea nu poate fi anulată.')) return;
      try {
        const res = await fetch(`/api/classrooms/${currentClassroomId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          showToast('Classroom șters cu succes.', 'success');
          classroomModal.setAttribute('hidden', '');
          classroomModal.style.display = 'none';
          await loadClassrooms();
        } else {
          const data = await res.json();
          showToast(data.message || 'Eroare la ștergerea classroom-ului.', 'error');
        }
      } catch (err) {
        showToast('Eroare la conectarea cu serverul.', 'error');
      }
    });
  }

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
    classroomModal.style.display = 'flex';
    classroomModal.removeAttribute('hidden');

    const cls = lastLoadedClassrooms.find(c => String(c.id) === String(id));
    cmInviteCode.textContent = cls?.invite_code ? `Cod invitație: ${cls.invite_code}` : '';
    const copyBtn = document.getElementById('cm-copy-code-btn');
    if (cls?.invite_code) {
      copyBtn.style.display = 'inline-block';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(cls.invite_code).then(() => {
          copyBtn.textContent = '✅ Copiat!';
          setTimeout(() => { copyBtn.textContent = '📋 Copiază'; }, 1500);
        });
      };
    } else {
      copyBtn.style.display = 'none';
    }

    const homeworks = cls?.homeworks || [];
    cmHomeworkList.innerHTML = homeworks.length
      ? homeworks.map(hw => `
          <li data-hwid="${hw._id}" class="cm-homework-item" style="padding:10px; background:#f8fafc; border-radius:8px; cursor:pointer; transition:background 0.15s ease; display:flex; justify-content:space-between; align-items:center;">
            <span>📝 ${escapeHTML(hw.title)} (+${hw.xpReward || 10} XP)</span>
            <span style="display:flex; align-items:center; gap:8px;">
              ${deadlineBadge(hw.dueDate)}
              <button class="delete-homework-btn" data-hwid="${hw._id}" title="Șterge tema" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:14px;">🗑️</button>
            </span>
          </li>`).join('')
      : '<li style="color:#94a3b8;">Nicio temă momentan.</li>';

    await loadMaterials(id);
    await loadStudents(id);
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

  async function loadStudents(classroomId) {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const students = await res.json();

      if (!Array.isArray(students) || students.length === 0) {
        cmStudentsTbody.innerHTML = '';
        cmStudentsEmpty.style.display = '';
        cmXpLabel.textContent = '0 XP';
        cmXpBar.style.width = '0%';
        return;
      }
      cmStudentsEmpty.style.display = 'none';

      const sortedStudents = [...students].sort((a, b) => (b.xp || 0) - (a.xp || 0));
      const medals = ['🥇', '🥈', '🥉'];

      const totalXp = sortedStudents.reduce((acc, s) => acc + (s.xp || 0), 0);
      const target = sortedStudents.length * 100;
      const pct = target > 0 ? Math.min(100, Math.round((totalXp / target) * 100)) : 0;
      cmXpLabel.textContent = `${totalXp} XP (clasă)`;
      cmXpBar.style.width = `${pct}%`;

      cmStudentsTbody.innerHTML = sortedStudents.map((s, i) => `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:8px 6px;">${medals[i] || `#${i + 1}`} ${escapeHTML(s.name || s.email)}</td>
          <td style="padding:8px 6px;">${s.xp || 0} XP</td>
          <td style="padding:8px 6px;">Nivel ${Math.floor((s.xp || 0) / 100) + 1}</td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Eroare la încărcarea elevilor:', err);
    }
  }

  if (cmUploadBtn) {
    cmUploadBtn.addEventListener('click', async () => {
      const titleInput = document.getElementById('cm-material-title');
      const fileInput = document.getElementById('cm-material-file');
      if (!titleInput.value.trim() || !fileInput.files[0]) {
        showToast('Completează titlul și alege un fișier.', 'error');
        return;
      }
      const formData = new FormData();
      formData.append('title', titleInput.value.trim());
      formData.append('file', fileInput.files[0]);

      try {
        const res = await fetch(`/api/classrooms/${currentClassroomId}/materials`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          titleInput.value = '';
          fileInput.value = '';
          await loadMaterials(currentClassroomId);
          showToast('Material încărcat cu succes!', 'success');
        } else {
          showToast(data.message || 'Eroare la încărcarea materialului.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Eroare la conectarea cu serverul.', 'error');
      }
    });
  }

  const quickAddMaterialBtn = document.getElementById('quick-add-material-btn');
  if (quickAddMaterialBtn) {
    quickAddMaterialBtn.addEventListener('click', () => {
      showToast('Deschide un classroom și mergi la tab-ul „Cursuri” pentru a încărca un material.', 'info');
    });
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

  // ─── Adăugare temă ───────────────────────────────────────────
  const addHomeworkModal = document.getElementById('add-homework-modal');
  const cmAddHomeworkBtn = document.getElementById('cm-add-homework-btn');
  const hwCancelBtn = document.getElementById('hw-cancel-btn');
  const hwSaveBtn = document.getElementById('hw-save-btn');

  if (cmAddHomeworkBtn) {
    cmAddHomeworkBtn.addEventListener('click', () => {
      document.getElementById('hw-title').value = '';
      document.getElementById('hw-description').value = '';
      document.getElementById('hw-testinput').value = '';
      document.getElementById('hw-expectedoutput').value = '';
      document.getElementById('hw-xp').value = 10;
      document.getElementById('hw-deadline').value = '';
      addHomeworkModal.style.display = 'flex';
      addHomeworkModal.removeAttribute('hidden');
    });
  }

  if (hwCancelBtn) {
    hwCancelBtn.addEventListener('click', () => {
      addHomeworkModal.setAttribute('hidden', '');
      addHomeworkModal.style.display = 'none';
    });
  }

  if (hwSaveBtn) {
    hwSaveBtn.addEventListener('click', async () => {
      const title = document.getElementById('hw-title').value.trim();
      const description = document.getElementById('hw-description').value.trim();
      const testInput = document.getElementById('hw-testinput').value;
      const expectedOutput = document.getElementById('hw-expectedoutput').value;
      const xpReward = parseInt(document.getElementById('hw-xp').value, 10) || 10;
      const dueDate = document.getElementById('hw-deadline').value;

      if (!title || !dueDate) {
        showToast('Titlul și termenul limită sunt obligatorii.', 'error');
        return;
      }

      try {
        const res = await fetch('/api/homeworks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title, description,
            dueDate: new Date(dueDate).toISOString(),
            classroomId: currentClassroomId,
            xpReward, testInput, expectedOutput,
            isCodingTask: true
          })
        });
        const data = await res.json();
        if (res.ok) {
          addHomeworkModal.setAttribute('hidden', '');
          addHomeworkModal.style.display = 'none';
          await loadClassrooms();
          openClassroomModal(currentClassroomId, cmTitle.textContent);
          showToast('Tema a fost adăugată!', 'success');
        } else {
          showToast(data.message || 'Eroare la crearea temei.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Eroare la conectarea cu serverul.', 'error');
      }
    });
  }

  if (cmHomeworkList) {
    cmHomeworkList.addEventListener('click', async (e) => {
      const deleteBtn = e.target.closest('.delete-homework-btn');
      if (deleteBtn) {
        e.stopPropagation();
        if (!confirm('Sigur vrei să ștergi această temă? Acțiunea nu poate fi anulată.')) return;
        try {
          const res = await fetch(`/api/homeworks/${deleteBtn.dataset.hwid}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            showToast('Tema a fost ștearsă.', 'success');
            await loadClassrooms();
            openClassroomModal(currentClassroomId, cmTitle.textContent);
          } else {
            const data = await res.json();
            showToast(data.message || 'Eroare la ștergerea temei.', 'error');
          }
        } catch (err) {
          showToast('Eroare la conectarea cu serverul.', 'error');
        }
        return;
      }

      const item = e.target.closest('.cm-homework-item');
      if (!item) return;
      classroomModal.setAttribute('hidden', '');
      classroomModal.style.display = 'none';
      if (typeof window.openEditorWithHomework === 'function') {
        window.openEditorWithHomework(item.dataset.hwid);
      }
    });
  }

  loadClassrooms();
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

  if (diffMs < 0) {
    return `<span style="background:#fee2e2 !important; color:#b91c1c !important; font-size:10px; padding:2px 7px; border-radius:999px; font-weight:700; white-space:nowrap;">Expirată</span>`;
  }
  if (diffDays <= 2) {
    return `<span style="background:#fef3c7 !important; color:#b45309 !important; font-size:10px; padding:2px 7px; border-radius:999px; font-weight:700; white-space:nowrap;">Expiră ${diffDays === 0 ? 'azi' : `în ${diffDays}z`}</span>`;
  }
  return `<span style="background:#e0e7ff !important; color:#4338ca !important; font-size:10px; padding:2px 7px; border-radius:999px; font-weight:700; white-space:nowrap;">${diffDays}z rămase</span>`;
}
