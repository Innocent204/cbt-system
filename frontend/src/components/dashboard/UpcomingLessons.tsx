import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ArrowRight, Bell, Video } from 'lucide-react';
import examService from '../../services/examService';
import { Exam } from '../../types';

const UpcomingLessons: React.FC = () => {
  const [hoveredLesson, setHoveredLesson] = useState<number | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      const response = await examService.getExams({ upcoming: 'true' });
      if (response.success && response.data) {
        setExams(response.data);
      }
      setLoading(false);
    };

    fetchExams();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'live': return <Video size={16} />;
      case 'recorded': return <Clock size={16} />;
      case 'assignment': return <Calendar size={16} />;
      default: return <Calendar size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'live': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30';
      case 'recorded': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30';
      case 'assignment': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getTimeUntil = (startTime: string) => {
    if (!startTime) return 'Time not set';
    const now = new Date();
    const lessonTime = new Date(startTime);

    const diff = lessonTime.getTime() - now.getTime();
    if (diff < 0) return 'Passed';

    const hoursUntil = Math.floor(diff / (1000 * 60 * 60));
    const minutesUntil = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hoursUntil > 0) return `in ${hoursUntil}h ${minutesUntil}m`;
    if (minutesUntil > 0) return `in ${minutesUntil}m`;
    return 'Starting soon';
  };

  const formatTime = (startTime: string) => {
    if (!startTime) return 'N/A';
    return new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mb-8 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-dark-text-primary">Upcoming Lessons</h2>
          <p className="text-dark-text-muted mt-1">Don't miss your scheduled sessions</p>
        </div>
        <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-medium transition-colors group px-0 sm:px-2">
          <span>View Schedule</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(n => (
              <div key={n} className="h-32 bg-dark-surface animate-pulse rounded-2xl border border-dark-border-primary" />
            ))}
          </div>
        ) : exams.length > 0 ? (
          exams.map((exam) => (
            <div
              key={exam.id}
              onMouseEnter={() => setHoveredLesson(exam.id)}
              onMouseLeave={() => setHoveredLesson(null)}
              className="group relative"
            >
              <div className="bg-dark-surface rounded-2xl shadow-lg border border-dark-border-primary p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4 w-full sm:flex-1">
                    <div className={`relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg`}>
                      <div className="text-white text-xl sm:text-2xl">
                        📝
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full border flex items-center space-x-1 ${getTypeColor('live')}`}>
                          {getTypeIcon('live')}
                          <span>Exam</span>
                        </span>
                        <span className="text-[10px] sm:text-xs text-dark-text-secondary uppercase tracking-wide truncate font-semibold">{exam.course_name}</span>
                      </div>

                      <h3 className="font-bold text-dark-text-primary text-base sm:text-lg mb-1 truncate">{exam.title}</h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-dark-text-secondary">
                        <div className="flex items-center space-x-1">
                          <Clock size={14} className="flex-shrink-0" />
                          <span>{formatTime(exam.start_time || '')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin size={14} className="flex-shrink-0" />
                          <span className="truncate">Virtual Hall</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <div className="text-[10px] text-gray-500 dark:text-dark-text-muted uppercase font-medium">Starts</div>
                        <div className={`text-sm font-semibold text-blue-500 dark:text-dark-text-primary`}>
                          {getTimeUntil(exam.start_time || '')}
                        </div>
                      </div>

                      <div className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full hidden sm:flex items-center justify-center text-white text-xs font-bold shadow-md`}>
                        {exam.title.substring(0, 2).toUpperCase()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button className="p-2 sm:p-2.5 rounded-xl bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors group border border-transparent dark:border-slate-800/60" title="Reminder">
                        <Bell size={16} className="text-gray-600 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white" />
                      </button>
                      <button className="flex-1 sm:flex-none px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 group shadow-md shadow-blue-500/20 active:scale-95">
                        <span>Join</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>

                {hoveredLesson === exam.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-2xl pointer-events-none"></div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-dark-surface rounded-2xl border border-dark-border-primary">
            <Calendar size={48} className="mx-auto text-dark-text-muted mb-4 opacity-20" />
            <p className="text-dark-text-muted">No upcoming exams scheduled yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingLessons;
