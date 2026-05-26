'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Copy, RefreshCw, ChevronDown, ChevronUp, Shield } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary [${this.props.name || 'root'}] caught:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    if (!error) return;
    const text = [
      `Error: ${error.message}`,
      `Stack: ${error.stack}`,
      errorInfo ? `Component Stack: ${errorInfo.componentStack}` : '',
    ].filter(Boolean).join('\n\n');
    navigator.clipboard.writeText(text).catch(() => {
      // Intentionally empty — clipboard copy is non-critical, error handled elsewhere
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { error, errorInfo, showDetails } = this.state;
      const componentName = this.props.name || 'компонент';

      return (
        <div className="min-h-[200px] flex items-center justify-center bg-background p-4">
          <div className="max-w-lg w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Ошибка в {componentName}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {error?.message || 'Произошла непредвиденная ошибка'}
            </p>

            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
              >
                <RefreshCw size={16} />
                Попробовать снова
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground/70 rounded-lg hover:bg-accent transition text-sm font-medium"
              >
                <RefreshCw size={16} />
                Перезагрузить страницу
              </button>
            </div>

            {/* Error details toggle */}
            {error && (
              <div className="text-left">
                <button
                  onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showDetails ? 'Скрыть детали' : 'Показать детали'}
                </button>

                {showDetails && (
                  <div className="mt-2 p-3 bg-secondary dark:bg-slate-900 rounded-lg border text-xs font-mono overflow-auto max-h-60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-sans font-semibold text-red-600">{error.name}: {error.message}</span>
                      <button
                        onClick={this.handleCopyError}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 dark:bg-slate-700 transition-colors"
                        title="Копировать"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    {error.stack && (
                      <pre className="whitespace-pre-wrap text-muted-foreground dark:text-slate-400">
                        {error.stack.split('\n').slice(0, 10).join('\n')}
                      </pre>
                    )}
                    {errorInfo?.componentStack && (
                      <pre className="whitespace-pre-wrap text-muted-foreground dark:text-muted-foreground mt-2">
                        {errorInfo.componentStack.split('\n').slice(0, 8).join('\n')}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Shield size={12} />
              <span>CyberSec Lab — Обработка ошибок</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
