// frontend/public/js/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  if (!savedUser || !token) {
    window.location.href = '/login.html';
    return;
  }

  const user = JSON.parse(savedUser);

  // Sanitizare rol utilizator
  const normalizedRole = (user.role || '').toLowerCase();
  const isTeacher = normalizedRole === 'teacher' || normalizedRole === 'profesor';
  const isStudent = !isTeacher;
   let lastLoadedClassrooms = [];

  // Populare date utilizator în UI
  const welcomeH2 = document.querySelector('.welcome-banner h2');
  if (welcomeH2) welcomeH2.textContent = `Bun venit, ${user.name || user.username || user.email}! 👋`;

  const userNameEl = document.querySelector('.user-name');
  if (userNameEl) userNameEl.textContent = user.name || user.username || user.email;

  const userRoleEl = document.querySelector('.user-role');
  if (userRoleEl) userRoleEl.textContent = user.role;

  // Gestionare vizibilitate butoane creare clase
  const createBtns = ['creeaza_classroom1', 'creeaza_classroom2', 'creeaza_classroom3'];
  createBtns.forEach(id => {
    const btn = document.getElementById(id);
    if (btn && isStudent) {
      btn.style.display = 'none';
    }
  });

  // Încărcare inițială clase
  loadClassrooms();

  // Modale & Elemente DOM
  const modal = document.getElementById('create-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  const saveBtn = document.getElementById('save-class-btn');

  // Deschidere modal creare (profesori)
  if (isTeacher) {
    createBtns.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          if (modal) modal.removeAttribute('hidden');
        });
      }
    });
  }

  // Închidere modal
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.setAttribute('hidden', ''));
  }

  // 1. CREARE CLASĂ (POST /api/classrooms)
  if (saveBtn && isTeacher) {
    saveBtn.addEventListener('click', async () => {
      const titleInput = document.getElementById('class-title');
      const descInput = document.getElementById('class-desc');

      const title = titleInput ? titleInput.value.trim() : '';
      const description = descInput ? descInput.value.trim() : '';

      if (!title) {
        alert('Te rugăm să introduci un nume pentru clasă!');
        return;
      }

      try {
        const currentToken = localStorage.getItem('token');
        const response = await fetch('/api/classrooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify({ title, description })
        });

        const data = await response.json();

        if (response.ok) {
          if (titleInput) titleInput.value = '';
          if (descInput) descInput.value = '';
          if (modal) modal.setAttribute('hidden', '');
          await loadClassrooms();
        } else {
          alert(data.message || data.error || 'Eroare la crearea clasei.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        alert('Eroare la conectarea cu serverul.');
      }
    });
  }

  // 2. ÎNSCRIERE ÎN CLASĂ PENTRU ELEVI (POST /api/classrooms/join)
  const joinBtn = document.getElementById('join-class-btn');
  if (joinBtn && isStudent) {
    joinBtn.addEventListener('click', async () => {
      const codeInput = document.getElementById('invite-code-input');
      const invite_code = codeInput ? codeInput.value.trim() : '';

      if (!invite_code) {
        alert('Introdu codul de invitație!');
        return;
      }

      try {
        const currentToken = localStorage.getItem('token');
        const response = await fetch('/api/classrooms/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify({ invite_code })
        });

        const data = await response.json();

        if (response.ok) {
          if (codeInput) codeInput.value = '';
          const joinModal = document.getElementById('join-modal');
          if (joinModal) joinModal.setAttribute('hidden', '');
          await loadClassrooms();
        } else {
          alert(data.message || 'Cod invalid sau eroare la înscriere.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        alert('Eroare la conectarea cu serverul.');
      }
    });
  }

  // 3. PRELUARE CLASE (GET /api/classrooms)
  async function loadClassrooms() {
    try {
      const currentToken = localStorage.getItem('token');
      const response = await fetch('/api/classrooms', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        }
      });

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/login.html';
        return;
      }

      if (!response.ok) {
        console.warn(`Nu s-au putut încărca clasele. Status: ${response.status}`);
        return;
      }

      const classrooms = await response.json();
      lastLoadedClassrooms = classrooms;
      renderClassrooms(classrooms);

    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  }

 // 4. RANDARE CLASE ÎN DOM
