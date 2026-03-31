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

io.on('connection', (socket) => {
  console.log('✅ Yangi user ulandi:', socket.id);

  socket.on('register', (user) => {
    console.log('🔥 REGISTER KELDI:', user);

    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{9,}$/;
    
    if (!phoneRegex.test(user.phone)) {
      socket.emit('error_message', '❌ Telefon raqam noto\'g\'ri');
      return;
    }

    user.phone = user.phone.replace(/\s/g, '');
    user.socketId = socket.id;
    user.avatar = user.firstName[0].toUpperCase();
    
    const existingUser = users.findIndex(u => u.phone === user.phone);
    
    if (existingUser !== -1) {
      users[existingUser] = { ...users[existingUser], ...user };
      console.log('👤 MAVJUD USER:', user.firstName);
    } else {
      users.push(user);
      console.log('👤 YANGI USER:', user.firstName);
    }
    
    io.emit('users_updated', users);
    socket.emit('register_success', { message: 'OK' });
  });

  socket.on('get_messages', ({ receiverId }, callback) => {
    const key = [socket.id, receiverId].sort().join('-');
    callback(messages[key] || []);
  });

  socket.on('send_message', (data) => {
    const key = [socket.id, data.receiverId].sort().join('-');
    
    const message = {
      senderId: socket.id,
      text: data.text,
      time: new Date().toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: Date.now()
    };
    
    if (!messages[key]) messages[key] = [];
    messages[key].push(message);
    
    console.log(`💬 Xabar: ${data.text}`);
    
    io.to(data.receiverId).emit('receive_message', message);
    socket.emit('message_sent', message);
  });

  socket.on('disconnect', () => {
    users = users.filter(u => u.socketId !== socket.id);
    io.emit('users_updated', users);
    console.log('❌ User chiqdi:', socket.id);
  });
});

app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    users: users.length,
    messages: Object.keys(messages).reduce((sum, key) => sum + messages[key].length, 0)
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`
  🚀 SERVER ISHGA TUSHDI!
  📡 PORT: ${PORT}
  🌐 LOKAL: http://localhost:${PORT}
  📱 TELEFON: http://[KOMPYUTER_IP]:${PORT}
  `);
});