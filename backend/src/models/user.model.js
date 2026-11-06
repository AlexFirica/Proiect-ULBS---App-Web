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

    // --- GAMIFICARE & AVATAR ---
    xp: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    coins: {
      type: Number,
      default: 500
    },
    ownedItems: {
      type: [String],
      default: []
    },
    streak: {
      type: Number,
      default: 0
    },
    lastDailyClaim: {
      type: String, // Format salvat: "YYYY-MM-DD"
      default: ''
    },
    avatar: {
      type: mongoose.Schema.Types.Mixed, // Stochează obiectul JSON: { equip: {...}, skin, hairColor, bg }
      default: null
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    // ---------------------------

    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    resetToken: String,
    resetTokenExpires: Date,
    refreshToken: String
  },
  { 
    timestamps: true,
    minimize: false // Garantează că obiectele goale din avatar nu sunt șterse la salvare
  }
);

// Hook pre-save async: hash-uiește parola doar dacă a fost modificată
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  try {
    this.password = await argon2.hash(this.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3
    });
  } catch (error) {
    throw new Error('Eroare la criptarea parolei: ' + error.message);
  }
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