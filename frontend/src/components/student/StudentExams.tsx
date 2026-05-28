import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import examService from '../../services/examService';
import { Clock, CheckCircle, XCircle, AlertCircle, Play, Eye, Calendar, TrendingUp, ArrowRight, History, Award } from 'lucide-react';
import LoadingScreen from '../common/LoadingScreen';

interface ExamAttempt {
    id: number;
    exam: number;
    exam_title: string;
    student: number;
    student_name: string;
    status: 'in_progress' | 'submitted' | 'completed' | 'failed';
    start_time: string;
    end_time?: string;
    submit_time?: string;
    score?: number;
    percentage?: number;
    total_marks: number;
    duration_minutes: number;
    result_id?: number;
}

const StudentExams: React.FC = () => {
    const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    const loadAttempts = async (): Promise<void> => {
        try {
            const result = await examService.getExamAttempts();
            if (result.success && result.data) {
                setAttempts(result.data);
            }
        } catch (error) {
            console.error('Error loading attempts:', error);
            toast.error('Failed to load exam attempts');
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed':
                return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Completed' };
            case 'submitted':
                return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Submitted' };
            case 'failed':
                return { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Failed' };
            case 'in_progress':
                return { icon: Play, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'In Progress' };
            default:
                return { icon: AlertCircle, color: 'text-slate-500', bg: 'bg-slate-500/10', label: 'Unknown' };
        }
    };

    useEffect(() => {
        loadAttempts();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { x: -20, opacity: 0 },
        visible: { x: 0, opacity: 1 }
    };

    if (loading) {
        return <LoadingScreen fullScreen={false} message="Loading your exams..." transparent />;
    }

    const completedExams = attempts.filter(a => a.status === 'completed').length;
    const avgScore = attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / (attempts.filter(a => a.score).length || 1))
        : 0;

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8 pb-12"
        >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <History size={32} className="text-indigo-600" />
                        My Exam History
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Timeline of your academic journey and performance</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-3 overflow-hidden">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                <Award size={14} className="text-indigo-500" />
                            </div>
                        ))}
                    </div>
                    <div className="h-10 w-px bg-slate-200 dark:bg-slate-800"></div>
                    <div className="text-right">
                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{completedExams} Completed</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Across {attempts.length} attempts</div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { icon: Calendar, label: 'Total Attempts', value: attempts.length, color: 'text-blue-500' },
                    { icon: CheckCircle, label: 'Completed', value: completedExams, color: 'text-emerald-500' },
                    { icon: TrendingUp, label: 'Performance', value: `${avgScore}%`, color: 'text-indigo-500' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        className="glass rounded-3xl p-6 border border-slate-200/50 dark:border-white/5 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                            </div>
                            <stat.icon size={32} className={`${stat.color} opacity-20`} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Timeline List */}
            <div className="relative">
                {attempts.length > 0 && (
                    <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800 pointer-events-none hidden md:block"></div>
                )}

                {attempts.length === 0 ? (
                    <motion.div
                        variants={itemVariants}
                        className="text-center py-20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
                    >
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 text-slate-400 mb-6 font-black text-4xl">
                            ?
                        </div>
                        <h3 className="text-xl font-bold dark:text-white mb-2">No attempts recorded</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mb-8">Ready to make history? Start your first exam from the dashboard.</p>
                        <button onClick={() => navigate('/student')} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform flex items-center mx-auto gap-2">
                            Go to Dashboard <ArrowRight size={16} />
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {attempts.map((attempt) => {
                            const config = getStatusConfig(attempt.status);
                            return (
                                <motion.div
                                    key={attempt.id}
                                    variants={itemVariants}
                                    className="relative flex flex-col md:flex-row gap-6 md:items-center"
                                >
                                    {/* Timeline Node */}
                                    <div className="hidden md:flex absolute left-8 -translate-x-1/2 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white dark:border-slate-950 z-10 shadow-lg"></div>

                                    {/* Content Card */}
                                    <div className="flex-1 glass group rounded-[2rem] border border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-xl transition-all overflow-hidden md:ml-16">
                                        <div className="flex flex-col lg:flex-row">
                                            {/* Status Side */}
                                            <div className={`w-full lg:w-48 p-6 flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-white/5 ${config.bg}`}>
                                                <div className={`p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm mb-3 ${config.color}`}>
                                                    <config.icon size={28} />
                                                </div>
                                                <div className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>
                                                    {config.label}
                                                </div>
                                            </div>

                                            {/* Info Side */}
                                            <div className="flex-1 p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="space-y-2">
                                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                        {attempt.exam_title}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                        <span className="flex items-center gap-1.5"><Calendar size={14} /> Starts: {new Date(attempt.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                                        {attempt.end_time && (
                                                            <span className="flex items-center gap-1.5"><Calendar size={14} /> Ends: {new Date(attempt.end_time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                                        )}
                                                        <span className="flex items-center gap-1.5"><Clock size={14} /> {attempt.duration_minutes}m Duration</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4">
                                                    <div className="px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 text-center border border-slate-100 dark:border-white/5 min-w-[100px]">
                                                        <div className="text-xl font-black text-slate-900 dark:text-white">
                                                            {attempt.score !== undefined ? `${attempt.score}/${attempt.total_marks}` : 'N/A'}
                                                        </div>
                                                        <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Score</div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {attempt.status === 'completed' && attempt.result_id && (
                                                            <button
                                                                onClick={() => navigate(`/results/${attempt.result_id}`)}
                                                                className="h-14 px-6 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                                                            >
                                                                <Eye size={18} />
                                                                Details
                                                            </button>
                                                        )}
                                                        {attempt.status === 'in_progress' && (
                                                            <button
                                                                onClick={() => navigate(`/exam/${attempt.id}`)}
                                                                className="h-14 px-6 rounded-2xl bg-amber-500 text-white font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                                                            >
                                                                <Play size={18} fill="currentColor" />
                                                                Continue
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default StudentExams;
