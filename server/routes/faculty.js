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

// Create a new faculty
router.post("/addnewfaculty", async (req, res) => {
  const { name, facultyid, passwordfa, email } = req.body;

  if (!name || !facultyid || !passwordfa || !email) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existing = await Faculty.findOne({ facultyid });
    if (existing) return res.status(409).json({ message: "Faculty already exists" });

    const newFaculty = new Faculty({ name, facultyid, passwordfa, email });
    const savedFaculty = await newFaculty.save();

    res.status(201).json({ message: "Faculty added successfully", faculty: savedFaculty });
  } catch (err) {
    console.error("Add Faculty Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update faculty (partial update)
router.patch("/:facultyid", async (req, res) => {
  const { facultyid } = req.params;
  const updates = req.body; // Can include name, passwordfa, email

  try {
    const updatedFaculty = await Faculty.findOneAndUpdate(
      { facultyid },
      { $set: updates },
      { new: true }
    );

    if (!updatedFaculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.json({ message: "Faculty updated successfully", faculty: updatedFaculty });
  } catch (err) {
    console.error("Update Faculty Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete faculty
router.delete("/:facultyid", async (req, res) => {
  const { facultyid } = req.params;

  try {
    const deleted = await Faculty.findOneAndDelete({ facultyid });

    if (!deleted) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.json({ message: "Faculty deleted successfully", deleted });
  } catch (err) {
    console.error("Delete Faculty Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
