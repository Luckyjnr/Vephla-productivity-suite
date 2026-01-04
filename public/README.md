# Socket.io Chat Test Client

A comprehensive frontend test client for testing the Socket.io real-time chat functionality implemented in Task 9 of the Productivity Suite.

## 🚀 Quick Start

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open the test client:**
   Navigate to `http://localhost:3000` in your browser

3. **Test multi-user chat:**
   - Open multiple browser tabs/windows
   - Register different users in each tab
   - Join the same room and start chatting!

## 🎯 Features

### 🔐 Authentication
- **User Registration**: Create new accounts with name, email, and password
- **User Login**: Secure JWT-based authentication
- **Session Persistence**: Automatic login with stored tokens
- **Server Connectivity Test**: Verify backend connection before authentication

### 💬 Real-time Chat
- **Instant Messaging**: Real-time message broadcasting between users
- **Room Management**: Join and leave chat rooms dynamically
- **Message History**: Retrieve and display chat history when joining rooms
- **User Presence**: See when users join/leave rooms with system notifications
- **Message Styling**: Different visual styling for own vs other users' messages

### 🎨 User Interface
- **Clean Design**: Modern, responsive interface with intuitive controls
- **Connection Status**: Real-time connection status indicators
- **Message Timestamps**: All messages include formatted timestamps
- **Visual Feedback**: Loading states and error messages
- **Keyboard Shortcuts**: Enter key to send messages and join rooms

## 🧪 Testing Scenarios

### Single User Testing
1. Register/Login → Connect to Socket.io → Join Room → Send Messages
2. Test message history retrieval
3. Test room switching
4. Test connection/disconnection

### Multi-User Testing
1. **Browser Tabs Method:**
   - Open multiple tabs to `http://localhost:3000`
   - Register different users: `alice@test.com`, `bob@test.com`
   - Join the same room (e.g., "general")
   - Test real-time message broadcasting

2. **Multiple Devices Method:**
   - Access from different computers/phones
   - Use your computer's IP address: `http://192.168.1.100:3000`
   - Test cross-device real-time messaging

3. **Incognito Windows Method:**
   - Use regular + incognito browser windows
   - Test with different user accounts
   - Verify real-time synchronization

### Error Handling Testing
- Try joining without authentication
- Send messages without joining a room
- Test with invalid room names
- Test connection drops and reconnection
- Test server unavailability scenarios

## 📡 Socket.io Events

### Client → Server Events
| Event | Description | Payload |
|-------|-------------|---------|
| `join_room` | Join a chat room | `{ room: "general" }` |
| `leave_room` | Leave a chat room | `{ room: "general" }` |
| `send_message` | Send a message | `{ room: "general", content: "Hello!", type: "text" }` |
| `edit_message` | Edit existing message | `{ messageId: "...", content: "Updated text" }` |
| `delete_message` | Delete a message | `{ messageId: "..." }` |
| `get_history` | Get chat history | `{ room: "general", page: 1, limit: 20 }` |

### Server → Client Events
| Event | Description | Data |
|-------|-------------|------|
| `room_joined` | Successfully joined room | `{ room: "general", user: {...} }` |
| `room_left` | Successfully left room | `{ room: "general", user: {...} }` |
| `new_message` | New message received | `{ id, content, sender, room, timestamp }` |
| `message_edited` | Message was edited | `{ message: {...}, editedBy: {...} }` |
| `message_deleted` | Message was deleted | `{ messageId, deletedBy: {...} }` |
| `user_joined` | User joined the room | `{ user: {...}, room: "general" }` |
| `user_left` | User left the room | `{ user: {...}, room: "general" }` |
| `chat_history` | Chat history response | `{ messages: [...], room: "general" }` |
| `error` | Error occurred | `{ message: "Error description" }` |

## 🔧 Technical Implementation

### Architecture
- **Frontend**: Vanilla JavaScript with Socket.io client
- **Authentication**: JWT tokens with localStorage persistence
- **Real-time**: Socket.io WebSocket connections
- **UI**: CSS Grid/Flexbox with responsive design
- **Error Handling**: Comprehensive error states and user feedback

### Security Features
- **Content Security Policy**: Configured for Socket.io and inline scripts
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Client-side validation with server-side verification
- **XSS Protection**: Proper content sanitization

### Browser Compatibility
- Modern browsers with WebSocket support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers supported

## 🐛 Troubleshooting

### Connection Issues
- **Server not running**: Ensure `npm start` is running on port 3000
- **CORS errors**: Check server CORS configuration in `.env`
- **WebSocket blocked**: Check firewall/proxy settings

### Authentication Issues
- **Login fails**: Verify email/password, check server logs
- **Token expired**: Clear localStorage and login again
- **Registration fails**: Check for duplicate emails

### Chat Issues
- **Messages not sending**: Ensure you've joined a room first
- **Not receiving messages**: Check Socket.io connection status
- **History not loading**: Verify room name and server connectivity

### Debug Commands
```javascript
// Clear stored authentication
localStorage.clear();

// Check current token
console.log(localStorage.getItem('authToken'));

// Monitor Socket.io events
socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});
```

## 🎮 Example Usage Flow

```
1. User opens http://localhost:3000
2. Clicks "Test Server Connection" → ✅ Server OK
3. Fills form: "Alice" / "alice@test.com" / "password123"
4. Clicks "Register" → ✅ Registration successful
5. Clicks "Login" → ✅ Connected to Socket.io
6. Enters room "general" → Clicks "Join Room"
7. Types "Hello everyone!" → Clicks "Send"
8. Opens second tab, registers "Bob", joins "general"
9. Bob sees: "Alice joined the room" + "Alice: Hello everyone!"
10. Bob replies: "Hi Alice!" → Alice sees it instantly
```

## 📝 Development Notes

- Built for testing Socket.io Task 9 implementation
- Supports unlimited concurrent users
- Message persistence via MongoDB
- Real-time synchronization across all connected clients
- Comprehensive error handling and user feedback
- Production-ready authentication and security measures

---

**Ready to test real-time chat? Start the server and open multiple browser tabs!** 🚀