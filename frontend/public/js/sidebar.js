// frontend/public/js/sidebar.js

const localTranslations = {
    ro: {
        nav_dashboard: "Dashboard", nav_classrooms: "Classrooms", nav_courses: "Cursuri",
        nav_training: "Antrenament C++", nav_messages: "Mesaje", nav_calendar: "Calendar",
        nav_files: "Fișierele mele", nav_settings: "Setări", nav_sandbox: "Compilator C++ (Mod Liber)",
        your_plan: "Planul tău", student_account: "Cont Elev", student_access: "Ai acces la toate funcționalitățile.",
        premium_desc: "Deblochează cursuri interactive.", find_more: "Află mai multe →",
        free_classroom: "Classroom Gratuit", teacher_access: "Ai acces la toate funcționalitățile pentru profesori.",
        role_teacher: "Profesor", role_student: "Elev", training_title: "Antrenament C++",
        training_desc: "Răspunde la întrebări de sintaxă și câștigă experiență (XP).",
        training_submit: "Trimite Răspunsul", training_next: "Următoarea întrebare ➡️", loading_question: "⏳ Se încarcă întrebarea..."
    },
    en: {
        nav_dashboard: "Dashboard", nav_classrooms: "Classrooms", nav_courses: "Courses",
        nav_training: "C++ Training", nav_messages: "Messages", nav_calendar: "Calendar",
        nav_files: "My Files", nav_settings: "Settings", nav_sandbox: "C++ Compiler (Free Mode)",
        your_plan: "Your Plan", student_account: "Student Account", student_access: "You have access to all features.",
        premium_desc: "Unlock interactive courses.", find_more: "Find out more →",
        free_classroom: "Free Classroom", teacher_access: "You have access to all teacher features.",
        role_teacher: "Teacher", role_student: "Student", training_title: "C++ Training",
        training_desc: "Answer syntax questions and earn experience (XP).",
        training_submit: "Submit Answer", training_next: "Next question ➡️", loading_question: "⏳ Loading question..."
    }
};

// Detectare inteligentă a limbii, indiferent cum e setată de i18n.js
function getActiveLang() {
    const htmlLang = document.documentElement.lang;
    if (htmlLang && htmlLang.startsWith('en')) return 'en';
    if (localStorage.getItem('language') === 'en' || localStorage.getItem('lang') === 'en') return 'en';
    return 'ro';
}

function forceCustomTranslations() {
    const t = localTranslations[getActiveLang()];
    if (!t) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.innerText = t[key];
    });
}

function renderSidebar(role, activeKey) {
  const t = localTranslations[getActiveLang()];
  const isTeacher = role === 'teacher' || role === 'profesor';
  const dashboardUrl = isTeacher ? '/dashboard-teacher.html' : '/dashboard-student.html';
  const classroomsUrl = isTeacher ? '/classrooms-teacher.html' : '/classrooms-student.html';

  const links = [
    { key: 'dashboard', href: dashboardUrl, icon: '🏠', label: t.nav_dashboard, i18n: 'nav_dashboard' },
    { key: 'classrooms', href: classroomsUrl, icon: '🏫', label: t.nav_classrooms, i18n: 'nav_classrooms' },
    { key: 'cursuri', href: '/coming-soon.html?f=Cursuri', icon: '📚', label: t.nav_courses, i18n: 'nav_courses' },
    { key: 'antrenament', href: '/antrenament.html', icon: '🧠', label: t.nav_training, i18n: 'nav_training' },
    { key: 'mesaje', href: '/coming-soon.html?f=Mesaje', icon: '💬', label: t.nav_messages, i18n: 'nav_messages' },
    { key: 'calendar', href: '/coming-soon.html?f=Calendar', icon: '📅', label: t.nav_calendar, i18n: 'nav_calendar' },
    { key: 'fisiere', href: '/coming-soon.html?f=Fișierele mele', icon: '📁', label: t.nav_files, i18n: 'nav_files' },
    { key: 'setari', href: '/settings.html', icon: '⚙️', label: t.nav_settings, i18n: 'nav_settings' }
  ];

  const container = document.getElementById('nav-menu');
  if (container) {
      container.innerHTML = links.map(link => `
        <a href="${link.href}" class="nav-item${link.key === activeKey ? ' active' : ''}">
          <span class="icon">${link.icon}</span> <span data-i18n="${link.i18n}">${link.label}</span>
        </a>
      `).join('') + `
        <a href="${dashboardUrl}?openSandbox=1" class="nav-item" style="width: 100%; text-align: left; background: #4f46e5; color: white; border: none; border-radius: 8px; margin-top: 20px; cursor: pointer; padding: 12px 16px; font-weight: bold; display:block;">
          <span class="icon">💻</span> <span data-i18n="nav_sandbox">${t.nav_sandbox}</span>
        </a>
      `;
  }

  const topNav = document.querySelector('.top-nav-links');
  if (topNav) {
    topNav.innerHTML = links.filter(l => ['dashboard', 'classrooms', 'cursuri', 'antrenament'].includes(l.key))
      .map(link => `<a href="${link.href}" class="top-link${link.key === activeKey ? ' active' : ''}" data-i18n="${link.i18n}">${link.label}</a>`).join('');
  }

  const userProfile = document.querySelector('.user-profile');
  if (userProfile && !document.getElementById('logout-btn')) {
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.innerHTML = '🚪';
    logoutBtn.style.cssText = 'background:none; border:none; font-size:18px; cursor:pointer; margin-left:10px; padding:6px 10px; border-radius:8px;';
    logoutBtn.addEventListener('click', async () => {
      if (!confirm(getActiveLang() === 'en' ? "Log out?" : "Deconectare?")) return;
      try { await fetch('/api/auth/logout', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }); } catch(e){}
      localStorage.clear();
      window.location.href = '/login.html';
    });
    userProfile.appendChild(logoutBtn);
  }

  if (!document.querySelector('script[src="/js/avatar-icon.js"]')) {
    const s = document.createElement('script');
    s.src = '/js/avatar-icon.js';
    document.body.appendChild(s);
  }
  
  forceCustomTranslations();
}

let __currentMonitorLang = getActiveLang();
setInterval(() => {
    const activeL = getActiveLang();
    if (activeL !== __currentMonitorLang) {
        __currentMonitorLang = activeL;
        const rawRole = String(localStorage.getItem('role') || 'cursant').toLowerCase().trim();
        let activeKey = 'dashboard';
        if (window.location.href.includes('classrooms')) activeKey = 'classrooms';
        if (window.location.href.includes('antrenament')) activeKey = 'antrenament';
        renderSidebar(rawRole, activeKey);
    }
}, 300);

document.addEventListener("DOMContentLoaded", () => setTimeout(forceCustomTranslations, 200));