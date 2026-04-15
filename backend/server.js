require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/documents', require('./routes/documents'));
app.use('/api/auth', require('./routes/auth'));

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

const documentRooms = new Map();

io.on('connection', (socket) => {
    socket.on('join-document', ({ documentId, username }) => {
        socket.join(documentId);
        socket.data.username = username;
        socket.data.documentId = documentId;

        if (!documentRooms.has(documentId)) {
            documentRooms.set(documentId, new Set());
        }
        documentRooms.get(documentId).add(username);
        
        io.to(documentId).emit('active-users', Array.from(documentRooms.get(documentId)));
    });

    socket.on('disconnect', () => {
        const { documentId, username } = socket.data;
        if (documentId && documentRooms.has(documentId)) {
            documentRooms.get(documentId).delete(username);
            io.to(documentId).emit('active-users', Array.from(documentRooms.get(documentId)));
        }
    });

    socket.on('leave-document', ({ documentId, username }) => {
        socket.leave(documentId);
        if (documentRooms.has(documentId)) {
            documentRooms.get(documentId).delete(username);
            io.to(documentId).emit('active-users', Array.from(documentRooms.get(documentId)));
        }
    });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = { app, server };
