// backend/src/controllers/classroom.controller.js
const supabase = require('../config/supabase');
const crypto = require('crypto');
const Homework = require('../models/homework.model'); // Importăm modelul tău de MongoDB pentru teme
const Submission = require('../models/submission.model');
// 1. CREARE CLASĂ (POST /api/classrooms) - Neschimbat
const createClassroom = async (req, res) => {
  try {
    const { title, name, type } = req.body;
    const classroomName = title || name;

    if (!classroomName) {
      return res.status(400).json({ message: 'Numele clasei este obligatoriu.' });
    }

    const teacherId = req.user.supabaseId || req.user.id || req.user.userId;
    if (!teacherId) {
      return res.status(400).json({ message: 'Lipsește ID-ul profesorului. Autentifică-te din nou.' });
    }

    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const { data, error } = await supabase
      .from('classrooms')
      .insert([
        {
          name: classroomName,
          teacher_id: teacherId,
          invite_code: inviteCode,
          type: type || 'liceu'   // valoare implicită validă din enum
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({ message: 'Eroare Supabase la inserare', error: error.message });
    }

    return res.status(201).json({ message: 'Clasă creată cu succes!', classroom: data[0] });

  } catch (err) {
    return res.status(500).json({ message: 'Eroare pe server.', error: err.message });
  }
};

// 2. OBȚINERE CLASE + TEMELE AFERENTE DIN MONGODB (GET /api/classrooms)
const getClassrooms = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Utilizator neautentificat în sesiune.' });
    }

    const userId = req.user.supabaseId || req.user.id || req.user.userId || req.user._id;
    const mongoUserId = req.user.id || req.user.userId;
    const isTeacherRole = req.user.role === 'teacher' || req.user.role === 'profesor';

    if (!userId) {
      return res.status(400).json({ message: 'Lipsește ID-ul utilizatorului din token.' });
    }

    let classrooms;

    if (isTeacherRole) {
      const { data, error } = await supabase.from('classrooms').select('*').eq('teacher_id', userId);
      if (error) {
        console.error('❌ Eroare Supabase la citire clase:', error);
        return res.status(500).json({ message: 'Eroare la citirea claselor.', error: error.message });
      }
      classrooms = data;
    } else {
      const { data, error } = await supabase
        .from('classroom_students')
        .select('classrooms(*)')
        .eq('student_id', userId);
      if (error) {
        console.error('❌ Eroare Supabase la citire clase (elev):', error);
        return res.status(500).json({ message: 'Eroare la citirea claselor.', error: error.message });
      }
      classrooms = (data || []).map(row => row.classrooms);
    }

    if (!classrooms || classrooms.length === 0) {
      return res.status(200).json([]);
    }

    const classroomsWithHomeworks = await Promise.all(
      classrooms.map(async (cls) => {
        const homeworks = await Homework.find({ classroomId: cls.id.toString() });
        let pendingCount = homeworks.length;
        let homeworksWithStatus = homeworks;

        if (!isTeacherRole) {
          const homeworkIds = homeworks.map(h => h._id);
          const passed = await Submission.find({
            homeworkId: { $in: homeworkIds },
            studentId: mongoUserId,
            status: 'passed'
          });
          const passedIds = new Set(passed.map(s => s.homeworkId.toString()));

          homeworksWithStatus = homeworks.map(h => ({
            ...h.toObject(),
            isCompleted: passedIds.has(h._id.toString())
          }));
          pendingCount = homeworksWithStatus.filter(h => !h.isCompleted).length;
        }

        return { ...cls, homeworks: homeworksWithStatus, pendingCount };
      })
    );

    return res.status(200).json(classroomsWithHomeworks);
  } catch (err) {
    console.error('❌ Excepție server la citire clase + teme:', err);
    return res.status(500).json({ message: 'Eroare server.', error: err.message });
  }
};
// 3. ÎNSCRIERE ÎN CLASĂ (POST /api/classrooms/join)
const joinClassroom = async (req, res) => {
  try {
    const { invite_code } = req.body;
    if (!invite_code) return res.status(400).json({ message: 'Codul de invitație este obligatoriu.' });

    const studentId = req.user.supabaseId || req.user.id || req.user.userId;

    const { data: classroom, error: classError } = await supabase
      .from('classrooms')
      .select('*')
      .eq('invite_code', invite_code.trim().toUpperCase())
      .single();

    if (classError || !classroom) {
      return res.status(404).json({ message: 'Clasa nu a fost găsită sau codul este invalid.' });
    }

    const { error: enrollError } = await supabase
      .from('classroom_students')
      .upsert([{ classroom_id: classroom.id, student_id: studentId }], { onConflict: 'classroom_id,student_id' });

    if (enrollError) {
      return res.status(500).json({ message: 'Eroare la înscriere.', error: enrollError.message });
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