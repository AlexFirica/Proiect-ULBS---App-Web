document.addEventListener('DOMContentLoaded', () => {
  // 1. Authenticate & display user details
  const savedUser = localStorage.getItem('user');
  if (!savedUser) {
    window.location.href = '/login.html';
    return;
  }

  const user = JSON.parse(savedUser);
  document.querySelector('.welcome-banner h2').textContent = `Bun venit, ${user.username}! 👋`;
  document.querySelector('.user-name').textContent = user.username;
  document.querySelector('.user-role').textContent = user.role;
loadClassrooms(user.id);
  
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

  // 4. Attach Close Modal Listener
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.setAttribute('hidden', '');
    });
  }

  // 5. Submit Form to Backend
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title,
            description: description,
            teacherId: user.id
          })
        });

        const data = await response.json();
        console.log(data);

       if (response.ok) {
  titleInput.value = '';
  descInput.value = '';
  modal.setAttribute('hidden', '');
  loadClassrooms(user.id);   // reface lista fără să reîncarce toată pagina
}
        
        else {
          alert(data.error || 'Eroare la crearea clasei.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        alert('Eroare la conectarea cu serverul.');
      }
    });
  }
  async function loadClassrooms(teacherId) {
  if (!teacherId) return;

  try {
    const response = await fetch(`/api/classrooms/${teacherId}`);
    const data = await response.json();

    const emptyState = document.querySelector('.empty-state');
    const gridContainer = document.getElementById('classrooms-grid');

    if (!data.success || !data.classrooms || data.classrooms.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (gridContainer) gridContainer.innerHTML = '';
      return;
    }

    // Hide empty state if classes are returned
    if (emptyState) emptyState.style.display = 'none';

    // Update total classroom count stat card dynamically
    const statCards = document.querySelectorAll('.stat-card h4');
    if (statCards[1]) {
      statCards[1].textContent = data.classrooms.length;
    }

    // Inject Classroom Cards HTML into DOM
    gridContainer.innerHTML = data.classrooms.map(c => `
      <div class="classroom-card">
        <div>
          <h4>${escapeHTML(c.title)}</h4>
          <p>${escapeHTML(c.description || 'Fără descriere')}</p>
        </div>
        <span class="code-badge">Cod: ${c.code}</span>
      </div>
    `).join('');

  } catch (err) {
    console.error('Error fetching classrooms:', err);
  }
}

// XSS Security helper
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
});