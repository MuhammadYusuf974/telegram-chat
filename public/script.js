// ========== DATA STORAGE ==========
let chats = JSON.parse(localStorage.getItem('telegramChats')) || [
    {
        id: 1,
        name: 'Muhammad',
        avatar: 'M',
        messages: [
            { text: 'Assalom aleykum!', incoming: true, time: '10:20' },
            { text: 'Valeykum assalom!', incoming: false, time: '10:21' },
            { text: 'Qanday xol?', incoming: true, time: '10:22' },
            { text: 'Jaxshani shukiriyalar!', incoming: false, time: '10:23' }
        ]
    },
    {
        id: 2,
        name: 'Dostlar Guruhi',
        avatar: 'D',
        messages: [
            { text: 'Bugun kim bor?', incoming: true, time: '9:45' },
            { text: 'Men bor!', incoming: false, time: '9:46' }
        ]
    },
    {
        id: 3,
        name: 'Ota',
        avatar: 'O',
        messages: [
            { text: 'Qanday kunin?', incoming: true, time: '8:30' }
        ]
    }
];

let selectedChatId = null;

// ========== DOM ELEMENTS ==========
const chatList = document.getElementById('chatList');
const chatWindow = document.getElementById('chatWindow');
const searchInput = document.getElementById('searchInput');
const newChatBtn = document.getElementById('newChatBtn');
const newChatModal = document.getElementById('newChatModal');
const newChatName = document.getElementById('newChatName');
const saveChatBtn = document.getElementById('saveChatBtn');
const cancelBtn = document.getElementById('cancelBtn');

// ========== RENDER FUNCTIONS ==========

function saveChats() {
    localStorage.setItem('telegramChats', JSON.stringify(chats));
}

function renderChatList(filter = '') {
    chatList.innerHTML = '';
    
    const filtered = chats.filter(chat =>
        chat.name.toLowerCase().includes(filter.toLowerCase())
    );

    filtered.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === selectedChatId ? 'active' : ''}`;
        
        const lastMessage = chat.messages[chat.messages.length - 1];
        const lastMessageText = lastMessage ? lastMessage.text : 'Hali xabar yoq';
        const lastTime = lastMessage ? lastMessage.time : '';

        chatItem.innerHTML = `
            <div class="chat-avatar">${chat.avatar}</div>
            <div class="chat-info">
                <h3>${chat.name}</h3>
                <p>${lastMessageText}</p>
            </div>
            <div class="chat-time">${lastTime}</div>
            <button class="delete-btn" data-id="${chat.id}">✕</button>
        `;

        chatItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                selectChat(chat.id);
            }
        });

        chatItem.querySelector('.delete-btn').addEventListener('click', () => {
            deleteChat(chat.id);
        });

        chatList.appendChild(chatItem);
    });
}

function renderChatWindow(chatId) {
    const chat = chats.find(c => c.id === chatId);
    
    if (!chat) {
        chatWindow.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💬</div>
                <h2>Salom!</h2>
                <p>Xabar yuborish uchun chatni tanlang</p>
            </div>
        `;
        return;
    }

    chatWindow.innerHTML = `
        <div class="chat-header">
            <div class="header-left">
                <div class="chat-avatar-header">${chat.avatar}</div>
                <div class="header-info">
                    <h2>${chat.name}</h2>
                    <p>Online</p>
                </div>
            </div>
            <div class="header-actions">
                <button title="Qo'ng'iroq">📞</button>
                <button title="Video qo'ng'iroq">📹</button>
            </div>
        </div>

        <div class="messages" id="messagesContainer">
            ${chat.messages.map(msg => `
                <div class="message ${msg.incoming ? 'incoming' : 'outgoing'}">
                    <div class="message-bubble">${escapeHtml(msg.text)}</div>
                    <div class="message-timestamp">${msg.time}</div>
                </div>
            `).join('')}
        </div>

        <div class="input-area">
            <input type="text" id="messageInput" placeholder="Xabar yozing...">
            <button id="sendBtn">➤</button>
        </div>
    `;

    // Scroll to bottom
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Message input handler
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    const sendMessage = () => {
        const text = messageInput.value.trim();
        if (text) {
            const time = new Date().toLocaleTimeString('uz-UZ', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            chat.messages.push({
                text: text,
                incoming: false,
                time: time
            });

            saveChats();
            messageInput.value = '';
            renderChatWindow(chatId);
            renderChatList(searchInput.value);
        }
    };

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    messageInput.focus();
}

function selectChat(chatId) {
    selectedChatId = chatId;
    renderChatList(searchInput.value);
    renderChatWindow(chatId);
}

