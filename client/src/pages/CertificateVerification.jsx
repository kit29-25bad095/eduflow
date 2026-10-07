import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Award,
  ShieldCheck,
  Calendar,
  User,
  BookOpen,
  ArrowRight,
  GraduationCap,
  ExternalLink,
  Printer,
  Sparkles,
} from 'lucide-react';

export default function CertificateVerification() {
  const { verificationCode } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function verify() {
      if (!verificationCode) {
        setError('No verification code provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/certificates/verify/${encodeURIComponent(verificationCode)}`);
        const json = await res.json();

        if (res.ok && json.success) {
          setCert(json.data);
        } else {
          setError(json.message || 'The specified certificate could not be verified.');
        }
      } catch (err) {
        setError('Unable to reach certificate verification authority. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [verificationCode]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Verification Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Official Credential Registry
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            EduFlow Certificate Verification
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Real-time cryptographic verification of student course completion credentials.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-base font-semibold text-slate-800">Verifying credential authenticity...</h3>
            <p className="text-xs text-slate-500 mt-1">Querying EduFlow relational registry for verification code: <code className="font-mono text-slate-700">{verificationCode}</code></p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 shadow-xs text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Certificate Not Verified</h2>
            <p className="text-sm text-rose-600 mt-1 font-medium">{error}</p>
            <p className="text-xs text-slate-500 mt-3 max-w-sm mx-auto">
              Please double check that the verification code <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{verificationCode}</span> matches the original certificate document.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
              >
                Go to Homepage
              </Link>
              <Link
                to="/courses"
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all"
              >
                Explore Courses
              </Link>
            </div>
          </div>
        )}

        {/* Verified Certificate Card */}
        {!loading && cert && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Status Banner */}
            <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide uppercase">Authentic & Verified Certificate</h3>
                  <p className="text-xs text-emerald-100">Issued and digitally stamped by EduFlow LMS</p>
                </div>
              </div>
              <span className="hidden sm:inline-block px-3 py-1 bg-white/15 rounded-full text-xs font-semibold">
                Status: VALID
              </span>
            </div>

            {/* Certificate Body Preview */}
            <div className="p-8 sm:p-10 bg-gradient-to-b from-slate-50/50 to-white">
              <div className="border-4 border-double border-slate-200 rounded-2xl p-6 sm:p-8 bg-white relative">
                {/* Watermark Seal */}
                <div className="absolute right-6 top-6 opacity-10 pointer-events-none">
                  <Award className="w-32 h-32 text-indigo-900" />
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-slate-900 tracking-tight text-sm">EduFlow Academy</span>
                </div>

                <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">
                  Certificate of Course Completion
                </p>
                <p className="text-xs text-slate-500 mb-6">
                  This acknowledges that
                </p>

                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mb-2">
                  {cert.studentName}
                </h2>
                <div className="w-24 h-0.5 bg-indigo-600 mb-6" />

                <p className="text-xs text-slate-500 mb-1">
                  has successfully completed all lectures, curriculum requirements, and assessments for
                </p>
                <h3 className="text-xl font-bold text-indigo-950 mb-6">
                  {cert.courseName}
                </h3>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block uppercase">Issue Date</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }) : 'October 2026'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block uppercase">Certificate ID</span>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {cert.certificateId}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block uppercase">Verification Code</span>
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                      {cert.verificationCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  Print / Save Verification Record
                </button>

                <Link
                  to="/courses"
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  Browse More Accredited Courses
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
