import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, User, LayoutDashboard, History, Menu, X, Briefcase } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true; // Default to dark mode
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b transition-colors duration-300 dark:bg-darkBg/80 dark:border-darkBorder dark:text-slate-100 bg-white/80 border-lightBorder text-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <span className="bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent hover:opacity-85 transition-opacity">
                HireView
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-normal">
                AI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/')
                    ? 'dark:bg-indigo-500/10 dark:text-indigo-400 bg-indigo-50 text-indigo-600'
                    : 'dark:text-slate-400 dark:hover:text-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                to="/profile"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/profile')
                    ? 'dark:bg-indigo-500/10 dark:text-indigo-400 bg-indigo-50 text-indigo-600'
                    : 'dark:text-slate-400 dark:hover:text-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <Link
                to="/Jobs"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/Jobs')
                    ? 'dark:bg-indigo-500/10 dark:text-indigo-400 bg-indigo-50 text-indigo-600'
                    : 'dark:text-slate-400 dark:hover:text-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Jobs
              </Link>
            </div>
          )}

          {/* Theme & User Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg transition-all border dark:border-darkBorder dark:bg-darkCard hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {user ? (
              <div className="hidden md:flex items-center gap-2 ml-2">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold dark:text-slate-200 text-slate-800">
                    {user.username}
                  </span>
                  <span className="text-[10px] dark:text-slate-400 text-slate-500">
                    Candidate
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 ml-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4 ml-4">
                <Link
                  to="/login"
                  className="text-sm font-medium dark:text-slate-300 text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg dark:text-slate-400 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t transition-all dark:bg-darkCard dark:border-darkBorder bg-white border-lightBorder py-3 px-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium transition-all ${
              isActive('/')
                ? 'dark:bg-indigo-500/10 dark:text-indigo-400 bg-indigo-50 text-indigo-600'
                : 'dark:text-slate-400 dark:hover:text-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            to="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium transition-all ${
              isActive('/profile')
                ? 'dark:bg-indigo-500/10 dark:text-indigo-400 bg-indigo-50 text-indigo-600'
                : 'dark:text-slate-400 dark:hover:text-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User className="w-5 h-5" />
            Profile
          </Link>
          <Link to="/Jobs" onClick ={()=>{setMobileMenuOpen(false)}} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium transition-all ${isActive('/Jobs') ? 'dark:bg-indigo-500/10 dark:text-indigo-400 bg-indigo-50 text-indigo-600' : 'dark:text-slate-400 dark:hover:text-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
            <Briefcase className="w-5 h-5" />
            Jobs
          </Link>
          <div className="border-t dark:border-darkBorder border-lightBorder pt-3 flex items-center justify-between px-3">
            <div className="flex flex-col">
              <span className="text-sm font-semibold dark:text-slate-200 text-slate-800">
                {user.username}
              </span>
              <span className="text-[10px] dark:text-slate-400 text-slate-500">
                {user.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
