import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI exception in component tree:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Something went wrong</h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                An unexpected interface error occurred. You can reload this page or return to the main catalog.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left">
                <p className="text-[11px] font-mono text-rose-600 break-words line-clamp-3">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-100"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </button>
              <a
                href="/courses"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                Course Catalog
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
