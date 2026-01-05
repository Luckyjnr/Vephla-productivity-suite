const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
require('dotenv').config();

const connectDB = require('./config/database');
const { initializeSocket } = require('./config/socket');
const { createGraphQLServer } = require('./graphql/server');
const { sanitizeInput, setSecurityHeaders, validateContentType } = require('./middleware/sanitization');
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

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.',
      timestamp: new Date().toISOString()
    }
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Apply general rate limiting to all routes
app.use(limiter);

// Security and sanitization middleware
app.use(setSecurityHeaders);
app.use(validateContentType);
app.use(sanitizeInput);

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

  // Add 404 handler AFTER GraphQL middleware is applied
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
};

// Routes
app.use('/auth', authLimiter, authRoutes);
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

// Start server
if (require.main === module) {
  const startServer = async () => {
    try {
      // Wait for GraphQL server to be ready before starting Express server
      await startGraphQLServer();
      
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