// frontend/public/js/sidebar.js
// Randează sidebar-ul identic în toate paginile; primește rolul și cheia paginii curente.
function renderSidebar(role, activeKey) {
  const isTeacher = role === 'teacher' || role === 'profesor';
  const dashboardUrl = isTeacher ? '/dashboard-teacher.html' : '/dashboard-student.html';
  const classroomsUrl = isTeacher ? '/classrooms-teacher.html' : '/classrooms-student.html';

  const links = [
    { key: 'dashboard', href: dashboardUrl, icon: '🏠', label: 'Dashboard' },
    { key: 'classrooms', href: classroomsUrl, icon: '🏫', label: 'Classrooms' },
    { key: 'cursuri', href: '/coming-soon.html?f=Cursuri', icon: '📚', label: 'Cursuri' },
    { key: 'mesaje', href: '/coming-soon.html?f=Mesaje', icon: '💬', label: 'Mesaje' },
    { key: 'calendar', href: '/coming-soon.html?f=Calendar', icon: '📅', label: 'Calendar' },
    { key: 'fisiere', href: '/coming-soon.html?f=Fișierele mele', icon: '📁', label: 'Fișierele mele' },
    { key: 'setari', href: '/settings.html', icon: '⚙️', label: 'Setări' }
  ];

  const container = document.getElementById('nav-menu');
  if (!container) return;

  container.innerHTML = links.map(link => `
    <a href="${link.href}" class="nav-item${link.key === activeKey ? ' active' : ''}">
      <span class="icon">${link.icon}</span> ${link.label}
    </a>
  `).join('') + `
    <a href="${dashboardUrl}?openSandbox=1" class="nav-item" style="width: 100%; text-align: left; background: #4f46e5; color: white; border: none; border-radius: 8px; margin-top: 20px; cursor: pointer; padding: 12px 16px; font-weight: bold; display:block;">
      <span class="icon">💻</span> Compilator C++ (Mod Liber)
    </a>
  `;

  // Sincronizează și meniul de sus (top-nav-links), dacă există pe pagină
  const topNav = document.querySelector('.top-nav-links');
  if (topNav) {
    const topLinks = [
      { key: 'dashboard', href: dashboardUrl, label: 'Dashboard' },
      { key: 'classrooms', href: classroomsUrl, label: 'Classrooms' },
      { key: 'cursuri', href: '/coming-soon.html?f=Cursuri', label: 'Cursuri' }
    ];
    topNav.innerHTML = topLinks.map(link => `
      <a href="${link.href}" class="top-link${link.key === activeKey ? ' active' : ''}">${link.label}</a>
    `).join('');
  }

  // Buton de logout, în zona de profil din header
  const userProfile = document.querySelector('.user-profile');
  if (userProfile && !document.getElementById('logout-btn')) {
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.title = 'Deconectare';
    logoutBtn.innerHTML = '🚪';
    logoutBtn.style.cssText = 'background:none; border:none; font-size:18px; cursor:pointer; margin-left:10px; padding:6px 10px; border-radius:8px;';
    logoutBtn.addEventListener('click', async () => {
      if (!confirm('Sigur vrei să te deconectezi?')) return;
      const token = localStorage.getItem('token');
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.error('Eroare la logout:', e);
      }
      localStorage.clear();
      window.location.href = '/login.html';
    });
    userProfile.appendChild(logoutBtn);
  }
}
