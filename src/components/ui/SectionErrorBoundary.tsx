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

  private handleRetry = () => {
    const isChunkError = this.state.error?.message?.includes("Failed to fetch dynamically imported module") || 
                         this.state.error?.message?.includes("is not a valid JavaScript MIME type");
    if (isChunkError) {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null });
    }
  };

  public render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes("Failed to fetch dynamically imported module") || 
                           this.state.error?.message?.includes("is not a valid JavaScript MIME type");
      
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-[32px] border border-surface text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{isChunkError ? "App Updated" : "Something went wrong"}</h2>
            <p className="text-sm text-muted max-w-xs mx-auto">
              {isChunkError 
                ? "A new version of the app is available. Please refresh to continue."
                : `We encountered an error while loading the ${this.props.sectionName || "section"}. This could be due to a network issue or a temporary service disruption.`}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-slate-900 font-bold rounded-full text-sm hover:opacity-90 transition-all shadow-lg shadow-[var(--color-primary)]/20"
          >
            <RefreshCcw className="w-4 h-4" /> {isChunkError ? "Refresh Application" : "Retry Loading"}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
