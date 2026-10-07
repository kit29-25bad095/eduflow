import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Users,
  ClipboardList,
  CheckCircle,
  Clock,
  Star,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Loader2,
  Edit,
  Eye,
  MessageSquare,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInstructorData = async () => {
      try {
        const [analyticsRes, coursesRes, reviewsRes] = await Promise.all([
          api.get('/analytics/instructor'),
          api.get('/courses/instructor/my-courses'),
          api.get('/reviews/instructor').catch(() => ({ data: { data: [] } })),
        ]);

        if (analyticsRes.data.success) {
          setAnalytics(analyticsRes.data.data);
        }
        if (coursesRes.data.success) {
          setCourses(coursesRes.data.data);
        }
        if (reviewsRes.data?.data) {
          setReviews(reviewsRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load instructor metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructorData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading Instructor Studio analytics...</p>
      </div>
    );
  }

  const {
    totalCourses = 0,
    publishedCourses = 0,
    totalStudents = 0,
    totalSubmissions = 0,
    pendingGrading = 0,
    averageCourseRating = 0,
    enrollmentTrends = [],
  } = analytics || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Instructor Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your courses, review student project submissions, and analyze engagement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/instructor/submissions"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <ClipboardList className="w-4 h-4 text-slate-500" />
            Review Submissions ({pendingGrading})
          </Link>
          <Link
            to="/instructor/courses/new"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-200 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Create Course
          </Link>
        </div>
      </div>

      {/* Real Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Courses</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{totalCourses}</p>
          <p className="text-[10px] text-slate-400">{publishedCourses} published live</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Enrolled Students</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{totalStudents}</p>
          <p className="text-[10px] text-emerald-600 font-medium">Unique learners</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Submissions</span>
            <ClipboardList className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{totalSubmissions}</p>
          <p className="text-[10px] text-slate-400">Deliverables uploaded</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Grading</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{pendingGrading}</p>
          <p className="text-[10px] text-amber-600 font-medium">Needs evaluation</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Average Rating</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{averageCourseRating}</p>
          <p className="text-[10px] text-slate-400">Student reviews</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completion</span>
            <CheckCircle className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {totalCourses > 0 ? Math.round((publishedCourses / totalCourses) * 100) : 0}%
          </p>
          <p className="text-[10px] text-purple-600 font-medium">Catalog publication</p>
        </div>
      </div>

      {/* Chart: Enrollment Trends */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Weekly Student Enrollment Velocity</h3>
          <p className="text-xs text-slate-400 mt-0.5">Real database student enrollments over the past 7 days</p>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={enrollmentTrends} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px', border: 'none' }}
              />
              <Line type="monotone" dataKey="enrollments" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Instructor's Courses Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">My Managed Curricula</h3>
          <span className="text-xs text-slate-400">{courses.length} courses</span>
        </div>

        {courses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            You haven't created any courses yet. Click "Create Course" above to build your first curriculum.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Students</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      {course.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{course.category}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          course.status === 'published'
                            ? 'bg-emerald-100 text-emerald-700'
                            : course.status === 'draft'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {course.price === 0 ? 'Free' : `$${course.price}`}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{course.enrolledCount || 0}</td>
                    <td className="py-3.5 px-4 text-amber-500 font-semibold">
                      ★ {course.rating?.average?.toFixed(1) || '0.0'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/courses/${course.slug || course._id}`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 inline-block"
                        title="View Public Course Page"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/instructor/courses/${course._id}/edit`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 inline-block"
                        title="Edit Syllabus & Content"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Course Feedback & Reviews Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
              <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Student Course Feedback & Ratings</h3>
              <p className="text-[11px] text-slate-400">Direct feedback and ratings received upon student course completions</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
            {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No student reviews recorded yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              When students complete your courses, their submitted ratings and feedback will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id || rev._id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={rev.student?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={rev.student?.name || 'Student'}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{rev.student?.name || 'Enrolled Student'}</h4>
                      <p className="text-[10px] text-indigo-600 font-medium truncate max-w-[200px]">
                        {rev.courseTitle || 'Course Curriculum'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                    <span className="text-xs font-bold mr-1">{rev.rating}.0</span>
                    {[...Array(5)].map((_, s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s < rev.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed italic">
                  "{rev.comment || 'Great course!'}"
                </p>

                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1 font-medium text-emerald-600">
                    <CheckCircle className="w-3 h-3" /> Verified Course Completion
                  </span>
                  <span>{rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
