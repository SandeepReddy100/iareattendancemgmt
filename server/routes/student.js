const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const getAttendanceModel = require('../utils/getAttendanceModel')
const Announcement = require("../models/Announcement");

// GET /api/student/:rollno - Get student by rollno
router.get('/:rollno', async (req, res) => {
  try {
    const { rollno } = req.params;
    console.log('Looking for rollno:', rollno);

    const student = await Student.findOne(
      { rollno },
      'name rollno email branch batch qrData qrLink'
    );

    if (!student) {
      console.log('Student not found');
      return res.status(404).json({ message: 'Student not found' });
    }

    console.log('Student found:', student);
    res.json(student);
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/student/update-password
router.post('/update-password', async (req, res) => {
  const { rollno, currentPassword, newPassword } = req.body;
  console.log({rollno, currentPassword, newPassword});
  try {
    const student = await Student.findOne({ rollno });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Directly compare plain text passwords
    if (student.password !== currentPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Directly assign new plain text password
    student.password = newPassword;
    await student.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// GET /api/announcements/:batch
router.get("/announcements/:batch", async (req, res) => {
  try {
    const studentBatch = req.params.batch;

    if (!studentBatch) {
      return res.status(400).json({ message: "Batch parameter is required." });
    }

    const announcements = await Announcement.find(
      { batches: studentBatch },
      "title subtitle content" // Only these fields
    )
      .sort({ createdAt: -1 }) // Latest first
      .limit(3); // Top 3 only

    res.status(200).json({ announcements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
