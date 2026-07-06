'use client';

import { memo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'stable' | 'improving' | 'declining';
  value?: number;
  suffix?: string;
  size?: 'sm' | 'md';
}

export default memo(function TrendIndicator({ trend, value, suffix = '', size = 'sm' }: TrendIndicatorProps) {
  const normalizedTrend = trend === 'improving' ? 'up' : trend === 'declining' ? 'down' : trend;

  const iconSize = size === 'sm' ? 12 : 16;

  const icon =
    normalizedTrend === 'up' ? (
      <TrendingUp size={iconSize} className="text-emerald-500" />
    ) : normalizedTrend === 'down' ? (
      <TrendingDown size={iconSize} className="text-red-500" />
    ) : (
      <Minus size={iconSize} className="text-slate-400" />
    );

  const textColor =
    normalizedTrend === 'up' ? 'text-emerald-600' : normalizedTrend === 'down' ? 'text-red-600' : 'text-slate-400';
  const displayValue = value !== undefined ? `${value > 0 ? '+' : ''}${value}${suffix}` : '';

  return (
    <span className={`inline-flex items-center gap-1 ${textColor}`}>
      {icon}
      {displayValue && <span className="text-xs font-medium">{displayValue}</span>}
    </span>
  );
});
