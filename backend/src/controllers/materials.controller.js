const supabaseImport = require('../config/supabase');
const supabase = supabaseImport.supabase || supabaseImport;

const uploadMaterial = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { title } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: 'Niciun fișier trimis.' });
    if (!title) return res.status(400).json({ message: 'Titlul materialului este obligatoriu.' });

    const teacherId = req.user.supabaseId || req.user.id || req.user.userId;
    const fileName = `${classroomId}/${Date.now()}_${file.originalname}`;

    const { error: uploadError } = await supabase.storage
      .from('course-materials')
      .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (uploadError) {
      return res.status(500).json({ message: 'Eroare la încărcarea fișierului.', error: uploadError.message });
    }

    const { data: publicUrlData } = supabase.storage
      .from('course-materials')
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('course_materials')
      .insert([{
        classroom_id: classroomId,
        title,
        file_url: publicUrlData.publicUrl,
        file_name: file.originalname,
        uploaded_by: teacherId
      }])
      .select();

    if (error) return res.status(500).json({ message: 'Eroare la salvarea materialului.', error: error.message });

    return res.status(201).json({ message: 'Material încărcat cu succes!', material: data[0] });
  } catch (err) {
    return res.status(500).json({ message: 'Eroare server.', error: err.message });
  }
};

const getMaterials = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { data, error } = await supabase
      .from('course_materials')
      .select('*')
      .eq('classroom_id', classroomId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ message: 'Eroare la citirea materialelor.', error: error.message });
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Eroare server.', error: err.message });
  }
};

module.exports = { uploadMaterial, getMaterials };