import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare,
  Star,
  Trash2,
  AlertTriangle,
  Mail,
  User,
  BookOpen,
  Filter,
  Search,
  CheckCircle,
  Clock,
  ShieldAlert,
  Loader2,
  X,
  Send,
  Flag,
} from 'lucide-react';

export default function InstructorReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Report Modal state
  const [reportingReview, setReportingReview] = useState(null);
  const [reportReason, setReportReason] = useState('Abusive / Harassing Language');
  const [reportNotes, setReportNotes] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Deleting state
  const [deletingId, setDeletingId] = useState(null);

  const fetchReviews = async () => {
    try {
      const [revRes, crsRes] = await Promise.all([
        api.get('/reviews/instructor'),
        api.get('/courses/instructor/my-courses'),
      ]);

      if (revRes.data.success) {
        setReviews(revRes.data.data || []);
      }
      if (crsRes.data.success) {
        setCourses(crsRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load instructor reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteComment = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this comment? This will remove it from the course page and recalculate ratings.')) {
      return;
    }

    setDeletingId(reviewId);
    try {
      const res = await api.delete(`/reviews/${reviewId}`);
      if (res.data.success) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId && r._id !== reviewId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenReportModal = (review) => {
    setReportingReview(review);
    setReportReason('Abusive / Harassing Language');
    setReportNotes(`Reported comment: "${review.comment?.substring(0, 150)}..."`);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportingReview) return;

    setIsSubmittingReport(true);
    const revId = reportingReview.id || reportingReview._id;
    try {
      const res = await api.post(`/reviews/${revId}/report`, {
        reason: `${reportReason}: ${reportNotes}`.trim(),
      });

      if (res.data.success) {
        // Mark as reported in local state
        setReviews((prev) =>
          prev.map((r) => (r.id === revId || r._id === revId ? { ...r, isReported: true, reportStatus: 'pending' } : r))
        );
        setReportingReview(null);
        alert('Abuse report submitted to Platform Administrator for review.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit abuse report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    const matchesCourse = selectedCourse === 'all' || r.courseId === selectedCourse;
    const studentName = r.student?.name || '';
    const studentEmail = r.student?.email || '';
    const comment = r.comment || '';
    const courseTitle = r.courseTitle || '';

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      studentName.toLowerCase().includes(q) ||
      studentEmail.toLowerCase().includes(q) ||
      comment.toLowerCase().includes(q) ||
      courseTitle.toLowerCase().includes(q);

    return matchesCourse && matchesSearch;
  });

  const totalReviews = reviews.length;
  const reportedCount = reviews.filter((r) => r.isReported).length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalReviews).toFixed(1) : '5.0';

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading student reviews & comments...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full w-fit mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            Instructor Moderation Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Reviews & Discussion Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor all student reviews, identify comment authors by name and email, delete inappropriate content, and report abusive accounts directly to system administrators.
          </p>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Reviews</span>
            <MessageSquare className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{totalReviews}</p>
          <p className="text-[10px] text-slate-400">Across your published courses</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Average Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{avgRating} / 5.0</p>
          <p className="text-[10px] text-slate-400">Overall student satisfaction</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Reported Comments</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600">{reportedCount}</p>
          <p className="text-[10px] text-slate-400">Escalated to Platform Admin</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, email, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Course:</span>
          </div>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 w-full sm:w-auto"
          >
            <option value="all">All My Courses ({totalReviews})</option>
            {courses.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews Feed */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No student comments found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || selectedCourse !== 'all'
                ? 'Try adjusting your search terms or course filter.'
                : 'No reviews have been submitted for your courses yet.'}
            </p>
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const revId = rev.id || rev._id;
            return (
              <div
                key={revId}
                className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all space-y-4 shadow-sm ${
                  rev.isReported ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200/90 hover:border-indigo-200'
                }`}
              >
                {/* Header: Course + Status Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {rev.courseTitle || 'Course Review'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {rev.isReported && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      Reported to Admin ({rev.reportStatus || 'pending'})
                    </span>
                  )}
                </div>

                {/* Author Info (Name, Email, Avatar) + Stars */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        rev.student?.profileImage ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={rev.student?.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">{rev.student?.name || 'Student'}</span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified Student
                        </span>
                      </div>
                      {/* Prominent Student Email */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 font-medium">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-indigo-600 font-semibold">{rev.student?.email || 'No email registered'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-3 py-1 rounded-xl self-start sm:self-auto">
                    {[...Array(5)].map((_, s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s < (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-1.5">{rev.rating || 5}.0</span>
                  </div>
                </div>

                {/* Comment Body */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  "{rev.comment}"
                </div>

                {/* Moderation Actions */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  {!rev.isReported ? (
                    <button
                      onClick={() => handleOpenReportModal(rev)}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      Report to Admin
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-rose-600 flex items-center gap-1 italic">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Report Logged with Admin
                    </span>
                  )}

                  <button
                    onClick={() => handleDeleteComment(revId)}
                    disabled={deletingId === revId}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deletingId === revId ? 'Deleting...' : 'Delete Comment'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Report to Admin Modal */}
      {reportingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-base">
                <ShieldAlert className="w-5 h-5" />
                Report Abusive Account to Admin
              </div>
              <button
                onClick={() => setReportingReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <p className="font-bold text-slate-800">
                Offending Student: <span className="text-indigo-600 font-extrabold">{reportingReview.student?.name}</span> ({reportingReview.student?.email})
              </p>
              <p className="text-slate-500 line-clamp-2 italic">
                Comment: "{reportingReview.comment}"
              </p>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Violation Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Abusive / Harassing Language">Abusive / Harassing Language</option>
                  <option value="Hate Speech / Inappropriate Content">Hate Speech / Inappropriate Content</option>
                  <option value="Spam / Advertisements">Spam / Advertisements</option>
                  <option value="Academic Misconduct / Cheating">Academic Misconduct / Cheating</option>
                  <option value="Other Policy Violation">Other Policy Violation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Additional Context for Admin</label>
                <textarea
                  rows="3"
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Explain why this student comment violates guidelines and whether account suspension is requested..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingReview(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-rose-200 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmittingReport ? 'Submitting...' : 'Send Report to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
