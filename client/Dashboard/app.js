const sideMenu = document.querySelector("aside");
const profileBtn = document.querySelector("#profile-btn");
const themeToggler = document.querySelector(".theme-toggler");
const nextDay = document.getElementById('nextDay');
const prevDay = document.getElementById('prevDay');
const backendUrl = "https://iareattendancemgmt.onrender.com";


profileBtn.onclick = function () {
  sideMenu.classList.toggle('active');
}

window.onscroll = () => {
  sideMenu.classList.remove('active');
  if (window.scrollY > 0) { document.querySelector('header').classList.add('active'); }
  else { document.querySelector('header').classList.remove('active'); }
}

window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("spinner-overlay").style.display = "none";
  }, 1000); // 1.5 seconds
});
function updateProfileUI(student) {
  console.log("Updating profile UI with student:", student);

  const roll = student.rollno || "N/A";
  const batch = student.batch || "N/A";

  // Profile Details
  document.getElementById("profileName").textContent = student.name || "N/A";
  document.getElementById("profileRollNo").textContent = roll;
  document.getElementById("profileBranch").textContent = student.branch || "N/A";
  document.getElementById("profileBatch").textContent = batch;
  document.getElementById("profileEmail").textContent = student.email || "N/A";

  // Card Top Text
  document.getElementById("cardRoll").textContent = `Roll No: ${roll}`;
  document.getElementById("cardBatch").textContent = `Batch: ${batch}`;

  // Profile Photo
  const photoUrl = `https://iare-data.s3.ap-south-1.amazonaws.com/uploads/STUDENTS/${roll}/${roll}.jpg`;
  document.getElementById("cardPhoto").src = photoUrl;
  document.getElementById("cardPhoto").alt = `${roll} Profile Photo`;

  // QR Code
  if (student.qrLink) {
    const qrImage = document.getElementById("qrImage");
    qrImage.src = student.qrLink;
    qrImage.alt = `${roll} QR Code`;
    qrImage.classList.add("qr-image");
  }

  //For Tampering Prevention

  const img = document.getElementById('qrImage');
  const originalSrc = student.qrLink;
  let tamperDetected = false;

  setInterval(() => {
    if (!tamperDetected && img.src !== originalSrc) {
      tamperDetected = true; // Prevent multiple alerts
      alert("Tampering detected!");
      location.reload(); // Reload once
    }
  }, 1000);




  // Timestamp
  const timestamp = new Date().toLocaleString();
  document.getElementById("qrTimestamp").textContent = `Generated at: ${timestamp}`;
}

function updateAttendanceUI(attendanceData) {
  const { overallAttendance, courseAttendance } = attendanceData;
  const container = document.getElementById("attendanceCardsContainer");
  container.innerHTML = ""; // Clear any previous cards

  // Helper to create a card
  function createCard(title, present, total, icon, colorClass = "") {
    const percent = total === 0 ? 0 : Math.round((present / total) * 100);
    const circumference = 210;
    let offset = circumference;

    if (total > 0) {
      // Avoid 0 offset glitch by slightly offsetting 100%
      offset = percent === 100 ? 0.01 : circumference - (percent / 100) * circumference;
    }


    const div = document.createElement("div");
    div.className = `${colorClass}`;

    div.innerHTML = `
    <span class="material-icons-sharp">${icon}</span>
    <h3>${title}</h3>
    <h2>${present}/${total}</h2>
    <div class="progress">
  <svg>
    ${(total === 0 || percent === 0)
        ? `<!-- No circle rendered -->`
        : `<circle cx="38" cy="38" r="36"
            style="
              stroke-dasharray: ${circumference};
              stroke-dashoffset: ${offset};
            ">
        </circle>`
      }
  </svg>
  <div class="number"><p>${percent}%</p></div>
</div>
    <small class="text-muted">Last 24 Hours</small>
  `;

    container.appendChild(div);
  }


  // Add overall attendance card
  createCard("Overall Attendance", overallAttendance.presentDays, overallAttendance.totalDays, "architecture", "eg");

  // Map for icon and color class
  const courseMeta = {
    JFS: { name: "Java FullStack Development", icon: "computer", class: "cs" },
    CP: { name: "Competitive Programming", icon: "functions", class: "mth" },
    DBMS: { name: "Database Management", icon: "storage", class: "cg" },
    AWS: { name: "Amazon Web Services", icon: "computer", class: "cs" },
  };

  // Loop through each course and render
  Object.entries(courseAttendance).forEach(([key, { presentDays, totalDays }]) => {
    const meta = courseMeta[key] || {
      name: key,
      icon: "school",
      class: "net"
    };
    createCard(meta.name, presentDays, totalDays, meta.icon, meta.class);
  });
}


