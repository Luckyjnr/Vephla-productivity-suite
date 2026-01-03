const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const chatController = require('../controllers/chatController');

/**
 * Socket.io authentication middleware
 * Validates JWT token from socket handshake
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user to socket
    socket.userId = user._id.toString();
    socket.user = user;
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Invalid authentication token'));
  }
};

/**
 * Initialize Socket.io server with Express app
 */
const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Apply authentication middleware
  io.use(authenticateSocket);

  // Connection handling
  io.on('connection', (socket) => {
    console.log(`🔌 User ${socket.user.email} connected (${socket.id})`);
    
    // Join user to their personal room for notifications
    socket.join(`user:${socket.userId}`);
    
    // Initialize chat event handlers
    chatController.initializeHandlers(socket, io);
    
    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.email}:`, error);
    });
  });

  return io;
};

module.exports = {
  initializeSocket,
  authenticateSocket
};