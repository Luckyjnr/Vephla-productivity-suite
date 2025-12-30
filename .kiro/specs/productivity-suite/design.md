# Design Document

## Overview

The Full-Stack Productivity Suite is a comprehensive Node.js backend system that provides a complete productivity platform with authentication, task management, note-taking, file storage, and real-time communication. The system is built using Express.js for REST APIs, GraphQL for flexible data querying, MongoDB for data persistence, Socket.io for real-time features, and JWT for secure authentication.

The architecture follows a modular, layered approach with clear separation of concerns between authentication, business logic, data access, and real-time communication. The system supports role-based access control (RBAC) with Standard_User and Admin_User roles, ensuring proper security and access management.

## Architecture

The system follows a layered architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
├─────────────────────────────────────────────────────────────┤
│                 API Gateway Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   REST API      │  │   GraphQL API   │  │  Socket.io  │ │
│  │   (Express)     │  │                 │  │  Real-time  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                 Middleware Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Authentication  │  │      RBAC       │  │   Logging   │ │
│  │   (JWT)         │  │   Authorization │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                 Business Logic Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   User Service  │  │   Note Service  │  │ Task Service│ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   File Service  │  │   Chat Service  │  │Notification │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                 Data Access Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   User Repo     │  │   Note Repo     │  │  Task Repo  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   File Repo     │  │  Message Repo   │                  │
│  └─────────────────┘  └─────────────────┘                  │
├─────────────────────────────────────────────────────────────┤
│                 Data Storage Layer                          │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │    MongoDB      │  │  File System    │                  │
│  │   Database      │  │    Storage      │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Authentication System
- **JWT Service**: Handles token generation, validation, and refresh
- **Password Service**: Manages bcrypt hashing and verification
- **Auth Middleware**: Validates tokens on protected routes
- **Session Management**: Tracks active user sessions

### RBAC System
- **Role Manager**: Defines and manages user roles (Standard_User, Admin_User)
- **Permission Service**: Checks user permissions for specific operations
- **Access Control Middleware**: Enforces role-based access on endpoints
- **Audit Logger**: Records administrative actions and permission changes

### CRUD Modules
- **Note Service**: Manages note creation, retrieval, updates, and deletion
- **Task Service**: Handles task lifecycle management and status tracking
- **File Service**: Manages file uploads, downloads, and metadata
- **User Service**: Handles user account management and profile operations

### Real-Time System
- **Socket Manager**: Manages WebSocket connections and rooms
- **Message Broker**: Handles message routing and delivery
- **Notification Service**: Manages real-time notifications and queuing
- **Presence Service**: Tracks online users and connection status

### API Layers
- **REST Controllers**: Express.js route handlers for HTTP operations
- **GraphQL Resolvers**: Query and mutation resolvers for GraphQL schema
- **Schema Definitions**: GraphQL type definitions and validation rules
- **API Documentation**: OpenAPI/Swagger specifications

## Data Models

### User Model
```javascript
// User model structure
const userSchema = {
  _id: ObjectId,
  email: String,
  passwordHash: String,
  role: String, // 'standard' | 'admin'
  profile: {
    firstName: String,
    lastName: String,
    avatar: String
  },
  preferences: {
    notifications: Boolean,
    theme: String // 'light' | 'dark'
  },
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
};
```

### Note Model
```javascript
// Note model structure
const noteSchema = {
  _id: ObjectId,
  title: String,
  content: String,
  tags: [String],
  userId: ObjectId,
  isPrivate: Boolean,
  createdAt: Date,
  updatedAt: Date
};
```

### Task Model
```javascript
// Task model structure
const taskSchema = {
  _id: ObjectId,
  title: String,
  description: String,
  status: String, // 'pending' | 'in-progress' | 'completed'
  priority: String, // 'low' | 'medium' | 'high'
  dueDate: Date,
  completedAt: Date,
  userId: ObjectId,
  createdAt: Date,
  updatedAt: Date
};
```

### File Model
```javascript
// File model structure
const fileSchema = {
  _id: ObjectId,
  filename: String,
  originalName: String,
  mimeType: String,
  size: Number,
  path: String,
  userId: ObjectId,
  metadata: {
    description: String,
    tags: [String]
  },
  createdAt: Date
};
```

### Message Model
```javascript
// Message model structure
const messageSchema = {
  _id: ObjectId,
  content: String,
  senderId: ObjectId,
  roomId: String,
  messageType: String, // 'text' | 'system'
  createdAt: Date
};
```

### Notification Model
```javascript
// Notification model structure
const notificationSchema = {
  _id: ObjectId,
  userId: ObjectId,
  type: String, // 'task_assigned' | 'note_shared' | 'system_alert'
  title: String,
  message: String,
  isRead: Boolean,
  data: Object,
  createdAt: Date
};
```
## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to eliminate redundancy:

- User ownership properties (4.2, 4.3, 4.4, 5.3, 5.4, 5.5, 6.2, 6.3, 6.4) can be combined into comprehensive ownership enforcement properties
- Authentication properties (2.1, 2.4, 2.5) can be consolidated into token lifecycle properties
- RBAC properties (3.1, 3.3, 3.5) can be combined into role-based access enforcement

### Authentication & Authorization Properties

**Property 1: User registration creates secure accounts**
*For any* valid email and password combination, user registration should create an account with bcrypt-hashed password, standard role assignment, and return a valid JWT token
**Validates: Requirements 1.1, 1.3, 1.4, 1.5**

