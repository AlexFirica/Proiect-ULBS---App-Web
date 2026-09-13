document.addEventListener('DOMContentLoaded', () => {
  // 1. Verificare autentificare locală
  const savedUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  if (!savedUser || !token) {
    window.location.href = '/login.html';
    return;
  }

  const user = JSON.parse(savedUser);

  // Populare date utilizator în UI
  const welcomeH2 = document.querySelector('.welcome-banner h2');
  if (welcomeH2) welcomeH2.textContent = `Bun venit, ${user.name || user.username || user.email}! 👋`;

  const userNameEl = document.querySelector('.user-name');
  if (userNameEl) userNameEl.textContent = user.name || user.username || user.email;

  const userRoleEl = document.userRole || document.querySelector('.user-role');
  if (userRoleEl) userRoleEl.textContent = user.role;

  // 2. Încărcare inițială clasa
  loadClassrooms();

  // 3. Gestionare Modal Creare Clasă
  const modal = document.getElementById('create-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  const saveBtn = document.getElementById('save-class-btn');

  const triggersID = ['creeaza_classroom1', 'creeaza_classroom2', 'creeaza_classroom3'];
  triggersID.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        if (modal) modal.removeAttribute('hidden');
      });
    }
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.setAttribute('hidden', '');
    });
  }

  // 4. Salvare clasă nouă
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const titleInput = document.getElementById('class-title');
      const descInput = document.getElementById('class-desc');

      const title = titleInput.value.trim();
      const description = descInput.value.trim();

      if (!title) {
        alert('Te rugăm să introduci un nume pentru clasă!');
        return;
      }

      try {
        const response = await fetch('/api/classrooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // ✅ Adăugat Header Authorization
          },
          body: JSON.stringify({
            title: title,
            description: description,
            teacherId: user.id
          })
        });

        const data = await response.json();

        if (response.ok) {
          titleInput.value = '';
          descInput.value = '';
          if (modal) modal.setAttribute('hidden', '');
          loadClassrooms();
        } else {
          alert(data.message || data.error || 'Eroare la crearea clasei.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        alert('Eroare la conectarea cu serverul.');
      }
    });
  }

  // 5. Funcție citire clase din Backend
  async function loadClassrooms() {
    try {
      const currentToken = localStorage.getItem('token');
      const response = await fetch('/api/classrooms', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}` // ✅ Trimitem Token-ul salvat la login
        }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        window.location.href = '/login.html';
        return;
      }

      if (!response.ok) {
        throw new Error(`Eroare HTTP: ${response.status}`);
      }

      const classrooms = await response.json();
      console.log('Clase încărcate cu succes:', classrooms);

    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  }
});

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}