import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import examService from '../../services/examService';
import { BarChart3, TrendingUp, Award, Target, BookOpen, Eye, ArrowRight, Star, Zap, Shell } from 'lucide-react';
import LoadingScreen from '../common/LoadingScreen';

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

const StudentResults: React.FC = () => {
    const [results, setResults] = useState<ExamResult[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    const loadResults = async (): Promise<void> => {
        try {
            const result = await examService.getExamResults();
            if (result.success && result.data) {
                const mappedResults: ExamResult[] = result.data.map((r: any) => ({
                    id: r.id,
                    exam_title: r.exam_title,
                    student_name: r.student_name,
                    score: r.score,
                    total_marks: r.total_marks,
                    percentage: r.percentage,
                    grade: r.grade,
                    is_passed: r.is_passed,
                    duration_minutes: r.duration_minutes || 0,
                    completed_at: r.completed_at
                }));
                const sortedResults = [...mappedResults].sort((a, b) =>
                    new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
                );
                setResults(sortedResults);
            }
        } catch (error) {
            console.error('Error loading results:', error);
            toast.error('Failed to load results');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadResults();
    }, []);

    const getGradeColor = (grade: string) => {
        const gradeMap: { [key: string]: string } = {
            'A': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
            'B': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
            'C': 'text-amber-500 bg-amber-500/10 border-amber-500/20',
            'D': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
            'F': 'text-rose-500 bg-rose-500/10 border-rose-500/20'
        };
        return gradeMap[grade] || 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    };

    const avgScore = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
        : 0;

    const passRate = results.length > 0
        ? Math.round((results.filter(r => r.is_passed).length / results.length) * 100)
        : 0;

    const topScore = results.length > 0
        ? Math.max(...results.map(r => r.percentage))
        : 0;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    if (loading) {
        return <LoadingScreen fullScreen={false} message="Analyzing your performance data..." transparent />;
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-10 pb-12"
        >
            {/* Analytics Hero */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div variants={itemVariants} className="lg:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-emerald-600/20 blur-[100px]"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md">
                                <TrendingUp size={24} className="text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-widest text-emerald-400">Growth Oversight</h2>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Your Progress is <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Skyrocketing</span></h1>
                        <p className="text-slate-400 font-medium max-w-md">Consistent effort is the key. You've cleared {passRate}% of your assessments with flying colors.</p>

                        <div className="grid grid-cols-3 gap-6 mt-10">
                            <div>
                                <div className="text-4xl font-black text-white">{avgScore}%</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Average</div>
                            </div>
                            <div>
                                <div className="text-4xl font-black text-white">{topScore}%</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Best</div>
                            </div>
                            <div>
                                <div className="text-4xl font-black text-white">{results.length}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Total</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[2.5rem] bg-indigo-600 p-10 text-white shadow-2xl flex flex-col items-center justify-center text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div className="relative z-10 space-y-4">
                        <div className="relative">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle className="text-white/20" strokeWidth="8" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64" />
                                <circle
                                    className="text-white"
                                    strokeWidth="8"
                                    strokeDasharray={351.8}
                                    strokeDashoffset={351.8 - (passRate / 100) * 351.8}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="56"
                                    cx="64"
                                    cy="64"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-3xl font-black">{passRate}%</div>
                            </div>
                        </div>
                        <div className="text-sm font-black uppercase tracking-widest">Success Rate</div>
                        <p className="text-indigo-100 text-xs font-medium">You are performing better than <br /> 85% of your peers.</p>
                    </div>
                </motion.div>
            </div>

            {/* Results Grid */}
            <div className="space-y-6">
                <div className="flex items-end justify-between px-2">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Recent Statements</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">Detailed breakdown of your latest evaluations</p>
                    </div>
                    <button className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:opacity-70 flex items-center gap-2">
                        Export Report <ArrowRight size={14} />
                    </button>
                </div>

                {results.length === 0 ? (
                    <motion.div
                        variants={itemVariants}
                        className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
                    >
                        <Shell size={48} className="mx-auto text-slate-300 mb-4 animate-bounce" />
                        <h3 className="text-xl font-bold dark:text-white mb-2">No results yet</h3>
                        <p className="text-slate-500 max-w-xs mx-auto">Complete your first exam to see your performance metrics here.</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {results.map((result) => (
                            <motion.div
                                key={result.id}
                                variants={itemVariants}
                                whileHover={{ y: -5 }}
                                className="glass group relative overflow-hidden rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-2xl transition-all"
                            >
                                <div className="p-8">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">{result.exam_title}</h3>
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                <Star size={12} className="text-yellow-500" />
                                                <span>Level: Advanced</span>
                                                <span>•</span>
                                                <span>{new Date(result.completed_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-2xl border-2 ${getGradeColor(result.grade)}`}>
                                            {result.grade}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${result.percentage}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={`absolute inset-y-0 left-0 rounded-full ${result.percentage >= 50 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-rose-500'}`}
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-950 text-center border border-slate-100 dark:border-white/5">
                                                <div className="text-lg font-black">{result.score}/{result.total_marks}</div>
                                                <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mt-1">Raw Marks</div>
                                            </div>
                                            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-950 text-center border border-slate-100 dark:border-white/5">
                                                <div className="text-lg font-black">{result.percentage}%</div>
                                                <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mt-1">Accuracy</div>
                                            </div>
                                            <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 text-center border border-slate-100 dark:border-white/5 flex items-center justify-center">
                                                <button
                                                    onClick={() => navigate(`/results/${result.id}`)}
                                                    className="w-full h-full flex flex-col items-center justify-center hover:text-emerald-500 transition-colors"
                                                >
                                                    <Zap size={20} className="mb-1" />
                                                    <div className="text-[8px] font-bold uppercase tracking-widest">Explore</div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default StudentResults;
