import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Search,
  ArrowRight,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  Star,
  ShieldCheck,
  Award,
  Cpu,
  Globe,
  Database,
  Cloud,
  Lock,
  Palette,
  Terminal,
  FileCheck,
  Check,
} from 'lucide-react';

export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [heroSearch, setHeroSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [coursesRes, catRes] = await Promise.all([
          api.get('/courses?limit=6&sort=popular'),
          api.get('/courses/meta/categories'),
        ]);

        if (coursesRes.data.success) {
          setFeaturedCourses(coursesRes.data.data);
        }
        if (catRes.data.success) {
          setCategories(catRes.data.data);
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/courses?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/courses');
    }
  };

  const categoryIcons = {
    'Artificial Intelligence': <Cpu className="w-5 h-5 text-indigo-600" />,
    'Web Development': <Globe className="w-5 h-5 text-blue-600" />,
    'Data Science': <Database className="w-5 h-5 text-emerald-600" />,
    'Cloud Computing': <Cloud className="w-5 h-5 text-sky-600" />,
    'Cybersecurity': <Lock className="w-5 h-5 text-rose-600" />,
    'Programming': <Terminal className="w-5 h-5 text-purple-600" />,
    'Design': <Palette className="w-5 h-5 text-amber-600" />,
  };

  return (
    <div className="space-y-16 lg:space-y-24 pb-24">
      {/* Editorial Authority Hero */}
      <section className="bg-slate-900 text-white relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28 relative z-10">
          <div className="max-w-3xl">
            {/* Accreditation Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Verified Technical Education & Applied Sciences
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Master Modern Engineering & Applied Computing.
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Learn through rigorous, hands-on curricula taught by recognized staff engineers and university researchers. Complete real project deliverables, receive expert evaluation, and earn verifiable certificates.
            </p>

            {/* Direct Search Bar */}
            <form onSubmit={handleHeroSearch} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by topic, technology (e.g. Python, AWS, React, Security)..."
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <span>Find Courses</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Popular Search Quick Tags */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">Popular:</span>
              {['Python', 'Machine Learning', 'AWS Architecture', 'Web Security', 'React'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => navigate(`/courses?search=${encodeURIComponent(tag)}`)}
                  className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700/60 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Global Platform Metrics Bar */}
        <div className="border-t border-slate-800 bg-slate-950/70 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="space-y-0.5">
              <p className="text-xl sm:text-2xl font-black text-white">8 Verified</p>
              <p className="text-xs text-slate-400 font-medium">Comprehensive Curricula</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xl sm:text-2xl font-black text-white">100% Practical</p>
              <p className="text-xs text-slate-400 font-medium">Hands-On Code Benchmarks</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xl sm:text-2xl font-black text-white">12,400+</p>
              <p className="text-xs text-slate-400 font-medium">Graduates & Students</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xl sm:text-2xl font-black text-white">4.9 / 5.0</p>
              <p className="text-xs text-slate-400 font-medium">Average Verified Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Explore Our Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Featured Programs & Certification Tracks
            </h2>
          </div>
          <Link
            to="/courses"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors group"
          >
            Browse all 8 courses
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-96 rounded-2xl bg-white border border-slate-200 animate-pulse p-4"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <Link
                key={course._id}
                to={`/courses/${course.slug || course._id}`}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-video relative overflow-hidden bg-slate-100">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/95 text-slate-800 shadow-xs">
                        {course.category}
                      </span>
                      {course.price === 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs tracking-wider">
                          FREE
                        </span>
                      )}
                    </div>
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900/80 backdrop-blur-sm text-white">
                      {course.level}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {course.shortDescription || course.description}
                    </p>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                      <img
                        src={course.instructor?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={course.instructor?.name}
                        className="w-5 h-5 rounded-full object-cover border border-slate-200"
                      />
                      <span className="text-xs text-slate-600 font-medium truncate max-w-[140px]">
                        {course.instructor?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1 text-amber-500 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                        <span>{course.rating?.average?.toFixed(1) || '4.9'}</span>
                        <span className="text-slate-400 font-normal">({course.rating?.count || 120})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{course.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-extrabold ${course.price === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {course.price === 0 ? 'Free' : `$${course.price}`}
                    </span>
                    {course.price === 0 ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Full Access
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">
                        Tuition
                      </span>
                    )}
                  </div>
                  <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">
                    View Syllabus →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* How Learning Works / Educational Methodology */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100/70 border border-slate-200/80 rounded-3xl p-8 sm:p-12">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Pedagogical Standards
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              How You Learn & Prove Competency
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Every course is engineered around concrete, demonstrable software skills rather than multiple-choice trivia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900">Modular Video Lectures</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Step-by-step technical lessons with downloadable resources and structured syllabus documentation.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900">Applied Project Labs</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Submit production code, architecture diagrams, and security audits evaluated by your instructor.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900">Instructor Evaluation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive detailed grading feedback and scores directly in your student studio from domain specialists.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h3 className="text-sm font-bold text-slate-900">Verified Certificate</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Graduate with verifiable credentials upon 100% course completion to showcase on portfolios.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Explore by Discipline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
            Disciplines
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Browse Curricula by Discipline
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Explore focused programs designed to take you from foundational principles to production engineering.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`/courses?category=${encodeURIComponent(cat.name)}`}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex items-center gap-3.5 group"
            >
              <div className="p-2.5 rounded-xl bg-slate-50 group-hover:bg-indigo-50 transition-colors shrink-0">
                {categoryIcons[cat.name] || <BookOpen className="w-5 h-5 text-indigo-600" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {cat.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{cat.count} curricula</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom Conversion Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Advance Your Technical Career?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Enroll today in our open-access free foundational tracks or comprehensive certification masterclasses.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/courses"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-600/30"
            >
              Explore All Courses
            </Link>
            <Link
              to="/courses?priceType=free"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
            >
              Browse Free Tracks
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
