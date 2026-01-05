const { gql } = require('apollo-server-express');

const typeDefs = gql`
  # Scalar types
  scalar Date

  # User type
  type User {
    id: ID!
    email: String!
    name: String
    role: String!
    createdAt: Date!
    updatedAt: Date!
  }

  # Note type
  type Note {
    id: ID!
    title: String!
    content: String!
    tags: [String!]!
    owner: User!
    createdAt: Date!
    updatedAt: Date!
  }

  # Task type
  type Task {
    id: ID!
    title: String!
    description: String
    status: TaskStatus!
    priority: TaskPriority!
    dueDate: Date
    owner: User!
    createdAt: Date!
    updatedAt: Date!
    completedAt: Date
  }

  # File type
  type File {
    id: ID!
    filename: String!
    originalName: String!
    mimetype: String!
    size: Int!
    path: String!
    owner: User!
    createdAt: Date!
    updatedAt: Date!
  }

  # Message type
  type Message {
    id: ID!
    content: String!
    sender: User
    room: String!
    messageType: MessageType!
    createdAt: Date!
    edited: Boolean!
    editedAt: Date
  }

  # Notification type
  type Notification {
    id: ID!
    userId: ID!
    type: NotificationType!
    title: String!
    message: String!
    priority: NotificationPriority!
    read: Boolean!
    data: String
    createdAt: Date!
    readAt: Date
  }

  # Enums
  enum TaskStatus {
    PENDING
    IN_PROGRESS
    COMPLETED
    CANCELLED
  }

  enum TaskPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  enum MessageType {
    TEXT
    SYSTEM
    FILE
  }

  enum NotificationType {
    TASK_ASSIGNED
    TASK_COMPLETED
    TASK_DUE_SOON
    NOTE_SHARED
    NOTE_UPDATED
    FILE_UPLOADED
    FILE_SHARED
    CHAT_MENTION
    SYSTEM_ALERT
  }

  enum NotificationPriority {
    LOW
    MEDIUM
    HIGH
  }

  # Input types
  input CreateNoteInput {
    title: String!
    content: String!
    tags: [String!]
  }

  input UpdateNoteInput {
    title: String
    content: String
    tags: [String!]
  }

  input CreateTaskInput {
    title: String!
    description: String
    priority: TaskPriority!
    dueDate: Date
  }

  input UpdateTaskInput {
    title: String
    description: String
    status: TaskStatus
    priority: TaskPriority
    dueDate: Date
  }

  input SendMessageInput {
    content: String!
    room: String!
    messageType: MessageType = TEXT
  }

  # Pagination types
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type NotesConnection {
    edges: [NoteEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type NoteEdge {
    node: Note!
    cursor: String!
  }

  type TasksConnection {
    edges: [TaskEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TaskEdge {
    node: Task!
    cursor: String!
  }

  type FilesConnection {
    edges: [FileEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type FileEdge {
    node: File!
    cursor: String!
  }

  type NotificationsConnection {
    edges: [NotificationEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type NotificationEdge {
    node: Notification!
    cursor: String!
  }

  # Query type
  type Query {
    # User queries
    me: User

    # Note queries
    notes(
      first: Int
      after: String
      tags: [String!]
      search: String
    ): NotesConnection!
    
    note(id: ID!): Note

    # Task queries
    tasks(
      first: Int
      after: String
      status: TaskStatus
      priority: TaskPriority
    ): TasksConnection!
    
    task(id: ID!): Task

    # File queries
    files(
      first: Int
      after: String
    ): FilesConnection!
    
    file(id: ID!): File

    # Notification queries
    notifications(
      first: Int
      after: String
      unreadOnly: Boolean
    ): NotificationsConnection!

    # Chat queries
    chatHistory(
      room: String!
      limit: Int = 50
      before: Date
    ): [Message!]!

    # Admin queries (require admin role)
    users(
      first: Int
      after: String
    ): [User!]! @requireRole(role: "admin")
  }

  # Mutation type
  type Mutation {
    # Note mutations
    createNote(input: CreateNoteInput!): Note!
    updateNote(id: ID!, input: UpdateNoteInput!): Note!
    deleteNote(id: ID!): Boolean!

    # Task mutations
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    completeTask(id: ID!): Task!
    deleteTask(id: ID!): Boolean!

    # Chat mutations
    sendMessage(input: SendMessageInput!): Message!
    editMessage(id: ID!, content: String!): Message!
    deleteMessage(id: ID!): Boolean!

    # Notification mutations
    markNotificationRead(id: ID!): Notification!
    markAllNotificationsRead: Boolean!

    # Admin mutations (require admin role)
    updateUserRole(userId: ID!, role: String!): User! @requireRole(role: "admin")
  }

  # Subscription type
  type Subscription {
    # Real-time message updates
    messageAdded(room: String!): Message!
    messageEdited(room: String!): Message!
    messageDeleted(room: String!): Message!

    # Real-time notification updates
    notificationAdded: Notification!

    # Real-time task updates
    taskUpdated: Task!
  }

  # Custom directives
  directive @requireRole(role: String!) on FIELD_DEFINITION
  directive @requireAuth on FIELD_DEFINITION
`;

module.exports = typeDefs;