import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { BookOpen, CheckCircle, Clock, ArrowRight, Loader2 } from 'lucide-react';

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [filter, setFilter] = useState('all'); // all, in-progress, completed
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const res = await api.get('/enrollments/my-courses');
        if (res.data.success) {
          setCourses(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load my courses:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyCourses();
  }, []);

  const filteredCourses = courses.filter((item) => {
    if (filter === 'completed') return item.progress === 100 || item.status === 'completed';
    if (filter === 'in-progress') return item.progress < 100 && item.status !== 'completed';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Courses</h1>
        <p className="text-sm text-slate-500 mt-1">
          Continue your active learning journeys and access course materials.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Enrolled ({courses.length})
        </button>
        <button
          onClick={() => setFilter('in-progress')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            filter === 'in-progress'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          In Progress ({courses.filter((c) => c.progress < 100).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            filter === 'completed'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Completed ({courses.filter((c) => c.progress === 100).length})
        </button>
      </div>

      {isLoading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-400">Loading your enrolled courses...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 max-w-md mx-auto">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No courses in this view</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {filter === 'completed'
              ? 'Keep learning to complete your first course!'
              : 'You have not enrolled in courses yet.'}
          </p>
          <Link
            to="/courses"
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl inline-block"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(({ course, progress, completedLessons, totalLessons, lastAccessedAt, status }) => (
            <div
              key={course._id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="aspect-video relative overflow-hidden bg-slate-100">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/95 text-indigo-700 shadow-sm">
                    {course.category}
                  </div>
                  {progress === 100 && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500 text-white flex items-center gap-1 shadow-sm">
                      <CheckCircle className="w-3 h-3" />
                      Completed
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{course.title}</h3>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{completedLessons} / {totalLessons} Lessons</span>
                      <span className="font-bold text-slate-800">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Last accessed: {new Date(lastAccessedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  to={`/student/courses/${course._id}/learn`}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    progress === 100
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-100'
                  }`}
                >
                  {progress === 100 ? 'Review Course' : 'Continue Learning'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
