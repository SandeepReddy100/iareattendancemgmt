const express = require('express');
const router = express.Router();
const Faculty = require('../models/faculty');

// GET /api/faculty/:email - Get faculty by email


router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Looking for faculty with email:', email);

    const faculty = await Faculty.findOne(
      { email },
      'name facultyid email'
    );

    if (!faculty) {
      console.log('Faculty not found');
      return res.status(404).json({ message: 'Faculty not found' });
    }

    console.log('Faculty found:', faculty);
    res.json(faculty);
  } catch (err) {
    console.error('Error fetching faculty:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
