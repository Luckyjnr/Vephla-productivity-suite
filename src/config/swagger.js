const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Productivity Suite API',
      version: '1.0.0',
      description: `
        A comprehensive backend system for productivity management with authentication, 
        CRUD operations, real-time communication, and dual API support (REST + GraphQL).
        
        ## Features
        - 🔐 JWT Authentication & Role-Based Access Control
        - 📝 Notes Management with tagging and search
        - ✅ Task Management with status tracking
        - 📁 File Upload/Download with metadata
        - 💬 Real-time Chat with Socket.io
        - 🔔 Real-time Notifications
        - 🚀 GraphQL API alongside REST
        - 🛡️ Comprehensive Security & Validation
        
        ## Authentication
        Most endpoints require authentication. Include the JWT token in the Authorization header:
        \`Authorization: Bearer <your-jwt-token>\`
        
        ## Rate Limiting
        - General endpoints: 100 requests per 15 minutes
        - Authentication endpoints: 5 requests per 15 minutes
      `,
      contact: {
        name: 'API Support',
        email: 'support@productivity-suite.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://your-production-url.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
              example: '507f1f77bcf86cd799439011'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com'
            },
            firstName: {
              type: 'string',
              description: 'User first name',
              example: 'John'
            },
            lastName: {
              type: 'string',
              description: 'User last name',
              example: 'Doe'
            },
            role: {
              type: 'string',
              enum: ['standard', 'admin'],
              description: 'User role',
              example: 'standard'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            lastLoginAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp'
            }
          }
        },
        Note: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Note ID',
              example: '507f1f77bcf86cd799439011'
            },
            title: {
              type: 'string',
              description: 'Note title',
              example: 'Meeting Notes'
            },
            content: {
              type: 'string',
              description: 'Note content',
              example: 'Discussed project timeline and deliverables'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Note tags',
              example: ['work', 'meeting', 'important']
            },
            isPrivate: {
              type: 'boolean',
              description: 'Whether note is private',
              example: true
            },
            userId: {
              type: 'string',
              description: 'Owner user ID',
              example: '507f1f77bcf86cd799439011'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Task: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Task ID',
              example: '507f1f77bcf86cd799439011'
            },
            title: {
              type: 'string',
              description: 'Task title',
              example: 'Complete project documentation'
            },
            description: {
              type: 'string',
              description: 'Task description',
              example: 'Write comprehensive API documentation'
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
              description: 'Task status',
              example: 'pending'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Task priority',
              example: 'high'
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Task due date',
              example: '2024-12-31T23:59:59.000Z'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Task completion timestamp'
            },
            userId: {
              type: 'string',
              description: 'Owner user ID',
              example: '507f1f77bcf86cd799439011'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        File: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'File ID',
              example: '507f1f77bcf86cd799439011'
            },
            filename: {
              type: 'string',
              description: 'Generated filename',
              example: 'file_1640995200000_document.pdf'
            },
            originalName: {
              type: 'string',
              description: 'Original filename',
              example: 'document.pdf'
            },
            mimeType: {
              type: 'string',
              description: 'File MIME type',
              example: 'application/pdf'
            },
            size: {
              type: 'number',
              description: 'File size in bytes',
              example: 1048576
            },
            description: {
              type: 'string',
              description: 'File description',
              example: 'Project requirements document'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'File tags',
              example: ['document', 'project']
            },
            userId: {
              type: 'string',
              description: 'Owner user ID',
              example: '507f1f77bcf86cd799439011'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Upload timestamp'
            }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Notification ID',
              example: '507f1f77bcf86cd799439011'
            },
            type: {
              type: 'string',
              enum: ['task_created', 'task_completed', 'note_created', 'system_alert'],
              description: 'Notification type',
              example: 'task_created'
            },
            title: {
              type: 'string',
              description: 'Notification title',
              example: 'New Task Created'
            },
            message: {
              type: 'string',
              description: 'Notification message',
              example: 'You have created a new task: Complete documentation'
            },
            isRead: {
              type: 'boolean',
              description: 'Whether notification is read',
              example: false
            },
            data: {
              type: 'object',
              description: 'Additional notification data',
              example: { taskId: '507f1f77bcf86cd799439011' }
            },
            userId: {
              type: 'string',
              description: 'Recipient user ID',
              example: '507f1f77bcf86cd799439011'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code',
                  example: 'VALIDATION_ERROR'
                },
                message: {
                  type: 'string',
                  description: 'Error message',
                  example: 'Invalid input data'
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object'
                  },
                  description: 'Detailed error information'
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Error timestamp'
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Response timestamp'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Authentication required',
                  timestamp: '2024-01-01T00:00:00.000Z'
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: {
                  code: 'FORBIDDEN',
                  message: 'Insufficient permissions',
                  timestamp: '2024-01-01T00:00:00.000Z'
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: {
                  code: 'NOT_FOUND',
                  message: 'Resource not found',
                  timestamp: '2024-01-01T00:00:00.000Z'
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Invalid input data',
                  details: [
                    {
                      field: 'email',
                      message: 'Invalid email format'
                    }
                  ],
                  timestamp: '2024-01-01T00:00:00.000Z'
                }
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  message: 'Too many requests from this IP, please try again later.',
                  timestamp: '2024-01-01T00:00:00.000Z'
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and registration'
      },
      {
        name: 'Notes',
        description: 'Note management operations'
      },
      {
        name: 'Tasks',
        description: 'Task management operations'
      },
      {
        name: 'Files',
        description: 'File upload and management'
      },
      {
        name: 'Admin',
        description: 'Administrative operations (admin role required)'
      },
      {
        name: 'Notifications',
        description: 'Notification management'
      },
      {
        name: 'User Preferences',
        description: 'User preference management'
      },
      {
        name: 'System',
        description: 'System health and information'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};