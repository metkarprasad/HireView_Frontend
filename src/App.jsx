import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Lazy load all pages for code-splitting and load isolation
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Interview = lazy(() => import('./pages/Interview'));
const HistoryDetail = lazy(() => import('./pages/HistoryDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const LiveInterview = lazy(() => import('./pages/LiveInterview'));

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <div className="min-h-screen flex flex-col transition-colors duration-300 dark:bg-darkBg bg-lightBg dark:text-slate-100 text-slate-800">
              <Navbar />
              <main className="flex-grow">
                <Suspense fallback={
                  <div className="min-h-[calc(100vh-4rem)] dark:bg-darkBg bg-lightBg flex flex-col justify-center items-center">
                    <div className="relative w-12 h-12">
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/20 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                  </div>
                }>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/verify-otp" element={<VerifyEmail />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />

                    {/* Protected Routes */}
                    {/* Live Interview Route */}
                    <Route path="/live-interview/:id" element={<ProtectedRoute><LiveInterview /></ProtectedRoute>} />
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
                </Suspense>
              </main>
            </div>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
