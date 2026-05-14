import React, { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { logger } from "../../lib/logger";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
}

/**
 * AIErrorBoundary - A specialized error boundary for AI components.
 * Uses neutral styling to indicate a transient issue rather than an emergency.
 */
export class AIErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to central logger (connected to observability in production)
    logger.error("AI Component Error:", { error, errorInfo });
    
    const msg = error.message || "";
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("is not a valid JavaScript MIME type") ||
      msg.includes("Loading chunk") 
    ) {
      if (!sessionStorage.getItem("aegis_reloaded_from_chunk_error")) {
        sessionStorage.setItem("aegis_reloaded_from_chunk_error", "true");
        window.location.reload();
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[200px] flex items-center justify-center p-6 bg-slate-900/50 rounded-3xl border border-white/5">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-400"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-tight">
                This section is temporarily unavailable
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {this.props.fallbackMessage ||
                  "Your data is safe. This is likely a temporary issue."}
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all text-xs font-bold uppercase tracking-wider"
            >
              <RefreshCw className="w-3 h-3" />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
