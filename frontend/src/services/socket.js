import { WS_BASE_URL } from '../config';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.roomId = null;
  }

  connect(roomId) {
    // Store the room ID and ensure it's uppercase
    this.roomId = roomId.toUpperCase();
    console.log(`Connecting to WebSocket for room: ${this.roomId}`);
    
    // Close existing connection if any
    if (this.socket) {
      console.log('Closing existing connection');
      this.socket.close();
    }

    const wsUrl = `${WS_BASE_URL}/ws/room/${this.roomId}`;
    console.log(`WebSocket URL: ${wsUrl}`);
    
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log(`WebSocket connected to room: ${this.roomId}`);
      this.emit('connection', { status: 'connected', roomId: this.roomId });
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`WebSocket message received for room ${this.roomId}:`, data);
        this.emit(data.type, data.payload);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = () => {
      console.log(`WebSocket disconnected from room: ${this.roomId}`);
      this.emit('connection', { status: 'disconnected', roomId: this.roomId });
      // Only attempt to reconnect if we still have a room ID
      if (this.roomId) {
        console.log('Attempting to reconnect...');
        setTimeout(() => this.connect(this.roomId), 3000);
      }
    };

    this.socket.onerror = (error) => {
      console.error(`WebSocket error for room ${this.roomId}:`, error);
      this.emit('error', { error, roomId: this.roomId });
    };

    // Return a promise that resolves when the connection is established
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 5000);

      this.socket.addEventListener('open', () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });

      this.socket.addEventListener('error', () => {
        clearTimeout(timeout);
        reject(new Error('WebSocket connection failed'));
      }, { once: true });
    });
  }

  disconnect() {
    if (this.socket) {
      console.log(`Disconnecting from room: ${this.roomId}`);
      this.socket.close();
      this.socket = null;
    }
    this.roomId = null;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  send(type, payload) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log(`Sending message to room ${this.roomId}:`, { type, payload });
      this.socket.send(JSON.stringify({ type, payload }));
    } else {
      console.warn(`Cannot send message to room ${this.roomId}: socket not open`);
    }
  }
}

export const socketService = new WebSocketService(); 