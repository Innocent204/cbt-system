import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Copy, Eye, Filter, BookOpen, Tag, Clock, Star, Upload, X, AlertCircle, CheckCircle2, FileText, BarChart3 } from 'lucide-react';
import questionService from '../../services/questionService';
import examService from '../../services/examService';
import LoadingScreen from '../common/LoadingScreen';
import { Exam } from '../../types';
import { toast } from 'react-toastify';

interface Question {
  id: number;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  tags: string[];
  createdAt: string;
  lastModified: string;
  usageCount: number;
  bankId?: number;
}

interface QuestionBank {
  id: number;
  name: string;
  description: string;
  category: string;
  courseId: number;
  questionCount: number;
  createdAt: string;
  lastModified: string;
}

const QuestionBankManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'questions' | 'banks'>('questions');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [exams, setExams] = useState<Exam[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [analyzingQuestionId, setAnalyzingQuestionId] = useState<number | null>(null);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | 'all'>('all');

  useEffect(() => {
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, [urlSearch]);

  useEffect(() => {
    fetchData();
  }, [selectedCourseId]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const res = await examService.getCourses();
    if (res.success && res.data) {
      setCourses(res.data);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [questionsRes, examsRes, banksRes] = await Promise.all([
        questionService.getQuestions(undefined, selectedCourseId === 'all' ? undefined : selectedCourseId),
        examService.getExams(),
        questionService.getQuestionBanks()
      ]);

      if (questionsRes.success && questionsRes.data) {
        // Map backend Question to frontend Question interface
        const mappedQuestions = questionsRes.data.map(q => ({
          id: q.id,
          questionText: q.text,
          questionType: q.question_type === 'mcq' ? 'multiple_choice' : q.question_type,
          category: q.difficulty, // Placeholder: using difficulty as category
          difficulty: q.difficulty,
          points: Number(q.marks),
          options: q.options?.map(o => o.text),
          correctAnswer: q.question_type === 'short_answer' ? q.correct_answer_text : q.options?.find(o => o.is_correct)?.text || '',
          tags: q.tags || [],
          createdAt: q.created_at || '',
          lastModified: q.updated_at || '',
          usageCount: q.usage_count || 0,
          bankId: q.bank
        }));
        setQuestions(mappedQuestions as any);
      }

      if (examsRes.success && examsRes.data) {
        setExams(examsRes.data);
      }

      if (banksRes.success && banksRes.data) {
        const mappedBanks: QuestionBank[] = banksRes.data.map((b: any) => ({
          id: b.id,
          name: b.name,
          description: b.description || '',
          category: b.course || 'N/A',
          courseId: b.course_id,
          questionCount: b.total_questions || 0,
          createdAt: b.created_at,
          lastModified: b.updated_at
        }));
        setQuestionBanks(mappedBanks);
      }
    } catch (error) {
      toast.error('Failed to load question bank data');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || question.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || question.difficulty === difficultyFilter;
    const matchesType = typeFilter === 'all' || question.questionType === typeFilter;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesType;
  });

  const handleSelectQuestion = (questionId: number) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleDuplicateSelected = () => {
    toast.info('Duplicate functionality coming soon');
  };

  const handleDeleteSelected = async () => {
    if (selectedQuestions.length === 0) return;
    
    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-4 text-sm font-medium text-slate-800 dark:text-slate-200">
            Are you sure you want to delete {selectedQuestions.length} selected question{selectedQuestions.length > 1 ? 's' : ''}?
          </p>
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              onClick={closeToast}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/20 active:scale-95"
              onClick={async () => {
                if (closeToast) closeToast();
                // Delete selected questions
                for (const questionId of selectedQuestions) {
                  const response = await questionService.deleteQuestion(questionId);
                  if (!response.success) {
                    toast.error(`Failed to delete question ${questionId}`);
                  }
                }
                toast.success(`${selectedQuestions.length} question(s) deleted successfully`);
                setSelectedQuestions([]);
                fetchQuestions();
              }}
            >
              Confirm Delete
            </button>
          </div>
        </div>
      ),
      { autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-101 text-yellow-800';
      case 'hard': return 'bg-red-101 text-red-800';
      default: return 'bg-gray-101 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'bg-blue-101 text-blue-800';
      case 'true_false': return 'bg-purple-101 text-purple-800';
      case 'short_answer': return 'bg-orange-101 text-orange-800';
      case 'essay': return 'bg-pink-101 text-pink-800';
      default: return 'bg-gray-101 text-gray-800';
    }
  };

  const getPointsColor = (points: number) => {
    if (points <= 3) return 'text-green-600';
    if (points <= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <LoadingScreen fullScreen={false} message="Synchronizing Question Bank" transparent />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">Question Bank Management</h2>
          <p className="text-gray-600 dark:text-dark-text-secondary">Create, organize, and manage exam questions</p>
        </div>
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-all active:scale-95"
        >
          <Upload size={20} />
          <span className="hidden sm:inline">Bulk Import</span>
        </button>

        {activeTab === 'banks' ? (
          <button
            onClick={() => setIsBankModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Plus size={20} />
            <span>Add Bank</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setEditingQuestion(null);
              setIsQuestionModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Plus size={20} />
            <span>Add Question</span>
          </button>
        )}
      </div>
      {/* Course Filter */}
      <div className="bg-white dark:bg-dark-surface p-4 rounded-xl shadow-sm border border-gray-200 dark:border-dark-border-primary flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-gray-500 dark:text-dark-text-secondary">
          <Filter size={20} />
          <span className="font-medium text-sm">Course Pool:</span>
        </div>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary min-w-[200px]"
        >
          <option value="all">All Courses (Full Pool)</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{questions.length}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <BookOpen size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Question Banks</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{questionBanks.length}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Tag size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Exams Linked</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{exams.length}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Filter size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Growth</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Stable</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Star size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
        <div className="border-b border-gray-200 dark:border-dark-border-primary">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('questions')}
              className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${activeTab === 'questions'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              Questions ({questions.length})
            </button>
            <button
              onClick={() => setActiveTab('banks')}
              className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${activeTab === 'banks'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              Question Banks ({questionBanks.length})
            </button>
          </nav>
        </div>

        {/* Filters */}
        {activeTab === 'questions' && (
          <div className="p-4 border-b border-gray-200 dark:border-dark-border-primary">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-secondary border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter size={20} className="text-gray-500" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary outline-none"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="essay">Essay</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {/* Bulk Actions */}
              {selectedQuestions.length > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-indigo-800 dark:text-indigo-300">
                    {selectedQuestions.length} question{selectedQuestions.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDuplicateSelected()}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleDeleteSelected()}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((question) => (
                  <div key={question.id} className="border border-gray-200 dark:border-dark-border-primary rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-dark-surface/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.id)}
                          onChange={() => handleSelectQuestion(question.id)}
                          className="mt-1 rounded border-gray-300 dark:border-dark-border-primary text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary">{question.questionText}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(question.questionType)}`}>
                              {question.questionType.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
                              {question.difficulty}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-dark-secondary ${getPointsColor(question.points)}`}>
                              {question.points} pts
                            </span>
                          </div>

                          {question.options && question.options.length > 0 && (
                            <div className="mb-3 space-y-1">
                              {question.options.map((option, index) => (
                                <div key={index} className="flex items-center space-x-2 text-sm">
                                  <span className="font-medium text-gray-600 dark:text-gray-400">{String.fromCharCode(65 + index)}.</span>
                                  <span className={option === question.correctAnswer ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-700 dark:text-gray-300'}>
                                    {option}
                                  </span>
                                  {option === question.correctAnswer && <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-4">
                            <span className="flex items-center space-x-1">
                              <Tag size={14} />
                              <span>{question.difficulty}</span>
                            </span>
                            {question.bankId && (
                              <span className="flex items-center space-x-1">
                                <BookOpen size={14} />
                                <span>Bank: {questionBanks.find(b => b.id === question.bankId)?.name || 'Unknown'}</span>
                              </span>
                            )}
                            {question.tags && question.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                {question.tags.map((tag, i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-dark-secondary rounded text-[10px] uppercase font-bold tracking-wider">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <span>Modified: {new Date(question.lastModified).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Stats"
                          onClick={() => {
                            setAnalyzingQuestionId(question.id);
                            setIsStatsModalOpen(true);
                          }}
                        >
                          <BarChart3 size={16} />
                        </button>
                        <button
                          className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Edit"
                          onClick={() => {
                            setEditingQuestion(question);
                            setIsQuestionModalOpen(true);
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                          onClick={() => {
                            toast(
                              ({ closeToast }) => (
                                <div>
                                  <p className="mb-4 text-sm font-medium text-slate-800 dark:text-slate-200">Are you sure you want to delete this question?</p>
                                  <div className="flex justify-end gap-2">
                                    <button
                                      className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                      onClick={closeToast}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/20 active:scale-95"
                                      onClick={async () => {
                                        if (closeToast) closeToast();
                                        const res = await questionService.deleteQuestion(question.id);
                                        if (res.success) {
                                          toast.success('Question deleted');
                                          fetchData();
                                        } else {
                                          toast.error(res.error || 'Failed to delete');
                                        }
                                      }}
                                    >
                                      Confirm Delete
                                    </button>
                                  </div>
                                </div>
                              ),
                              { autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
                            );
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-dark-secondary/20 rounded-xl border border-dashed border-gray-200 dark:border-dark-border-primary">
                  <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 dark:text-dark-text-secondary">No questions found matching your filters</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'banks' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {questionBanks.map((bank) => (
                <div key={bank.id} className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border-primary rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
                      <BookOpen size={24} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <button
                      onClick={() => {
                        setEditingBank(bank);
                        setIsBankModalOpen(true);
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-1">{bank.name}</h3>
                  <p className="text-gray-600 dark:text-dark-text-secondary text-sm mb-4 line-clamp-2">{bank.description}</p>

                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>Questions:</span>
                      <span className="font-medium text-gray-700 dark:text-dark-text-primary">{bank.questionCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span className="font-medium text-gray-700 dark:text-dark-text-primary">{new Date(bank.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-border-primary flex space-x-2">
                    <button
                      onClick={() => {
                        setActiveTab('questions');
                        setSearchTerm(bank.name);
                        toast.info(`Showing questions from "${bank.name}"`);
                      }}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all active:scale-95 shadow-sm"
                    >
                      View Questions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Question Form Modal */}
      {isQuestionModalOpen && (
        <QuestionFormModal
          isOpen={isQuestionModalOpen}
          onClose={() => {
            setIsQuestionModalOpen(false);
            setEditingQuestion(null);
          }}
          exams={exams}
          courses={courses}
          questionBanks={questionBanks}
          question={editingQuestion}
          onSuccess={fetchData}
        />
      )}

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <BulkImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          exams={exams}
          questionBanks={questionBanks}
          courses={courses}
          onSuccess={fetchData}
        />
      )}

      {/* Question Bank Form Modal */}
      {isBankModalOpen && (
        <QuestionBankFormModal
          isOpen={isBankModalOpen}
          onClose={() => {
            setIsBankModalOpen(false);
            setEditingBank(null);
          }}
          courses={courses}
          onSuccess={fetchData}
          bank={editingBank}
        />
      )}

      {/* Distractor Analysis Modal */}
      {isStatsModalOpen && analyzingQuestionId && (
        <DistractorAnalysisModal
          isOpen={isStatsModalOpen}
          onClose={() => {
            setIsStatsModalOpen(false);
            setAnalyzingQuestionId(null);
          }}
          questionId={analyzingQuestionId}
        />
      )}
    </div>
  );
};

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: Exam[];
  questionBanks: QuestionBank[];
  courses: any[];
  onSuccess: () => void;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ onClose, exams, questionBanks, courses, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importTarget, setImportTarget] = useState<'course' | 'exam' | 'bank'>('course');
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
  const [selectedExamId, setSelectedExamId] = useState<number | ''>('');
  const [selectedBankId, setSelectedBankId] = useState<number | ''>('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.json')) {
        setFile(droppedFile);
      } else {
        toast.error('Only CSV and JSON files are supported');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (importTarget === 'exam' && !selectedExamId) {
      toast.error('Please select an exam');
      return;
    }

    if (importTarget === 'bank' && !selectedBankId) {
      toast.error('Please select a question bank');
      return;
    }

    if (importTarget === 'course' && !selectedCourseId) {
      toast.error('Please select a course');
      return;
    }

    setIsUploading(true);
    const res = await questionService.bulkImport(
      importTarget === 'exam' ? (selectedExamId as number) : undefined,
      file,
      importTarget === 'bank' ? (selectedBankId as number) : undefined,
      importTarget === 'course' ? (selectedCourseId as number) : undefined
    );
    setIsUploading(false);

    if (res.success) {
      toast.success(res.data?.message || 'Import successful');
      onSuccess();
      onClose();
    } else {
      toast.error(res.error || 'Failed to import questions');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-dark-border-primary flex justify-between items-center bg-gray-50/50 dark:bg-dark-surface">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
              <Upload className="text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">Bulk Question Import</h3>
              <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Upload questions via CSV or JSON</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex p-1 bg-gray-100 dark:bg-dark-secondary rounded-xl">
              <button
                onClick={() => setImportTarget('course')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${importTarget === 'course'
                  ? 'bg-white dark:bg-dark-surface text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                Target Course
              </button>
              <button
                onClick={() => setImportTarget('exam')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${importTarget === 'exam'
                  ? 'bg-white dark:bg-dark-surface text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                Target Exam
              </button>
              <button
                onClick={() => setImportTarget('bank')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${importTarget === 'bank'
                  ? 'bg-white dark:bg-dark-surface text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                Target Bank
              </button>
            </div>

            {importTarget === 'course' ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Select Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary"
                >
                  <option value="">Select a course...</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
                  ))}
                </select>
              </div>
            ) : importTarget === 'exam' ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Select Exam</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary"
                >
                  <option value="">Select an exam...</option>
                  {exams.map(exam => (
                    <option key={exam.id} value={exam.id}>{exam.title}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Select Question Bank</label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary"
                >
                  <option value="">Select a question bank...</option>
                  {questionBanks.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.name} ({bank.category})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-10 transition-all flex flex-col items-center justify-center text-center ${dragActive
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
              : 'border-gray-200 dark:border-dark-border-primary hover:border-indigo-400 dark:hover:border-indigo-500/50'
              }`}
          >
            {file ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto">
                  <FileText className="text-green-600 dark:text-green-400" size={32} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary truncate max-w-xs">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center justify-center space-x-1 mx-auto"
                >
                  <Trash2 size={14} />
                  <span>Remove file</span>
                </button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4">
                  <Upload className="text-indigo-600 dark:text-indigo-400" size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Click or drag file to upload</p>
                  <p className="text-sm text-gray-500">Support CSV and JSON files</p>
                </div>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </>
            )}
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
            <div className="flex items-start space-x-3">
              <AlertCircle size={20} className="text-amber-500 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-800 dark:text-amber-400">CSV Header Requirements:</p>
                <p className="text-amber-700 dark:text-amber-500/80">text, type (mcq/true_false/short_answer), options (separated by |), correct_answer, points, difficulty</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-dark-border-primary flex justify-end space-x-3 bg-gray-50/50 dark:bg-dark-surface">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 dark:text-dark-text-primary font-medium hover:bg-gray-100 dark:hover:bg-dark-secondary rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || (importTarget === 'exam' ? !selectedExamId : !selectedBankId) || isUploading}
            className={`px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center space-x-2 ${!file || (importTarget === 'exam' ? !selectedExamId : !selectedBankId) || isUploading
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed shadow-none'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/25 active:scale-95'
              }`}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Importing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={20} />
                <span>Start Import</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface DistractorAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: number;
}

const DistractorAnalysisModal: React.FC<DistractorAnalysisModalProps> = ({ isOpen, onClose, questionId }) => {
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && questionId) {
      fetchAnalysis();
    }
  }, [isOpen, questionId]);

  const fetchAnalysis = async () => {
    setLoading(true);
    const res = await questionService.getDistractorAnalysis(questionId);
    if (res.success) {
      setAnalysisData(res.data);
    } else {
      toast.error(res.error || 'Failed to fetch analysis');
      onClose();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-dark-border-primary flex justify-between items-center bg-gray-50/50 dark:bg-dark-surface">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
              <BarChart3 className="text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">Distractor Analysis</h3>
              <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Diagnostic performance of question options</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-gray-500 dark:text-dark-text-secondary">Analyzing student responses...</p>
            </div>
          ) : analysisData ? (
            <div className="space-y-8">
              {/* Question Text Summary */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">Question</h4>
                <p className="text-gray-900 dark:text-dark-text-primary font-medium">{analysisData.question_text}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-dark-secondary rounded-xl border border-gray-100 dark:border-dark-border-primary">
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-1">Total Responses</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{analysisData.total_responses}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-100 dark:border-green-500/20">
                  <p className="text-xs text-green-600 dark:text-green-400 mb-1">Success Rate</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {analysisData.analysis.find((a: any) => a.is_correct)?.percentage || 0}%
                  </p>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="space-y-5">
                <h4 className="text-xs font-semibold text-gray-400 dark:text-dark-text-muted uppercase tracking-wider">Option Performance</h4>
                <div className="space-y-4">
                  {analysisData.analysis.map((option: any) => (
                    <div key={option.option_id} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center space-x-2 truncate pr-4">
                          {option.is_correct ? (
                            <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-dark-border-primary flex-shrink-0" />
                          )}
                          <span className={`truncate ${option.is_correct ? 'text-green-700 dark:text-green-400 font-medium' : 'text-gray-700 dark:text-dark-text-secondary'}`}>
                            {option.option_text}
                          </span>
                        </div>
                        <span className="text-gray-500 dark:text-dark-text-muted font-mono">{option.percentage}% ({option.selection_count})</span>
                      </div>
                      <div className="h-2.5 w-full bg-gray-100 dark:bg-dark-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${option.percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${option.is_correct
                            ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                            : option.percentage > 30
                              ? 'bg-gradient-to-r from-amber-400 to-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                              : 'bg-gradient-to-r from-gray-400 to-gray-500 opacity-60'
                            }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex items-start space-x-3">
                <AlertCircle className="text-indigo-600 dark:text-indigo-400 mt-0.5" size={18} />
                <div className="text-sm">
                  <p className="font-semibold text-indigo-900 dark:text-indigo-300 mb-1">Diagnostic Insight</p>
                  <p className="text-indigo-700 dark:text-indigo-400/80 leading-relaxed">
                    {analysisData.total_responses === 0
                      ? "No student data available yet. Stats will update as students complete the exam."
                      : analysisData.analysis.find((a: any) => !a.is_correct && a.percentage > 40)
                        ? "Warning: A major distractor is confusing more than 40% of students. Consider reviewing the question clarity."
                        : "The question distractors are performing well, with student choices distributed as expected."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 dark:text-dark-text-secondary">No data available for this question.</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-dark-border-primary flex justify-end bg-gray-50/50 dark:bg-dark-surface">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-md shadow-indigo-500/20"
          >
            Finished
          </button>
        </div>
      </div>
    </div>
  );
};

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: Exam[];
  courses: any[];
  questionBanks: QuestionBank[];
  question?: any;
  onSuccess: () => void;
}

const QuestionFormModal: React.FC<QuestionFormModalProps> = ({ isOpen, onClose, exams, courses, questionBanks, question, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    course: '',
    exam: '',
    bank: '',
    question_type: 'mcq' as 'mcq' | 'true_false' | 'short_answer',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    text: '',
    marks: 1,
    order: 1,
    correct_answer_text: '',
    tags: [] as string[],
    options: [
      { text: '', is_correct: true, order: 1 },
      { text: '', is_correct: false, order: 2 }
    ]
  });

  useEffect(() => {
    if (question) {
      setFormData({
        course: question.course?.toString() || '',
        exam: question.exam?.toString() || '',
        bank: (question.bankId || question.bank)?.toString() || '',
        question_type: question.question_type as any,
        difficulty: question.difficulty as any,
        text: question.text || '',
        marks: Number(question.marks) || 1,
        order: Number(question.order) || 1,
        correct_answer_text: question.correct_answer_text || '',
        tags: question.tags || [],
        options: question.options?.length ? question.options.map((o: any) => ({
          text: o.text,
          is_correct: o.is_correct,
          order: o.order
        })) : [
          { text: '', is_correct: true, order: 1 },
          { text: '', is_correct: false, order: 2 }
        ]
      });
    }
  }, [question]);

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { text: '', is_correct: false, order: prev.options.length + 1 }]
    }));
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length <= 2) return;
    setFormData(prev => {
      const newOptions = prev.options.filter((_, i) => i !== index);
      // Ensure at least one correct answer
      if (!newOptions.some(o => o.is_correct)) {
        newOptions[0].is_correct = true;
      }
      return { ...prev, options: newOptions };
    });
  };

  const handleOptionChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newOptions = [...prev.options];
      if (field === 'is_correct' && value === true) {
        // Only one correct for MCQ/TF
        newOptions.forEach((o, i) => o.is_correct = i === index);
      } else {
        (newOptions[index] as any)[field] = value;
      }
      return { ...prev, options: newOptions };
    });
  };

  const handleSubmit = async () => {
    if (!formData.course || !formData.text) {
      toast.error('Please fill in required fields (Course and Question Text)');
      return;
    }

    setIsSubmitting(true);
    const dataToSend = {
      ...formData,
      course: Number(formData.course),
      exam: formData.exam ? Number(formData.exam) : undefined,
      bank_id: formData.bank ? Number(formData.bank) : undefined,
      marks: Number(formData.marks),
      order: Number(formData.order)
    };

    const res = question ?
      await questionService.updateQuestion(question.id, dataToSend) :
      await questionService.createQuestion(dataToSend);

    setIsSubmitting(false);

    if (res.success) {
      toast.success(question ? 'Question updated' : 'Question created');
      onSuccess();
      onClose();
    } else {
      toast.error(res.error || 'Operation failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-dark-border-primary flex justify-between items-center bg-gray-50/50 dark:bg-dark-surface">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
              <Plus className="text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">
                {question ? 'Edit Question' : 'Add New Question'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Manual question entry</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Course Pool *</label>
            <select
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-secondary border-2 border-indigo-100 dark:border-indigo-500/20 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary font-medium"
            >
              <option value="">Select Course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Assign to Exam (Optional)</label>
              <select
                value={formData.exam}
                onChange={(e) => setFormData({ ...formData, exam: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary"
              >
                <option value="">No specific exam</option>
                {exams.filter(e => !formData.course || e.course === Number(formData.course)).map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Target Bank (Optional)</label>
              <select
                value={formData.bank}
                onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary"
              >
                <option value="">No bank (Global Pool)</option>
                {questionBanks
                  .filter(b => !formData.course || b.courseId === Number(formData.course))
                  .map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))
                }
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Question Type</label>
              <select
                value={formData.question_type}
                onChange={(e) => setFormData({ ...formData, question_type: e.target.value as any })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary font-medium"
              >
                <option value="mcq">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="short_answer">Short Answer</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Question Text *</label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              rows={3}
              placeholder="Enter question text..."
              className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Marks</label>
              <input
                type="number"
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Tags (Comma separated)</label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t !== '') })}
              placeholder="e.g. math, geometry, algebra"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary"
            />
          </div>

          {(formData.question_type === 'mcq' || formData.question_type === 'true_false') && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Options</label>
                {formData.question_type === 'mcq' && (
                  <button
                    onClick={handleAddOption}
                    className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline"
                  >
                    + Add Option
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3 bg-gray-50 dark:bg-dark-secondary p-3 rounded-xl border border-gray-100 dark:border-dark-border-primary">
                    <input
                      type="radio"
                      name="correct_answer"
                      checked={option.is_correct}
                      onChange={() => handleOptionChange(index, 'is_correct', true)}
                      className="text-indigo-600 focus:ring-indigo-500 h-5 w-5"
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 bg-transparent border-none focus:ring-0 dark:text-dark-text-primary outline-none"
                    />
                    {formData.question_type === 'mcq' && formData.options.length > 2 && (
                      <button
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.question_type === 'short_answer' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Correct Answer Text</label>
              <input
                type="text"
                value={formData.correct_answer_text}
                onChange={(e) => setFormData({ ...formData, correct_answer_text: e.target.value })}
                placeholder="Enter the correct answer text..."
                className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary"
              />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-dark-border-primary flex justify-end space-x-3 bg-gray-50/50 dark:bg-dark-surface">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 dark:text-dark-text-primary font-medium hover:bg-gray-100 dark:hover:bg-dark-secondary rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center space-x-2 ${isSubmitting
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed shadow-none'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/25 active:scale-95'
              }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={20} />
                <span>{question ? 'Update Question' : 'Save Question'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface QuestionBankFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: any[];
  onSuccess: () => void;
  bank?: any;
}

function QuestionBankFormModal({ isOpen, onClose, courses, onSuccess, bank }: QuestionBankFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState<number | ''>('');
  const [easyTarget, setEasyTarget] = useState(40);
  const [mediumTarget, setMediumTarget] = useState(40);
  const [hardTarget, setHardTarget] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bank) {
      setName(bank.name);
      setDescription(bank.description || '');
      setCourseId(bank.courseId);

      if (bank.difficulty_targets) {
        setEasyTarget(bank.difficulty_targets.easy);
        setMediumTarget(bank.difficulty_targets.medium);
        setHardTarget(bank.difficulty_targets.hard);
      }
    } else {
      setName('');
      setDescription('');
      setCourseId('');
      setEasyTarget(40);
      setMediumTarget(40);
      setHardTarget(20);
    }
  }, [bank, courses, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || (!bank && !courseId)) {
      toast.error('Name and Course are required');
      return;
    }

    if (easyTarget + mediumTarget + hardTarget !== 100) {
      toast.error('Difficulty distribution must sum to 100%');
      return;
    }

    setIsSubmitting(true);

    const payload: any = {
      name,
      description,
      easy_percentage: easyTarget,
      medium_percentage: mediumTarget,
      hard_percentage: hardTarget
    };

    if (!bank) {
      payload.course_id = courseId as number;
    }

    const res = bank ?
      await questionService.updateQuestionBank(bank.id, payload) :
      await questionService.createQuestionBank(payload);

    setIsSubmitting(false);

    if (res.success) {
      toast.success(bank ? 'Question bank updated' : 'Question bank created');
      onSuccess();
      onClose();
    } else {
      toast.error(res.error || 'Operation failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-dark-border-primary flex justify-between items-center bg-gray-50/50 dark:bg-dark-surface">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
              <BookOpen className="text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">{bank ? 'Edit Question Bank' : 'Create Question Bank'}</h3>
              <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Organize questions for a specific course</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Bank Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary"
              placeholder="e.g., Computer Science 101 Pool"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary"
              required
            >
              <option value="">Select a course...</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-dark-text-primary"
              placeholder="Optional description of the bank"
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary">Difficulty Distribution (%)</label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Easy</span>
                <input
                  type="number"
                  value={easyTarget}
                  onChange={(e) => setEasyTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-dark-text-primary"
                  min="0" max="100"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Medium</span>
                <input
                  type="number"
                  value={mediumTarget}
                  onChange={(e) => setMediumTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-dark-text-primary"
                  min="0" max="100"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Hard</span>
                <input
                  type="number"
                  value={hardTarget}
                  onChange={(e) => setHardTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-secondary border border-gray-200 dark:border-dark-border-primary rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-dark-text-primary"
                  min="0" max="100"
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-xs">
              <p className={`${easyTarget + mediumTarget + hardTarget === 100 ? 'text-green-500' : 'text-red-500'}`}>
                Total: {easyTarget + mediumTarget + hardTarget}% (Must be 100%)
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-dark-text-primary font-medium hover:bg-gray-100 dark:hover:bg-dark-secondary rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (easyTarget + mediumTarget + hardTarget !== 100)}
              className={`px-8 py-2 rounded-xl font-bold transition-all shadow-lg flex items-center space-x-2 ${isSubmitting || (easyTarget + mediumTarget + hardTarget !== 100)
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/25 active:scale-95'
                }`}
            >
              {isSubmitting ? (bank ? 'Updating...' : 'Creating...') : (bank ? 'Update Bank' : 'Create Bank')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuestionBankManagement;
