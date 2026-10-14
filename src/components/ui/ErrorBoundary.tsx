import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    console.error('NFL Savvy Caught Boundary Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCache = () => {
    try {
      if (typeof window !== 'undefined') {
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          });
        }
        if (window.localStorage) {
          localStorage.clear();
        }
        if (window.sessionStorage) {
          sessionStorage.clear();
        }
      }
    } catch {}
    window.location.href = window.location.origin + window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-3xl">
              🏈
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Unable to Load Content
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                A temporary network glitch or cached update prevented this view from rendering.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 text-left overflow-x-auto text-xs font-mono text-red-400">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow text-sm"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleClearCache}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-xl transition border border-gray-700 text-sm"
              >
                Clear Cache & Restart
              </button>
              <a
                href="#/"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white font-semibold rounded-xl transition border border-gray-800 text-sm"
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
