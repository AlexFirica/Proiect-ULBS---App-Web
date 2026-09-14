const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');

// Import flexibil (suportă atât export direct, cât și export de tip obiect { supabase })
const supabaseImport = require('../config/supabase');
const supabase = supabaseImport.supabase || supabaseImport;

const JWT_SECRET = process.env.JWT_SECRET || 'secret_temporar_dev_codeedu';

// Normalizare roluri (română -> engleză)
const normalizeRole = (inputRole) => {
  if (!inputRole) return 'student';
  const r = inputRole.toLowerCase();
  if (r === 'cursant' || r === 'student') return 'student';
  if (r === 'profesor' || r === 'teacher') return 'teacher';
  return r;
};

// 1. ÎNREGISTRARE (Signup)
const register = async (req, res) => {
  try {
    const name = req.body.name || req.body.Name || '';
    const email = req.body.email || req.body.Email;
    const password = req.body.password || req.body.parola;
    const rawRole = req.body.role || req.body.rol || 'student';

    if (!email || !password) {
      return res.status(400).json({ message: 'Emailul și parola sunt obligatorii.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const role = normalizeRole(rawRole);

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Acest email este deja înregistrat.' });
    }

    // A. Înregistrare în Supabase Auth (Creează o intrare validă în auth.users)
    let supabaseUserId = null;

    try {
      if (supabase && typeof supabase.auth?.signUp === 'function') {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: password,
          options: {
            data: { full_name: name, role: role }
          }
        });

        if (authError) {
          console.error('⚠️ Eroare Supabase Auth signUp:', authError.message);
        } else if (authData?.user) {
          supabaseUserId = authData.user.id;
        }
      }
    } catch (spAuthErr) {
      console.error('⚠️ Excepție la conectarea cu Supabase Auth:', spAuthErr.message);
    }

    // B. Salvare în MongoDB
    const newUser = new User({
      name,
      email: normalizedEmail,
      password,
      role,
      supabaseId: supabaseUserId
    });

    await newUser.save();
    console.log('✅ Utilizator salvat în MongoDB cu ID-ul:', newUser._id);

    // C. Salvare în tabela profiles din Supabase (Dacă avem ID valid din auth.users)
    // C. Salvare cu UPSERT în Supabase Profiles
if (supabaseUserId && typeof supabase.from === 'function') {
  try {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert([
        { 
          id: supabaseUserId,
          full_name: name,
          email: normalizedEmail,
          role: role
        }
      ], { onConflict: 'id' });

    if (profileError) {
      console.error('⚠️ Eroare salvare tabela profiles:', profileError.message);
    } else {
      if (role === 'teacher') {
        await supabase.from('teacher_profiles').upsert([{ id: supabaseUserId }], { onConflict: 'id' });
      } else {
        await supabase.from('student_profiles').upsert([{ id: supabaseUserId }], { onConflict: 'id' });
      }
      console.log('✅ Profil sincronizat cu succes în Supabase!');
    }
  } catch (profileErr) {
    console.error('⚠️ Excepție la inserarea în profiles:', profileErr.message);
  }
}

    return res.status(201).json({ message: 'Utilizator înregistrat cu succes!' });
  } catch (error) {
    console.error('❌ Eroare la register:', error);
    return res.status(500).json({ message: 'Eroare la înregistrare.', error: error.message });
  }
};

// 2. LOGARE (Login)
const login = async (req, res) => {
  try {
    const email = req.body.email || req.body.Email;
    const password = req.body.password || req.body.parola;

    if (!email || !password) {
      return res.status(400).json({ message: 'Emailul și parola sunt obligatorii.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Email sau parolă incorectă.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email sau parolă incorectă.' });
    }

    const userRole = normalizeRole(user.role);

    // Access Token (JWT)
    const accessToken = jwt.sign(
      { 
        id: user._id, 
        userId: user._id, 
        supabaseId: user.supabaseId,
        email: user.email, 
        role: userRole 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = crypto.randomUUID();
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      message: 'Logare reușită!',
      token: accessToken,
      user: { 
        id: user._id, 
        supabaseId: user.supabaseId,
        email: user.email, 
        role: userRole, 
        name: user.name || '' 
      }
    });
  } catch (error) {
    console.error('❌ Eroare la login:', error);
    return res.status(500).json({ message: 'Eroare la logare.', error: error.message });
  }
};

