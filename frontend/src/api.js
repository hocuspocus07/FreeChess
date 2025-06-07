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
    if (response.data && response.data.token && response.data.user) {
      localStorage.setItem('token', response.data.token); 
      localStorage.setItem('userId', response.data.user.id);
    }

    return response.data; 
  } catch (error) {
    throw error.response.data;
  }
};

export const logoutUser = async () => {
  const requestFunction = async () => {
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
  };

  try {
    const data = await makeAuthenticatedRequest(requestFunction);
    localStorage.removeItem('token');
    return data;
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
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
    if (response.status === 404) {
      return { games: [] }; // Return empty array for 404
    }
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}
// Game Management
export const createGame = async (gameData) => {
  try {
    const time_control = gameData.time_control || 600;
    const response = await axios.post(`${API_BASE_URL}/chess/game/create`, {
      ...gameData,
      time_control
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getGameDetails = async (gameId) => {
  try {
    const response = await fetch(`http://localhost:8000/chess/game/${gameId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      // Return null for 404 errors
      if (response.status === 404) {
        return { game: null };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching game details:', error);
    return { game: null };
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
    const response = await axios.get(`${API_BASE_URL}/chess/game/${gameId}/moves`);
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

export const refreshAccessToken = async () => {
  try {
    // Get refresh token from cookies (not localStorage)
    const refreshToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('refreshToken='))
      ?.split('=')[1];

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(
      'http://localhost:8000/chess/users/refresh-token',
      {}, // empty body since refresh token is in cookies
      {
        withCredentials: true // important for cookies
      }
    );

    const { accessToken } = response.data;
    localStorage.setItem('token', accessToken);
    return accessToken;
  } catch (error) {
    console.error('Refresh token failed:', error);
    // Clear invalid tokens and redirect to login
    localStorage.removeItem('token');
    document.cookie = 'refreshToken=; Max-Age=0; path=/;';
    window.location.href = '/login';
    throw error;
  }
};

export const makeAuthenticatedRequest = async (requestFunction) => {
  try {
    return await requestFunction(); 
  } catch (error) {
    if (error.response?.status === 401) {
      try {
        const newAccessToken = await refreshAccessToken();
        localStorage.setItem('token', newAccessToken); // Update the token in localStorage
        return await requestFunction(); // Retry the original request
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        throw refreshError;
      }
    } else {
      throw error; // Re-throw other errors
    }
  }
};

export const saveMatch = async (status, winnerId,userId,moveLog,time_control) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chess/game/save-bot-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        player1_id: userId, 
        player2_id: -1, 
        winner_id: winnerId, 
        status: status,
        moves: moveLog, 
        time_control: time_control
      }),
    });

    if (!response.ok) throw new Error('Failed to save match');

    const data = await response.json();
    console.log('Match saved successfully:', data);
  } catch (error) {
    console.error('Error saving match:', error);
  }
};

export const analyzeGame = async (gameId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chess/analyze/${gameId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    });

    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Analysis failed');
    }

    // Return either analysisResults or the full response data
    return response.data.analysisResults || response.data;
  } catch (error) {
    console.error('Error analyzing game:', error);
    throw error;
  }
};