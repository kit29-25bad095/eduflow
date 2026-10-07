import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Loader2, AlertCircle } from 'lucide-react';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        if (errorParam === 'google_cancelled') {
          navigate('/login?error=cancelled');
        } else {
          navigate('/login?error=failed');
        }
        return;
      }

      if (!token) {
        setError('No authorization token received from Google OAuth.');
        setTimeout(() => navigate('/login?error=missing_token'), 2000);
        return;
      }

      try {
        localStorage.setItem('token', token);
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success && res.data.data) {
          const userData = res.data.data;
          localStorage.setItem('user', JSON.stringify(userData));
          if (updateUser) updateUser(userData);

          // Force page or auth state refresh
          const role = userData.role;
          if (role === 'admin') {
            window.location.href = '/admin/dashboard';
          } else if (role === 'instructor') {
            window.location.href = '/instructor/dashboard';
          } else {
            window.location.href = '/student/dashboard';
          }
        } else {
          throw new Error('Unable to verify user session');
        }
      } catch (err) {
        console.error('OAuth Callback verification failed', err);
        setError('Google sign-in failed. Please try again.');
        setTimeout(() => navigate('/login?error=failed'), 2000);
      }
    };

    handleAuth();
  }, [searchParams, navigate, updateUser]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      {error ? (
        <div className="max-w-md w-full p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-700 space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
          <h2 className="text-base font-bold">Authentication Issue</h2>
          <p className="text-xs text-rose-600">{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto shadow-sm">
            <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Signing in with Google...</h2>
            <p className="text-xs text-slate-500 mt-1">Verifying your identity and setting up your LMS session.</p>
          </div>
        </div>
      )}
    </div>
  );
}
