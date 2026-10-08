import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  Star,
  Clock,
  BookOpen,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Heart,
  CheckCircle2,
} from 'lucide-react';

function CourseCard({ course, isRecommended = false, isWishlisted = false, onToggleWishlist }) {
  const courseId = course.id || course._id;
  const skillsList = course.skills ? course.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const tagsList = course.tags ? course.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <Link
      to={`/courses/${course.slug || course._id || course.id}`}
      className="group bg-white rounded-2xl border border-slate-200/90 hover:border-slate-400 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between relative"
    >
      <div>
        {/* Thumbnail Container */}
        <div className="aspect-video relative overflow-hidden bg-slate-900">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Top Left Badges */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
            {course.isEnrolled && (
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500 text-white shadow-md flex items-center gap-1 tracking-wide animate-in fade-in">
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                ENROLLED
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-900 shadow-sm">
              {course.category}
            </span>
            {course.price === 0 ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white shadow-sm tracking-wide">
                100% FREE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white shadow-sm">
                PREMIUM
              </span>
            )}
            {isRecommended && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-400 text-slate-900 shadow-sm flex items-center gap-1 tracking-wide">
                <Sparkles className="w-2.5 h-2.5 fill-slate-900" />
                Recommended
              </span>
            )}
          </div>

          {/* Top Right Controls (Wishlist Button & Level) */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900/80 backdrop-blur-sm text-slate-200 border border-white/10">
              {course.level}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onToggleWishlist) onToggleWishlist(courseId);
              }}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className={`p-1.5 rounded-full backdrop-blur-md transition-transform active:scale-90 ${
                isWishlisted
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-black/40 text-white hover:bg-black/70 hover:scale-105'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-white stroke-white' : ''}`} />
            </button>
          </div>

          {/* Bottom Duration Badge on image */}
          <div className="absolute bottom-2 left-2.5 text-white/90 text-[11px] font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{course.duration || '6 hours'}</span>
          </div>

          {isRecommended && course.relevanceScore > 0 && (
            <div className="absolute bottom-2 right-2.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/75 text-amber-300 backdrop-blur-xs">
              Score: +{course.relevanceScore}
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-2.5">
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
            {course.title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {course.shortDescription || course.description}
          </p>

          {/* Skills and Tags badges */}
          {(skillsList.length > 0 || tagsList.length > 0) && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {skillsList.slice(0, 2).map((sk, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700">
                  {sk}
                </span>
              ))}
              {tagsList.slice(0, 1).map((tg, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                  #{tg}
                </span>
              ))}
            </div>
          )}

          {/* Instructor snippet */}
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
            <img
              src={course.instructor?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={course.instructor?.name}
              className="w-5 h-5 rounded-full object-cover border border-slate-200"
            />
            <span className="truncate max-w-[150px] font-medium text-slate-700">
              {course.instructor?.name || 'Academic Faculty'}
            </span>
          </div>

          {/* Rating and enrolled count */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
              <span className="text-slate-900">{course.rating?.average?.toFixed(1) || '5.0'}</span>
              <span className="text-slate-400 font-normal">({course.rating?.count || 42})</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {course.enrolledCount || 120}+ students
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold mt-1 bg-slate-50/50">
        <div className="flex items-center gap-1.5">
          <span className={`text-base font-extrabold ${course.price === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
            {course.price === 0 ? 'Free' : `$${course.price}`}
          </span>
          {course.price > 0 && (
            <span className="text-[11px] text-slate-400 line-through">
              ${(course.price * 1.8).toFixed(2)}
            </span>
          )}
        </div>
        {course.isEnrolled ? (
          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 group-hover:bg-emerald-100 transition-colors">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Enrolled • Learn →
          </span>
        ) : (
          <span className="text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs font-bold">
            View Curriculum →
          </span>
        )}
      </div>
    </Link>
  );
}

export default function CourseCatalog() {
  const { isAuthenticated, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recommendations state
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [recommendedInterests, setRecommendedInterests] = useState([]);
  const [hasProfileInterests, setHasProfileInterests] = useState(false);
  const [isRecommendedLoading, setIsRecommendedLoading] = useState(false);
  const [recommendedError, setRecommendedError] = useState(null);

  // Filters from URL
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'All';
  const level = searchParams.get('level') || 'All Levels';
  const priceType = searchParams.get('priceType') || 'All Prices';
  const durationFilter = searchParams.get('duration') || 'All Durations';
  const ratingFilter = searchParams.get('rating') || 'All Ratings';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(search);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // Fetch wishlist IDs when logged in
  const fetchWishlist = async () => {
    if (!isAuthenticated || !token) {
      setWishlistIds(new Set());
      return;
    }
    try {
      const res = await api.get('/wishlist/ids');
      if (res.data.success && Array.isArray(res.data.data)) {
        setWishlistIds(new Set(res.data.data));
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated, token]);

  const handleToggleWishlist = async (courseId) => {
    if (!isAuthenticated) {
      alert('Please log in to save courses to your wishlist.');
      return;
    }
    try {
      const res = await api.post(`/wishlist/toggle/${courseId}`);
      if (res.data.success) {
        setWishlistIds((prev) => {
          const next = new Set(prev);
          if (res.data.data?.wishlisted) {
            next.add(courseId);
          } else {
            next.delete(courseId);
          }
          return next;
        });
      }
    } catch (err) {
      console.error('Wishlist toggle error', err);
    }
  };

  // Fetch categories once
  useEffect(() => {
    api.get('/courses/meta/categories').then((res) => {
      if (res.data.success) {
        setCategories(['All', ...res.data.data.map((c) => c.name)]);
      }
    });
  }, []);

  // Fetch recommendations dynamically based on logged in student's profile
  const fetchRecommendations = async () => {
    if (!isAuthenticated || !token) {
      setHasProfileInterests(false);
      setRecommendedCourses([]);
      return;
    }

    setIsRecommendedLoading(true);
    setRecommendedError(null);

    try {
      const res = await api.get('/courses/recommended');
      if (res.data.success) {
        setHasProfileInterests(Boolean(res.data.data?.hasInterests));
        setRecommendedInterests(res.data.data?.interests || []);
        setRecommendedCourses(res.data.data?.courses || []);
      }
    } catch (err) {
      setRecommendedError('Unable to load personalized recommendations at this moment.');
    } finally {
      setIsRecommendedLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [isAuthenticated, token]);

  // Fetch courses on filter/page change
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (category && category !== 'All') queryParams.set('category', category);
        if (level && level !== 'All Levels') queryParams.set('level', level);
        if (sort) queryParams.set('sort', sort);
        queryParams.set('page', page);
        queryParams.set('limit', 12);

        const res = await api.get(`/courses?${queryParams.toString()}`);
        if (res.data.success) {
          setCourses(res.data.data);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        setError('Unable to load courses. Please check your network connection.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [search, category, level, sort, page]);

  const updateFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value && !value.startsWith('All')) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    nextParams.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilter('search', searchInput);
  };

  const displayedCourses = courses.filter((c) => {
    if (priceType === 'free' && c.price !== 0) return false;
    if (priceType === 'paid' && c.price === 0) return false;

    // Rating filter
    const avgRating = c.rating?.average || 5.0;
    if (ratingFilter === '4.5' && avgRating < 4.5) return false;
    if (ratingFilter === '4.0' && avgRating < 4.0) return false;
    if (ratingFilter === '3.5' && avgRating < 3.5) return false;

    // Duration filter
    const durHours = parseInt(c.duration) || 6;
    if (durationFilter === 'short' && durHours >= 3) return false;
    if (durationFilter === 'medium' && (durHours < 3 || durHours > 10)) return false;
    if (durationFilter === 'long' && durHours <= 10) return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
              <span>Verified Curricula</span>
              <span>•</span>
              <span>Industry-Grade Syllabus</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Explore Courses
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Explore technical masterclasses and science curricula taught by senior engineers and university faculty.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>All courses verified with project grading</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 mb-10 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
            >
              Search
            </button>
          </form>

          {/* Controls: Price, Level & Sorting */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Price Type */}
            <select
              value={priceType}
              onChange={(e) => updateFilter('priceType', e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-slate-50"
            >
              <option value="All Prices">All Prices</option>
              <option value="free">Free Courses (100% Free)</option>
              <option value="paid">Premium ($79.99)</option>
            </select>

            {/* Level */}
            <select
              value={level}
              onChange={(e) => updateFilter('level', e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-slate-50"
            >
              <option value="All Levels">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            {/* Duration */}
            <select
              value={durationFilter}
              onChange={(e) => updateFilter('duration', e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-slate-50"
            >
              <option value="All Durations">All Durations</option>
              <option value="short">&lt; 3 Hours</option>
              <option value="medium">3 - 10 Hours</option>
              <option value="long">&gt; 10 Hours</option>
            </select>

            {/* Rating */}
            <select
              value={ratingFilter}
              onChange={(e) => updateFilter('rating', e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-slate-50"
            >
              <option value="All Ratings">All Ratings</option>
              <option value="4.5">★ 4.5 & up</option>
              <option value="4.0">★ 4.0 & up</option>
              <option value="3.5">★ 3.5 & up</option>
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-slate-50"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="popular">Sort: Most Enrolled</option>
              <option value="rating">Sort: Highest Rated</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs border-t border-slate-100 pt-3">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] shrink-0 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5" /> Topic:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => updateFilter('category', cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Active Filter Indicators */}
        {(search || category !== 'All' || level !== 'All Levels' || priceType !== 'All Prices' || durationFilter !== 'All Durations' || ratingFilter !== 'All Ratings') && (
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs border-t border-slate-100">
            <span className="text-slate-400 text-[11px]">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                Keyword: "{search}"
                <button onClick={() => updateFilter('search', '')} className="hover:text-indigo-900 font-bold ml-1">×</button>
              </span>
            )}
            {category !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                Category: {category}
                <button onClick={() => updateFilter('category', 'All')} className="hover:text-indigo-900 font-bold ml-1">×</button>
              </span>
            )}
            {level !== 'All Levels' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                Level: {level}
                <button onClick={() => updateFilter('level', 'All Levels')} className="hover:text-indigo-900 font-bold ml-1">×</button>
              </span>
            )}
            {priceType !== 'All Prices' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                Pricing: {priceType === 'free' ? 'Free Courses' : 'Paid Courses'}
                <button onClick={() => updateFilter('priceType', 'All Prices')} className="hover:text-indigo-900 font-bold ml-1">×</button>
              </span>
            )}
            {durationFilter !== 'All Durations' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                Duration: {durationFilter === 'short' ? '< 3 Hours' : durationFilter === 'medium' ? '3 - 10 Hours' : '> 10 Hours'}
                <button onClick={() => updateFilter('duration', 'All Durations')} className="hover:text-indigo-900 font-bold ml-1">×</button>
              </span>
            )}
            {ratingFilter !== 'All Ratings' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                Rating: ★ {ratingFilter}+
                <button onClick={() => updateFilter('rating', 'All Ratings')} className="hover:text-indigo-900 font-bold ml-1">×</button>
              </span>
            )}
            <button
              onClick={() => setSearchParams({})}
              className="text-indigo-600 hover:text-indigo-800 font-semibold underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION: RECOMMENDED FOR YOU                                              */}
      {/* ========================================================================= */}
      <section className="mb-14">
        {/* Loading State */}
        {isRecommendedLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="h-6 w-56 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-96 rounded-2xl bg-white border border-slate-200 animate-pulse p-4 space-y-3">
                  <div className="w-full h-44 bg-slate-100 rounded-xl" />
                  <div className="w-1/3 h-4 bg-slate-100 rounded" />
                  <div className="w-3/4 h-5 bg-slate-100 rounded" />
                  <div className="w-1/2 h-4 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : recommendedError ? (
          <div className="p-6 rounded-2xl bg-white border border-rose-200 flex items-center justify-between">
            <p className="text-xs font-semibold text-rose-600">{recommendedError}</p>
            <button
              onClick={fetchRecommendations}
              className="px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
            >
              Retry Recommendations
            </button>
          </div>
        ) : !isAuthenticated || !hasProfileInterests ? (
          /* Empty state: Student has no interests/profile data */
          <div className="bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-slate-50 rounded-2xl border border-indigo-100 p-6 sm:p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Complete your profile to receive personalized course recommendations.
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
              Select your course interests, technical skills, and current degree in your student profile to automatically discover tailored masterclasses.
            </p>
            <div className="mt-4">
              <Link
                to={isAuthenticated ? "/profile" : "/login"}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
              >
                Complete Profile
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : recommendedCourses.length > 0 ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Recommended for You
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Courses based on your interests
                  {recommendedInterests.length > 0 && (
                    <span className="font-semibold text-slate-700 ml-1">
                      ({recommendedInterests.join(', ')})
                    </span>
                  )}
                </p>
              </div>

              <Link
                to="/profile"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-1"
              >
                Update Interests
              </Link>
            </div>

            {/* Top 6-8 relevant courses */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendedCourses.map((course) => (
                <CourseCard
                  key={course._id || course.id}
                  course={course}
                  isRecommended={true}
                  isWishlisted={wishlistIds.has(course._id || course.id)}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6 text-center">
            <Sparkles className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-800">
              No new recommendations available
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              You've either completed all courses matching your interests or no matching curricula were found.
            </p>
            <Link to="/profile" className="inline-block mt-2.5 text-xs font-semibold text-indigo-600 underline">
              Add more interests
            </Link>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION: ALL COURSES                                                      */}
      {/* ========================================================================= */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            All Courses
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Explore complete catalog with interactive filters and search
          </p>
        </div>
      </div>

      {/* Course Grid / Loading / Error / Empty States */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-96 rounded-2xl bg-white border border-slate-200 animate-pulse p-4 space-y-3"
            >
              <div className="w-full h-44 bg-slate-100 rounded-xl" />
              <div className="w-1/3 h-4 bg-slate-100 rounded" />
              <div className="w-3/4 h-5 bg-slate-100 rounded" />
              <div className="w-1/2 h-4 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-rose-200 max-w-lg mx-auto">
          <p className="text-rose-600 font-semibold mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      ) : displayedCourses.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No matching curricula found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
            We couldn't find any courses matching your specific filters. Try expanding your search criteria or resetting filters.
          </p>
          <button
            onClick={() => setSearchParams({})}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedCourses.map((course) => (
              <CourseCard
                key={course._id || course.id}
                course={course}
                isRecommended={false}
                isWishlisted={wishlistIds.has(course._id || course.id)}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-3">
              <button
                disabled={pagination.page <= 1}
                onClick={() => updateFilter('page', pagination.page - 1)}
                className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-medium text-slate-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => updateFilter('page', pagination.page + 1)}
                className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
