// const form = document.getElementById("loginForm");
// const messageBox = document.getElementById("messageBox");
// const signInBtn = document.getElementById("loginBtn");
// const btnText = document.getElementById("btnText");
// const loader = document.getElementById("loader");
// const backendUrl = "https://iareattendancemgmt.onrender.com";

// // Handle background color switching for selected radio label
// const labels = document.querySelectorAll(".role-option");

// function updateActive() {
//   labels.forEach((label) => {
//     const radio = label.querySelector('input[type="radio"]');
//     if (radio.checked) {
//       label.classList.add("active");
//     } else {
//       label.classList.remove("active");
//     }
//   });
// }


// labels.forEach((label) => {
//   label.addEventListener("click", () => {
//     // small delay to wait for radio state change
//     setTimeout(updateActive, 10);
//   });
// });

// // Set initial active state on page load
// updateActive();

// form.addEventListener("submit", async (e) => {
//   e.preventDefault();

//   const emailInput = document.getElementById("email");
//   const passwordInput = document.getElementById("password");
//   const roleInput = document.querySelector('input[name="role"]:checked');

//   const email = emailInput.value.trim();
//   const password = passwordInput.value.trim();
//   const role = roleInput ? roleInput.value : "";

//   messageBox.classList.remove("show");
//   messageBox.textContent = "";

//   if (!email || !password || !role) {
//     messageBox.textContent = "⚠️ Please fill all fields including your role.";
//     messageBox.className = "message-box show";
//     messageBox.style.color = "red";
//     return;
//   }

//   const endpoint = `${backendUrl}/api/${role}/login`;

//   btnText.textContent = "Signing in...";
//   loader.classList.remove("hidden");
//   signInBtn.disabled = true;

//   try {
//     const response = await fetch(endpoint, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email, password }),
//     });

//     const data = await response.json();

//     if (response.ok) {
//       messageBox.textContent = "Login successful!";
//       messageBox.className = "message-box show";
//       messageBox.style.color = "green";

//       if (role === "student" && data.student?.rollno) {
//         localStorage.setItem("rollno", data.student.rollno);
//         localStorage.setItem("profileData", JSON.stringify(data.student));
//         setTimeout(() => {
//           window.location.href = "../Dashboard/index.html";
//         }, 1500);
//       } else if (role === "faculty") {
//         localStorage.setItem("facultyEmail", email);
//         setTimeout(() => {
//           window.location.href = "../FacultyPage/index.html";
//         }, 1500);
//       } else if (role === "admin") {
//         localStorage.setItem("facultyEmail", email);
//         setTimeout(() => {
//           window.location.href = "../AdminSection/index.html";
//         }, 1500);
//       }

//       setTimeout(() => {
//         messageBox.classList.remove("show");
//       }, 1500);
//     } else {
//       messageBox.textContent = data.message || "Invalid email or password.";
//       messageBox.className = "message-box show";
//       messageBox.style.color = "red";
//       setTimeout(() => messageBox.classList.remove("show"), 3000);
//     }
//   } catch (error) {
//     console.error("Login error:", error);
//     messageBox.textContent = "❌ Server error. Please try again.";
//     messageBox.className = "message-box show";
//     messageBox.style.color = "red";
//     setTimeout(() => messageBox.classList.remove("show"), 3000);
//   } finally {
//     btnText.textContent = "Sign in";
//     loader.classList.add("hidden");
//     signInBtn.disabled = false;
//   }
// });
