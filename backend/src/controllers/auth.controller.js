const supabase = require('../config/supabase');
const argon2 = require('argon2'); // Înlocuit bcrypt cu argon2
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');

// 1. ÎNREGISTRARE (Signup)
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Acest email este deja înregistrat.' });
    }

    const newUser = new User({ email, password });
    await newUser.save();

    res.status(201).json({ message: 'Utilizator înregistrat cu succes!' });
  } catch (error) {
    res.status(500).json({ message: 'Eroare la înregistrare.', error: error.message });
  }
};

// 2. LOGARE (Login)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email sau parolă incorectă.' });
    }

    // Metoda comparePassword din user.model.js folosește acum argon2 intern
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email sau parolă incorectă.' });
    }

    res.status(200).json({ 
      message: 'Logare reușită!',
      user: { id: user._id, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Eroare la logare.', error: error.message });
  }
};

// 3. Verificare email / Activare cont
const verify = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: 'Tokenul lipsește.' });

  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('verification_token', token)
      .eq('is_verified', false)
      .single();

    if (!user) return res.status(400).json({ message: 'Token invalid sau deja verificat.' });
    if (new Date(user.verification_token_expires_at) < new Date()) {
      return res.status(400).json({ message: 'Linkul a expirat.' });
    }

    await supabase
      .from('users')
      .update({ is_verified: true, verification_token: null, verification_token_expires_at: null })
      .eq('id', user.id);

    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?verified=true`);
  } catch (error) {
    return res.status(500).json({ message: 'Eroare la verificare.' });
  }
};

// 4. Refresh Token (Rotație automată)
const refresh = async (req, res) => {
  const oldToken = req.cookies.refreshToken;
  if (!oldToken) return res.status(401).json({ message: 'Sesiune lipsă.' });

  try {
    const { data: tokenData } = await supabase.from('refresh_tokens').select('*, users(*)').eq('token', oldToken).eq('is_revoked', false).single();
    if (!tokenData || new Date(tokenData.expires_at) < new Date()) {
      return res.status(401).json({ message: 'Sesiune expirată.' });
    }

    const user = tokenData.users;
    await supabase.from('refresh_tokens').update({ is_revoked: true }).eq('id', tokenData.id);

    const newRefreshToken = crypto.randomUUID();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('refresh_tokens').insert([{ id: crypto.randomUUID(), user_id: user.id, token: newRefreshToken, is_revoked: false, expires_at }]);

    const access_token = jwt.sign({ user_id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.status(200).json({ access_token });
  } catch (error) {
    return res.status(500).json({ message: 'Eroare la reîmprospătarea sesiunii.' });
  }
};

// 5. Logout
const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await supabase.from('refresh_tokens').update({ is_revoked: true }).eq('token', refreshToken);
  }
  res.clearCookie('refreshToken');
  return res.status(200).json({ message: 'Deconectat cu succes.' });
};

// 6. Retrimitere email verificare
const resendVerification = async (req, res) => {
  const { email } = req.body;
  try {
    const { data: user } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).eq('is_verified', false).single();
    if (user) {
      const token = crypto.randomUUID();
      await supabase.from('users').update({ verification_token: token, verification_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }).eq('id', user.id);
      console.log(`[Resend] Token nou: ${token}`);
    }
  } catch (e) {}
  return res.status(200).json({ message: 'Email retrimis dacă adresa există în sistem.' });
};

// 7. Am uitat parola
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const { data: user } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).single();
    if (user) {
      const reset_token = crypto.randomUUID();
      await supabase.from('users').update({ reset_token, reset_token_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() }).eq('id', user.id);
      console.log(`[Reset] Link generat: /auth/reset-password?token=${reset_token}`);
    }
  } catch (e) {}
  return res.status(200).json({ message: 'Dacă emailul există, vei primi instrucțiuni.' });
};

// 8. Resetare parolă finală
const resetPassword = async (req, res) => {
  const { token, new_password, confirm_password } = req.body;
  if (new_password !== confirm_password) return res.status(400).json({ message: 'Parolele nu coincid.' });

  try {
    const { data: user } = await supabase.from('users').select('*').eq('reset_token', token).single();
    if (!user || new Date(user.reset_token_expires_at) < new Date()) {
      return res.status(400).json({ message: 'Token invalid sau expirat.' });
    }

    // AICI S-A MODIFICAT: Generarea hash-ului folosind Argon2id cu configurări sigure
    const password_hash = await argon2.hash(new_password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB RAM
      timeCost: 3          // 3 iterații
    });

    await supabase.from('users').update({ password_hash, reset_token: null, reset_token_expires_at: null }).eq('id', user.id);
    await supabase.from('refresh_tokens').update({ is_revoked: true }).eq('user_id', user.id);

    return res.status(200).json({ message: 'Parola a fost resetată. Te poți loga acum.' });
  } catch (error) {
    return res.status(500).json({ message: 'Eroare la resetarea parolei.' });
  }
};

// 9. Profil
const getProfile = async (req, res) => {
  try {
    res.status(200).json({ message: "Profilul utilizatorului a fost accesat cu succes!" });
  } catch (error) {
    res.status(500).json({ message: "Eroare la obținerea profilului.", error: error.message });
  }
};

// EXPORTUL UNIFICAT
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