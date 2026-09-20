// backend/src/controllers/auth.controller.js
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

    // A. Înregistrare în Supabase Auth
    let supabaseUserId = null;
    try {
      if (supabase && typeof supabase.auth?.signUp === 'function') {
       const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: normalizedEmail,
          password: password,
          email_confirm: true,
          user_metadata: { full_name: name, role: role }
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
    const userData = {
    name,
    email: normalizedEmail,
    password,
    role
  };

  if (supabaseUserId) {
    userData.supabaseId = supabaseUserId;
  }

  const newUser = new User(userData);

    await newUser.save();
    console.log('✅ Utilizator salvat în MongoDB cu ID-ul:', newUser._id);

    // C. Salvare în tabela profiles din Supabase
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

// 2. LOGARE (Login) - FĂRĂ COOKIES, DOAR JSON RESPONSE
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

    if (!user.password) {
      return res.status(401).json({ message: 'Contul nu are o parolă locală setată.' });
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

    // ❌ Fără res.cookie. Trimitem totul direct în JSON pentru localStorage
    return res.status(200).json({
      message: 'Logare reușită!',
      token: accessToken,
      refreshToken: refreshToken,
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

    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login.html?verified=true`);
  } catch (error) {
    return res.status(500).json({ message: 'Eroare la verificare.', error: error.message });
  }
};

// 4. Refresh Token (Adaptat pentru Bearer / JSON, fără cookies)
const refresh = async (req, res) => {
  const oldRefreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
  if (!oldRefreshToken) return res.status(401).json({ message: 'Sesiune lipsă.' });

  try {
    const user = await User.findOne({ refreshToken: oldRefreshToken });

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

    return res.status(200).json({ access_token, refreshToken: newRefreshToken });
  } catch (error) {
    return res.status(500).json({ message: 'Eroare la reîmprospătarea sesiunii.', error: error.message });
  }
};

// 5. Logout
const logout = async (req, res) => {
  try {
    // Dacă utilizatorul trimite tokenul în header, îl putem decoda sau extrage userul
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
      if (decoded && decoded.id) {
        await User.findByIdAndUpdate(decoded.id, { $unset: { refreshToken: 1 } });
      }
    }
  } catch (e) {
    console.error('Eroare curățare token la logout:', e);
  }
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

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user.userId).select('name email role xp');
    if (!user) return res.status(404).json({ message: 'Utilizator negăsit.' });
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Eroare server.', error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Toate câmpurile sunt obligatorii.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Parola nouă trebuie să aibă cel puțin 6 caractere.' });
    }

    const user = await User.findById(req.user.id || req.user.userId);
    if (!user) return res.status(404).json({ message: 'Utilizator negăsit.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Parola actuală este incorectă.' });

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: 'Parola a fost schimbată cu succes.' });
  } catch (error) {
    return res.status(500).json({ message: 'Eroare server.', error: error.message });
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
  getProfile,
  getMe,
  changePassword
};