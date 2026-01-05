const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server-express');

// Import services
const noteService = require('../services/noteService');
const taskService = require('../services/taskService');
const fileService = require('../services/fileService');
const chatService = require('../services/chatService');
const notificationService = require('../services/notificationService');
const adminService = require('../services/adminService');

// Import models for direct queries when needed
const User = require('../models/User');
const Note = require('../models/Note');
const Task = require('../models/Task');
const File = require('../models/File');
const Notification = require('../models/Notification');

// Custom Date scalar
const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    return value instanceof Date ? value.toISOString() : null;
  },
  parseValue(value) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

// Helper function to require authentication
const requireAuth = (user) => {
  if (!user) {
    throw new AuthenticationError('You must be logged in to perform this action');
  }
  return user;
};

// Helper function to require admin role
const requireAdmin = (user) => {
  requireAuth(user);
  if (user.role !== 'admin') {
    throw new ForbiddenError('You must be an admin to perform this action');
  }
  return user;
};

// Helper function to create cursor-based pagination
const createConnection = (items, totalCount, first, after) => {
  const edges = items.map((item, index) => ({
    node: item,
    cursor: Buffer.from(`${item._id}`).toString('base64')
  }));

  const pageInfo = {
    hasNextPage: items.length === first,
    hasPreviousPage: !!after,
    startCursor: edges.length > 0 ? edges[0].cursor : null,
    endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
  };

  return {
    edges,
    pageInfo,
    totalCount
  };
};

const resolvers = {
  Date: DateScalar,

  Query: {
    // User queries
    me: async (parent, args, { user }) => {
      requireAuth(user);
      return user;
    },

    // Note queries
    notes: async (parent, { first = 20, after, tags, search }, { user }) => {
      requireAuth(user);
      
      const options = {
        page: 1,
        limit: first,
        tags,
        search
      };

      if (after) {
        const decodedCursor = Buffer.from(after, 'base64').toString('ascii');
        // In a real implementation, you'd use the cursor for pagination
        // For now, we'll use basic pagination
      }

      const result = await noteService.getUserNotes(user._id, options);
      return createConnection(result.notes, result.total, first, after);
    },

    note: async (parent, { id }, { user }) => {
      requireAuth(user);
      
      const note = await Note.findOne({ _id: id, owner: user._id }).populate('owner');
      if (!note) {
        throw new UserInputError('Note not found or access denied');
      }
      
      return note;
    },

    // Task queries
    tasks: async (parent, { first = 20, after, status, priority }, { user }) => {
      requireAuth(user);
      
      const options = {
        page: 1,
        limit: first,
        status,
        priority
      };

      const result = await taskService.getUserTasks(user._id, options);
      return createConnection(result.tasks, result.total, first, after);
    },

    task: async (parent, { id }, { user }) => {
      requireAuth(user);
      
      const task = await Task.findOne({ _id: id, owner: user._id }).populate('owner');
      if (!task) {
        throw new UserInputError('Task not found or access denied');
      }
      
      return task;
    },

    // File queries
    files: async (parent, { first = 20, after }, { user }) => {
      requireAuth(user);
      
      const options = {
        page: 1,
        limit: first
      };

      const result = await fileService.getUserFiles(user._id, options);
      return createConnection(result.files, result.total, first, after);
    },

    file: async (parent, { id }, { user }) => {
      requireAuth(user);
      
      const file = await File.findOne({ _id: id, owner: user._id }).populate('owner');
      if (!file) {
        throw new UserInputError('File not found or access denied');
      }
      
      return file;
    },

    // Notification queries
    notifications: async (parent, { first = 20, after, unreadOnly }, { user }) => {
      requireAuth(user);
      
      const options = {
        page: 1,
        limit: first,
        unreadOnly: unreadOnly || false
      };

      const result = await notificationService.getUserNotifications(user._id, options);
      return createConnection(result.notifications, result.pagination.total, first, after);
    },

    // Chat queries
    chatHistory: async (parent, { room, limit = 50, before }, { user }) => {
      requireAuth(user);
      
      const options = { limit };
      if (before) {
        options.before = before;
      }

      const result = await chatService.getChatHistory(room, options);
      return result.messages;
    },

    // Admin queries
    users: async (parent, { first = 20, after }, { user }) => {
      requireAdmin(user);
      
      const options = {
        page: 1,
        limit: first
      };

      return await adminService.getAllUsers(options);
    }
  },

  Mutation: {
    // Note mutations
    createNote: async (parent, { input }, { user }) => {
      requireAuth(user);
      return await noteService.createNote(user._id, input);
    },

    updateNote: async (parent, { id, input }, { user }) => {
      requireAuth(user);
      return await noteService.updateNote(id, user._id, input);
    },

    deleteNote: async (parent, { id }, { user }) => {
      requireAuth(user);
      await noteService.deleteNote(id, user._id);
      return true;
    },

    // Task mutations
    createTask: async (parent, { input }, { user }) => {
      requireAuth(user);
      return await taskService.createTask(user._id, input);
    },

    updateTask: async (parent, { id, input }, { user }) => {
      requireAuth(user);
      return await taskService.updateTask(id, user._id, input);
    },

    completeTask: async (parent, { id }, { user }) => {
      requireAuth(user);
      return await taskService.completeTask(id, user._id);
    },

    deleteTask: async (parent, { id }, { user }) => {
      requireAuth(user);
      await taskService.deleteTask(id, user._id);
      return true;
    },

    // Chat mutations
    sendMessage: async (parent, { input }, { user }) => {
      requireAuth(user);
      return await chatService.sendMessage(user._id, input.room, input.content, input.messageType);
    },

    editMessage: async (parent, { id, content }, { user }) => {
      requireAuth(user);
      return await chatService.editMessage(id, user._id, content);
    },

    deleteMessage: async (parent, { id }, { user }) => {
      requireAuth(user);
      await chatService.deleteMessage(id, user._id);
      return true;
    },

    // Notification mutations
    markNotificationRead: async (parent, { id }, { user }) => {
      requireAuth(user);
      
      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId: user._id },
        { read: true, readAt: new Date() },
        { new: true }
      );
      
      if (!notification) {
        throw new UserInputError('Notification not found or access denied');
      }
      
      return notification;
    },

    markAllNotificationsRead: async (parent, args, { user }) => {
      requireAuth(user);
      
      await Notification.updateMany(
        { userId: user._id, read: false },
        { read: true, readAt: new Date() }
      );
      
      return true;
    },

    // Admin mutations
    updateUserRole: async (parent, { userId, role }, { user }) => {
      requireAdmin(user);
      return await adminService.updateUserRole(userId, role, user._id);
    }
  },

  // Subscription resolvers (placeholder for now)
  Subscription: {
    messageAdded: {
      // This would be implemented with a pub/sub system
      subscribe: () => {
        // Placeholder - would use withFilter and pubsub
        throw new Error('Subscriptions not yet implemented');
      }
    },

    notificationAdded: {
      subscribe: () => {
        throw new Error('Subscriptions not yet implemented');
      }
    },

    taskUpdated: {
      subscribe: () => {
        throw new Error('Subscriptions not yet implemented');
      }
    }
  }
};

module.exports = resolvers;