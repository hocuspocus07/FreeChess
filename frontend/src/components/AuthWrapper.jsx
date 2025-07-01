import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { refreshAccessToken } from '../api.js';

const AuthWrapper = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login', { state: { message: 'Please log in to continue' } });
        return;
      }

      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          try {
            const newToken = await refreshAccessToken();
            if (!newToken) throw new Error('Refresh failed');
            localStorage.setItem('token', newToken);
          } catch (refreshError) {
            throw new Error('Session expired');
          }
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        navigate('/login', { state: { message: 'Session expired. Please log in again.' } });
      }
    };

    checkAuth();
  }, [navigate]);

  return children;
};

export default AuthWrapper;