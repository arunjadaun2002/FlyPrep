import { API_BASE_URL, API_ENDPOINTS } from '../config';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(data.message || 'Something went wrong', response.status);
  }
  return data;
};

// Helper function to ensure room ID is uppercase
const normalizeRoomId = (roomId) => {
  return roomId ? roomId.toString().toUpperCase() : '';
};

export const createRoom = async (roomData) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CREATE_ROOM}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roomData),
    });
    return handleResponse(response);
  } catch (error) {
    throw new ApiError(error.message || 'Failed to create room', 500);
  }
};

export const joinRoom = async (roomId, participantData) => {
  try {
    const normalizedRoomId = normalizeRoomId(roomId);
    console.log('Joining room with ID:', normalizedRoomId);
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.JOIN_ROOM}/${normalizedRoomId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(participantData),
    });
    return handleResponse(response);
  } catch (error) {
    throw new ApiError(error.message || 'Failed to join room', 500);
  }
};

export const getRoom = async (roomId) => {
  try {
    const normalizedRoomId = normalizeRoomId(roomId);
    console.log('Getting room with ID:', normalizedRoomId);
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_ROOM}/${normalizedRoomId}`);
    return handleResponse(response);
  } catch (error) {
    throw new ApiError(error.message || 'Failed to get room details', 500);
  }
};

export const updateParticipant = async (roomId, participantId, updateData) => {
  try {
    const normalizedRoomId = normalizeRoomId(roomId);
    console.log('Updating participant in room:', normalizedRoomId);
    
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.UPDATE_PARTICIPANT}/${normalizedRoomId}/${participantId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }
    );
    return handleResponse(response);
  } catch (error) {
    throw new ApiError(error.message || 'Failed to update participant', 500);
  }
}; 