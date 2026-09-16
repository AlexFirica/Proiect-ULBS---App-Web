const Homework = require('../models/homework.model');
const axios = require('axios');

const { 
  encryptAES, 
  decryptAES, 
  signDataECC, 
  verifySignatureECC 
} = require('../Utils/cryptoUtils'); // Ajustează calea după caz

// 1. Creează o temă nouă (Criptare AES + Semnare ECC + Asignare Classroom)
const createHomework = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      dueDate, 
      subject, 
      classroomId,     // <-- Preluăm ID-ul clasei din cerere
      isCodingTask,    // <-- Flag pentru exercițiu de programare
      testInput,       // <-- Datele ascunse de input pentru cin
      expectedOutput,  // <-- Output-ul așteptat
      xpReward         // <-- Punctele XP oferite
    } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ message: 'Titlul și data limită sunt obligatorii.' });
    }

    if (!classroomId) {
      return res.status(400).json({ message: 'ID-ul clasei (classroomId) este obligatoriu pentru a crea o temă.' });
    }

    // Criptăm descrierea cu AES-256-GCM
    const encryptedDescription = encryptAES(description);

    // Generăm semnătura ECC pe baza datelor importante ale temei
    // Important: Includem și classroomId în șirul semnat pentru a proteja integritatea clasei!
    const payloadToSign = `${title}-${encryptedDescription}-${dueDate}-${classroomId}`;
    const signature = signDataECC(payloadToSign);

    const newHomework = new Homework({
      title,
      description: encryptedDescription,
      dueDate,
      subject,
      classroomId, // <-- Salvăm legătura cu clasa
      signature,
      isCodingTask: isCodingTask !== undefined ? isCodingTask : true, // Implicit e task de cod
      testInput: testInput || "",
      expectedOutput: expectedOutput || "",
      xpReward: xpReward || 10
    });

    const savedHomework = await newHomework.save();
    res.status(201).json(savedHomework);
  } catch (error) {
    console.error("Eroare la crearea temei:", error);
    res.status(500).json({ message: 'Eroare la crearea temei.', error: error.message });
  }
};

// 2. Obține toate temele (Decriptare + Validare Integritate)
const getAllHomeworks = async (req, res) => {
  try {
    const homeworks = await Homework.find().sort({ dueDate: 1 });

    // Procesăm fiecare temă din listă
    const processedHomeworks = homeworks.map(doc => {
      const homework = doc.toObject();

      // Verificăm dacă tema a fost modificată direct în baza de date (folosind ECC)
      const payloadToVerify = `${homework.title}-${homework.description}-${homework.dueDate.toISOString()}`;
      const isIntegrityOk = verifySignatureECC(payloadToVerify, homework.signature);

      // Decriptăm descrierea cu AES
      homework.description = decryptAES(homework.description);
      homework.isSecureAndAuthentic = isIntegrityOk; // Indicator pentru frontend

      return homework;
    });

    res.status(200).json(processedHomeworks);
  } catch (error) {
    res.status(500).json({ message: 'Eroare la obținerea listei.', error: error.message });
  }
};

// 3. Obține o singură temă după ID (Decriptare + Validare Integritate)
const getHomeworkById = async (req, res) => {
  try {
    const doc = await Homework.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Tema nu a fost găsită.' });
    }

    const homework = doc.toObject();

    // Validare ECC
    const payloadToVerify = `${homework.title}-${homework.description}-${homework.dueDate.toISOString()}`;
    const isIntegrityOk = verifySignatureECC(payloadToVerify, homework.signature);

    // Decriptare AES
    homework.description = decryptAES(homework.description);
    homework.isSecureAndAuthentic = isIntegrityOk;

    if (!isIntegrityOk) {
      console.warn(`[WARNING] Date compromise la tema cu ID-ul: ${homework._id}`);
    }

    res.status(200).json(homework);
  } catch (error) {
    res.status(500).json({ message: 'Eroare la căutare.', error: error.message });
  }
};

