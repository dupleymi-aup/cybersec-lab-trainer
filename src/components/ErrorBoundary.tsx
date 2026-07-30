'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/logger';
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
  retryCount: number;
}

function ErrorFallback({
  error,
  errorInfo,
  showDetails,
  onToggleDetails,
  onReset,
  onReload,
  onCopy,
  componentName,
  retryCount,
  maxRetries,
}: {
  error: Error;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  onToggleDetails: () => void;
  onReset: () => void;
  onReload: () => void;
  onCopy: () => void;
  componentName: string;
  retryCount: number;
  maxRetries: number;
}) {
  const t = useTranslations('errors');
  const canRetry = retryCount < maxRetries;

  return (
    <div className="bg-background flex min-h-[200px] items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-foreground mb-2 text-xl font-bold">{t('componentError', { name: componentName })}</h2>
        <p className="text-muted-foreground mb-4 text-sm">{error.message || t('unexpectedError')}</p>

        <div className="mb-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={onReset}
            disabled={!canRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} />
            {canRetry ? t('tryAgain') : t('maxRetriesReached')}
          </button>
          <button
            type="button"
            onClick={onReload}
            className="bg-muted text-foreground/70 hover:bg-accent inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
          >
            <RefreshCw size={16} />
            {t('reloadPage')}
          </button>
        </div>
        {retryCount > 0 && (
          <p className="text-muted-foreground mb-2 text-xs">
            {t('retryAttempt', { current: retryCount, max: maxRetries })}
          </p>
        )}

        {error && (
          <div className="text-left">
            <button
              type="button"
              onClick={onToggleDetails}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
            >
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showDetails ? t('hideDetails') : t('showDetails')}
            </button>

            {showDetails && (
              <div className="bg-secondary mt-2 max-h-60 overflow-auto rounded-lg border p-3 font-mono text-xs dark:bg-slate-900">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-sans font-semibold text-red-600">
                    {error.name}: {error.message}
                  </span>
                  <button
                    type="button"
                    onClick={onCopy}
                    className="rounded p-1 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-800"
                    aria-label={t('copy')}
                  >
                    <Copy size={14} />
                  </button>
                </div>
                {error.stack && (
                  <pre className="text-muted-foreground whitespace-pre-wrap dark:text-slate-400">
                    {error.stack.split('\n').slice(0, 10).join('\n')}
                  </pre>
                )}
                {errorInfo?.componentStack && (
                  <pre className="text-muted-foreground dark:text-muted-foreground mt-2 whitespace-pre-wrap">
                    {errorInfo.componentStack.split('\n').slice(0, 8).join('\n')}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-muted-foreground mt-4 flex items-center justify-center gap-1 text-xs">
          <Shield size={12} />
          <span>CyberSec Lab — {t('errorHandling')}</span>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`ErrorBoundary [${this.props.name || 'root'}] caught`, {
      error,
      componentStack: errorInfo.componentStack,
    });
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: prev.retryCount + 1,
    }));
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
    ]
      .filter(Boolean)
      .join('\n\n');
    void navigator.clipboard.writeText(text);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { error, errorInfo, showDetails, retryCount } = this.state;
      const componentName = this.props.name || 'component';
      const maxRetries = 3;

      return (
        <ErrorFallback
          error={error ?? new Error('Unknown error')}
          errorInfo={errorInfo}
          showDetails={showDetails}
          onToggleDetails={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
          onReset={this.handleReset}
          onReload={() => window.location.reload()}
          onCopy={this.handleCopyError}
          componentName={componentName}
          retryCount={retryCount}
          maxRetries={maxRetries}
        />
      );
    }

    return this.props.children;
  }
}
