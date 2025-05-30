const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const Student = require('../models/student');
const getAttendanceModel = require('../utils/getAttendanceModel');

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

module.exports = router;
