import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import examService from '../../services/examService';
import { ClipboardList, Clock, AlertTriangle, Play, ShieldAlert, Cpu, ArrowLeft, CheckCircle2, Info } from 'lucide-react';

interface ExamDetails {
    id: number;
    title: string;
    description: string;
    duration_minutes: number;
    instructions: string[];
    rules: string[];
    total_questions: number;
}

const ExamInstructions: React.FC = () => {
    const { examId } = useParams<{ examId: string }>();
    const navigate = useNavigate();

    const [exam, setExam] = useState<ExamDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [agree, setAgree] = useState(false);

    const loadExamDetails = useCallback(async () => {
        if (!examId) return;
        try {
            const result = await examService.getExamDetails(parseInt(examId));
            if (result.success && result.data) {
                setExam(result.data);
            } else {
                toast.error(result.error || 'Failed to load exam details');
                navigate('/student');
            }
        } catch (error) {
            toast.error('An error occurred while loading exam details');
            navigate('/student');
        } finally {
            setLoading(false);
        }
    }, [examId, navigate]);

    useEffect(() => {
        loadExamDetails();
    }, [loadExamDetails]);

    const handleStartExam = async () => {
        if (!examId || !agree) return;
        try {
            const result = await examService.startExam(parseInt(examId));
            if (result.success && result.data) {
                navigate(`/exam/${result.data.id}`);
            } else {
                // result.error contains the backend error message (e.g., "This exam is not currently available")
                toast.error(result.error || 'Failed to start exam');
                console.error('Exam start failed:', result.error);

                // If the error indicates unavailability, we should probably redirect back
                if (result.error?.includes('not currently available') || result.error?.includes('Maximum attempts')) {
                    setTimeout(() => navigate('/student'), 3000);
                }
            }
        } catch (error: any) {
            toast.error('An error occurred while starting the exam');
            console.error('Exam start error:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
                <div className="h-1.5 w-48 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="h-full bg-indigo-600"
                    />
                </div>
                <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest mt-4">Preparing Assessment Assets...</p>
            </div>
        );
    }

    if (!exam) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto pb-12"
        >
            <div className="mb-10 px-4">
                <button
                    onClick={() => navigate('/student')}
                    className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-black uppercase text-[10px] tracking-widest mb-6"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Terminal
                </button>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                    {exam.title}
                </h1>
                <p className="text-slate-500 font-medium mt-2 max-w-2xl">{exam.description || 'Professional academic assessment of your core competencies.'}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
                {/* Left Column: Rules & Instructions */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="glass rounded-[2.5rem] p-10 border border-slate-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                                <ClipboardList size={24} />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Instructions</h2>
                        </div>
                        <ul className="space-y-6">
                            {(exam.instructions && exam.instructions.length > 0 ? exam.instructions : [
                                "Read each question carefully before responding.",
                                "You can navigate between questions using the navigation bar.",
                                "All answers are automatically saved to our secure server.",
                                "Do not refresh the page or close the browser during the session."
                            ]).map((instruction, idx) => (
                                <li key={idx} className="flex gap-4">
                                    <div className="h-6 w-6 mt-0.5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={14} />
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{instruction}</p>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="glass rounded-[2.5rem] p-10 border border-slate-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center">
                                <ShieldAlert size={24} />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Proctoring Rules</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(exam.rules && exam.rules.length > 0 ? exam.rules : [
                                "Zero tolerance for plagiarism or unauthorized materials.",
                                "Mobile phones and smart devices must be powered off.",
                                "Multiple browser tabs detected will result in instant disqualification.",
                                "No talking or external communication permitted."
                            ]).map((rule, idx) => (
                                <div key={idx} className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                                    <div className="text-rose-500 mb-2">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{rule}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column: Meta & Actions */}
                <div className="space-y-6">
                    <div className="relative overflow-hidden rounded-[2.5rem] p-10 bg-slate-900 text-white shadow-2xl">
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 bg-indigo-500/20 blur-3xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 rounded-lg bg-white/10">
                                    <Cpu size={20} className="text-indigo-400" />
                                </div>
                                <h3 className="font-black uppercase tracking-widest text-[10px] text-indigo-400">Environment Specs</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Duration</div>
                                    <div className="flex items-center gap-2 font-black text-xl">
                                        <Clock size={18} className="text-emerald-500" />
                                        {exam.duration_minutes}m
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Questions</div>
                                    <div className="font-black text-xl">{exam.total_questions || 0} Items</div>
                                </div>
                                <div className="h-px bg-white/10 w-full"></div>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-widest">Secure session ready.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30">
                        <h4 className="font-black text-xl mb-4 text-center">Final Confirmation</h4>
                        <p className="text-indigo-100 text-sm font-medium mb-8 text-center leading-relaxed">By proceeding, you acknowledge all rules and are ready to be evaluated.</p>

                        <label className="flex items-center gap-4 cursor-pointer mb-8 group justify-center">
                            <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-colors ${agree ? 'bg-white border-white shadow-lg' : 'border-indigo-400 group-hover:border-white'}`}>
                                {agree && <Play size={12} className="text-indigo-600 fill-indigo-600" />}
                            </div>
                            <input
                                type="checkbox"
                                checked={agree}
                                onChange={(e) => setAgree(e.target.checked)}
                                className="hidden"
                            />
                            <span className="text-sm font-black uppercase tracking-widest">I am ready</span>
                        </label>

                        <button
                            onClick={handleStartExam}
                            disabled={!agree}
                            className={`w-full py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${agree
                                ? 'bg-white text-indigo-600 shadow-xl hover:scale-105 active:scale-95'
                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                                }`}
                        >
                            <Play size={18} fill="currentColor" />
                            Initiate session
                        </button>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] flex gap-4">
                        <Info size={24} className="text-amber-500 shrink-0" />
                        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest leading-relaxed">Ensure a stable connection before initiation.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ExamInstructions;
