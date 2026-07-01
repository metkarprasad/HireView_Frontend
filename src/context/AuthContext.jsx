import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set default authorization header if token exists
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  // Check if token is valid on load
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // Get updated profile to verify token validity
          const res = await axios.get(`${API_URL}/interviews/analytics/dashboard`);
          // Note: If analytics succeeded, the user token is valid.
          // We can fetch user from localStorage
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            // Logged in but user details missing, set mock/placeholder username from token context or call profile
            setUser({ username: 'Interviewee', email: '' });
          }
        } catch (err) {
          console.error('Session expired or invalid token');
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token: userToken, user: userData } = res.data;
      
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(userToken);
      setUser(userData);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (username, email, password) => {
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/signup`, { username, email, password });
      const { token: userToken, user: userData } = res.data;

      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(userToken);
      setUser(userData);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (username, email, password) => {
    setError(null);
    try {
      const payload = { username, email };
      if (password) payload.password = password;

      const res = await axios.put(`${API_URL}/auth/profile`, payload);
      const { user: updatedUserData } = res.data;

      localStorage.setItem('user', JSON.stringify(updatedUserData));
      setUser(updatedUserData);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Profile update failed.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        apiUrl: API_URL
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
