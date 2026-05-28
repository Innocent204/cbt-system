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
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-dark-secondary p-8 rounded-[2.5rem] border border-dark-border-primary ring-1 ring-white/5">
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-dark-accent-indigo">Examiner Dashboard</p>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">Your <span className="text-dark-text-muted">Overview</span></h1>
                    <p className="text-lg text-dark-text-secondary font-medium max-w-xl">Manage your exams, questions, and track student performance.</p>
                </div>
                <div className="flex items-center gap-4 bg-dark-tertiary/50 p-2 rounded-2xl border border-dark-border-primary ring-1 ring-white/5">
                    <div className="px-5 py-3 rounded-xl bg-dark-secondary border border-dark-border-primary text-[10px] font-black uppercase tracking-widest text-dark-text-primary shadow-xl">System Clock</div>
                    <div className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-dark-accent-indigo tabular-nums">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Questions', value: stats?.totalQuestions, sub: `+${stats?.questionsAddedToday} today`, icon: FileText, color: 'text-dark-accent-indigo' },
                    { label: 'Active Exams', value: stats?.activeExams, sub: `${stats?.examsPublishedToday} published`, icon: Calendar, color: 'text-dark-accent-emerald' },
                    { label: 'Students Tested', value: stats?.studentsTested, sub: `+${stats?.studentGrowth} growth`, icon: Users, color: 'text-dark-accent-cyan' },
                    { label: 'Average Score', value: `${stats?.averageScore}%`, sub: `+${stats?.scoreImprovement}% gain`, icon: TrendingUp, color: 'text-dark-accent-amber' },
                ].map((stat, i) => (
                    <div key={i} className="bg-dark-secondary rounded-2xl p-6 border border-dark-border-primary hover:border-dark-text-muted transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2 rounded-lg bg-dark-tertiary ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-dark-tertiary animate-pulse" />
                        </div>
                        <p className="text-2xl font-black text-white mb-1 tracking-tight">{stat.value || '---'}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-dark-text-muted mb-3">{stat.label}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${stat.color}`}>{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Actions + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-dark-secondary p-6 md:p-10 rounded-[2.5rem] border border-dark-border-primary ring-1 ring-white/5">
                    <h3 className="text-xl font-black text-white mb-8 tracking-tight uppercase tracking-widest text-[10px] opacity-40">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { label: 'Question Bank', desc: 'Manage your questions', icon: FileText, path: '/examiner/questions', color: 'text-dark-accent-indigo' },
                            { label: 'Exam Scheduler', desc: 'Create & schedule exams', icon: Calendar, path: '/examiner/create-exam', color: 'text-dark-accent-emerald' },
                            { label: 'Results', desc: 'View exam results', icon: BarChart3, path: '/examiner/results', color: 'text-dark-accent-cyan' },
                            { label: 'History', desc: 'Recent activity', icon: Clock, path: '/examiner/results', color: 'text-dark-text-muted' },
                        ].map((action, i) => (
                            <button
                                key={i}
                                onClick={() => navigate(action.path)}
                                className="group p-6 bg-dark-tertiary/20 rounded-2xl border border-dark-border-primary hover:border-dark-accent-indigo hover:translate-y-[-2px] transition-all duration-300 text-left"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-dark-tertiary flex items-center justify-center mb-5 ${action.color} group-hover:bg-dark-accent-indigo group-hover:text-white transition-all shadow-xl`}>
                                    <action.icon size={20} />
                                </div>
                                <p className="text-sm font-black text-white mb-1 tracking-tight">{action.label}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-dark-text-muted">{action.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-dark-secondary p-6 md:p-10 rounded-[2.5rem] border border-dark-border-primary ring-1 ring-white/5 flex flex-col">
                    <h3 className="text-xl font-black text-white mb-8 tracking-tight uppercase tracking-widest text-[10px] opacity-40">Recent Activity</h3>
                    <div className="space-y-6 flex-1">
                        {recentActivity.map((activity: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-5 group cursor-pointer">
                                <div className={`w-2 h-2 ${activity.color} rounded-full shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.1)] group-hover:scale-150 transition-transform`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-dark-text-primary truncate group-hover:text-dark-accent-indigo transition-colors">{activity.label}</p>
                                    <p className="text-[10px] font-black text-dark-text-muted uppercase tracking-widest mt-1 italic">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                        {recentActivity.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-center flex-1">
                                <div className="w-16 h-16 rounded-full bg-dark-tertiary flex items-center justify-center text-dark-text-muted mb-6 opacity-20 border border-dark-border-primary ring-4 ring-dark-tertiary/50">
                                    <Clock size={24} />
                                </div>
                                <p className="text-xs font-black text-dark-text-muted uppercase tracking-widest italic leading-relaxed">No telemetry active in current session</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExaminerOverview;
