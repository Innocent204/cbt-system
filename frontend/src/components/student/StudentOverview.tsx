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
            {/* Hero Section - Redesigned */}
            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[2.5rem] bg-dark-secondary p-8 md:p-16 border border-dark-border-primary shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-dark-accent-indigo/5 blur-[120px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-tertiary border border-dark-border-primary text-[10px] font-black uppercase tracking-widest text-dark-accent-indigo">
                            <Sparkles size={12} className="animate-pulse" /> Cognitive Portal
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.1]">
                            Status: <span className="text-dark-accent-indigo">Ready</span>. <br />
                            Begin your <span className="text-dark-text-muted italic">Ascent</span>.
                        </h1>
                        <p className="max-w-xl text-dark-text-secondary font-medium text-lg leading-relaxed">
                            System diagnostics complete. <span className="text-white font-bold">{availableExamsCount} examinations</span> are currently active in your deployment queue.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full xl:w-auto">
                        <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-dark-tertiary/50 border border-dark-border-primary backdrop-blur-sm shadow-xl">
                            <p className="text-4xl font-black text-white">{exams.length}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-dark-text-muted mt-2">Assigned</p>
                        </div>
                        <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-dark-accent-indigo shadow-2xl shadow-dark-accent-indigo/30 transform hover:scale-105 transition-transform cursor-default">
                            <p className="text-4xl font-black text-white">{availableExamsCount}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mt-2">Active</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Stats Grid - Redesigned */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { icon: FileText, label: 'Available', value: exams.length, color: 'text-dark-accent-indigo' },
                    { icon: CheckCircle, label: 'Completed', value: stats?.examsCompleted || '0', color: 'text-dark-accent-emerald' },
                    { icon: BarChart3, label: 'Avg Score', value: stats?.averageScore ? `${stats.averageScore}%` : '---', color: 'text-dark-accent-cyan' },
                    { icon: Clock, label: 'Pending', value: stats?.upcomingExams || '0', color: 'text-dark-accent-amber' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        whileHover={{ y: -5 }}
                        className="bg-dark-secondary rounded-2xl p-6 border border-dark-border-primary hover:border-dark-text-muted transition-all duration-300"
                    >
                        <div className="flex items-center gap-5">
                            <div className={`p-2.5 rounded-xl bg-dark-tertiary ${stat.color} border border-dark-border-primary shadow-inner`}>
                                <stat.icon size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white tracking-tight leading-none">{stat.value}</p>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-dark-text-muted mt-2">{stat.label}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Exams Grid - Redesigned */}
            <div className="space-y-8">
                <div className="flex items-end justify-between border-b border-dark-border-primary pb-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black tracking-tight text-white">Active Assessments</h2>
                        <p className="text-xs text-dark-text-muted font-black uppercase tracking-widest">Protocol: Select module for initialization</p>
                    </div>
                </div>

                {exams.length === 0 ? (
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-dark-border-primary p-20 text-center bg-dark-secondary/20"
                    >
                        <div className="w-16 h-16 rounded-full bg-dark-tertiary flex items-center justify-center text-dark-text-muted mb-6 opacity-50">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2 tracking-tight">Zero Active Assignments</h3>
                        <p className="text-dark-text-muted max-w-xs mx-auto mb-8 text-sm font-medium">System reports no current examinations assigned to your identifier.</p>
                        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white text-dark-primary rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-dark-accent-indigo hover:text-white transition-all">
                            Resync Terminal
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        <AnimatePresence>
                            {exams.map((exam) => (
                                <motion.div
                                    key={exam.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -6 }}
                                    className="bg-dark-secondary rounded-[2.5rem] border border-dark-border-primary hover:border-dark-accent-indigo transition-all duration-500 group overflow-hidden flex flex-col shadow-2xl relative"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-dark-accent-indigo/5 blur-3xl pointer-events-none group-hover:bg-dark-accent-indigo/10 transition-colors" />
                                    
                                    <div className="p-8 pb-4 flex-1 relative z-10">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-2 bg-dark-tertiary/50 px-3 py-1.5 rounded-full border border-dark-border-primary">
                                                <div className={`w-1.5 h-1.5 rounded-full ${exam.is_available ? 'bg-dark-accent-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-dark-text-muted'}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${exam.is_available ? 'text-dark-accent-emerald' : 'text-dark-text-muted'}`}>
                                                    {exam.is_available ? 'Live Sync' : 'Static'}
                                                </span>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-dark-tertiary flex items-center justify-center text-dark-text-muted opacity-0 group-hover:opacity-100 group-hover:text-dark-accent-indigo transition-all transform translate-x-4 group-hover:translate-x-0 border border-dark-border-primary shadow-inner">
                                                <ArrowRight size={18} />
                                            </div>
                                        </div>

                                        <p className="text-[10px] font-black text-dark-accent-indigo uppercase tracking-[0.2em] mb-2 italic flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-dark-accent-indigo"></span>
                                            {exam.course_name}
                                        </p>
                                        <h3 className="text-2xl font-black text-white mb-8 tracking-tight line-clamp-2 leading-[1.2] group-hover:text-dark-accent-indigo transition-colors">{exam.title}</h3>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="p-5 rounded-2xl bg-dark-tertiary/20 border border-dark-border-primary group-hover:bg-dark-tertiary/40 transition-colors shadow-inner">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-dark-text-muted mb-2">Duration</p>
                                                <p className="text-2xl font-black text-white tabular-nums">{exam.duration_minutes}<span className="text-[10px] ml-1 opacity-50 font-black italic uppercase">min</span></p>
                                            </div>
                                            <div className="p-5 rounded-2xl bg-dark-tertiary/20 border border-dark-border-primary group-hover:bg-dark-tertiary/40 transition-colors shadow-inner">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-dark-text-muted mb-2">Weight</p>
                                                <p className="text-2xl font-black text-white tabular-nums">{exam.total_marks}<span className="text-[10px] ml-1 opacity-50 font-black italic uppercase">pts</span></p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 pt-0 mb-4 px-8 relative z-10">
                                        <button
                                            onClick={() => exam.is_available && handleStartExam(exam.id)}
                                            disabled={!exam.is_available}
                                            className={`w-full flex items-center justify-center gap-4 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.25em] transition-all shadow-xl group/btn ${exam.is_available
                                                ? 'bg-white text-dark-primary hover:bg-dark-accent-indigo hover:text-white active:scale-[0.98]'
                                                : 'bg-dark-tertiary/50 text-dark-text-muted cursor-not-allowed opacity-50'
                                                }`}
                                        >
                                            {exam.is_available ? (
                                                <>
                                                    <Play size={14} className="fill-current group-hover/btn:scale-125 transition-transform" />
                                                    Initialize Assessment
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle size={14} />
                                                    Pending Authorization
                                                </>
                                            )}
                                        </button>
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
