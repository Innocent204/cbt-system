import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, BookOpen, Clock, Users, BarChart3, Calendar, Filter, TrendingUp, X, Save, Check } from 'lucide-react';
import LoadingScreen from '../common/LoadingScreen';
import examService from '../../services/examService';
import { Course, Exam } from '../../types';
import { toast } from 'react-toastify';

const CourseExamManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'exams'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseFormData, setCourseFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examFormData, setExamFormData] = useState({
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, examsRes] = await Promise.all([
        examService.getCourses(),
        examService.getExams()
      ]);

      if (coursesRes.success && coursesRes.data) {
        setCourses(coursesRes.data);
      }

      if (examsRes.success && examsRes.data) {
        setExams(examsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.created_by_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && course.is_active) ||
      (statusFilter === 'inactive' && !course.is_active);
    return matchesSearch && matchesStatus;
  });

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exam.course_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (exam.created_by_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleCourseStatus = async (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    // Optimistic
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_active: !c.is_active } : c));

    const response = await examService.updateCourse(courseId, { is_active: !course.is_active });
    if (!response.success) {
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_active: course.is_active } : c));
      toast.error('Failed to update status');
    }
  };

  const handleToggleExamStatus = async (examId: number) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    const newStatus = exam.status === 'published' ? 'draft' : 'published';

    // Optimistic
    setExams(prev => prev.map(e => e.id === examId ? { ...e, status: newStatus } : e));

    const response = await examService.updateExam(examId, { status: newStatus });
    if (!response.success) {
      setExams(prev => prev.map(e => e.id === examId ? { ...e, status: exam.status } : e));
      toast.error('Failed to update status');
    }
  };

  // CRUD Handlers for Courses
  const resetCourseForm = () => {
    setCourseFormData({ name: '', code: '', description: '' });
  };

  const openCourseModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseFormData({
        name: course.name,
        code: course.code,
        description: course.description || ''
      });
    } else {
      setEditingCourse(null);
      resetCourseForm();
    }
    setShowCourseModal(true);
  };

  const handleSaveCourse = async () => {
    if (!courseFormData.name || !courseFormData.code) {
      toast.warning('Please fill in course name and code');
      return;
    }
    setIsSubmitting(true);

    const response = editingCourse
      ? await examService.updateCourse(editingCourse.id, courseFormData)
      : await examService.createCourse(courseFormData);

    setIsSubmitting(false);

    if (response.success) {
      setShowCourseModal(false);
      resetCourseForm();
      fetchData();
      toast.success(editingCourse ? 'Course updated successfully' : 'Course created successfully');
    } else {
      toast.error(response.error || 'Failed to save course');
    }
  };

  const handleDeleteCourse = (courseId: number) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-4 text-sm font-medium text-slate-800 dark:text-slate-200">Are you sure you want to delete this course? This may affect associated exams.</p>
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
                const response = await examService.deleteCourse(courseId);
                if (response.success) {
                  fetchData();
                  toast.success('Course deleted successfully');
                } else {
                  toast.error(response.error || 'Failed to delete course');
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

  const openExamModal = (exam?: Exam) => {
    if (exam) {
      setEditingExam(exam);
      setExamFormData({
        title: exam.title,
        description: exam.description || '',
        course: exam.course,
        duration: exam.duration_minutes || 60,
        totalMarks: exam.total_marks || 100,
        passingMarks: exam.passing_marks || 50,
        maxAttempts: exam.max_attempts || 1,
        startDate: toLocalYMD(exam.start_time),
        endDate: toLocalYMD(exam.end_time),
        startTime: toLocalHM(exam.start_time),
        endTime: toLocalHM(exam.end_time),
        randomizeQuestions: exam.randomize_questions ?? false,
        showResults: exam.show_results_immediately ?? true,
        allowReview: exam.allow_review ?? true,
      });
    } else {
      setEditingExam(null);
      resetExamForm();
    }
    setShowExamModal(true);
  };

  const handleSaveExam = async () => {
    if (!examFormData.title || !examFormData.course || !examFormData.startDate || !examFormData.endDate) {
      toast.warning('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);

    const localStart = new Date(`${examFormData.startDate}T${examFormData.startTime || '00:00'}:00`);
    const localEnd = new Date(`${examFormData.endDate}T${examFormData.endTime || '23:59'}:00`);

    // Convert to UTC ISO string to send properly to Django
    const startTimeStr = localStart.toISOString();
    const endTimeStr = localEnd.toISOString();

    const payload: any = {
      title: examFormData.title,
      description: examFormData.description,
      course: Number(examFormData.course),
      duration_minutes: Number(examFormData.duration),
      total_marks: Number(examFormData.totalMarks),
      passing_marks: Number(examFormData.passingMarks),
      max_attempts: Number(examFormData.maxAttempts),
      start_time: startTimeStr,
      end_time: endTimeStr,
      randomize_questions: examFormData.randomizeQuestions,
      show_results_immediately: examFormData.showResults,
      allow_review: examFormData.allowReview,
      status: editingExam ? editingExam.status : 'draft',
      is_active: true
    };

    const response = editingExam
      ? await examService.updateExam(editingExam.id, payload)
      : await examService.createExam(payload);

    setIsSubmitting(false);

    if (response.success) {
      setShowExamModal(false);
      resetExamForm();
      fetchData();
      toast.success(editingExam ? 'Exam updated successfully' : 'Exam created successfully');
    } else {
      toast.error(response.error || 'Failed to save exam');
    }
  };

  const handleDeleteExam = (examId: number) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-4 text-sm font-medium text-slate-800 dark:text-slate-200">Are you sure you want to delete this exam?</p>
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
                  fetchData();
                  toast.success('Exam deleted successfully');
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

  if (loading) {
    return <LoadingScreen fullScreen={false} message="Loading Course Intelligence" transparent />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-white font-display tracking-tight mb-2">Course & Exam Hub</h2>
          <p className="text-slate-500 font-medium">Coordinate curricula, examinations, and proctor assignments.</p>
        </div>
        <button
          onClick={() => activeTab === 'courses' ? openCourseModal() : openExamModal()}
          className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] flex items-center space-x-3 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 font-black text-xs uppercase tracking-widest">
          <Plus size={20} strokeWidth={3} />
          <span>New {activeTab === 'courses' ? 'Course' : 'Exam'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-[2rem] border border-white/5 shadow-xl transition-all hover:shadow-indigo-500/10 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Courses</p>
              <p className="text-3xl font-black text-white">{courses.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <BookOpen size={24} className="text-blue-400" />
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-[2rem] border border-white/5 shadow-xl transition-all hover:shadow-indigo-500/10 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Exams</p>
              <p className="text-3xl font-black text-white">{exams.length}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
              <Calendar size={24} className="text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-[2rem] border border-white/5 shadow-xl transition-all hover:shadow-indigo-500/10 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Active Courses</p>
              <p className="text-3xl font-black text-emerald-400">
                {courses.filter(c => c.is_active).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <Users size={24} className="text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-[2rem] border border-white/5 shadow-xl transition-all hover:shadow-indigo-500/10 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Published Exams</p>
              <p className="text-3xl font-black text-amber-400">{exams.filter(e => e.status === 'published').length}</p>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <BarChart3 size={24} className="text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass rounded-[2rem] shadow-xl border border-white/5 overflow-hidden">
        <div className="border-b border-white/5 bg-white/5">
          <nav className="flex px-6">
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-5 px-6 font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === 'courses'
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              Courses ({courses.length})
              {activeTab === 'courses' && (
                <div className="absolute bottom-0 left-6 right-6 h-1 bg-indigo-500 rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`py-5 px-6 font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === 'exams'
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              Exams ({exams.length})
              {activeTab === 'exams' && (
                <div className="absolute bottom-0 left-6 right-6 h-1 bg-indigo-500 rounded-t-full"></div>
              )}
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white pl-12 pr-4 py-3 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-600 font-medium"
              />
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                <Filter size={18} className="text-indigo-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold text-sm outline-none appearance-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Status</option>
                {activeTab === 'courses' ? (
                  <>
                    <option value="active" className="bg-slate-900">Active</option>
                    <option value="inactive" className="bg-slate-900">Inactive</option>
                  </>
                ) : (
                  <>
                    <option value="published" className="bg-slate-900">Published</option>
                    <option value="draft" className="bg-slate-900">Draft</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {activeTab === 'courses' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] transition-all hover:scale-[1.01] group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full -mr-12 -mt-12"></div>

                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-white">{course.name}</h3>
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-500/20">
                            {course.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                          {course.description || 'No course description provided.'}
                        </p>
                      </div>
                      <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${course.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                        {course.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 my-4">
                      <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Examiner</p>
                        <p className="text-xs font-bold text-slate-200 truncate">{course.created_by_name}</p>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Exams</p>
                        <p className="text-xl font-black text-white leading-none">{course.exam_count}</p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                        Added: {new Date(course.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openCourseModal(course)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-indigo-400 transition-all" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleCourseStatus(course.id)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${course.is_active ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                        >
                          {course.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleDeleteCourse(course.id)} className="p-2 hover:bg-rose-500/10 rounded-xl text-slate-400 hover:text-rose-400 transition-all" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredExams.map((exam) => (
                <div key={exam.id} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-white">{exam.title}</h3>
                        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-purple-500/20">
                          {exam.course_code}
                        </span>
                        <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${exam.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                          {exam.status === 'published' ? 'Published' : 'Draft'}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                            <Clock size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Duration</p>
                            <p className="text-sm font-bold text-slate-200">{exam.duration_minutes} min</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                            <BarChart3 size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Marks</p>
                            <p className="text-sm font-bold text-slate-200">{exam.total_marks}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                            <BookOpen size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Questions</p>
                            <p className="text-sm font-bold text-slate-200">{exam.question_count}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                            <TrendingUp size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Pass Mark</p>
                            <p className="text-sm font-bold text-slate-200">{exam.passing_marks}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-[10px] text-slate-500 font-black uppercase tracking-widest pt-2">
                        <span className="flex items-center gap-2">Course: <span className="text-slate-300">{exam.course_name}</span></span>
                        <span className="flex items-center gap-2">By: <span className="text-slate-300">{exam.created_by_name}</span></span>
                        <span className="flex items-center gap-2">Start: <span className="text-slate-300">{exam.start_time ? new Date(exam.start_time).toLocaleDateString() : 'Not scheduled'}</span></span>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center gap-2 relative z-10">
                      <button onClick={() => openExamModal(exam)} className="flex-1 md:w-full p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/5 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleExamStatus(exam.id)}
                        className={`flex-1 md:w-full px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${exam.status === 'published' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                      >
                        {exam.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => handleDeleteExam(exam.id)} className="p-3 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/10 transition-all flex items-center justify-center">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-black text-white px-2 tracking-tight">{editingCourse ? 'Edit Course' : 'Create Course'}</h3>
              <button onClick={() => setShowCourseModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Course Name *</label>
                <input type="text" value={courseFormData.name} onChange={e => setCourseFormData({ ...courseFormData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600 font-medium" placeholder="e.g. Introduction to Physics" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Course Code *</label>
                <input type="text" value={courseFormData.code} onChange={e => setCourseFormData({ ...courseFormData, code: e.target.value })} className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600 font-medium tracking-wider uppercase" placeholder="e.g. PHY101" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Description</label>
                <textarea value={courseFormData.description} onChange={e => setCourseFormData({ ...courseFormData, description: e.target.value })} rows={4} className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600 font-medium resize-none" placeholder="Course syllabus and description..." />
              </div>
            </div>
            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3 mt-auto">
              <button onClick={() => setShowCourseModal(false)} className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
              <button onClick={handleSaveCourse} disabled={isSubmitting} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20 active:scale-95">
                {isSubmitting ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={16} />}
                <span>{editingCourse ? 'Save Changes' : 'Publish Course'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-black text-white px-2 tracking-tight">{editingExam ? 'Edit Exam Specifications' : 'Draft New Exam'}</h3>
              <button onClick={() => setShowExamModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-8 overflow-y-auto">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2"><BookOpen size={16} /> Identity & Core Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Exam Title *</label>
                    <input type="text" value={examFormData.title} onChange={e => setExamFormData({ ...examFormData, title: e.target.value })} className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600 font-medium" placeholder="E.g., Midterm Evaluation" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Associated Course *</label>
                    <select value={examFormData.course} onChange={e => setExamFormData({ ...examFormData, course: e.target.value })} className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium appearance-none cursor-pointer">
                      <option value="" className="bg-slate-900">Select a target course</option>
                      {courses.map(course => <option key={course.id} value={course.id} className="bg-slate-900">{course.code} - {course.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Instructions / Syllabus</label>
                  <textarea value={examFormData.description} onChange={e => setExamFormData({ ...examFormData, description: e.target.value })} rows={3} className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600 font-medium resize-none" placeholder="Provide instructions for the candidates..." />
                </div>
              </div>

              {/* Exam Configuration */}
              <div className="pt-6 border-t border-white/5">
                <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2"><BarChart3 size={16} /> Mechanics & Scoring</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Duration (min) *</label>
                    <input type="number" min="1" value={examFormData.duration} onChange={e => setExamFormData({ ...examFormData, duration: parseInt(e.target.value) || 0 })} className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Total Marks *</label>
                    <input type="number" min="1" value={examFormData.totalMarks} onChange={e => setExamFormData({ ...examFormData, totalMarks: parseInt(e.target.value) || 0 })} className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Pass Mark *</label>
                    <input type="number" min="1" max={examFormData.totalMarks} value={examFormData.passingMarks} onChange={e => setExamFormData({ ...examFormData, passingMarks: parseInt(e.target.value) || 0 })} className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Permitted Attempts *</label>
                    <input type="number" min="1" value={examFormData.maxAttempts} onChange={e => setExamFormData({ ...examFormData, maxAttempts: parseInt(e.target.value) || 0 })} className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium" />
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="pt-6 border-t border-white/5">
                <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Calendar size={16} /> Window Constraints</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Opening Date *</label>
                    <input type="date" value={examFormData.startDate} onChange={e => setExamFormData({ ...examFormData, startDate: e.target.value })} className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium style-calendar-dark" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Opening Time *</label>
                    <input type="time" value={examFormData.startTime} onChange={e => setExamFormData({ ...examFormData, startTime: e.target.value })} className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium style-calendar-dark" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Closing Date *</label>
                    <input type="date" value={examFormData.endDate} onChange={e => setExamFormData({ ...examFormData, endDate: e.target.value })} className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium style-calendar-dark" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Closing Time *</label>
                    <input type="time" value={examFormData.endTime} onChange={e => setExamFormData({ ...examFormData, endTime: e.target.value })} className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium style-calendar-dark" />
                  </div>
                </div>
              </div>

              {/* Integrity Settings */}
              <div className="pt-6 border-t border-white/5">
                <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Filter size={16} /> Integrity & Feedback Settings</h4>
                <div className="space-y-4 px-2">
                  <label className="flex items-center space-x-4 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" checked={examFormData.randomizeQuestions} onChange={e => setExamFormData({ ...examFormData, randomizeQuestions: e.target.checked })} className="peer sr-only" />
                      <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                        <Check size={14} className="text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all" strokeWidth={4} />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Randomize question sequence for candidates</span>
                  </label>
                  <label className="flex items-center space-x-4 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" checked={examFormData.showResults} onChange={e => setExamFormData({ ...examFormData, showResults: e.target.checked })} className="peer sr-only" />
                      <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                        <Check size={14} className="text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all" strokeWidth={4} />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Display provisional results upon submission</span>
                  </label>
                  <label className="flex items-center space-x-4 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" checked={examFormData.allowReview} onChange={e => setExamFormData({ ...examFormData, allowReview: e.target.checked })} className="peer sr-only" />
                      <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                        <Check size={14} className="text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all" strokeWidth={4} />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Permit post-exam response review</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3 mt-auto">
              <button onClick={() => setShowExamModal(false)} className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all">Discard Draft</button>
              <button onClick={handleSaveExam} disabled={isSubmitting} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20 active:scale-95">
                {isSubmitting ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={16} />}
                <span>{editingExam ? 'Update Exam Specs' : 'Generate Exam Base'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CourseExamManagement;
