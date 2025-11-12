require('dotenv').config();
const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets/socket');
const authRoutes = require('./routes/auth');
const friendsRoutes = require('./routes/friends');
const groupsRoutes = require('./routes/groups');
const chatRoutes = require('./routes/chat');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
app.use(cors({
  origin: "http://localhost:5173", // اسمح للـ frontend ده بس
  credentials: true                // لو هتبعت cookies أو tokens
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 8080;

// DB
connectDB().then(()=> {
  server.listen(PORT, ()=> console.log('Server running on port', PORT));
}).catch(err => {
  console.error('DB connection error:', err);
});

// init socket.io
initSocket(server);


