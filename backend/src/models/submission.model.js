// backend/src/models/submission.model.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    homeworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Homework',
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: [
        'pending',
        'passed',
        'failed',
        'ACCEPTED',
        'WRONG_ANSWER',
        'COMPILATION_ERROR',
        'TIME_LIMIT_EXCEEDED',
        'RUNTIME_ERROR'
      ],
      default: 'pending'
    },
    sourceCode: {
      type: String,
      default: ''
    },
    output: {
      type: String,
      default: ''
    },
    details: {
      type: String,
      default: ''
    },
    passedTests: {
      type: Number,
      default: 0
    },
    totalTests: {
      type: Number,
      default: 0
    },
    grade: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    xpAwarded: {
      type: Number,
      default: 0
    },
    coinsAwarded: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Asigură o singură trimitere salvată per elev și temă (actualizabilă prin findOneAndUpdate/upsert)
submissionSchema.index({ homeworkId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);