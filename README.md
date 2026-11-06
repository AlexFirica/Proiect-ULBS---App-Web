<div align="center">

# `</>` Codero

**Platformă de învățare pentru programare — clase virtuale, teme evaluate automat, modul de Antrenament C++ și compilator integrat.**

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20Storage-3ECF8E?logo=supabase&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Piston-2496ED?logo=docker&logoColor=white)
![Status](https://img.shields.io/badge/status-în%20dezvoltare-orange)

</div>

---

## Despre proiect

**Codero** este o platformă web educațională (de tip *Google Classroom*), concepută special pentru predarea și exersarea programării în limbajul C++. 

Profesorii pot crea clase virtuale, distribui materiale și publica teme cu teste de evaluare automată. Elevii se înscriu prin coduri unice de invitație, rezolvă problemele într-un editor Monaco integrat cu compilare în timp real, participă la sesiuni de **Antrenament C++** și acumulează puncte de experiență (**XP**) pentru a urca în clasament.

---

## Funcționalități

### Pentru profesori
- **Gestiune clase:** Creare de classroom-uri (Liceu, Opțional, Facultate, Bacalaureat) cu generare automată de cod de invitație.
- **Teme & Evaluare:** Creare de teme cu seturi de *input/output așteptat*, termene limită și recompense XP configurabile.
- **Materiale de curs:** Încărcare de materiale (PDF, imagini etc.) salvate în Supabase Storage, cu previzualizare directă în interfață.
- **Progres & Clasament:** Tabel complet cu elevii înscriși, punctajul XP acumulat, nivelul fiecăruia și clasamentul pe clasă.
- **Administrare:** Ștergere și organizare de classroom-uri și teme.

### Pentru elevi
- **Înscriere simplă:** Alăturare în clase pe baza codului de invitație transmis de profesor.
- **Editor C++ (Monaco):** Mediu de redactare cu evidențiere de sintaxă, rulare pe input customizat și compilare reală.
- **Modul Antrenament C++:** Secțiune dedicată rezolvării de întrebări de sintaxă și concepte C++ cu verificare instantă și acumulare de XP.
- **Terminal de Debug:** Afișare directă a erorilor și avertismentelor generate la compilare.
- **Evaluare automată:** Validarea soluțiilor și acordarea XP-ului o singură dată per temă/întrebare rezolvată corect.
- **Sistem de Gamification:** Calculare automată a nivelului, progress bar pentru experiență, clasamente live și indicatori de deadline.
- **Mod Liber (Sandbox C++):** Compilator accesibil direct din sidebar pentru experimentat cod fără cerințe de temă.

### Generale & UI/UX
- **Sistem i18n (Multilanguage):** Suport complet și comutare dinamică între **Română** și **Engleză** (detectare din localStorage / atribute HTML, sincronizare instantă în interfață).
- **Sidebar & TopNav Dinamice:** Meniu lateral interactiv cu stări active, gestionare dinamică a avatarului utilizatorului și buton securizat de deconectare.
- **Personalizare:** Dark / Light mode salvat per sesiune, notificări toast, efecte vizuale (confetti la finalizarea temelor), loading skeletons și pagină 404 personalizată.
- **Setări cont:** Gestionare profil, schimbare parolă și selectare preferințe de limbă.

---

## Tehnologii

| Strat | Tehnologii |
|---|---|
| **Frontend** | HTML, CSS, JavaScript (Vanilla ES6+), Monaco Editor, canvas-confetti, sistem i18n personalizat |
| **Backend** | Node.js, Express.js |
| **Baze de date** | **Supabase (PostgreSQL, Auth, Storage):** clase, profiluri, înscrieri, materiale de curs · **MongoDB (Mongoose):** utilizatori, teme, întrebări antrenament, trimiteri (submissions) |
| **Execuție cod** | [Piston](https://github.com/engineer-man/piston) (container izolat Docker pentru compilare securizată C++) |
| **Autentificare** | JWT (JSON Web Tokens), hash de parole cu Argon2id |

---

## Securitate

- **Criptare parole:** Stocare securizată a parolelor folosind **Argon2id**.
- **Autentificare & Autorizare:** Token-uri **JWT** (valabilitate 24h) și middleware dedicat pentru controlul accesului pe roluri (`teacher` / `student`).
- **Protecție date:** Descrierile temelor și resursele sensibile sunt criptate **AES-256-GCM** și verificate cu semnături **ECC (P-256)**.
- **Rate Limiting:** Protecție împotriva atacurilor de tip brute-force pe rutele de login (max. 5 încercări / 15 min), înregistrare și resetare de parolă.
- **Execuție securizată (Sandbox):** Codul C++ trimis de elevi rulează izolat în Docker prin Piston, având limite stricte de timp de execuție și memorie.

---

## Instalare și rulare

### Cerințe preliminare

- **Node.js** (v18 sau mai nou)
- **MongoDB** (instanță locală sau MongoDB Atlas)
- Cont **[Supabase](https://supabase.com)**
- **Docker Desktop** (activ pentru compilatorul Piston)

### 1. Clonare și instalare dependențe

```bash
git clone <url-repository>
cd <folder-proiect>/backend
npm install
```

### 2. Configurare variabile de mediu

Creează fișierul `.env` în directorul `backend/`:

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
| `MONGO_URI` | String-ul de conexiune la instanța MongoDB |
| `JWT_SECRET` | Secretul utilizat pentru semnarea token-urilor de sesiune |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Credențialele Supabase (cheia *service role* se păstrează exclusiv pe backend) |
| `PISTON_API_URL` | Adresa endpoint-ului Piston (rulat local în Docker) |
| `AES_SECRET` | Cheia secretă exact de 32 de caractere pentru criptarea AES |

> ⚠️ **Atenție:** Nu includeți fișierul `.env` în versiunile publice de Git!

### 3. Pornire Container Compilator (Piston)

Rulează instanța Piston în Docker:

```bash
docker volume create piston_data
docker run -d --name piston_api -p 2000:2000 --privileged -v piston_data:/piston ghcr.io/engineer-man/piston
```

Instalează pachetul de compilare pentru C++ (gcc 10.2.0):

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language":"gcc","version":"10.2.0"}'
```
*(Pe Windows PowerShell folosește `curl.exe` sau `Invoke-RestMethod`).*

### 4. Configurare Bază de Date Supabase

Creează tabelele principale în Supabase SQL Editor:

```sql
-- Enum pentru tipul de classroom
create type classroom_type as enum ('liceu', 'optional', 'club', 'bacalaureat');

-- Tabela pentru înscrieri elevi în clase
create table classroom_students (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid references classrooms(id) on delete cascade,
  student_id uuid references student_profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  unique (classroom_id, student_id)
);

-- Tabela pentru materiale de curs
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

*Creează în Supabase Storage un bucket **public** numit `course-materials` pentru încărcarea fișierelor.*

### 5. Pornire Server Backend

```bash
cd backend
node src/server.js
```
Aplicația va fi accesibilă în browser la adresa: **`http://localhost:3000`**.

### 6. Fluxul rapid de testare

1. Navighează la `/login.html` și înregistrează un cont de **Profesor**.
2. Creează un classroom nou și copiază codul de invitație generat.
3. Deschide o fereastră Incognito / alt browser, înregistrează un cont de **Elev** și înscrie-te în clasă folosind codul.
4. Ca profesor, adaugă o temă nouă cu teste de input/output; ca elev, rezolvă problema în editorul Monaco sau încearcă modulul de **Antrenament C++**.

---

## Structura proiectului

```
backend/
├── src/
│   ├── controllers/   # Logica de business (auth, classroom, homework, material, training)
│   ├── routes/        # Rutele Express (API REST)
│   ├── middleware/    # Autentificare JWT, verificare roluri, rate limiting
│   ├── models/        # Scheme Mongoose (User, Homework, Submission, Question)
│   ├── config/        # Conexiuni MongoDB & Supabase
│   ├── Utils/         # Utilitare criptare AES-256 și semnături ECC
│   └── server.js      # Punctul de intrare în aplicație
frontend/
└── public/
    ├── login.html
    ├── dashboard-teacher.html / dashboard-student.html
    ├── classrooms-teacher.html / classrooms-student.html
    ├── antrenament.html        # Pagina modulului de Antrenament C++
    ├── settings.html · coming-soon.html · 404.html
    ├── js/                    # Logica client (sidebar.js, i18n, toast, avatar-icon.js)
    └── css/                   # Stiluri UI, Dark Mode & Layouts
```

---

## Licență

Proiect dezvoltat în scop educațional în cadrul **Universității „Lucian Blaga” din Sibiu (ULBS)**.