const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  homeworkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Homework', required: true },
  studentId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'passed', 'failed'], default: 'pending' },
  output: String,
  xpAwarded: { type: Number, default: 0 }
}, { timestamps: true });

submissionSchema.index({ homeworkId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);