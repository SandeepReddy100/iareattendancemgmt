const express = require('express');
const router = express.Router();
const Student = require('../models/student');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const student = await Student.findOne({ email });

    if (!student) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Plain-text password check
    if (student.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      student: {
        name: student.name,
        rollno: student.rollno,
        email: student.email,
        branch: student.branch,
        batch: student.batch,
        qrData: student.qrData,
        qrLink: student.qrLink
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
