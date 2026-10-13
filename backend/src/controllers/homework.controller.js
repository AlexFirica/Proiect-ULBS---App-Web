// backend/controllers/homework.controller.js
const Homework = require('../models/homework.model');
const axios = require('axios');
const Submission = require('../models/submission.model');
const User = require('../models/user.model');

const {
  encryptAES,
  decryptAES,
  signDataECC,
  verifySignatureECC
} = require('../Utils/cryptoUtils');

// 1. Creează o temă nouă (Criptare AES + Semnare ECC + Asignare Classroom)
const createHomework = async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      subject,
      classroomId,
      isCodingTask,
      testInput,
      expectedOutput,
      xpReward
    } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ message: 'Titlul și data limită sunt obligatorii.' });
    }
    if (!classroomId) {
      return res.status(400).json({ message: 'ID-ul clasei (classroomId) este obligatoriu pentru a crea o temă.' });
    }

    const encryptedDescription = encryptAES(description);
    const payloadToSign = `${title}-${encryptedDescription}-${new Date(dueDate).toISOString()}`;
    const signature = signDataECC(payloadToSign);

    const newHomework = new Homework({
      title,
      description: encryptedDescription,
      dueDate,
      subject,
      classroomId,
      signature,
      isCodingTask: isCodingTask !== undefined ? isCodingTask : true,
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

    const processedHomeworks = homeworks.map(doc => {
      const homework = doc.toObject();
      const payloadToVerify = `${homework.title}-${homework.description}-${homework.dueDate.toISOString()}`;
      const isIntegrityOk = verifySignatureECC(payloadToVerify, homework.signature);
      homework.description = decryptAES(homework.description);
      homework.isSecureAndAuthentic = isIntegrityOk;
      return homework;
    });

    res.status(200).json(processedHomeworks);
  } catch (error) {
    res.status(500).json({ message: 'Eroare la obținerea listei.', error: error.message });
  }
};

// 3. Obține o singură temă după ID
const getHomeworkById = async (req, res) => {
  try {
    const doc = await Homework.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Tema nu a fost găsită.' });
    }

    const homework = doc.toObject();
    const payloadToVerify = `${homework.title}-${homework.description}-${homework.dueDate.toISOString()}`;
    const isIntegrityOk = verifySignatureECC(payloadToVerify, homework.signature);

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

// 4. Actualizează o temă
const updateHomework = async (req, res) => {
  try {
    const { title, description, dueDate, status, subject } = req.body;

    const currentHomework = await Homework.findById(req.params.id);
    if (!currentHomework) {
      return res.status(404).json({ message: 'Tema nu a fost găsită.' });
    }

    const finalTitle = title || currentHomework.title;
    const finalDueDate = dueDate ? new Date(dueDate) : currentHomework.dueDate;
    const finalSubject = subject || currentHomework.subject;
    const finalStatus = status || currentHomework.status;

    let finalEncryptedDescription = currentHomework.description;
    if (description !== undefined) {
      finalEncryptedDescription = encryptAES(description);
    }

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

// 5. Șterge o temă
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

// 6. Evaluarea codului trimis de elev (execuție reală prin Piston + XP condiționat)
const submitCodeTask = async (req, res) => {
  try {
    const { sourceCode } = req.body;
    const homework = await Homework.findById(req.params.id);

    if (!homework || !homework.isCodingTask) {
      return res.status(400).json({ message: 'Tema nu există sau nu este un exercițiu de programare.' });
    }

    const studentId = req.user.id || req.user.userId;

    const pistonRes = await axios.post(`${process.env.PISTON_API_URL}/execute`, {
      language: 'c++',
      version: '10.2.0',
      files: [{ content: sourceCode }],
      stdin: homework.testInput || ''
    });

    const { compile, run } = pistonRes.data;

    // Eroare de compilare — nu mai calculăm corectitudinea, doar raportăm eroarea
    if (compile && compile.code !== 0) {
      await Submission.findOneAndUpdate(
        { homeworkId: homework._id, studentId },
        { status: 'failed', output: '', sourceCode },
        { upsert: true }
      );
      return res.status(200).json({
        success: false,
        message: 'Codul nu compilează. Verifică erorile de mai jos.',
        compileError: compile.stderr || compile.output || 'Eroare de compilare necunoscută.'
      });
    }

    const actualOutput = (run.stdout || '').trim();
    const expectedOutput = (homework.expectedOutput || '').trim();
    const isCorrect = actualOutput === expectedOutput;

    const existing = await Submission.findOne({ homeworkId: homework._id, studentId });
    const alreadyPassed = existing?.status === 'passed';

    let xpEarned = 0;
    if (isCorrect && !alreadyPassed) {
      xpEarned = homework.xpReward || 10;
      await User.findByIdAndUpdate(studentId, { $inc: { xp: xpEarned } });
    }

    await Submission.findOneAndUpdate(
      { homeworkId: homework._id, studentId },
      { status: isCorrect ? 'passed' : 'failed', output: actualOutput, xpAwarded: xpEarned, sourceCode },
      { upsert: true }
    );

    return res.status(200).json({
      success: isCorrect,
      message: isCorrect
        ? (alreadyPassed ? 'Corect! (Deja notată anterior — fără XP suplimentar)' : 'Răspuns corect! Felicitări!')
        : 'Răspuns incorect. Verifică output-ul și încearcă din nou.',
      output: actualOutput,
      expectedOutput,
      xpEarned
    });
  } catch (error) {
    console.error("Eroare Piston (submit):", error.message);
    res.status(500).json({ message: 'Eroare internă.', error: error.message });
  }
};

// 7. Rulare de test (execuție reală, cu input personalizat)
const testRunCode = async (req, res) => {
  try {
    const { sourceCode, customInput } = req.body;

    if (!sourceCode) {
      return res.status(400).json({ success: false, message: 'Codul sursă lipsește.' });
    }

    const pistonRes = await axios.post(`${process.env.PISTON_API_URL}/execute`, {
      language: 'c++',
      version: '10.2.0',
      files: [{ content: sourceCode }],
      stdin: customInput || ''
    });

    const { compile, run } = pistonRes.data;

    // Eroare de compilare (sintaxă greșită) — separată de output-ul normal
    if (compile && compile.code !== 0) {
      return res.status(200).json({
        success: false,
        compileError: compile.stderr || compile.output || 'Eroare de compilare necunoscută.',
        output: null
      });
    }

    const output = run.stdout || run.stderr || '(fără output)';

    return res.status(200).json({
      success: true,
      output,
      exitCode: run.code
    });
  } catch (error) {
    console.error("Eroare Piston (test-run):", error.message);
    return res.status(500).json({ success: false, message: 'Eroare la compilare/execuție.' });
  }
};

module.exports = {
  createHomework,
  getAllHomeworks,
  getHomeworkById,
  updateHomework,
  deleteHomework,
  submitCodeTask,
  testRunCode
};