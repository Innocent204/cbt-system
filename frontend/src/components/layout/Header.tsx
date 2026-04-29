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
    navigate('/login', { replace: true });
  };

  const handleSettings = () => {
    navigate(`/${userRole}/settings`);
  };

  const handleHelp = () => {
    // Help functionality to be implemented
  };

  return (
    <>
    <header className="glass sticky top-0 z-30 transition-all duration-300 border-b border-dark-border-primary/50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Search Bar & Breadcrumbs */}
          <div className="flex items-center flex-1 min-w-0">
            {/* Mobile Logo */}
            <div className="lg:hidden mr-4">
              <Logo size={36} showText={false} />
            </div>

            {/* Breadcrumbs (Professional labels) */}
            <div className="hidden md:flex items-center gap-2 mr-8 text-[11px] font-black uppercase tracking-widest text-dark-text-muted">
              <span className="hover:text-dark-text-secondary cursor-pointer transition-colors">Portal</span>
              <span className="opacity-30">/</span>
              <span className="text-dark-accent-indigo">{getRoleDisplayName(userRole)}</span>
            </div>

            {/* Search Bar - Unified sleek styling */}
            <div className="flex-1 max-w-xl pr-4 lg:pr-8">
              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search size={16} className="text-dark-text-muted group-focus-within:text-dark-accent-indigo transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search architecture, data, exams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                  className="w-full pl-10 pr-4 py-2 bg-dark-tertiary/20 hover:bg-dark-tertiary/40 border border-dark-border-primary rounded-xl text-sm text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-4 focus:ring-dark-accent-indigo/10 focus:border-dark-accent-indigo focus:bg-dark-tertiary/60 transition-all duration-300"
                />
              </form>
            </div>
          </div>

          {/* Right Section - Notifications & User */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <NotificationBell />

            <div className="h-6 w-px bg-dark-border-primary mx-1 hidden sm:block" />

            {/* User Profile Hook */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-1 rounded-xl hover:bg-dark-tertiary transition-all group"
              >
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-bold text-dark-text-primary group-hover:text-dark-accent-indigo transition-colors leading-none">{userName}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-dark-text-muted mt-1 leading-none">
                    {getRoleDisplayName(userRole)}
                  </p>
                </div>
                <div className="relative">
                  <div className={`w-9 h-9 rounded-xl ${getRoleColor(userRole)} flex items-center justify-center text-white shadow-lg shadow-indigo-500/10`}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-lg bg-dark-secondary border-2 border-dark-primary flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              </button>

              {/* User Dropdown - Modernized */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-dark-secondary border border-dark-border-primary rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                  >
                    <div className="p-5 border-b border-dark-border-primary bg-dark-tertiary/20">
                      <p className="text-xs font-black uppercase tracking-widest text-dark-text-muted mb-1">Authenticated as</p>
                      <p className="font-bold text-dark-text-primary truncate">{userName}</p>
                      <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-white/10 ${getRoleBadgeColor(userRole)} shadow-sm`}>
                        {getRoleDisplayName(userRole)}
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      <button
                        onClick={handleSettings}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-tertiary transition-all group"
                      >
                        <Settings size={16} className="text-dark-text-muted group-hover:rotate-45 transition-transform" />
                        <span>Profile Settings</span>
                      </button>
                      <button
                        onClick={() => { setShowHelpModal(true); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-tertiary transition-all group"
                      >
                        <HelpCircle size={16} className="text-dark-text-muted transition-transform" />
                        <span>Support Logic</span>
                      </button>
                    </div>

                    <div className="p-2 border-t border-dark-border-primary">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-dark-accent-rose hover:bg-dark-accent-rose/5 transition-all group"
                      >
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>System Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
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
