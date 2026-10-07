import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  PlayCircle,
  CheckCircle2,
  Circle,
  FileText,
  Upload,
  Download,
  Award,
  ChevronDown,
  ChevronRight,
  Clock,
  Sparkles,
  Loader2,
  Check,
  BookOpen,
  Star,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

function getEmbedVideoUrl(url) {
  if (!url) return null;
  // If already an embed URL:
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  // Standard YouTube formats: watch?v=ID or youtu.be/ID or youtube.com/v/ID
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|v\/|embed\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return null;
}

export default function CoursePlayer() {
  const { courseId } = useParams();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [progressData, setProgressData] = useState({
    progress: 0,
    completedLessons: 0,
    totalLessons: 0,
    completedAssignments: 0,
    totalAssignments: 0,
    passedQuizzes: 0,
    totalQuizzes: 0,
    completedLessonIds: [],
  });
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState('lesson'); // 'lesson', 'quizzes', 'assignments'
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  // File upload state for assignments
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  // Course completion feedback modal states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Collapsible modules state
  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => {
    const loadPlayerData = async () => {
      setIsLoading(true);
      try {
        const [courseRes, progressRes, assignRes, reviewRes, quizRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/progress/course/${courseId}`),
          api.get(`/assignments/course/${courseId}`),
          api.get(`/reviews/course/${courseId}`).catch(() => ({ data: { data: [] } })),
          api.get(`/quizzes/course/${courseId}`).catch(() => ({ data: { data: [] } })),
        ]);

        if (courseRes.data.success) {
          const cData = courseRes.data.data;
          setCourse(cData);

          // Find first lesson
          let firstLesson = null;
          const initialExpanded = {};
          if (cData.modules?.length > 0) {
            cData.modules.forEach((mod) => {
              initialExpanded[mod._id || mod.id] = true;
              if (!firstLesson && mod.lessons?.length > 0) {
                firstLesson = mod.lessons[0];
              }
            });
          }
          setExpandedModules(initialExpanded);
          setActiveLesson(firstLesson);
        }

        if (progressRes.data.success) {
          setProgressData(progressRes.data.data);
        }

        if (assignRes.data.success) {
          setAssignments(assignRes.data.data);
        }

        if (quizRes.data?.data) {
          const qList = quizRes.data.data;
          setQuizzes(qList);
          if (qList.length > 0) {
            setActiveQuiz(qList[0]);
            if (qList[0].latestAttempt) {
              setQuizFeedback(qList[0].latestAttempt);
            }
          }
        }

        if (reviewRes.data?.data) {
          const myRev = reviewRes.data.data.find(
            (r) => r.studentId === user?.id || r.student?.id === user?.id
          );
          if (myRev) {
            setHasReviewed(true);
            setFeedbackRating(myRev.rating || 5);
            setFeedbackComment(myRev.comment || '');
          }
        }
      } catch (err) {
        console.error('Failed to load course player data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayerData();
  }, [courseId, user]);

  const toggleModule = (modId) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleSelectQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setActiveTab('quizzes');
    setQuizAnswers({});
    setQuizFeedback(quiz.latestAttempt || null);
  };

  const handleQuizAnswer = (qId, option) => {
    setQuizAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    if (!activeQuiz) return;

    setQuizSubmitting(true);
    try {
      const res = await api.post(`/quizzes/${activeQuiz.id}/submit`, {
        answers: quizAnswers,
      });

      if (res.data.success) {
        const attempt = res.data.data.attempt;
        setQuizFeedback(attempt);

        // Refresh composite course progress
        const progRes = await api.get(`/progress/course/${courseId}`);
        if (progRes.data.success) {
          setProgressData(progRes.data.data);
          if (progRes.data.data.progress >= 100) {
            setTimeout(() => setShowFeedbackModal(true), 600);
          }
        }

        // Update in quizzes list
        setQuizzes((prev) =>
          prev.map((q) => (q.id === activeQuiz.id ? { ...q, latestAttempt: attempt } : q))
        );
      }
    } catch (err) {
      console.error('Quiz submit failed:', err);
      alert(err.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!activeLesson) return;
    setIsCompleting(true);
    try {
      const res = await api.post(`/progress/lesson/${activeLesson._id}/complete`, {
        timeSpent: activeLesson.duration || 10,
      });

      if (res.data.success) {
        const nextProgress = res.data.data.progress;
        setProgressData((prev) => ({
          ...prev,
          progress: nextProgress,
          completedLessons: res.data.data.completedLessons,
          totalLessons: res.data.data.totalLessons,
          completedLessonIds: [
            ...new Set([...prev.completedLessonIds, activeLesson._id.toString()]),
          ],
        }));

        // If completed 100%, automatically prompt for course feedback & rating
        if (nextProgress >= 100) {
          setTimeout(() => setShowFeedbackModal(true), 600);
        }
      }
    } catch (err) {
      console.error('Failed to mark lesson complete:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!course || !feedbackComment.trim()) return;

    setIsSubmittingFeedback(true);
    try {
      const res = await api.post('/reviews', {
        courseId: course._id || course.id || courseId,
        rating: feedbackRating,
        comment: feedbackComment.trim(),
      });

      if (res.data.success) {
        setHasReviewed(true);
        setFeedbackSuccess(true);
        setTimeout(() => {
          setShowFeedbackModal(false);
          setFeedbackSuccess(false);
        }, 1800);
      }
    } catch (err) {
      console.error('Failed to submit course feedback:', err);
      alert(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!submittingAssignmentId || !selectedFile) return;

    setIsUploading(true);
    setUploadMessage(null);
    try {
      const formData = new FormData();
      formData.append('assignmentId', submittingAssignmentId);
      formData.append('file', selectedFile);

      const res = await api.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setUploadMessage({ type: 'success', text: 'Assignment submitted successfully!' });
        // Refresh assignments list to show submission
        const assignRes = await api.get(`/assignments/course/${courseId}`);
        if (assignRes.data.success) {
          setAssignments(assignRes.data.data);
        }
        setSelectedFile(null);
        setTimeout(() => setSubmittingAssignmentId(null), 1500);
      }
    } catch (err) {
      setUploadMessage({
        type: 'error',
        text: err.response?.data?.message || 'File submission failed',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading course curriculum & progress...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-12 text-center text-slate-500">Course could not be loaded.</div>
    );
  }

  const isCurrentLessonCompleted =
    activeLesson && progressData.completedLessonIds.includes((activeLesson._id || activeLesson.id || '').toString());

  const embedUrl = activeLesson ? getEmbedVideoUrl(activeLesson.videoUrl) : null;

  const allLessons = [];
  if (course?.modules) {
    course.modules.forEach((mod) => {
      if (mod.lessons) {
        mod.lessons.forEach((les) => allLessons.push(les));
      }
    });
  }
  const currentLessonIndex = allLessons.findIndex(
    (l) => (l._id || l.id) === (activeLesson?._id || activeLesson?.id)
  );
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  let parsedResources = [];
  if (activeLesson?.resources) {
    if (Array.isArray(activeLesson.resources)) {
      parsedResources = activeLesson.resources;
    } else if (typeof activeLesson.resources === 'string') {
      try {
        parsedResources = JSON.parse(activeLesson.resources);
      } catch (e) {
        parsedResources = [];
      }
    }
  }

  return (
    <div className="min-h-[90vh] bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/student/courses"
            className="text-xs font-semibold text-slate-400 hover:text-white"
          >
            ← Back to Courses
          </Link>
          <span className="text-slate-600">|</span>
          <h2 className="text-sm font-bold text-white truncate max-w-lg">{course.title}</h2>
        </div>

        {/* Real-time Composite Progress Bar */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span>Lessons: <strong className="text-slate-200">{progressData.completedLessons}/{progressData.totalLessons}</strong></span>
            <span>•</span>
            <span>Assignments: <strong className="text-slate-200">{progressData.completedAssignments || 0}/{progressData.totalAssignments || assignments.length}</strong></span>
            <span>•</span>
            <span>Quizzes: <strong className="text-slate-200">{progressData.passedQuizzes || 0}/{progressData.totalQuizzes || quizzes.length}</strong></span>
          </div>

          <div className="w-24 sm:w-32 h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressData.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${progressData.progress}%` }}
            />
          </div>
          <span className="font-extrabold text-white text-xs">{progressData.progress}%</span>

          {progressData.progress === 100 && (
            <div className="flex items-center gap-2">
              <Link
                to="/profile#certificates"
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 text-xs transition-colors shadow-sm"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Certificate</span>
              </Link>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Share course feedback & rating with the instructor"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                <span>{hasReviewed ? 'Edit Feedback' : 'Give Feedback'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Player / Content Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('lesson')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'lesson'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Lecture Video & Notes
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'quizzes'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Interactive Quizzes ({quizzes.length})
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'assignments'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Assignments & Projects ({assignments.length})
            </button>
          </div>

          {activeTab === 'lesson' ? (
            activeLesson ? (
              <div className="space-y-6 max-w-4xl">
                {/* 100% Course Completion Celebration & Feedback Action Banner */}
                {progressData.progress === 100 && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-300 shadow-xl">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30 shrink-0">
                        🎉
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                          Course 100% Completed!
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            CERTIFIED
                          </span>
                        </h4>
                        <p className="text-slate-300 mt-0.5">
                          {hasReviewed
                            ? 'Your course rating and feedback have been published to the instructor.'
                            : 'Please rate your learning experience to share feedback with the instructor.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFeedbackModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0"
                    >
                      <Star className="w-3.5 h-3.5 fill-slate-950 stroke-slate-950" />
                      {hasReviewed ? 'Update Feedback & Rating' : 'Leave Rating & Feedback'}
                    </button>
                  </div>
                )}

                {/* Video Container - Supports both YouTube/Vimeo embeds and direct MP4 streams */}
                <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative">
                  {embedUrl ? (
                    <iframe
                      key={activeLesson._id || activeLesson.id}
                      src={embedUrl}
                      title={activeLesson.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      key={activeLesson._id || activeLesson.id}
                      src={activeLesson.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                      controls
                      className="w-full h-full"
                    />
                  )}
                </div>

                {/* Title & Complete Action Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/50 p-6 rounded-3xl border border-slate-800">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">{activeLesson.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {activeLesson.duration || 10} minutes
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleMarkComplete}
                    disabled={isCompleting || isCurrentLessonCompleted}
                    className={`px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                      isCurrentLessonCompleted
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isCompleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : isCurrentLessonCompleted ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        Completed
                      </>
                    ) : (
                      'Mark as Complete'
                    )}
                  </button>
                </div>

                {/* Lesson Notes & Content */}
                <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-800/80 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Lecture Notes & Syllabus Guide
                  </h4>
                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {activeLesson.content || activeLesson.description}
                  </div>

                  {parsedResources.length > 0 && (
                    <div className="pt-4 border-t border-slate-800">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                        Downloadable Resources & Artifacts
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {parsedResources.map((res, i) => (
                          <a
                            key={i}
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs flex items-center justify-between transition-colors group"
                          >
                            <div className="flex items-center gap-2 truncate mr-2">
                              <Download className="w-4 h-4 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="font-semibold truncate">{res.name || res.title || 'Resource File'}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-900 text-slate-400 border border-slate-700 shrink-0">
                              {res.type || 'link'}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Previous / Next Lesson Sequential Navigation */}
                  <div className="pt-5 border-t border-slate-800/80 flex items-center justify-between gap-4">
                    {prevLesson ? (
                      <button
                        onClick={() => setActiveLesson(prevLesson)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-colors max-w-[45%]"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Prev: {prevLesson.title}</span>
                      </button>
                    ) : <div />}

                    {nextLesson ? (
                      <button
                        onClick={() => setActiveLesson(nextLesson)}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white flex items-center gap-2 transition-colors max-w-[45%]"
                      >
                        <span className="truncate">Next: {nextLesson.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    ) : <div />}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">Select a lesson to begin.</div>
            )
          ) : activeTab === 'quizzes' ? (
            /* Interactive Quizzes Runner View */
            <div className="space-y-6 max-w-4xl">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-400" />
                  Interactive Course Quizzes & Knowledge Checks
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Test your mastery of modules and course concepts. Pass all quizzes with 70%+ to achieve 100% course completion and earn your certificate.
                </p>
              </div>

              {quizzes.length === 0 ? (
                <div className="p-12 text-center bg-slate-800/40 rounded-3xl border border-slate-800 text-xs text-slate-400">
                  No quizzes published for this course yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Quiz Selector Pills */}
                  {quizzes.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {quizzes.map((quiz, qIdx) => {
                        const isCurrent = activeQuiz?.id === quiz.id;
                        const isPassed = quiz.latestAttempt?.passed === 1 || quiz.latestAttempt?.passed === true;
                        return (
                          <button
                            key={quiz.id}
                            onClick={() => handleSelectQuiz(quiz)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                              isCurrent
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span>Quiz {qIdx + 1}: {quiz.title}</span>
                            {isPassed && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Passed
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {activeQuiz && (
                    <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                        <div>
                          <h4 className="text-base sm:text-lg font-bold text-white">
                            {activeQuiz.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">{activeQuiz.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            Passing: {activeQuiz.passingScore}%
                          </span>
                        </div>
                      </div>

                      {/* Score Result Banner if attempt exists */}
                      {quizFeedback && (
                        <div
                          className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                            quizFeedback.passed
                              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'
                              : 'bg-amber-950/60 border-amber-500/30 text-amber-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">
                              {quizFeedback.passed ? '🎉' : '⚠️'}
                            </div>
                            <div>
                              <h5 className="font-extrabold text-sm text-white flex items-center gap-2">
                                {quizFeedback.passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  quizFeedback.passed ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                                }`}>
                                  Score: {quizFeedback.score} / {quizFeedback.totalQuestions} ({quizFeedback.percentage}%)
                                </span>
                              </h5>
                              <p className="text-xs mt-0.5 opacity-90">
                                {quizFeedback.passed
                                  ? 'Great job! Your passing result has been recorded towards your course certification.'
                                  : `You scored ${quizFeedback.percentage}%. The passing threshold is ${activeQuiz.passingScore}%. You can review explanations below and retake it.`}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setQuizFeedback(null);
                              setQuizAnswers({});
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white shrink-0 shadow-sm"
                          >
                            Retake Quiz
                          </button>
                        </div>
                      )}

                      {/* Questions Form */}
                      <form onSubmit={handleQuizSubmit} className="space-y-6">
                        {activeQuiz.questions?.map((q, qIndex) => {
                          const selectedOption = quizAnswers[q.id];
                          const isSubmitted = Boolean(quizFeedback);
                          let answersMap = {};
                          if (quizFeedback?.answersJson) {
                            try { answersMap = JSON.parse(quizFeedback.answersJson); } catch (e) {}
                          }
                          const isCorrect = isSubmitted && answersMap[q.id] === q.correctOption;

                          return (
                            <div
                              key={q.id}
                              className={`p-5 rounded-2xl border transition-all ${
                                isSubmitted
                                  ? isCorrect
                                    ? 'bg-emerald-950/20 border-emerald-500/30'
                                    : 'bg-rose-950/20 border-rose-500/30'
                                  : 'bg-slate-900/60 border-slate-800'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <h5 className="text-sm font-semibold text-white leading-relaxed">
                                  <span className="text-indigo-400 font-bold mr-2">Q{qIndex + 1}.</span>
                                  {q.questionText}
                                </h5>
                                {isSubmitted && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                  }`}>
                                    {isCorrect ? 'Correct' : 'Incorrect'}
                                  </span>
                                )}
                              </div>

                              {/* Options */}
                              <div className="space-y-2 mt-3">
                                {[
                                  { key: 'A', text: q.optionA },
                                  { key: 'B', text: q.optionB },
                                  { key: 'C', text: q.optionC },
                                  { key: 'D', text: q.optionD },
                                ].map((opt) => {
                                  const isChecked = selectedOption === opt.key || (isSubmitted && answersMap[q.id] === opt.key);
                                  const isCorrectOption = isSubmitted && q.correctOption === opt.key;

                                  let optClass = 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800';
                                  if (isSubmitted) {
                                    if (isCorrectOption) {
                                      optClass = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold';
                                    } else if (isChecked && !isCorrectOption) {
                                      optClass = 'bg-rose-500/20 border-rose-500/50 text-rose-200 line-through';
                                    }
                                  } else if (isChecked) {
                                    optClass = 'bg-indigo-600/30 border-indigo-500 text-white font-semibold';
                                  }

                                  return (
                                    <label
                                      key={opt.key}
                                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs transition-colors ${optClass}`}
                                    >
                                      <input
                                        type="radio"
                                        name={q.id}
                                        value={opt.key}
                                        disabled={isSubmitted}
                                        checked={isChecked}
                                        onChange={() => handleQuizAnswer(q.id, opt.key)}
                                        className="text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-700"
                                      />
                                      <span className="font-bold text-slate-400">{opt.key}.</span>
                                      <span className="flex-1">{opt.text}</span>
                                    </label>
                                  );
                                })}
                              </div>

                              {/* Explanation if submitted */}
                              {isSubmitted && q.explanation && (
                                <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                                  <strong className="text-amber-400 block mb-1">💡 Explanation:</strong>
                                  {q.explanation}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {!quizFeedback && (
                          <div className="pt-2 flex justify-end">
                            <button
                              type="submit"
                              disabled={quizSubmitting || Object.keys(quizAnswers).length === 0}
                              className="px-6 py-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                            >
                              {quizSubmitting ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Grading Answers...
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4 stroke-[3]" />
                                  Submit Quiz Attempt
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Assignments View */
            <div className="space-y-6 max-w-4xl">
              <div>
                <h3 className="text-lg font-bold text-white">Course Assignments & Benchmarks</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Upload verified files (PDF, DOCX, ZIP) for instructor evaluation and feedback.
                </p>
              </div>

              {assignments.length === 0 ? (
                <div className="p-12 text-center bg-slate-800/40 rounded-3xl border border-slate-800 text-xs text-slate-400">
                  No assignments created for this course yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assign) => (
                    <div
                      key={assign._id}
                      className="p-6 rounded-3xl bg-slate-800/40 border border-slate-800 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-bold text-white">{assign.title}</h4>
                          <p className="text-xs text-slate-400 mt-1">{assign.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                            <span>Max Marks: <strong className="text-slate-200">{assign.maxMarks}</strong></span>
                            <span>Due: <strong className="text-slate-200">{new Date(assign.dueDate).toLocaleDateString()}</strong></span>
                          </div>
                        </div>

                        {/* Submission status pill */}
                        {assign.mySubmission ? (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              assign.mySubmission.status === 'graded'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : assign.mySubmission.status === 'late'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                            }`}
                          >
                            {assign.mySubmission.status}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSubmittingAssignmentId(assign._id);
                              setSelectedFile(null);
                              setUploadMessage(null);
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors self-start shadow-md"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Submit Deliverable
                          </button>
                        )}
                      </div>

                      {/* Display Submission Details if already submitted */}
                      {assign.mySubmission && (
                        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                          <div className="flex items-center justify-between text-slate-300">
                            <span>
                              Submitted File: <a href={assign.mySubmission.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline font-semibold">{assign.mySubmission.fileName}</a>
                            </span>
                            <span className="text-slate-500">
                              {new Date(assign.mySubmission.submittedAt).toLocaleDateString()}
                            </span>
                          </div>

                          {assign.mySubmission.status === 'graded' ? (
                            <div className="pt-2 border-t border-slate-800 mt-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-emerald-400 text-sm">
                                  Grade: {assign.mySubmission.marks} / {assign.maxMarks} marks
                                </span>
                              </div>
                              {assign.mySubmission.feedback && (
                                <p className="text-slate-300 mt-1 italic">
                                  "{assign.mySubmission.feedback}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="pt-2 border-t border-slate-800 mt-2 text-slate-400 italic">
                              Submission received. Pending instructor grading.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Drawer: Course Syllabus */}
        <div className="w-full lg:w-96 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 overflow-y-auto">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Course Syllabus
            </h3>
          </div>

          <div className="divide-y divide-slate-800/80">
            {course.modules?.map((mod, mIdx) => (
              <div key={mod._id} className="text-xs">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(mod._id)}
                  className="w-full p-4 flex items-center justify-between bg-slate-900/60 hover:bg-slate-900 text-left transition-colors font-bold text-slate-200"
                >
                  <span className="line-clamp-1">
                    {mIdx + 1}. {mod.title}
                  </span>
                  {expandedModules[mod._id] ? (
                    <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
                  )}
                </button>

                {/* Module Lessons */}
                {expandedModules[mod._id] && (
                  <div className="divide-y divide-slate-800/40 bg-slate-950">
                    {mod.lessons?.map((lesson) => {
                      const isCompleted = progressData.completedLessonIds.includes(
                        lesson._id.toString()
                      );
                      const isCurrent = activeLesson?._id === lesson._id;

                      return (
                        <button
                          key={lesson._id}
                          onClick={() => {
                            setActiveLesson(lesson);
                            setActiveTab('lesson');
                          }}
                          className={`w-full p-3.5 pl-6 text-left flex items-start gap-3 transition-colors ${
                            isCurrent
                              ? 'bg-indigo-950/60 text-white border-l-2 border-indigo-500'
                              : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-xs line-clamp-1 leading-snug">
                              {lesson.title}
                            </p>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {lesson.duration || 10} min
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {/* Module Quizzes */}
                    {quizzes
                      .filter((q) => q.moduleId === (mod._id || mod.id))
                      .map((quiz) => {
                        const isPassed = quiz.latestAttempt?.passed === 1 || quiz.latestAttempt?.passed === true;
                        const isCurrentQuiz = activeTab === 'quizzes' && activeQuiz?.id === quiz.id;

                        return (
                          <button
                            key={quiz.id}
                            onClick={() => handleSelectQuiz(quiz)}
                            className={`w-full p-3.5 pl-6 text-left flex items-start gap-3 transition-colors ${
                              isCurrentQuiz
                                ? 'bg-indigo-950/60 text-white border-l-2 border-indigo-500'
                                : 'text-amber-300/90 hover:bg-slate-900/40 hover:text-amber-200'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              <HelpCircle className={`w-4 h-4 ${isPassed ? 'text-emerald-400' : 'text-amber-400'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <p className="font-semibold text-xs line-clamp-1 leading-snug">
                                  Quiz: {quiz.title}
                                </p>
                                {isPassed && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Passed
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                {quiz.questions?.length || 3} questions • Passing: {quiz.passingScore}%
                              </span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment Upload Modal */}
      {submittingAssignmentId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold">Submit Assignment File</h4>
              <button
                onClick={() => setSubmittingAssignmentId(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {uploadMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  uploadMessage.type === 'success'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                }`}
              >
                {uploadMessage.text}
              </div>
            )}

            <form onSubmit={handleAssignmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Deliverable File (PDF, DOCX, ZIP, PNG, JPG - max 15MB)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSubmittingAssignmentId(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload & Submit'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Completion Feedback & Rating Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 text-sm font-bold"
            >
              ✕
            </button>

            {feedbackSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <Check className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white">Thank You for Your Feedback!</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Your rating and comments have been shared directly with your instructor and published to the course page.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                    <Star className="w-6 h-6 fill-amber-400 stroke-amber-400" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white">
                    Rate Your Learning Experience
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Congratulations on completing <strong className="text-slate-200">{course.title}</strong>!
                    How would you rate this course? Your review directly impacts the instructor's studio ratings.
                  </p>
                </div>

                {/* Interactive Star Rating */}
                <div className="flex flex-col items-center justify-center gap-2 py-2">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= (hoverRating || feedbackRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-amber-400">
                    {feedbackRating === 5
                      ? '5.0 - Outstanding / Highly Recommended'
                      : feedbackRating === 4
                      ? '4.0 - Very Good'
                      : feedbackRating === 3
                      ? '3.0 - Good'
                      : feedbackRating === 2
                      ? '2.0 - Needs Improvement'
                      : '1.0 - Disappointing'}
                  </span>
                </div>

                {/* Feedback Comment */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Your Course Feedback & Review
                  </label>
                  <textarea
                    rows="4"
                    required
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Share what you learned, what you enjoyed most, or suggestions for the instructor..."
                    className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Skip for Now
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback || !feedbackComment.trim()}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                  >
                    {isSubmittingFeedback ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Feedback'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