document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("isLoggedIn") !== "true") {
    // Redirect to login page if not logged in
    window.location.href = "../index.html";
  }
  const rollno = localStorage.getItem("rollno");
  if (!rollno) {
    console.warn("No roll number found in localStorage.");
    return;
  }

  // Profile fetch and cache
  const cachedProfileRaw = localStorage.getItem("profileData");
  let batch = null;

  if (cachedProfileRaw) {
    try {
      const cachedProfile = JSON.parse(cachedProfileRaw);
      updateProfileUI(cachedProfile);
      batch = cachedProfile.batch || "";

      const cacheTime = localStorage.getItem("profileDataTimestamp");
      if (cacheTime && Date.now() - parseInt(cacheTime) < 3600000) {
        console.log("Using cached profile.");
      } else {
        fetch(`${backendUrl}/api/student/${encodeURIComponent(rollno)}`)
          .then(res => res.json())
          .then(data => {
            const student = data.student || data;
            localStorage.setItem("profileData", JSON.stringify(student));
            localStorage.setItem("profileDataTimestamp", Date.now().toString());
            updateProfileUI(student);
            batch = student.batch || "";
          })
          .catch(err => {
            console.error("Profile fetch error:", err);
          });
      }
    } catch (err) {
      console.error("Invalid cached profile:", err);
    }
  }

  if (!batch) {
    console.warn("Batch missing, cannot fetch attendance.");
    return;
  }
  const formattedBatch = batch
    .replace(/BATCH/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  fetch(`${backendUrl}/api/facultyop/attendance?rollno=${encodeURIComponent(rollno)}&batch=${encodeURIComponent(formattedBatch)}`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    })
    .then((data) => {
      updateAttendanceUI(data);
    })
    .catch((err) => {
      console.error("Attendance fetch error:", err);
    });

});



// Time-Table_Section

