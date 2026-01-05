const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const winston = require('winston');
require('dotenv').config();

const connectDB = require('./config/database');
const { initializeSocket } = require('./config/socket');
const { createGraphQLServer } = require('./graphql/server');
const { sanitizeInput, setSecurityHeaders, validateContentType } = require('./middleware/sanitization');
const { swaggerUi, specs } = require('./config/swagger');
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

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'productivity-suite' },
  transports: [
    new winston.transports.File({ 
      filename: process.env.LOG_FILE_ERROR || 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: process.env.LOG_FILE_COMBINED || 'logs/combined.log' 
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

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

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Serve static files for the test client
app.use(express.static('public'));

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Productivity Suite API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
}));

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
  
  logger.info(`GraphQL Server ready at http://localhost:${PORT}${graphqlServer.graphqlPath}`);
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`GraphQL Playground available at http://localhost:${PORT}${graphqlServer.graphqlPath}`);
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
    logger.error('Unhandled error:', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip
    });
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
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy and running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: Productivity Suite API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-01-01T00:00:00.000Z
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                   example: 3600
 *                 environment:
 *                   type: string
 *                   example: development
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Productivity Suite API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
if (require.main === module) {
  const startServer = async () => {
    try {
      // Wait for GraphQL server to be ready before starting Express server
      await startGraphQLServer();
      
      server.listen(PORT, () => {
        logger.info(`Productivity Suite API running on port ${PORT}`);
        logger.info(`Health check: http://localhost:${PORT}/health`);
        logger.info(`Socket.io server initialized`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
}

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      logger.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    logger.info('HTTP server closed');
    
    // Close database connection
    const mongoose = require('mongoose');
    mongoose.connection.close(() => {
      logger.info('MongoDB connection closed');
      logger.info('Graceful shutdown completed');
      process.exit(0);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

module.exports = app;
module.exports.logger = logger;