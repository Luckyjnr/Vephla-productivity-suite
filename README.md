# Full-Stack Productivity Suite

A comprehensive backend system demonstrating mastery of Node.js, Express.js, MongoDB, and modern API development techniques. This production-ready productivity platform integrates authentication, CRUD operations, real-time communication, role-based access control, and both RESTful and GraphQL APIs.

## 🎯 Project Overview

The Full-Stack Productivity Suite is designed to provide a complete productivity platform with the following core features:

- **User Authentication & Authorization**: Secure JWT-based authentication with role-based access control
- **Task Management**: Create, update, track, and organize tasks with status management
- **Note Taking**: Personal note creation with tagging, search, and organization capabilities
- **File Storage**: Upload, manage, and organize files with metadata support
- **Real-time Communication**: Live chat functionality with room-based messaging
- **Notification System**: Real-time notifications for system events and user activities
- **Dual API Support**: Both REST and GraphQL APIs for flexible data access

## 🛠 Tech Stack

### Backend Core
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for data persistence
- **Mongoose** - MongoDB object modeling library

### Authentication & Security
- **JSON Web Tokens (JWT)** - Secure authentication tokens
- **bcrypt** - Password hashing and verification
- **Helmet** - Security headers middleware
- **CORS** - Cross-origin resource sharing configuration

### Real-time Features
- **Socket.io** - WebSocket library for real-time communication
- **Real-time notifications** - Event-driven notification system

### API Technologies
- **Apollo Server** - GraphQL server implementation
- **GraphQL** - Query language for flexible data fetching
- **REST API** - Traditional HTTP-based API endpoints

### File Handling
- **Multer** - Middleware for handling multipart/form-data (file uploads)
- **File System Storage** - Local file storage with metadata tracking

### Testing Framework
- **Jest** - JavaScript testing framework
- **fast-check** - Property-based testing library
- **Supertest** - HTTP assertion library for API testing
- **MongoDB Memory Server** - In-memory MongoDB for testing

### Development Tools
- **ESLint** - JavaScript linting utility
- **Prettier** - Code formatting tool
- **Nodemon** - Development server with auto-restart

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/productivity-suite.git
cd productivity-suite
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/productivity-suite
MONGODB_TEST_URI=mongodb://localhost:27017/productivity-suite-test

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Database Setup
Make sure MongoDB is running on your system:

```bash
# Start MongoDB (varies by installation method)
mongod

# Or if using MongoDB service
sudo systemctl start mongod
```

### 5. Create Upload Directory
```bash
mkdir uploads
```

### 6. Start the Development Server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Note Management Endpoints

#### Create Note
```http
POST /notes
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "My Note",
  "content": "Note content here",
  "tags": ["work", "important"],
  "isPrivate": true
}
```

#### Get User Notes
```http
GET /notes?page=1&limit=10&tags=work,important
Authorization: Bearer <jwt-token>
```

#### Update Note
```http
PUT /notes/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Updated Note Title",
  "content": "Updated content"
}
```

#### Delete Note
```http
DELETE /notes/:id
Authorization: Bearer <jwt-token>
```

### Task Management Endpoints

#### Create Task
```http
POST /tasks
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Complete project",
  "description": "Finish the productivity suite",
  "priority": "high",
  "dueDate": "2024-12-31T23:59:59.000Z"
}
```

#### Get User Tasks
```http
GET /tasks?status=pending&sortBy=dueDate
Authorization: Bearer <jwt-token>
```

#### Update Task
```http
PUT /tasks/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Updated task title",
  "status": "in-progress"
}
```

#### Complete Task
```http
PATCH /tasks/:id/complete
Authorization: Bearer <jwt-token>
```

#### Delete Task
```http
DELETE /tasks/:id
Authorization: Bearer <jwt-token>
```

### File Management Endpoints

#### Upload File
```http
POST /files
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data

file: <file-data>
description: "File description"
tags: "document,important"
```

#### Get User Files
```http
GET /files
Authorization: Bearer <jwt-token>
```

#### Download File
```http
GET /files/:id/download
Authorization: Bearer <jwt-token>
```

#### Delete File
```http
DELETE /files/:id
Authorization: Bearer <jwt-token>
```

### Admin Endpoints (Admin Role Required)

#### Get All Users
```http
GET /admin/users
Authorization: Bearer <admin-jwt-token>
```

#### Update User Role
```http
PUT /admin/users/:id/role
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "role": "admin"
}
```

### Notification Endpoints

#### Get User Notifications
```http
GET /notifications
Authorization: Bearer <jwt-token>
```

#### Mark Notification as Read
```http
PUT /notifications/:id/read
Authorization: Bearer <jwt-token>
```

#### Update User Preferences
```http
PUT /user/preferences
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "notifications": true,
  "theme": "dark"
}
```

### GraphQL Endpoint

#### GraphQL Playground
```http
GET /graphql
```

#### Example GraphQL Query
```graphql
query GetUserNotes {
  notes {
    id
    title
    content
    tags
    createdAt
    updatedAt
  }
}
```

#### Example GraphQL Mutation
```graphql
mutation CreateNote($input: CreateNoteInput!) {
  createNote(input: $input) {
    id
    title
    content
    tags
  }
}
```

## 🔌 Real-time Features

### Socket.io Events

#### Client Connection
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

#### Join Chat Room
```javascript
socket.emit('join-room', { roomId: 'general' });
```

#### Send Message
```javascript
socket.emit('send-message', {
  roomId: 'general',
  content: 'Hello everyone!'
});
```

#### Listen for Messages
```javascript
socket.on('new-message', (message) => {
  console.log('New message:', message);
});
```

#### Listen for Notifications
```javascript
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
});
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Property-Based Tests
```bash
npm run test:property
```

### Run Integration Tests
```bash
npm run test:integration
```

### Test Coverage
```bash
npm run test:coverage
```

## 🔧 Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-restart
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

### Project Structure
```
productivity-suite/
├── src/
│   ├── controllers/          # Route handlers
│   ├── middleware/           # Custom middleware
│   ├── models/              # Database models
│   ├── repositories/        # Data access layer
│   ├── services/            # Business logic
│   ├── utils/               # Utility functions
│   ├── graphql/             # GraphQL schema and resolvers
│   └── app.js               # Express app configuration
├── tests/                   # Test files
├── uploads/                 # File upload directory
├── .env                     # Environment variables
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-production-db-url
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=https://your-frontend-domain.com
```


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/productivity-suite/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User authentication and authorization
  - CRUD operations for notes, tasks, and files
  - Real-time chat and notifications
  - REST and GraphQL APIs
  - Comprehensive testing suite

---

**Built with ❤️ using Node.js, Express, and MongoDB**