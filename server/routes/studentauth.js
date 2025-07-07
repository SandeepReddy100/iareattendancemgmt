const express = require('express');
const router = express.Router();
const Student = require('../models/student');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const rollno = username;
    console.log('Looking for rollno:', rollno);

    const student = await Student.findOne({
      rollno: new RegExp(`^${rollno}$`, 'i')  // case-insensitive match
    });

    console.log('Student found:', student);

    if (!student) {
      return res.status(401).json({ message: 'Invalid rollno or password' });
    }

    if (student.password !== password) {
      return res.status(401).json({ message: 'Invalid rollno or password' });
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
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Please try again after some time' });
  }
});

module.exports = router;
