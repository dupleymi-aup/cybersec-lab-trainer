'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ChartErrorFallback({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('errors');
  return (
    <div className="flex min-h-[150px] items-center justify-center rounded-lg border border-dashed p-4">
      <div className="text-center">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-500" />
        <p className="text-muted-foreground text-sm">{t('chartFailed')}</p>
        <button
          type="button"
          onClick={onRetry}
          className="text-primary mt-2 text-xs hover:underline"
        >
          {t('tryAgain')}
        </button>
      </div>
    </div>
  );
}

export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`ChartErrorBoundary [${this.props.name || 'chart'}] caught`, {
      error,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <ChartErrorFallback
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}
