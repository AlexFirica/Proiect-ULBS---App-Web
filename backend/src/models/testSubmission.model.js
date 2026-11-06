const mongoose = require('mongoose');

const TestSubmissionSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grade: { type: Number, required: true },
  passedTests: { type: Number, required: true },
  totalTests: { type: Number, required: true },
  xpEarned: { type: Number, default: 0 },
  details: [{ test: Number, status: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TestSubmission', TestSubmissionSchema);