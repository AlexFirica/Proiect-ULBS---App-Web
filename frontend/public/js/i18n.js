// frontend/public/js/i18n.js
// Traducere RO -> EN pentru toată interfața, fără să adaugi atribute în HTML.
// Textele-sursă rămân în română; când limba = 'en', scriptul înlocuiește textele
// (noduri text + placeholder/title/aria-label/alt), inclusiv pe cele generate
// dinamic de alte scripturi (MutationObserver).
//
// Limba se păstrează în localStorage sub cheia 'language' (aceeași ca în settings.js).
// Depanare: în consolă rulează i18n.report() ca să vezi textele încă netraduse.

(function () {
  'use strict';

  const STORAGE_KEY = 'language';
  const SUPPORTED = ['ro', 'en'];

  // ───────────────────────── DICȚIONAR (potrivire exactă) ─────────────────────────
  const RAW = {
    // ── Titluri de pagină ──
    'Codero - Classrooms': 'Codero - Classrooms',
    'Codero - Dashboard Elev': 'Codero - Student Dashboard',
    'Codero - Dashboard Profesor': 'Codero - Teacher Dashboard',
    'Codero - Setări': 'Codero - Settings',
    'Codero - În curând': 'Codero - Coming soon',
    'Autentificare — Codero': 'Sign in — Codero',

    // ── Rol / antet ──
    'profesor': 'teacher',
    'elev': 'student',
    'Avatarul meu': 'My avatar',

    // ── Sidebar (ghicite din coming-soon.html; verifică în sidebar.js) ──
    'Cursuri': 'Courses',
    'Mesaje': 'Messages',
    'Fișierele mele': 'My files',
    'Setări': 'Settings',
    'Deconectare': 'Log out',
    'Ieșire': 'Log out',
    'Compilator': 'Compiler',
    'Planul tău': 'Your plan',
    'Cont Elev': 'Student account',
    'Classroom Gratuit': 'Free Classroom',
    'Ai acces la toate classroom-urile tale.': 'You have access to all your classrooms.',
    'Ai acces la toate funcționalitățile pentru profesori.': 'You have access to all teacher features.',
    'Deblochează cursuri interactive și materiale exclusive.': 'Unlock interactive courses and exclusive materials.',
    'Upgrade pentru elevii tăi': 'Upgrade for your students',
    'Recomandă Premium elevilor tăi pentru acces complet la cursurile interactive.': 'Recommend Premium to your students for full access to the interactive courses.',
    'Află mai multe →': 'Learn more →',

    // ── Dashboard (comun) ──
    'Iată o privire de ansamblu asupra activității tale.': 'Here is an overview of your activity.',
    'Nivelul tău': 'Your level',
    'Classroom-urile tale': 'Your classrooms',
    'Toate Classroom-urile tale': 'All your classrooms',
    '🔑 Intră într-o clasă': '🔑 Join a class',
    'Nu ești înscris în niciun classroom': "You haven't joined any classroom",
    'Introdu codul de invitație primit de la profesor pentru a te alătura unei clase.': 'Enter the invitation code you received from your teacher to join a class.',
    'Introdu codul de invitație primit de la profesor.': 'Enter the invitation code you received from your teacher.',
    'Prezentare generală': 'Overview',
    'Classroom-uri': 'Classrooms',
    'Teme de rezolvat': 'Homework to solve',
    'Teme rezolvate': 'Completed homework',
    'XP total': 'Total XP',
    'Acțiuni rapide': 'Quick actions',
    '💻 Deschide compilator': '💻 Open compiler',
    '📅 Vezi calendar': '📅 View calendar',
    'Vezi tot': 'View all',
    'Vezi toate': 'See all',
    'Nu ai nicio activitate programată.': 'You have no scheduled activities.',
    'Noutăți de la Codero': 'News from Codero',
    'Noutăți': 'News',

    // ── Dashboard profesor ──
    '+ Creează classroom': '+ Create classroom',
    '➕ Creează classroom': '➕ Create classroom',
    '+ Creează primul classroom': '+ Create your first classroom',
    'Nu ai creat niciun classroom încă': "You haven't created any classroom yet",
    'Începe prin a crea prima ta clasă.': 'Start by creating your first class.',
    'Începe prin a crea prima ta clasă pentru a adăuga elevi și teme.': 'Start by creating your first class to add students and homework.',
    'Total elevi': 'Total students',
    'Teme active': 'Active homework',
    'Rată medie de finalizare': 'Average completion rate',
    '📤 Încarcă material': '📤 Upload material',

    // ── Editor C++ ──
    '💻 Editor C++ - Evaluare Temă': '💻 C++ Editor - Homework Evaluation',
    'Editor Cod (C++)': 'Code Editor (C++)',
    'Mod Liber (Sandbox)': 'Free Mode (Sandbox)',
    'Poți rula orice cod dorești.': 'You can run any code you want.',
    'Poți scrie și testa orice cod dorești.': 'You can write and test any code you want.',
    'Poți scrie și testa orice cod dorești. Trimiterea oficială este dezactivată în acest mod.': 'You can write and test any code you want. Official submission is disabled in this mode.',
    '🧪 Date de intrare (Custom Input):': '🧪 Input data (Custom Input):',
    'Scrie numerele pentru test...': 'Type the numbers for the test...',
    'Testează': 'Test',
    'Trimite Final': 'Submit Final',
    '// Aici vor apărea rezultatele execuției...': '// Execution results will appear here...',
    '⏳ Se compilează și se rulează testul...': '⏳ Compiling and running the test...',
    '❌ Compilarea a eșuat. Vezi detalii în terminalul de debug de sub editor.': '❌ Compilation failed. See details in the debug terminal below the editor.',
    '❌ Codul nu compilează. Vezi detalii în terminalul de debug de sub editor.': '❌ The code does not compile. See details in the debug terminal below the editor.',
    '❌ Eroare gravă de conexiune cu serverul.': '❌ Serious connection error with the server.',
    '❌ Eroare de conexiune cu serverul.': '❌ Server connection error.',
    '⏳ Se evaluează soluția oficială pe server...': '⏳ Evaluating the official solution on the server...',
    'Eroare': 'Error',
    'Eroare de rețea': 'Network error',
    'Nu s-au putut încărca detaliile temei.': 'Could not load the homework details.',
    'Nu s-a putut contacta serverul.': 'Could not reach the server.',
    'Ești în Modul Liber (Sandbox). Pentru a trimite o temă oficială și a câștiga XP, deschide editorul dintr-o temă din Classroom!': "You're in Free Mode (Sandbox). To submit an official homework and earn XP, open the editor from a homework in a Classroom!",
    'Ești în Modul Liber (Sandbox). Deschide editorul dintr-o temă din Classroom pentru trimitere oficială!': "You're in Free Mode (Sandbox). Open the editor from a homework in a Classroom to submit officially!",

    // ── Modale classroom ──
    'Înscrie-te într-o clasă': 'Join a class',
    'Ex: 47EE5F': 'e.g. 47EE5F',
    'Anulează': 'Cancel',
    'Înscrie-mă': 'Join',
    'Creează un classroom': 'Create a classroom',
    'Nume Clasă': 'Class name',
    'Nume Clasă (ex: XII A - Informatică)': 'Class name (e.g. 12th A - Computer Science)',
    'Tip classroom': 'Classroom type',
    '🏫 Liceu': '🏫 High school',
    '✨ Opțional': '✨ Elective',
    '🏫 Facultate': '🏫 University',
    '🎓 Bacalaureat': '🎓 Baccalaureate',
    'Creează': 'Create',
    'Nume classroom': 'Classroom name',
    '📋 Copiază': '📋 Copy',
    '🗑️ Șterge': '🗑️ Delete',
    'Șterge classroom': 'Delete classroom',
    'XP Classroom': 'Classroom XP',
    '📝 Teme': '📝 Homework',
    '📚 Cursuri': '📚 Courses',
    '🏆 Clasament': '🏆 Leaderboard',
    '👥 Elevi': '👥 Students',
    'Elev': 'Student',
    'Nivel': 'Level',
    'Niciun elev înscris încă.': 'No students enrolled yet.',
    '+ Adaugă temă': '+ Add homework',
    'Titlu material': 'Material title',
    'Încarcă material': 'Upload material',
    'Adaugă temă nouă': 'Add new homework',
    'Titlul temei': 'Homework title',
    'Descriere': 'Description',
    'Date de intrare (Input test)': 'Input data (test input)',
    'Ex: 10 15': 'e.g. 10 15',
    'Output așteptat (exact)': 'Expected output (exact)',
    'Ex: Rezultatul este:25': 'e.g. The result is:25',
    'XP oferit': 'XP awarded',
    'Termen limită': 'Deadline',
    'Salvează tema': 'Save homework',
    '⬇ Descarcă': '⬇ Download',

    // ── Setări ──
    'Setări cont': 'Account settings',
    '🎨 Interfață': '🎨 Interface',
    'Mod întunecat (Dark mode)': 'Dark mode',
    '🌐 Limbă': '🌐 Language',
    '🔒 Schimbă parola': '🔒 Change password',
    'Parola actuală': 'Current password',
    'Parola nouă (min. 6 caractere)': 'New password (min. 6 characters)',
    'Confirmă parola nouă': 'Confirm new password',
    'Salvează parola nouă': 'Save new password',
    'Completează toate câmpurile.': 'Fill in all the fields.',
    'Parola nouă trebuie să aibă cel puțin 6 caractere.': 'The new password must be at least 6 characters long.',
    'Parolele nu coincid.': 'The passwords do not match.',
    'Parola a fost schimbată cu succes!': 'Password changed successfully!',
    'Eroare la schimbarea parolei.': 'Error changing the password.',
    'Eroare la conectarea cu serverul.': 'Error connecting to the server.',

    // ── În curând ──
    'În curând': 'Coming soon',
    'Această secțiune': 'This section',
    'Lucrăm la această funcționalitate. Revino în curând — o vom lansa cât mai repede posibil!': 'We are working on this feature. Come back soon — we will launch it as soon as possible!',
    '← Înapoi la Dashboard': '← Back to Dashboard',

    // ── Login / înregistrare ──
    'Învățare modernă,': 'Modern learning,',
    'rezultate reale.': 'real results.',
    'Cursuri interactive, feedback instant și progres măsurabil — pentru profesori și cursanți deopotrivă.': 'Interactive courses, instant feedback and measurable progress — for teachers and learners alike.',
    'cursanți activi': 'active learners',
    'profesori': 'teachers',
    'satisfacție': 'satisfaction',
    'Bun venit înapoi': 'Welcome back',
    'Intră în contul tău pentru a continua': 'Sign in to your account to continue',
    '🎓 Profesor': '🎓 Teacher',
    '📚 Cursant': '📚 Learner',
    'Continuă cu Google': 'Continue with Google',
    'sau cu email': 'or with email',
    'Parolă': 'Password',
    'Ai uitat parola?': 'Forgot your password?',
    'Parola ta': 'Your password',
    'email@exemplu.ro': 'email@example.com',
    'Ține-mă minte pe acest dispozitiv': 'Remember me on this device',
    'Intră în cont': 'Sign in',
    'Nu ai cont?': "Don't have an account?",
    'Înregistrează-te': 'Sign up',
    'Creează contul tău': 'Create your account',
    'Alege cum vrei să folosești platforma': 'Choose how you want to use the platform',
    'Profesor': 'Teacher',
    'Cursant': 'Learner',
    'Creează cursuri și monitorizează elevii': 'Create courses and monitor students',
    'Urmărește cursuri și dezvoltă-ți abilitățile': 'Follow courses and develop your skills',
    'sau înregistrează-te cu': 'or sign up with',
    'Continuă': 'Continue',
    'Datele contului': 'Account details',
    'Completează informațiile de bază': 'Fill in the basic information',
    'Nume complet': 'Full name',
    'ex. Maria Ionescu': 'e.g. Maria Ionescu',
    '← Înapoi': '← Back',
    'Setează parola': 'Set your password',
    'Ultima etapă — aproape ai terminat!': 'Last step — almost done!',
    'Minim 8 caractere': 'At least 8 characters',
    'O literă mare (A–Z)': 'An uppercase letter (A–Z)',
    'O literă mică (a–z)': 'A lowercase letter (a–z)',
    'O cifră (0–9)': 'A digit (0–9)',
    'Un caracter special (!@#…)': 'A special character (!@#…)',
    'Creează contul': 'Create account',
    'Cont creat!': 'Account created!',
    'Bine ai venit pe platformă.': 'Welcome to the platform.',
    'Alege rolul': 'Choose your role',
    'Statistici platformă': 'Platform statistics',
    'Închide fereastra': 'Close window',
    'Arată/ascunde parola': 'Show/hide password',

    // ── Mesaje de la backend (apar în toast-uri) ──
    'Ai luat deja bonusul de azi. Revino mâine!': "You've already claimed today's bonus. Come back tomorrow!",
    'Ai luat deja bonusul de azi.': "You've already claimed today's bonus.",
    'Nu ai destule monede.': "You don't have enough coins.",
    'Utilizator inexistent.': 'User not found.',
    'Tema nu a fost găsită.': 'Homework not found.',
    'Eroare la procesarea temei.': 'Error processing the homework.',
    'Eroare server.': 'Server error.',

    // ── classrooms-*.js / dashboard-*.js ──
    'Clasă fără nume': 'Unnamed class',
    'Cod invitație': 'Invitation code',
    '✅ Copiat!': '✅ Copied!',
    'Nicio temă momentan.': 'No homework at the moment.',
    'Niciun material încărcat.': 'No materials uploaded.',
    'Deschide': 'Open',
    'Vizualizează →': 'View →',
    'Se încarcă...': 'Loading...',
    'Eroare la încărcare.': 'Loading error.',
    '✓ La zi': '✓ Up to date',
    'Expirată': 'Expired',
    'Previzualizare indisponibilă pentru acest tip de fișier.': 'Preview not available for this file type.',
    'Deschide / descarcă fișierul': 'Open / download the file',

    // toast-uri
    'Introdu un nume pentru clasă!': 'Enter a name for the class!',
    'Te rugăm să introduci un nume pentru clasă!': 'Please enter a name for the class!',
    'Eroare la crearea clasei.': 'Error creating the class.',
    'Classroom creat cu succes!': 'Classroom created successfully!',
    'Classroom șters cu succes.': 'Classroom deleted successfully.',
    'Eroare la ștergerea classroom-ului.': 'Error deleting the classroom.',
    'Tema a fost ștearsă.': 'The homework was deleted.',
    'Eroare la ștergerea temei.': 'Error deleting the homework.',
    'Tema a fost adăugată!': 'The homework was added!',
    'Eroare la crearea temei.': 'Error creating the homework.',
    'Titlul și termenul limită sunt obligatorii.': 'Title and deadline are required.',
    'Introdu codul de invitație!': 'Enter the invitation code!',
    'Te-ai înscris cu succes în clasă!': 'You joined the class successfully!',
    'Cod invalid sau eroare la înscriere.': 'Invalid code or enrollment error.',
    'Cod invalid.': 'Invalid code.',
    'Completează titlul și alege un fișier.': 'Fill in the title and choose a file.',
    'Material încărcat cu succes!': 'Material uploaded successfully!',
    'Eroare la încărcarea materialului.': 'Error uploading the material.',
    'Deschide un classroom și mergi la tab-ul „Cursuri” pentru a încărca un material.': 'Open a classroom and go to the “Courses” tab to upload a material.',

    // confirm()
    'Sigur vrei să ștergi acest classroom? Acțiunea nu poate fi anulată.': 'Are you sure you want to delete this classroom? This action cannot be undone.',
    'Sigur vrei să ștergi acest classroom? Toate temele și materialele asociate vor rămâne, dar clasa dispare definitiv. Acțiunea nu poate fi anulată.': 'Are you sure you want to delete this classroom? The associated homework and materials will remain, but the class will disappear permanently. This action cannot be undone.',
    'Sigur vrei să ștergi această temă?': 'Are you sure you want to delete this homework?',
    'Sigur vrei să ștergi această temă? Acțiunea nu poate fi anulată.': 'Are you sure you want to delete this homework? This action cannot be undone.',
    'Sigur vrei să te deconectezi?': 'Are you sure you want to log out?',

    // ── sidebar.js ──
    'Compilator C++ (Mod Liber)': 'C++ Compiler (Free Mode)',

    // ── login.js ──
    'Introdu o adresă de email validă.': 'Enter a valid email address.',
    'Parola nu poate fi goală.': 'The password cannot be empty.',
    'Se creează contul...': 'Creating account...',
    'Se verifică...': 'Verifying...',
    'Se trimite...': 'Sending...',
    'Trimite': 'Send',
    'Foarte slabă': 'Very weak',
    'Slabă': 'Weak',
    'Medie': 'Medium',
    'Bună': 'Good',
    'Puternică': 'Strong',
    'Numele trebuie să aibă cel puțin 2 caractere.': 'The name must be at least 2 characters long.',
    'Adresa de email nu este validă.': 'The email address is not valid.',
    'Parola nu îndeplinește cerințele minime.': 'The password does not meet the minimum requirements.',
    'Eroare la crearea contului.': 'Error creating the account.',
    'Serverul de backend nu poate fi contactat.': 'The backend server cannot be reached.',
    'Autentificare eșuată!': 'Sign-in failed!',
    'Nu se poate realiza conexiunea cu serverul Node.js.': 'Cannot connect to the Node.js server.',
    'Dacă emailul există, vei primi instrucțiuni.': 'If the email exists, you will receive instructions.',
    'Contul tău a fost creat cu succes.': 'Your account was created successfully.',

    // ── avatar.html: interfață ──
    '← Înapoi la dashboard': '← Back to dashboard',
    'zile)': 'days)',
    '⚔️ Simulează bătălie 1v1': '⚔️ Simulate 1v1 battle',
    '🛒 Cumpără': '🛒 Buy',
    '↩ Resetează': '↩ Reset',
    '💾 Salvează': '💾 Save',
    'Arhimag': 'Archmage',
    'Cavaler': 'Knight',
    'Ucenic': 'Apprentice',

    // tab-uri
    '💇 Păr': '💇 Hair',
    '🤨 Sprâncene': '🤨 Eyebrows',
    '👁️ Ochi': '👁️ Eyes',
    '👄 Expresie': '👄 Expression',
    '🕶️ Ochelari': '🕶️ Glasses',
    '💎 Cercei': '💎 Earrings',
    '✨ Detalii': '✨ Details',
    '👕 Ținută': '👕 Outfit',
    '⚔️ Armă': '⚔️ Weapon',
    '🛡️ Ramă': '🛡️ Frame',
    '🏷️ Titlu': '🏷️ Title',
    '🎨 Culori': '🎨 Colors',
    'Piele (gratuit)': 'Skin (free)',
    'Culoare păr (gratuit)': 'Hair color (free)',
    'Fundal (gratuit)': 'Background (free)',

    // stare iteme
    '✔ Echipat': '✔ Equipped',
    '✔ Gratuit': '✔ Free',
    '✔ Deținut': '✔ Owned',

    // iteme: general
    'Nimic': 'None',

    // iteme: ochelari / detalii
    'Lentile Debugger': 'Debugger Lenses',
    'Ochelari Syntax': 'Syntax Glasses',
    'Rame Subțiri Magice': 'Magic Thin Frames',
    'Vizor Linter': 'Linter Visor',
    'Ochelari Dark Mode': 'Dark Mode Glasses',
    'Monoclul lui Dijkstra': "Dijkstra's Monocle",
    'Monoclul Aurit': 'Gilded Monocle',
    'Pistrui Debug': 'Debug Freckles',
    'Obraji Hot Reload': 'Hot Reload Blush',
    'Semn din Naștere': 'Birthmark',
    'Mustața Senior Dev': 'Senior Dev Mustache',

    // iteme: ținute
    'Tricou de Bază': 'Basic T-shirt',
    'Tunică de Ucenic': "Apprentice's Tunic",
    'Tricou </Commit>': 'T-shirt </Commit>',
    'Hanorac Debugger': 'Debugger Hoodie',
    'Sacou Senior Dev': 'Senior Dev Blazer',
    'Tunică Ninja Runtime': 'Runtime Ninja Tunic',
    'Hanorac Matrix': 'Matrix Hoodie',
    'Armură de Oțel': 'Steel Armor',
    'Pelerina Recursivă': 'Recursive Cape',
    'Roba Arhimagului': "Archmage's Robe",
    'Armura de Aur Root': 'Golden Root Armor',

    // iteme: arme
    'Laptop-Grimoar': 'Laptop Grimoire',
    'Cartea Documentației': 'Book of Documentation',
    'Pumnalul Breakpoint': 'Breakpoint Dagger',
    'Scutul Firewall': 'Firewall Shield',
    'Arcul Async': 'Async Bow',
    'Bagheta Regex': 'Regex Wand',
    'Sabia Semicolon': 'Semicolon Sword',
    'Toporul Force-Push': 'Force-Push Axe',
    'Ciocanul Refactor': 'Refactor Hammer',
    'Bastonul Compilator': 'Compiler Staff',

    // iteme: companioni
    'Pisica Cache': 'Cache Cat',
    'Pinguinul Linux': 'Linux Penguin',
    'Vulpea Firefox': 'Firefox Fox',
    'Bufnița Stack Owl': 'Stack Owl',
    'Bug Domesticit': 'Tamed Bug',
    'Lupul Daemon': 'Daemon Wolf',
    'Robotul Bot': 'Bot Robot',
    'Dragonul Python': 'Python Dragon',
    'Unicornul Open Source': 'Open Source Unicorn',

    // iteme: rame
    'Ramă Novice': 'Novice Frame',
    'Ramă Bronz': 'Bronze Frame',
    'Ramă Argint': 'Silver Frame',
    'Ramă Aur': 'Gold Frame',
    'Ramă Diamant': 'Diamond Frame',
    'Ramă Legendă': 'Legend Frame',
    'Ramă Smarald': 'Emerald Frame',
    'Ramă Rubin': 'Ruby Frame',
    'Ramă Neon Roz': 'Neon Pink Frame',
    'Ramă Cosmică': 'Cosmic Frame',
    'Ramă Stack Overflow': 'Stack Overflow Frame',

    // iteme: titluri (apar și sub numele avatarului)
    'Ucenic Vrăjitor': 'Apprentice Wizard',
    'Slayer de Buguri': 'Bug Slayer',
    'Ninja Git': 'Git Ninja',
    'Stăpân Pointer': 'Pointer Master',
    'Fără Segfault': 'No Segfault',
    'Maestrul Recursiei': 'Master of Recursion',
    'Nemuritor 1v1': 'Immortal 1v1',
    'Campion Turneu': 'Tournament Champion',
    'Arhimag C++': 'C++ Archmage',
    'Regele Clasamentului': 'King of the Leaderboard',

    // toast-uri și erori
    'Nu ai destule monede! Fă daily login sau rezolvă teme.': "You don't have enough coins! Do the daily login or solve homework.",
    'Cumpără mai întâi item-urile nedeținute.': "Buy the items you don't own first.",
    'Ai item-uri blocate de nivel.': 'You have items locked by level.',
    'Avatarul a fost salvat pe profilul tău! 💾': 'Your avatar was saved to your profile! 💾',
    'Ai revenit la avatarul salvat.': 'You went back to your saved avatar.',
    'Backend indisponibil — mod demo (datele nu se salvează pe server).': 'Backend unavailable — demo mode (data is not saved on the server).',
    'Sesiune expirată': 'Session expired',
    'Eroare server': 'Server error'
  };

  // ───────────────────────── PATTERNS (text cu valori variabile) ─────────────────────────
  // fn primește (matchComplet, grup1, grup2, ...)
  const PATTERNS = [
    [/^Bun venit, ([\s\S]*)$/, (_, name) => 'Welcome, ' + name],
    [/^Nivel (\d+)$/, (_, n) => 'Level ' + n],
    [/^Felicitări! Ai primit (\d+) XP!$/, (_, n) => 'Congratulations! You received ' + n + ' XP!'],
    [/^(.+) — în curând$/, (_, name) => tx(name) + ' — coming soon'],
    [/^(\d+) elevi înscriși$/, (_, n) => n + ' students enrolled'],
    [/^Cod invitație: (.*)$/, (_, c) => 'Invitation code: ' + c],
    [/^(\d+) de rezolvat$/, (_, n) => n + ' to solve'],
    [/^Expiră azi$/, () => 'Expires today'],
    [/^Expiră în (\d+)z$/, (_, n) => 'Expires in ' + n + 'd'],
    [/^(\d+)z rămase$/, (_, n) => n + 'd left'],
    [/^(.*) \(tu\)$/, (_, n) => n + ' (you)'],
    [/^(\d+) XP \(clasă\)$/, (_, n) => n + ' XP (class)'],
    [/^(\d+) XP total \((\d+)\/100 spre nivelul (\d+)\)$/, (_, xp, a, l) => xp + ' total XP (' + a + '/100 to level ' + l + ')'],
    [/^Integrare (.+) — de implementat cu OAuth\.$/, (_, p) => p + ' integration — to be implemented with OAuth.'],
    [/^Bine ai venit, (.*)! Contul tău a fost creat\.$/, (_, n) => 'Welcome, ' + n + '! Your account has been created.'],

    // ── avatar.html ──
    // nume generate: gen('h','Coamă',...) => "Coamă Boot", "Coamă Loop"...
    [/^Coamă (.+)$/, (_, w) => 'Hairstyle ' + w],
    [/^Sprânceană (.+)$/, (_, w) => 'Eyebrow ' + w],
    [/^Privire (.+)$/, (_, w) => 'Gaze ' + w],
    [/^Zâmbet (.+)$/, (_, w) => 'Smile ' + w],
    [/^Cercel (.+)$/, (_, w) => w + ' Earring'],
    [/^🔒 Nivel (\d+)$/, (_, n) => '🔒 Level ' + n],
    [/^Lvl (\d+) • (.+)$/, (_, n, r) => 'Lvl ' + n + ' • ' + tx(r)],
    [/^🛒 Cumpără \((\d+)\) • 🪙 (\d+)$/, (_, n, c) => '🛒 Buy (' + n + ') • 🪙 ' + c],
    [/^Ai cumpărat (\d+) item-uri! 🎉$/, (_, n) => 'You bought ' + n + ' items! 🎉'],
    [/^🎉 Level up! Nivel (\d+) – verifică item-urile de rang noi!$/, (_, n) => '🎉 Level up! Level ' + n + ' – check the new rank items!'],
    [/^Daily login: \+(\d+) 🪙 și \+(\d+) XP \(streak (\d+)\)$/, (_, c, x, s) => 'Daily login: +' + c + ' 🪙 and +' + x + ' XP (streak ' + s + ')'],
    [/^Daily login: \+(\d+) 🪙 \(streak (\d+)\)$/, (_, c, s) => 'Daily login: +' + c + ' 🪙 (streak ' + s + ')'],
    [/^\u2694 Victorie (\d+)–(\d+)! \+40 XP, \+90 🪙$/, (_, a, b) => '⚔️ Victory ' + a + '–' + b + '! +40 XP, +90 🪙'],
    [/^\u2694 Înfrângere (\d+)–(\d+)\. \+10 XP, \+20 🪙$/, (_, a, b) => '⚔️ Defeat ' + a + '–' + b + '. +10 XP, +20 🪙']
  ];

  // ───────────────────────── SUBSTRINGS (texte multi-linie / compuse) ─────────────────────────
  const SUBS = [
    ['✅ Test finalizat!', '✅ Test finished!'],
    ['❌ Eroare de execuție:', '❌ Runtime error:'],
    ['Verifică sintaxa codului.', 'Check your code syntax.'],
    ['🏆 Ai câștigat:', '🏆 You earned:'],
    ['[Detalii]', '[Details]'],
    ['Output obținut:', 'Output obtained:'],
    ['Output așteptat:', 'Expected output:'],
    ['Felicitări! Soluție corectă!', 'Congratulations! Correct solution!'],
    ['Rezolvare corectă! (Tema a fost deja punctată anterior)', 'Correct solution! (This homework was already scored before)'],
    ['Rezultatul obținut nu se potrivește cu cel așteptat.', 'The output does not match the expected one.'],
    ['Eroare de compilare!', 'Compilation error!']
  ];

  // ───────────────────────── MOTOR ─────────────────────────
  // Ignorăm variația de emoji (U+FE0F) și spațiile multiple la căutare.
  const norm = (s) => s.replace(/\uFE0F/g, '').replace(/\s+/g, ' ');
  const EXACT = Object.create(null); // fără prototip: "constructor", "toString" etc. nu sunt chei valide
  Object.keys(RAW).forEach((k) => { EXACT[norm(k)] = RAW[k]; });

  const SKIP_TEXT = 'script,style,textarea,code,pre,noscript,.monaco-editor,#monaco-container,#debug-terminal,[data-no-i18n]';
  const SKIP_ATTR = '.monaco-editor,#monaco-container,[data-no-i18n]';
  // subarbori pe care nu-i parcurgem deloc (Monaco generează mult DOM, la fiecare tastă)
  const SKIP_TREE = 'script,style,noscript,.monaco-editor,#monaco-container,#debug-terminal,[data-no-i18n]';
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  const HAS_WORDS = /[A-Za-zĂÂÎȘȚăâîșțşţ]{2}/;

  let lang = 'ro';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.includes(saved)) lang = saved;
  } catch (e) {}

  const textState = new WeakMap(); // nod text -> { orig, shown }
  const attrState = new WeakMap(); // element  -> { attr: { orig, shown } }
  const untranslated = new Set();

  // Întoarce traducerea sau null dacă nu există.
  function translate(str) {
    const core = str.trim();
    if (!core) return null;
    const lead = str.slice(0, str.indexOf(core));
    const trail = str.slice(str.indexOf(core) + core.length);

    let out = EXACT[norm(core)];

    if (out === undefined) {
      const pcore = core.replace(/\uFE0F/g, ''); // pattern-urile sunt scrise fără variation selector
      for (const [re, fn] of PATTERNS) {
        const m = pcore.match(re);
        if (m) { out = fn.apply(null, m); break; }
      }
    }
    if (out === undefined) {
      let s = core, changed = false;
      for (const [a, b] of SUBS) {
        if (s.includes(a)) { s = s.split(a).join(b); changed = true; }
      }
      if (changed) out = s;
    }
    return out === undefined ? null : lead + out + trail;
  }

  // Traduce sau lasă textul neschimbat (folosit intern în pattern-uri).
  function tx(s) {
    const r = translate(s);
    return r === null ? s : r;
  }

  function processText(node) {
    const p = node.parentElement;
    if (!p || p.closest(SKIP_TEXT)) return;
    const cur = node.nodeValue;
    let st = textState.get(node);
    // dacă alt script a schimbat textul între timp, noua valoare devine sursa
    if (!st || cur !== st.shown) { st = { orig: cur, shown: cur }; textState.set(node, st); }

    let next = st.orig;
    if (lang === 'en') {
      const tr = translate(st.orig);
      if (tr !== null) next = tr;
      else if (HAS_WORDS.test(st.orig)) untranslated.add(st.orig.trim());
    }
    if (next !== cur) { node.nodeValue = next; st.shown = next; }
  }

  function processAttrs(el) {
    if (el.closest(SKIP_ATTR)) return;
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const cur = el.getAttribute(a);
      let all = attrState.get(el);
      if (!all) { all = {}; attrState.set(el, all); }
      let st = all[a];
      if (!st || cur !== st.shown) { st = { orig: cur, shown: cur }; all[a] = st; }

      let next = st.orig;
      if (lang === 'en') {
        const tr = translate(st.orig);
        if (tr !== null) next = tr;
        else if (HAS_WORDS.test(st.orig)) untranslated.add(st.orig.trim());
      }
      if (next !== cur) { el.setAttribute(a, next); st.shown = next; }
    }
  }

  function walk(root) {
    if (root.nodeType === 3) { processText(root); return; }
    if (root.nodeType !== 1) return;
    if (root.closest(SKIP_TREE)) return; // în Monaco / script etc.: nu intrăm deloc
    processAttrs(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        return n.nodeType === 1 && n.matches(SKIP_TREE)
          ? NodeFilter.FILTER_REJECT   // sare peste tot subarborele
          : NodeFilter.FILTER_ACCEPT;
      }
    });
    let n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) processText(n); else processAttrs(n);
    }
  }

  function inSkip(t) {
    const el = t.nodeType === 1 ? t : t.parentElement;
    return !!(el && el.closest(SKIP_TREE));
  }

  const observer = new MutationObserver((muts) => {
    observer.disconnect(); // nu reacționăm la propriile modificări
    try {
      for (const m of muts) {
        if (inSkip(m.target)) continue; // Monaco, script etc.
        if (m.type === 'childList') m.addedNodes.forEach(walk);
        else if (m.type === 'characterData') processText(m.target);
        else if (m.type === 'attributes') processAttrs(m.target);
      }
    } finally { startObserving(); }
  });

  function startObserving() {
    observer.observe(document.documentElement, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ATTRS
    });
  }

  function applyAll() {
    observer.disconnect();
    walk(document.documentElement);
    document.documentElement.lang = lang;
    if (lang === 'en') startObserving();
  }

  function setLang(l) {
    if (!SUPPORTED.includes(l)) return;
    lang = l;
    try { localStorage.setItem(STORAGE_KEY, l); } catch (e) {}
    applyAll();
    document.dispatchEvent(new CustomEvent('langchange', { detail: l }));
  }

  // ───────────────────────── API PUBLIC ─────────────────────────
  window.i18n = {
    getLang: () => lang,
    setLang,
    // pentru texte construite în JS: showToast(i18n.t('Salvat!'))
    t: (s) => (lang === 'en' ? tx(s) : s),
    // pentru date/ore: new Date(x).toLocaleString(i18n.locale())
    locale: () => (lang === 'en' ? 'en-GB' : 'ro-RO'),
    // lista textelor care nu au traducere (rulează în consolă, în modul EN)
    report: () => {
      const list = Array.from(untranslated).sort();
      console.log('Texte netraduse (' + list.length + '):');
      console.log(JSON.stringify(list, null, 2));
      return list;
    }
  };

  // ───────────────────────── PORNIRE ─────────────────────────
  // alert() și confirm() nu sunt în DOM, deci le traducem aici
  ['alert', 'confirm'].forEach((fn) => {
    const orig = window[fn];
    window[fn] = (msg) => orig.call(window, window.i18n.t(String(msg)));
  });

  if (lang === 'en') {
    // Nu observăm în timpul parsării HTML-ului: parserul poate adăuga text în noduri
    // deja modificate de noi. Pornim abia la DOMContentLoaded (primul listener înregistrat).
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyAll);
    else applyAll();
  } else {
    document.documentElement.lang = 'ro';
  }
})();