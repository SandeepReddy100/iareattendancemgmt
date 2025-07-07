const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const Student = require('../models/student');
const getAttendanceModel = require('../utils/getAttendanceModel');

// POST /api/student
router.post("/student", async (req, res) => {
  const {
    name,
    rollno,
    password,
    branch,
    batch,
    email,
    qrData,
    qrLink
  } = req.body;

  // Validate
  if (!name || !rollno || !password || !branch || !batch || !email) {
    return res.status(400).json({ message: "All required fields must be provided" });
  }

  try {
    const existingStudent = await Student.findOne({ rollno });

    if (existingStudent) {
      return res.status(409).json({ message: "Student with this rollno already exists" });
    }

    const newStudent = new Student({
      name,
      rollno,
      password,
      branch,
      batch,
      email,
      qrData,
      qrLink
    });

    await newStudent.save();

    res.status(201).json({ message: "Student added successfully", student: newStudent });
  } catch (error) {
    console.error("Error inserting student:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/student/:rollno", async (req, res) => {
  const { rollno } = req.params;
  const updates = req.body;

  if (!rollno) {
    return res.status(400).json({ message: "Roll number is required" });
  }

  try {
    const updatedStudent = await Student.findOneAndUpdate(
      { rollno },
      { $set: updates },
      { new: true } // return the updated document
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      message: "Student updated successfully",
      student: updatedStudent
    });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/students/:rollno
router.delete("/students/:rollno", async (req, res) => {
  const { rollno } = req.params;

  if (!rollno) {
    return res.status(400).json({ message: "Roll number is required" });
  }

  try {
    const deletedStudent = await Student.findOneAndDelete({ rollno });

    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json({ message: "Student deleted successfully", deletedStudent });
  } catch (error) {
    console.error("Error deleting student:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/attendance/report/:collectionName', async (req, res) => {
  try {
    const collectionName = req.params.collectionName;

    if (!collectionName) {
      return res.status(400).json({ message: 'Missing collectionName parameter' });
    }

    const reportDate = new Date().toISOString().slice(0, 10);
    const Attendance = getAttendanceModel(collectionName);

    // Find only students who have an attendance record in this specific collection
    const attendanceRecords = await Attendance.find({});
    const rollnosWithAttendance = attendanceRecords.map(a => a.rollno);

    // Get student details only for those roll numbers
    const students = await Student.find({ rollno: { $in: rollnosWithAttendance } });

    let serial = 1;
    const rows = [];

    for (const student of students) {
      const attendance = attendanceRecords.find(a => a.rollno === student.rollno);
      const logsForDate = attendance?.dailyLogs?.filter(log => log.date === reportDate) || [];
      const isPresent = logsForDate.some(log => log.status === 'present');

      rows.push({
        'S.No': serial++,
        'Roll No': student.rollno,
        'Name': student.name,
        'Branch': student.branch,
        'Batch': student.batch,
        'Status': isPresent ? 'Present' : 'Absent'
      });
    }

    // Sort: Absent first, then Present
    rows.sort((a, b) => a.Status === 'Absent' ? -1 : b.Status === 'Absent' ? 1 : 0);

    // Create worksheet and set column widths
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 6 },   // S.No
      { wch: 12 },  // Roll No
      { wch: 35 },  // Name
      { wch: 15 },  // Branch
      { wch: 20 },  // Batch
      { wch: 12 },  // Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${reportDate}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return res.send(buffer);

  } catch (err) {
    console.error('Error generating attendance report:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin?adminId=ADMIN001
router.get("/admin", async (req, res) => {
  const { adminId } = req.query;

  if (!adminId) {
    return res.status(400).json({ message: "adminId is required." });
  }

  try {
    const admin = await Admin.findOne({ adminId: new RegExp(`^${adminId}$`, 'i') });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    return res.json({
      adminId: admin.adminId,
      email: admin.email
      // password excluded intentionally for security
    });

  } catch (error) {
    console.error("Error fetching admin:", error);
    return res.status(500).json({ message: "Internal server error." });
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