**Property 2: Duplicate email prevention**
*For any* email address, attempting to register multiple accounts with the same email should prevent duplicate creation and return appropriate error
**Validates: Requirements 1.2**

**Property 3: Authentication token lifecycle**
*For any* user with valid credentials, login should return a valid JWT with role information and expiration, and expired tokens should be rejected on protected routes
**Validates: Requirements 2.1, 2.3, 2.4, 2.5**

**Property 4: Invalid credential rejection**
*For any* invalid credential combination, login attempts should be rejected with appropriate error messages
**Validates: Requirements 2.2**

**Property 5: Role-based access enforcement**
*For any* admin operation, only users with admin role should be granted access, while standard users should receive authorization errors
**Validates: Requirements 3.1, 3.3**

**Property 6: Administrative action logging**
*For any* admin operation performed, the system should create audit logs and immediately enforce permission changes
**Validates: Requirements 3.2, 3.4, 3.5**

### Data Ownership Properties

**Property 7: Note ownership enforcement**
*For any* note operation (create, read, update, delete), users should only be able to access and modify notes they own, with proper timestamps and tag filtering
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

**Property 8: Task ownership enforcement**
*For any* task operation (create, read, update, delete), users should only be able to access and modify tasks they own, with proper status management and completion tracking
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

**Property 9: File ownership enforcement**
*For any* file operation (upload, download, delete), users should only be able to access files they own, with proper cleanup of both database and filesystem storage
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

**Property 10: File size limit enforcement**
*For any* file upload exceeding size limits, the system should reject the upload and return appropriate error messages
**Validates: Requirements 6.5**

### Real-Time Communication Properties

**Property 11: Socket connection management**
*For any* user connecting to chat, the system should establish socket connection, track active users, and handle disconnections with proper cleanup and notifications
**Validates: Requirements 7.1, 7.4**

**Property 12: Message broadcasting and persistence**
*For any* message sent in a chat room, the system should broadcast to all room participants and store with sender information and timestamps
**Validates: Requirements 7.2, 7.5**

**Property 13: Room presence notifications**
*For any* user joining a chat room, the system should notify existing participants of the new user presence
**Validates: Requirements 7.3**

**Property 14: Real-time notification delivery**
*For any* system event generating notifications, the system should deliver notifications to relevant users with proper queuing for offline users and respect user preferences
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### API Consistency Properties

**Property 15: GraphQL query validation and access control**
*For any* GraphQL query or mutation, the system should validate against schema and enforce the same access control as REST endpoints
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

**Property 16: GraphQL introspection availability**
*For any* GraphQL schema request, the system should provide introspection capabilities for development and testing
**Validates: Requirements 9.5**

**Property 17: Security header enforcement**
*For any* API endpoint access, the system should respond with appropriate CORS headers and security policies
**Validates: Requirements 10.3**

## Error Handling

### Authentication Errors
- **Invalid Credentials**: Return 401 with clear error message
- **Expired Token**: Return 401 with token refresh guidance
- **Missing Token**: Return 401 with authentication requirement
- **Invalid Token Format**: Return 400 with format specification

### Authorization Errors
- **Insufficient Permissions**: Return 403 with required role information
- **Resource Access Denied**: Return 403 with ownership requirements
- **Admin Operation Denied**: Return 403 with admin role requirement

### Validation Errors
- **Invalid Input Data**: Return 400 with field-specific validation errors
- **Missing Required Fields**: Return 400 with required field list
- **Data Format Errors**: Return 400 with expected format specification
- **File Size Exceeded**: Return 413 with size limit information

### Resource Errors
- **Resource Not Found**: Return 404 with resource type and identifier
- **Duplicate Resource**: Return 409 with conflict details
- **Resource Limit Exceeded**: Return 429 with limit information

### System Errors
- **Database Connection**: Return 503 with retry guidance
- **File System Errors**: Return 500 with operation details
- **Socket Connection Errors**: Attempt reconnection with exponential backoff
- **External Service Errors**: Return 502 with service status

### Error Response Format
```javascript
// Error response structure
const errorResponse = {
  error: {
    code: String,
    message: String,
    details: Object, // optional
    timestamp: String,
    requestId: String
  }
};
```

## Testing Strategy

### Dual Testing Approach

The system will use both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties that should hold across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Unit Testing Requirements

Unit tests will cover:
- Specific examples that demonstrate correct behavior
- Integration points between components
- Error handling scenarios
- Edge cases like empty inputs and boundary values

### Property-Based Testing Requirements

- **Testing Library**: fast-check for JavaScript/TypeScript property-based testing
- **Test Configuration**: Each property-based test will run a minimum of 100 iterations
- **Test Tagging**: Each property-based test will include a comment with the format: `**Feature: productivity-suite, Property {number}: {property_text}**`
- **Property Implementation**: Each correctness property will be implemented by a single property-based test
- **Coverage**: Property tests will verify universal behaviors across randomly generated inputs

### Testing Framework Stack
- **Unit Testing**: Jest for test runner and assertions
- **Property Testing**: fast-check for property-based test generation
- **Integration Testing**: Supertest for API endpoint testing
- **Database Testing**: MongoDB Memory Server for isolated database testing
- **Socket Testing**: Socket.io-client for real-time communication testing

### Test Organization
- Co-locate tests with source files using `.test.ts` suffix
- Separate unit tests and property tests into distinct describe blocks
- Use descriptive test names that explain the behavior being tested
- Group related tests by feature area (auth, notes, tasks, files, real-time)