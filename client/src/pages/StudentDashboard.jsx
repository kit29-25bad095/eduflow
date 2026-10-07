import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  FileText,
  CheckSquare,
  ArrowRight,
  Loader2,
  Calendar,
  Heart,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, wishlistRes] = await Promise.all([
          api.get('/analytics/student').catch(() => ({ data: { data: null } })),
          api.get('/wishlist').catch(() => ({ data: { data: [] } })),
        ]);

        if (analyticsRes.data?.success) {
          setAnalytics(analyticsRes.data.data);
        }
        if (wishlistRes.data?.success && Array.isArray(wishlistRes.data.data)) {
          setWishlist(wishlistRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load student dashboard metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Calculating your learning analytics...</p>
      </div>
    );
  }

  const {
    totalEnrolled = 0,
    completedCourses = 0,
    averageProgress = 0,
    assignmentsPending = 0,
    assignmentsSubmitted = 0,
    averageGrade = 0,
    learningHours = 0,
    courseProgress = [],
    weeklyActivity = [],
  } = analytics || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your course progress, upcoming assignments, and verified academic metrics.
          </p>
        </div>
        <Link
          to="/courses"
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-200 transition-all"
        >
          <BookOpen className="w-4 h-4" />
          Browse More Courses
        </Link>
      </div>

      {/* 7 Core Database Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Enrolled</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{totalEnrolled}</p>
          <p className="text-[10px] text-slate-400">Active enrollments</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{completedCourses}</p>
          <p className="text-[10px] text-emerald-600 font-medium">100% finished</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avg Progress</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{averageProgress}%</p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${averageProgress}%` }} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Submitted</span>
            <CheckSquare className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{assignmentsSubmitted}</p>
          <p className="text-[10px] text-slate-400">Assignments sent</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{assignmentsPending}</p>
          <p className="text-[10px] text-amber-600 font-medium">Awaiting upload</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avg Grade</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{averageGrade}%</p>
          <p className="text-[10px] text-purple-600 font-medium">Evaluated marks</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Learning</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{learningHours}h</p>
          <p className="text-[10px] text-slate-400">Time invested</p>
        </div>
      </div>

      {/* Main Grid: Weekly Chart & Course Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Activity Chart (Recharts) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Weekly Learning Activity</h3>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Lessons completed over the past 7 days</p>
          </div>

          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px', border: 'none' }}
                />
                <Bar dataKey="lessonsCompleted" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course-by-Course Progress List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Active Course Progress</h3>
            <Link to="/student/courses" className="text-xs font-semibold text-indigo-600 hover:underline">
              View all
            </Link>
          </div>

          {courseProgress.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              You are not enrolled in any courses yet. Browse the catalog to start learning.
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-slate-100">
              {courseProgress.map((cp) => (
                <div key={cp.courseId} className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        {cp.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{cp.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{cp.completedLessons} of {cp.totalLessons} lessons completed</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-800">{cp.progress}% complete</span>
                    </div>

                    <div className="w-full max-w-md h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          cp.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${cp.progress}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    to={`/student/courses/${cp.courseId}/learn`}
                    className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-indigo-600 text-white transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    Continue
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Saved in Wishlist */}
      {wishlist.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                Saved in Wishlist
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Courses you've bookmarked to enroll in next
              </p>
            </div>
            <Link
              to="/courses"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Explore Catalog <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {wishlist.map((course) => (
              <div
                key={course.id || course._id}
                className="group border border-slate-200/90 hover:border-indigo-300 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                    <img
                      src={
                        course.thumbnail ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
                      }
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 text-slate-700 backdrop-blur-sm">
                      {course.category}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {course.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                      <span className="font-semibold text-slate-700 capitalize">{course.level || 'All levels'}</span>
                      <span>•</span>
                      <span className="font-bold text-emerald-600">
                        {course.price > 0 ? `$${course.price}` : 'Free'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <Link
                    to={`/courses/${course.id || course._id}`}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    View Course
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
