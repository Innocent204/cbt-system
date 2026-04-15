import React, { useState, useEffect, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import statsService, { StudentStats } from '../../services/statsService';
import { BookOpen, CheckCircle, Clock, GraduationCap, FileText, BarChart3 } from 'lucide-react';
import StudentExams from './StudentExams';
import StudentResults from './StudentResults';

const StudentOverviewLazy = lazy(() => import('./StudentOverview'));
const StudentExamsLazy = lazy(() => import('./StudentExams'));
const StudentResultsLazy = lazy(() => import('./StudentResults'));

const StudentHome: React.FC = () => {
    const [stats, setStats] = useState<StudentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await statsService.getStudentStats();
                if (response.success && response.data) {
                    setStats(response.data);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Set active tab based on current path
    useEffect(() => {
        const path = location.pathname;
        if (path === '/student' || path === '/student/') {
            setActiveTab('overview');
        } else if (path === '/student/exams') {
            setActiveTab('exams');
        } else if (path === '/student/results') {
            setActiveTab('results');
        }
    }, [location.pathname]);

    return (
        <div className="max-w-7xl mx-auto pt-4 space-y-8">
            {/* Tab Navigation */}
            <div className="mb-8">
                <div className="border-b border-gray-200 dark:border-dark-border-primary">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => window.location.href = '/student'}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Overview
                        </button>
                        <button
                            onClick={() => window.location.href = '/student/exams'}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'exams'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            My Exams
                        </button>
                        <button
                            onClick={() => window.location.href = '/student/results'}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'results'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Results
                        </button>
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-8">
                {activeTab === 'overview' && (
                    <Routes>
                        <Route path="/student" element={<StudentOverviewLazy />} />
                        <Route path="/student/exams" element={<StudentExamsLazy />} />
                        <Route path="/student/results" element={<StudentResultsLazy />} />
                    </Routes>
                )}

                {activeTab === 'exams' && (
                    <React.Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                        <StudentExams />
                    </React.Suspense>
                )}

                {activeTab === 'results' && (
                    <React.Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                        <StudentResults />
                    </React.Suspense>
                )}
            </div>

            {/* Quick Stats Strip - only show on overview */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Exams Completed', value: stats?.examsCompleted || 0, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'Average Score', value: `${stats?.averageScore || 0}%`, icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { label: 'Upcoming', value: stats?.upcomingExams || 0, icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                        { label: 'Learning Time', value: stats?.activeLearningTime || '0h', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    ].map((item, i) => (
                        <div key={i} className="glass p-6 rounded-3xl border border-dark-border-primary bg-dark-surface flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                                <item.icon size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-dark-text-muted uppercase tracking-wider">{item.label}</p>
                                <p className="text-2xl font-black text-dark-text-primary leading-tight">
                                    {loading ? '...' : item.value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentHome;
