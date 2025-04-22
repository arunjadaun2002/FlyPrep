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
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.JOIN_ROOM}/${roomId}`, {
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
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_ROOM}/${roomId}`);
    return handleResponse(response);
  } catch (error) {
    throw new ApiError(error.message || 'Failed to get room details', 500);
  }
};

export const updateParticipant = async (roomId, participantId, updateData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.UPDATE_PARTICIPANT}/${roomId}/${participantId}`,
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