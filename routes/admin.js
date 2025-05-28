const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const Student = require('../models/student');
const Attendance = require('../models/attendance.model');

router.get('/attendance/report', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const students = await Student.find({});
    let rows = [];
    let serial = 1;

    for (const student of students) {
      const attendance = await Attendance.findOne({ rollno: student.rollno });

      let isPresent = false;

      if (attendance && attendance.dailyLogs) {
        // Filter logs for this date and check if at least one log is 'present'
        const logsForDate = attendance.dailyLogs.filter(log => log.date === date);
        isPresent = logsForDate.some(log => log.status === 'present');
      }

      rows.push({
        'S.No': serial++,
        'Roll No': student.rollno,
        'Name': student.name,
        'Branch': student.branch,
        'Batch': student.batch,
        'Status': isPresent ? 'Present' : 'Absent'
      });
    }

    // Create and send Excel file
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${date}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return res.send(buffer);
  } catch (err) {
    console.error('Error generating attendance report:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;