const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['usor', 'mediu', 'avansat'], default: 'usor' },
  xp: { type: Number, default: 15 },
  testCases: [{
    input: { type: String, default: '' },
    expectedOutput: { type: String, required: true }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Test', TestSchema);