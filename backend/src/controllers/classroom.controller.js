// backend/src/controllers/classroom.controller.js
const supabase = require('../config/supabase');
const crypto = require('crypto');
const Homework = require('../models/homework.model'); // Importăm modelul tău de MongoDB pentru teme

// 1. CREARE CLASĂ (POST /api/classrooms) - Neschimbat
const createClassroom = async (req, res) => {
  try {
    const { title, name, description } = req.body;
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
          description: description || '',
          teacher_id: teacherId,
          invite_code: inviteCode
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
    // Verificăm dacă req.user există. Dacă nu, returnăm o eroare clară sau un array gol
    if (!req.user) {
      return res.status(401).json({ message: 'Utilizator neautentificat în sesiune.' });
    }

    // Preluăm ID-ul în siguranță, acoperind toate variantele posibile din token
    const teacherId = req.user.supabaseId || req.user.id || req.user.userId || req.user._id;

    if (!teacherId) {
      return res.status(400).json({ message: 'Lipsește ID-ul utilizatorului din token.' });
    }

    // 1. Luăm clasele din Supabase filtrate după profesor
    const { data: classrooms, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('teacher_id', teacherId);

    if (error) {
      console.error('❌ Eroare Supabase la citire clase:', error);
      return res.status(500).json({ message: 'Eroare la citirea claselor.', error: error.message });
    }

    if (!classrooms || classrooms.length === 0) {
      return res.status(200).json([]);
    }

    // 2. Pentru fiecare clasă din Supabase, căutăm în MongoDB temele aferente
    const classroomsWithHomeworks = await Promise.all(
      classrooms.map(async (cls) => {
        const homeworks = await Homework.find({ classroomId: cls.id.toString() });
        return {
          ...cls,
          homeworks: homeworks
        };
      })
    );

    return res.status(200).json(classroomsWithHomeworks);
  } catch (err) {
    console.error('❌ Excepție server la citire clase + teme:', err);
    return res.status(500).json({ message: 'Eroare server.', error: err.message });
  }
};

// 3. ÎNSCRIERE ÎN CLASĂ (POST /api/classrooms/join) - Neschimbat
const joinClassroom = async (req, res) => {
  try {
    const { invite_code } = req.body;

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