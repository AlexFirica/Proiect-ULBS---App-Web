const { supabase } = require('../config/supabase');

const joinClassroom = async (req, res) => {
  const { invite_code } = req.body;
  const student_id = req.user.id; // Luat din middleware-ul de auth

  if (!invite_code) {
    return res.status(400).json({ message: 'Codul de invitație este obligatoriu.' });
  }

  try {
    const formattedCode = invite_code.trim().toUpperCase();

    // 1. Caută clasa activă după codul de invitație
    const { data: classroom, error: classError } = await supabase
      .from('classrooms')
      .select('id, name, is_archived, teacher_id')
      .eq('invite_code', formattedCode)
      .single();

    if (classError || !classroom) {
      return res.status(404).json({ message: 'Clasa nu a fost găsită.' });
    }

    if (classroom.is_archived) {
      return res.status(400).json({ message: 'Această clasă este arhivată.' });
    }

    // 2. Verifică dacă studentul este deja înscris
    const { data: existingMember } = await supabase
      .from('classroom_members')
      .select('id')
      .eq('classroom_id', classroom.id)
      .eq('student_id', student_id)
      .maybeSingle();

    if (existingMember) {
      return res.status(409).json({ message: 'Ești deja înscris în această clasă.' });
    }

    // 3. Înscrierea propriu-zisă
    const { error: joinError } = await supabase
      .from('classroom_members')
      .insert({ classroom_id: classroom.id, student_id });

    if (joinError) throw joinError;

    // 4. Crearea notificării pentru profesor (student_joined)
    await supabase.from('notifications').insert({
      user_id: classroom.teacher_id,
      type: 'student_joined',
      title: 'Elev nou în clasă',
      body: `Elevul ${req.user.full_name} s-a alăturat clasei: ${classroom.name}`,
      reference_id: classroom.id
    });

    return res.status(200).json({
      message: 'Te-ai înscris cu succes!',
      classroom: { id: classroom.id, name: classroom.name }
    });

  } catch (err) {
    return res.status(500).json({ message: 'Eroare la procesarea înscrierii.', error: err.message });
  }
};

module.exports = { joinClassroom };