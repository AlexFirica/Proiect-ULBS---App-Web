/* avatar-icon.js — iconița de profil din antet devine avatarul utilizatorului (elev SAU profesor).
   Include-l la finalul oricărei pagini cu antet: <script src="/js/avatar-icon.js"></script>
   Caută `.user-profile .user-avatar`; la click duce la /avatar.html.
   Avatarul vine de la backend (GET /api/gamification/me); localStorage e doar cache, ca iconița să apară instant. */
(function () {
  const icon = document.querySelector('.user-profile .user-avatar');
  if (!icon) return;

  const original = { html: icon.innerHTML, bg: icon.style.background, overflow: icon.style.overflow, padding: icon.style.padding };
  let current = null; // { url, bg }

  icon.style.cursor = 'pointer';
  icon.style.transition = 'transform .15s';
  icon.title = 'Avatarul meu';
  icon.addEventListener('click', () => { window.location.href = '/avatar.html'; });
  icon.addEventListener('mouseenter', () => { icon.style.transform = 'scale(1.08)'; });
  icon.addEventListener('mouseleave', () => { icon.style.transform = 'scale(1)'; });

  function show(url, bg) {
    current = { url, bg };
    let img = icon.querySelector('img.avatar-img');
    if (!img) {
      img = document.createElement('img');
      img.className = 'avatar-img';
      img.alt = 'Avatar';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;display:block';
      icon.innerHTML = '';
      icon.appendChild(img);
    }
    if (img.src !== url) img.src = url;
    icon.style.overflow = 'hidden';
    icon.style.padding = '0';
    if (bg) icon.style.background = 'linear-gradient(165deg,#' + bg + ',#0f172a)';
  }

  function reset() {
    current = null;
    icon.innerHTML = original.html;
    icon.style.background = original.bg;
    icon.style.overflow = original.overflow;
    icon.style.padding = original.padding;
  }

  // 1) cache local = afișare instantanee
  try {
    const url = localStorage.getItem('avatarUrl'), bg = localStorage.getItem('avatarBg');
    if (url) show(url, bg);
  } catch (e) {}

  // 2) adevărul vine de la server (și corectează cache-ul, ex. după schimbarea contului în același browser)
  const token = (function () { try { return localStorage.getItem('token'); } catch (e) { return null; } })();
  if (token) {
    fetch('/api/gamification/me', { headers: { Authorization: 'Bearer ' + token } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        try {
          if (d.avatarUrl) {
            const bg = d.avatar && d.avatar.bg;
            localStorage.setItem('avatarUrl', d.avatarUrl);
            localStorage.setItem('avatarBg', bg || '');
            show(d.avatarUrl, bg);
          } else {
            localStorage.removeItem('avatarUrl');
            localStorage.removeItem('avatarBg');
            if (current) reset();
          }
        } catch (e) {}
      })
      .catch(() => {});
  }

  // paginile pot rescrie conținutul iconiței după încărcarea datelor: reaplicăm avatarul
  new MutationObserver(() => { if (current && !icon.querySelector('img.avatar-img')) show(current.url, current.bg); })
    .observe(icon, { childList: true });
})();