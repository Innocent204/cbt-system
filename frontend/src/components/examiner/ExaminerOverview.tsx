import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import statsService from '../../services/statsService';
import userService from '../../services/userService';
import DashboardSkeleton from '../dashboard/DashboardSkeleton';
import { FileText, Calendar, Users, TrendingUp, Clock, BarChart3 } from 'lucide-react';

const ExaminerOverview: React.FC = () => {
    const navigate = useNavigate();
    const { data: statsResponse, isLoading: isStatsLoading } = useQuery({
        queryKey: ['examinerStats'],
        queryFn: () => statsService.getExaminerStats(),
    });

    const { data: logsResponse, isLoading: isLogsLoading } = useQuery({
        queryKey: ['auditLogs'],
        queryFn: () => userService.getAuditLogs(),
    });

    const stats = statsResponse?.data;
    const isLoading = isStatsLoading || isLogsLoading;

    const recentActivity = logsResponse?.data?.slice(0, 3).map((log: any) => ({
        label: log.action_display || log.action,
        time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        color: log.severity === 'critical' || log.severity === 'high' ? 'bg-rose-500' : (log.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500')
    })) || [];

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="max-w-7xl mx-auto pt-4">
            {/* Examiner Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Total Questions</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                                {stats?.totalQuestions || '---'}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">+{stats?.questionsAddedToday} this week</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
                            <FileText size={24} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Active Exams</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                                {stats?.activeExams || '---'}
                            </p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400">{stats?.examsPublishedToday} published today</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
                            <Calendar size={24} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Students Tested</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                                {stats?.studentsTested || '---'}
                            </p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400">+{stats?.studentGrowth} this month</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
                            <Users size={24} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Avg Score</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                                {stats?.averageScore}%
                            </p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400">+{stats?.scoreImprovement}% improvement</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
                            <TrendingUp size={24} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            onClick={() => navigate('/examiner/questions')}
                            className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors text-left"
                        >
                            <FileText size={20} className="text-indigo-600 dark:text-indigo-400 mb-2" />
                            <div className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">Manage Questions</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Create & edit questions</div>
                        </button>
                        <button
                            onClick={() => navigate('/examiner/create-exam')}
                            className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors text-left"
                        >
                            <Calendar size={20} className="text-indigo-600 dark:text-indigo-400 mb-2" />
                            <div className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">Schedule Exam</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Create new exam</div>
                        </button>
                        <button
                            onClick={() => navigate('/examiner/results')}
                            className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors text-left"
                        >
                            <BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400 mb-2" />
                            <div className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">View Results</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Student performance</div>
                        </button>
                        <button
                            onClick={() => navigate('/examiner/results')}
                            className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors text-left"
                        >
                            <Clock size={20} className="text-indigo-600 dark:text-indigo-400 mb-2" />
                            <div className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">Exam History</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Past exams</div>
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {recentActivity.map((activity: any, idx: number) => (
                            <div key={idx} className="flex items-center space-x-3">
                                <div className={`w-2 h-2 ${activity.color} rounded-full`}></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{activity.label}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                        {recentActivity.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No recent activity found.</p>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ExaminerOverview;
