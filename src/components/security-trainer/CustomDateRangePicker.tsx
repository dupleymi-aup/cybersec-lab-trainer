'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  days: number;
  onChange: (days: number) => void;
  customLabel?: string;
}

export default function CustomDateRangePicker({ days, onChange, customLabel }: Props) {
  const t = useTranslations('common.dateRange');
  const [customOpen, setCustomOpen] = useState(false);
  const [customDays, setCustomDays] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const PRESETS = [
    { key: 7, label: t('7d') },
    { key: 30, label: t('30d') },
    { key: 90, label: t('90d') },
    { key: 180, label: t('180d') },
    { key: 365, label: t('1y') },
    { key: -1, label: t('allTime') },
  ];

  const daysToDateRange = (d: number) => {
    if (d === -1) return t('allTimeRange');
    return t('lastNdays', { n: d });
  };

  useEffect(() => {
    if (customOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [customOpen]);

  const handleCustomSubmit = () => {
    const n = parseInt(customDays, 10);
    if (n > 0 && n <= 3650) {
      onChange(n);
      setCustomOpen(false);
      setCustomDays('');
    }
  };

  const isPreset = PRESETS.some((p) => p.key === days);

  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted flex gap-1 rounded-lg p-1">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => onChange(p.key)}
            className={`rounded-md px-3 py-1.5 text-xs transition-all ${
              days === p.key
                ? 'bg-background text-foreground font-medium shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <button
          onClick={() => setCustomOpen(!customOpen)}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-all ${
            !isPreset
              ? 'border-indigo-200 bg-indigo-50 font-medium text-indigo-700'
              : 'border-border text-muted-foreground hover:border-border'
          }`}
        >
          <Calendar size={13} />
          <span>{customLabel || (isPreset ? daysToDateRange(days) : t('nDays', { n: days }))}</span>
          <ChevronDown size={12} />
        </button>

        {customOpen && (
          <div className="bg-card border-border absolute top-full right-0 z-20 mt-1 min-w-[200px] rounded-lg border p-3 shadow-lg">
            <p className="text-foreground/70 mb-2 text-xs font-medium">{t('customPeriod')}</p>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="number"
                min="1"
                max="3650"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomSubmit();
                }}
                placeholder={t('daysCount')}
                className="border-border flex-1 rounded-md border px-3 py-1.5 text-xs"
              />
              <button
                onClick={handleCustomSubmit}
                disabled={!customDays || parseInt(customDays) <= 0}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
