import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Save,
  Plus,
  Trash2,
  BookOpen,
  Layers,
  Video,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export default function CourseEditor() {
  const { id } = useParams(); // If id exists, it's edit mode
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    category: 'Web Development',
    level: 'All Levels',
    language: 'English',
    price: 49.99,
    duration: '10 hours',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    skills: '',
    requirements: '',
    status: 'draft',
  });

  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // New module state
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);

  // New lesson modal state
  const [activeModuleForLesson, setActiveModuleForLesson] = useState(null);
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    duration: 15,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    content: '',
    isPreview: false,
  });

  useEffect(() => {
    if (isEditMode) {
      const loadCourse = async () => {
        try {
          const res = await api.get(`/courses/${id}`);
          if (res.data.success) {
            const c = res.data.data;
            setFormData({
              title: c.title || '',
              shortDescription: c.shortDescription || '',
              description: c.description || '',
              category: c.category || 'Web Development',
              level: c.level || 'All Levels',
              language: c.language || 'English',
              price: c.price !== undefined ? c.price : 49.99,
              duration: c.duration || '10 hours',
              thumbnail: c.thumbnail || '',
              skills: Array.isArray(c.skills) ? c.skills.join(', ') : '',
              requirements: Array.isArray(c.requirements) ? c.requirements.join(', ') : '',
              status: c.status || 'draft',
            });
            setModules(c.modules || []);
          }
        } catch (err) {
          setErrorMessage('Failed to load course details');
        } finally {
          setIsLoading(false);
        }
      };
      loadCourse();
    }
  }, [id, isEditMode]);

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
        requirements: formData.requirements.split(',').map((r) => r.trim()).filter(Boolean),
      };

      if (isEditMode) {
        const res = await api.put(`/courses/${id}`, payload);
        if (res.data.success) {
          setSuccessMessage('Course updated successfully!');
        }
      } else {
        const res = await api.post('/courses', payload);
        if (res.data.success) {
          setSuccessMessage('Course created! You can now add modules and lessons.');
          navigate(`/instructor/courses/${res.data.data._id}/edit`);
        }
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to save course');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!newModuleTitle.trim() || !id) return;

    try {
      const res = await api.post('/modules', {
        courseId: id,
        title: newModuleTitle,
        order: modules.length,
      });

      if (res.data.success) {
        setModules([...modules, { ...res.data.data, lessons: [] }]);
        setNewModuleTitle('');
        setIsAddingModule(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create module');
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module and all its lessons?')) return;
    try {
      const res = await api.delete(`/modules/${moduleId}`);
      if (res.data.success) {
        setModules(modules.filter((m) => m._id !== moduleId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete module');
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!activeModuleForLesson || !id) return;

    try {
      const res = await api.post('/lessons', {
        moduleId: activeModuleForLesson,
        courseId: id,
        ...lessonFormData,
        duration: Number(lessonFormData.duration),
      });

      if (res.data.success) {
        const created = res.data.data;
        setModules((prev) =>
          prev.map((m) =>
            m._id === activeModuleForLesson
              ? { ...m, lessons: [...(m.lessons || []), created] }
              : m
          )
        );
        setActiveModuleForLesson(null);
        setLessonFormData({
          title: '',
          duration: 15,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          content: '',
          isPreview: false,
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add lesson');
    }
  };

  const handleDeleteLesson = async (lessonId, moduleId) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      const res = await api.delete(`/lessons/${lessonId}`);
      if (res.data.success) {
        setModules((prev) =>
          prev.map((m) =>
            m._id === moduleId
              ? { ...m, lessons: (m.lessons || []).filter((l) => l._id !== lessonId) }
              : m
          )
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete lesson');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading course curriculum...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isEditMode ? 'Edit Course & Curriculum' : 'Create New Course'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure course metadata, modules, video lectures, and publishing state.
          </p>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Course Details Form */}
      <form onSubmit={handleCourseSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          1. Basic Course Information
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Course Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Modern Full-Stack Web Development"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 bg-white"
              >
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Web Development">Web Development</option>
                <option value="Data Science">Data Science</option>
                <option value="Cloud Computing">Cloud Computing</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Generative AI">Generative AI</option>
                <option value="Computer Science">Computer Science</option>
                <option value="UI/UX Design">UI/UX Design</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Difficulty Level
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 bg-white"
              >
                <option value="All Levels">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Price ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Short Description
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              placeholder="Brief summary displayed on catalog cards..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Course Description
            </label>
            <textarea
              rows="4"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed syllabus, expectations, and coursework..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Skills Covered (comma separated)
              </label>
              <input
                type="text"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="React, Redux, Node.js, Express..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Publication Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 bg-white"
              >
                <option value="draft">Draft (Hidden from public catalog)</option>
                <option value="published">Published (Live in catalog)</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditMode ? 'Update Course Info' : 'Create Course'}
          </button>
        </div>
      </form>

      {/* Modules & Lessons Management (Edit Mode only) */}
      {isEditMode && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Curriculum Structure (Modules & Lessons)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Organize lectures into modular sections with video links and lecture notes.
              </p>
            </div>

            <button
              onClick={() => setIsAddingModule(!isAddingModule)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Module
            </button>
          </div>

          {/* Add Module inline form */}
          {isAddingModule && (
            <form onSubmit={handleAddModule} className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center gap-3">
              <input
                type="text"
                required
                placeholder="Enter module title (e.g. Module 1: Architecture & Foundations)..."
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
              >
                Save Module
              </button>
              <button
                type="button"
                onClick={() => setIsAddingModule(false)}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Module List */}
          <div className="space-y-4">
            {modules.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                No modules created yet. Click "Add Module" to start structuring your course.
              </div>
            ) : (
              modules.map((mod, mIdx) => (
                <div key={mod._id} className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Module {mIdx + 1}: {mod.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveModuleForLesson(mod._id)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 font-semibold"
                      >
                        + Add Lesson
                      </button>
                      <button
                        onClick={() => handleDeleteModule(mod._id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete module"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 bg-white">
                    {mod.lessons?.length === 0 ? (
                      <p className="p-4 text-slate-400 italic">No lessons in this module yet.</p>
                    ) : (
                      mod.lessons?.map((lesson) => (
                        <div key={lesson._id} className="p-3 px-4 flex items-center justify-between hover:bg-slate-50">
                          <div className="flex items-center gap-2.5">
                            <Video className="w-4 h-4 text-indigo-500" />
                            <span className="font-medium text-slate-700">{lesson.title}</span>
                            {lesson.isPreview && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600">
                                Free Preview
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400">{lesson.duration || 10} min</span>
                            <button
                              onClick={() => handleDeleteLesson(lesson._id, mod._id)}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {activeModuleForLesson && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Add New Lesson</h4>
              <button onClick={() => setActiveModuleForLesson(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLesson} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lesson Title
                </label>
                <input
                  type="text"
                  required
                  value={lessonFormData.title}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                  placeholder="e.g. Unit 1.1: Foundations & Architecture"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={lessonFormData.duration}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, duration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="previewCheck"
                    checked={lessonFormData.isPreview}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, isPreview: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="previewCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Free Preview
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Video URL (.mp4 or streaming URL)
                </label>
                <input
                  type="url"
                  value={lessonFormData.videoUrl}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, videoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lesson Notes & Syllabus Reading
                </label>
                <textarea
                  rows="3"
                  value={lessonFormData.content}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, content: e.target.value })}
                  placeholder="Lecture notes, concepts, and reference guide..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModuleForLesson(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  Add Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
