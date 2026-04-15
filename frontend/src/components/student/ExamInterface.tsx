import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Exam, Question as QuestionType } from '../../types';
import examService from '../../services/examService';
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, CheckSquare, List, Info, Timer, Maximize2, Minimize2, Settings } from 'lucide-react';
import LoadingScreen from '../common/LoadingScreen';

// Types
interface Option {
    id: number;
    text: string;
    order: number;
}

interface Question {
    id: number;
    text: string;
    options: Option[];
    question_type: 'multiple_choice' | 'true_false' | 'short_answer';
    marks: number;
}

interface ExamData {
    attempt_id: number;
    exam_title: string;
    duration_minutes: number;
    questions: Question[];
    remaining_time: number;
}

const ExamInterface: React.FC = () => {
    const { attemptId } = useParams<{ attemptId: string }>();
    const navigate = useNavigate();

    const [examData, setExamData] = useState<ExamData | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [questionId: number]: string }>({});
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showOverview, setShowOverview] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const loadExam = useCallback(async () => {
        if (!attemptId) return;
        try {
            const result = await examService.getAttempt(parseInt(attemptId));
            if (result.success && result.data) {
                setExamData(result.data as any);
                setTimeLeft((result.data as any).remaining_time || (result.data as any).duration_minutes * 60);
                // Load existing answers if any
                const initialAnswers: { [key: number]: string } = {};
                ((result.data as any).questions || []).forEach((q: any) => {
                    if (q.current_answer) initialAnswers[q.id] = q.current_answer;
                });
                setAnswers(initialAnswers);
            } else {
                toast.error(result.error || 'Failed to load exam');
                navigate('/student');
            }
        } catch (error) {
            toast.error('An error occurred while loading the exam');
            navigate('/student');
        } finally {
            setLoading(false);
        }
    }, [attemptId, navigate]);

    useEffect(() => {
        loadExam();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [loadExam]);

    useEffect(() => {
        if (timeLeft > 0 && !isSubmitting) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        handleAutoSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timeLeft, isSubmitting]);

    const handleAutoSubmit = async () => {
        toast.warning('Time is up! Submitting your exam...');
        await handleSubmit();
    };

    const handleAnswerChange = (questionId: number, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));

        const question = examData?.questions.find(q => q.id === questionId);
        const isObjective = question?.question_type === 'multiple_choice' || question?.question_type === 'true_false';

        // Save progress silently using correct payload shape
        examService.saveAnswer({
            attempt: parseInt(attemptId!),
            question: questionId,
            ...(isObjective ? { selected_option: parseInt(answer) } : { answer_text: answer })
        });
    };

    const handleSubmit = async () => {
        if (!attemptId || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const result = await examService.submitExamAttempt(parseInt(attemptId));
            if (result.success) {
                toast.success('Exam submitted successfully!');
                navigate('/student/results');
            } else {
                toast.error(result.error || 'Failed to submit exam');
                setIsSubmitting(false);
            }
        } catch (error) {
            toast.error('An error occurred during submission');
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} `;
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    if (loading || !examData) {
        return <LoadingScreen message="Syncing Secure Interface" transparent />;
    }

    const currentQuestion = examData.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / examData.questions.length) * 100;
    const isAnswered = (id: number) => !!answers[id];

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col">
            {/* Minimal Header */}
            <header className="h-20 flex items-center justify-between px-6 md:px-12 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl z-20">
                <div className="flex items-center gap-6">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/20">
                        {examData.exam_title[0]}
                    </div>
                    <div>
                        <h1 className="font-black text-sm uppercase tracking-widest text-slate-400 truncate max-w-[200px] md:max-w-md">
                            {examData.exam_title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4 md:gap-8">
                    <div className={`flex items - center gap - 3 px - 6 py - 2.5 rounded - 2xl border transition - colors ${timeLeft < 300 ? 'bg-rose-500/10 border-rose-500/50 text-rose-500 animate-pulse' : 'bg-white/5 border-white/10'} `}>
                        <Timer size={18} />
                        <span className="font-black tabular-nums text-lg">{formatTime(timeLeft)}</span>
                    </div>

                    <button
                        onClick={() => setShowOverview(!showOverview)}
                        className={`p - 3 rounded - 2xl transition - all ${showOverview ? 'bg-indigo-600 text-white' : 'hover:bg-white/5 text-slate-400'} `}
                    >
                        <List size={22} />
                    </button>

                    <button
                        onClick={toggleFullscreen}
                        className="hidden md:flex p-3 rounded-2xl hover:bg-white/5 text-slate-400 transition-all"
                    >
                        {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative py-8 md:py-16">
                <div className="max-w-4xl mx-auto px-6">
                    {/* Question Indicator */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <span className="text-4xl md:text-5xl font-black text-indigo-500">
                                {String(currentQuestionIndex + 1).padStart(2, '0')}
                            </span>
                            <div className="h-10 w-px bg-white/10 mx-2"></div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Point Weight</div>
                                <div className="text-sm font-bold text-slate-300">{currentQuestion.marks} Marks</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {examData.questions.slice(Math.max(0, currentQuestionIndex - 2), currentQuestionIndex + 3).map((_, i) => (
                                <div key={i} className={`h - 1.5 w - 6 rounded - full transition - all ${i + Math.max(0, currentQuestionIndex - 2) === currentQuestionIndex ? 'bg-indigo-500 w-12' : 'bg-white/10'} `}></div>
                            ))}
                        </div>
                    </div>

                    {/* Question Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuestion.id}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-12"
                        >
                            <h2 className="text-2xl md:text-3xl font-bold leading-relaxed text-slate-100">
                                {currentQuestion.text}
                            </h2>

                            <div className="grid grid-cols-1 gap-4">
                                {(currentQuestion.options || []).map((opt, index) => {
                                    const letter = String.fromCharCode(65 + index);
                                    const optIdStr = opt.id.toString();
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleAnswerChange(currentQuestion.id, optIdStr)}
                                            className={`group relative flex items-center gap-6 p-6 rounded-[2rem] border-2 text-left transition-all duration-300 ${answers[currentQuestion.id] === optIdStr
                                                ? 'bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-600/20'
                                                : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                                                }`}
                                        >
                                            <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center font-black text-xl transition-colors ${answers[currentQuestion.id] === optIdStr ? 'bg-white text-indigo-600' : 'bg-white/10 text-slate-400 group-hover:text-white'
                                                }`}>
                                                {letter}
                                            </div>
                                            <div className={`text-lg font-medium flex-1 ${answers[currentQuestion.id] === optIdStr ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                                {opt.text}
                                            </div>
                                            {answers[currentQuestion.id] === optIdStr && (
                                                <div className="absolute right-8">
                                                    <CheckSquare size={24} className="text-white/50" />
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Sticky Navigation Footer */}
            <footer className="py-6 px-6 md:px-12 bg-slate-950 border-t border-white/5">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    <button
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                        className="h-14 md:h-16 px-6 md:px-10 rounded-3xl bg-white/5 flex items-center gap-3 font-black uppercase text-xs tracking-widest text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={20} />
                        <span className="hidden md:inline">Previous Question</span>
                    </button>

                    <div className="flex-1 max-w-xs flex items-center gap-4 group">
                        <div className="relative flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-indigo-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}% ` }}
                                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                            />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 group-hover:text-indigo-400 transition-colors uppercase tracking-widest whitespace-nowrap">
                            {Math.round(progress)}% Focused
                        </span>
                    </div>

                    <div className="flex gap-4">
                        {currentQuestionIndex === examData.questions.length - 1 ? (
                            <button
                                onClick={() => {
                                    const unansweredCount = examData.questions.length - Object.keys(answers).length;
                                    const message = unansweredCount > 0
                                        ? `Warning: You have ${unansweredCount} unanswered questions.Submit anyway ? `
                                        : 'Are you sure you want to finish and submit?';

                                    toast(
                                        ({ closeToast }) => (
                                            <div>
                                                <p className="mb-4 text-sm font-medium text-slate-800 dark:text-slate-200">{message}</p>
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                                        onClick={closeToast}
                                                    >
                                                        Return Options
                                                    </button>
                                                    <button
                                                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 active:scale-95"
                                                        onClick={() => {
                                                            if (closeToast) closeToast();
                                                            handleSubmit();
                                                        }}
                                                    >
                                                        Confirm Submission
                                                    </button>
                                                </div>
                                            </div>
                                        ),
                                        { autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
                                    );
                                }}
                                disabled={isSubmitting}
                                className="h-14 md:h-16 px-10 md:px-16 rounded-3xl bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 flex items-center gap-3 font-black uppercase text-xs tracking-widest text-white transition-all scale-105 active:scale-95"
                            >
                                <Send size={20} />
                                {isSubmitting ? 'Syncing...' : 'Final Submission'}
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                className="h-14 md:h-16 px-6 md:px-10 rounded-3xl bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/10 flex items-center gap-3 font-black uppercase text-xs tracking-widest text-white transition-all"
                            >
                                <span className="hidden md:inline">Advance Question</span>
                                <ChevronRight size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </footer>

            {/* Quick Overview Overlay */}
            <AnimatePresence>
                {showOverview && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowOverview(false)}
                            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[30]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-slate-900 border-l border-white/5 z-[40] p-8 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">Exam Strategy</h2>
                                <button onClick={() => setShowOverview(false)} className="text-slate-500 hover:text-white transition-colors">
                                    < ChevronRight size={28} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                            <CheckSquare size={24} />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-white">{Object.keys(answers).length}</div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Answered</div>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(Object.keys(answers).length / examData.questions.length) * 100}% ` }}></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-3">
                                    {examData.questions.map((q, idx) => (
                                        <button
                                            key={q.id}
                                            onClick={() => {
                                                setCurrentQuestionIndex(idx);
                                                setShowOverview(false);
                                            }}
                                            className={`h - 12 rounded - 2xl font - black text - xs transition - all ${currentQuestionIndex === idx
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-105 ring-2 ring-indigo-400 ring-offset-4 ring-offset-slate-900'
                                                : isAnswered(q.id)
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
                                                } `}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                </div>

                                <div className="pt-8 space-y-4">
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3 text-amber-200">
                                        <Info size={20} className="shrink-0" />
                                        <p className="text-xs font-medium leading-relaxed italic">
                                            Tip: Unanswered questions are marked in grey. You can jump to any question by clicking its index above.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        className="w-full py-5 rounded-2xl bg-indigo-600 font-black uppercase text-xs tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/10"
                                    >
                                        Final Sync & Finish
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ExamInterface;
