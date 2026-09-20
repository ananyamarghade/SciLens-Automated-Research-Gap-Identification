import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SciLens Runtime Error caught by boundary:', error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-2xl text-center space-y-4 shadow-subtle max-w-xl mx-auto my-12">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-scilens-navy dark:text-white">
              {this.props.fallbackTitle || 'Something went wrong while loading this view.'}
            </h3>
            <p className="text-xs font-sans text-scilens-muted dark:text-scilens-darkmuted max-w-md">
              SciLens encountered an unexpected error while synthesizing research records. Your active investigation data remains intact.
            </p>
          </div>

          {this.state.error && (
            <div className="p-3 bg-scilens-ivory dark:bg-[#070D1E] rounded-lg border border-scilens-border dark:border-scilens-darkborder text-[11px] font-mono text-scilens-muted dark:text-scilens-darkmuted max-w-full overflow-x-auto text-left">
              {this.state.error.message}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-lg bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium transition-colors flex items-center gap-2 shadow-subtle"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Action</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-scilens-warmgray dark:bg-scilens-darkborder text-scilens-navy dark:text-white text-xs font-sans font-medium hover:bg-scilens-border transition-colors flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Reload Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
