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
      {/* Header - Redesigned */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-dark-border-primary pb-10">
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-dark-accent-indigo">Instructional Orchestration</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Curriculum <span className="text-dark-text-muted">Hub</span></h2>
          <p className="text-dark-text-secondary font-medium text-lg max-w-2xl leading-relaxed">
            Coordinate curricula, examinations, and proctor assignments through our unified terminal.
          </p>
        </div>
        <button
          onClick={() => activeTab === 'courses' ? openCourseModal() : openExamModal()}
          className="bg-white text-dark-primary px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-dark-accent-indigo hover:text-white transition-all shadow-2xl active:scale-95 font-black text-[10px] uppercase tracking-widest border border-white/10 group">
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>Initialize {activeTab === 'courses' ? 'Course' : 'Exam'}</span>
        </button>
      </div>

      {/* Stats Cards - Redesigned */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Intelligence Bank', value: courses.length, icon: BookOpen, color: 'text-dark-accent-indigo' },
          { label: 'Deployment Count', value: exams.length, icon: Calendar, color: 'text-dark-accent-cyan' },
          { label: 'Active Curricula', value: courses.filter(c => c.is_active).length, icon: Users, color: 'text-dark-accent-emerald' },
          { label: 'Published Units', value: exams.filter(e => e.status === 'published').length, icon: BarChart3, color: 'text-dark-accent-amber' },
        ].map((item, i) => (
          <div key={i} className="bg-dark-secondary p-6 rounded-2xl border border-dark-border-primary hover:border-dark-text-muted transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg bg-dark-tertiary ${item.color}`}>
                <item.icon size={20} />
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-dark-tertiary animate-pulse" />
            </div>
            <p className="text-3xl font-black text-white mb-1 tracking-tight">{item.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-dark-text-muted">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs & Search Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-dark-border-primary pb-6">
        <div className="flex items-center gap-1 bg-dark-secondary p-1 rounded-2xl border border-dark-border-primary ring-1 ring-white/5">
          {[
            { id: 'courses', label: `Courses (${courses.length})`, icon: BookOpen },
            { id: 'exams', label: `Exams (${exams.length})`, icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? 'bg-dark-accent-indigo text-white shadow-xl shadow-dark-accent-indigo/20'
                  : 'text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1 group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted group-focus-within:text-dark-accent-indigo transition-colors" />
            <input
              type="text"
              placeholder={`Search Curricula...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-secondary border border-dark-border-primary text-white pl-12 pr-4 py-3 rounded-xl focus:ring-1 focus:ring-dark-accent-indigo focus:border-dark-accent-indigo outline-none transition-all placeholder:text-dark-text-muted font-black text-[10px] uppercase tracking-widest"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-dark-secondary border border-dark-border-primary flex items-center justify-center text-dark-accent-indigo">
              <Filter size={16} />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-dark-secondary border border-dark-border-primary text-white pl-4 pr-10 py-3 rounded-xl focus:ring-1 focus:ring-dark-accent-indigo outline-none font-black text-[10px] uppercase tracking-widest appearance-none cursor-pointer"
            >
              <option value="all">Status: All</option>
              {activeTab === 'courses' ? (
                <>
                  <option value="active">State: Active</option>
                  <option value="inactive">State: Inactive</option>
                </>
              ) : (
                <>
                  <option value="published">State: Published</option>
                  <option value="draft">State: Draft</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

        <div className="pt-8">
          {activeTab === 'courses' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredCourses.map((course) => (
                <div key={course.id} className="bg-dark-secondary border border-dark-border-primary rounded-3xl p-8 hover:border-dark-accent-indigo transition-all duration-500 group relative overflow-hidden flex flex-col">
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-1 bg-dark-tertiary border border-dark-border-primary text-dark-accent-indigo text-[10px] font-black uppercase tracking-widest rounded leading-none">
                          {course.code}
                        </div>
                        <h3 className="text-xl font-black text-white leading-tight tracking-tight group-hover:text-dark-accent-indigo transition-colors">{course.name}</h3>
                      </div>
                      <p className="text-sm text-dark-text-secondary font-medium line-clamp-2 leading-relaxed h-10">
                        {course.description || 'Module specifications encrypted or unavailable.'}
                      </p>
                    </div>
                    <div className={`px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded border ${course.is_active ? 'bg-dark-accent-emerald/10 text-dark-accent-emerald border-dark-accent-emerald/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]' : 'bg-dark-accent-rose/10 text-dark-accent-rose border-dark-accent-rose/20'}`}>
                      {course.is_active ? 'Nominal' : 'Offline'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 my-8">
                    <div className="bg-dark-tertiary/20 rounded-2xl p-4 border border-dark-border-primary">
                      <p className="text-[10px] text-dark-text-muted font-black uppercase tracking-widest mb-1">Assigned Architect</p>
                      <p className="text-sm font-black text-white truncate italic">{course.created_by_name}</p>
                    </div>
                    <div className="bg-dark-tertiary/20 rounded-2xl p-4 border border-dark-border-primary">
                      <p className="text-[10px] text-dark-text-muted font-black uppercase tracking-widest mb-1">Execution Nodes</p>
                      <p className="text-2xl font-black text-white leading-none">{course.exam_count}</p>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-dark-border-primary/50">
                    <span className="text-[10px] text-dark-text-muted font-black uppercase tracking-widest italic flex items-center gap-2">
                       <Calendar size={12} /> {new Date(course.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openCourseModal(course)} className="p-2.5 bg-dark-tertiary text-dark-text-muted hover:text-white hover:bg-dark-accent-indigo rounded-xl transition-all border border-dark-border-primary">
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleCourseStatus(course.id)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${course.is_active ? 'bg-dark-accent-rose/10 text-dark-accent-rose border-dark-accent-rose/20 hover:bg-dark-accent-rose hover:text-white' : 'bg-dark-accent-emerald/10 text-dark-accent-emerald border-dark-accent-emerald/20 hover:bg-dark-accent-emerald hover:text-white'}`}
                      >
                        {course.is_active ? 'Deactivate' : 'Initialize'}
                      </button>
                      <button onClick={() => handleDeleteCourse(course.id)} className="p-2.5 bg-dark-accent-rose/5 text-dark-text-muted hover:text-white hover:bg-dark-accent-rose rounded-xl transition-all border border-dark-border-primary">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {filteredExams.map((exam) => (
                <div key={exam.id} className="bg-dark-secondary border border-dark-border-primary rounded-3xl p-8 hover:border-dark-accent-indigo transition-all duration-500 group relative overflow-hidden">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="px-2 py-1 bg-dark-tertiary border border-dark-border-primary text-dark-accent-cyan text-[10px] font-black uppercase tracking-widest rounded leading-none">
                          {exam.course_code}
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-dark-accent-indigo transition-colors">{exam.title}</h3>
                        <div className={`px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded border ${exam.status === 'published' ? 'bg-dark-accent-emerald/10 text-dark-accent-emerald border-dark-accent-emerald/20' : 'bg-dark-accent-amber/10 text-dark-accent-amber border-dark-accent-amber/20'}`}>
                          {exam.status === 'published' ? 'Deployed' : 'Draft Protocol'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                          { icon: Clock, label: 'Duration', value: `${exam.duration_minutes}m` },
                          { icon: BarChart3, label: 'Total Weight', value: exam.total_marks },
                          { icon: BookOpen, label: 'Nodes/Queries', value: exam.question_count },
                          { icon: TrendingUp, label: 'Pass Threshold', value: exam.passing_marks },
                        ].map((stat, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-dark-tertiary/50 flex items-center justify-center text-dark-text-muted group-hover:text-dark-accent-indigo transition-colors border border-dark-border-primary">
                              <stat.icon size={18} />
                            </div>
                            <div>
                              <p className="text-[10px] text-dark-text-muted font-black uppercase tracking-widest">{stat.label}</p>
                              <p className="text-lg font-black text-white leading-tight">{stat.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 pt-4 border-t border-dark-border-primary/30">
                        <p className="text-[10px] text-dark-text-muted font-black uppercase tracking-widest flex items-center gap-2">Course: <span className="text-white italic">{exam.course_name}</span></p>
                        <p className="text-[10px] text-dark-text-muted font-black uppercase tracking-widest flex items-center gap-2">Architect: <span className="text-white italic">{exam.created_by_name}</span></p>
                        <p className="text-[10px] text-dark-text-muted font-black uppercase tracking-widest flex items-center gap-2 italic">Deployment: <span className="text-dark-accent-cyan">{exam.start_time ? new Date(exam.start_time).toLocaleString() : 'Not Scheduled'}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button onClick={() => openExamModal(exam)} className="p-4 bg-dark-tertiary text-dark-text-muted hover:text-white hover:bg-dark-accent-indigo rounded-2xl transition-all border border-dark-border-primary shadow-xl">
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => handleToggleExamStatus(exam.id)}
                        className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border flex items-center gap-3 shadow-xl ${exam.status === 'published' ? 'bg-dark-accent-amber/10 text-dark-accent-amber border-dark-accent-amber/20 hover:bg-dark-accent-amber hover:text-white' : 'bg-dark-accent-emerald/10 text-dark-accent-emerald border-dark-accent-emerald/20 hover:bg-dark-accent-emerald hover:text-white'}`}
                      >
                        {exam.status === 'published' ? 'Revoke Deployment' : 'Authorize Deployed'}
                      </button>
                      <button onClick={() => handleDeleteExam(exam.id)} className="p-4 bg-dark-accent-rose/5 text-dark-text-muted hover:text-white hover:bg-dark-accent-rose rounded-2xl transition-all border border-dark-border-primary shadow-xl">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
  
      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 dark:border-dark-border-primary flex justify-between items-center bg-gray-50/50 dark:bg-dark-surface">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">{editingCourse ? 'Edit Course' : 'Create Course'}</h3>
              <button onClick={() => setShowCourseModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course Name *</label>
                <input type="text" value={courseFormData.name} onChange={e => setCourseFormData({ ...courseFormData, name: e.target.value })} className="w-full bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border-primary text-gray-900 dark:text-dark-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400" placeholder="e.g. Introduction to Physics" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course Code *</label>
                <input type="text" value={courseFormData.code} onChange={e => setCourseFormData({ ...courseFormData, code: e.target.value })} className="w-full bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border-primary text-gray-900 dark:text-dark-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 uppercase" placeholder="e.g. PHY101" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea value={courseFormData.description} onChange={e => setCourseFormData({ ...courseFormData, description: e.target.value })} rows={4} className="w-full bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border-primary text-gray-900 dark:text-dark-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 resize-none" placeholder="Course syllabus and description..." />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-dark-border-primary bg-gray-50/50 dark:bg-dark-surface flex justify-end gap-3">
              <button onClick={() => setShowCourseModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-secondary transition-colors">Cancel</button>
              <button onClick={handleSaveCourse} disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20">
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
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-dark-border-primary flex justify-between items-center bg-gray-50/50 dark:bg-dark-surface">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">{editingExam ? 'Edit Exam Specifications' : 'Draft New Exam'}</h3>
              <button onClick={() => setShowExamModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-8 overflow-y-auto flex-1">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-4 flex items-center gap-2"><BookOpen size={16} /> Identity & Core Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exam Title *</label>
                    <input type="text" value={examFormData.title} onChange={e => setExamFormData({ ...examFormData, title: e.target.value })} className="w-full bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border-primary text-gray-900 dark:text-dark-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400" placeholder="E.g., Midterm Evaluation" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Associated Course *</label>
                    <select value={examFormData.course} onChange={e => setExamFormData({ ...examFormData, course: e.target.value })} className="w-full bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border-primary text-gray-900 dark:text-dark-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all">
                      <option value="">Select a target course</option>
                      {courses.map(course => <option key={course.id} value={course.id}>{course.code} - {course.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructions / Syllabus</label>
                  <textarea value={examFormData.description} onChange={e => setExamFormData({ ...examFormData, description: e.target.value })} rows={3} className="w-full bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border-primary text-gray-900 dark:text-dark-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 resize-none" placeholder="Provide instructions for the candidates..." />
                </div>
              </div>

              {/* Exam Configuration */}
              <div className="pt-6 border-t border-gray-200 dark:border-dark-border-primary">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-4 flex items-center gap-2"><BarChart3 size={16} /> Mechanics & Scoring</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration (min) *</label>
                    <input type="number" min="1" value={examFormData.duration} onChange={e => setExamFormData({ ...examFormData, duration: parseInt(e.target.value) || 0 })} className="w-full bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border-primary text-gray-900 dark:text-dark-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Marks *</label>
                    <input type="number" min="1" value={examFormData.totalMarks} onChange={e => setExamFormData({ ...examFormData, totalMarks: parseInt(e.target.value) || 0 })} className="w-full bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border-primary text-gray-900 dark:text-dark-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pass Mark *</label>
                    <input type="number" min="1" max={examFormData.totalMarks} value={examFormData.passingMarks} onChange={e => setExamFormData({ ...examFormData, passingMarks: parseInt(e.target.value) || 0 })} className="w-full bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border-primary text-gray-900 dark:text-dark-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permitted Attempts *</label>
                    <input type="number" min="1" value={examFormData.maxAttempts} onChange={e => setExamFormData({ ...examFormData, maxAttempts: parseInt(e.target.value) || 0 })} className="w-full bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border-primary text-gray-900 dark:text-dark-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="pt-6 border-t border-gray-200 dark:border-dark-border-primary">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-4 flex items-center gap-2"><Calendar size={16} /> Schedule & Availability</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date & Time *</label>
                    <input type="datetime-local" value={examFormData.startDate} onChange={e => setExamFormData({ ...examFormData, startDate: e.target.value })} className="w-full bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border-primary text-gray-900 dark:text-dark-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date & Time *</label>
                    <input type="datetime-local" value={examFormData.endDate} onChange={e => setExamFormData({ ...examFormData, endDate: e.target.value })} className="w-full bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border-primary text-gray-900 dark:text-dark-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Integrity Settings */}
              <div className="pt-6 border-t border-gray-200 dark:border-dark-border-primary">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-4 flex items-center gap-2"><Filter size={16} /> Integrity & Feedback Settings</h4>
                <div className="space-y-4">
                  <label className="flex items-center space-x-4 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" checked={examFormData.randomizeQuestions} onChange={e => setExamFormData({ ...examFormData, randomizeQuestions: e.target.checked })} className="peer sr-only" />
                      <div className="w-6 h-6 rounded-md bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border-primary peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                        <Check size={14} className="text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all" strokeWidth={4} />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Randomize question sequence for candidates</span>
                  </label>
                  <label className="flex items-center space-x-4 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" checked={examFormData.showResults} onChange={e => setExamFormData({ ...examFormData, showResults: e.target.checked })} className="peer sr-only" />
                      <div className="w-6 h-6 rounded-md bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border-primary peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                        <Check size={14} className="text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all" strokeWidth={4} />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Display provisional results upon submission</span>
                  </label>
                  <label className="flex items-center space-x-4 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" checked={examFormData.allowReview} onChange={e => setExamFormData({ ...examFormData, allowReview: e.target.checked })} className="peer sr-only" />
                      <div className="w-6 h-6 rounded-md bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-border-primary peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                        <Check size={14} className="text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all" strokeWidth={4} />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Permit post-exam response review</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-dark-border-primary bg-gray-50/50 dark:bg-dark-surface flex justify-end gap-3">
              <button onClick={() => setShowExamModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-secondary transition-colors">Cancel</button>
              <button onClick={handleSaveExam} disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20">
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
