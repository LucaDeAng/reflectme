import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import MobileMenu from '../components/common/MobileMenu';
import { 
  // Common icons
  Heart, ArrowLeft, LogOut, Settings, Bell, Search, Menu, X,
  // Client icons
  MessageSquare, LineChart, BookOpen, Brain, Target, Sparkles,
  // Therapist icons
  Users, FileText, BarChart2, Activity, Cloud, Download, Plus,
  // Enhanced therapist icons
  Shield, Video, BookOpen as Training, TrendingUp as Analytics,
  // Status icons
  CheckCircle, AlertCircle, Clock, ChevronRight
} from 'lucide-react';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

interface UnifiedLayoutProps {
  children?: React.ReactNode;
}

const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({ children }) => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    // Simulate loading state for smooth transitions
    setTimeout(() => setIsLoading(false), 300);
  }, [location.pathname]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return null; // Or a fallback UI

  // Get navigation items based on user role
  const getNavItems = (): NavItem[] => {
    if (!user) return [];

    if (user.role === 'patient' || user.role === 'client') {
      return [
        { icon: MessageSquare, label: '🤖 AI Companion', href: '/client/chat', badge: 2 },
        { icon: BookOpen, label: '📝 Smart Journal', href: '/client/journal' },
        { icon: Target, label: '🎯 My Progress', href: '/client' },
        { icon: Sparkles, label: '✨ Insights', href: '/client/insights' }
      ];
    }

    if (user.role === 'therapist') {
      return [
        { icon: Users, label: '👥 My Clients', href: '/therapist/clients', badge: 3 },
        { icon: Brain, label: '🧠 AI Assistant', href: '/therapist/ai-toolbox' },
        { icon: Analytics, label: '📊 Smart Analytics', href: '/therapist/analytics-hub' },
        { icon: MessageSquare, label: '💬 Secure Chat', href: '/therapist/communication-hub' }
      ];
    }

    return [];
  };

  const navItems = getNavItems();
  const isActive = (href: string) => {
    if (href === '/client' || href === '/therapist') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="loader mx-auto mb-4"></div>
          <p className="text-gray-600 animate-pulse">Loading...</p>
        </motion.div>
      </div>
    );
  }

  const roleConfig = {
    client: {
      title: 'Zentia AI',
      subtitle: '🤖 Your smart mental wellness companion',
      gradient: 'from-emerald-500 to-teal-600'
    },
    therapist: {
      title: 'Zentia Pro',
      subtitle: '🧠 AI-powered clinical excellence',
      gradient: 'from-purple-500 to-blue-600'
    }
  };

  const config = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.client;

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        items={navItems}
        title={config.title}
        subtitle={config.subtitle}
        user={user}
        onLogout={handleLogout}
      />

      {/* Desktop Sidebar */}
      <aside className={`
        ${isCollapsed ? 'w-16' : 'w-20 md:w-72'} 
        bg-white border-r border-neutral-200 flex-shrink-0 transition-all duration-300
        hidden md:flex flex-col
      `}>
        {/* Header */}
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center group">
              <div className={`w-10 h-10 bg-gradient-to-r ${config.gradient} rounded-2xl flex items-center justify-center shadow-soft`}>
                <Heart className="w-6 h-6 text-white" />
              </div>
              {!isCollapsed && (
                <div className="ml-3 hidden md:block">
                  <h1 className="text-lg font-bold text-neutral-900 group-hover:text-primary-600 transition-colors">
                    {config.title}
                  </h1>
                  <p className="text-xs text-neutral-500 leading-tight">
                    {config.subtitle}
                  </p>
                </div>
              )}
            </Link>
            
            {/* Collapse button - desktop only */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:block p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <Menu className="w-4 h-4 text-neutral-600" />
            </button>
            
            {/* Close button - mobile only */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-primary-400 to-secondary-400">
              <img 
                src={user.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${user.email}`}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            {!isCollapsed && (
              <div className="ml-3 hidden md:block">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-neutral-500 capitalize">
                  {user.role === 'patient' ? 'client' : user.role}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center p-3 rounded-xl transition-all duration-200 group
                  ${active 
                    ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm' 
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-neutral-500'} group-hover:scale-110 transition-transform`} />
                {!isCollapsed && (
                  <>
                    <span className="ml-3 font-medium hidden md:block">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="ml-auto bg-error-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="p-4 border-t border-neutral-200">
            <div className="space-y-2">
              {user.role === 'therapist' ? (
                <Link
                  to="/therapist/ai-toolbox"
                  className="flex items-center p-3 text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-md"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  <span className="hidden md:block font-medium">🚀 AI Power Tools</span>
                </Link>
              ) : (
                <Link
                  to="/client/chat"
                  className="flex items-center p-3 text-sm bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:from-green-600 hover:to-teal-600 transition-all duration-200 shadow-md"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  <span className="hidden md:block font-medium">💬 Talk to AI</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="p-4 border-t border-neutral-200 space-y-2">
          <Link
            to={user.role === 'therapist' ? '/therapist/settings' : '/client/settings'}
            className="flex items-center p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
            {!isCollapsed && (
              <span className="ml-3 hidden md:block">Settings</span>
            )}
          </Link>
          
          <button
            onClick={handleLogout}
            className="flex items-center p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && (
              <span className="ml-3 hidden md:block">Sign Out</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-neutral-200 px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile menu button - Larger touch target for mobile */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-3 -ml-1 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors mr-2"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6 text-neutral-600" />
              </motion.button>
              
              {/* Back button - Mobile optimized */}
              <motion.div whileTap={{ scale: 0.95 }}>
                <Link 
                  to="/" 
                  className="p-2 md:p-2 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors mr-2 md:mr-3"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-neutral-600" />
                </Link>
              </motion.div>
              
              {/* Page breadcrumb */}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-xl font-semibold text-neutral-900 capitalize truncate">
                  {location.pathname.split('/').pop() || 'Dashboard'}
                </h1>
                <p className="text-xs md:text-sm text-neutral-500 hidden sm:block">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Header actions - Mobile optimized */}
            <div className="flex items-center space-x-1 md:space-x-2">
              {/* Search (placeholder) - Hidden on small screens */}
              <motion.button 
                whileTap={{ scale: 0.95 }}
                className="hidden sm:flex p-3 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-neutral-600" />
              </motion.button>
              
              {/* Notifications - Larger touch target */}
              <motion.button 
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-neutral-600" />
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-error-500 rounded-full border-2 border-white"></span>
              </motion.button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-grow p-4 md:p-6 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default UnifiedLayout; 