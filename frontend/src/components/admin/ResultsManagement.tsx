import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Edit, Clock, TrendingUp, Award, BarChart3, FileText } from 'lucide-react';
import LoadingScreen from '../common/LoadingScreen';
import examService from '../../services/examService';

interface ExamResult {
  id: number;
  examTitle: string;
  studentName: string;
  studentId: string;
  course: string;
  submittedAt: string;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  totalPoints: number;
  obtainedPoints: number;
  percentage: number;
  grade: string;
  passed: boolean;
  timeSpent: number;
  status: 'graded' | 'pending_review' | 'manual_review';
}

interface ExamStatistics {
  examId: number;
  examTitle: string;
  totalSubmissions: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  gradeDistribution: Record<string, number>;
  averageTimeSpent: number;
}

const ResultsManagement: React.FC = () => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [statistics, setStatistics] = useState<ExamStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [examFilter, setExamFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'results' | 'statistics' | 'analytics'>('results');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await examService.getExamResults();
        if (response.success && response.data) {
          const rawData = response.data;
          const mappedResults: ExamResult[] = rawData.map((r: any) => ({
            id: r.id,
            examTitle: r.exam_title,
            studentName: r.student_name,
            studentId: r.student_name, // Using username as ID
            course: r.course_name || 'N/A',
            submittedAt: r.completed_at,
            totalQuestions: r.total_questions || 0,
            attemptedQuestions: (r.total_questions - (r.unanswered || 0)) || 0,
            correctAnswers: r.correct_answers || 0,
            totalPoints: r.total_marks,
            obtainedPoints: r.score,
            percentage: r.percentage,
            grade: r.grade,
            passed: r.is_passed,
            timeSpent: r.duration_minutes || 0,
            status: r.status as 'graded' | 'pending_review' | 'manual_review',
          }));
          setResults(mappedResults);

          // Generate simple statistics from results
          const examStats: Record<number, ExamStatistics> = {};
          mappedResults.forEach(r => {
            const examId = rawData.find((orig: any) => orig.id === r.id)?.exam;
            if (!examId) return;

            if (!examStats[examId]) {
              examStats[examId] = {
                examId,
                examTitle: r.examTitle,
                totalSubmissions: 0,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 100,
                passRate: 0,
                gradeDistribution: {},
                averageTimeSpent: 0
              };
            }

            const s = examStats[examId];
            s.totalSubmissions++;
            s.averageScore += r.percentage;
            s.highestScore = Math.max(s.highestScore, r.percentage);
            s.lowestScore = Math.min(s.lowestScore, r.percentage);
            if (r.passed) s.passRate++;
            s.gradeDistribution[r.grade] = (s.gradeDistribution[r.grade] || 0) + 1;
            s.averageTimeSpent += r.timeSpent;
          });

          Object.values(examStats).forEach(s => {
            s.averageScore /= s.totalSubmissions;
            s.passRate = (s.passRate / s.totalSubmissions) * 100;
            s.averageTimeSpent /= s.totalSubmissions;
          });

          setStatistics(Object.values(examStats));
        }
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const filteredResults = results.filter(result => {
    const matchesSearch = result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.examTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExam = examFilter === 'all' || result.examTitle === examFilter;
    const matchesStatus = statusFilter === 'all' || result.status === statusFilter;
    const matchesGrade = gradeFilter === 'all' || result.grade === gradeFilter;

    return matchesSearch && matchesExam && matchesStatus && matchesGrade;
  });

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400';
    if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400';
    if (grade === 'D') return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded': return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300';
      case 'manual_review': return 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300';
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const exportResults = (format: 'csv' | 'excel' | 'pdf') => {
    console.log(`Exporting results in ${format} format`);
    // Implementation 
  };

  const viewResultDetails = (result: ExamResult) => {
    setSelectedResult(result);
    setShowDetailsModal(true);
  };

  if (loading) {
    return <LoadingScreen fullScreen={false} message="Synthesizing Analytics" transparent />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">Results Management</h2>
          <p className="text-gray-600 dark:text-dark-text-secondary">View and manage exam results and performance analytics</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => exportResults('csv')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Download size={20} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => exportResults('excel')}
            className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-all active:scale-95"
          >
            <FileText size={20} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Total Results</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{results.length}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <FileText size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Pass Rate</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Math.round((results.filter(r => r.passed).length / results.length) * 100)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
              <Award size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Average Score</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Avg Time</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatTime(Math.round(results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length))}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border-primary">
        <div className="border-b border-gray-200 dark:border-dark-border-primary">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('results')}
              className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${activeTab === 'results'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              Individual Results ({results.length})
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${activeTab === 'statistics'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              Exam Statistics ({statistics.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${activeTab === 'analytics'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              Analytics Dashboard
            </button>
          </nav>
        </div>

        {/* Filters */}
        {activeTab === 'results' && (
          <div className="p-4 border-b border-gray-200 dark:border-dark-border-primary">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student name, ID, or exam..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary outline-none transition-all"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter size={20} className="text-gray-500" />
                <select
                  value={examFilter}
                  onChange={(e) => setExamFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary outline-none transition-all"
                >
                  <option value="all">All Exams</option>
                  {Array.from(new Set(results.map(r => r.examTitle))).map(exam => (
                    <option key={exam} value={exam}>{exam}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary outline-none transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="graded">Graded</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="manual_review">Manual Review</option>
                </select>

                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-dark-secondary dark:text-dark-text-primary outline-none transition-all"
                >
                  <option value="all">All Grades</option>
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="B-">B-</option>
                  <option value="C+">C+</option>
                  <option value="C">C</option>
                  <option value="C-">C-</option>
                  <option value="D">D</option>
                  <option value="F">F</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {activeTab === 'results' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-dark-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-primary divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-dark-surface">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                            {result.studentName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {result.studentId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-dark-text-primary">
                          {result.examTitle}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {result.course}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-dark-text-primary">
                          {result.obtainedPoints}/{result.totalPoints}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {result.percentage.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getGradeColor(result.grade)}`}>
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(result.status)}`}>
                          {result.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(result.timeSpent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewResultDetails(result)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        >
                          <Eye size={16} />
                        </button>
                        <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3">
                          <Download size={16} />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                          <Edit size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statistics.map((stat) => (
                <div key={stat.examId} className="border border-gray-200 dark:border-dark-border-primary rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
                    {stat.examTitle}
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Submissions:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{stat.totalSubmissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Average Score:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{stat.averageScore.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Highest Score:</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">{stat.highestScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Lowest Score:</span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">{stat.lowestScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Pass Rate:</span>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{stat.passRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Avg Time:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{formatTime(stat.averageTimeSpent)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border-primary">
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                      View Detailed Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <BarChart3 size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary mb-2">Analytics Dashboard</h3>
              <p className="text-gray-500 dark:text-gray-400">Advanced analytics and insights coming soon</p>
            </div>
          )}
        </div>
      </div>

      {/* Result Details Modal */}
      {showDetailsModal && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-dark-border-primary">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">
                  Result Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary mb-4">Student Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{selectedResult.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Student ID:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{selectedResult.studentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Course:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{selectedResult.course}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary mb-4">Performance Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Score:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                        {selectedResult.obtainedPoints}/{selectedResult.totalPoints} ({selectedResult.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Grade:</span>
                      <span className={`text-sm font-medium ${getGradeColor(selectedResult.grade)}`}>
                        {selectedResult.grade}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedResult.status)}`}>
                        {selectedResult.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Result:</span>
                      <span className={`text-sm font-medium ${selectedResult.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {selectedResult.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-dark-secondary p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                      {selectedResult.attemptedQuestions}/{selectedResult.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Questions Attempted</div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-dark-secondary p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                      {selectedResult.correctAnswers}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Correct Answers</div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-dark-secondary p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                      {formatTime(selectedResult.timeSpent)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Time Spent</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                  Download Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsManagement;
