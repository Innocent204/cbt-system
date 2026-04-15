import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Eye, Edit, Trash2, Plus, Save, X, Check, AlertCircle } from 'lucide-react';
import LoadingScreen from '../common/LoadingScreen';
import examService from '../../services/examService';
import { toast } from 'react-toastify';
import { Course } from '../../types';

interface Exam {
  id: number;
  title: string;
  description: string;
  course: number; // Course ID
  courseName?: string;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  maxAttempts: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: 'draft' | 'published' | 'active' | 'completed';
  questionsCount: number;
  enrolledStudents: number;
  attemptsCount: number;
  randomizeQuestions: boolean;
  showResults: boolean;
  allowReview: boolean;
  createdAt: string;
  updatedAt: string;
}

const ExamScheduler: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'exams' | 'schedule'>('exams');
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '' as string | number,
    duration: 60,
    totalMarks: 100,
    passingMarks: 50,
    maxAttempts: 1,
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    randomizeQuestions: false,
    showResults: true,
    allowReview: true,
  });

  const toLocalYMD = (utcStr?: string) => {
    if (!utcStr) return '';
    const d = new Date(utcStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const toLocalHM = (utcStr?: string) => {
    if (!utcStr) return '';
    const d = new Date(utcStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const [examsRes, coursesRes] = await Promise.all([
        examService.getExams(),
        examService.getCourses()
      ]);

      if (coursesRes.success && coursesRes.data) {
        setCourses(coursesRes.data);
      }

      if (examsRes.success && examsRes.data) {
        const mappedExams: Exam[] = examsRes.data.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description || '',
          course: e.course,
          courseName: e.course_name || 'N/A',
          duration: e.duration_minutes,
          totalMarks: e.total_marks,
          passingMarks: e.passing_marks,
          maxAttempts: e.max_attempts,
          startDate: toLocalYMD(e.start_time),
          endDate: toLocalYMD(e.end_time),
          startTime: toLocalHM(e.start_time),
          endTime: toLocalHM(e.end_time),
          status: e.status,
          questionsCount: e.question_count || 0,
          enrolledStudents: e.student_count || 0,
          attemptsCount: e.attempt_count || 0,
          randomizeQuestions: e.randomize_questions,
          showResults: e.show_results_immediately,
          allowReview: e.allow_review,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        }));
        setExams(mappedExams);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20';
      case 'published': return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
      case 'active': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit size={16} />;
      case 'published': return <Eye size={16} />;
      case 'active': return <Check size={16} />;
      case 'completed': return <Users size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const handleSaveExam = async () => {
    if (!formData.title || !formData.course || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    // Format dates and times for backend
    const localStart = new Date(`${formData.startDate}T${formData.startTime || '00:00'}:00`);
    const localEnd = new Date(`${formData.endDate}T${formData.endTime || '23:59'}:00`);

    const startTimeStr = localStart.toISOString();
    const endTimeStr = localEnd.toISOString();

    const examData: any = {
      title: formData.title,
      description: formData.description,
      course: Number(formData.course),
      duration_minutes: Number(formData.duration),
      total_marks: Number(formData.totalMarks),
      passing_marks: Number(formData.passingMarks),
      max_attempts: Number(formData.maxAttempts),
      start_time: startTimeStr,
      end_time: endTimeStr,
      randomize_questions: formData.randomizeQuestions,
      show_results_immediately: formData.showResults,
      allow_review: formData.allowReview,
      status: editingExam ? editingExam.status : 'draft',
      is_active: true
    };

    const response = editingExam
      ? await examService.updateExam(editingExam.id, examData)
      : await examService.createExam(examData);

    setIsSubmitting(false);

    if (response.success) {
      toast.success(editingExam ? 'Exam updated successfully' : 'Exam created successfully');
      setShowCreateModal(false);
      setEditingExam(null);
      resetForm();
      fetchExams(); // Refresh list
    } else {
      toast.error(response.error || 'Failed to save exam');
    }
  };

  const handleDeleteExam = (examId: number) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-4 text-sm font-medium text-slate-800 dark:text-slate-200">Are you sure you want to delete this exam? This will also delete all associated questions.</p>
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
                const response = await examService.deleteExam(examId);
                if (response.success) {
                  toast.success('Exam deleted');
                  fetchExams();
                } else {
                  toast.error(response.error || 'Failed to delete exam');
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
  };

  const handleUpdateStatus = async (examId: number, status: string) => {
    const response = await examService.updateExam(examId, { status: status as any });
    if (response.success) {
      toast.success(`Exam ${status} successfully`);
      fetchExams();
    } else {
      toast.error(response.error || 'Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      course: '',
      duration: 60,
      totalMarks: 100,
      passingMarks: 50,
      maxAttempts: 1,
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      randomizeQuestions: false,
      showResults: true,
      allowReview: true,
    });
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      description: exam.description,
      course: exam.course,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      maxAttempts: exam.maxAttempts,
      startDate: exam.startDate,
      endDate: exam.endDate,
      startTime: exam.startTime,
      endTime: exam.endTime,
      randomizeQuestions: exam.randomizeQuestions,
      showResults: exam.showResults,
      allowReview: exam.allowReview,
    });
    setShowCreateModal(true);
  };

  if (loading) {
    return <LoadingScreen fullScreen={false} message="Coordinate System Initializing" transparent />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">Exam Scheduler</h2>
          <p className="text-gray-600 dark:text-dark-text-secondary">Create and manage exam schedules with advanced configuration</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <Plus size={20} />
          <span>Create Exam</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{exams.length}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Calendar size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Active Exams</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {exams.filter(e => e.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Check size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Total Students</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {exams.reduce((sum, e) => sum + e.enrolledStudents, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Users size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Total Attempts</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {exams.reduce((sum, e) => sum + e.attemptsCount, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
        <div className="border-b border-gray-200 dark:border-dark-border-primary">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('exams')}
              className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${activeTab === 'exams'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              Exams ({exams.length})
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${activeTab === 'schedule'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              Schedule View
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'exams' && (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div key={exam.id} className="border border-gray-200 dark:border-dark-border-primary rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{exam.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border flex items-center space-x-1 ${getStatusColor(exam.status)}`}>
                          {getStatusIcon(exam.status)}
                          <span>{exam.status}</span>
                        </span>
                      </div>

                      <p className="text-gray-600 dark:text-dark-text-secondary mb-4">{exam.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Course:</span>
                          <p className="font-medium text-gray-900 dark:text-dark-text-primary">{exam.courseName}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                          <p className="font-medium text-gray-900 dark:text-dark-text-primary">{exam.duration} min</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Total Marks:</span>
                          <p className="font-medium text-gray-900 dark:text-dark-text-primary">{exam.totalMarks}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Passing:</span>
                          <p className="font-medium text-gray-900 dark:text-dark-text-primary">{exam.passingMarks}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Max Attempts:</span>
                          <p className="font-medium text-gray-900 dark:text-dark-text-primary">{exam.maxAttempts}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Questions:</span>
                          <p className="font-medium text-gray-900 dark:text-dark-text-primary">{exam.questionsCount}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Enrolled:</span>
                          <p className="font-medium text-gray-900 dark:text-dark-text-primary">{exam.enrolledStudents}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Attempts:</span>
                          <p className="font-medium text-gray-900 dark:text-dark-text-primary">{exam.attemptsCount}</p>
                        </div>
                      </div>

                      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Start: {exam.startDate} at {exam.startTime}</span>
                        <span className="mx-2">•</span>
                        <span>End: {exam.endDate} at {exam.endTime}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => openEditModal(exam)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      {exam.status === 'draft' && (
                        <button
                          onClick={() => handleUpdateStatus(exam.id, 'published')}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Publish"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {exam.status === 'published' && (
                        <button
                          onClick={() => handleUpdateStatus(exam.id, 'active')}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                          title="Activate"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteExam(exam.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary mb-2">Calendar View</h3>
              <p className="text-gray-500 dark:text-gray-400">Interactive calendar view coming soon</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-dark-border-primary">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">
                  {editingExam ? 'Edit Exam' : 'Create New Exam'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingExam(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Exam Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary outline-none transition-all"
                      placeholder="Enter exam title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course *
                    </label>
                    <select
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary outline-none transition-all"
                    >
                      <option value="">Select a course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary"
                    placeholder="Enter exam description"
                  />
                </div>
              </div>

              {/* Exam Configuration */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary mb-4">Exam Configuration</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (min) *
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Marks *
                    </label>
                    <input
                      type="number"
                      value={formData.totalMarks}
                      onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Passing Marks *
                    </label>
                    <input
                      type="number"
                      value={formData.passingMarks}
                      onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary"
                      min="1"
                      max={formData.totalMarks}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Attempts *
                    </label>
                    <input
                      type="number"
                      value={formData.maxAttempts}
                      onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary mb-4">Schedule</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Settings */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary mb-4">Additional Settings</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.randomizeQuestions}
                      onChange={(e) => setFormData({ ...formData, randomizeQuestions: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Randomize question order for each student</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.showResults}
                      onChange={(e) => setFormData({ ...formData, showResults: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Show results immediately after submission</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.allowReview}
                      onChange={(e) => setFormData({ ...formData, allowReview: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Allow students to review questions after submission</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-dark-border-primary flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingExam(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveExam}
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center space-x-2 shadow-lg shadow-indigo-500/20 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{editingExam ? 'Update' : 'Create'} Exam</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamScheduler;
