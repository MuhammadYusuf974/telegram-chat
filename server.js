const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    // Large base64 images can exceed Socket.IO defaults
    maxHttpBufferSize: 15 * 1024 * 1024
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ========== DATA STORAGE ==========
const users = new Map();
const messages = [];
const privateMessages = new Map();

// ========== SOCKET.IO ==========
io.on('connection', (socket) => {
    console.log(`✅ User ulandi: ${socket.id}`);

    socket.on('register', (userData) => {
        users.set(socket.id, {
            ...userData,
            socketId: socket.id,
            avatar: userData.firstName?.charAt(0).toUpperCase() || '?',
            isOnline: true
        });
        
        console.log(`📝 ${userData.firstName} ro'yxatdan o'tdi`);
        socket.emit('register_success');
        io.emit('users_updated', Array.from(users.values()));
    });

    // XABARLARNI OLISH
    socket.on('get_messages', (data, callback) => {
        const { receiverId } = data;

        if (receiverId === "obshiy") {
            const globalMessages = messages.filter(msg => msg.receiverId === "obshiy");
            if (callback) callback(globalMessages);
        } else {
            const senderId = socket.id;
            const key1 = `${senderId}-${receiverId}`;
            const key2 = `${receiverId}-${senderId}`;
            const privateChat = privateMessages.get(key1) || privateMessages.get(key2) || [];
            if (callback) callback(privateChat);
        }
    });

    // XABAR JO'NATISH
    socket.on('send_message', (data, callback) => {
        const { text, imageData, receiverId, timestamp, isObshiy } = data;
        const sender = users.get(socket.id);

        if (!sender) {
            if (callback) callback({ success: false, error: 'User topilmadi' });
            return;
        }

        const cleanText = typeof text === 'string' ? text.trim() : '';
        const cleanImageData = typeof imageData === 'string' ? imageData : '';
        const hasImage = cleanImageData.startsWith('data:image/');

        if (!cleanText && !hasImage) {
            if (callback) callback({ success: false, error: 'Xabar bo\'sh bo\'lmasin' });
            return;
        }

        const message = {
            senderId: socket.id,
            senderName: `${sender.firstName} ${sender.lastName}`,
            text: cleanText,
            imageData: hasImage ? cleanImageData : '',
            timestamp: new Date().toISOString(),
            receiverId: isObshiy ? "obshiy" : receiverId
        };

        if (isObshiy || receiverId === "obshiy") {
            messages.push(message);
            console.log(`🌍 GLOBAL: ${sender.firstName}: ${hasImage ? '[image]' : cleanText}`);
            io.emit('receive_message', message);
            io.emit('message_sent');
        } else {
            const key = `${socket.id}-${receiverId}`;
            if (!privateMessages.has(key)) {
                privateMessages.set(key, []);
            }
            privateMessages.get(key).push(message);
            console.log(`💬 PRIVATE: ${sender.firstName} -> ${users.get(receiverId)?.firstName}: ${hasImage ? '[image]' : cleanText}`);
            
            socket.emit('receive_message', message);
            io.to(receiverId).emit('receive_message', message);
            io.to(receiverId).emit('message_sent');
        }

        if (callback) callback({ success: true });
    });

    // TYPING
    socket.on('typing', (data) => {
        const { receiverId } = data;
        const sender = users.get(socket.id);

        if (receiverId === "obshiy") {
            io.emit('user_typing', { senderId: socket.id });
        } else {
            io.to(receiverId).emit('user_typing', { senderId: socket.id });
        }
    });

    socket.on('stop_typing', (data) => {
        // Handle stop typing
    });

    // DISCONNECT
    socket.on('disconnect', () => {
        const user = users.get(socket.id);
        if (user) {
            console.log(`❌ ${user.firstName} chiqdi`);
            users.delete(socket.id);
            io.emit('users_updated', Array.from(users.values()));
        }
    });
});

// ========== HTTP SERVER ==========
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server ${PORT}-portda ishlamoqda...`);
    console.log(`📍 http://localhost:${PORT}`);
});
