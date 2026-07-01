import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Page Imports
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Interview from './pages/Interview';
import HistoryDetail from './pages/HistoryDetail';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col transition-colors duration-300 dark:bg-darkBg bg-lightBg dark:text-slate-100 text-slate-800">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview/:id"
                element={
                  <ProtectedRoute>
                    <Interview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history/:id"
                element={
                  <ProtectedRoute>
                    <HistoryDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
