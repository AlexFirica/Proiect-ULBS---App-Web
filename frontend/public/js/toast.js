// frontend/public/js/toast.js
// Sistem simplu de notificări toast, folosit în loc de alert().
// Utilizare: showToast('Mesajul tău', 'success' | 'error' | 'info')

(function () {
  let container = null;

  function ensureContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 5000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 340px;
    `;
    document.body.appendChild(container);
    return container;
  }

  const styles = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', icon: '✅' },
    error:   { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c', icon: '❌' },
    info:    { bg: '#eef2ff', border: '#c7d2fe', color: '#4338ca', icon: 'ℹ️' }
  };

  window.showToast = function (message, type = 'info', duration = 3500) {
    const c = ensureContainer();
    const s = styles[type] || styles.info;

    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${s.bg};
      border: 1px solid ${s.border};
      color: ${s.color};
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 20px rgba(0,0,0,0.12);
      display: flex;
      align-items: flex-start;
      gap: 8px;
      opacity: 0;
      transform: translateX(20px);
      transition: opacity 0.2s ease, transform 0.2s ease;
    `;
    toast.innerHTML = `<span>${s.icon}</span><span style="flex:1;">${String(message)}</span>`;

    c.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  };
})();
