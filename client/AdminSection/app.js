  const backendUrl = "https://iareattendancemgmt.onrender.com";
  function showSpinner() {
  document.getElementById("spinnerOverlay").style.display = "flex";
}
function hideSpinner() {
  document.getElementById("spinnerOverlay").style.display = "none";
}

function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "error" : ""}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function getFormattedDateDDMMYYYY() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}


  document.addEventListener("DOMContentLoaded", async () => {
    const sideMenu = document.querySelector("aside");
    const profileBtn = document.querySelector("#profile-btn");

    const adminId = localStorage.getItem("adminId");
    if (!adminId) {
      window.location.href = "/";
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/admin/admin?adminId=${adminId}`);
      const profile = await res.json();

      document.getElementById("adminName").textContent = profile.name || "N/A";
      document.getElementById("adminId").textContent = profile.adminId || "N/A";
      document.getElementById("adminEmail").textContent = profile.email || "N/A";

      localStorage.setItem("adminDetails", JSON.stringify(profile));
    } catch (err) {
      console.error("Error loading admin profile:", err);
      document.getElementById("adminName").textContent = "Unable to load";
    }

    // Sidebar toggle
    profileBtn?.addEventListener("click", () => {
      sideMenu.classList.toggle("active");
    });

    // Navigation
    document.getElementById("logoutBtn")?.addEventListener("click", logout);
    document.getElementById("manageStudents")?.addEventListener("click", () => {
      window.location.href = "manageStudent/manage-student.html";
    });
    document.getElementById("manageFaculty")?.addEventListener("click", () => {
      window.location.href = "manageFaculty/manage-faculty.html";
    });
    document.getElementById("updateAttendance")?.addEventListener("click", () => {
      window.open("update-attendance.html");
    });
    document.getElementById("batchwiseReport")?.addEventListener("click", () => {
      window.location.href = "batch.html";
    });
    document.getElementById("postAnnouncements").addEventListener("click", () => {
      window.location.href = "postAnnouncements/post-annoucement.html";
    });

    // Report downloads
    document.getElementById("downloadExcel")?.addEventListener("click", downloadAttendanceExcel);
    document.getElementById("downloadPDF")?.addEventListener("click", downloadAttendancePDF);

    // Course-specific Excel download
    document.getElementById("course-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const batch = document.querySelector('select[name="batch"]').value;
      if (!batch) return alert("Please select a batch.");

      const collectionName = `attendance_${batch.toLowerCase()}`;
      localStorage.setItem("selectedbatch", JSON.stringify(batch));

      const date = new Date().toISOString().slice(0, 10);
      const url = `${backendUrl}/api/admin/attendance/complete-report/${collectionName}`;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to download file.");

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = `attendance-${date}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);

        window.location.href = "index.html";
      } catch (err) {
        console.error("Error downloading Excel:", err);
        alert("Failed to download attendance report.");
      }
    });
  });

  // Sticky header and sidebar
  window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    const sideMenu = document.querySelector("aside");
    if (sideMenu) sideMenu.classList.remove("active");
    header?.classList.toggle("active", window.scrollY > 0);
  });

  

  // Batch list
  const batches = [
    "skillup batch-1", "skillup batch-2", "skillup batch-3",
    "skillnext batch-1", "skillnext batch-2", "skillnext batch-3",
    "skillbridge batch-1", "skillbridge batch-2", "skillbridge batch-3",
    "skillbridge batch-4", "skillbridge batch-5"
  ];
async function downloadAttendanceExcel() {
  const date = new Date().toISOString().slice(0, 10); // ✅ For backend
  const displayDate = date.split("-").reverse().join("-"); // ✅ For filename

  const params = new URLSearchParams();
  batches.forEach(batch => params.append("batch", batch));
  params.append("date", date); // Send ISO format

  try {
    showSpinner();
    const response = await fetch(`${backendUrl}/api/admin/attendance-report?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch Excel report.");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `attendanceSummary_${displayDate}.xlsx`; // ✅ Display format
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    showToast("✅ Excel report downloaded!");
  } catch (err) {
    console.error("Excel download failed:", err);
    showToast("❌ Failed to download Excel report.", true);
  } finally {
    hideSpinner();
  }
}

async function downloadAttendancePDF() {
  const date = new Date().toISOString().slice(0, 10); // ✅ For backend
  const displayDate = date.split("-").reverse().join("-"); // ✅ For filename

  const params = new URLSearchParams();
  batches.forEach(batch => params.append("batch", batch));
  params.append("date", date);

  try {
    showSpinner();
    const response = await fetch(`${backendUrl}/api/admin/attendance-report-pdf?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch PDF report.");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const disposition = response.headers.get('Content-Disposition');
    let filename = `attendanceSummary_${displayDate}.pdf`;

    if (disposition && disposition.indexOf("filename=") !== -1) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match?.length > 1) filename = match[1];
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    showToast("✅ PDF report downloaded!");
  } catch (err) {
    console.error("PDF download failed:", err);
    showToast("❌ Failed to download PDF report.", true);
  } finally {
    hideSpinner();
  }
}




// Logout
  function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "../";
  }