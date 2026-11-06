// backend/scripts/gen-exercises-seed.js
// Rulează:  node backend/scripts/gen-exercises-seed.js
// Cerință:  g++ instalat local (doar pentru generare; aplicația folosește Piston).
//
// Compilează soluția de referință a fiecărui exercițiu, o rulează pe testele de intrare
// și produce backend/sql/exercises.sql (tabelă + date), gata de lipit în Supabase → SQL Editor.
// Astfel outputurile așteptate sunt garantat corecte (nu sunt scrise de mână).

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const exercises = require('./exercises.data');

const normalize = (s) =>
  String(s).replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');

const sqlStr = (s) => `$q$${s}$q$`; // dollar-quoting: nu necesită escape pentru apostrof/ghilimele

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'codero-ex-'));
const rows = [];
let failed = 0;

for (const ex of exercises) {
  const src = path.join(tmp, `${ex.slug}.cpp`);
  const bin = path.join(tmp, ex.slug);
  fs.writeFileSync(src, ex.solution);

  try {
    execFileSync('g++', ['-std=c++17', '-O2', '-o', bin, src], { stdio: 'pipe' });
  } catch (e) {
    console.error(`❌ ${ex.slug}: eroare de compilare\n${e.stderr}`);
    failed++;
    continue;
  }

  const testCases = ex.inputs.map((input) => {
    const out = execFileSync(bin, [], { input: input + '\n', timeout: 10000 }).toString();
    return { input, output: normalize(out) };
  });

  // Verificăm că exemplul din enunț (Intrare/Ieșire) coincide cu primul test generat
  const m = ex.description.match(/EXEMPLU:\nIntrare: ([\s\S]*?)\nIeșire: ([\s\S]*)$/);
  if (m && normalize(m[2]) !== testCases[0].output) {
    console.error(`⚠️  ${ex.slug}: exemplul din enunț ("${m[2]}") ≠ outputul real ("${testCases[0].output}")`);
    failed++;
  }

  rows.push({ ex, testCases });
  console.log(`✅ ${ex.slug} (${testCases.length} teste)`);
}

if (failed) {
  console.error(`\n${failed} probleme — fișierul SQL NU a fost generat.`);
  process.exit(1);
}

const header = `-- =====================================================================
-- Codero · Catalog de exerciții C++ (liceu)
-- Generat automat de backend/scripts/gen-exercises-seed.js — nu edita de mână.
-- Rulează în Supabase → SQL Editor. Scriptul poate fi rulat de mai multe ori
-- (exercițiile existente se actualizează după "slug").
-- =====================================================================

create table if not exists exercises (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  description  text not null,
  chapter      text not null,
  grade        smallint not null check (grade between 9 and 12),
  difficulty   smallint not null check (difficulty between 1 and 3),
  xp_reward    integer not null default 10,
  test_cases   jsonb not null,           -- [{ "input": "...", "output": "..." }, ...]
  is_active    boolean not null default true,
  created_at   timestamptz default now()
);

create index if not exists exercises_chapter_idx on exercises (chapter);

-- Testele conțin răspunsurile corecte: tabela se citește DOAR din backend (service role).
-- Activăm RLS fără nicio politică => cheia anon/publică nu are acces.
alter table exercises enable row level security;

`;

const inserts = rows
  .map(({ ex, testCases }) => `insert into exercises (slug, title, description, chapter, grade, difficulty, xp_reward, test_cases)
values (${sqlStr(ex.slug)}, ${sqlStr(ex.title)}, ${sqlStr(ex.description)}, ${sqlStr(ex.chapter)}, ${ex.grade}, ${ex.difficulty}, ${ex.xp}, ${sqlStr(JSON.stringify(testCases))}::jsonb)
on conflict (slug) do update set
  title = excluded.title, description = excluded.description, chapter = excluded.chapter,
  grade = excluded.grade, difficulty = excluded.difficulty, xp_reward = excluded.xp_reward,
  test_cases = excluded.test_cases;
`)
  .join('\n');

const outDir = path.join(__dirname, '..', 'sql');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'exercises.sql'), header + inserts);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n📄 ${rows.length} exerciții → backend/sql/exercises.sql`);
