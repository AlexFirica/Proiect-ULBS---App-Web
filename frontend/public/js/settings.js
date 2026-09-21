// frontend/public/js/settings.js
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

  const userNameEl = document.querySelector('.user-name');
  if (userNameEl) userNameEl.textContent = user.name || user.email;
  const userRoleEl = document.querySelector('.user-role');
  if (userRoleEl) userRoleEl.textContent = isTeacher ? 'profesor' : 'elev';

  renderSidebar(isTeacher ? 'teacher' : 'student', 'setari');

  // ─── Dark mode toggle ─────────────────────────────────
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const currentTheme = localStorage.getItem('theme') || 'light';
  darkModeToggle.checked = currentTheme === 'dark';

  darkModeToggle.addEventListener('change', () => {
    toggleTheme(darkModeToggle.checked);
  });

  // ─── Limbă ────────────────────────────────────────────
  const languageSelect = document.getElementById('language-select');
  languageSelect.value = localStorage.getItem('language') || 'ro';
  languageSelect.addEventListener('change', () => {
    localStorage.setItem('language', languageSelect.value);
  });

  // ─── Schimbare parolă ─────────────────────────────────
  const changePasswordBtn = document.getElementById('change-password-btn');
  const passwordMsg = document.getElementById('password-msg');

  changePasswordBtn.addEventListener('click', async () => {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    passwordMsg.style.color = '#ef4444';

    if (!currentPassword || !newPassword || !confirmPassword) {
      passwordMsg.textContent = 'Completează toate câmpurile.';
      return;
    }
    if (newPassword.length < 6) {
      passwordMsg.textContent = 'Parola nouă trebuie să aibă cel puțin 6 caractere.';
      return;
    }
    if (newPassword !== confirmPassword) {
      passwordMsg.textContent = 'Parolele nu coincid.';
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();

      if (res.ok) {
        passwordMsg.style.color = '#16a34a';
        passwordMsg.textContent = 'Parola a fost schimbată cu succes!';
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
      } else {
        passwordMsg.textContent = data.message || 'Eroare la schimbarea parolei.';
      }
    } catch (err) {
      console.error(err);
      passwordMsg.textContent = 'Eroare la conectarea cu serverul.';
    }
  });
});
