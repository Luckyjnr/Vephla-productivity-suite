const chatService = require('../services/chatService');

/**
 * Chat Controller
 * Handles Socket.io events for real-time chat
 */
class ChatController {

  /**
   * Initialize chat event handlers for a socket
   */
  initializeHandlers(socket, io) {
    console.log(`🎯 Initializing chat handlers for user ${socket.user.email}`);

    // Handle joining a room
    socket.on('join_room', async (data) => {
      try {
        const { room } = data;
        
        if (!room || typeof room !== 'string') {
          socket.emit('error', { message: 'Invalid room name' });
          return;
        }

        const normalizedRoom = room.toLowerCase().trim();
        
        // Leave previous rooms (except user's personal room)
        const currentRooms = Array.from(socket.rooms);
        currentRooms.forEach(roomName => {
          if (roomName !== socket.id && !roomName.startsWith('user:')) {
            socket.leave(roomName);
          }
        });

        // Join the new room
        socket.join(normalizedRoom);
        
        console.log(`👥 User ${socket.user.email} joined room: ${normalizedRoom}`);

        // Get recent messages for the room
        const recentMessages = await chatService.getRecentMessages(normalizedRoom, 20);
        
        // Send recent messages to the user
        socket.emit('room_joined', {
          room: normalizedRoom,
          messages: recentMessages,
          timestamp: new Date().toISOString()
        });

        // Notify others in the room about the new user
        socket.to(normalizedRoom).emit('user_joined', {
          user: {
            id: socket.userId,
            email: socket.user.email,
            role: socket.user.role
          },
          room: normalizedRoom,
          timestamp: new Date().toISOString()
        });

        // Send system message about user joining
        const systemMessage = await chatService.sendSystemMessage(
          normalizedRoom,
          `${socket.user.email} joined the room`
        );

        // Broadcast system message to all users in room
        io.to(normalizedRoom).emit('new_message', systemMessage);

      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { 
          message: 'Failed to join room',
          code: 'JOIN_ROOM_ERROR'
        });
      }
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { room, content } = data;
        
        if (!room || !content) {
          socket.emit('error', { message: 'Room and content are required' });
          return;
        }

        // Send the message
        const message = await chatService.sendMessage(
          socket.userId,
          room,
          content,
          'text'
        );

        console.log(`💬 Message sent by ${socket.user.email} in ${room}: ${content.substring(0, 50)}...`);

        // Broadcast message to all users in the room
        io.to(room.toLowerCase().trim()).emit('new_message', message);

      } catch (error) {
        console.error('Error sending message:', error);
        
        let errorMessage = 'Failed to send message';
        let errorCode = 'SEND_MESSAGE_ERROR';

        if (error.message === 'EMPTY_MESSAGE') {
          errorMessage = 'Message cannot be empty';
          errorCode = 'EMPTY_MESSAGE';
        } else if (error.message === 'MESSAGE_TOO_LONG') {
          errorMessage = 'Message is too long (max 1000 characters)';
          errorCode = 'MESSAGE_TOO_LONG';
        } else if (error.message === 'INVALID_ROOM') {
          errorMessage = 'Invalid room name';
          errorCode = 'INVALID_ROOM';
        }

        socket.emit('error', { 
          message: errorMessage,
          code: errorCode
        });
      }
    });

    // Handle editing messages
    socket.on('edit_message', async (data) => {
      try {
        const { messageId, content, room } = data;
        
        if (!messageId || !content || !room) {
          socket.emit('error', { message: 'Message ID, content, and room are required' });
          return;
        }

        const editedMessage = await chatService.editMessage(messageId, socket.userId, content);

        console.log(`✏️ Message edited by ${socket.user.email}: ${messageId}`);

        // Broadcast edited message to all users in the room
        io.to(room.toLowerCase().trim()).emit('message_edited', editedMessage);

      } catch (error) {
        console.error('Error editing message:', error);
        
        let errorMessage = 'Failed to edit message';
        let errorCode = 'EDIT_MESSAGE_ERROR';

        if (error.message === 'MESSAGE_NOT_FOUND') {
          errorMessage = 'Message not found or you cannot edit this message';
          errorCode = 'MESSAGE_NOT_FOUND';
        } else if (error.message === 'EMPTY_MESSAGE') {
          errorMessage = 'Message cannot be empty';
          errorCode = 'EMPTY_MESSAGE';
        } else if (error.message === 'MESSAGE_TOO_LONG') {
          errorMessage = 'Message is too long (max 1000 characters)';
          errorCode = 'MESSAGE_TOO_LONG';
        }

        socket.emit('error', { 
          message: errorMessage,
          code: errorCode
        });
      }
    });

    // Handle deleting messages
    socket.on('delete_message', async (data) => {
      try {
        const { messageId, room } = data;
        
        if (!messageId || !room) {
          socket.emit('error', { message: 'Message ID and room are required' });
          return;
        }

        const deletedMessage = await chatService.deleteMessage(messageId, socket.userId);

        console.log(`🗑️ Message deleted by ${socket.user.email}: ${messageId}`);

        // Broadcast deletion to all users in the room
        io.to(room.toLowerCase().trim()).emit('message_deleted', deletedMessage);

      } catch (error) {
        console.error('Error deleting message:', error);
        
        let errorMessage = 'Failed to delete message';
        let errorCode = 'DELETE_MESSAGE_ERROR';

        if (error.message === 'MESSAGE_NOT_FOUND') {
          errorMessage = 'Message not found or you cannot delete this message';
          errorCode = 'MESSAGE_NOT_FOUND';
        }

        socket.emit('error', { 
          message: errorMessage,
          code: errorCode
        });
      }
    });

    // Handle getting chat history
    socket.on('get_history', async (data) => {
      try {
        const { room, page = 1, limit = 50 } = data;
        
        if (!room) {
          socket.emit('error', { message: 'Room is required' });
          return;
        }

        const history = await chatService.getChatHistory(room, { page, limit });

        socket.emit('chat_history', history);

      } catch (error) {
        console.error('Error getting chat history:', error);
        socket.emit('error', { 
          message: 'Failed to get chat history',
          code: 'GET_HISTORY_ERROR'
        });
      }
    });

    // Handle leaving room
    socket.on('leave_room', async (data) => {
      try {
        const { room } = data;
        
        if (!room) {
          socket.emit('error', { message: 'Room is required' });
          return;
        }

        const normalizedRoom = room.toLowerCase().trim();
        socket.leave(normalizedRoom);

        console.log(`👋 User ${socket.user.email} left room: ${normalizedRoom}`);

        // Notify others in the room
        socket.to(normalizedRoom).emit('user_left', {
          user: {
            id: socket.userId,
            email: socket.user.email,
            role: socket.user.role
          },
          room: normalizedRoom,
          timestamp: new Date().toISOString()
        });

        // Send system message about user leaving
        const systemMessage = await chatService.sendSystemMessage(
          normalizedRoom,
          `${socket.user.email} left the room`
        );

        // Broadcast system message to remaining users in room
        socket.to(normalizedRoom).emit('new_message', systemMessage);

        socket.emit('room_left', { room: normalizedRoom });

      } catch (error) {
        console.error('Error leaving room:', error);
        socket.emit('error', { 
          message: 'Failed to leave room',
          code: 'LEAVE_ROOM_ERROR'
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async (reason) => {
      console.log(`🔌 User ${socket.user.email} disconnected: ${reason}`);
      
      // Get all rooms the user was in
      const rooms = Array.from(socket.rooms);
      
      // Notify all rooms about user disconnect
      rooms.forEach(async (room) => {
        if (room !== socket.id && !room.startsWith('user:')) {
          socket.to(room).emit('user_left', {
            user: {
              id: socket.userId,
              email: socket.user.email,
              role: socket.user.role
            },
            room,
            timestamp: new Date().toISOString(),
            reason: 'disconnected'
          });

          // Send system message about user disconnecting
          try {
            const systemMessage = await chatService.sendSystemMessage(
              room,
              `${socket.user.email} disconnected`
            );
            socket.to(room).emit('new_message', systemMessage);
          } catch (error) {
            console.error('Error sending disconnect system message:', error);
          }
        }
      });
    });
  }
}

module.exports = new ChatController();