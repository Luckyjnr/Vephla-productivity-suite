let chatClient;

class ChatClient {
    constructor() {
        this.socket = null;
        this.token = localStorage.getItem('authToken');
        this.currentRoom = null;
        this.currentUser = null;
        
        // Initialize UI
        this.initializeUI();
        
        // If we have a token, try to connect
        if (this.token) {
            this.showChatSection();
            this.connectSocket();
        }
    }
    
    initializeUI() {
        // Allow Enter key to send message
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Allow Enter key to join room
        document.getElementById('roomName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.joinRoom();
            }
        });
        
        // Add event listeners for all buttons
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        document.getElementById('registerBtn').addEventListener('click', () => this.register());
        document.getElementById('testConnectionBtn').addEventListener('click', () => this.testConnection());
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.joinRoom());
        document.getElementById('leaveRoomBtn').addEventListener('click', () => this.leaveRoom());
        document.getElementById('getHistoryBtn').addEventListener('click', () => this.getHistory());
        document.getElementById('sendMessageBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('clearMessagesBtn').addEventListener('click', () => this.clearMessages());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    }
    
    async register() {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        this.showAuthStatus('Registering...', 'success');
        
        // First test if server is reachable
        try {
            const healthResponse = await fetch('/health');
            console.log('Health check response:', healthResponse.status);
            if (!healthResponse.ok) {
                throw new Error('Server not reachable');
            }
        } catch (healthError) {
            console.error('Health check failed:', healthError);
            this.showAuthStatus('Cannot connect to server. Is it running?', 'error');
            return;
        }
        
        if (!name || !email || !password) {
            this.showAuthStatus('Please enter name, email and password', 'error');
            return;
        }
        
        try {
            console.log('Sending register request to /auth/register');
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });
            
            console.log('Register response status:', response.status);
            const data = await response.json();
            console.log('Register response data:', data);
            
            if (response.ok) {
                this.showAuthStatus('Registration successful! Please login.', 'success');
            } else {
                const errorMessage = data.error?.message || data.message || 'Registration failed';
                this.showAuthStatus(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showAuthStatus('Network error: ' + error.message, 'error');
        }
    }
    
    async login() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        this.showAuthStatus('Logging in...', 'success');
        
        // First test if server is reachable
        try {
            const healthResponse = await fetch('/health');
            console.log('Health check response:', healthResponse.status);
            if (!healthResponse.ok) {
                throw new Error('Server not reachable');
            }
        } catch (healthError) {
            console.error('Health check failed:', healthError);
            this.showAuthStatus('Cannot connect to server. Is it running?', 'error');
            return;
        }
        
        if (!email || !password) {
            this.showAuthStatus('Please enter email and password', 'error');
            return;
        }
        
        try {
            console.log('Sending login request to /auth/login');
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            console.log('Login response status:', response.status);
            const data = await response.json();
            console.log('Login response data:', data);
            
            if (response.ok) {
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('authToken', this.token);
                
                this.showAuthStatus('Login successful!', 'success');
                this.showChatSection();
                this.connectSocket();
            } else {
                const errorMessage = data.error?.message || data.message || 'Login failed';
                this.showAuthStatus(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAuthStatus('Network error: ' + error.message, 'error');
        }
    }
    
    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        
        if (this.socket) {
            this.socket.disconnect();
        }
        
        this.showAuthSection();
        this.addMessage('Logged out', 'system');
    }
    
    connectSocket() {
        if (this.socket) {
            this.socket.disconnect();
        }
        
        this.socket = io('http://localhost:3000', {
            auth: {
                token: this.token
            }
        });
        
        this.setupSocketListeners();
    }
    
    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateConnectionStatus(true);
            this.addMessage('Connected to server', 'system');
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateConnectionStatus(false);
            this.addMessage('Disconnected from server', 'system');
            this.currentRoom = null;
            this.updateRoomControls();
        });
        
        this.socket.on('room_joined', (data) => {
            console.log('Joined room:', data);
            this.currentRoom = data.room;
            this.updateRoomControls();
            this.addMessage(`Joined room: ${data.room}`, 'system');
        });
        
        this.socket.on('room_left', (data) => {
            console.log('Left room:', data);
            this.currentRoom = null;
            this.updateRoomControls();
            this.addMessage(`Left room: ${data.room}`, 'system');
        });
        
        this.socket.on('new_message', (message) => {
            console.log('New message:', message);
            const isOwn = message.sender._id === this.currentUser?.id;
            this.addMessage(
                `${message.sender.name}: ${message.content}`,
                isOwn ? 'own' : 'user'
            );
        });
        
        this.socket.on('message_edited', (data) => {
            console.log('Message edited:', data);
            this.addMessage(
                `${data.message.sender.name} edited: ${data.message.content}`,
                'system'
            );
        });
        
        this.socket.on('message_deleted', (data) => {
            console.log('Message deleted:', data);
            this.addMessage(
                `Message deleted by ${data.deletedBy.name}`,
                'system'
            );
        });
        
        this.socket.on('user_joined', (data) => {
            console.log('User joined:', data);
            this.addMessage(`${data.user.name} joined the room`, 'system');
        });
        
        this.socket.on('user_left', (data) => {
            console.log('User left:', data);
            this.addMessage(`${data.user.name} left the room`, 'system');
        });
        
        this.socket.on('chat_history', (data) => {
            console.log('Chat history:', data);
            this.addMessage(`--- Chat History (${data.messages.length} messages) ---`, 'system');
            data.messages.forEach(message => {
                const isOwn = message.sender._id === this.currentUser?.id;
                this.addMessage(
                    `${message.sender.name}: ${message.content}`,
                    isOwn ? 'own' : 'user'
                );
            });
            this.addMessage('--- End of History ---', 'system');
        });
        
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.addMessage(`Error: ${error.message}`, 'system');
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.addMessage(`Connection error: ${error.message}`, 'system');
            this.updateConnectionStatus(false);
        });
    }
    
    joinRoom() {
        const roomName = document.getElementById('roomName').value.trim();
        if (!roomName) {
            this.addMessage('Please enter a room name', 'system');
            return;
        }
        
        if (!this.socket || !this.socket.connected) {
            this.addMessage('Not connected to server', 'system');
            return;
        }
        
        this.socket.emit('join_room', { room: roomName });
    }
    
    leaveRoom() {
        if (!this.currentRoom) {
            this.addMessage('Not in any room', 'system');
            return;
        }
        
        this.socket.emit('leave_room', { room: this.currentRoom });
    }
    
    sendMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();
        
        if (!content) {
            return;
        }
        
        if (!this.currentRoom) {
            this.addMessage('Please join a room first', 'system');
            return;
        }
        
        if (!this.socket || !this.socket.connected) {
            this.addMessage('Not connected to server', 'system');
            return;
        }
        
        this.socket.emit('send_message', {
            room: this.currentRoom,
            content: content,
            type: 'text'
        });
        
        input.value = '';
    }
    
    getHistory() {
        if (!this.currentRoom) {
            this.addMessage('Please join a room first', 'system');
            return;
        }
        
        this.socket.emit('get_history', {
            room: this.currentRoom,
            page: 1,
            limit: 20
        });
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
    
    clearMessages() {
        document.getElementById('messages').innerHTML = '';
    }
    
    async testConnection() {
        try {
            console.log('Testing server connection...');
            const response = await fetch('/health');
            console.log('Health response:', response);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Health data:', data);
                this.showAuthStatus('✅ Server connection successful!', 'success');
            } else {
                this.showAuthStatus('❌ Server responded with error: ' + response.status, 'error');
            }
        } catch (error) {
            console.error('Connection test failed:', error);
            this.showAuthStatus('❌ Cannot connect to server: ' + error.message, 'error');
        }
    }
    
    addMessage(content, type = 'user') {
        const messagesDiv = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        messageDiv.innerHTML = `<span style="color: #666; font-size: 0.8em;">[${timestamp}]</span> ${content}`;
        
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    updateConnectionStatus(connected) {
        const statusDiv = document.getElementById('connectionStatus');
        if (connected) {
            statusDiv.textContent = 'Connected';
            statusDiv.className = 'status connected';
        } else {
            statusDiv.textContent = 'Disconnected';
            statusDiv.className = 'status disconnected';
        }
    }
    
    updateRoomControls() {
        const joinBtn = document.getElementById('joinRoomBtn');
        const leaveBtn = document.getElementById('leaveRoomBtn');
        const sendBtn = document.getElementById('sendMessageBtn');
        const messageInput = document.getElementById('messageInput');
        
        if (this.currentRoom) {
            joinBtn.disabled = true;
            leaveBtn.disabled = false;
            sendBtn.disabled = false;
            messageInput.disabled = false;
            messageInput.placeholder = `Type a message in ${this.currentRoom}...`;
        } else {
            joinBtn.disabled = false;
            leaveBtn.disabled = true;
            sendBtn.disabled = true;
            messageInput.disabled = true;
            messageInput.placeholder = 'Join a room to start chatting...';
        }
    }
    
    showAuthSection() {
        document.getElementById('authSection').style.display = 'block';
        document.getElementById('chatSection').style.display = 'none';
    }
    
    showChatSection() {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('chatSection').style.display = 'block';
    }
    
    showAuthStatus(message, type) {
        const statusDiv = document.getElementById('authStatus');
        statusDiv.textContent = message;
        statusDiv.className = type === 'success' ? 'status connected' : 'status disconnected';
        
        // Clear after 3 seconds
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = '';
        }, 3000);
    }
}

// Initialize the chat client when the page loads
document.addEventListener('DOMContentLoaded', () => {
    chatClient = new ChatClient();
});