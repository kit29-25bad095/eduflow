import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users,
  BookOpen,
  Award,
  CheckCircle,
  ShieldCheck,
  Search,
  Check,
  X,
  Filter,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [userPagination, setUserPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'courses', 'analytics'

  // User search/filter
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('all');
  const [userPage, setUserPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);

  // Load Admin Metrics
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [analyticsRes, coursesRes] = await Promise.all([
          api.get('/analytics/admin'),
          api.get('/courses?limit=50&status=all'),
        ]);

        if (analyticsRes.data.success) {
          setAnalytics(analyticsRes.data.data);
        }
        if (coursesRes.data.success) {
          setCourses(coursesRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Load Users with pagination & filter
  const fetchUsers = async () => {
    try {
      const q = new URLSearchParams();
      if (userSearch) q.set('search', userSearch);
      if (userRole && userRole !== 'all') q.set('role', userRole);
      q.set('page', userPage);
      q.set('limit', 10);

      const res = await api.get(`/users?${q.toString()}`);
      if (res.data.success) {
        setUsers(res.data.data);
        setUserPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userSearch, userRole, userPage]);

  const toggleUserActive = async (userId) => {
    try {
      const res = await api.patch(`/users/${userId}/status`);
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isActive: res.data.data.isActive } : u))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const toggleCourseStatus = async (courseId, newStatus) => {
    try {
      const res = await api.patch(`/courses/${courseId}/status`, { status: newStatus });
      if (res.data.success) {
        setCourses((prev) =>
          prev.map((c) => (c._id === courseId ? { ...c, status: newStatus } : c))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update course status');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading Platform Administration Console...</p>
      </div>
    );
  }

  const {
    totalUsers = 0,
    studentsCount = 0,
    instructorsCount = 0,
    totalCourses = 0,
    publishedCourses = 0,
    totalEnrollments = 0,
    completedCourses = 0,
    totalSubmissions = 0,
    categoryDistribution = [],
  } = analytics || {};

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#06b6d4', '#f59e0b', '#64748b'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full w-fit mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          System Governance Console
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Platform Administration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor platform metrics, govern user accounts, and regulate course publication status.
        </p>
      </div>

      {/* 8 Platform Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Users</span>
          <p className="text-xl font-extrabold text-slate-900">{totalUsers}</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Students</span>
          <p className="text-xl font-extrabold text-indigo-600">{studentsCount}</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Instructors</span>
          <p className="text-xl font-extrabold text-violet-600">{instructorsCount}</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Courses</span>
          <p className="text-xl font-extrabold text-slate-900">{totalCourses}</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Published</span>
          <p className="text-xl font-extrabold text-emerald-600">{publishedCourses}</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Enrollments</span>
          <p className="text-xl font-extrabold text-sky-600">{totalEnrollments}</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed</span>
          <p className="text-xl font-extrabold text-emerald-600">{completedCourses}</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submissions</span>
          <p className="text-xl font-extrabold text-purple-600">{totalSubmissions}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          User Governance
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'courses'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Course Catalog Control
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Domain Distribution Analytics
        </button>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Role filter */}
            <select
              value={userRole}
              onChange={(e) => {
                setUserRole(e.target.value);
                setUserPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="instructor">Instructors</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => toggleUserActive(u._id)}
                          className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                            u.isActive
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* User Pagination */}
          {userPagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>
                Showing page {userPagination.page} of {userPagination.totalPages} ({userPagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={userPage <= 1}
                  onClick={() => setUserPage(userPage - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={userPage >= userPagination.totalPages}
                  onClick={() => setUserPage(userPage + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Course Governance */}
      {activeTab === 'courses' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Platform Courses Governance</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Enrollments</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Regulate Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                      {course.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{course.instructor?.name}</td>
                    <td className="py-3 px-4 text-slate-600">{course.category}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{course.enrolledCount || 0}</td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-right space-x-2">
                      {course.status !== 'published' ? (
                        <button
                          onClick={() => toggleCourseStatus(course._id, 'published')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 text-[11px]"
                        >
                          Publish
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleCourseStatus(course._id, 'draft')}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold hover:bg-amber-100 text-[11px]"
                        >
                          Unpublish
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Analytics Distribution */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Curricula by Subject Discipline</h3>
                <span className="text-[11px] font-semibold text-slate-400">Total Courses: {totalCourses}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Distribution of active platform courses</p>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryDistribution} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={120} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}
                    itemStyle={{ color: '#f8fafc', fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '2px' }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Platform User Composition</h3>
                <span className="text-[11px] font-semibold text-slate-400">Total Accounts: {totalUsers}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Student vs Instructor vs Admin distribution</p>
            </div>

            <div className="h-48 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Students', value: studentsCount, color: '#6366f1' },
                      { name: 'Instructors', value: instructorsCount, color: '#8b5cf6' },
                      { name: 'Admins', value: Math.max(0, totalUsers - studentsCount - instructorsCount), color: '#f59e0b' },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}
                    itemStyle={{ color: '#f8fafc', fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '2px' }}
                    formatter={(val, name) => [`${val} accounts (${((val / (totalUsers || 1)) * 100).toFixed(1)}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-slate-900">{totalUsers}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Users</span>
              </div>
            </div>

            {/* Clear Role Breakdown & Legend */}
            <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-100">
              <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100/80 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-700">Students</span>
                </div>
                <p className="text-base font-extrabold text-indigo-700">{studentsCount}</p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {((studentsCount / (totalUsers || 1)) * 100).toFixed(1)}%
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100/80 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-700">Instructors</span>
                </div>
                <p className="text-base font-extrabold text-purple-700">{instructorsCount}</p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {((instructorsCount / (totalUsers || 1)) * 100).toFixed(1)}%
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100/80 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-700">Admins</span>
                </div>
                <p className="text-base font-extrabold text-amber-700">
                  {Math.max(0, totalUsers - studentsCount - instructorsCount)}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {(((Math.max(0, totalUsers - studentsCount - instructorsCount)) / (totalUsers || 1)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
