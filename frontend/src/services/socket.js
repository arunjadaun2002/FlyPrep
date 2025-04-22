import { WS_BASE_URL } from '../config';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(roomId) {
    this.socket = new WebSocket(`${WS_BASE_URL}/ws/room/${roomId}`);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.emit('connection', { status: 'connected' });
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit(data.type, data.payload);
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.emit('connection', { status: 'disconnected' });
      // Attempt to reconnect after 3 seconds
      setTimeout(() => this.connect(roomId), 3000);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
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
      this.socket.send(JSON.stringify({ type, payload }));
    }
  }
}

export const socketService = new WebSocketService(); 