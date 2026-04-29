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
    navigate('/login', { replace: true });
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

  const getMenuItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          {
            category: 'OVERVIEW',
            items: [
              { title: 'Dashboard', icon: LayoutDashboard, onClick: () => navigate('/admin'), color: 'text-dark-accent-indigo' },
            ]
          },
          {
            category: 'MANAGEMENT',
            items: [
              { title: 'User Management', icon: Users, onClick: () => navigate('/admin/users'), color: 'text-dark-accent-rose', badge: (stats as AdminStats)?.users_badge },
              { title: 'Courses & Exams', icon: BookOpen, onClick: () => navigate('/admin/courses'), color: 'text-dark-accent-emerald', badge: (stats as AdminStats)?.courses_badge },
              { title: 'Results Management', icon: Award, onClick: () => navigate('/admin/results'), color: 'text-dark-accent-amber' },
            ]
          },
          {
            category: 'SYSTEM',
            items: [
              { title: 'Analytics Reports', icon: BarChart3, onClick: () => navigate('/admin/reports'), color: 'text-dark-accent-cyan' },
              { title: 'Maintenance', icon: Settings, onClick: () => navigate('/admin/maintenance'), color: 'text-dark-text-secondary' },
            ]
          }
        ];
      case 'examiner':
        return [
          {
            category: 'OVERVIEW',
            items: [
              { title: 'Dashboard', icon: LayoutDashboard, onClick: () => navigate('/examiner'), color: 'text-dark-accent-indigo' },
            ]
          },
          {
            category: 'EXAM SYSTEM',
            items: [
              { title: 'Question Bank', icon: Edit3, onClick: () => navigate('/examiner/questions'), color: 'text-dark-accent-rose', badge: (stats as ExaminerStats)?.questions_badge },
              { title: 'Create Exam', icon: FileText, onClick: () => navigate('/examiner/create-exam'), color: 'text-dark-accent-emerald' },
              { title: 'Manual Grading', icon: UserCheck, onClick: () => navigate('/examiner/grading'), color: 'text-dark-accent-amber' },
            ]
          },
          {
            category: 'REPORTS',
            items: [
              { title: 'Exam Results', icon: BarChart3, onClick: () => navigate('/examiner/results'), color: 'text-dark-accent-cyan', badge: (stats as ExaminerStats)?.results_badge },
            ]
          }
        ];
      default:
        return [
          {
            category: 'MAIN',
            items: [
              { title: 'Dashboard', icon: LayoutDashboard, onClick: () => navigate('/student'), color: 'text-dark-accent-indigo' },
              { title: 'My Exams', icon: FileText, onClick: () => navigate('/student/exams'), color: 'text-dark-accent-emerald', badge: (stats as StudentStats)?.exams_badge },
              { title: 'Exam Results', icon: Award, onClick: () => navigate('/student/results'), color: 'text-dark-accent-amber' },
            ]
          }
        ];
    }
  };

  const menuSections = getMenuItems();

  const isActiveRoute = (path: string) => {
    return activePath === path || (path !== '/admin' && path !== '/examiner' && path !== '/student' && activePath.startsWith(path));
  };

  return (
    <div className={`relative h-full bg-dark-secondary border-r border-dark-border-primary transition-all duration-300 ${isOpen ? 'w-64' : 'w-0 lg:w-20'} min-h-screen flex-shrink-0 flex flex-col overflow-hidden`}>
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-accent-indigo/5 to-transparent pointer-events-none" />

      {/* Logo Section */}
      <div className="p-6 flex items-center justify-between relative z-10">
        <div className={`transition-all duration-500 transform ${isOpen ? 'scale-100 opacity-100' : 'scale-75 opacity-0 lg:opacity-100 lg:scale-100'}`}>
          <Logo size={isOpen ? 38 : 32} showText={isOpen} />
        </div>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-dark-tertiary transition-colors text-dark-text-muted hover:text-dark-text-primary"
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-8 overflow-y-auto relative z-10 custom-scrollbar">
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            {isOpen && (
              <h3 className="px-4 text-[10px] font-black uppercase tracking-widest text-dark-text-muted opacity-50">
                {section.category}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item, itemIdx) => {
                const itemPath = item.onClick.toString().match(/navigate\('([^']+)'\)/)?.[1] || '';
                const active = isActiveRoute(itemPath);
                const Icon = item.icon;

                return (
                  <button
                    key={itemIdx}
                    onClick={item.onClick}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                      ${active 
                        ? 'bg-dark-tertiary text-dark-text-primary' 
                        : 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-tertiary/50'}
                    `}
                  >
                    {active && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute left-0 w-1 h-6 bg-dark-accent-indigo rounded-r-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    
                    <div className={`transition-transform duration-200 group-hover:scale-110 ${active ? item.color : 'text-dark-text-muted group-hover:text-dark-text-primary'}`}>
                      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                    </div>

                    {isOpen && (
                      <span className={`flex-1 text-left text-sm font-semibold tracking-tight ${active ? 'text-dark-text-primary' : 'text-dark-text-secondary'}`}>
                        {item.title}
                      </span>
                    )}

                    {item.badge !== undefined && item.badge !== null && item.badge !== 0 && (
                      <span className={`
                        px-1.5 py-0.5 rounded-md text-[10px] font-black
                        ${active ? 'bg-dark-accent-indigo text-white' : 'bg-dark-tertiary text-dark-text-muted'}
                      `}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Profile / Logout Section */}
      <div className="p-4 border-t border-dark-border-primary relative z-10 bg-dark-secondary">
        {isOpen ? (
          <div className="space-y-3">
            <div 
              onClick={() => navigate(`/${userRole}/settings`)}
              className="flex items-center gap-3 p-3 rounded-2xl bg-dark-tertiary/30 hover:bg-dark-tertiary transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dark-accent-indigo to-dark-accent-cyan flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/10">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-dark-text-primary truncate">{userName}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-dark-text-muted group-hover:text-dark-accent-indigo transition-colors">{userRole}</p>
              </div>
              <ChevronRight size={14} className="text-dark-text-muted group-hover:translate-x-1 transition-transform" />
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-dark-text-muted hover:text-dark-accent-rose hover:bg-dark-accent-rose/5 transition-all group"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-bold">Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-3 text-dark-text-muted hover:text-dark-accent-rose transition-colors"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
