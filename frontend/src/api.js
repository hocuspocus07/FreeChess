import axios from 'axios';
const API_BASE_URL = 'http://localhost:8000'; 

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/chess/users/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const loginUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/chess/users/login`, userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const logoutUser = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/chess/users/logout`,
      {},
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: error.message };
  }
};

export const getUserDetails = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chess/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
export const getAllGamesByUser=async (userId)=>{
  try {
    const response=await axios.get(`${API_BASE_URL}/chess/game/user/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}
// Game Management
export const createGame = async (gameData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/chess/game/create`, gameData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getGameDetails = async (gameId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chess/game/${gameId}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateGameStatus = async (gameId, status) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/chess/game/${gameId}/status`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const setGameWinner = async (gameId, winnerId) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/chess/game/${gameId}/winner`,
      { winnerId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Move Management
export const addMove = async (gameId, moveData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/chess/moves/${gameId}/moves`,
      moveData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getMoves = async (gameId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chess/moves/${gameId}/moves`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Analytics and History
export const getUserGames = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chess/users/${userId}/games`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getRecentMatches = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chess/users/${userId}/recent-matches`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};