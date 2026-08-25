import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg text-slate-100 flex flex-col justify-center items-center">
        {/* Cool modern spinner skeleton */}
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-indigo-400 font-medium tracking-wide animate-pulse">Initializing Session...</p>
      </div>
    );
  }

  // Check both in-memory state and localStorage fallback to avoid false redirects during transitions
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const isAuthenticated = Boolean(user || token || (storedToken && storedUser));

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