function renderClassrooms(classrooms) {
  const container = document.querySelector('.classrooms-grid') || 
                    document.querySelector('.classes-container') || 
                    document.getElementById('classrooms-container');
  const emptyState = document.querySelector('.empty-state');

  if (!container) return;

  if (!Array.isArray(classrooms) || classrooms.length === 0) {
    if (emptyState) emptyState.style.display = '';
    container.innerHTML = '';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  const typeLabels = {
    liceu: '🏫 Liceu',
    optional: '✨ Opțional',
    club: '🎯 Club',
    bacalaureat: '🎓 Bacalaureat'
  };

  container.innerHTML = classrooms.map(c => `
    <div class="class-card" data-id="${c.id}" data-name="${escapeHTML(c.name || c.title || '')}" style="
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    ">
      <span style="font-size: 12px; font-weight: 600; color: #6366f1; text-transform: uppercase; letter-spacing: 0.03em;">
        ${typeLabels[c.type] || c.type || ''}
      </span>
      <h3 style="margin: 0; font-size: 17px; color: #1e293b;">
        ${escapeHTML(c.name || c.title || 'Clasă fără nume')}
      </h3>
      <div style="
        margin-top: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 1px solid #f1f5f9;
        padding-top: 10px;
      ">
        <span style="font-size: 13px; color: #64748b;">Cod invitație</span>
        <strong style="
          font-family: monospace;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 13px;
          color: #4f46e5;
          letter-spacing: 0.05em;
        ">${escapeHTML(c.invite_code || '—')}</strong>
      </div>
    </div>
  `).join('');
}
 // 5. MODAL CLASSROOM (click pe card)
  const classroomModal = document.getElementById('classroom-modal');
  const cmClose = document.getElementById('cm-close');
  const cmTitle = document.getElementById('cm-title');
  const cmHomeworkList = document.getElementById('cm-homework-list');
  const cmMaterialsList = document.getElementById('cm-materials-list');
  const cmTeacherUpload = document.getElementById('cm-teacher-upload');
  const cmUploadBtn = document.getElementById('cm-upload-btn');

  let currentClassroomId = null;

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.class-card');
    if (card) openClassroomModal(card.dataset.id, card.dataset.name);
  });

  if (cmClose) cmClose.addEventListener('click', () => classroomModal.setAttribute('hidden', ''));

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
    cmTeacherUpload.hidden = !isTeacher;
    cmAddHomeworkBtn.hidden = !isTeacher;
    classroomModal.removeAttribute('hidden');

    // Teme — le luăm din datele deja încărcate (classrooms cu homeworks)
    const cls = lastLoadedClassrooms.find(c => String(c.id) === String(id));
    const homeworks = cls?.homeworks || [];
    cmHomeworkList.innerHTML = homeworks.length
      ? homeworks.map(hw => `
          <li data-hwid="${hw._id}" class="cm-homework-item" style="padding:10px; background:#f8fafc; border-radius:8px; cursor:pointer; transition:background 0.15s ease;">
            📝 ${escapeHTML(hw.title)} (+${hw.xpReward || 10} XP)
          </li>`).join('')
      : '<li style="color:#94a3b8;">Nicio temă momentan.</li>';

    // Materiale
    await loadMaterials(id);
  }

  async function loadMaterials(classroomId) {
    try {
      const currentToken = localStorage.getItem('token');
      const res = await fetch(`/api/classrooms/${classroomId}/materials`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      const materials = await res.json();

      cmMaterialsList.innerHTML = Array.isArray(materials) && materials.length
        ? materials.map(m => `
            <li style="padding:10px; background:#f8fafc; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
              <span>📄 ${escapeHTML(m.title)}</span>
              <a href="${m.file_url}" target="_blank" style="color:#4f46e5; font-size:13px;">Deschide</a>
            </li>`).join('')
        : '<li style="color:#94a3b8;">Niciun material încărcat.</li>';
    } catch (err) {
      console.error('Eroare la încărcarea materialelor:', err);
    }
  }

  if (cmUploadBtn) {
    cmUploadBtn.addEventListener('click', async () => {
      const titleInput = document.getElementById('cm-material-title');
      const fileInput = document.getElementById('cm-material-file');

      if (!titleInput.value.trim() || !fileInput.files[0]) {
        alert('Completează titlul și alege un fișier.');
        return;
      }

      const formData = new FormData();
      formData.append('title', titleInput.value.trim());
      formData.append('file', fileInput.files[0]);

      try {
        const currentToken = localStorage.getItem('token');
        const res = await fetch(`/api/classrooms/${currentClassroomId}/materials`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${currentToken}` },
          body: formData
        });
        const data = await res.json();

        if (res.ok) {
          titleInput.value = '';
          fileInput.value = '';
          await loadMaterials(currentClassroomId);
        } else {
          alert(data.message || 'Eroare la încărcarea materialului.');
        }
      } catch (err) {
        console.error(err);
        alert('Eroare la conectarea cu serverul.');
      }
    });
  }

   // 6. ADĂUGARE TEMĂ (POST /api/homeworks)
  const addHomeworkModal = document.getElementById('add-homework-modal');
  const cmAddHomeworkBtn = document.getElementById('cm-add-homework-btn');
  const hwCancelBtn = document.getElementById('hw-cancel-btn');
  const hwSaveBtn = document.getElementById('hw-save-btn');

  if (cmAddHomeworkBtn) {
    cmAddHomeworkBtn.addEventListener('click', () => {
      document.getElementById('hw-title').value = '';
      document.getElementById('hw-description').value = '';
      document.getElementById('hw-xp').value = 10;
      document.getElementById('hw-deadline').value = '';
      addHomeworkModal.removeAttribute('hidden');
    });
  }

  if (hwCancelBtn) {
    hwCancelBtn.addEventListener('click', () => addHomeworkModal.setAttribute('hidden', ''));
  }

  if (hwSaveBtn) {
    hwSaveBtn.addEventListener('click', async () => {
      const title = document.getElementById('hw-title').value.trim();
      const description = document.getElementById('hw-description').value.trim();
      const xpReward = parseInt(document.getElementById('hw-xp').value, 10) || 10;
      const dueDate = document.getElementById('hw-deadline').value;

      if (!title || !dueDate) {
        alert('Titlul și termenul limită sunt obligatorii.');
        return;
      }

      try {
        const currentToken = localStorage.getItem('token');
        const res = await fetch('/api/homeworks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify({
            title,
            description,
            dueDate: new Date(dueDate).toISOString(),
            classroomId: currentClassroomId,
            xpReward,
            isCodingTask: true
          })
        });

        const data = await res.json();

        if (res.ok) {
          addHomeworkModal.setAttribute('hidden', '');
          await loadClassrooms();
          openClassroomModal(currentClassroomId, cmTitle.textContent);
        } else {
          alert(data.message || 'Eroare la crearea temei.');
        }
      } catch (err) {
        console.error(err);
        alert('Eroare la conectarea cu serverul.');
      }
    });
  }

  // Click pe o temă → deschide compilatorul cu datele ei
  if (cmHomeworkList) {
    cmHomeworkList.addEventListener('click', (e) => {
      const item = e.target.closest('.cm-homework-item');
      if (!item) return;
      classroomModal.setAttribute('hidden', '');
      if (typeof window.openEditorWithHomework === 'function') {
        window.openEditorWithHomework(item.dataset.hwid);
      }
    });
  }

});

 
function escapeHTML(str) {
  return String(str || '').replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}