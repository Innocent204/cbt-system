import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Clock, User, BookOpen, ChevronRight, MessageSquare, Award, Search, Filter } from 'lucide-react';
import LoadingScreen from '../common/LoadingScreen';
import gradingService, { PendingGradingAnswer } from '../../services/gradingService';
import examService from '../../services/examService';
import { Exam } from '../../types';
import { toast } from 'react-toastify';

const ManualGrading: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState<Exam[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<number | 'all'>('all');
    const [pendingAnswers, setPendingAnswers] = useState<PendingGradingAnswer[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<PendingGradingAnswer | null>(null);
    const [isGrading, setIsGrading] = useState(false);
    const [marks, setMarks] = useState<number>(0);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchPendingAnswers();
    }, [selectedExamId]);

    const fetchInitialData = async () => {
        const res = await examService.getExams();
        if (res.success && res.data) {
            setExams(res.data);
        }
    };

    const fetchPendingAnswers = async () => {
        setLoading(true);
        const examId = selectedExamId === 'all' ? undefined : selectedExamId;
        const res = await gradingService.getPendingGrading(examId);
        if (res.success && res.data) {
            setPendingAnswers(res.data);
        } else {
            toast.error(res.error || 'Failed to load pending submissions');
        }
        setLoading(false);
    };

    const handleOpenGrading = (answer: PendingGradingAnswer) => {
        setSelectedAnswer(answer);
        setMarks(Number(answer.marks_obtained) || 0);
        setFeedback(answer.feedback || '');
    };

    const handleSubmitGrade = async () => {
        if (!selectedAnswer) return;

        setIsGrading(true);
        const res = await gradingService.submitGrade(selectedAnswer.id, {
            marks_obtained: marks,
            feedback: feedback
        });
        setIsGrading(false);

        if (res.success) {
            toast.success('Grade submitted successfully');
            setSelectedAnswer(null);
            fetchPendingAnswers();
        } else {
            toast.error(res.error || 'Failed to submit grade');
        }
    };

    if (loading && pendingAnswers.length === 0) {
        return <LoadingScreen fullScreen={false} message="Fetching grading queue..." transparent />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">Manual Grading</h2>
                    <p className="text-gray-600 dark:text-dark-text-secondary">Review and grade subjective student responses</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Filter size={18} className="text-gray-400" />
                    <select
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border-primary rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-dark-text-primary"
                    >
                        <option value="all">All Exams</option>
                        {exams.map(exam => (
                            <option key={exam.id} value={exam.id}>{exam.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Submissions List */}
                <div className="lg:col-span-1 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                    {pendingAnswers.length === 0 ? (
                        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border-primary rounded-xl p-8 text-center">
                            <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
                            <p className="font-semibold text-gray-900 dark:text-dark-text-primary">All caught up!</p>
                            <p className="text-sm text-gray-500 dark:text-dark-text-secondary">No pending answers require grading.</p>
                        </div>
                    ) : (
                        pendingAnswers.map((answer) => (
                            <button
                                key={answer.id}
                                onClick={() => handleOpenGrading(answer)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedAnswer?.id === answer.id
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-md ring-1 ring-indigo-500'
                                    : 'border-gray-200 dark:border-dark-border-primary bg-white dark:bg-dark-surface hover:border-indigo-300 dark:hover:border-indigo-500/50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 px-2 py-1 rounded">
                                        Attempt #{answer.attempt}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-dark-text-secondary flex items-center">
                                        <Clock size={12} className="mr-1" />
                                        {new Date(answer.answered_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary line-clamp-1 mb-1">{answer.question_text}</h4>
                                <p className="text-sm text-gray-500 dark:text-dark-text-secondary line-clamp-2 italic">
                                    "{answer.answer_text}"
                                </p>
                            </button>
                        ))
                    )}
                </div>

                {/* Grading Workspace */}
                <div className="lg:col-span-2">
                    {selectedAnswer ? (
                        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border-primary rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-6 border-b border-gray-200 dark:border-dark-border-primary bg-gray-50/50 dark:bg-dark-surface/50">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">Review Submission</h3>
                                        <div className="flex items-center space-x-4 text-sm">
                                            <span className="flex items-center text-gray-600 dark:text-dark-text-secondary">
                                                <User size={14} className="mr-1" />
                                                ID: {selectedAnswer.id}
                                            </span>
                                            <span className="flex items-center text-gray-600 dark:text-dark-text-secondary">
                                                <Award size={14} className="mr-1" />
                                                Max Marks: {selectedAnswer.question_marks}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Question Section */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Question</label>
                                    <div className="p-4 bg-indigo-50/30 dark:bg-indigo-500/5 rounded-xl border border-indigo-100/50 dark:border-indigo-500/10">
                                        <p className="text-gray-900 dark:text-dark-text-primary font-medium text-lg leading-relaxed">
                                            {selectedAnswer.question_text}
                                        </p>
                                    </div>
                                </div>

                                {/* Answer Section */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Student Response</label>
                                    <div className="p-6 bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-border-primary shadow-inner">
                                        <p className="text-gray-800 dark:text-dark-text-primary whitespace-pre-wrap leading-relaxed">
                                            {selectedAnswer.answer_text || <span className="text-gray-400 italic">No response provided.</span>}
                                        </p>
                                    </div>
                                </div>

                                {/* Grading Form */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100 dark:border-dark-border-primary">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-dark-text-primary">Marks Obtained</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max={selectedAnswer.question_marks}
                                                step="0.5"
                                                value={marks}
                                                onChange={(e) => setMarks(Number(e.target.value))}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-dark-text-primary font-bold text-lg"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                                / {selectedAnswer.question_marks}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-dark-text-primary">Examiner Feedback</label>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-4 top-4 text-gray-400" size={18} />
                                            <textarea
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                                placeholder="Provide constructive feedback..."
                                                rows={3}
                                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border-primary flex justify-end space-x-3">
                                <button
                                    onClick={() => setSelectedAnswer(null)}
                                    className="px-6 py-2.5 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-200 dark:hover:bg-dark-secondary rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitGrade}
                                    disabled={isGrading}
                                    className={`px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center space-x-2 ${isGrading
                                        ? 'bg-gray-400 text-white cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/25 active:scale-95'
                                        }`}
                                >
                                    {isGrading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={20} />
                                            <span>Submit Grade</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-indigo-50/50 dark:bg-dark-surface/30 border-2 border-dashed border-indigo-200 dark:border-dark-border-primary rounded-3xl p-24 text-center">
                            <div className="bg-indigo-100 dark:bg-indigo-500/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <BookOpen size={40} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">Select a submission</h3>
                            <p className="text-gray-600 dark:text-dark-text-secondary max-w-sm mx-auto">
                                Choose a student's answer from the list on the left to begin the manual review process.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManualGrading;
