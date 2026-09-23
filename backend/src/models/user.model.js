// backend/src/models/user.model.js
const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema(
  {
    supabaseId: {
      type: String,
      unique: true,
      sparse: true
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
    xp: {
      type: Number,
      default: 0
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

// Hook pre-save async: hash-uiește parola doar dacă a fost modificată
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

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