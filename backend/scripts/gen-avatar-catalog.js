/* Generează backend/src/data/avatarCatalog.json din catalogul (SLOTS) din frontend/public/avatar.html.
   Rulează din folderul backend, după ORICE modificare a item-urilor din avatar.html:
       node scripts/gen-avatar-catalog.js
   Serverul folosește JSON-ul ca să valideze prețurile, nivelurile și ownership-ul (clientul nu e de încredere). */
const fs = require('fs'), path = require('path'), vm = require('vm');

const htmlPath = path.join(__dirname, '../../frontend/public/avatar.html');
const outPath = path.join(__dirname, '../src/data/avatarCatalog.json');

// Asigură existența folderului destinatar (backend/src/data)
const dataDir = path.dirname(outPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const html = fs.readFileSync(htmlPath, 'utf8');

// Eliminăm apelurile de randare și boot din cod pentru mediul Node.js
const js = html
  .match(/<script>([\s\S]*)<\/script>/)[1]
  .replace(/\nrender\(\);\s*$/m, '\n')
  .replace(/\nboot\(\);\s*$/m, '\n');

// Mock DOM complet pentru a preveni erorile de manipulare grafică pe server
const createDummyElement = () => ({
  style: {
    setProperty() {},
    background: '',
    width: '',
    height: '',
    left: '',
    top: '',
    bottom: '',
    fontSize: '',
    transform: '',
    transformOrigin: '',
    overflow: '',
    padding: ''
  },
  classList: { add() {}, remove() {} },
  appendChild() {},
  querySelector: () => createDummyElement(),
  querySelectorAll: () => [],
  insertAdjacentHTML() {},
  src: '',
  textContent: '',
  innerHTML: '',
  href: ''
});

const ctx = {
  document: {
    getElementById: () => createDummyElement(),
    querySelector: () => createDummyElement(),
    querySelectorAll: () => [],
    createElement: () => createDummyElement()
  },
  window: { scrollY: 0, scrollTo() {} },
  localStorage: { getItem: () => null, setItem() {} },
  URLSearchParams,
  console,
  setTimeout: () => {},
  clearTimeout: () => {},
  fetch: () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
};

vm.createContext(ctx);
const { SLOTS } = vm.runInContext(js + ';({SLOTS})', ctx);

const items = {};
for (const [slot, def] of Object.entries(SLOTS)) {
  for (const it of def.items) {
    if (it.id === 'none') continue;
    if (items[it.id]) throw new Error('ID duplicat în catalog: ' + it.id);
    items[it.id] = { slot, price: it.p, lvl: it.lvl || 0 };
  }
}
const optional = Object.entries(SLOTS).filter(([, d]) => d.items.some(i => i.id === 'none')).map(([k]) => k);
fs.writeFileSync(outPath, JSON.stringify({ optionalSlots: optional, items }, null, 1));
console.log('Catalog scris:', Object.keys(items).length, 'item-uri →', outPath);