// 4. Actualizează o temă (Criptare nouă + Semnătură nouă)
const updateHomework = async (req, res) => {
  try {
    const { title, description, dueDate, status, subject } = req.body;

    // Pasul 1: Preluăm tema veche pentru a completa datele neschimbate
    const currentHomework = await Homework.findById(req.params.id);
    if (!currentHomework) {
      return res.status(404).json({ message: 'Tema nu a fost găsită.' });
    }

    // Stabilim valorile finale (cele noi transmise sau cele vechi existente)
    const finalTitle = title || currentHomework.title;
    const finalDueDate = dueDate ? new Date(dueDate) : currentHomework.dueDate;
    const finalSubject = subject || currentHomework.subject;
    const finalStatus = status || currentHomework.status;

    let finalEncryptedDescription = currentHomework.description;
    if (description !== undefined) {
      finalEncryptedDescription = encryptAES(description);
    }

    // Generăm noua semnătură ECC pentru noile date consolidate
    const payloadToSign = `${finalTitle}-${finalEncryptedDescription}-${finalDueDate.toISOString()}`;
    const newSignature = signDataECC(payloadToSign);

    const updatedHomework = await Homework.findByIdAndUpdate(
      req.params.id,
      {
        title: finalTitle,
        description: finalEncryptedDescription,
        dueDate: finalDueDate,
        subject: finalSubject,
        status: finalStatus,
        signature: newSignature
      },
      { new: true, runValidators: true }
    );

    const responseObj = updatedHomework.toObject();
    responseObj.description = decryptAES(responseObj.description);

    res.status(200).json(responseObj);
  } catch (error) {
    res.status(500).json({ message: 'Eroare la actualizare.', error: error.message });
  }
};

// 5. Șterge o temă (Rămâne neschimbat, nu necesită decriptare)
const deleteHomework = async (req, res) => {
  try {
    const deletedHomework = await Homework.findByIdAndDelete(req.params.id);
    if (!deletedHomework) {
      return res.status(404).json({ message: 'Tema nu a fost găsită.' });
    }
    res.status(200).json({ message: 'Tema a fost ștearsă.' });
  } catch (error) {
    res.status(500).json({ message: 'Eroare la ștergere.', error: error.message });
  }
};

// 6. Evaluarea codului C++ trimis de elev
// 6. Evaluarea codului (Mod Simulat pentru Testare)
const submitCodeTask = async (req, res) => {
  try {
    const { sourceCode } = req.body;
    const homework = await Homework.findById(req.params.id);

    if (!homework || !homework.isCodingTask) {
      return res.status(400).json({ message: 'Tema nu există sau nu este un exercițiu de programare.' });
    }

    // Afișăm în terminal codul primit pentru a fi siguri că ajunge corect
    console.log("Cod primit de la elev:\n", sourceCode);

    // Simulăm o întârziere de 1 secundă (ca și cum am aștepta un compilator)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // SIMULARE: Presupunem că programul a rulat perfect și a generat output-ul așteptat
    const actualOutput = homework.expectedOutput.trim();
    const expectedOutput = homework.expectedOutput.trim();

    // Returnăm răspunsul către interfață
    if (actualOutput === expectedOutput) {
      return res.status(200).json({
        success: true,
        message: "Răspuns corect! Felicitări! (Test Simulat)",
        output: actualOutput,
        xpEarned: homework.xpReward
      });
    }

  } catch (error) {
    console.error("Eroare Backend:", error);
    res.status(500).json({ message: 'Eroare internă.', error: error.message });
  }
};
// 7. Rulare de test (Fără interogarea bazei de date și fără XP)
const testRunCode = async (req, res) => {
  try {
    const { sourceCode, customInput } = req.body;

    if (!sourceCode) {
      return res.status(400).json({ success: false, message: 'Codul sursă lipsește.' });
    }

    console.log("Rulare test personalizat. Cod primit:", sourceCode);
    console.log("Input personalizat:", customInput);

    // Aici poți integra un apel real către Piston API sau poți returna un output simulat detaliat
    // Exemplu de output detaliat care se va afișa în consolă:
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulare latență compilator

    const simulatedOutput = `--- REZULTAT TEST PERSONALIZAT ---\nInput folosit:\n${customInput || "(fără input)"}\n\nOutput generat de program:\n(Aici va apărea rezultatul rulării codului tău)`;

    return res.status(200).json({
      success: true,
      output: simulatedOutput
    });

  } catch (error) {
    console.error("Eroare la testul personalizat:", error);
    res.status(500).json({ success: false, message: 'Eroare internă de server.' });
  }
};
// Nu uita să adaugi submitCodeTask în module.exports la final!

module.exports = {
  createHomework,
  getAllHomeworks,
  getHomeworkById,
  updateHomework,
  deleteHomework,
  submitCodeTask,
  testRunCode
};