const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const getAttendanceModel = require('../utils/getAttendanceModel');

router.post('/mark-all', async (req, res) => {
  try {
    const { collectionName, date, courseList, presentArrays } = req.body;

    if (!collectionName || !date || !Array.isArray(courseList) || !Array.isArray(presentArrays)) {
      return res.status(400).json({ message: 'Missing or invalid data' });
    }

    // Get dynamic Attendance model
    const Attendance = getAttendanceModel(collectionName);

    const presentRollNumbers = presentArrays.map(s => s.rollno);

    const students = await Student.find(); // Student remains the same

    let updatedStudents = [];

    for (const student of students) {
      const rollno = student.rollno;
      const attendance = await Attendance.findOne({ rollno });

      if (!attendance) continue;

      const isPresent = presentRollNumbers.includes(rollno);
      const dailyLogsForDate = attendance.dailyLogs.filter(log => log.date === date) || [];
      const alreadyMarkedCourses = new Set(dailyLogsForDate.map(log => log.course));

      let newDailyLogs = [];
      let incOps = {};


      // Group same course names together
      const courseCounts = {};
      for (const course of courseList) {
        courseCounts[course] = (courseCounts[course] || 0) + 1;
      }

      const uniqueCourses = Object.keys(courseCounts);

      if (uniqueCourses.length === 1) {
        // All courses are the same, add only one dailyLogs entry
        const course = uniqueCourses[0];
        if (!alreadyMarkedCourses.has(course)) {
          newDailyLogs.push({
            date,
            course,
            status: isPresent ? 'present' : 'absent'
          });

          incOps[`courseAttendance.${course}.totalDays`] = 1;
          if (isPresent) {
            incOps[`courseAttendance.${course}.presentDays`] = 1;
          }
        }
      }


      if (newDailyLogs.length === 0) continue;

      incOps['overallAttendance.totalDays'] = 1;
      if (isPresent) {
        incOps['overallAttendance.presentDays'] = 1;
      }

      const updateOps = {
        $push: { dailyLogs: { $each: newDailyLogs } },
        $inc: incOps,
        $set: { lastUpdated: new Date() }
      };

      await Attendance.findOneAndUpdate({ rollno }, updateOps);
      updatedStudents.push({ rollno, status: isPresent ? 'present' : 'absent' });
    }

    res.json({
      message: 'Attendance marked for all students',
      count: updatedStudents.length,
      details: updatedStudents
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


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


module.exports = router;




