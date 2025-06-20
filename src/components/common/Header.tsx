import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'Zentia' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if logout fails
      navigate('/');
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-neutral-200 py-4 px-4 md:px-6 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-soft"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="white"/>
              </svg>
            </motion.div>
            <h1 className="text-2xl font-bold text-neutral-800 ml-3 group-hover:text-primary-600 transition-colors">{title}</h1>
          </Link>
        </div>

        {user ? (
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-neutral-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-primary-200">
                <img 
                  src={user.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${user.email}`}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="hidden md:block text-sm font-medium text-neutral-700">{user.name}</span>
              <Menu className="w-5 h-5 text-neutral-500" />
            </motion.button>

            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-large py-2 z-10 border border-neutral-200"
              >
                <Link
                  to={user.role === 'therapist' ? '/therapist' : '/app'}
                  className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center rounded-xl mx-2 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4 mr-3" />
                  Dashboard
                </Link>
                <Link
                  to={`/${user.role}/settings`}
                  className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center rounded-xl mx-2 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </Link>
                <div className="border-t border-neutral-200 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center rounded-xl mx-2 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Link to="/about" className="text-neutral-600 hover:text-primary-600 font-medium transition-colors">
              About Us
            </Link>
            <Link to="/login" className="btn btn-ghost">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;