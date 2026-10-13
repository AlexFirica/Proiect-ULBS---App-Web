<div align="center">

# `</>` Codero

**Platformă de învățare pentru programare — clase virtuale, teme evaluate automat și compilator C++ integrat.**

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20Storage-3ECF8E?logo=supabase&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Piston-2496ED?logo=docker&logoColor=white)
![Status](https://img.shields.io/badge/status-în%20dezvoltare-orange)

</div>

---

## Despre proiect

**Codero** este o platformă web de tip *Google Classroom*, gândită special pentru predarea programării. Profesorii creează clase, publică teme cu teste ascunse și încarcă materiale; elevii se înscriu cu un cod de invitație, rezolvă temele direct în browser, într-un editor C++ cu compilare reală, și câștigă **XP** pentru soluțiile corecte.

## Funcționalități

### Pentru profesori
- Creare de classroom-uri (Liceu, Opțional, Club, Bacalaureat) cu **cod de invitație** generat automat
- Teme de programare cu **input și output așteptat**, deadline și recompensă XP configurabilă
- Încărcare de materiale (PDF, imagini etc.) cu **previzualizare în aplicație**
- Tabel cu elevii înscriși, XP și nivel, plus **clasament** pe classroom
- Ștergere de classroom-uri și teme

### Pentru elevi
- Înscriere într-o clasă prin cod de invitație
- **Editor C++ (Monaco)** cu evidențiere de sintaxă, input personalizat și rulare de test
- **Terminal de debug** pentru erorile reale de compilare
- Evaluare automată la trimitere — XP acordat o singură dată, doar pentru soluții corecte
- Sistem de **niveluri** și progress bar, clasament în clasă, indicator de deadline
- Mod liber (Sandbox) pentru exersat cod fără a trimite o temă

### Generale
- Dashboard-uri separate pentru profesor și elev
- **Dark / Light mode**, salvat între sesiuni
- Notificări toast, loading skeleton, pagină 404 personalizată
- Setări de cont: schimbare parolă, preferință de limbă

## Tehnologii

| Strat | Tehnologii |
|---|---|
| **Frontend** | HTML, CSS, JavaScript (vanilla), Monaco Editor, canvas-confetti |
| **Backend** | Node.js, Express |
| **Baze de date** | Supabase (PostgreSQL, Auth, Storage) pentru clase, înscrieri și materiale · MongoDB (Mongoose) pentru utilizatori, teme și trimiteri |
| **Execuție cod** | [Piston](https://github.com/engineer-man/piston), rulat local în Docker (sandbox izolat) |
| **Autentificare** | JWT, hash de parole cu Argon2id |

## Securitate

- Parole stocate cu **Argon2id**
- Autentificare pe bază de **JWT** (24h) și acces pe roluri (profesor / elev)
- Descrierile temelor sunt **criptate AES-256-GCM**, iar integritatea lor e verificată cu **semnături ECC (P-256)**
- **Rate limiting** pe login (5 încercări / 15 min), înregistrare și resetare de parolă
- Codul elevilor rulează într-un **sandbox Docker** (Piston), cu limită de timp

## Instalare și rulare

### Cerințe

- Node.js 18+
- MongoDB (local sau Atlas)
- Cont [Supabase](https://supabase.com)
- Docker Desktop

### 1. Clonare și instalare

```bash
git clone <url-repository>
cd <folder-proiect>/backend
npm install
```

### 2. Variabile de mediu

Creează fișierul `backend/.env`:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/codeedu
JWT_SECRET=alege-un-secret-lung-si-random
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=cheia-ta-de-service-role
FRONTEND_URL=http://localhost:3000
PISTON_API_URL=http://localhost:2000/api/v2
AES_SECRET=o-cheie-secreta-de-32-caractere
```

| Variabilă | Descriere |
|---|---|
| `MONGO_URI` | Conexiunea la MongoDB |
| `JWT_SECRET` | Secretul cu care se semnează token-urile JWT |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Datele proiectului tău Supabase (cheia *service role* rămâne doar pe server) |
| `PISTON_API_URL` | Adresa instanței Piston care compilează codul |
| `AES_SECRET` | Cheia de criptare a descrierilor temelor (32 de caractere) |

> ⚠️ Nu publica niciodată fișierul `.env` și nu comite chei în repository.

### 3. Compilatorul (Piston, prin Docker)

```bash
docker volume create piston_data
docker run -d --name piston_api -p 2000:2000 --privileged -v piston_data:/piston ghcr.io/engineer-man/piston
```

Instalează compilatorul C++ (o singură dată):

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language":"gcc","version":"10.2.0"}'
```

> Pe Windows PowerShell folosește `curl.exe` sau `Invoke-RestMethod` în loc de `curl`.

### 4. Baza de date Supabase

Tabelele necesare: `profiles`, `teacher_profiles`, `student_profiles`, `classrooms`, `classroom_students`, `course_materials`.

Tipul enum `classroom_type` acceptă valorile: `liceu`, `optional`, `club`, `bacalaureat`.

<details>
<summary>SQL pentru tabelele <code>classroom_students</code> și <code>course_materials</code></summary>

```sql
create table classroom_students (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid references classrooms(id) on delete cascade,
  student_id uuid references student_profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  unique (classroom_id, student_id)
);

create table course_materials (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid references classrooms(id) on delete cascade,
  title text not null,
  file_url text not null,
  file_name text,
  uploaded_by uuid references teacher_profiles(id),
  created_at timestamptz default now()
);
```

</details>

Creează în Supabase Storage un bucket **public** numit `course-materials`.

### 5. Pornirea serverului

```bash
cd backend
node src/server.js
```

Aplicația rulează la **http://localhost:3000**.

### 6. Primii pași

1. Deschide `/login.html` și creează un cont de **Profesor**
2. Creează un classroom și copiază codul de invitație
3. Creează un al doilea cont, de **Elev**, și înscrie-l în clasă cu acel cod
4. Ca profesor, adaugă o temă cu input și output așteptat; ca elev, rezolv-o în editor

## Structura proiectului

```
backend/
├── src/
│   ├── controllers/   # logica de business (auth, classroom, homework, material)
│   ├── routes/        # rutele Express
│   ├── middleware/    # autentificare JWT, roluri, rate limiting
│   ├── models/        # scheme Mongoose (User, Homework, Submission)
│   ├── config/        # conexiunea Supabase
│   ├── Utils/         # criptare AES și semnături ECC
│   └── server.js
frontend/
└── public/
    ├── login.html
    ├── dashboard-teacher.html / dashboard-student.html
    ├── classrooms-teacher.html / classrooms-student.html
    ├── settings.html · coming-soon.html · 404.html
    ├── js/            # logica fiecărei pagini (+ sidebar, toast, temă)
    └── css/           # dashboard, theme (dark mode), polish
```
## Planuri de viitor

- [ ] Sistem de niveluri individuale, cu deblocarea altor limbaje de programare în compilator
- [ ] Nivel de classroom, cumulat cu cel individual
- [ ] Traducere completă RO/EN
- [ ] Mesagerie și calendar
- [ ] Editare de teme și classroom-uri
- [ ] Trimitere reală de emailuri (resetare parolă, verificare cont)

## Licență

Proiect realizat în scop educațional (ULBS).
