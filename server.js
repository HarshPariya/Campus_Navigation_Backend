require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const authGoogle = require('./routes/authGoogle')

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim());

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://hpariya195:Harsh%402005@cluster0.audzrvd.mongodb.net/campus_navigation';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/events', require('./routes/events'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/users', require('./routes/users'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/auth', authGoogle);

// New feature routes
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/lost-found', require('./routes/lostfound'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/study-groups', require('./routes/studygroups'));
app.use('/api/cafeteria', require('./routes/cafeteria'));
app.use('/api/transportation', require('./routes/transportation'));
app.use('/api/qr-codes', require('./routes/qrcodes'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/directory', require('./routes/directory'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check

app.get('/', (req, res) => {
  res.send('API is running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

