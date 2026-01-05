const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
require('dotenv').config();

const connectDB = require('./config/database');
const { initializeSocket } = require('./config/socket');
const { createGraphQLServer } = require('./graphql/server');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const noteRoutes = require('./routes/notes');
const taskRoutes = require('./routes/tasks');
const fileRoutes = require('./routes/files');
const notificationRoutes = require('./routes/notifications');
const userPreferenceRoutes = require('./routes/userPreferences');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Initialize Socket.io
const io = initializeSocket(server);

// Make io available to routes
app.set('io', io);

// Basic middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://cdn.socket.io"
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve static files for the test client
app.use(express.static('public'));

// Initialize GraphQL Server
const graphqlServer = createGraphQLServer();

// Apply GraphQL middleware to Express app
const startGraphQLServer = async () => {
  await graphqlServer.start();
  graphqlServer.applyMiddleware({ 
    app, 
    path: '/graphql',
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    }
  });
  
  console.log(`🚀 GraphQL Server ready at http://localhost:${PORT}${graphqlServer.graphqlPath}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🎮 GraphQL Playground available at http://localhost:${PORT}${graphqlServer.graphqlPath}`);
  }
};

// Start GraphQL server
startGraphQLServer().catch(error => {
  console.error('Failed to start GraphQL server:', error);
});

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/notes', noteRoutes);
app.use('/tasks', taskRoutes);
app.use('/files', fileRoutes);
app.use('/notifications', notificationRoutes);
app.use('/user/preferences', userPreferenceRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Productivity Suite API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Basic 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      timestamp: new Date().toISOString()
    }
  });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong!',
      timestamp: new Date().toISOString()
    }
  });
});

// Start server
if (require.main === module) {
  const startServer = async () => {
    try {
      server.listen(PORT, () => {
        console.log(`🚀 Productivity Suite API running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔌 Socket.io server initialized`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
}

module.exports = app;