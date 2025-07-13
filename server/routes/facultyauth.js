const express = require('express');
const router = express.Router();
const Faculty = require('../models/faculty')

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const faculty = await Faculty.findOne({
        facultyid: new RegExp(`^${username}$`, 'i')  // case-insensitive match
    });
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    if (faculty.passwordfa !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    console.log(faculty);
    res.status(200).json({
      message: 'Login successful',
      faculty:{
        name: faculty.name,
        facultyid: faculty.facultyid,
        email: faculty.email,
        batches_assigned :faculty.batches_assigned,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Please try again after some time', error: err.message });
  }
});

module.exports = router;
