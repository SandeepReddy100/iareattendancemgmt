  const backendUrl = "https://iareattendancemgmt.onrender.com";

  document.getElementById("announcement-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const facultyid = localStorage.getItem("facultyid");
    if (!facultyid) {
      alert("Session expired. Please login again.");
      return window.location.href = "/login.html";
    }

    const title = document.getElementById("title").value.trim();
    const subtitle = document.getElementById("subtitle").value.trim();
    const content = document.getElementById("content").value.trim();

    const checkboxes = document.querySelectorAll(".batch-checkboxes input[type='checkbox']");
    const batches = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value.toLowerCase());
    console.log(batches);

    if (!title || !subtitle || !content) {
      return alert("Please fill in all fields.");
    }

    if (batches.length === 0) {
      return alert("Please select at least one batch.");
    }

    const payload = {
      postedby: facultyid,
      title,
      subtitle,
      content,
      batches
    };

    try {
      const res = await fetch(`${backendUrl}/api/admin/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to post announcement.");

      alert("✅ Announcement posted successfully.");
      document.getElementById("announcement-form").reset();
    } catch (err) {
      console.error("Post failed:", err);
      alert("❌ Failed to post announcement.");
    }
  });
