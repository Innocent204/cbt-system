import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import authService from '../../services/authService';
import DashboardLayout from '../layout/DashboardLayout';
import LoadingScreen from '../common/LoadingScreen';

// Lazy load examiner components
const ExaminerOverview = React.lazy(() => import('./ExaminerOverview'));
const QuestionBankManagement = React.lazy(() => import('./QuestionBankManagement'));
const ExamScheduler = React.lazy(() => import('./ExamScheduler'));
const ResultsManagement = React.lazy(() => import('../admin/ResultsManagement'));
const ManualGrading = React.lazy(() => import('./ManualGrading'));
const ProfileSettings = React.lazy(() => import('../profile/ProfileSettings'));

const ExaminerDashboard: React.FC = () => {
  const user = authService.getCurrentUser();

  return (
    <DashboardLayout userName={user?.username || 'Examiner'}>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<ExaminerOverview />} />
          <Route path="/questions" element={<QuestionBankManagement />} />
          <Route path="/create-exam" element={<ExamScheduler />} />
          <Route path="/grading" element={<ManualGrading />} />
          <Route path="/results" element={<ResultsManagement />} />
          <Route path="/settings" element={<ProfileSettings />} />
          <Route path="*" element={<Navigate to="/examiner" replace />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
};

export default ExaminerDashboard;
