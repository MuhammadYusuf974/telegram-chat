const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Static fayllar
app.use(express.static(path.join(__dirname, 'public')));

let users = [];
let messages = {};

// ========== SOCKET ==========
io.on('connection', (socket) => {
  console.log('✅ Yangi user ulandi:', socket.id);

  // 🔥 REGISTER (TO‘G‘RILANGAN)
  socket.on('register', (user) => {
    console.log('🔥 REGISTER KELDI:', user);

    const phoneRegex = /^[0-9]+$/;

    if (!phoneRegex.test(user.phone)) {
      socket.emit('error_message', '❌ Telefon faqat raqam bo‘lishi kerak');
      return;
    }

    if (user.phone.length < 9) {
      socket.emit('error_message', '❌ Telefon juda qisqa');
      return;
    }

    user.socketId = socket.id;
    user.avatar = user.firstName[0].toUpperCase();

    users.push(user);

    console.log('👤 USER QO‘SHILDI:', user.firstName, user.phone);

    io.emit('users_updated', users);
  });

  // Xabar olish
  socket.on('get_messages', ({ receiverId }, callback) => {
    const key = [socket.id, receiverId].sort().join('-');
    callback(messages[key] || []);
  });

  // Xabar yuborish
  socket.on('send_message', (data) => {
    const key = [socket.id, data.receiverId].sort().join('-');

    const message = {
      senderId: socket.id,
      text: data.text,
      time: new Date().toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    if (!messages[key]) messages[key] = [];
    messages[key].push(message);

    console.log('💬 XABAR:', message.text);

    io.to(data.receiverId).emit('receive_message', message);
    socket.emit('message_sent');
  });

  // Disconnect
  socket.on('disconnect', () => {
    users = users.filter(u => u.socketId !== socket.id);
    io.emit('users_updated', users);
    console.log('❌ User chiqdi:', socket.id);
  });
});

// ========== SERVER ==========
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 http://localhost:${PORT}`);
});