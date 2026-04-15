import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import authService from '../../services/authService';
import DashboardLayout from '../layout/DashboardLayout';
import LoadingScreen from '../common/LoadingScreen';

// Lazy load student components
const StudentOverview = React.lazy(() => import('./StudentOverview'));
const StudentExams = React.lazy(() => import('./StudentExams'));
const StudentResults = React.lazy(() => import('./StudentResults'));
const ProfileSettings = React.lazy(() => import('../profile/ProfileSettings'));

const StudentDashboard: React.FC = () => {
  const user = authService.getCurrentUser();

  return (
    <DashboardLayout userName={user?.username || 'Student'}>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<StudentOverview />} />
          <Route path="/exams" element={<StudentExams />} />
          <Route path="/results" element={<StudentResults />} />
          <Route path="/settings" element={<ProfileSettings />} />
          <Route path="*" element={<Navigate to="/student" replace />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
};

export default StudentDashboard;
