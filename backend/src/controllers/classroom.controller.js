const supabase = require('../config/supabase');
const crypto = require('crypto');

// 1. CREARE CLASĂ (POST /api/classrooms)
const createClassroom = async (req, res) => {
  try {
    console.log('📌 Date primite la creare clasă:', req.body);
    console.log('📌 Utilizator din Token:', req.user);

    const { title, name, description } = req.body;
    const classroomName = title || name;

    if (!classroomName) {
      return res.status(400).json({ message: 'Numele clasei este obligatoriu.' });
    }

    // Luăm UUID-ul de Supabase sau ID-ul din token
    const teacherId = req.user.supabaseId || req.user.id || req.user.userId;

    if (!teacherId) {
      return res.status(400).json({ message: 'Lipsește ID-ul profesorului. Autentifică-te din nou.' });
    }

    // Generăm un cod unic de invitație (ex: A7B9K2)
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Inserăm în Supabase
    const { data, error } = await supabase
      .from('classrooms')
      .insert([
        {
          name: classroomName,
          description: description || '',
          teacher_id: teacherId,
          invite_code: inviteCode
        }
      ])
      .select();

    if (error) {
      console.error('❌ EROARE CRITICĂ SUPABASE:', error);
      return res.status(500).json({ message: 'Eroare Supabase la inserare', error: error.message });
    }

    console.log('✅ Clasă salvată cu succes în Supabase:', data);
    return res.status(201).json({ message: 'Clasă creată cu succes!', classroom: data[0] });

  } catch (err) {
    console.error('❌ Excepție server la creare clasă:', err);
    return res.status(500).json({ message: 'Eroare pe server.', error: err.message });
  }
};

// 2. OBTINERE CLASE (GET /api/classrooms)
const getClassrooms = async (req, res) => {
  try {
    const teacherId = req.user.supabaseId || req.user.id || req.user.userId;

    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('teacher_id', teacherId);

    if (error) {
      console.error('❌ Eroare Supabase la citire clase:', error);
      return res.status(500).json({ message: 'Eroare la citirea claselor.', error: error.message });
    }

    return res.status(200).json(data || []);
  } catch (err) {
    console.error('❌ Excepție server la citire clase:', err);
    return res.status(500).json({ message: 'Eroare server.', error: err.message });
  }
};

// 3. ÎNSCRIERE ÎN CLASĂ (POST /api/classrooms/join)
const joinClassroom = async (req, res) => {
  try {
    const { invite_code } = req.body;
    const studentId = req.user.supabaseId || req.user.id || req.user.userId;

    if (!invite_code) {
      return res.status(400).json({ message: 'Codul de invitație este obligatoriu.' });
    }

    const { data: classroom, error: classError } = await supabase
      .from('classrooms')
      .select('*')
      .eq('invite_code', invite_code.trim().toUpperCase())
      .single();

    if (classError || !classroom) {
      return res.status(404).json({ message: 'Clasa nu a fost găsită sau codul este invalid.' });
    }

    return res.status(200).json({ message: 'Te-ai înscris cu succes!', classroom });
  } catch (err) {
    return res.status(500).json({ message: 'Eroare la înscriere.', error: err.message });
  }
};

module.exports = {
  createClassroom,
  getClassrooms,
  joinClassroom
};