const mongoose = require('mongoose');
const argon2 = require('argon2'); // Înlocuit bcrypt cu argon2

const userSchema = new mongoose.Schema(
  {
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
    }
  },
  { timestamps: true }
);

// Hook pre-save: Rulează automat înainte de .save()
userSchema.pre('save', async function (next) {
  // 1. Verificăm dacă parola a fost modificată (sau e nouă).
  if (!this.isModified('password')) return next();

  try {
    // 2 & 3. Înlocuim parola simplă cu hash-ul securizat generat de Argon2id.
    // Argon2 gestionează intern generarea automată a salt-ului unic (nu mai avem nevoie de genSalt).
    this.password = await argon2.hash(this.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB RAM (aceeași configurare ca în controller)
      timeCost: 3          // 3 iterații
    });
    next();
  } catch (error) {
    next(error);
  }
});

// Metodă helper: ne ajută la logare să comparăm parola introdusă cu cea din baza de date
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    // argon2.verify compară textul simplu cu hash-ul stocat și returnează automat true sau false
    return await argon2.verify(this.password, candidatePassword);
  } catch (error) {
    return false;
  }
};

const User = mongoose.model('User', userSchema);
module.exports = User;