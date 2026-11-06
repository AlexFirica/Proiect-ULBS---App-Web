// frontend/public/js/exercise-catalog.js
// Profesorul alege un exercițiu C++ din catalogul Supabase și îl atribuie clasei ca temă.
// Depinde de: dashboard-teacher.js (getCurrentClassroom, refreshClassroomModal, escapeHTML) și toast.js (showToast).
(function () {
  const $ = (id) => document.getElementById(id);
  const token = () => localStorage.getItem('token');

  const DIFF = { 1: '★ Ușor', 2: '★★ Mediu', 3: '★★★ Dificil' };
  const DIFF_COLOR = { 1: '#16a34a', 2: '#d97706', 3: '#dc2626' };

  let catalog = null;        // { chapters: [], exercises: [] }
  let selected = null;       // exercițiul ales
  let loadError = null;

  // ── Taburi: Catalog / Manual ───────────────────────────────
  function showTab(name) {
    const catalogPane = $('hw-catalog-pane');
    const manualPane = $('hw-manual-pane');
    if (!catalogPane || !manualPane) return;

    catalogPane.hidden = name !== 'catalog';
    manualPane.hidden = name !== 'manual';

    document.querySelectorAll('.hw-tab').forEach((t) => {
      const active = t.dataset.hwtab === name;
      t.classList.toggle('active', active);
      t.style.borderBottomColor = active ? '#4f46e5' : 'transparent';
      t.style.color = active ? '#4f46e5' : '#64748b';
    });
  }

  // ── Încărcare catalog (o singură dată pe sesiune) ──────────
  async function loadCatalog() {
    if (catalog) return;
    try {
      const res = await fetch('/api/teacher/exercises', {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Eroare la încărcarea catalogului.');
      catalog = data;
      loadError = null;

      const chapterSel = $('cat-chapter');
      chapterSel.innerHTML = '<option value="">Toate capitolele</option>' +
        catalog.chapters.map((c) => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
    } catch (err) {
      loadError = err.message;
    }
  }

  function assignedExerciseIds() {
    const cls = typeof window.getCurrentClassroom === 'function' ? window.getCurrentClassroom() : null;
    return new Set((cls?.homeworks || []).map((h) => h.exerciseId).filter(Boolean));
  }

  // ── Randare listă cu filtre ────────────────────────────────
  function renderList() {
    const list = $('cat-list');
    if (loadError) {
      list.innerHTML = `<div style="padding:16px; text-align:center; color:#ef4444; font-size:13px;">
        ${escapeHTML(loadError)}<br><small style="color:#94a3b8;">Verifică dacă ai rulat <code>backend/sql/exercises.sql</code> în Supabase.</small></div>`;
      return;
    }
    if (!catalog) return;

    const chapter = $('cat-chapter').value;
    const diff = $('cat-difficulty').value;
    const q = $('cat-search').value.trim().toLowerCase();
    const assigned = assignedExerciseIds();

    const items = catalog.exercises.filter((e) =>
      (!chapter || e.chapter === chapter) &&
      (!diff || String(e.difficulty) === diff) &&
      (!q || e.title.toLowerCase().includes(q))
    );

    if (!items.length) {
      list.innerHTML = '<div style="padding:16px; text-align:center; color:#94a3b8; font-size:13px;">Niciun exercițiu găsit.</div>';
      return;
    }

    list.innerHTML = items.map((e) => {
      const isAssigned = assigned.has(e.id);
      const isSelected = selected && selected.id === e.id;
      return `
        <div class="cat-item" data-id="${e.id}" style="padding:9px 12px; border-bottom:1px solid #f1f5f9; cursor:${isAssigned ? 'not-allowed' : 'pointer'};
             display:flex; justify-content:space-between; align-items:center; gap:8px;
             background:${isSelected ? '#eef2ff' : 'transparent'}; opacity:${isAssigned ? 0.55 : 1};">
          <div style="min-width:0;">
            <div style="font-size:13.5px; font-weight:600; color:#1e293b;">${escapeHTML(e.title)}</div>
            <div style="font-size:11px; color:#94a3b8;">${escapeHTML(e.chapter)} · clasa a ${e.grade}-a · ${e.testCount} teste</div>
          </div>
          <div style="text-align:right; white-space:nowrap;">
            <div style="font-size:11px; font-weight:700; color:${DIFF_COLOR[e.difficulty]};">${DIFF[e.difficulty]}</div>
            <div style="font-size:11px; color:${isAssigned ? '#16a34a' : '#64748b'};">${isAssigned ? '✓ deja atribuită' : `+${e.xp_reward} XP`}</div>
          </div>
        </div>`;
    }).join('');
  }

  function selectExercise(id) {
    const ex = catalog?.exercises.find((e) => e.id === id);
    if (!ex) return;
    if (assignedExerciseIds().has(ex.id)) {
      showToast('Acest exercițiu a fost deja atribuit acestei clase.', 'info');
      return;
    }
    selected = ex;

    $('cat-preview').hidden = false;
    $('cat-preview-title').textContent = ex.title;
    $('cat-preview-meta').textContent = `${DIFF[ex.difficulty]} · ${ex.testCount} teste`;
    $('cat-preview-desc').textContent = ex.description;  // textContent: fără risc XSS
    $('cat-xp').value = ex.xp_reward;

    const btn = $('cat-assign-btn');
    btn.disabled = false;
    btn.style.opacity = 1;
    renderList();
  }

  function resetSelection() {
    selected = null;
    $('cat-preview').hidden = true;
    $('cat-deadline').value = '';
    const btn = $('cat-assign-btn');
    btn.disabled = true;
    btn.style.opacity = 0.5;
  }

  function closeModal() {
    const modal = $('add-homework-modal');
    modal.setAttribute('hidden', '');
    modal.style.display = 'none';
  }

  // ── Atribuire către clasă ──────────────────────────────────
  async function assign() {
    if (!selected) return;
    const dueRaw = $('cat-deadline').value;
    if (!dueRaw) {
      showToast('Alege un termen limită pentru temă.', 'error');
      return;
    }
    const cls = window.getCurrentClassroom && window.getCurrentClassroom();
    if (!cls) {
      showToast('Nu s-a găsit clasa curentă. Redeschide classroom-ul.', 'error');
      return;
    }

    const btn = $('cat-assign-btn');
    btn.disabled = true;
    try {
      const res = await fetch('/api/teacher/homework/from-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          classroomId: cls.id,
          exerciseId: selected.id,
          dueDate: new Date(dueRaw).toISOString(),
          xpReward: parseInt($('cat-xp').value, 10)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Eroare la atribuirea temei.', 'error');
        btn.disabled = false;
        return;
      }
      closeModal();
      showToast('Tema a fost atribuită clasei!', 'success');
      resetSelection();
      if (typeof window.refreshClassroomModal === 'function') await window.refreshClassroomModal();
    } catch (err) {
      console.error(err);
      showToast('Eroare la conectarea cu serverul.', 'error');
      btn.disabled = false;
    }
  }

  // ── Evenimente (delegate, ca să nu depindă de ordinea scripturilor) ──
  document.addEventListener('click', async (e) => {
    const tab = e.target.closest('.hw-tab');
    if (tab) return showTab(tab.dataset.hwtab);

    const item = e.target.closest('.cat-item');
    if (item) return selectExercise(item.dataset.id);

    if (e.target.closest('#cat-assign-btn')) return assign();
    if (e.target.closest('#cat-cancel-btn')) return closeModal();

    // La deschiderea modalului „Adaugă temă": pornim pe tab-ul Catalog
    if (e.target.closest('#cm-add-homework-btn')) {
      resetSelection();
      showTab('catalog');
      $('cat-list').innerHTML = '<div style="padding:16px; text-align:center; color:#94a3b8; font-size:13px;">Se încarcă catalogul...</div>';
      await loadCatalog();
      renderList();
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'cat-search') renderList();
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'cat-chapter' || e.target.id === 'cat-difficulty') renderList();
  });
})();
