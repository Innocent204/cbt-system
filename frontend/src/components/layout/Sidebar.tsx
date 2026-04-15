import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  BarChart3,
  LogOut,
  UserCheck,
  Edit3,
  Award,
  Settings,
  HelpCircle,
  ChevronRight,
  Bell
} from 'lucide-react';
import authService from '../../services/authService';
import statsService, { AdminStats, ExaminerStats, StudentStats } from '../../services/statsService';
import Logo from '../common/Logo';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  userRole: 'admin' | 'examiner' | 'student';
  userName: string;
}

interface MenuItem {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  badge?: string | number;
  description?: string;
  gradient?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, userRole, userName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePath, setActivePath] = useState(location.pathname);
  const [stats, setStats] = useState<AdminStats | ExaminerStats | StudentStats | null>(null);

  useEffect(() => {
    const updateActivePath = () => {
      setActivePath(location.pathname);
    };

    updateActivePath();
  }, [location.pathname]);

  const fetchStats = async () => {
    let response;
    if (userRole === 'admin') {
      response = await statsService.getAdminStats();
    } else if (userRole === 'examiner') {
      response = await statsService.getExaminerStats();
    } else {
      response = await statsService.getStudentStats();
    }

    if (response.success && response.data) {
      setStats(response.data);
    }
  };

  useEffect(() => {
    fetchStats();
    // Poll every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [userRole]);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const getAdminMenuItems = (): MenuItem[] => [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      onClick: () => navigate('/admin'),
      description: 'System overview',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'User Management',
      icon: Users,
      onClick: () => navigate('/admin/users'),
      description: 'Manage users',
      badge: (stats as AdminStats)?.users_badge,
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Courses & Exams',
      icon: BookOpen,
      onClick: () => navigate('/admin/courses'),
      description: 'Course content',
      badge: (stats as AdminStats)?.courses_badge,
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      title: 'System Reports',
      icon: BarChart3,
      onClick: () => navigate('/admin/reports'),
      description: 'Analytics',
      gradient: 'from-orange-500 to-red-600'
    },
    {
      title: 'Results',
      icon: Award,
      onClick: () => navigate('/admin/results'),
      description: 'View results',
      gradient: 'from-yellow-500 to-orange-600'
    },
    {
      title: 'System Maintenance',
      icon: Settings,
      onClick: () => navigate('/admin/maintenance'),
      description: 'Global config',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'My Profile',
      icon: UserCheck,
      onClick: () => navigate('/admin/settings'),
      description: 'Edit profile',
      gradient: 'from-indigo-500 to-violet-600'
    }
  ];

  const getExaminerMenuItems = (): MenuItem[] => [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      onClick: () => navigate('/examiner'),
      description: 'Overview',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'Question Bank',
      icon: Edit3,
      onClick: () => navigate('/examiner/questions'),
      description: 'Questions',
      badge: (stats as ExaminerStats)?.questions_badge,
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Create Exam',
      icon: FileText,
      onClick: () => navigate('/examiner/create-exam'),
      description: 'New exam',
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      title: 'Exam Results',
      icon: BarChart3,
      onClick: () => navigate('/examiner/results'),
      description: 'Results',
      badge: (stats as ExaminerStats)?.results_badge,
      gradient: 'from-orange-500 to-red-600'
    },
    {
      title: 'Manual Grading',
      icon: UserCheck,
      onClick: () => navigate('/examiner/grading'),
      description: 'Essay review',
      gradient: 'from-indigo-500 to-purple-600'
    }
  ];

  const getStudentMenuItems = (): MenuItem[] => [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      onClick: () => navigate('/student'),
      description: 'Home',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'My Exams',
      icon: FileText,
      onClick: () => navigate('/student/exams'),
      description: 'Available',
      badge: (stats as StudentStats)?.exams_badge,
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Results',
      icon: Award,
      onClick: () => navigate('/student/results'),
      description: 'Performance',
      gradient: 'from-emerald-500 to-teal-600'
    }
  ];

  const getMenuItems = (): MenuItem[] => {
    switch (userRole) {
      case 'admin': return getAdminMenuItems();
      case 'examiner': return getExaminerMenuItems();
      case 'student': return getStudentMenuItems();
      default: return getStudentMenuItems();
    }
  };

  const menuItems = getMenuItems();

  const isActiveRoute = (item: MenuItem) => {
    const itemPath = item.onClick.toString().match(/navigate\('([^']+)'\)/)?.[1];
    return itemPath && activePath.startsWith(itemPath);
  };

  return (
    <div className={`relative h-full bg-dark-primary border-r border-dark-border-primary transition-all duration-300 ${isOpen ? 'w-72' : 'w-0 lg:w-16'} min-h-screen shadow-xl flex-shrink-0 overflow-hidden`}>
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/60 dark:border-dark-border-primary flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Toggle */}
            <button
              onClick={onToggle}
              className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-surface hover:bg-opacity-80 transition-all duration-200 group flex-shrink-0"
            >
              {isOpen ? (
                <X size={20} className="text-gray-600 dark:text-dark-text-tertiary group-hover:text-gray-900 dark:group-hover:text-dark-text-primary transition-colors" />
              ) : (
                <Menu size={20} className="text-gray-600 dark:text-dark-text-tertiary group-hover:text-gray-900 dark:group-hover:text-dark-text-primary transition-colors" />
              )}
            </button>

            {/* Logo Section */}
            {isOpen && (
              <div className="flex items-center">
                <Logo
                  size={42}
                  showText={true}
                  className="transition-all duration-300"
                />
              </div>
            )}

            {/* Desktop Toggle Button - Hidden on mobile */}
            <button
              onClick={onToggle}
              className="hidden lg:block p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-surface hover:bg-opacity-80 transition-all duration-200 group flex-shrink-0"
            >
              {isOpen ? (
                <X size={20} className="text-gray-600 dark:text-dark-text-tertiary group-hover:text-gray-900 dark:group-hover:text-dark-text-primary transition-colors" />
              ) : (
                <Menu size={20} className="text-gray-600 dark:text-dark-text-tertiary group-hover:text-gray-900 dark:group-hover:text-dark-text-primary transition-colors" />
              )}
            </button>
          </div>
        </div>

        {/* User Profile Section - Only show when sidebar is open */}
        {isOpen && (
          <div className="p-6 border-b border-dark-border-primary flex-shrink-0">
            <div className="bg-gradient-to-r from-dark-secondary to-dark-tertiary rounded-2xl p-4 border border-dark-border-primary">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-dark-text-primary truncate">{userName}</p>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary capitalize">{userRole}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400 dark:text-dark-text-muted" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation - Only show when sidebar is open */}
        {isOpen && (
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => {
              const isActive = isActiveRoute(item);
              const Icon = item.icon;

              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={`group relative w-full flex items-center space-x-4 p-4 rounded-[1.25rem] transition-all duration-500 ${isActive
                    ? 'bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 shadow-lg shadow-blue-500/5'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 border border-transparent'
                    }`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                  )}

                  {/* Icon */}
                  <div className={`relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${isActive
                    ? `bg-gradient-to-br ${item.gradient} text-white shadow-lg`
                    : 'bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-dark-text-tertiary group-hover:text-gray-900 dark:group-hover:text-dark-text-primary'
                    }`}>
                    <Icon size={18} />
                    {item.badge !== undefined && item.badge !== null && item.badge !== 0 && item.badge !== '0' && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-dark-primary">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left">
                    <div className={`font-semibold text-sm ${isActive ? 'text-gray-900 dark:text-dark-text-primary' : 'text-gray-700 dark:text-dark-text-secondary group-hover:text-gray-900 dark:group-hover:text-dark-text-primary'}`}>
                      {item.title}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-500 dark:text-dark-text-muted mt-0.5">{item.description}</div>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  {isActive && (
                    <ChevronRight size={16} className="text-blue-600 dark:text-dark-accent-blue" />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Bottom Section - Only show when sidebar is open */}
        {isOpen && (
          <div className="p-4 border-t border-gray-200/60 dark:border-dark-border-primary space-y-2 flex-shrink-0">
            {/* Settings, Notifications & Help */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {/* Settings — shown for examiner/student in dock; admin uses My Profile nav item */}
              {userRole !== 'admin' && (
                <button
                  onClick={() => {
                    const settingsPath = userRole === 'examiner' ? '/examiner/settings' : '/student/settings';
                    navigate(settingsPath);
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-dark-surface hover:bg-dark-surfaceHover transition-colors group border border-dark-border-primary"
                >
                  <Settings size={16} className="text-gray-600 dark:text-dark-text-tertiary group-hover:text-gray-900 dark:group-hover:text-dark-text-primary mb-1" />
                  <span className="text-xs text-gray-700 dark:text-dark-text-secondary group-hover:text-gray-900 dark:group-hover:text-dark-text-primary text-center">Settings</span>
                </button>
              )}
              <button
                onClick={() => {
                  const notificationsPath = userRole === 'admin' ? '/admin/notifications' :
                    userRole === 'examiner' ? '/examiner/notifications' :
                      '/student/notifications';
                  navigate(notificationsPath);
                }}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 dark:bg-dark-surface hover:bg-gray-100 dark:hover:bg-dark-surfaceHover transition-colors group border border-transparent dark:border-dark-border-primary relative"
              >
                <Bell size={16} className="text-gray-600 dark:text-dark-text-tertiary group-hover:text-gray-900 dark:group-hover:text-dark-text-primary mb-1" />
                <span className="text-xs text-gray-700 dark:text-dark-text-secondary group-hover:text-gray-900 dark:group-hover:text-dark-text-primary text-center">Notifications</span>
                {stats?.unread_notifications !== undefined && stats.unread_notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-dark-primary">
                    {stats.unread_notifications}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  const helpPath = userRole === 'admin' ? '/admin/help' :
                    userRole === 'examiner' ? '/examiner/help' :
                      '/student/help';
                  navigate(helpPath);
                }}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 dark:bg-dark-surface hover:bg-gray-100 dark:hover:bg-dark-surfaceHover transition-colors group border border-transparent dark:border-dark-border-primary"
              >
                <HelpCircle size={16} className="text-gray-600 dark:text-dark-text-tertiary group-hover:text-gray-900 dark:group-hover:text-dark-text-primary mb-1" />
                <span className="text-xs text-gray-700 dark:text-dark-text-secondary group-hover:text-gray-900 dark:group-hover:text-dark-text-primary text-center">Help</span>
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-4 p-3.5 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 dark:from-dark-error/10 dark:to-dark-error/5 hover:from-red-100 hover:to-pink-100 dark:hover:from-dark-error/15 dark:hover:to-dark-error/10 border border-red-200/60 dark:border-dark-error/30 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 dark:from-dark-error dark:to-red-600 flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow">
                <LogOut size={18} />
              </div>
              <span className="font-semibold text-red-700 dark:text-dark-error group-hover:text-red-800 dark:group-hover:text-dark-error">Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
