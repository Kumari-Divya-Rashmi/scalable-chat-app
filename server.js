const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const jwt = require('jsonwebtoken'); // ⬅ Add this for JWT

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Secure Socket.IO with CORS and token-based authentication
const io = socketio(server, {
  cors: { origin: 'https://your-frontend-domain.com' } // ⬅ Replace with your domain
});

// ✅ Middleware to authenticate Socket.IO connections
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Token missing'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // ⬅ Secure with .env
    socket.user = decoded; // attach user info
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('✅ Authorized user connected:', socket.id, 'User ID:', socket.user.userId);

  socket.on('joinRoom', ({ room }) => {
    socket.join(room);
    console.log(`${socket.id} joined ${room}`);
  });

  socket.on('chatMessage', ({ room, message }) => {
    io.to(room).emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// ✅ Connect to MongoDB and start the server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(5000, () => {
      console.log('Server running on port 5000');
    });
  })
  .catch((err) => console.error(err));
