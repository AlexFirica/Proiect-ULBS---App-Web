// sync-users.js
const mongoose = require('mongoose');
const supabase = require('./config/supabase'); 
const User = require('./models/user.model');   

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codero')
  .then(() => console.log('✅ Conectat la MongoDB pentru migrare'))
  .catch(err => console.error('❌ Eroare MongoDB:', err));

async function sincronizeazaUseri() {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Eroare la citirea din Supabase:', error.message);
      process.exit(1);
    }

    console.log(`Găsiți ${profiles.length} utilizatori în Supabase.`);

    for (const profile of profiles) {
      const supabaseId = profile.id || profile.supabase_id;
      const email = profile.email;
      const role = profile.role || 'cursant';
      const name = profile.full_name || profile.name || '';

      let user = await User.findOne({ email: email });

      if (user) {
        user.supabaseId = supabaseId;
        user.role = role;
        if (name) user.name = name;
        await user.save();
        console.log(`🔄 Actualizat user existent: ${email}`);
      } else {
        // Folosind constructorul, se activează automat hook-ul pre('save') pentru Argon2
        user = new User({
          supabaseId: supabaseId,
          email: email,
          name: name,
          role: role,
          password: 'SupabaseAuthUser_Placeholder_123!',
          isVerified: true
        });
        await user.save();
        console.log(`✔️ Sincronizat user nou: ${email}`);
      }
    }

    console.log('🎉 Toți userii au fost migrați cu succes în MongoDB!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Eroare la sincronizare:', err);
    process.exit(1);
  }
}

sincronizeazaUseri();