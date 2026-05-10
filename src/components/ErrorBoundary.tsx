import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logger } from "../lib/logger";

interface Props {
  children?: ReactNode;
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
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(error, { errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              We encountered an unexpected error while rendering this component.
            </p>
            {this.state.error && (
              <div className="bg-black/20 rounded-xl p-3 mb-6 text-left overflow-hidden">
                <p className="text-xs text-red-300 font-mono break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
