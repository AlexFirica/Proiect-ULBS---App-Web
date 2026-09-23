# Codero — Platformă de învățare pentru programare

Platformă de tip Google Classroom, dedicată predării programării (C++), cu compilator integrat, teme evaluate automat și sistem de XP.

## Cerințe

- Node.js (v18+)
- MongoDB (local sau Atlas)
- Cont Supabase (Postgres + Auth + Storage)
- Docker Desktop (pentru compilatorul Piston, rulat local)

## 1. Configurare backend

```bash
cd backend
npm install
```

Creează fișierul `.env` în folderul `backend`, cu:

```
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/codeedu
JWT_SECRET=alege-un-secret-lung-si-random
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=cheia-ta-de-service-role
FRONTEND_URL=http://localhost:3000
PISTON_API_URL=http://localhost:2000/api/v2
```

## 2. Pornire compilator (Piston, prin Docker)

```bash
docker volume create piston_data
docker run -d --name piston_api -p 2000:2000 --privileged -v piston_data:/piston ghcr.io/engineer-man/piston
```

Instalează pachetul de compilare C++ (o singură dată):

```bash
curl -X POST http://localhost:2000/api/v2/packages -H "Content-Type: application/json" -d "{\"language\":\"gcc\",\"version\":\"10.2.0\"}"
```

## 3. Configurare bază de date Supabase

În Supabase, tabelele necesare: `profiles`, `teacher_profiles`, `student_profiles`, `classrooms`, `classroom_students`, `course_materials`. Vezi schema completă în `docs/supabase-schema.sql` (dacă există) sau recreează structura descrisă în diagrama proiectului.

Bucket de Storage necesar: `course-materials` (public).

## 4. Pornire server

```bash
cd backend
node src/server.js
```

Aplicația rulează la `http://localhost:3000`.

## 5. Autentificare — conturi de test

Înregistrează un cont de Profesor și unul de Elev din pagina de login (`/login.html`). Elevul se înscrie într-un classroom cu codul de invitație generat de profesor.

## Structură proiect

```
backend/
  src/
    controllers/   — logica de business (auth, classroom, homework, material)
    routes/        — definirea rutelor Express
    middleware/     — autentificare JWT, roluri, rate limiting
    models/        — scheme Mongoose (User, Homework, Submission)
    config/        — conexiuni Supabase, Redis
frontend/
  public/
    dashboard-teacher.html / dashboard-student.html
    classrooms-teacher.html / classrooms-student.html
    settings.html, coming-soon.html, login.html
    js/            — logica fiecărei pagini
    css/           — stiluri (dashboard, theme/dark-mode, polish)
```

## Probleme cunoscute / limitări

- Traducerea RO/EN salvează doar preferința, nu traduce interfața.
- Secțiunile Mesaje, Calendar, Fișierele mele, Cursuri sunt marcate „în curând”.
- Compilatorul necesită Docker + Piston pornit local pe mașina pe care rulează backend-ul.
