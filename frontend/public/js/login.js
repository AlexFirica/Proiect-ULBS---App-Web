/* ============================================================
   LOGIN.JS — Production ready
   Gestionează: switch rol, login form, modal sign-up 3 pași
============================================================ */

'use strict';

// ── State global ──────────────────────────────────────────
let currentRole = 'profesor'; // rol activ pe pagina de login
let suRole      = null;       // rol ales în modal
let suScore     = 0;          // scor parolă (0-5)

// ── Switch rol (toggle Profesor / Cursant) ────────────────
function switchRole(rol) {
  currentRole = rol;
  const isPro = rol === 'profesor';

  // Tab-uri
  const tabProf = document.getElementById('tab-profesor');
  const tabStud = document.getElementById('tab-cursant');
  if (tabProf && tabStud) {
    tabProf.classList.toggle('active', isPro);
    tabStud.classList.toggle('active', !isPro);
    tabProf.setAttribute('aria-pressed', isPro);
    tabStud.setAttribute('aria-pressed', !isPro);
  }

  // Actualizează clasa de pe body pentru a schimba accentul (verde/albastru)
  document.body.classList.toggle('role-cursant', !isPro);

  // Arată/ascunde GitHub SSO (doar la cursant)
  const github = document.getElementById('login-github');
  if (github) github.style.display = isPro ? 'none' : 'flex';

  // Actualizează câmpul hidden din formular
  const roleInput = document.getElementById('login-role');
  if (roleInput) roleInput.value = rol;

  // Actualizează link-ul "Ai uitat parola?" cu culoarea rolului
  const forgot = document.getElementById('forgot-link');
  if (forgot) {
    forgot.style.color = isPro ? 'var(--blue)' : 'var(--green)';
  }

  // Actualizează link-ul "Înregistrează-te"
  const signupLink = document.getElementById('signup-link');
  if (signupLink) {
    signupLink.style.color = isPro ? 'var(--blue)' : 'var(--green)';
  }
}

// ── SSO handler (placeholder) ─────────────────────────────
function handleSso(provider) {
  console.log(`SSO: ${provider} | rol: ${currentRole || suRole}`);
  alert(`Integrare ${provider} — de implementat cu OAuth.`);
}

function validateLoginForm() {
  const email = document.getElementById('login-email');
  const pass  = document.getElementById('login-pass');
  let valid   = true;

  if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    showFieldError(email, 'err-login-email', 'Introdu o adresă de email validă.');
    valid = false;
  } else {
    clearFieldError(email);
  }

  if (!pass.value) {
    showFieldError(pass, 'err-login-pass', 'Parola nu poate fi goală.');
    valid = false;
  } else {
    clearFieldError(pass);
  }

  return valid;
}

// ── Utilities form ────────────────────────────────────────
function showFieldError(input, errId, msg) {
  input.classList.add('is-invalid');
  const err = document.getElementById(errId);
  if (err) err.textContent = msg;
}

function clearFieldError(input) {
  input.classList.remove('is-invalid');
  const errId = 'err-' + input.id;
  const err = document.getElementById(errId);
  if (err) err.textContent = '';
}

function setLoading(btn, loading, label) {
  if (!btn) return;
  if (loading) {
    btn.classList.add('loading');
    btn.innerHTML = '<span class="spinner"></span> ' + label;
  } else {
    btn.classList.remove('loading');
    btn.textContent = label;
  }
}

// ── Arată/ascunde parolă ──────────────────────────────────
function toggleEye(inputId, iconId) {
  const inp  = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!inp || !icon) return;

  const isPass = inp.type === 'password';
  inp.type = isPass ? 'text' : 'password';

  // Schimbă iconița (ochi tăiat când e vizibilă)
  icon.innerHTML = isPass
    ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
}

// ═══════════════════════════════════════════════════════════
//  MODAL SIGN-UP
// ═══════════════════════════════════════════════════════════

// ── Deschide / Închide modal ──────────────────────────────
function openModal(rol) {
  resetModal();
  const modal = document.getElementById('signupModal');
  if (modal) modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  if (rol) suPickRole(rol);
}

function closeModal() {
  const modal = document.getElementById('signupModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
  resetModal();
}

// Închide la click pe fundal
window.addEventListener('click', function (e) {
  const modal = document.getElementById('signupModal');
  if (e.target === modal) closeModal();
});

// Închide cu Escape
window.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
});

