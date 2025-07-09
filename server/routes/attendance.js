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
    const { collectionName, date, courseList, presentArrays } = req.body;

    if (!collectionName || !date || !Array.isArray(courseList) || !Array.isArray(presentArrays)) {
      return res.status(400).json({ message: 'Missing or invalid data' });
    }

    const Attendance = getAttendanceModel(collectionName);
    const presentRollNumbers = new Set(presentArrays.map(s => s.rollno));
    const students = await Student.find();

    const attendanceDocs = await Attendance.find({
      rollno: { $in: students.map(s => s.rollno) }
    });

    const bulkUpdates = [];
    const updatedStudents = [];

    for (const student of students) {
      const rollno = student.rollno;
      const attendance = attendanceDocs.find(doc => doc.rollno === rollno);
      if (!attendance) continue;

      const isPresent = presentRollNumbers.has(rollno);

      // 🔍 Find logs for today's date
      const dailyLogsForDate = attendance.dailyLogs.filter(log => log.date === date);
      const alreadyMarkedCourses = new Set(dailyLogsForDate.map(log => log.course));
      const hasMarkedToday = dailyLogsForDate.length > 0;

      // 🚫 Only include courses not yet marked today
      const newCourses = courseList.filter(course => !alreadyMarkedCourses.has(course));
      if (newCourses.length === 0) continue;

      // Prepare new dailyLogs
      const newDailyLogs = newCourses.map(course => ({
        date,
        course,
        status: isPresent ? 'present' : 'absent'
      }));

      const incOps = {};

      for (const course of newCourses) {
        incOps[`courseAttendance.${course}.totalDays`] = 1;
        if (isPresent) {
          incOps[`courseAttendance.${course}.presentDays`] = 1;
        }
      }

      // ✅ Increment overallAttendance ONLY if no log exists for today's date
      if (!hasMarkedToday) {
        incOps['overallAttendance.totalDays'] = 1;
        if (isPresent) {
          incOps['overallAttendance.presentDays'] = 1;
        }
      }

      bulkUpdates.push({
        updateOne: {
          filter: { rollno },
          update: {
            $push: { dailyLogs: { $each: newDailyLogs } },
            $inc: incOps,
            $set: { lastUpdated: new Date() }
          }
        }
      });

      updatedStudents.push({ rollno, status: isPresent ? 'present' : 'absent' });
    }

    if (bulkUpdates.length > 0) {
      await Attendance.bulkWrite(bulkUpdates);
    }

    res.json({
      message: 'Attendance marked in bulk',
      count: updatedStudents.length,
      details: updatedStudents
    });

  } catch (error) {
    console.error('Error in bulk attendance marking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;




