// backend/src/models/user.model.js
const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema(
  {
    supabaseId: {
      type: String,
      unique: true,
      sparse: true // Permite ca userii creați direct în aplicație (fără Supabase) să nu dea eroare de unicitate dacă e gol
    },
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Adresa de email este obligatorie.'],
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, 'Parola este obligatorie.'],
      minlength: [6, 'Parola trebuie să aibă cel puțin 6 caractere.']
    },
    role: {
      type: String,
      default: 'cursant'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    resetToken: String,
    resetTokenExpires: Date,
    refreshToken: String
  },
  { timestamps: true }
);

// Hook pre-save async: FĂRĂ parametrul `next()`
userSchema.pre('save', async function () {
  // Dacă parola nu a fost modificată, ieșim direct
  if (!this.isModified('password')) return;

  // Generăm hash-ul Argon2id
  this.password = await argon2.hash(this.password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3
  });
});

// Verificare parolă la login
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    if (!this.password || !candidatePassword) return false;
    return await argon2.verify(this.password, candidatePassword);
  } catch (error) {
    console.error('Eroare verificare Argon2:', error.message);
    return false;
  }
};

const User = mongoose.model('User', userSchema);
module.exports = User;