// 3. Verificare email
const verify = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: 'Tokenul lipsește.' });

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Token invalid sau deja verificat.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?verified=true`);
  } catch (error) {
    return res.status(500).json({ message: 'Eroare la verificare.', error: error.message });
  }
};

// 4. Refresh Token
const refresh = async (req, res) => {
  const oldToken = req.cookies.refreshToken;
  if (!oldToken) return res.status(401).json({ message: 'Sesiune lipsă.' });

  try {
    const user = await User.findOne({ refreshToken: oldToken });

    if (!user) {
      return res.status(401).json({ message: 'Sesiune invalidă sau expirată.' });
    }

    const newRefreshToken = crypto.randomUUID();
    user.refreshToken = newRefreshToken;
    await user.save();

    const userRole = normalizeRole(user.role);

    const access_token = jwt.sign(
      { 
        id: user._id, 
        userId: user._id, 
        supabaseId: user.supabaseId,
        role: userRole, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({ access_token });
  } catch (error) {
    return res.status(500).json({ message: 'Eroare la reîmprospătarea sesiunii.', error: error.message });
  }
};

// 5. Logout
const logout = async (req, res) => {
  try {
    const oldToken = req.cookies.refreshToken;
    if (oldToken) {
      await User.findOneAndUpdate({ refreshToken: oldToken }, { $unset: { refreshToken: 1 } });
    }
  } catch (e) {
    console.error('Eroare curățare token la logout:', e);
  }
  res.clearCookie('refreshToken');
  return res.status(200).json({ message: 'Deconectat cu succes.' });
};

// 6. Retrimitere email verificare
const resendVerification = async (req, res) => {
  const email = req.body.email || req.body.Email;
  if (!email) return res.status(400).json({ message: 'Emailul este obligatoriu.' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && !user.isVerified) {
      const token = crypto.randomUUID();
      user.verificationToken = token;
      await user.save();
      console.log(`[Resend] Token nou generat pentru ${email}: ${token}`);
    }
  } catch (e) {
    console.error('Eroare resendVerification:', e);
  }
  return res.status(200).json({ message: 'Dacă adresa există, un email de verificare a fost trimis.' });
};

// 7. Am uitat parola
const forgotPassword = async (req, res) => {
  const email = req.body.email || req.body.Email;
  if (!email) return res.status(400).json({ message: 'Emailul este obligatoriu.' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const reset_token = crypto.randomUUID();
      user.resetToken = reset_token;
      user.resetTokenExpires = Date.now() + 3600000;
      await user.save();
      console.log(`[Reset] Link generat pentru ${email}: /auth/reset-password?token=${reset_token}`);
    }
  } catch (e) {
    console.error('Eroare forgotPassword:', e);
  }
  return res.status(200).json({ message: 'Dacă emailul există, vei primi instrucțiuni de resetare.' });
};

// 8. Resetare parolă finală
const resetPassword = async (req, res) => {
  const { token, new_password, confirm_password } = req.body;

  if (!new_password || new_password !== confirm_password) {
    return res.status(400).json({ message: 'Parolele nu coincid sau sunt goale.' });
  }

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token invalid sau expirat.' });
    }

    user.password = new_password;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    user.refreshToken = undefined;
    await user.save();

    return res.status(200).json({ message: 'Parola a fost resetată cu succes. Te poți loga.' });
  } catch (error) {
    return res.status(500).json({ message: 'Eroare la resetarea parolei.', error: error.message });
  }
};

// 9. Profil
const getProfile = async (req, res) => {
  try {
    res.status(200).json({ message: 'Profilul utilizatorului a fost accesat cu succes!', user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Eroare la obținerea profilului.', error: error.message });
  }
};

module.exports = {
  register,
  login,
  verify,
  refresh,
  logout,
  resendVerification,
  forgotPassword,
  resetPassword,
  getProfile
};