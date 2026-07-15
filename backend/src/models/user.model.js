const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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
  // Dacă utilizatorul își schimbă doar email-ul, nu vrem să facem hash din nou la parola deja criptată!
  if (!this.isModified('password')) return next();

  try {
    // 2. Generăm salt-ul (recomandat un cost de 10-12 runde)
    const salt = await bcrypt.genSalt(10);

    // 3. Înlocuim parola simplă cu hash-ul securizat
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Metodă helper: ne va ajuta la logare să comparăm parola introdusă cu cea din baza de date
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;