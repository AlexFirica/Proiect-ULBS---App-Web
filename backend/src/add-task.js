// add-task.js
async function adaugaTemaNoua() {
  try {
    const response = await fetch('http://localhost:3000/api/homeworks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: "Adunarea a două numere",
        description: "Scrie un program în C++ care citește două numere de la tastatură și afișează suma lor.",
        dueDate: "2026-12-31T23:59:59.000Z",
        subject: "Informatica",
        isCodingTask: true,       // Marcăm că este o temă de cod
        testInput: "10 15\n",     // Datele secrete de intrare
        expectedOutput: "25\n",   // Rezultatul corect așteptat
        xpReward: 50              // Punctele XP oferite
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Tema de programare a fost creată cu succes!");
      console.log("ID-ul nou (copiază-l pentru editor):", data._id);
    } else {
      console.log("❌ Eroare de la server:", data);
    }

  } catch (error) {
    console.error("❌ Eroare de conexiune:", error.message);
  }
}

adaugaTemaNoua();