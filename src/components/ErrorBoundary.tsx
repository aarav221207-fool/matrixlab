import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Calculator, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in MatrixLab:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center">
            <div className="bg-blue-600 p-3 rounded-xl text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] mb-4">
              <Calculator size={28} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">MatrixLab</h1>
            <p className="text-white/70 text-sm mb-6">
              MatrixLab encountered an unexpected error.
            </p>
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95"
            >
              <RefreshCw size={16} /> Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
