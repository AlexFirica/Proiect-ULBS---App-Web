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
    <div class="class-card" data-id="${c.id}" style="
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
});

function escapeHTML(str) {
  return String(str || '').replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}