import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5635/api';

// Global request interceptor to always attach Bearer token if available
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Set default authorization header if token exists
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  // Synchronize on mount and token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const storedUser = localStorage.getItem('user');
      if (storedUser && !user) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          logout();
        }
      }
    }
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
      const code = err.response?.data?.code;
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
      return {
        success: false,
        code,
        email: err.response?.data?.email || email,
        message: msg,
      };
    }
  };

  const register = async (username, email, password) => {
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/signup`, { username, email, password });
      return {
        success: true,
        requiresVerification: res.data.requiresVerification,
        email: res.data.email || email,
        message: res.data.message,
      };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const verifyOtp = async (email, otp, purpose = 'EMAIL_VERIFICATION') => {
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp, purpose });
      return {
        success: true,
        message: res.data.message,
        resetToken: res.data.resetToken,
      };
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const resendOtp = async (email, purpose = 'EMAIL_VERIFICATION') => {
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/resend-otp`, { email, purpose });
      return {
        success: true,
        message: res.data.message,
      };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code.';
      const retryAfter = err.response?.data?.retryAfter;
      setError(msg);
      return { success: false, message: msg, retryAfter };
    }
  };

  const forgotPassword = async (email) => {
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/forgotpassword`, { email });
      return {
        success: true,
        message: res.data.message,
        email: res.data.email || email,
      };
    } catch (err) {
      const msg = err.response?.data?.message || 'Password reset request failed.';
      const retryAfter = err.response?.data?.retryAfter;
      setError(msg);
      return { success: false, message: msg, retryAfter };
    }
  };

  const resetPassword = async (resetToken, newPassword) => {
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/resetpassword`, { resetToken, newPassword });
      return {
        success: true,
        message: res.data.message,
      };
    } catch (err) {
      const msg = err.response?.data?.message || 'Password reset failed.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const loginWithToken = (userToken, userData) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
    setToken(userToken);
    setUser(userData);
    setError(null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
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
        loginWithToken,
        register,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        logout,
        updateProfile,
        apiUrl: API_URL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
