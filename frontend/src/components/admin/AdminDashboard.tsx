import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import authService from '../../services/authService';
import DashboardLayout from '../layout/DashboardLayout';
import LoadingScreen from '../common/LoadingScreen';

// Lazy load admin components
const AdminOverview = React.lazy(() => import('./AdminOverview'));
const UserManagement = React.lazy(() => import('./UserManagement'));
const CourseExamManagement = React.lazy(() => import('./CourseExamManagement'));
const SystemReports = React.lazy(() => import('./SystemReports'));
const ResultsManagement = React.lazy(() => import('./ResultsManagement'));
const SystemMaintenance = React.lazy(() => import('./SystemMaintenance'));
const ProfileSettings = React.lazy(() => import('../profile/ProfileSettings'));

const AdminDashboard: React.FC = () => {
  const user = authService.getCurrentUser();

  return (
    <DashboardLayout userName={user?.username || 'Admin'}>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/courses" element={<CourseExamManagement />} />
          <Route path="/reports" element={<SystemReports />} />
          <Route path="/results" element={<ResultsManagement />} />
          <Route path="/settings" element={<ProfileSettings />} />
          <Route path="/maintenance" element={<SystemMaintenance />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
};

export default AdminDashboard;
