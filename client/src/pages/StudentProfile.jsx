import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Award,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Edit3,
  Building,
  Target,
  Code,
  Compass,
  Check,
  Plus,
  X,
  ExternalLink,
  Printer,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
  Star,
} from 'lucide-react';

const DEGREE_OPTIONS = [
  'B.Tech',
  'B.E.',
  'B.Sc',
  'M.Sc',
  'MCA',
  'MBA',
  'Other',
];

const SPECIALIZATION_OPTIONS = [
  'Artificial Intelligence & Data Science',
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Other',
];

const INTEREST_OPTIONS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'Generative AI',
  'Web Development',
  'Java',
  'Python',
  'Cybersecurity',
  'Cloud Computing',
  'Database Systems',
  'App Development',
];

const GOAL_OPTIONS = [
  'Build my technical skills',
  'Prepare for placements',
  'Earn certifications',
  'Learn for projects',
  'Prepare for higher studies',
  'Explore a new field',
];

export default function StudentProfile() {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeCertModal, setActiveCertModal] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State for Onboarding / Edit
  const [degree, setDegree] = useState('B.Tech');
  const [customDegree, setCustomDegree] = useState('');
  const [specialization, setSpecialization] = useState('Artificial Intelligence & Data Science');
  const [customSpecialization, setCustomSpecialization] = useState('');
  const [institution, setInstitution] = useState('Kalaignar Karunanidhi Institute of Technology');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [customInterest, setCustomInterest] = useState('');
  const [skillsList, setSkillsList] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [customGoal, setCustomGoal] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch complete profile from backend
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch('/api/profile/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setProfileData(data.data);
        const u = data.data.user || {};

        // Populate form fields
        if (u.degree) {
          if (DEGREE_OPTIONS.includes(u.degree)) {
            setDegree(u.degree);
          } else {
            setDegree('Other');
            setCustomDegree(u.degree);
          }
        }
        if (u.specialization) {
          if (SPECIALIZATION_OPTIONS.includes(u.specialization)) {
            setSpecialization(u.specialization);
          } else {
            setSpecialization('Other');
            setCustomSpecialization(u.specialization);
          }
        }
        if (u.institution) {
          setInstitution(u.institution);
        }
        if (u.profileImage) {
          setProfileImage(u.profileImage);
        }

        // Interests
        if (u.courseInterests) {
          const interestsArr = u.courseInterests.split(',').map((s) => s.trim()).filter(Boolean);
          setSelectedInterests(interestsArr);
        } else {
          setSelectedInterests(['Artificial Intelligence', 'Machine Learning', 'Data Science']);
        }

        // Skills
        if (u.skills) {
          const skillsArr = u.skills.split(',').map((s) => s.trim()).filter(Boolean);
          setSkillsList(skillsArr);
        } else {
          setSkillsList(['Python', 'Java', 'SQL']);
        }

        // Goals
        if (u.learningGoals) {
          const goalsArr = u.learningGoals.split(',').map((s) => s.trim()).filter(Boolean);
          setSelectedGoals(goalsArr);
        } else {
          setSelectedGoals(['Build my technical skills', 'Prepare for placements', 'Earn certifications']);
        }

        // If user profile is not completed, auto open onboarding modal
        if (!u.profileCompleted) {
          setShowEditModal(true);
        }
      } else {
        setErrorMsg(data.message || 'Failed to load learner profile');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to profile server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  // Skill management
  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (trimmed && !skillsList.includes(trimmed)) {
      setSkillsList([...skillsList, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setSkillsList(skillsList.filter((s) => s !== skill));
  };

  // Interest toggle
  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleAddCustomInterest = (e) => {
    e.preventDefault();
    const trimmed = customInterest.trim();
    if (trimmed && !selectedInterests.includes(trimmed)) {
      setSelectedInterests([...selectedInterests, trimmed]);
      setCustomInterest('');
    }
  };

  // Goal toggle
  const toggleGoal = (goal) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleAddCustomGoal = (e) => {
    e.preventDefault();
    const trimmed = customGoal.trim();
    if (trimmed && !selectedGoals.includes(trimmed)) {
      setSelectedGoals([...selectedGoals, trimmed]);
      setCustomGoal('');
    }
  };

  // Save / Onboard submission
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSaveSuccessMsg('');
    setErrorMsg('');

    const finalDegree = degree === 'Other' && customDegree.trim() ? customDegree.trim() : degree;
    const finalSpec = specialization === 'Other' && customSpecialization.trim() ? customSpecialization.trim() : specialization;

    const payload = {
      degree: finalDegree,
      specialization: finalSpec,
      institution: institution.trim() || 'Kalaignar Karunanidhi Institute of Technology',
      skills: skillsList,
      courseInterests: selectedInterests,
      learningGoals: selectedGoals,
      profileImage: profileImage.trim() || undefined,
    };

    try {
      const endpoint = profileData?.user?.profileCompleted ? '/api/profile' : '/api/profile/onboarding';
      const method = profileData?.user?.profileCompleted ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSaveSuccessMsg('Profile completed successfully!');
        if (updateUser) {
          updateUser(json.data);
        }
        setShowEditModal(false);
        // Refresh profile data to get updated recommendations
        await fetchProfile();
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } else {
        setErrorMsg(json.message || 'Error saving profile.');
      }
    } catch (err) {
      setErrorMsg('Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentUser = profileData?.user || user;
  const enrolledCourses = profileData?.enrolledCourses || [];
  const certificates = profileData?.certificates || [];
  const recommendedCourses = profileData?.recommendedCourses || [];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Success / Alert Banner */}
        {saveSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SECTION 6: STUDENT PROFILE IDENTITY HEADER */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-50/60 to-purple-50/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            {/* Profile Photo */}
            <div className="relative group shrink-0">
              <img
                src={
                  currentUser?.profileImage ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                }
                alt={currentUser?.name || 'Maya P'}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white shadow-md ring-1 ring-slate-200"
              />
              <button
                onClick={() => setShowEditModal(true)}
                title="Change Photo"
                className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-transform transform hover:scale-105"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Details */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {currentUser?.name || 'Maya P'}
                  </h1>
                  <p className="text-sm font-semibold text-indigo-600 mt-0.5">
                    {currentUser?.specialization
                      ? `${currentUser.specialization} Student`
                      : 'AI & Data Science Student'}
                  </p>
                </div>

                <button
                  onClick={() => setShowEditModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {currentUser?.profileCompleted ? 'Edit Profile' : 'Complete Profile'}
                </button>
              </div>

              {/* Education Subtitle */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 font-medium text-slate-700">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  {currentUser?.degree || 'B.Tech'} — {currentUser?.specialization || 'AI & Data Science'}
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 font-medium text-slate-700">
                  <Building className="w-4 h-4 text-slate-500" />
                  {currentUser?.institution || 'Kalaignar Karunanidhi Institute of Technology'}
                </span>
              </div>

              {/* Stats Bar */}
              <div className="pt-4 grid grid-cols-3 gap-4 max-w-sm mx-auto md:mx-0 border-t border-slate-100 mt-4 text-center">
                <div>
                  <div className="text-xl font-bold text-slate-900">{enrolledCourses.length}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Courses Enrolled</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-indigo-600">{certificates.length}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Certifications</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-emerald-600">
                    {skillsList.length}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Skills Mastered</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 7: CURRENT EDUCATION */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Currently Pursuing</h2>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/30 border border-slate-200/80 grid sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Degree</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                {currentUser?.degree || 'B.Tech'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Specialization</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                {currentUser?.specialization || 'Artificial Intelligence & Data Science'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Institution</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                {currentUser?.institution || 'Kalaignar Karunanidhi Institute of Technology'}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 8, 3, 4: INTERESTS, SKILLS & GOALS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Interests Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Course Interests</h3>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="text-[11px] font-semibold text-indigo-600 hover:underline"
              >
                + Edit Interests
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">Used to personalize your course recommendations.</p>
            <div className="flex flex-wrap gap-2">
              {selectedInterests.length > 0 ? (
                selectedInterests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No interests specified yet.</span>
              )}
            </div>
          </div>

          {/* Skills Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Skills</h3>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="text-[11px] font-semibold text-indigo-600 hover:underline"
              >
                + Add Skills
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">Technical proficiencies & capabilities.</p>
            <div className="flex flex-wrap gap-2">
              {skillsList.length > 0 ? (
                skillsList.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No skills added yet.</span>
              )}
            </div>
          </div>

          {/* Learning Goals Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Learning Goals</h3>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="text-[11px] font-semibold text-indigo-600 hover:underline"
              >
                + Edit Goals
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">What you are aiming to achieve this year.</p>
            <div className="flex flex-wrap gap-2">
              {selectedGoals.length > 0 ? (
                selectedGoals.map((goal, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100"
                  >
                    {goal}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No goals defined yet.</span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 11, 14: CERTIFICATIONS — AUTOMATIC */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Certifications</h2>
                <p className="text-xs text-slate-500">
                  Automatically accredited & generated when you complete 100% of course lessons.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
              {certificates.length} Earned
            </span>
          </div>

          {certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id || cert.certificateId}
                  className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50/20 via-white to-slate-50 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Verified
                    </span>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                      {cert.courseName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Completed by <span className="font-semibold text-slate-700">{cert.studentName}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Issued: {cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString([], { month: 'long', year: 'numeric' }) : 'October 2026'}
                    </p>
                    <div className="mt-2.5 inline-block text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      ID: {cert.certificateId}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setActiveCertModal(cert)}
                      className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      View Certificate
                    </button>
                    <Link
                      to={`/certificates/verify/${cert.verificationCode}`}
                      target="_blank"
                      className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1"
                      title="Verify Public Code"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      Verify
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200">
              <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">You haven't earned any certificates yet.</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Complete all lectures and milestones of any course to have your certificate automatically generated and stamped.
              </p>
              <div className="mt-4">
                <Link
                  to="/courses"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
                >
                  Explore Courses to Earn
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 10: MY LEARNING */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">My Courses</h2>
            </div>
            <Link
              to="/student/courses"
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              View All ({enrolledCourses.length}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {enrolledCourses.map((enr) => {
                const c = enr.course || {};
                const prog = enr.progress || 0;
                return (
                  <div
                    key={enr.id}
                    className="border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col bg-white"
                  >
                    <div className="relative aspect-video bg-slate-100">
                      <img
                        src={c.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60'}
                        alt={c.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                        {c.category || 'Technology'}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{c.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <span>By {c.instructor?.name || 'EduFlow Faculty'}</span>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Progress</span>
                          <span className="font-bold text-slate-900">{prog}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              prog === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${prog}%` }}
                          />
                        </div>

                        <Link
                          to={`/student/courses/${c.id || enr.courseId}/learn`}
                          className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          {prog === 100 ? 'Review Course' : 'Continue Learning'}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center rounded-2xl bg-slate-50/70 border border-slate-200">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">You haven't enrolled in any courses yet.</p>
              <Link
                to="/courses"
                className="mt-3 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Browse Catalog
              </Link>
            </div>
          )}
        </div>

        {/* SECTION 9: RECOMMENDED COURSES */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recommended For You</h2>
                <p className="text-xs text-slate-500">
                  Curated based on your interests in{' '}
                  <span className="font-semibold text-indigo-600">
                    {selectedInterests.slice(0, 3).join(', ') || 'AI & Data Science'}
                  </span>
                </p>
              </div>
            </div>
            <Link to="/courses" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All Courses
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendedCourses.map((c) => (
              <div
                key={c.id}
                className="border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col bg-white"
              >
                <div className="relative aspect-video bg-slate-100">
                  <img
                    src={c.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60'}
                    alt={c.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white">
                    {c.category || 'Computer Science'}
                  </span>
                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/75 text-white backdrop-blur-xs">
                    {c.price === 0 ? 'Free' : `$${c.price}`}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{c.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {c.shortDescription || c.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">By {c.instructor?.name || 'Expert Faculty'}</span>
                    <Link
                      to={`/courses/${c.id}`}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      View Details
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL: ONBOARDING / PROFILE EDITOR */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 my-8 relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider inline-block mb-2">
                Learner Profile Setup
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {currentUser?.profileCompleted ? 'Edit Your Learning Profile' : 'Complete Your Learning Profile'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tell us about your educational background and interests to customize your LMS experience.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Question 1: What course are you currently pursuing? */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                  1. What course are you currently pursuing?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <select
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      {DEGREE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {degree === 'Other' && (
                      <input
                        type="text"
                        placeholder="Enter degree name (e.g. B.Com)"
                        value={customDegree}
                        onChange={(e) => setCustomDegree(e.target.value)}
                        className="w-full mt-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    )}
                  </div>

                  <div>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      {SPECIALIZATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {specialization === 'Other' && (
                      <input
                        type="text"
                        placeholder="Enter specialization"
                        value={customSpecialization}
                        onChange={(e) => setCustomSpecialization(e.target.value)}
                        className="w-full mt-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Institution / University
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Kalaignar Karunanidhi Institute of Technology"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              {/* Question 2: Learning Interests */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                  2. What type of courses are you interested in?
                </label>
                <p className="text-[11px] text-slate-500">Select all subjects you wish to learn:</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((opt) => {
                    const isSelected = selectedInterests.includes(opt);
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => toggleInterest(opt)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {opt}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    placeholder="Add custom interest (e.g. DevOps)"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomInterest}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Question 3: Skills */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                  3. What skills do you already have?
                </label>
                <div className="flex flex-wrap gap-2 min-h-8">
                  {skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-emerald-950"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(e);
                      }
                    }}
                    placeholder="Type a skill (e.g. React) and press Enter"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                  >
                    + Add Skill
                  </button>
                </div>
              </div>

              {/* Question 4: Learning Goal */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                  4. What do you want to achieve?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GOAL_OPTIONS.map((g) => {
                    const isSelected = selectedGoals.includes(g);
                    return (
                      <button
                        type="button"
                        key={g}
                        onClick={() => toggleGoal(g)}
                        className={`text-left px-3.5 py-2 rounded-xl text-xs font-medium border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{g}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-purple-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Profile Photo URL Optional */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Profile Photo URL (optional)
                </label>
                <input
                  type="text"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  {submitting ? 'Saving...' : 'Complete My Profile'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW CERTIFICATE PREVIEW */}
      {activeCertModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl p-6 sm:p-10 relative my-8">
            <button
              onClick={() => setActiveCertModal(null)}
              className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Certificate Frame */}
            <div className="border-8 border-double border-indigo-950/20 p-8 sm:p-12 rounded-2xl bg-gradient-to-b from-white via-indigo-50/10 to-amber-50/20 relative text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">EduFlow Academy</span>
              </div>

              <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">
                Official Certificate of Completion
              </div>
              <div className="text-xs text-slate-500 mb-6">This document certifies that</div>

              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 mb-2">
                {activeCertModal.studentName}
              </h2>
              <div className="w-32 h-0.5 bg-indigo-600 mx-auto mb-6" />

              <p className="text-xs text-slate-600 max-w-md mx-auto mb-2">
                has successfully completed all required lectures, assignments, and verified milestones for
              </p>

              <h3 className="text-2xl font-bold text-indigo-950 mb-8">
                {activeCertModal.courseName}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-left">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Issue Date</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {activeCertModal.issuedDate
                      ? new Date(activeCertModal.issuedDate).toLocaleDateString([], {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'October 2026'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Certificate ID</span>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {activeCertModal.certificateId}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Verification Code</span>
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                    {activeCertModal.verificationCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Link
                to={`/certificates/verify/${activeCertModal.verificationCode}`}
                target="_blank"
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Open Public Verification Page
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  Print / Download
                </button>
                <button
                  onClick={() => setActiveCertModal(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
