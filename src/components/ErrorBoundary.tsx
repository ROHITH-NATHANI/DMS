import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  private unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
    // Ignore benign websocket errors from Vite/HMR
    if (event.reason?.message?.includes('WebSocket') || event.reason?.includes('WebSocket')) {
      event.preventDefault();
      return;
    }
    console.error("Unhandled promise rejection:", event.reason);
  };

  public componentDidMount() {
    window.addEventListener('unhandledrejection', this.unhandledRejectionHandler);
  }

  public componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler);
  }

  public static getDerivedStateFromError(error: Error): State {
    // Don't show error UI for websocket issues
    if (error.message?.includes('WebSocket')) {
      return { hasError: false };
    }
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (error.message?.includes('WebSocket')) return;
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-screen p-8 text-center bg-zinc-50">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Something went wrong</h2>
          <p className="text-zinc-500 max-w-md mb-8">The application encountered an unexpected error. We've been notified and are looking into it.</p>
          <button 
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