function deleteChat(chatId) {
    if (confirm('Shu chatni o\'chirish uchun ishonchingiz komilmi?')) {
        chats = chats.filter(c => c.id !== chatId);
        saveChats();
        
        if (selectedChatId === chatId) {
            selectedChatId = null;
        }
        
        renderChatList(searchInput.value);
        renderChatWindow(selectedChatId);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== EVENT LISTENERS ==========

searchInput.addEventListener('input', (e) => {
    renderChatList(e.target.value);
});

newChatBtn.addEventListener('click', () => {
    newChatModal.classList.add('active');
    newChatName.focus();
});

cancelBtn.addEventListener('click', () => {
    newChatModal.classList.remove('active');
    newChatName.value = '';
});

saveChatBtn.addEventListener('click', () => {
    const name = newChatName.value.trim();
    if (name) {
        const avatar = name.charAt(0).toUpperCase();
        const newChat = {
            id: Math.max(...chats.map(c => c.id), 0) + 1,
            name: name,
            avatar: avatar,
            messages: []
        };
        
        chats.push(newChat);
        saveChats();
        renderChatList(searchInput.value);
        
        newChatModal.classList.remove('active');
        newChatName.value = '';
    }
});

newChatName.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        saveChatBtn.click();
    }
});

// Close modal when clicking outside
newChatModal.addEventListener('click', (e) => {
    if (e.target === newChatModal) {
        newChatModal.classList.remove('active');
        newChatName.value = '';
    }
});

// ========== INITIALIZATION ==========
renderChatList();
if (chats.length > 0) {
    selectChat(chats[0].id);
}

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// ========== DATABASE ==========
let users = new Map(); // {socketId: {id, firstName, lastName, phone, avatar, online}}
let messages = []; // {senderId, senderName, receiverId, text, time}

// ========== REST API ==========

// Foydalanuvchilar ro'yxati
app.get('/api/users', (req, res) => {
    const usersList = Array.from(users.values()).filter(u => u.phone); // faqat ro'yxatdan o'tganlar
    res.json(usersList);
});

// Xabarlar oqimi
app.get('/api/messages/:userId1/:userId2', (req, res) => {
    const { userId1, userId2 } = req.params;
    const filtered = messages.filter(msg => 
        (msg.senderId === userId1 && msg.receiverId === userId2) ||
        (msg.senderId === userId2 && msg.receiverId === userId1)
    );
    res.json(filtered);
});

// ========== SOCKET.IO EVENTS ==========

io.on('connection', (socket) => {
    console.log(`🟢 Yangi user kirdi: ${socket.id}`);

    // User ro'yxatdan o'tish
    socket.on('register', (userData) => {
        users.set(socket.id, {
            socketId: socket.id,
            id: socket.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            avatar: userData.firstName.charAt(0).toUpperCase(),
            online: true
        });

        console.log(`✅ User ro'yxatdan o'tdi: ${userData.firstName} ${userData.lastName}`);

        // Barcha clientlarga yangi user haqida xabar
        io.emit('users_updated', Array.from(users.values()));
    });

    // Xabar yuborish
    socket.on('send_message', (data) => {
        const sender = users.get(socket.id);
        
        if (sender) {
            const message = {
                id: Date.now(),
                senderId: socket.id,
                senderName: `${sender.firstName} ${sender.lastName}`,
                receiverId: data.receiverId,
                text: data.text,
                time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
            };

            messages.push(message);

            // Receiver va sender ga xabar jo'natish
            io.to(data.receiverId).emit('receive_message', message);
            socket.emit('message_sent', message);

            console.log(`💬 Xabar: ${sender.firstName} → ${data.receiverId}`);
        }
    });

    // Xabarlarni olish
    socket.on('get_messages', (data, callback) => {
        const filtered = messages.filter(msg =>
            (msg.senderId === socket.id && msg.receiverId === data.receiverId) ||
            (msg.senderId === data.receiverId && msg.receiverId === socket.id)
        );
        callback(filtered);
    });

    // User chiqdi
    socket.on('disconnect', () => {
        users.delete(socket.id);
        console.log(`🔴 User chiqdi: ${socket.id}`);
        io.emit('users_updated', Array.from(users.values()));
    });

    // Typing indicator
    socket.on('typing', (data) => {
        io.to(data.receiverId).emit('user_typing', {
            senderId: socket.id,
            senderName: data.senderName
        });
    });

    socket.on('stop_typing', (data) => {
        io.to(data.receiverId).emit('user_stop_typing', { senderId: socket.id });
    });
});

// ========== SERVER START ==========
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portda ishlamoqda...`);
});