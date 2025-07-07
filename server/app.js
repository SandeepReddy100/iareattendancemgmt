const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const studentRoutes = require('./routes/student');
const attendanceRoutes = require('./routes/attendance');
const studentAuthRoutes = require('./routes/studentauth');
const facultyAuth = require('./routes/facultyauth');
const adminAuthRoutes = require('./routes/adminauth');
const adminRoutes = require('./routes/admin');
const facultyRoutes = require('./routes/faculty')
const cors = require('cors');
dotenv.config();
const app = express();

app.use(cors()); 
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

.then(() => console.log('Connected to MongoDB testDb'))
.catch((err) => console.error('MongoDB connection error:', err));


app.use('/api/admin',adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty',facultyRoutes)
app.use('/api/studentlogin', studentAuthRoutes);
app.use('/api/facultylogin', facultyAuth)
app.use('/api/adminlogin', adminAuthRoutes);
app.use('/api/facultyop', attendanceRoutes); 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

