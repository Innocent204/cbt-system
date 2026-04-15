import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import examService from '../../services/examService';
import statsService, { StudentStats } from '../../services/statsService';
import { Exam } from '../../types';
import { Clock, FileText, CheckCircle, BarChart3, Play, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import LoadingScreen from '../common/LoadingScreen';

const StudentOverview: React.FC = () => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [stats, setStats] = useState<StudentStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    const fetchData = async (): Promise<void> => {
        try {
            const [examsRes, statsRes] = await Promise.all([
                examService.getAvailableExams(),
                statsService.getStudentStats()
            ]);

            if (examsRes.success && examsRes.data) {
                setExams(examsRes.data);
            }

            if (statsRes.success && statsRes.data) {
                setStats(statsRes.data);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleStartExam = (examId: number): void => {
        navigate(`/exam/${examId}/instructions`);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 100
            }
        }
    };

    if (loading) {
        return <LoadingScreen fullScreen={false} message="Preparing your dashboard..." transparent />;
    }

    const availableExamsCount = exams.filter(e => e.is_available).length;

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8 pb-12"
        >
            {/* Hero Stats Section */}
            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-blue-600/20 blur-[100px]"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-purple-600/20 blur-[100px]"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center space-x-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-300 backdrop-blur-md border border-white/5">
                            <Sparkles size={14} className="text-yellow-400" />
                            <span>Student Dashboard</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Achiever</span>
                        </h1>
                        <p className="max-w-md text-slate-400 font-medium">
                            Ready to excel? You have {availableExamsCount} examinations waiting for your magic touch.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-3xl bg-white/5 p-6 backdrop-blur-xl border border-white/10 text-center">
                            <div className="text-4xl font-black text-blue-400">{exams.length}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Total Exams</div>
                        </div>
                        <div className="rounded-3xl bg-blue-600 p-6 shadow-xl shadow-blue-900/40 text-center">
                            <div className="text-4xl font-black text-white">{availableExamsCount}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-100 mt-1">Ready now</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: FileText, label: 'Available', value: exams.length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { icon: CheckCircle, label: 'Completed', value: stats?.examsCompleted || '0', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { icon: BarChart3, label: 'Avg Score', value: stats?.averageScore ? `${stats.averageScore}%` : '-', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    { icon: Clock, label: 'Pending', value: stats?.upcomingExams || '0', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        whileHover={{ y: -5 }}
                        className="glass group rounded-3xl p-6 border border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-xl transition-all"
                    >
                        <div className="flex items-center space-x-4">
                            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                                <div className="text-xs font-bold tracking-widest uppercase text-slate-500">{stat.label}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Exams Grid */}
            <div className="space-y-6 text-slate-900 dark:text-white">
                <div className="flex items-end justify-between px-2">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Current Assessments</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">Pick an exam to start your evaluation</p>
                    </div>
                </div>

                {exams.length === 0 ? (
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-16 text-center"
                    >
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 mb-6">
                            <AlertCircle size={40} />
                        </div>
                        <h3 className="text-xl font-bold dark:text-white mb-2">No active exams found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mb-8">It seems there are no exams assigned to you at the moment.</p>
                        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform">
                            Refresh Dashboard
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {exams.map((exam) => (
                                <motion.div
                                    key={exam.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -8 }}
                                    className="glass group relative overflow-hidden rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-2xl transition-all"
                                >
                                    <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="h-12 w-12 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 transform rotate-[-45deg] group-hover:rotate-0 transition-transform duration-500">
                                            <ArrowRight size={24} />
                                        </div>
                                    </div>

                                    <div className="p-8">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className={`h-2 w-2 rounded-full ${exam.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${exam.is_available ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                                                {exam.is_available ? 'Available Now' : 'Not Available'}
                                            </span>
                                        </div>

                                        <h3 className="text-2xl font-bold mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">{exam.title}</h3>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">{exam.course_name}</p>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-100 dark:border-white/5">
                                                <Clock size={16} className="text-indigo-500 mb-2" />
                                                <div className="text-lg font-black">{exam.duration_minutes}m</div>
                                                <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Duration</div>
                                            </div>
                                            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-100 dark:border-white/5">
                                                <CheckCircle size={16} className="text-emerald-500 mb-2" />
                                                <div className="text-lg font-black">{exam.total_marks}</div>
                                                <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Total Marks</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => exam.is_available && handleStartExam(exam.id)}
                                            disabled={!exam.is_available}
                                            className={`w-full flex items-center justify-center space-x-2 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${exam.is_available
                                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-600 dark:hover:text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <Play size={16} fill="currentColor" />
                                            <span>{exam.is_available ? 'Begin Assessment' : 'Coming Soon'}</span>
                                        </button>

                                        {(exam.start_time || exam.end_time) && (
                                            <div className="mt-4 text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest flex flex-col gap-1 items-center">
                                                {exam.start_time && (
                                                    <span>Starts: {new Date(exam.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                                )}
                                                {exam.end_time && (
                                                    <span>Ends: {new Date(exam.end_time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default StudentOverview;
