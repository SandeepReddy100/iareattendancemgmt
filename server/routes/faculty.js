const express = require('express');
const router = express.Router();
const Faculty = require('../models/faculty');

// GET /api/faculty/:facultyid - Get faculty by id
router.get('/:facultyid', async (req, res) => {
  try {
    const { facultyid } = req.params;
    console.log('Looking for faculty with ID:', facultyid);

    const faculty = await Faculty.findOne(
      { facultyid },
      'name facultyid email batches_assigned'
    );

    if (!faculty) {
      console.log('Faculty not found');
      return res.status(404).json({ message: 'Faculty not found' });
    }
    res.json(faculty);
  } catch (err) {
    console.error('Error fetching faculty:', err);
    res.status(500).json({ message: 'Please try again after some time' });
  }
});

// POST: Update Faculty Password
router.post('/update-password', async (req, res) => {
  const { facultyEmail, currentPassword, newPassword } = req.body;

  if (!facultyEmail || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'facultyEmail, currentPassword, and newPassword are required' });
  }

  try {
    const faculty = await Faculty.findOne({ facultyEmail });

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

// POST /api/announcements
router.post("/announcements", async (req, res) => {
  try {
    const { postedby, title, subtitle, content, batches } = req.body;

    // Basic validation
    if (
      !postedby ||
      !title ||
      !subtitle ||
      !content ||
      !Array.isArray(batches) ||
      batches.length === 0
    ) {
      return res.status(400).json({ message: "All fields are required and batches must be a non-empty array." });
    }

    // Create and save announcement
    const newAnnouncement = new Announcement({
      postedby,
      title,
      subtitle,
      content,
      batches,
      createdAt: new Date(), // optional, auto-set by schema too
    });

    const saved = await newAnnouncement.save();
    res.status(201).json({
      message: "Announcement posted successfully",
      announcementId: saved._id,
    });

  } catch (error) {
    console.error("Error posting announcement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
