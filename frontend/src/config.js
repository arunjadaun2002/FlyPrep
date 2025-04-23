// Determine if we're in development mode
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Use local backend in development, production backend otherwise
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000' 
  : 'https://flyprep-backend.onrender.com';

export const WS_BASE_URL = isDevelopment 
  ? 'ws://localhost:5000' 
  : 'wss://flyprep-backend.onrender.com';

export const API_ENDPOINTS = {
  CREATE_ROOM: '/api/rooms/create',
  JOIN_ROOM: '/api/rooms/join',
  GET_ROOM: '/api/rooms',
  UPDATE_PARTICIPANT: '/api/rooms/participant',
}; 