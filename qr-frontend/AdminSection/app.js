const sideMenu = document.querySelector("aside");
const profileBtn = document.querySelector("#profile-btn");
const themeToggler = document.querySelector(".theme-toggler");
const nextDay = document.getElementById('nextDay');
const prevDay = document.getElementById('prevDay');
const backendUrl = "https://iareattendancemgmt.onrender.com";
// profileBtn.onclick = function () {
//   sideMenu.classList.toggle('active');
// }
window.onscroll = () => {
  sideMenu.classList.remove('active');
  if (window.scrollY > 0) { document.querySelector('header').classList.add('active'); }
  else { document.querySelector('header').classList.remove('active'); }
}
document.getElementById('course-form').addEventListener('submit', async function (e) {
  e.preventDefault(); // Stop form from submitting

  const batch = document.querySelector('select[name="batch"]').value;
   
  const collectionName = `attendance_${batch.toLowerCase()}`;

  // Save to localStorage
  localStorage.setItem('selectedbatch', JSON.stringify(batch));

  const date = new Date().toISOString().slice(0, 10); // today by default
  const url = `${backendUrl}/api/admin/attendance/report/${collectionName}`;


  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to download file.");
      }
      return response.blob();
    })
   .then(blob => {
  const a = document.createElement('a');
  const objectUrl = window.URL.createObjectURL(blob);
  a.href = objectUrl;
  a.download = `attendance-${date}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(objectUrl);

  // Only redirect after download starts
  window.location.href = 'index.html';
})


  // Redirect to QR scan page
});





function logout() {
  // Optionally, clear any stored user data (e.g., localStorage/sessionStorage)
  localStorage.clear(); // if you use localStorage to store user info
  sessionStorage.clear(); // if you use sessionStorage

  // Redirect to login page
  window.location.href = "/";
}

