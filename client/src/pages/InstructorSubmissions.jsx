import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ClipboardList,
  CheckCircle,
  Clock,
  Download,
  Award,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function InstructorSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState('pending'); // all, pending, graded
  const [isLoading, setIsLoading] = useState(true);

  // Grading Modal
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [gradingError, setGradingError] = useState('');

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/submissions/instructor/submissions');
      if (res.data.success) {
        setSubmissions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load instructor submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const openGradingModal = (sub) => {
    setGradingSubmission(sub);
    setMarks(sub.marks !== undefined ? sub.marks : '');
    setFeedback(sub.feedback || '');
    setGradingError('');
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    const max = gradingSubmission.assignment?.maxMarks || 100;
    const marksNum = Number(marks);

    if (isNaN(marksNum) || marksNum < 0 || marksNum > max) {
      setGradingError(`Marks must be a number between 0 and ${max}`);
      return;
    }

    setIsSubmittingGrade(true);
    setGradingError('');
    try {
      const res = await api.patch(`/submissions/${gradingSubmission._id}/grade`, {
        marks: marksNum,
        feedback,
      });

      if (res.data.success) {
        setSubmissions((prev) =>
          prev.map((s) => (s._id === gradingSubmission._id ? res.data.data : s))
        );
        setGradingSubmission(null);
      }
    } catch (err) {
      setGradingError(err.response?.data?.message || 'Failed to submit grade');
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (filter === 'pending') return s.status === 'submitted' || s.status === 'late';
    if (filter === 'graded') return s.status === 'graded';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Student Deliverables & Grading
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review uploaded assignment files, verify criteria, assign marks, and provide constructive feedback.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            filter === 'pending'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pending Review ({submissions.filter((s) => s.status === 'submitted' || s.status === 'late').length})
        </button>
        <button
          onClick={() => setFilter('graded')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            filter === 'graded'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Graded ({submissions.filter((s) => s.status === 'graded').length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Deliverables ({submissions.length})
        </button>
      </div>

      {isLoading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-400">Loading student deliverables...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 max-w-md mx-auto">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No deliverables to display</h3>
          <p className="text-xs text-slate-500 mt-1">
            {filter === 'pending'
              ? 'All student submissions have been evaluated!'
              : 'No submissions found under this filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Course & Assignment</th>
                  <th className="py-3.5 px-4">File Deliverable</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={sub.student?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={sub.student?.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{sub.student?.name}</p>
                          <p className="text-[10px] text-slate-400">{sub.student?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 line-clamp-1">
                        {sub.assignment?.title}
                      </p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">
                        {sub.course?.title}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-medium"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px]">{sub.fileName}</span>
                      </a>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(sub.submittedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sub.status === 'graded'
                            ? 'bg-emerald-100 text-emerald-700'
                            : sub.status === 'late'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {sub.status === 'graded' ? (
                        <span>
                          {sub.marks} / {sub.assignment?.maxMarks || 100}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openGradingModal(sub)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm ${
                          sub.status === 'graded'
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                        }`}
                      >
                        {sub.status === 'graded' ? 'Update Grade' : 'Grade Deliverable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grading Evaluation Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Grade Student Deliverable</h4>
                <p className="text-xs text-slate-500">
                  {gradingSubmission.student?.name} • {gradingSubmission.assignment?.title}
                </p>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {gradingError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{gradingError}</span>
              </div>
            )}

            <form onSubmit={handleGradeSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-600 font-medium">Submitted Deliverable:</span>
                <a
                  href={gradingSubmission.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  {gradingSubmission.fileName}
                </a>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Marks Awarded (Max: {gradingSubmission.assignment?.maxMarks || 100})
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={gradingSubmission.assignment?.maxMarks || 100}
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  placeholder={`0 - ${gradingSubmission.assignment?.maxMarks || 100}`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Actionable Feedback & Code Review
                </label>
                <textarea
                  rows="4"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide detailed feedback on architecture, correctness, and areas for improvement..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGrade}
                  className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingGrade ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Submit Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
