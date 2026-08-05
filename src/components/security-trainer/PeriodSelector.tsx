'use client';

import { PERIOD_DAYS } from '@/lib/constants';

interface PeriodSelectorProps {
  value: number;
  onChange: (days: number) => void;
  getLabel: (days: number) => string;
}

export default function PeriodSelector({ value, onChange, getLabel }: PeriodSelectorProps) {
  return (
    <div className="bg-muted flex gap-1 rounded-lg p-1">
      {PERIOD_DAYS.map((days) => (
        <button
          key={days}
          onClick={() => onChange(days)}
          className={`rounded-md px-3 py-1.5 text-xs transition-all ${
            value === days
              ? 'bg-background text-foreground font-medium shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {getLabel(days)}
        </button>
      ))}
    </div>
  );
}
