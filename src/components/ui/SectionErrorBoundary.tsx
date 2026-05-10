import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Section Error:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-[32px] border border-surface text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Something went wrong</h3>
            <p className="text-sm text-muted max-w-xs mx-auto">
              We encountered an error while loading the {this.props.sectionName || "section"}. 
              This could be due to a network issue or a temporary service disruption.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white rounded-full font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-[var(--color-primary)]/20"
          >
            <RefreshCcw className="w-4 h-4" /> Retry Loading
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
