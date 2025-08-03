const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: '*' }
});

app.use(express.json());
app.use('/api/auth', authRoutes);


app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

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

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(5000, () => {
      console.log('Server running on port 5000');
    });
  })
  .catch((err) => console.error(err));
