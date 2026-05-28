import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import examService from '../../services/examService';
import DashboardLayout from '../layout/DashboardLayout';
import LoadingScreen from '../common/LoadingScreen';
import {
    ArrowLeft,
    RotateCcw,
    BarChart3,
    Clock,
    Award,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Target,
    Zap,
    BookOpen,
    ShieldCheck
} from 'lucide-react';

interface ExamResult {
    id: number;
    exam_title: string;
    student_name: string;
    score: number;
    total_marks: number;
    percentage: number;
    grade: string;
    is_passed: boolean;
    duration_minutes: number;
    completed_at: string;
}

const ResultsPage: React.FC = () => {
    const { resultId } = useParams<{ resultId: string }>();
    const navigate = useNavigate();
    const [result, setResult] = useState<ExamResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            if (!resultId) return;
            try {
                const response = await examService.getExamResults();
                if (response.success && response.data) {
                    const foundResult = response.data.find((r: ExamResult) => r.id === parseInt(resultId));
                    if (foundResult) {
                        setResult(foundResult);
                    } else {
                        toast.error('Result not found');
                        navigate('/student');
                    }
                }
            } catch (error) {
                toast.error('Failed to load result details');
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [resultId, navigate]);

    if (loading) {
        return <LoadingScreen message="Loading your results..." transparent />;
    }

    if (!result) return null;

    const containerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <DashboardLayout>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-6xl mx-auto py-8"
            >
                {/* Top Actions */}
                <div className="flex items-center justify-between mb-12">
                    <button
                        onClick={() => navigate('/student/results')}
                        className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-black uppercase text-[10px] tracking-widest"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Results
                    </button>
                    <div className="flex gap-4">
                        <button className="h-10 px-6 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                            Download PDF
                        </button>
                    </div>
                </div>

                {/* Hero Result Section */}
                <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 mb-10 shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-emerald-600/10 blur-[100px]"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="space-y-6">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest ${result.is_passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}>
                                {result.is_passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                {result.is_passed ? 'Passed' : 'Failed'}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                                {result.exam_title}
                            </h1>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                    <Clock size={14} /> {new Date(result.completed_at).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                    <ShieldCheck size={14} /> Verified Result
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="relative">
                                <svg className="w-40 h-40 transform -rotate-90">
                                    <circle className="text-slate-800" strokeWidth="8" stroke="currentColor" fill="transparent" r="72" cx="80" cy="80" />
                                    <motion.circle
                                        initial={{ strokeDashoffset: 452 }}
                                        animate={{ strokeDashoffset: 452 - (result.percentage / 100) * 452 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className={result.is_passed ? "text-emerald-500" : "text-rose-500"}
                                        strokeWidth="8"
                                        strokeDasharray={452}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="72"
                                        cx="80"
                                        cy="80"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-4xl font-black text-white">{result.percentage}%</div>
                                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Accuracy</div>
                                </div>
                            </div>
                            <div className={`text-7xl font-black leading-none ${result.is_passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {result.grade}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Analytical Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <motion.div variants={itemVariants} className="glass rounded-[2.5rem] p-8 border border-white/5 bg-white/[0.02]">
                        <div className="p-3 w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6">
                            <Award size={24} />
                        </div>
                        <div className="text-3xl font-black text-white mb-2">{result.score}/{result.total_marks}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Your Score</div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass rounded-[2.5rem] p-8 border border-white/5 bg-white/[0.02]">
                        <div className="p-3 w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                            <Target size={24} />
                        </div>
                        <div className="text-3xl font-black text-white mb-2">{result.is_passed ? 'Passed' : 'Failed'}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Result</div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass rounded-[2.5rem] p-8 border border-white/5 bg-white/[0.02]">
                        <div className="p-3 w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6">
                            <Clock size={24} />
                        </div>
                        <div className="text-3xl font-black text-white mb-2">{result.duration_minutes}m</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Duration</div>
                    </motion.div>
                </div>

                {/* Subject Summary or Question Types */}
                <motion.div variants={itemVariants} className="glass rounded-[3rem] p-12 border border-white/5 bg-slate-900/50">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Performance Analysis</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Your exam performance breakdown</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="p-8 rounded-[2rem] bg-indigo-600/5 border border-indigo-500/10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-indigo-400 font-black uppercase text-[10px] tracking-widest">Performance</div>
                                <div className="text-white font-black">{result.percentage > 80 ? 'Excellent' : result.percentage > 60 ? 'Good' : 'Keep Learning'}</div>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${result.percentage}%` }}
                                    className="h-full bg-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-white font-black text-lg">Correct Answers</h4>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">You scored {result.score} out of {result.total_marks} marks.</p>
                                </div>
                            </div>
                            <div className="flex gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                    <Target size={24} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-white font-black text-lg">Grade</h4>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">Your grade is {result.grade} ({result.percentage}% accuracy).</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={14} className="text-emerald-500" /> Verified Result
                        </p>
                        <button
                            onClick={() => navigate('/student')}
                            className="h-14 px-12 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-3"
                        >
                            Back to Dashboard <RotateCcw size={18} />
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </DashboardLayout>
    );
};

export default ResultsPage;