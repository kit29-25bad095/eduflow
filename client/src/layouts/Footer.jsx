import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">EduFlow LMS</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Modern full-stack learning management platform. Bridging industry skills with hands-on coursework, real analytics, and verified submissions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/courses" className="hover:text-indigo-400 transition-colors">
                  All Courses
                </Link>
              </li>
              <li>
                <Link to="/courses?category=Artificial+Intelligence" className="hover:text-indigo-400 transition-colors">
                  Artificial Intelligence
                </Link>
              </li>
              <li>
                <Link to="/courses?category=Web+Development" className="hover:text-indigo-400 transition-colors">
                  Web Development
                </Link>
              </li>
              <li>
                <Link to="/courses?category=Cloud+Computing" className="hover:text-indigo-400 transition-colors">
                  Cloud & DevOps
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/student/dashboard" className="hover:text-indigo-400 transition-colors">
                  Student Portal
                </Link>
              </li>
              <li>
                <Link to="/instructor/dashboard" className="hover:text-indigo-400 transition-colors">
                  Instructor Studio
                </Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-indigo-400 transition-colors">
                  Platform Admin
                </Link>
              </li>
              <li>
                <a href="#benefits" className="hover:text-indigo-400 transition-colors">
                  Learning Architecture
                </a>
              </li>
            </ul>
          </div>

          {/* Architecture Badge */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Accreditation & Trust</h4>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Verified Certification Authority
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All certificates include cryptographic verification and direct instructor project assessments.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} EduFlow Academy. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link to="/courses" className="hover:text-white transition-colors">Course Directory</Link>
            <span>•</span>
            <span>Accredited Technical Education</span>
            <span>•</span>
            <span>256-Bit SSL Secure Checkout</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
