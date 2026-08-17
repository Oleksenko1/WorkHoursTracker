import React from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled Error Caught by Boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-rose-500 selection:text-white">
          <div className="w-full max-w-md bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden backdrop-blur-xl">
            
            {/* Error Icon */}
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-lg glow-pink">
              <AlertOctagon className="w-9 h-9" />
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight mb-2">Something Went Wrong</h1>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              An unexpected error occurred while loading the application.
            </p>

            {/* Error Message Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left mb-6 overflow-x-auto max-h-40">
              <div className="text-[11px] font-bold text-rose-400 font-mono mb-1 uppercase tracking-wider">Error Details</div>
              <div className="text-xs font-mono text-slate-300 break-words whitespace-pre-wrap">
                {this.state.error?.toString() || 'Unknown error'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Home className="w-4 h-4" />
                <span>Go to Home</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg glow-green flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
