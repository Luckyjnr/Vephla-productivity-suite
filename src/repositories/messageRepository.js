const Message = require('../models/Message');
const mongoose = require('mongoose');

/**
 * Message Repository
 * Handles database operations for chat messages
 */
class MessageRepository {
  
  /**
   * Create a new message
   */
  async createMessage(messageData) {
    try {
      const message = new Message(messageData);
      await message.save();
      
      // Populate sender info before returning (if sender exists)
      if (message.sender) {
        await message.populate('sender', 'email role name');
      }
      return message;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a specific room with pagination
   */
  async getMessagesByRoom(room, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        before = null, // Get messages before this timestamp
        messageType = null
      } = options;

      const query = { room };
      
      // Add message type filter if specified
      if (messageType) {
        query.messageType = messageType;
      }
      
      // Add timestamp filter if specified
      if (before) {
        query.createdAt = { $lt: new Date(before) };
      }

      const skip = (page - 1) * limit;
      
      const messages = await Message.find(query)
        .populate('sender', 'email role name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting messages by room:', error);
      throw error;
    }
  }

  /**
   * Get recent messages for a room (for new connections)
   */
  async getRecentMessages(room, limit = 20) {
    try {
      const messages = await Message.find({ room })
        .populate('sender', 'email role name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting recent messages:', error);
      throw error;
    }
  }

  /**
   * Update a message (for editing)
   */
  async updateMessage(messageId, userId, newContent) {
    try {
      // Validate message ID
      if (!mongoose.Types.ObjectId.isValid(messageId)) {
        throw new Error('INVALID_MESSAGE_ID');
      }

      const message = await Message.findOne({
        _id: messageId,
        sender: userId
      });

      if (!message) {
        throw new Error('MESSAGE_NOT_FOUND');
      }

      // Update content and metadata
      message.content = newContent;
      message.metadata.edited = true;
      message.metadata.editedAt = new Date();

      await message.save();
      await message.populate('sender', 'email role name');
      
      return message;
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId, userId) {
    try {
      // Validate message ID
      if (!mongoose.Types.ObjectId.isValid(messageId)) {
        throw new Error('INVALID_MESSAGE_ID');
      }

      const message = await Message.findOneAndDelete({
        _id: messageId,
        sender: userId
      });

      if (!message) {
        throw new Error('MESSAGE_NOT_FOUND');
      }

      return message;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Get message statistics for a room
   */
  async getRoomStats(room) {
    try {
      const stats = await Message.aggregate([
        { $match: { room } },
        {
          $group: {
            _id: null,
            totalMessages: { $sum: 1 },
            uniqueSenders: { $addToSet: '$sender' },
            messageTypes: { $push: '$messageType' }
          }
        },
        {
          $project: {
            _id: 0,
            totalMessages: 1,
            uniqueSenders: { $size: '$uniqueSenders' },
            messageTypeBreakdown: {
              $reduce: {
                input: '$messageTypes',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    {
                      $arrayToObject: [[{
                        k: '$$this',
                        v: { $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1] }
                      }]]
                    }
                  ]
                }
              }
            }
          }
        }
      ]);

      return stats[0] || {
        totalMessages: 0,
        uniqueSenders: 0,
        messageTypeBreakdown: {}
      };
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
      const { limit = 20, page = 1 } = options;
      const skip = (page - 1) * limit;

      const messages = await Message.find({
        room,
        content: { $regex: searchTerm, $options: 'i' }
      })
        .populate('sender', 'email role name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return messages;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }
}

module.exports = new MessageRepository();