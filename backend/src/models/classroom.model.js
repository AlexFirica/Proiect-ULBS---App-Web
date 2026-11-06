// backend/src/models/classroom.models.js
const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Profesorul care a creat-o
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Elevii înscriși
  homeworks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Homework' }] // Teme atașate clasei
}, { timestamps: true });

module.exports = mongoose.model('Classroom', classroomSchema);