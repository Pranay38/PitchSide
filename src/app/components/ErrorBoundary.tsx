import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary that catches React rendering errors.
 * Logs errors to /api/error-log for monitoring and shows a recovery UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Report to backend error log
    try {
      navigator.sendBeacon(
        "/api/error-log",
        JSON.stringify({
          message: error.message,
          stack: error.stack?.slice(0, 1000),
          componentStack: info.componentStack?.slice(0, 500),
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        })
      );
    } catch {
      // Silently fail if beacon isn't available
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0A0F1A] text-white p-6">
          <div className="max-w-md text-center space-y-6">
            <div className="text-6xl">⚽</div>
            <h1 className="text-2xl font-black font-outfit">
              Offside! Something went wrong.
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              We've logged this error and will look into it. 
              In the meantime, try refreshing or heading back to the homepage.
            </p>
            {this.state.error && (
              <pre className="text-left bg-white/5 rounded-xl p-4 text-xs text-red-400 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-[#16A34A] rounded-xl font-bold text-sm hover:bg-[#15803d] transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 bg-white/10 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
