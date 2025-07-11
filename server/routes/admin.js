const express = require("express");
const router = express.Router();
const XLSX = require("xlsx");
const Student = require("../models/student");
const getAttendanceModel = require("../utils/getAttendanceModel");
const Faculty = require("../models/faculty");
const Admin = require("../models/admin")
const ExcelJS = require("exceljs");

function getShortBatchName(fullBatchName) {
  const parts = fullBatchName.toUpperCase().split(" ");
  let code =
    parts[0] === "SKILLUP"
      ? "SU"
      : parts[0] === "SKILLNEXT"
      ? "SN"
      : parts[0] === "SKILLBRIDGE"
      ? "SB"
      : "NA";

  const number =
    parts
      .find((p) => p.includes("-"))
      ?.split("-")
      .pop() || "";

  return `V-${code}-${number}`;
}

router.get("/attendance-report", async (req, res) => {
  const { batch, date, format = "excel" } = req.query;

  if (!batch || !date || format !== "excel") {
    return res.status(400).json({
      message: "batch, date, and format=excel are required",
    });
  }

  const batches = Array.isArray(batch) ? batch : [batch];
  const allSummaries = [];

  try {
    for (const b of batches) {
      const collectionName = `attendance_${b
        .toLowerCase()
        .replace(/batch/gi, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/--+/g, "-")}`;

      const Attendance = getAttendanceModel(collectionName);
      const students = await Attendance.find();

      const branchData = {};

      for (const student of students) {
        const branch = student.branch || "UNKNOWN";
        const shortBatch = getShortBatchName(student.batch);

        if (!branchData[branch]) {
          branchData[branch] = {
            batch: shortBatch,
            branch,
            strength: 0,
            presenties: 0,
            absenties: 0,
          };
        }

        const logsForDate = student.dailyLogs?.filter(
          (log) => log.date === date
        );

        const wasPresent = logsForDate?.some(
          (log) => log.status.toLowerCase() === "present"
        );

        branchData[branch].strength++;
        if (wasPresent) {
          branchData[branch].presenties++;
        } else {
          branchData[branch].absenties++;
        }
      }

      allSummaries.push(...Object.values(branchData));
    }

    // Generate Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("PAT Attendance Summary");

    // Format date to DD-MM-YYYY
    const formatDateForDisplay = (dateString) => {
      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) return dateString;

      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const displayDate = formatDateForDisplay(date);

    // Institute Header
    const instituteRow = sheet.addRow([
      "Institute of Aeronautical Engineering",
      "",
      "",
      "",
      "",
    ]);
    instituteRow.getCell(1).font = { bold: true, size: 14 };
    instituteRow.getCell(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    sheet.mergeCells("A1:E1");
    instituteRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "E6E6FA" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Summary Header
    const summaryRow = sheet.addRow([
      `PAT Attendance Summary - ${displayDate}`,
      "",
      "",
      "",
      "",
    ]);
    summaryRow.getCell(1).font = { bold: true, size: 12 };
    summaryRow.getCell(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    sheet.mergeCells("A2:E2");
    summaryRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F0F0F0" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // CDC Header
    const cdcRow = sheet.addRow(["Career Development Center", "", "", "", ""]);
    cdcRow.getCell(1).font = { bold: true, size: 11 };
    cdcRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    sheet.mergeCells("A3:E3");
    cdcRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F5F5F5" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // BTech Header
    const btechRow = sheet.addRow([
      "B.Tech V Semester Attendance Summary",
      "",
      "",
      "",
      "",
    ]);
    btechRow.getCell(1).font = { bold: true, size: 10 };
    btechRow.getCell(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    sheet.mergeCells("A4:E4");
    btechRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FAFAFA" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Empty Row
    sheet.addRow([]);

    // Table Header
    const headerRow = sheet.addRow([
      "BATCH",
      "BRANCH",
      "Total Strength",
      "Presenties",
      "Absenties",
    ]);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "ADD8E6" },
      };
      cell.font = { bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    sheet.columns = [
      { width: 20 },
      { width: 25 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
    ];

    // Data Rows
    let totalPresent = 0;
    let totalAbsent = 0;

    allSummaries.forEach((item) => {
      const row = sheet.addRow([
        item.batch,
        item.branch,
        item.strength,
        item.presenties,
        item.absenties,
      ]);

      totalPresent += item.presenties;
      totalAbsent += item.absenties;

      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Totals Row
    const totalRow = sheet.addRow(["TOTAL", "", "", totalPresent, totalAbsent]);
    totalRow.font = { bold: true };
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance_summary_${displayDate.replace(
        /-/g,
        "_"
      )}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/attendance/complete-report/:collectionName", async (req, res) => {
  try {
    const collectionName = req.params.collectionName;
    if (!collectionName) {
      return res.status(400).json({ message: "Missing collectionName parameter" });
    }

    const reportDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const displayDate = new Date().toLocaleDateString("en-GB").split("/").join("-"); // DD-MM-YYYY

    const Attendance = getAttendanceModel(collectionName);
    const attendanceRecords = await Attendance.find({});

    // Get batch name from a sample student
    const sampleAttendance = attendanceRecords[0];
    const sampleStudent = sampleAttendance
      ? await Student.findOne({ rollno: sampleAttendance.rollno })
      : null;

    const batchName = sampleStudent?.batch || "UNKNOWN BATCH";
    const shortBatchName = getShortBatchName(batchName);

    const students = await Student.find({ batch: batchName });
    const workbook = new ExcelJS.Workbook();

    // Styling header rows
    const styleHeaders = (sheet, title) => {
      const headerRows = [
        ["Institute of Aeronautical Engineering", "E6E6FA", 14],
        [`PAT Attendance Summary - ${displayDate}`, "F0F0F0", 12],
        ["Career Development Center", "F5F5F5", 11],
        [title, "FAFAFA", 10],
      ];

      headerRows.forEach(([text, color, size], i) => {
        const row = sheet.addRow([text, "", "", "", "", ""]);
        sheet.mergeCells(`A${i + 1}:F${i + 1}`);
        row.getCell(1).font = { bold: true, size };
        row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
        row.eachCell(cell => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
          cell.border = {
            top: { style: "thin" }, left: { style: "thin" },
            bottom: { style: "thin" }, right: { style: "thin" },
          };
        });
      });

      sheet.addRow();
      const headerRow = sheet.addRow(["S.No", "Roll No", "Name", "Branch", "Batch", "Status"]);
      headerRow.eachCell(cell => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "ADD8E6" } };
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" },
        };
      });

      sheet.columns = [
        { key: "sno", width: 8 },
        { key: "roll", width: 15 },
        { key: "name", width: 32 },
        { key: "branch", width: 18 },
        { key: "batch", width: 20 },
        { key: "status", width: 14 },
      ];
    };

    // Add student rows to sheet
    const addStudentRows = (sheet, data) => {
      let sr = 1;
      let present = 0, absent = 0;

      data.forEach(({ student, isPresent }) => {
        if (isPresent) present++;
        else absent++;

        const row = sheet.addRow([
          sr++,
          student.rollno,
          student.name,
          student.branch || "UNKNOWN",
          getShortBatchName(student.batch),
          isPresent ? "Present" : "Absent",
        ]);

        row.eachCell((cell, col) => {
          cell.font = { name: "Calibri", size: 11 };
          cell.alignment = { vertical: "middle", horizontal: col === 3 ? "left" : "center" };
          cell.border = {
            top: { style: "thin" }, left: { style: "thin" },
            bottom: { style: "thin" }, right: { style: "thin" },
          };
        });
      });

      sheet.addRow();
      const totalRow = sheet.addRow(["", "", "", "Total", `Present: ${present}`, `Absent: ${absent}`]);
      totalRow.eachCell(cell => {
        cell.font = { bold: true };
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" },
        };
      });
    };

    // Final structured attendance data
    const completeData = students.map(student => {
      const attendance = attendanceRecords.find(a => a.rollno === student.rollno);
      const logs = attendance?.dailyLogs?.filter(log => log.date === reportDate) || [];
      const isPresent = logs.some(log => log.status === "present");
      return { student, isPresent };
    });

    // Sheet 1 - Complete Report (both present and absent)
    const completeSheet = workbook.addWorksheet("Complete Report");
    styleHeaders(completeSheet, `B.Tech V Semester - ${shortBatchName}`);
    addStudentRows(completeSheet, completeData);

    // Create branch-wise absent-only sheets
    const branchMap = {};
    completeData.forEach(entry => {
      const branch = entry.student.branch || "UNKNOWN";
      if (!branchMap[branch]) branchMap[branch] = [];
      branchMap[branch].push(entry);
    });

    for (const branch of Object.keys(branchMap).sort()) {
      const absentees = branchMap[branch].filter(entry => !entry.isPresent);
      if (absentees.length === 0) continue; // skip if no absentees

      const sheetName = `${shortBatchName}_${branch}`.replace(/[\\\/\?\*\[\]]/g, "").slice(0, 31);
      const sheet = workbook.addWorksheet(sheetName);
      styleHeaders(sheet, `B.Tech V Semester - ${sheetName}`);
      addStudentRows(sheet, absentees);
    }

    // Send the Excel file
    const fileName = `${shortBatchName}_${displayDate}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Error generating attendance report:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// PATCH /mark-present (Bulk Operation Version)
router.patch("/mark-present-bulk", async (req, res) => {
  try {
    const { course, presenties, batch } = req.body;
    
    if (!course || !Array.isArray(presenties) || !batch) {
      return res.status(400).json({ message: "Missing course, presenties, or batch" });
    }

    const Attendance = getAttendanceModel(batch);
    const today = new Date().toISOString().slice(0, 10);
    const courseKey = course.trim();

    // Build bulk operations
    const bulkOps = [];
    
    // First, find all students with absent logs for today
    const studentsWithAbsentLogs = await Attendance.find({
      rollno: { $in: presenties },
      dailyLogs: {
        $elemMatch: {
          date: today,
          course: courseKey,
          status: "absent"
        }
      }
    });

    console.log(`📝 Found ${studentsWithAbsentLogs.length} students with absent logs`);

    for (const student of studentsWithAbsentLogs) {
      // Find the specific log index
      const logIndex = student.dailyLogs.findIndex(
        (log) =>
          log.date === today &&
          log.course === courseKey &&
          log.status === "absent"
      );

      if (logIndex !== -1) {
        bulkOps.push({
          updateOne: {
            filter: {
              rollno: student.rollno,
              [`dailyLogs.${logIndex}.date`]: today,
              [`dailyLogs.${logIndex}.course`]: courseKey,
              [`dailyLogs.${logIndex}.status`]: "absent"
            },
            update: {
              $set: {
                [`dailyLogs.${logIndex}.status`]: "present",
                lastUpdated: new Date()
              },
              $inc: {
                "overallAttendance.presentDays": 1,
                [`courseAttendance.${courseKey}.presentDays`]: 1
              }
            }
          }
        });
      }
    }

    if (bulkOps.length === 0) {
      return res.status(404).json({
        message: "No absent logs found for the specified students and course today",
        updatedCount: 0
      });
    }

    // Execute bulk operations
    const result = await Attendance.bulkWrite(bulkOps, { ordered: false });

    console.log(`📊 Bulk operation result:`, result);

    res.status(200).json({
      message: "Bulk mark present operation completed",
      updatedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
      totalRequested: presenties.length,
      foundAbsentLogs: studentsWithAbsentLogs.length
    });

  } catch (err) {
    console.error("❌ Error in /mark-present-bulk:", err);
    res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
// POST /api/student
router.post("/student", async (req, res) => {
  const { name, rollno, password, branch, batch, email, qrData, qrLink } =
    req.body;

  // Validate
  if (!name || !rollno || !password || !branch || !batch || !email) {
    return res
      .status(400)
      .json({ message: "All required fields must be provided" });
  }

  try {
    const existingStudent = await Student.findOne({ rollno });

    if (existingStudent) {
      return res
        .status(409)
        .json({ message: "Student with this rollno already exists" });
    }

    const newStudent = new Student({
      name,
      rollno,
      password,
      branch,
      batch,
      email,
      qrData,
      qrLink,
    });

    await newStudent.save();

    res
      .status(201)
      .json({ message: "Student added successfully", student: newStudent });
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
      student: updatedStudent,
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

    return res.json({
      message: "Student deleted successfully",
      deletedStudent,
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/admin?adminId=ADMIN001
router.get("/admin", async (req, res) => {
  const { adminId } = req.query;

  if (!adminId) {
    return res.status(400).json({ message: "adminId is required." });
  }

  try {
    const admin = await Admin.findOne({
      adminId: new RegExp(`^${adminId}$`, "i"),
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    return res.json({
      adminId: admin.adminId,
      email: admin.email,
      name : admin.name,
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
    if (existing)
      return res.status(409).json({ message: "Faculty already exists" });

    const newFaculty = new Faculty({ name, facultyid, passwordfa, email });
    const savedFaculty = await newFaculty.save();

    res
      .status(201)
      .json({ message: "Faculty added successfully", faculty: savedFaculty });
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

    res.json({
      message: "Faculty updated successfully",
      faculty: updatedFaculty,
    });
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

// get absentees
router.get("/absentees", async (req, res) => {
  try {
    const { batch, date, course } = req.query;

    if (!batch || !date || !course) {
      return res
        .status(400)
        .json({ message: "Missing batch, date, or course" });
    }

    let Attendance;
    try {
      Attendance = getAttendanceModel(batch); // Ensure model exists
    } catch (err) {
      return res
        .status(404)
        .json({ message: `Batch collection not found: ${batch}` });
    }

    const absentees = await Attendance.find(
      {
        dailyLogs: {
          $elemMatch: {
            date: date,
            course: course,
            status: "absent",
          },
        },
      },
      { rollno: 1, _id: 0 }
    );

    const rollnos = absentees.map((student) => student.rollno);
    res.status(200).json(rollnos);
  } catch (err) {
    console.error("Error fetching absentees:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
