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
// POST: Update Faculty Password
router.post('/update-password', async (req, res) => {
  const { facultyEmail, currentPassword, newPassword } = req.body;

  if (!facultyEmail || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'facultyEmail, currentPassword, and newPassword are required' });
  }

  try {
    const faculty = await Faculty.findOne({ email: facultyEmail });

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    if (faculty.passwordfa !== currentPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    faculty.passwordfa = newPassword;
    await faculty.save();

    res.json({ message: 'Faculty password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
