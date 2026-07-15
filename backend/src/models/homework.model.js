const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Titlul temei este obligatoriu.'],
      trim: true
    },
    description: {
      type: String, // Va stoca string-ul criptat cu AES (iv:tag:ciphertext)
      default: ''
    },
    dueDate: {
      type: Date,
      required: [true, 'Data limită este obligatorie.']
    },
    subject: {
      type: String,
      trim: true,
      default: 'General'
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    signature: {
      type: String, // Stochează semnătura digitală ECC
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const Homework = mongoose.model('Homework', homeworkSchema);
module.exports = Homework;