import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Star,
  Clock,
  BookOpen,
  Award,
  CheckCircle,
  PlayCircle,
  Lock,
  Globe,
  Users,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Check,
  Zap,
  Heart,
  HelpCircle,
} from 'lucide-react';

function getEmbedVideoUrl(url) {
  if (!url) return null;
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|v\/|embed\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return null;
}

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, role } = useAuth();

  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState(null);

  // Payment Checkout Modal states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);

  // Review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Preview lesson modal
  const [activePreviewLesson, setActivePreviewLesson] = useState(null);

  // Collapsible modules state
  const [expandedModules, setExpandedModules] = useState({});
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [courseQuizzes, setCourseQuizzes] = useState([]);

  // Default expand first module when course loads
  useEffect(() => {
    if (course?.modules?.length > 0) {
      setExpandedModules({ [course.modules[0]._id]: true });
    }
  }, [course]);

  useEffect(() => {
    const loadCourse = async () => {
      setIsLoading(true);
      try {
        const [courseRes, reviewRes, quizRes, wishlistRes] = await Promise.all([
          api.get(`/courses/${id}`),
          api.get(`/reviews/course/${id}`).catch(() => ({ data: { data: [] } })),
          api.get(`/quizzes/course/${id}`).catch(() => ({ data: { data: [] } })),
          isAuthenticated ? api.get('/wishlist/ids').catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
        ]);

        if (courseRes.data.success) {
          const cData = courseRes.data.data;
          setCourse(cData);
          const cId = cData.id || cData._id;

          if (wishlistRes.data?.data && Array.isArray(wishlistRes.data.data)) {
            setIsWishlisted(wishlistRes.data.data.includes(cId));
          }
          if (quizRes.data?.data) {
            setCourseQuizzes(quizRes.data.data);
          }

          if (reviewRes.data?.data?.length > 0) {
            setReviews(reviewRes.data.data);
          } else if (cData.id || cData._id) {
            const actualId = cData.id || cData._id;
            const rRes = await api.get(`/reviews/course/${actualId}`).catch(() => null);
            if (rRes?.data?.data) {
              setReviews(rRes.data.data);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load course details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [id, isAuthenticated]);

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      alert('Please log in to save this course to your wishlist.');
      return;
    }
    const targetId = course?._id || course?.id || id;
    try {
      const res = await api.post(`/wishlist/toggle/${targetId}`);
      if (res.data.success) {
        setIsWishlisted(res.data.data?.wishlisted);
      }
    } catch (e) {
      console.error('Wishlist toggle error', e);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    if (role !== 'student' && role !== 'admin') {
      setEnrollError('Instructors cannot enroll as students.');
      return;
    }

    // If premium course, open secure payment checkout modal!
    if (course.price > 0) {
      setCheckoutSuccess(null);
      setCheckoutError(null);
      setCardName(user?.name || '');
      setShowCheckoutModal(true);
      return;
    }

    // Free course ($0.00) -> Direct Enrollment
    setIsEnrolling(true);
    setEnrollError(null);
    try {
      const res = await api.post('/enrollments', { courseId: course._id || course.id });
      if (res.data.success) {
        setCourse((prev) => ({
          ...prev,
          isEnrolled: true,
          enrolledCount: (prev.enrolledCount || 0) + 1,
        }));
        navigate(`/student/courses/${course._id || course.id}/learn`);
      }
    } catch (err) {
      setEnrollError(err.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setIsEnrolling(false);
    }
  };

  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('888');
    setCardName(user?.name || 'Alex Johnson');
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    setCheckoutError(null);
    try {
      const res = await api.post('/payments/checkout', {
        courseId: course._id || course.id || id,
        paymentMethod,
        cardNumber,
        cardExpiry,
        cardCvc,
        nameOnCard: cardName || user?.name || 'Student',
      });

      if (res.data.success) {
        setCheckoutSuccess(res.data.data);
        setCourse((prev) => ({
          ...prev,
          isEnrolled: true,
          enrolledCount: (prev.enrolledCount || 0) + 1,
        }));
      }
    } catch (err) {
      setCheckoutError(err.response?.data?.message || 'Payment processing failed. Please verify details and try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const targetId = course._id || course.id || id;
      const res = await api.post('/reviews', {
        courseId: targetId,
        rating,
        comment,
      });

      if (res.data.success) {
        setReviews([
          {
            ...res.data.data,
            student: { name: user.name, profileImage: user.profileImage },
          },
          ...reviews.filter(r => (r.studentId || r.student?.id) !== user.id),
        ]);
        setComment('');
        // Refresh course rating
        const refreshed = await api.get(`/courses/${id}`).catch(() => null);
        if (refreshed?.data?.success) {
          setCourse(refreshed.data.data);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading course syllabus...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Course Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          The requested course could not be located or may have been unlisted.
        </p>
        <Link
          to="/courses"
          className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Back to Courses
        </Link>
      </div>
    );
  }

  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;

  // Toggle single module accordion
  const toggleModule = (modId) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  // Toggle all modules
  const toggleAllModules = () => {
    const allExpanded = course.modules?.every((m) => expandedModules[m._id]);
    const nextState = {};
    course.modules?.forEach((m) => {
      nextState[m._id] = !allExpanded;
    });
    setExpandedModules(nextState);
  };

  // Normalize skills list into an array whether string or array
  const skillsList = course?.skills
    ? Array.isArray(course.skills)
      ? course.skills
      : course.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  // Derived learning objectives
  const learningOutcomes = skillsList.length > 0
    ? skillsList.map((s) => `Master core foundations and production patterns for ${s}`)
    : [
        'Build production-ready architectures from scratch with real code',
        'Implement robust data models, transaction safety, and persistent storage',
        'Design testable components following industry standard design patterns',
        'Deploy and monitor modern applications with automated CI/CD practices',
      ];

  return (
    <div className="pb-24 bg-slate-50/50">
      {/* Course Header Banner */}
      <section className="bg-slate-950 text-white pt-10 pb-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-6 flex-wrap">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="text-slate-600">/</span>
            <Link to="/courses" className="hover:text-white transition-colors">Courses</Link>
            <span className="text-slate-600">/</span>
            <Link to={`/courses?category=${course.category}`} className="text-indigo-400 hover:text-indigo-300 font-medium">
              {course.category}
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 truncate max-w-xs">{course.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Left 2 Cols: Main Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-md font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {course.category}
                </span>
                <span className="px-2.5 py-1 rounded-md font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  {course.level}
                </span>
                <span className="px-2.5 py-1 rounded-md font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Accredited Syllabus
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
                {course.title}
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                {course.shortDescription || course.description}
              </p>

              {/* Meta stats bar */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                  <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                  <span className="text-sm">{course.rating?.average?.toFixed(1) || '5.0'}</span>
                  <span className="text-slate-400 font-normal">
                    ({course.rating?.count || reviews.length || 42} ratings)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-300">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{course.enrolledCount || 120} learners enrolled</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{course.duration || '8 hours total'}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-300">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span>{course.language || 'English [CC]'}</span>
                </div>
              </div>

              {/* Instructor snippet */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80">
                <img
                  src={course.instructor?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={course.instructor?.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/40"
                />
                <div>
                  <p className="text-xs text-slate-400">Curriculum Director & Instructor</p>
                  <p className="text-sm font-semibold text-white">{course.instructor?.name || 'Faculty Instructor'}</p>
                </div>
              </div>
            </div>

            {/* Right Col: Sticky Enrollment Card */}
            <div className="lg:col-span-1">
              <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200/90 space-y-6">
                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-950 relative group">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/95 text-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <PlayCircle className="w-6 h-6 ml-0.5 fill-indigo-600 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-2.5 left-3 text-white text-[11px] font-semibold bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-sm">
                    Course Overview Video
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-extrabold ${course.price === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </span>
                      {course.price > 0 && (
                        <span className="text-sm text-slate-400 line-through font-medium">
                          ${(course.price * 1.8).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      {course.price === 0 ? '100% Free Full Access' : 'Lifetime Full Access'}
                    </span>
                  </div>
                  {course.price > 0 && (
                    <p className="text-[11px] text-rose-600 font-bold">
                      Limited-time academic pricing (45% off)
                    </p>
                  )}
                </div>

                {enrollError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-100">
                    {enrollError}
                  </div>
                )}

                {course.isEnrolled ? (
                  <Link
                    to={`/student/courses/${course._id || course.id}/learn`}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center block shadow-lg shadow-emerald-200 transition-all text-sm"
                  >
                    Continue Learning →
                  </Link>
                ) : (
                  <div className="space-y-2.5">
                    <button
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                      className={`w-full py-3.5 rounded-xl ${
                        course.price === 0
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                          : 'bg-slate-900 hover:bg-slate-800 shadow-slate-300'
                      } text-white font-bold text-center flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 text-sm`}
                    >
                      {isEnrolling ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enrolling...
                        </>
                      ) : course.price === 0 ? (
                        'Enroll for Free'
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Proceed to Payment (${course.price})</span>
                        </>
                      )}
                    </button>
                    {course.price > 0 && (
                      <p className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>30-Day Money-Back Guarantee • Instant Activation</span>
                      </p>
                    )}
                    {/* Wishlist Toggle Button */}
                    <button
                      type="button"
                      onClick={handleToggleWishlist}
                      className={`w-full py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                        isWishlisted
                          ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current text-rose-500' : ''}`} />
                      <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
                    </button>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <p className="font-bold text-slate-900 text-xs uppercase tracking-wider">This curriculum includes:</p>
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{totalLessons} lessons with video, code & notes</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{courseQuizzes.length || 1} graded mastery quizzes & checkpoints</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{course.assignmentCount || 2} graded project assignments</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Accredited certificate upon 100% completion</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Full lifetime access across desktop & mobile</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          {/* What you'll learn checklist box */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              What you will learn in this course
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {learningOutcomes.map((outcome, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-slate-700 leading-snug">{outcome}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Detailed Course Description */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              About this course & syllabus scope
            </h2>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line space-y-3">
              {course.description}
            </div>

            {/* Skills Pills */}
            {skillsList.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Target Competencies & Tooling
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Course Syllabus / Curriculum Accordion */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Curriculum & Lecture Syllabus
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {course.modules?.length || 0} modules • {totalLessons} lessons • {course.duration || '8 hours total'}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleAllModules}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors self-start sm:self-auto"
              >
                Expand / Collapse all modules
              </button>
            </div>

            <div className="space-y-3">
              {course.modules && course.modules.length > 0 ? (
                course.modules.map((mod, idx) => {
                  const modId = mod._id || mod.id || `mod-${idx}`;
                  const isExpanded = !!expandedModules[modId];
                  const modDuration = mod.lessons?.reduce((acc, l) => acc + (l.duration || 10), 0) || 0;

                  return (
                    <div
                      key={modId}
                      className="rounded-xl border border-slate-200/90 overflow-hidden bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => toggleModule(modId)}
                        className="w-full bg-slate-50/80 hover:bg-slate-100/80 p-4 border-b border-slate-200/80 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="pr-4">
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span className="text-indigo-600 font-extrabold">Module {idx + 1}:</span> {mod.title}
                          </h4>
                          {mod.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-3">
                          <span className="text-xs text-slate-500 font-medium">
                            {mod.lessons?.length || 0} lectures • {modDuration}m
                          </span>
                          <span className="text-slate-400 font-bold text-xs">
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="divide-y divide-slate-100 bg-white">
                          {mod.lessons?.map((lesson, lIdx) => {
                            const lessonId = lesson._id || lesson.id || `les-${lIdx}`;
                            return (
                              <div
                                key={lessonId}
                                className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {lesson.isPreview ? (
                                    <button
                                      type="button"
                                      onClick={() => setActivePreviewLesson(lesson)}
                                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2 group text-left"
                                    >
                                      <PlayCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                                      <span className="text-xs font-semibold group-hover:underline text-slate-800">
                                        {lesson.title}
                                      </span>
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-2 text-slate-400">
                                      <Lock className="w-3.5 h-3.5 shrink-0" />
                                      <span className="text-xs font-medium text-slate-600">
                                        {lesson.title}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2.5 text-xs">
                                  {lesson.isPreview && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                                      Free Preview
                                    </span>
                                  )}
                                  <span className="text-slate-400 font-medium">{lesson.duration || 10} min</span>
                                </div>
                              </div>
                            );
                          })}
                          {courseQuizzes
                            ?.filter((q) => q.moduleId === modId || (!q.moduleId && idx === (course.modules?.length || 1) - 1))
                            .map((quiz) => (
                              <div
                                key={quiz.id}
                                className="p-3.5 px-4 flex items-center justify-between bg-violet-50/40 hover:bg-violet-50/70 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <HelpCircle className="w-4 h-4 text-violet-600 shrink-0" />
                                  <div>
                                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                      {quiz.title}
                                      <span className="text-[10px] uppercase font-bold text-violet-600 bg-violet-100/80 px-1.5 py-0.5 rounded">
                                        Quiz
                                      </span>
                                    </span>
                                    {quiz.description && (
                                      <p className="text-[11px] text-slate-500 line-clamp-1">{quiz.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs">
                                  <span className="text-slate-400 font-medium">
                                    {quiz.questions?.length || 5} questions • {quiz.passingScore || 70}% to pass
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Course Syllabus Being Prepared</p>
                  <p className="text-xs text-slate-400">
                    Modules, video lectures, and assessments are currently being finalized by the instructor.
                  </p>
                </div>
              )}
            </div>
          </section>
          {/* Student Reviews & Ratings */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Student Feedback & Verified Reviews
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real feedback and course evaluations submitted by enrolled learners upon curriculum milestones
                </p>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/60 px-3.5 py-1.5 rounded-xl self-start sm:self-auto shadow-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-extrabold text-slate-900">
                  {course.rating?.average?.toFixed(1) || (reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : '5.0')}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>

            {/* Rating breakdown summary bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 items-center">
              <div className="text-center md:border-r md:border-slate-200 pr-4">
                <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {course.rating?.average?.toFixed(1) || '5.0'}
                </p>
                <div className="flex items-center justify-center gap-1 my-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-500 font-medium">Course Rating</p>
              </div>

              <div className="md:col-span-2 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-3">
                  <span className="w-12 font-medium">5 stars</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '88%' }} />
                  </div>
                  <span className="w-8 text-right font-semibold">88%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-12 font-medium">4 stars</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '10%' }} />
                  </div>
                  <span className="w-8 text-right font-semibold">10%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-12 font-medium">3 stars</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '2%' }} />
                  </div>
                  <span className="w-8 text-right font-semibold">2%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-12 font-medium">2 stars</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-300 rounded-full" style={{ width: '0%' }} />
                  </div>
                  <span className="w-8 text-right font-semibold">0%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-12 font-medium">1 star</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-300 rounded-full" style={{ width: '0%' }} />
                  </div>
                  <span className="w-8 text-right font-semibold">0%</span>
                </div>
              </div>
            </div>

            {/* Review Submission for Enrolled Students */}
            {course.isEnrolled && (
              <form
                onSubmit={handleReviewSubmit}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Submit Your Course Evaluation
                  </h4>
                  <span className="text-[11px] text-slate-400">Published to course page & instructor dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-700 ml-1">{rating} out of 5</span>
                </div>

                <textarea
                  rows="3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details of your experience: lecture clarity, code labs, project assignments..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  required
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmittingReview ? 'Submitting...' : 'Post Evaluation'}
                  </button>
                </div>
              </form>
            )}

            {/* Reviews List */}
            <div className="space-y-4 divide-y divide-slate-100">
              {reviews.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 italic">No student reviews submitted yet. Be the first to complete the course and share feedback!</p>
              ) : (
                reviews.map((r, i) => (
                  <div key={i} className="pt-4 first:pt-0 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={r.student?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={r.student?.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{r.student?.name || 'Verified Student'}</span>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                              Verified Student
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent enrollment'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s < r.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                      "{r.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column supplementary info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Instructor Profile
            </h3>
            <div className="flex items-center gap-3">
              <img
                src={course.instructor?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={course.instructor?.name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900">{course.instructor?.name || 'Faculty Member'}</h4>
                <p className="text-xs text-indigo-600 font-semibold">Senior Systems Architect & Educator</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 pb-1 text-center text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="block font-extrabold text-slate-900 text-sm">4.9 ★</span>
                <span className="text-[11px] text-slate-500">Instructor Rating</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="block font-extrabold text-slate-900 text-sm">12,400+</span>
                <span className="text-[11px] text-slate-500">Total Learners</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {course.instructor?.bio || 'Distinguished computer science practitioner and educator specializing in high-performance backends and real-world system architecture.'}
            </p>
          </div>
        </div>
      </div>

      {/* Free Lesson Preview Modal */}
      {activePreviewLesson && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-sm font-bold flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-indigo-400" />
                Lesson Preview: {activePreviewLesson.title}
              </span>
              <button
                onClick={() => setActivePreviewLesson(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video bg-black">
              {getEmbedVideoUrl(activePreviewLesson.videoUrl) ? (
                <iframe
                  src={getEmbedVideoUrl(activePreviewLesson.videoUrl)}
                  title={activePreviewLesson.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activePreviewLesson.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              )}
            </div>
            <div className="p-5 space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                {activePreviewLesson.content || activePreviewLesson.description}
              </p>
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setActivePreviewLesson(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secure Payment Checkout Modal for Premium Courses */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Secure Course Checkout
                    <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> 256-Bit SSL
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Complete payment to activate full enrollment</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                  setCheckoutSuccess(null);
                  setCheckoutError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            {checkoutSuccess ? (
              /* Payment Successful Receipt View */
              <div className="p-8 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-4 border-emerald-50 shadow-inner">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-slate-900">Payment Confirmed!</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Your transaction has been processed and your enrollment is officially activated.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Receipt / Txn ID:</span>
                    <strong className="font-mono text-slate-800">{checkoutSuccess.transactionId}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Course:</span>
                    <strong className="text-slate-800 truncate max-w-[220px]">{course.title}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Amount Paid:</span>
                    <strong className="text-emerald-600 font-bold text-sm">${course.price} USD</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-200">
                    <span>Access Granted:</span>
                    <span className="font-bold text-slate-800">Lifetime Full Access + Certificate</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <Link
                    to={`/student/courses/${course._id || course.id}/learn`}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-200 transition-all text-center"
                  >
                    Start Learning Now →
                  </Link>
                </div>
              </div>
            ) : (
              /* Payment Form View */
              <form onSubmit={handleCheckoutSubmit} className="p-6 sm:p-7 space-y-5">
                {/* Order Summary Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{course.title}</h4>
                      <p className="text-[11px] text-slate-500">Instructor: {course.instructor?.name}</p>
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        {course.level} • {course.duration}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400 block line-through">$129.99</span>
                    <span className="text-xl font-extrabold text-slate-900">${course.price}</span>
                  </div>
                </div>

                {checkoutError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                    {checkoutError}
                  </div>
                )}

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Select Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('credit_card')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === 'credit_card'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Card (Visa/MC)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === 'upi'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>UPI / GPay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paypal')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === 'paypal'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      <span>PayPal</span>
                    </button>
                  </div>
                </div>

                {/* Card Fields */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Card Information</label>
                    <button
                      type="button"
                      onClick={fillTestCard}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                      title="Quick auto-fill demo card numbers"
                    >
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                      Auto-Fill Demo Card
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Card number (e.g. 4242 4242 4242 4242)"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="CVC / CVV"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Name on card"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Submit Payment Button */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing Secure Payment...
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Pay ${course.price} & Complete Enrollment
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>30-Day Money-Back Guarantee • Verifiable Certificate</span>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
