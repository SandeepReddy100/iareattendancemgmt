const express = require('express');
const router = express.Router();
const Student = require('../models/student');


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

module.exports = router;
