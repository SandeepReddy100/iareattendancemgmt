const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const Attendance = require('../models/attendance.model');

const today = new Date().toISOString().slice(0, 10);

// // Mark attendance endpoint
// // routes/attendance.js
// router.post('/mark', async (req, res) => {
//   try {
//     const { qrData, course } = req.body;
//     if (!qrData || !course) return res.status(400).json({ message: 'Missing data' });

//     const lines = qrData.split('\n');
//     const rollLine = lines.find(line => line.startsWith('Roll No:'));
//     const rollno = rollLine?.split(':')[1]?.trim();

//     if (!rollno) return res.status(400).json({ message: 'Invalid QR data' });

//     const student = await Student.findOne({ rollno });
//     if (!student) return res.status(404).json({ message: 'Student not found' });

//     const today = new Date().toISOString().slice(0, 10);
//     const courses = Array.isArray(course) ? course : [course];

//     const attendanceRecord = await Attendance.findOne({ rollno });

//     // Check if any attendance already exists today
//     const alreadyMarkedToday = attendanceRecord?.dailyLogs?.some(log => log.date === today);

//     let updateOps = {
//       $push: { dailyLogs: [] },
//       $set: { lastUpdated: new Date() }
//     };
//     let incOps = {};
//     let markedCourses = [];
//     let skippedCourses = [];

//     for (const c of courses) {
//       const alreadyMarkedForCourse = attendanceRecord?.dailyLogs?.some(
//         log => log.date === today && log.course === c
//       );

//       if (alreadyMarkedForCourse) {
//         skippedCourses.push(c);
//         continue;
//       }

//       markedCourses.push(c);

//       updateOps.$push.dailyLogs.push({
//         date: today,
//         course: c,
//         status: 'present'
//       });

//       // Course-specific increments
//       incOps[`courseAttendance.${c}.totalDays`] = 1;
//       incOps[`courseAttendance.${c}.presentDays`] = 1;
//     }

//     // Only increment overall attendance once per day
//     if (!alreadyMarkedToday && markedCourses.length > 0) {
//       incOps['overallAttendance.totalDays'] = 1;
//       incOps['overallAttendance.presentDays'] = 1;
//     }

//     // Only send update if there's something to mark
//     if (markedCourses.length === 0) {
//       return res.status(409).json({ message: 'All courses already marked today' });
//     }

//     updateOps.$inc = incOps;

//     const result = await Attendance.findOneAndUpdate(
//       { rollno },
//       updateOps,
//       { upsert: true, new: true }
//     );

//     res.json({
//       message: 'Attendance marked successfully',
//       marked: markedCourses,
//       skipped: skippedCourses,
//       data: result
//     });

//   } catch (err) {
//     console.error('Marking error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// //Temporary Marking the attendance if they are null  
// router.post('/mark-absentees', async (req, res) => {
//   try {
//     const { date, presentRollNumbers } = req.body;

//     if (!date || !Array.isArray(presentRollNumbers)) {
//       return res.status(400).json({ message: 'Missing date or presentRollNumbers' });
//     }

//     const students = await Student.find();

//     const allRolls = students.map(s => s.rollno);
//     const absentRolls = allRolls.filter(roll => !presentRollNumbers.includes(roll));

//     let updated = [];

//     for (const rollno of absentRolls) {
//       const student = students.find(s => s.rollno === rollno);
//       if (!student) continue;

//       const attendance = await Attendance.findOne({ rollno });

//       const alreadyMarked = attendance?.dailyLogs?.some(log => log.date === date);
//       if (alreadyMarked) continue;

//       const studentCourses = Object.keys(student.selectedCourses || {});
//       const dailyLogs = [];
//       const incOps = {};

//       for (const course of studentCourses) {
//         if (!course) continue;

//         dailyLogs.push({ date, course, status: 'absent' });
//         incOps[`courseAttendance.${course}.totalDays`] = 1;
//       }

//       // Increment overall totalDays only once
//       incOps['overallAttendance.totalDays'] = 1;

//       const updateOps = {
//         $push: { dailyLogs: { $each: dailyLogs } },
//         $inc: incOps,
//         $set: { lastUpdated: new Date() }
//       };

//       await Attendance.findOneAndUpdate({ rollno }, updateOps, { upsert: true });
//       updated.push(rollno);
//     }

//     res.json({
//       message: 'Absentees marked',
//       count: updated.length,
//       absentees: updated
//     });

//   } catch (err) {
//     console.error('Absentee marking error:', err);
//     res.status(500).json({ message: 'Server error while marking absentees' });
//   }
// });


router.post('/mark-all', async (req, res) => {
  try {
    const { date, courseList, presentArrays } = req.body;
    if (!date || !Array.isArray(courseList) || !Array.isArray(presentArrays)) {
      return res.status(400).json({ message: 'Missing or invalid data' });
    }

    // Extract roll numbers from presentArrays
    const presentRollNumbers = presentArrays.map(s => s.rollno);

    // Get all students
    const students = await Student.find();

    let updatedStudents = [];

    for (const student of students) {
      const rollno = student.rollno;
      const attendance = await Attendance.findOne({ rollno });

      // Skip if no attendance doc for this student (do not create new)
      if (!attendance) continue;

      const isPresent = presentRollNumbers.includes(rollno);

      // Filter logs for this date
      const dailyLogsForDate = attendance.dailyLogs.filter(log => log.date === date) || [];

      // Collect courses already recorded on this date for this student
      const alreadyMarkedCourses = new Set(dailyLogsForDate.map(log => log.course));

      let newDailyLogs = [];
      let incOps = {};

      // For each course in courseList, add if not already marked on this date
      for (const course of courseList) {
        if (alreadyMarkedCourses.has(course)) continue; // skip duplicate

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

      if (newDailyLogs.length === 0) continue; // nothing new to update

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


// GET /api/attendance/report?rollno=...&course=...&date=...
router.get('/report', async (req, res) => {
  const { rollno, course, date } = req.query;

  const query = {};
  if (rollno) query.rollno = rollno;
  if (course || date) query.dailyLogs = {};

  if (course) query.dailyLogs.course = course;
  if (date) query.dailyLogs.date = date;

  try {
    const data = await Attendance.find(query);
    res.json(data);
  } catch (err) {
    console.error('Report fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Attendance Collection endpoint 
router.get('/all', async (req, res) => {
  const { batch, courseName } = req.query;

  try {
    let query = {};
    if (batch) query.batch = batch;

    const attendanceDocs = await Attendance.find(query);

    if (!attendanceDocs.length) {
      return res.status(404).json({ message: 'No attendance records found' });
    }

    const results = attendanceDocs.map(att => {
      const courseStats = att.courseAttendance.get(courseName) || { totalDays: 0, presentDays: 0 };
      const attendancePercentage = courseStats.totalDays === 0
        ? 0
        : ((courseStats.presentDays / courseStats.totalDays) * 100).toFixed(2);

      return {
        rollno: att.rollno,
        name: att.name,
        branch: att.branch,
        batch: att.batch,
        courseName: courseName || 'All Courses',
        courseAttendance: courseName ? { [courseName]: courseStats } : Object.fromEntries(att.courseAttendance),
        overallAttendance: att.overallAttendance,
        overallPercentage: att.overallAttendance.totalDays === 0
          ? 0
          : ((att.overallAttendance.presentDays / att.overallAttendance.totalDays) * 100).toFixed(2)
      };
    });

    return res.json(results);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
});


module.exports = router;


