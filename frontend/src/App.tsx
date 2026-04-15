import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LoadingScreen from './components/common/LoadingScreen';

// Lazy load components
const Login = React.lazy(() => import('./components/auth/Login'));
const Register = React.lazy(() => import('./components/auth/Register'));
const LandingPage = React.lazy(() => import('./components/landing/LandingPage'));
const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard'));
const ExaminerDashboard = React.lazy(() => import('./components/examiner/ExaminerDashboard'));
const StudentDashboard = React.lazy(() => import('./components/student/StudentDashboard'));
const ExamInterface = React.lazy(() => import('./components/student/ExamInterface'));
const ExamInstructions = React.lazy(() => import('./components/student/ExamInstructions'));
const ResultsPage = React.lazy(() => import('./components/student/ResultsPage'));

import ProtectedRoute from './components/auth/ProtectedRoute';
import authService from './services/authService';

import './App.css';

const App: React.FC = () => {
  // If already authenticated, redirect to role dashboard; otherwise show landing.
  const getDashboardRoute = (): string | null => {
    if (!authService.isAuthenticated()) return null;
    const role = authService.getUserRole();
    switch (role) {
      case 'admin': return '/admin';
      case 'examiner': return '/examiner';
      case 'student': return '/student';
      default: return null;
    }
  };

  return (
    <BrowserRouter>
      <div className="App">
        <React.Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/examiner/*"
              element={
                <ProtectedRoute allowedRoles={['examiner', 'admin']}>
                  <ExaminerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/*"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/exam/:examId/instructions"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ExamInstructions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/exam/:attemptId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ExamInterface />
                </ProtectedRoute>
              }
            />

            <Route
              path="/results/:resultId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ResultsPage />
                </ProtectedRoute>
              }
            />

            {/* Root: strictly show Landing page as the entry point */}
            <Route
              path="/"
              element={<LandingPage />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </BrowserRouter>
  );
};

export default App;