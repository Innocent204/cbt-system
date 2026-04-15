import React from 'react';
import { BookOpen, ArrowRight, Calendar, User } from 'lucide-react';

const CourseSection: React.FC = () => {
  const courses = [
    {
      title: 'Informatic Course',
      author: 'Johen Doe',
      date: '19 April',
      level: 'Intermediate'
    },
    {
      title: 'Live Drawing',
      author: 'Micak Doe',
      date: '12 June',
      level: 'Beginner'
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Course Highlights</h2>
          <p className="text-sm text-gray-500 dark:text-slate-500">Quick overview of key courses</p>
        </div>
        <button className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
          <span>View all</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-lg border border-gray-200/60 dark:border-slate-800/70 p-4 space-y-3">
        {courses.map((course, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors ${
              index !== courses.length - 1 ? 'border-b border-gray-100 dark:border-slate-800 pb-4 mb-1' : ''
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-md">
              <BookOpen size={18} />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm line-clamp-1">
                  {course.title}
                </h3>
                <span className="inline-flex items-center rounded-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600 dark:text-slate-300">
                  {course.level}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <User size={12} />
                  <span>{course.author}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{course.date}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseSection;
