const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const getAttendanceModel = require('../utils/getAttendanceModel');

router.get("/attendance", async (req, res) => {
  const { rollno, batch } = req.query;

  if (!rollno || !batch) {
    return res.status(400).json({ message: "rollno and batch are required" });
  }

  try {
    // Convert batch to lowercase and hyphenate spaces
    const collectionName = `attendance_${batch.toLowerCase().replace(/\s+/g, "-")}`;
    const AttendanceModel = getAttendanceModel(collectionName);

    // Use case-insensitive search for roll number
    const student = await AttendanceModel.findOne({
      rollno: new RegExp(`^${rollno}$`, 'i')
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json({
      overallAttendance: student.overallAttendance,
      courseAttendance: student.courseAttendance
    });

  } catch (err) {
    console.error("Error fetching attendance:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post('/mark-all', async (req, res) => {
  try {
    const { collectionName, date, course, presentArrays } = req.body;

    // 🛡️ Input validation
    if (!collectionName || !date || !course || !Array.isArray(presentArrays)) {
      return res.status(400).json({ message: 'Missing or invalid input data' });
    }

    const Attendance = getAttendanceModel(collectionName);
    const presentSet = new Set(presentArrays.map(s => s.rollno));
    const attendanceDocs = await Attendance.find(); // Get all students for this collection

    const bulkUpdates = [];
    const updatedStudents = [];
    const now = new Date();

    for (const doc of attendanceDocs) {
      const { rollno, dailyLogs } = doc;
      const isPresent = presentSet.has(rollno);

      let hasCourseMarkedToday = false;
      let hasAnyMarkedToday = false;

      for (const log of dailyLogs) {
        if (log.date === date) {
          hasAnyMarkedToday = true;
          if (log.course === course) {
            hasCourseMarkedToday = true;
            break;
          }
        }
      }

      if (hasCourseMarkedToday) continue; // Skip if already marked for this course today

      const newLog = {
        date,
        course,
        status: isPresent ? 'present' : 'absent'
      };

      const incOps = {
        [`courseAttendance.${course}.totalDays`]: 1
      };

      if (isPresent) {
        incOps[`courseAttendance.${course}.presentDays`] = 1;
      }

      if (!hasAnyMarkedToday) {
        incOps['overallAttendance.totalDays'] = 1;
        if (isPresent) {
          incOps['overallAttendance.presentDays'] = 1;
        }
      }

      bulkUpdates.push({
        updateOne: {
          filter: { rollno },
          update: {
            $push: { dailyLogs: newLog },
            $inc: incOps,
            $set: { lastUpdated: now }
          }
        }
      });

      updatedStudents.push({ rollno, status: newLog.status });
    }

    if (bulkUpdates.length > 0) {
      await Attendance.bulkWrite(bulkUpdates);
    }

    res.status(200).json({
      message: 'Attendance marked successfully for the course',
      count: updatedStudents.length,
      details: updatedStudents
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;




