// models/homework.models.js
const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Titlul temei este obligatoriu.'],
      trim: true
    },
    description: {
      type: String, // Stochează string-ul criptat cu AES (iv:tag:ciphertext)
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
    },
    isCodingTask: {
      type: Boolean,
      default: false
    },
    testInput: {
      type: String,
      default: ''
    },
    expectedOutput: {
      type: String,
      default: ''
    },
    xpReward: {
      type: Number,
      default: 10
    },
    // Corectat la String pentru compatibilitate cu UUID-urile din Supabase
    classroomId: {
      type: String,
      required: [true, 'ID-ul clasei este obligatoriu.']
    }
  },
  {
    timestamps: true
  }
);

const Homework = mongoose.model('Homework', homeworkSchema);
module.exports = Homework;