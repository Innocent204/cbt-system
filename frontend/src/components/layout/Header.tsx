import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Settings, HelpCircle, X, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../../services/authService';
import CommandPalette from '../common/CommandPalette';
import NotificationBell from './NotificationBell';
import Logo from '../common/Logo';

interface HeaderProps {
  userName: string;
}

const Header: React.FC<HeaderProps> = ({ userName }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'examiner' | 'student'>('student');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    const updateUserRole = () => {
      const user = authService.getCurrentUser();
      const role = user?.role || 'student';
      setUserRole(role as 'admin' | 'examiner' | 'student');
    };

    updateUserRole();

    const handleStorageChange = () => {
      updateUserRole();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'examiner': return 'Examiner';
      case 'student': return 'Student';
      default: return 'User';
    }
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'admin': return 'bg-gradient-to-br from-red-500 to-red-600';
      case 'examiner': return 'bg-gradient-to-br from-emerald-500 to-emerald-600';
      case 'student': return 'bg-gradient-to-br from-blue-500 to-blue-600';
      default: return 'bg-gradient-to-br from-gray-500 to-gray-600';
    }
  };

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-200';
      case 'examiner': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'student': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      switch (userRole) {
        case 'admin': navigate(`/admin?search=${encodeURIComponent(searchQuery)}`); break;
        case 'examiner': navigate(`/examiner?search=${encodeURIComponent(searchQuery)}`); break;
        case 'student': navigate(`/student?search=${encodeURIComponent(searchQuery)}`); break;
      }
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const handleSettings = () => {
    navigate(`/${userRole}/settings`);
  };

  const handleHelp = () => {
    console.log('Opening help...');
  };

  return (
    <>
      <header className="glass sticky top-0 z-30 transition-all duration-300">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Search Bar & Mobile Logo */}
            <div className="flex items-center flex-1">
              {/* Mobile Logo */}
              <div className="lg:hidden mr-4">
                <Logo size={40} showText={true} />
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-2xl mx-4 lg:mx-8">
                <form onSubmit={handleSearch}>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-gray-400 group-focus-within:text-dark-accent-blue transition-colors" />
                    </div>
                    <input
                      type="text"
                      placeholder={`Search ${userRole === 'admin' ? 'users, courses, exams...' : userRole === 'examiner' ? 'questions, exams...' : 'exams, results...'}`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                      className="w-full pl-10 pr-16 py-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-sm text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-800 transition-all duration-300"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <kbd className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 bg-dark-tertiary border border-dark-border-primary rounded-lg text-[10px] text-dark-text-muted font-semibold group-focus-within:opacity-0 transition-opacity">
                        <span className="text-xs">⌘</span>
                        <span>K</span>
                      </kbd>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Section - Notifications & User */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <NotificationBell />

              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-surface hover:bg-opacity-80 transition-all duration-200 group"
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-slate-900 dark:text-white font-display">{userName}</div>
                    <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block border font-black uppercase tracking-wider ${getRoleBadgeColor(userRole)}`}>
                      {getRoleDisplayName(userRole)}
                    </div>
                  </div>
                  <div className={`w-9 h-9 ${getRoleColor(userRole)} rounded-full flex items-center justify-center ring-2 ring-white dark:ring-dark-secondary shadow-sm`}>
                    <User size={16} className="text-white" />
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-gray-200/60 dark:border-dark-border-primary overflow-hidden z-50">
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-secondary dark:to-dark-tertiary border-b border-gray-200 dark:border-dark-border-primary">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${getRoleColor(userRole)} rounded-full flex items-center justify-center`}>
                          <User size={18} className="text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-dark-text-primary">{userName}</p>
                          <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{getRoleDisplayName(userRole)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={handleSettings}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-surfaceHover transition-colors flex items-center space-x-3 group"
                      >
                        <Settings size={16} className="text-gray-400 dark:text-dark-text-muted group-hover:text-gray-600 dark:group-hover:text-dark-text-tertiary" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowHelpModal(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-surfaceHover transition-colors flex items-center space-x-3 group"
                      >
                        <HelpCircle size={16} className="text-gray-400 dark:text-dark-text-muted group-hover:text-gray-600 dark:group-hover:text-dark-text-tertiary" />
                        <span>Help & Support</span>
                      </button>
                      <div className="border-t border-gray-200 dark:border-dark-border-primary my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-dark-error hover:bg-red-50 dark:hover:bg-dark-error/10 transition-colors flex items-center space-x-3 group"
                      >
                        <LogOut size={16} className="text-red-500 dark:text-dark-error group-hover:text-red-600 dark:group-hover:text-dark-error" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Click outside to close user menu */}
        {showUserMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </header>
      <CommandPalette />

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setShowHelpModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg bg-white dark:bg-dark-surface rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden z-10"
          >
            <div className="p-8 sm:p-10">
              <div className="flex justify-between items-start mb-8">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <HelpCircle className="text-blue-500" size={32} />
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-dark-surfaceHover rounded-xl transition-colors"
                >
                  <X />
                </button>
              </div>

              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                AXIS Support
              </h3>
              <p className="text-slate-500 dark:text-dark-text-secondary mb-8 leading-relaxed">
                Need assistance with the Academix Intelligence System? Our support protocols are ready to help you navigate and optimize your experience.
              </p>

              <div className="space-y-4 mb-10">
                <div className="p-4 bg-slate-50 dark:bg-dark-secondary rounded-2xl border border-slate-100 dark:border-dark-border-primary flex items-center gap-4 group cursor-pointer hover:border-blue-500/50 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Knowledge Base</h4>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Access documentation</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-dark-secondary rounded-2xl border border-slate-100 dark:border-dark-border-primary flex items-center gap-4 group cursor-pointer hover:border-indigo-500/50 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Contact Administrator</h4>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Submit a priority ticket</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg hover:shadow-xl transition-all"
              >
                Understood
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default Header;
