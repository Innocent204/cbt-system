import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import statsService from '../../services/statsService';
import userService from '../../services/userService';
import LoadingScreen from '../common/LoadingScreen';
import {
    Users, FileText, Settings, Database, BarChart3, TrendingUp,
    ArrowRight, Activity, ShieldCheck, Cpu, ArrowUpRight,
    UserPlus, BookOpen, ClipboardList, Zap
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import authService from '../../services/authService';


const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } }
};

const AdminOverview: React.FC = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const { data: statsResponse, isLoading: isStatsLoading } = useQuery({
        queryKey: ['adminStats'],
        queryFn: () => statsService.getAdminStats(),
    });

    const { data: chartsResponse, isLoading: isChartsLoading } = useQuery({
        queryKey: ['adminChartStats'],
        queryFn: () => statsService.getChartStats(),
    });

    const { data: maintenanceResponse, isLoading: isMaintenanceLoading } = useQuery({
        queryKey: ['adminMaintenanceStats'],
        queryFn: () => statsService.getMaintenanceStats(),
    });

    const { data: logsResponse, isLoading: isLogsLoading } = useQuery({
        queryKey: ['auditLogs'],
        queryFn: () => userService.getAuditLogs(),
    });

    const stats = statsResponse?.data;
    const charts = chartsResponse?.data;
    const maintenance = maintenanceResponse?.data;
    const isLoading = isStatsLoading || isLogsLoading || isChartsLoading || isMaintenanceLoading;

    const enrollmentTrends = charts?.enrollmentTrends || [];

    const recentActivity = logsResponse?.data?.slice(0, 4).map((log: any) => ({
        label: log.action_display || log.action,
        time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dot: log.severity === 'critical' || log.severity === 'high' ? 'bg-rose-500' : (log.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500')
    })) || [];

    const statCards = [
        {
            label: 'Total Users',
            value: stats?.totalUsers?.toLocaleString() ?? '---',
            sub: `+${stats?.userGrowth ?? 0}% this month`,
            subColor: 'text-emerald-400',
            icon: Users,
            gradient: 'from-blue-500 to-indigo-600',
            bg: 'bg-blue-500/10',
        },
        {
            label: 'Active Exams',
            value: stats?.activeExams ?? '---',
            sub: `${stats?.newExamsToday ?? 0} published today`,
            subColor: 'text-indigo-400',
            icon: FileText,
            gradient: 'from-indigo-500 to-purple-600',
            bg: 'bg-indigo-500/10',
        },
        {
            label: 'System Health',
            value: `${stats?.systemHealth ?? '—'}%`,
            sub: 'All systems operational',
            subColor: 'text-emerald-400',
            icon: ShieldCheck,
            gradient: 'from-emerald-500 to-teal-600',
            bg: 'bg-emerald-500/10',
        },
        {
            label: 'Storage Used',
            value: stats?.storageUsed ?? '---',
            sub: `${stats?.storageCapacity ?? 0}% of capacity`,
            subColor: 'text-amber-400',
            icon: Database,
            gradient: 'from-amber-500 to-orange-600',
            bg: 'bg-amber-500/10',
        },
    ];

    const quickActions = [
        { label: 'Manage Users', desc: 'Add, edit, or remove users', icon: UserPlus, color: 'text-blue-400', bg: 'bg-blue-500/10', path: '/admin/users' },
        { label: 'Courses & Exams', desc: 'Manage exam content', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10', path: '/admin/courses' },
        { label: 'View Reports', desc: 'System analytics & logs', icon: BarChart3, color: 'text-indigo-400', bg: 'bg-indigo-500/10', path: '/admin/reports' },
        { label: 'Maintenance', desc: 'Backups & configuration', icon: Settings, color: 'text-amber-400', bg: 'bg-amber-500/10', path: '/admin/maintenance' },
    ];


    if (isLoading) {
        return <LoadingScreen fullScreen={false} message="Syncing Control Systems" transparent />;
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8 pb-12"
        >
            {/* Command Center Hero */}
            <motion.div
                variants={itemVariants}
                className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-12 text-white shadow-2xl"
            >
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-72 w-72 rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-48 w-48 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-indigo-300 border border-white/10">
                            <Cpu size={12} /> Command Center
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">{user?.username || 'Admin'}</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-sm max-w-sm">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center p-6 rounded-3xl bg-white/5 border border-white/10 text-center min-w-[100px]">
                            <div className="text-3xl font-black text-indigo-400">{stats?.totalUsers?.toLocaleString() ?? '---'}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">Users</div>
                        </div>
                        <div className="flex flex-col items-center p-6 rounded-3xl bg-indigo-600 shadow-xl shadow-indigo-900/30 text-center min-w-[100px]">
                            <div className="text-3xl font-black text-white">{stats?.activeExams ?? '---'}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-indigo-200 mt-1">Active Exams</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map((card, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        whileHover={{ y: -5 }}
                        className="glass group rounded-[2rem] p-7 border border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-xl transition-all"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className={`p-3 rounded-2xl ${card.bg}`}>
                                <card.icon size={22} className={`bg-gradient-to-br ${card.gradient} text-transparent bg-clip-text`} style={{ color: undefined }} />
                                <card.icon size={22} className={`bg-gradient-to-br ${card.gradient}`} style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'none' }} />
                                {/* Simple colored icon */}
                                <span className={`hidden`}></span>
                            </div>
                            <ArrowUpRight size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{card.value}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{card.label}</div>
                        <div className={`text-xs font-bold ${card.subColor}`}>{card.sub}</div>
                    </motion.div>
                ))}
            </div>

            {/* Charts + System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-2 glass rounded-[2.5rem] p-8 border border-slate-200/50 dark:border-white/5 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Enrollment Trends</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Weekly platform activity</p>
                        </div>
                        <div className="flex items-center gap-5">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Students</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Examiners</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-56 md:h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={enrollmentTrends}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExaminers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '1rem', color: '#f8fafc', fontSize: 12, fontWeight: 700 }}
                                    itemStyle={{ color: '#94a3b8' }}
                                    cursor={{ stroke: 'rgba(99,102,241,0.3)', strokeWidth: 2 }}
                                />
                                <Area type="monotone" dataKey="students" stroke="#6366f1" fillOpacity={1} fill="url(#colorStudents)" strokeWidth={2.5} dot={false} />
                                <Area type="monotone" dataKey="examiners" stroke="#60a5fa" fillOpacity={1} fill="url(#colorExaminers)" strokeWidth={2.5} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="glass rounded-[2.5rem] p-8 border border-slate-200/50 dark:border-white/5 shadow-sm flex flex-col"
                >
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8">System Health</h3>
                    <div className="space-y-7 flex-1">
                        {[
                            { label: 'Server Load', value: maintenance?.performance?.cpu ?? 0, color: 'bg-blue-500' },
                            { label: 'Memory Usage', value: maintenance?.performance?.ram ?? 0, color: 'bg-indigo-500' },
                            { label: 'Disk Space', value: maintenance?.performance?.disk ?? 0, color: 'bg-emerald-500' },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex justify-between items-center mb-2.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</span>
                                    <span className="text-sm font-black text-slate-900 dark:text-white">{item.value}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.value}%` }}
                                        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                                        className={`h-full ${item.color} rounded-full`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                            <Activity size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Optimized</p>
                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">Running at peak efficiency</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Quick Actions + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="glass rounded-[2.5rem] p-8 border border-slate-200/50 dark:border-white/5 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {quickActions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => navigate(action.path)}
                                className="group p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-left"
                            >
                                <div className={`h-10 w-10 rounded-2xl ${action.bg} ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <action.icon size={20} />
                                </div>
                                <div className="text-sm font-black text-slate-900 dark:text-white mb-1">{action.label}</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{action.desc}</div>
                            </button>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="glass rounded-[2.5rem] p-8 border border-slate-200/50 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Recent Activity</h3>
                        <button
                            onClick={() => navigate('/admin/reports')}
                            className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
                        >
                            View All <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="space-y-5">
                        {recentActivity.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-5">
                                <div className={`h-2.5 w-2.5 rounded-full ${item.dot} shrink-0`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.label}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default AdminOverview;
