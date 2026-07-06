'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface Props {
  days: number;
  onChange: (days: number) => void;
  customLabel?: string;
}

const PRESETS = [
  { key: 7, label: '7д' },
  { key: 30, label: '30д' },
  { key: 90, label: '90д' },
  { key: 180, label: '180д' },
  { key: 365, label: '1г' },
  { key: -1, label: 'Всё время' },
];

function daysToDateRange(days: number): string {
  if (days === -1) return 'За всё время';
  return `Последние ${days} дн.`;
}

export default function CustomDateRangePicker({ days, onChange, customLabel }: Props) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customDays, setCustomDays] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
          <span>{customLabel || (isPreset ? daysToDateRange(days) : `${days} дн.`)}</span>
          <ChevronDown size={12} />
        </button>

        {customOpen && (
          <div className="bg-card border-border absolute top-full right-0 z-20 mt-1 min-w-[200px] rounded-lg border p-3 shadow-lg">
            <p className="text-foreground/70 mb-2 text-xs font-medium">Свой период</p>
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
                placeholder="Кол-во дней"
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
