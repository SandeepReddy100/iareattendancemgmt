const express = require('express');
const router = express.Router();
const Admin = require('../models/admin')

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({
         adminId: new RegExp(`^${username}$`, 'i')  // case-insensitive match
     });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (admin.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    res.status(200).json({
      message: 'Login successful',
      adminId: admin.adminId,
      email: admin.email
    });

  } catch (err) {
    res.status(500).json({ message: 'Please try again after some time', error: err.message });
  }
});

module.exports = router;
