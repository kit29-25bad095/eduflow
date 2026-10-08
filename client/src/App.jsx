import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import CourseCatalog from './pages/CourseCatalog';
import CourseDetails from './pages/CourseDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import MyCourses from './pages/MyCourses';
import CoursePlayer from './pages/CoursePlayer';
import StudentProfile from './pages/StudentProfile';
import CertificateVerification from './pages/CertificateVerification';

// Instructor Pages
import InstructorDashboard from './pages/InstructorDashboard';
import CourseEditor from './pages/CourseEditor';
import InstructorSubmissions from './pages/InstructorSubmissions';
import InstructorReviews from './pages/InstructorReviews';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ErrorBoundary>
            <Routes>
            {/* Fullscreen player without default nav/footer */}
            <Route
              path="/student/courses/:courseId/learn"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <CoursePlayer />
                </ProtectedRoute>
              }
            />

            {/* Standard Layout Routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="courses" element={<CourseCatalog />} />
              <Route path="courses/:id" element={<CourseDetails />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="oauth-callback" element={<OAuthCallback />} />

              {/* Public Certificate Verification Route */}
              <Route path="certificates/verify/:verificationCode" element={<CertificateVerification />} />

              {/* Learner Profile Routes */}
              <Route
                path="profile"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin', 'instructor']}>
                    <StudentProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="student/profile"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <StudentProfile />
                  </ProtectedRoute>
                }
              />

              {/* Student Routes */}
              <Route
                path="student/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="student/courses"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <MyCourses />
                  </ProtectedRoute>
                }
              />

              {/* Instructor Routes */}
              <Route
                path="instructor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <InstructorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="instructor/courses/new"
                element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <CourseEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="instructor/courses/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <CourseEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="instructor/submissions"
                element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <InstructorSubmissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="instructor/reviews"
                element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <InstructorReviews />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </NotificationProvider>
    </AuthProvider>
    </BrowserRouter>
  );
}
