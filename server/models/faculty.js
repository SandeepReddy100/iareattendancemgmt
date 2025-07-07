const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  facultyid: {
    type: String,
    required: true,
    unique: true,
  },
  passwordfa: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
}, { timestamps: true });

module.exports = mongoose.model('Faculty', facultySchema, "faculty");

