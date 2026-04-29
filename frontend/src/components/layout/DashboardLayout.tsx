import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import authService from '../../services/authService';
import UserManagement from '../admin/UserManagement';
import CourseExamManagement from '../admin/CourseExamManagement';
import SystemReports from '../admin/SystemReports';
import QuestionBankManagement from '../examiner/QuestionBankManagement';
import { Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userName: userNameProp }) => {
  const currentUser = authService.getCurrentUser();
  const userName = userNameProp || currentUser?.username || 'User';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'examiner' | 'student'>('student');
  const location = useLocation();

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const updateUserRole = () => {
      const user = authService.getCurrentUser();
      const detectedRole = user?.role || 'student';
      setUserRole(detectedRole as 'admin' | 'examiner' | 'student');
    };

    updateUserRole();

    const handleStorageChange = () => {
      updateUserRole();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getDynamicContent = () => {
    const path = location.pathname;

    // Admin routes
    if (userRole === 'admin') {
      if (path === '/admin' || path === '/admin/') {
        return children;
      } else if (path.startsWith('/admin/users')) {
        return <UserManagement />;
      } else if (path.startsWith('/admin/courses')) {
        return <CourseExamManagement />;
      } else if (path.startsWith('/admin/reports')) {
        return <SystemReports />;
      }
    }

    // Examiner routes
    if (userRole === 'examiner') {
      if (path.startsWith('/examiner/questions')) {
        return <QuestionBankManagement />;
      }
    }

    // Student routes - Return children to allow tab navigation
    if (userRole === 'student') {
      if (path === '/student' || path === '/student/') {
        return children; // This allows the routes to work
      }
    }

    return children;
  };

  const content = getDynamicContent();
  const shouldUseDynamicContent = !!content;

  return (
    <div className="flex h-screen bg-dark-primary relative overflow-hidden text-dark-text-primary selection:bg-dark-accent-indigo/30">
      {/* Refined background accents */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.03),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(6,182,212,0.03),transparent_50%)] pointer-events-none" />
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Wrapper */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          userRole={userRole}
          userName={userName}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <Header userName={userName} />

        {/* Mobile Sidebar Toggle (Floating) */}
        {!sidebarOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden fixed left-6 bottom-6 z-50 p-4 rounded-2xl bg-dark-accent-indigo text-white shadow-2xl shadow-dark-accent-indigo/40 hover:bg-indigo-500 transition-all active:scale-95 border border-white/10"
          >
            <Menu size={24} />
          </motion.button>
        )}

        <main className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar">
          <div className="p-4 sm:p-6 lg:p-10 max-w-[1920px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {shouldUseDynamicContent ? content : children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