function resetModal() {
  suRole  = null;
  suScore = 0;

  const card = document.getElementById('su-card');
  if (card) card.className = 'su-card';

  ['sucard-profesor', 'sucard-cursant'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = 'su-role-card';
  });

  ['su-name', 'su-email', 'su-pass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('is-invalid'); }
  });

  ['err-su-name', 'err-su-email', 'err-su-pass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });

  const pwdBox = document.getElementById('su-pwd-box');
  if (pwdBox) pwdBox.hidden = true;
  suResetBars(0);
  const lbl = document.getElementById('pwd-label');
  if (lbl) { lbl.textContent = ''; lbl.style.color = ''; }
  document.querySelectorAll('.pwd-rules li').forEach(li => li.classList.remove('ok'));

  const gh = document.getElementById('su-github-btn');
  if (gh) gh.style.display = 'none';

  const n1 = document.getElementById('su-next-1');
  if (n1) n1.disabled = true;
  const n2 = document.getElementById('su-next-2');
  if (n2) n2.disabled = true;
  const sub = document.getElementById('su-submit');
  if (sub) sub.disabled = true;

  suGoStep(1);
}

// ── Alegere rol în modal ──────────────────────────────────
function suPickRole(rol) {
  suRole = rol;
  const isPro = rol === 'profesor';

  const card = document.getElementById('su-card');
  if (card) card.className = 'su-card ' + rol;

  const profCard = document.getElementById('sucard-profesor');
  if (profCard) profCard.className = 'su-role-card' + (isPro ? ' sel-profesor' : '');

  const studCard = document.getElementById('sucard-cursant');
  if (studCard) studCard.className = 'su-role-card' + (!isPro ? ' sel-cursant' : '');

  const gh = document.getElementById('su-github-btn');
  if (gh) gh.style.display = isPro ? 'none' : 'flex';

  const n1 = document.getElementById('su-next-1');
  if (n1) n1.disabled = false;
}

// ── Navigare între pași ───────────────────────────────────
function suGoStep(n) {
  [1, 2, 3, 4].forEach(i => {
    const pane = document.getElementById('su-pane-' + i);
    if (pane) pane.hidden = (i !== n);
  });

  const pct = { 1: 33, 2: 66, 3: 90, 4: 100 };
  const fill = document.getElementById('su-fill');
  if (fill) fill.style.width = (pct[n] || 33) + '%';

  [1, 2, 3].forEach(i => {
    const dot = document.getElementById('dot-' + i);
    if (!dot) return;
    dot.className = 'su-dot' + (i === n ? ' active' : i < n ? ' done' : '');
  });

  if (n >= 2 && suRole) {
    ['su-badge-2', 'su-badge-3'].forEach(id => {
      const b = document.getElementById(id);
      if (!b) return;
      b.className = 'role-badge ' + suRole;
      b.textContent = suRole === 'profesor' ? '🎓 Profesor' : '📚 Cursant';
    });
  }

  if (n === 4) {
    const nameEl = document.getElementById('su-name');
    const firstName = nameEl?.value?.trim().split(' ')[0] || '';
    const msg = document.getElementById('su-success-msg');
    if (msg) {
      msg.textContent = firstName
        ? `Bine ai venit, ${firstName}! Contul tău a fost creat.`
        : 'Contul tău a fost creat cu succes.';
    }
  }
}

// ── Validare Pas 2 ────────────────────────────────────────
function suValidate2() {
  const name    = document.getElementById('su-name').value.trim();
  const email   = document.getElementById('su-email').value.trim();
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nextBtn = document.getElementById('su-next-2');

  const nameErr = document.getElementById('err-su-name');
  if (name.length > 0 && name.length < 2) {
    document.getElementById('su-name').classList.add('is-invalid');
    if (nameErr) nameErr.textContent = 'Numele trebuie să aibă cel puțin 2 caractere.';
  } else {
    document.getElementById('su-name').classList.remove('is-invalid');
    if (nameErr) nameErr.textContent = '';
  }

  const emailErr = document.getElementById('err-su-email');
  if (email.length > 0 && !emailRe.test(email)) {
    document.getElementById('su-email').classList.add('is-invalid');
    if (emailErr) emailErr.textContent = 'Adresa de email nu este validă.';
  } else {
    document.getElementById('su-email').classList.remove('is-invalid');
    if (emailErr) emailErr.textContent = '';
  }

  if (nextBtn) nextBtn.disabled = !(name.length >= 2 && emailRe.test(email));
}

