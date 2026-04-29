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
            sub: `+${stats?.userGrowth ?? 0}% from last period`,
            subColor: 'text-dark-accent-emerald',
            icon: Users,
            accent: 'text-dark-accent-indigo',
        },
        {
            label: 'Active Exams',
            value: stats?.activeExams ?? '---',
            sub: `${stats?.newExamsToday ?? 0} published today`,
            subColor: 'text-dark-accent-indigo',
            icon: FileText,
            accent: 'text-dark-accent-emerald',
        },
        {
            label: 'System Health',
            value: `${stats?.systemHealth ?? '—'}%`,
            sub: 'Operational efficiency',
            subColor: 'text-dark-accent-cyan',
            icon: ShieldCheck,
            accent: 'text-dark-accent-cyan',
        },
        {
            label: 'Storage Used',
            value: stats?.storageUsed ?? '---',
            sub: `${stats?.storageCapacity ?? 0}% capacity reached`,
            subColor: 'text-dark-accent-amber',
            icon: Database,
            accent: 'text-dark-accent-amber',
        },
    ];

    const quickActions = [
        { label: 'User Directory', desc: 'Management protocols', icon: UserPlus, color: 'text-dark-accent-indigo', path: '/admin/users' },
        { label: 'Exam Systems', desc: 'Content architecture', icon: BookOpen, color: 'text-dark-accent-emerald', path: '/admin/courses' },
        { label: 'Intelligence', desc: 'System analytics', icon: BarChart3, color: 'text-dark-accent-cyan', path: '/admin/reports' },
        { label: 'Maintenance', desc: 'Root settings', icon: Settings, color: 'text-dark-text-muted', path: '/admin/maintenance' },
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
            {/* Command Center Hero - Redesigned */}
            <motion.div
                variants={itemVariants}
                className="relative overflow-hidden rounded-3xl bg-dark-secondary p-6 md:p-10 border border-dark-border-primary shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-dark-accent-indigo/5 blur-[100px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-tertiary border border-dark-border-primary text-[10px] font-black uppercase tracking-widest text-dark-accent-indigo">
                            <Cpu size={12} className="animate-pulse" /> Core Infrastructure
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                            Status: <span className="text-dark-accent-indigo">Online</span>. <br className="hidden md:block" /> Welcome, <span className="underline decoration-dark-accent-indigo/30 underline-offset-8">{user?.username || 'Administrator'}</span>
                        </h1>
                        <p className="text-dark-text-secondary font-medium tracking-tight text-lg max-w-2xl leading-relaxed">
                            System diagnostics complete. Platform operating at <span className="text-dark-accent-emerald font-bold">nominal capacity</span>.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full xl:w-auto">
                        <div className="px-6 py-5 rounded-2xl bg-dark-tertiary/50 border border-dark-border-primary backdrop-blur-sm shadow-inner">
                            <p className="text-[10px] font-black uppercase tracking-widest text-dark-text-muted mb-1">Network Load</p>
                            <p className="text-2xl font-black text-white tabular-nums">{maintenance?.performance?.cpu ?? 0}%</p>
                        </div>
                        <div className="px-6 py-5 rounded-2xl bg-dark-accent-indigo/10 border border-dark-accent-indigo/20 backdrop-blur-sm shadow-inner">
                            <p className="text-[10px] font-black uppercase tracking-widest text-dark-accent-indigo mb-1">Active Nodes</p>
                            <p className="text-2xl font-black text-white tabular-nums">{stats?.totalUsers ?? '---'}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stat Cards - Redesigned */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        whileHover={{ y: -5 }}
                        className="bg-dark-secondary rounded-2xl p-6 border border-dark-border-primary hover:border-dark-text-muted transition-all duration-300 group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 rounded-lg bg-dark-tertiary text-dark-text-muted group-hover:text-dark-text-primary transition-colors">
                                <card.icon size={20} strokeWidth={2.5} />
                            </div>
                            <div className={`px-2 py-0.5 rounded text-[10px] font-black tracking-tighter ${card.subColor} bg-white/5`}>
                                TREND
                            </div>
                        </div>
                        <div className="text-3xl font-black text-white mb-1 tracking-tight">{card.value}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-dark-text-muted mb-3 italic">{card.label}</div>
                        <div className={`text-xs font-bold leading-none ${card.subColor}`}>{card.sub}</div>
                    </motion.div>
                ))}
            </div>

            {/* Charts + System Health Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-2 bg-dark-secondary rounded-3xl p-6 md:p-8 border border-dark-border-primary"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight leading-none">Execution Metrics</h3>
                            <p className="text-[10px] text-dark-text-muted font-black uppercase tracking-[0.2em] mt-3">Protocol: Data Archiving</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-dark-accent-indigo shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dark-text-muted">Nodes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-dark-accent-cyan shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dark-text-muted">Requests</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={enrollmentTrends}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExaminers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 900 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 900 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '1rem', color: '#fafafa', fontSize: 12, fontWeight: 900 }}
                                    itemStyle={{ color: '#a1a1aa' }}
                                    cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 2 }}
                                />
                                <Area type="monotone" dataKey="students" stroke="#6366f1" fillOpacity={1} fill="url(#colorStudents)" strokeWidth={3} dot={false} />
                                <Area type="monotone" dataKey="examiners" stroke="#06b6d4" fillOpacity={1} fill="url(#colorExaminers)" strokeWidth={3} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="bg-dark-secondary rounded-3xl p-6 md:p-8 border border-dark-border-primary flex flex-col shadow-xl"
                >
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-black text-white tracking-tight leading-none">Node Health</h3>
                        <Activity size={18} className="text-dark-accent-emerald animate-pulse" />
                    </div>
                    <div className="space-y-8 flex-1">
                        {[
                            { label: 'Compute Load', value: maintenance?.performance?.cpu ?? 0, color: 'bg-dark-accent-indigo' },
                            { label: 'Memory Allocation', value: maintenance?.performance?.ram ?? 0, color: 'bg-dark-accent-cyan' },
                            { label: 'Drive Array', value: maintenance?.performance?.disk ?? 0, color: 'bg-dark-accent-emerald' },
                        ].map((item) => (
                            <div key={item.label} className="group/item">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dark-text-muted group-hover/item:text-white transition-colors">{item.label}</span>
                                    <span className="text-xs font-black text-white tabular-nums">{item.value}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-dark-tertiary rounded-full overflow-hidden border border-white/5 shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.value}%` }}
                                        transition={{ duration: 1.5, ease: 'circOut' }}
                                        className={`h-full ${item.color} rounded-full shadow-[0_0_12px_rgba(255,255,255,0.05)]`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-10 p-5 rounded-2xl bg-dark-accent-emerald/5 border border-dark-accent-emerald/10 flex items-center gap-4 group cursor-default">
                        <div className="p-2 rounded-lg bg-dark-accent-emerald/10 group-hover:scale-110 transition-transform">
                            <ShieldCheck size={18} className="text-dark-accent-emerald" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-dark-accent-emerald uppercase tracking-[0.2em]">Efficiency Protocol</p>
                            <p className="text-[9px] font-bold text-dark-accent-emerald/60 uppercase tracking-widest mt-0.5">Systems Nominal</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="bg-dark-secondary rounded-3xl p-6 md:p-8 border border-dark-border-primary ring-1 ring-white/5 shadow-xl">
                    <h3 className="text-xl font-black text-white mb-8 tracking-tight uppercase tracking-[0.2em] text-[10px] opacity-40">Priority Protocols</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {quickActions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => navigate(action.path)}
                                className="group p-6 rounded-2xl bg-dark-tertiary/20 border border-dark-border-primary hover:border-dark-accent-indigo hover:translate-y-[-2px] transition-all duration-300 text-left shadow-lg"
                            >
                                <div className={`h-12 w-12 rounded-xl bg-dark-tertiary ${action.color} flex items-center justify-center mb-5 group-hover:bg-dark-accent-indigo group-hover:text-white transition-all shadow-xl`}>
                                    <action.icon size={20} />
                                </div>
                                <div className="text-sm font-black text-white mb-1 tracking-tight">{action.label}</div>
                                <div className="text-[10px] text-dark-text-muted font-black uppercase tracking-widest">{action.desc}</div>
                            </button>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-dark-secondary rounded-3xl p-6 md:p-8 border border-dark-border-primary ring-1 ring-white/5 shadow-xl">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-[0.2em] text-[10px] opacity-40">Event Stream</h3>
                        <button
                            onClick={() => navigate('/admin/reports')}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-dark-accent-indigo hover:text-dark-text-primary flex items-center gap-2 transition-all group p-2 hover:bg-dark-accent-indigo/10 rounded-lg"
                        >
                            Sync History <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="space-y-6">
                        {recentActivity.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-6 group cursor-pointer p-1 rounded-xl hover:bg-white/5 transition-colors">
                                <div className={`h-2.5 w-2.5 rounded-full ${item.dot} shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.1)] group-hover:scale-125 transition-transform`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-dark-text-primary truncate group-hover:text-dark-accent-indigo transition-colors tracking-tight">{item.label}</p>
                                    <p className="text-[10px] font-black text-dark-text-muted uppercase tracking-[0.2em] mt-2 italic leading-none opacity-50">{item.time}</p>
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
