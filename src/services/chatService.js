const messageRepository = require('../repositories/messageRepository');
const notificationService = require('./notificationService');
const User = require('../models/User');

/**
 * Chat Service
 * Handles business logic for real-time chat functionality
 */
class ChatService {

  /**
   * Send a message to a room
   */
  async sendMessage(userId, room, content, messageType = 'text') {
    try {
      // Validate input
      if (!content || content.trim().length === 0) {
        throw new Error('EMPTY_MESSAGE');
      }

      if (content.length > 1000) {
        throw new Error('MESSAGE_TOO_LONG');
      }

      if (!room || room.trim().length === 0) {
        throw new Error('INVALID_ROOM');
      }

      // Sanitize content (basic XSS prevention)
      const sanitizedContent = content.trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

      // Create message
      const messageData = {
        content: sanitizedContent,
        sender: userId,
        room: room.toLowerCase().trim(),
        messageType
      };

      const message = await messageRepository.createMessage(messageData);
      
      // Check for mentions and create notifications
      await this.processMentions(message, userId, room);
      
      return message.toClientFormat();

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Process mentions in a message and create notifications
   */
  async processMentions(message, senderId, room) {
    try {
      const content = message.content;
      
      // Find @mentions in the message (e.g., @john@example.com or @username)
      const mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9._-]+)/g;
      const mentions = content.match(mentionRegex);
      
      if (!mentions || mentions.length === 0) {
        return;
      }

      // Get sender info for notification
      const sender = await User.findById(senderId).select('name email');
      if (!sender) return;

      // Process each mention
      for (const mention of mentions) {
        const cleanMention = mention.substring(1); // Remove @ symbol
        
        // Try to find user by email or name
        let mentionedUser = null;
        
        if (cleanMention.includes('@')) {
          // Email mention
          mentionedUser = await User.findOne({ email: cleanMention }).select('_id name email');
        } else {
          // Username mention (assuming name field)
          mentionedUser = await User.findOne({ 
            $or: [
              { name: { $regex: new RegExp(cleanMention, 'i') } },
              { email: { $regex: new RegExp(`^${cleanMention}@`, 'i') } }
            ]
          }).select('_id name email');
        }

        if (mentionedUser && mentionedUser._id.toString() !== senderId) {
          // Create notification for mentioned user
          await notificationService.createNotification({
            userId: mentionedUser._id,
            type: 'chat_mention',
            title: `${sender.name || sender.email} mentioned you in ${room}`,
            message: content.length > 100 ? content.substring(0, 100) + '...' : content,
            priority: 'medium',
            data: {
              messageId: message._id,
              room: room,
              senderId: senderId,
              senderName: sender.name || sender.email,
              fullMessage: content
            }
          });

          console.log(`🔔 Created mention notification for ${mentionedUser.email} in room ${room}`);
        }
      }
    } catch (error) {
      console.error('Error processing mentions:', error);
      // Don't throw error - message should still be sent even if notifications fail
    }
  }

  /**
   * Get chat history for a room
   */
  async getChatHistory(room, options = {}) {
    try {
      if (!room || room.trim().length === 0) {
        throw new Error('INVALID_ROOM');
      }

      const normalizedRoom = room.toLowerCase().trim();
      const messages = await messageRepository.getMessagesByRoom(normalizedRoom, options);
      
      return {
        messages: messages.map(msg => ({
          id: msg._id,
          content: msg.content,
          sender: msg.sender ? {
            id: msg.sender._id,
            email: msg.sender.email,
            role: msg.sender.role,
            name: msg.sender.name
          } : null,
          room: msg.room,
          messageType: msg.messageType,
          timestamp: msg.createdAt,
          edited: msg.metadata?.edited || false,
          editedAt: msg.metadata?.editedAt
        })),
        room: normalizedRoom,
        pagination: {
          page: options.page || 1,
          limit: options.limit || 50,
          hasMore: messages.length === (options.limit || 50)
        }
      };

    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  /**
   * Get recent messages for room (when user joins)
   */
  async getRecentMessages(room, limit = 20) {
    try {
      if (!room || room.trim().length === 0) {
        throw new Error('INVALID_ROOM');
      }

      const normalizedRoom = room.toLowerCase().trim();
      const messages = await messageRepository.getRecentMessages(normalizedRoom, limit);
      
      return messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        sender: msg.sender ? {
          id: msg.sender._id,
          email: msg.sender.email,
          role: msg.sender.role,
          name: msg.sender.name
        } : null,
        room: msg.room,
        messageType: msg.messageType,
        timestamp: msg.createdAt,
        edited: msg.metadata?.edited || false,
        editedAt: msg.metadata?.editedAt
      }));

    } catch (error) {
      console.error('Error getting recent messages:', error);
      throw error;
    }
  }

  /**
   * Edit a message
   */
  async editMessage(messageId, userId, newContent) {
    try {
      // Validate input
      if (!newContent || newContent.trim().length === 0) {
        throw new Error('EMPTY_MESSAGE');
      }

      if (newContent.length > 1000) {
        throw new Error('MESSAGE_TOO_LONG');
      }

      // Sanitize content
      const sanitizedContent = newContent.trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

      const message = await messageRepository.updateMessage(messageId, userId, sanitizedContent);
      return message.toClientFormat();

    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId, userId) {
    try {
      const message = await messageRepository.deleteMessage(messageId, userId);
      return {
        id: message._id,
        room: message.room,
        deleted: true
      };

    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Send system message (for notifications, user join/leave, etc.)
   */
  async sendSystemMessage(room, content) {
    try {
      const messageData = {
        content,
        sender: null, // System messages don't have a sender
        room: room.toLowerCase().trim(),
        messageType: 'system'
      };

      // Create system message without sender validation
      const message = await messageRepository.createMessage(messageData);
      
      return {
        id: message._id,
        content: message.content,
        sender: null,
        room: message.room,
        messageType: 'system',
        timestamp: message.createdAt
      };

    } catch (error) {
      console.error('Error sending system message:', error);
      throw error;
    }
  }

  /**
   * Get room statistics
   */
  async getRoomStats(room) {
    try {
      if (!room || room.trim().length === 0) {
        throw new Error('INVALID_ROOM');
      }

      const normalizedRoom = room.toLowerCase().trim();
      return await messageRepository.getRoomStats(normalizedRoom);

    } catch (error) {
      console.error('Error getting room stats:', error);
      throw error;
    }
  }

  /**
   * Search messages in a room
   */
  async searchMessages(room, searchTerm, options = {}) {
    try {
      if (!room || room.trim().length === 0) {
        throw new Error('INVALID_ROOM');
      }

      if (!searchTerm || searchTerm.trim().length === 0) {
        throw new Error('EMPTY_SEARCH_TERM');
      }

      const normalizedRoom = room.toLowerCase().trim();
      const messages = await messageRepository.searchMessages(normalizedRoom, searchTerm, options);
      
      return messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        sender: msg.sender ? {
          id: msg.sender._id,
          email: msg.sender.email,
          role: msg.sender.role,
          name: msg.sender.name
        } : null,
        room: msg.room,
        messageType: msg.messageType,
        timestamp: msg.createdAt,
        edited: msg.metadata?.edited || false,
        editedAt: msg.metadata?.editedAt
      }));

    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }
}

module.exports = new ChatService();