// ── Verificare parolă ─────────────────────────────────────
const PWD_RULES = [
  { id: 'pr-len',  test: v => v.length >= 8 },
  { id: 'pr-up',   test: v => /[A-Z]/.test(v) },
  { id: 'pr-low',  test: v => /[a-z]/.test(v) },
  { id: 'pr-num',  test: v => /[0-9]/.test(v) },
  { id: 'pr-spec', test: v => /[^A-Za-z0-9]/.test(v) },
];

const BAR_COLORS = ['', '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#16a34a'];
const STRENGTH_LABELS = ['', 'Foarte slabă', 'Slabă', 'Medie', 'Bună', 'Puternică'];

function suCheckPass(val) {
  const results = PWD_RULES.map(r => r.test(val));
  suScore = results.filter(Boolean).length;

  PWD_RULES.forEach((r, i) => {
    const li = document.getElementById(r.id);
    if (li) li.classList.toggle('ok', results[i]);
  });

  suResetBars(suScore, BAR_COLORS[suScore]);

  const lbl = document.getElementById('pwd-label');
  if (lbl) {
    lbl.textContent = val ? STRENGTH_LABELS[suScore] : '';
    lbl.style.color  = val ? BAR_COLORS[suScore]     : '';
  }

  const submitBtn = document.getElementById('su-submit');
  if (submitBtn) submitBtn.disabled = suScore < 4;

  const errPass = document.getElementById('err-su-pass');
  if (errPass) {
    errPass.textContent = (val.length > 0 && suScore < 4)
      ? 'Parola nu îndeplinește cerințele minime.'
      : '';
  }
}

function suResetBars(score, color = 'var(--border)') {
  for (let i = 1; i <= 5; i++) {
    const bar = document.getElementById('pbar-' + i);
    if (bar) bar.style.background = i <= score ? color : 'var(--border)';
  }
}

// ── Submit Sign-Up ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const suSubmitBtn = document.getElementById('su-submit');

  if (suSubmitBtn) {
    suSubmitBtn.onclick = async function (e) {
      e.preventDefault();

      const nameInput = document.getElementById('su-name');
      const emailInput = document.getElementById('su-email');
      const passInput = document.getElementById('su-pass');

      const newperson = {
        name: nameInput ? nameInput.value : '',
        email: emailInput ? emailInput.value : '',
        role: suRole,
        password: passInput ? passInput.value : ''
      };

      try {
        setLoading(suSubmitBtn, true, 'Se creează contul...');

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newperson)
        });

        const data = await response.json();
        setLoading(suSubmitBtn, false, 'Creează contul');

        if (response.ok) {
          suGoStep(4); // Pasul de succes
        } else {
          alert(data.message || 'Eroare la crearea contului.');
        }
      } catch (err) {
        setLoading(suSubmitBtn, false, 'Creează contul');
        console.error('Eroare rețea sign-up:', err);
        alert('Serverul de backend nu poate fi contactat.');
      }
    };
  }

  // ── Submit Login ────────────────────────────────────────────
  const loginForm = document.getElementById('login-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      if (!validateLoginForm()) return;

      const btn = document.getElementById('login-submit');
      const email_login = document.getElementById('login-email');
      const password_login = document.getElementById('login-pass');

      setLoading(btn, true, 'Se verifică...');

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email_login.value,
            password: password_login.value
          })
        });

        const data = await response.json();
        setLoading(btn, false, 'Intră în cont');

        if (response.ok) {
          // ✅ SALVARE TOKEN JWT ÎN LOCALSTORAGE (Esențial pentru ca dashboard.js să îl trimită)
          if (data.token) {
            localStorage.setItem('token', data.token);
          }
          
          // Salvare detalii utilizator
          localStorage.setItem('user', JSON.stringify(data.user || data));

          // Redirecționare către Dashboard
          window.location.href = '/dashboard.html';
        } else {
          alert(data.message || 'Autentificare eșuată!');
        }
      } catch (error) {
        setLoading(btn, false, 'Intră în cont');
        console.error('Eroare conectare la backend:', error);
        alert('Nu se poate realiza conexiunea cu serverul Node.js.');
      }
    });
  }
});