const batchWiseTimetable = {
  "SKILLUP BATCH-1": {
    Monday: [
      { time: "9:30AM - 12:15PM", subject: "CP", room: "5102" }
    ],
    Tuesday: [
      { time: "9:30AM - 12:15PM", subject: "JFS", room: "5102" }
    ],
    Wednesday: [
      { time: "9:30AM - 12:15PM", subject: "DBMS", room: "5102" }
    ],
    Thursday: [
      { time: "1:15PM - 3:50PM", subject: "CP", room: "5102" }
    ],
    Friday: [
      { time: "1:15PM - 3:50PM", subject: "AWS", room: "5102" }
    ],
    Saturday: [
      { time: "1:15PM - 3:50PM", subject: "JSF", room: "5102" }
    ]
  },
  "SKILLUP BATCH-2": {
    Monday: [
      { time: "9:30AM - 12:15PM", subject: "AWS", room: "5106" }
    ],
    Tuesday: [
      { time: "9:30AM - 12:15PM", subject: "JFS", room: "5106" }
    ],
    Wednesday: [
      { time: "9:30AM - 12:15PM", subject: "CP", room: "5106" }
    ],
    Thursday: [
      { time: "1:15PM - 3:50PM", subject: "DBMS", room: "5106" }
    ],
    Friday: [
      { time: "1:15PM - 3:50PM", subject: "JFS", room: "5106" }
    ],
    Saturday: [
      { time: "1:15PM - 3:50PM", subject: "CP", room: "5106" }
    ]
  },
  "SKILLUP BATCH-3": {
    Monday: [
      { time: "1:15PM - 3:50PM", subject: "DBMS", room: "5104" }
    ],
    Tuesday: [
      { time: "1:15PM - 3:50PM", subject: "AWS", room: "5104" }
    ],
    Wednesday: [
      { time: "1:15PM - 3:50PM", subject: "CP", room: "5104" }
    ],
    Thursday: [
      { time: "9:30AM - 12:15PM", subject: "JFS", room: "5104" }
    ],
    Friday: [
      { time: "9:30AM - 12:15PM", subject: "CP", room: "5104" }
    ],
    Saturday: [
      { time: "9:30AM - 12:15PM", subject: "JFS", room: "5104" }
    ]
  },
  "SKILLNEXT-1": {
    Monday: [
      { time: "9:30AM - 12:15PM", subject: "CP", room: "5204" }
    ],
    Tuesday: [
      { time: "9:30AM - 12:15PM", subject: "DBMS", room: "5204" }
    ],
    Wednesday: [
      { time: "9:30AM - 12:15PM", subject: "JFS", room: "5204" }
    ],
    Thursday: [
      { time: "1:15PM - 3:50PM", subject: "CP", room: "5204" }
    ],
    Friday: [
      { time: "1:15PM - 3:50PM", subject: "CP", room: "5204" }
    ],
    Saturday: [
      { time: "1:15PM - 3:50PM", subject: "JFS", room: "5204" }
    ]
  },
  "SKILLNEXT-2": {
    Monday: [
      { time: "9:30AM - 12:15PM", subject: "JFS", room: "5104" }
    ],
    Tuesday: [
      { time: "9:30AM - 12:15PM", subject: "CP", room: "5104" }
    ],
    Wednesday: [
      { time: "9:30AM - 12:15PM", subject: "CP", room: "5104" }
    ],
    Thursday: [
      { time: "1:15PM - 3:50PM", subject: "JFS", room: "5104" }
    ],
    Friday: [
      { time: "1:15PM - 3:50PM", subject: "DBMS", room: "5104" }
    ],
    Saturday: [
      { time: "1:15PM - 3:50PM", subject: "CP", room: "5104" }
    ]
  },
  "SKILLNEXT-3": {
    Monday: [
      { time: "1:15PM - 3:50PM", subject: "CP", room: "5102" }
    ],
    Tuesday: [
      { time: "1:15PM - 3:50PM", subject: "JFS", room: "5102" }
    ],
    Wednesday: [
      { time: "1:15PM - 3:50PM", subject: "DBMS", room: "5102" }
    ],
    Thursday: [
      { time: "9:30AM - 12:15PM", subject: "CP", room: "5102" }
    ],
    Friday: [
      { time: "9:30AM - 12:15PM", subject: "JFS", room: "5102" }
    ],
    Saturday: [
      { time: "9:30AM - 12:15PM", subject: "CP", room: "5102" }
    ]
  },
  "SKILLBRIDGE-1": {
    Monday: [
      { time: "9:30AM - 12:15PM", subject: "CP", room: "5101" }
    ],
    Tuesday: [
      { time: "9:30AM - 12:15PM", subject: "JFS", room: "5101" }
    ],
    Wednesday: [
      { time: "9:30AM - 12:15PM", subject: "CP", room: "5101" }
    ],
    Thursday: [
      { time: "1:15PM - 3:50PM", subject: "CP", room: "5101" }
    ],
    Friday: [
      { time: "1:15PM - 3:50PM", subject: "JFS", room: "5101" }
    ],
    Saturday: [
      { time: "1:15PM - 3:50PM", subject: "DBMS", room: "5101" }
    ]
  },
  "SKILLBRIDGE-2": {
    Monday: [
      { time: "9:30AM - 12:15PM", subject: "CP", room: "5005" }
    ],
    Tuesday: [
      { time: "9:30AM - 12:15PM", subject: "DBMS", room: "5005" }
    ],
    Wednesday: [
      { time: "9:30AM - 12:15PM", subject: "JFS", room: "5005" }
    ],
    Thursday: [
      { time: "1:15PM - 3:50PM", subject: "CP", room: "5005" }
    ],
    Friday: [
      { time: "1:15PM - 3:50PM", subject: "CP", room: "5005" }
    ],
    Saturday: [
      { time: "1:15PM - 3:50PM", subject: "JFS", room: "5005" }
    ]
  },
  "SKILLBRIDGE-3": {
    Monday: [
      { time: "9:30AM - 12:15PM", subject: "JFS", room: "5201" }
    ],
    Tuesday: [
      { time: "9:30AM - 12:15PM", subject: "CP", room: "5201" }
    ],
    Wednesday: [
      { time: "9:30AM - 12:15PM", subject: "CP", room: "5201" }
    ],
    Thursday: [
      { time: "1:15PM - 3:50PM", subject: "JFS", room: "5201" }
    ],
    Friday: [
      { time: "1:15PM - 3:50PM", subject: "DBMS", room: "5201" }
    ],
    Saturday: [
      { time: "1:15PM - 3:50PM", subject: "CP", room: "5201" }
    ]
  },
  "SKILLBRIDGE-4": {
    Monday: [
      { time: "1:15PM - 3:50PM", subject: "JFS", room: "5101" }
    ],
    Tuesday: [
      { time: "1:15PM - 3:50PM", subject: "CP", room: "5101" }
    ],
    Wednesday: [
      { time: "1:15PM - 3:50PM", subject: "CP", room: "5101" }
    ],
    Thursday: [
      { time: "9:30AM - 12:15PM", subject: "JFS", room: "5101" }
    ],
    Friday: [
      { time: "9:30AM - 12:15PM", subject: "CP", room: "5101" }
    ],
    Saturday: [
      { time: "9:30AM - 12:15PM", subject: "DBMS", room: "5101" }
    ]
  },
  "SKILLBRIDGE-5": {
    Monday: [
      { time: "1:15PM - 3:50PM", subject: "CP", room: "5106" }
    ],
    Tuesday: [
      { time: "1:15PM - 3:50PM", subject: "CP", room: "5106" }
    ],
    Wednesday: [
      { time: "1:15PM - 3:50PM", subject: "JFS", room: "5106" }
    ],
    Thursday: [
      { time: "9:30AM - 12:15PM", subject: "CP", room: "5106" }
    ],
    Friday: [
      { time: "9:30AM - 12:15PM", subject: "DBMS", room: "5106" }
    ],
    Saturday: [
      { time: "9:30AM - 12:15PM", subject: "JFS", room: "5106" }
    ]
  }

};


function renderTodayTimetable() {
  const container = document.getElementById("timetableContainer");
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const studentDataRaw = localStorage.getItem("profileData");
  let batch = "";
  if (studentDataRaw) {
    try {
      const studentData = JSON.parse(studentDataRaw);
      batch = studentData.batch || "";
    } catch (e) {
      console.warn("Failed to parse facultyData from localStorage.");
    }
  }
  console.log(batch, today);

  const todaySchedule = (batchWiseTimetable[batch] && batchWiseTimetable[batch][today]) || [];

  if (todaySchedule.length === 0) {
    container.innerHTML = '<p class="no-classes">🎉 No classes scheduled for today!</p>';
    return;
  }

  container.innerHTML = todaySchedule.map(slot => `
      <div class="period">
        <div class="left">
          <span class="material-icons-sharp">schedule</span>
          <div class="info">
            <div class="subject">${slot.subject}</div>
            <div class="room">Room: ${slot.room}</div>
          </div>
        </div>
        <div class="time">${slot.time}</div>
      </div>
    `).join("");
}

document.addEventListener("DOMContentLoaded", renderTodayTimetable);

function logout() {
  localStorage.clear();
  window.location.href = '/';
}

