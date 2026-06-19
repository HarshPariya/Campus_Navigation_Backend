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
let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_navigation';

const connectWithRetry = async (retries = 3, delay = 5000) => {
  // Use in-memory MongoDB if no valid cloud cluster is provided in production
  if (mongoUri.includes('cluster0.audzrvd.mongodb.net') || (process.env.NODE_ENV === 'production' && mongoUri.includes('localhost'))) {
    console.log('No valid MONGODB_URI provided for production. Starting in-memory MongoDB...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      console.log('In-memory MongoDB started at', mongoUri);
      
      // Auto-seed in memory DB
      setTimeout(() => {
        const { exec } = require('child_process');
        console.log('Running seeder for in-memory database...');
        exec('node seed.js', { env: { ...process.env, MONGODB_URI: mongoUri } }, (error, stdout, stderr) => {
          if (error) console.error('Seed error:', error.message);
          else console.log('In-memory DB seeded successfully');
        });
      }, 3000);
    } catch (err) {
      console.error('Failed to start in-memory DB:', err);
    }
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4, // Force IPv4 to avoid DNS issues
      });
      console.log('MongoDB Connected');
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt < retries) {
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        console.error('All MongoDB connection attempts failed. Server running without DB.');
      }
    }
  }
};

connectWithRetry();

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

