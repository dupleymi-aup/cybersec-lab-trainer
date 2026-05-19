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
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => onChange(p.key)}
            className={`px-3 py-1.5 text-xs rounded-md transition-all ${
              days === p.key
                ? 'bg-white text-slate-900 shadow-sm font-medium'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <button
          onClick={() => setCustomOpen(!customOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-all ${
            !isPreset
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium'
              : 'border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          <Calendar size={13} />
          <span>{customLabel || (isPreset ? daysToDateRange(days) : `${days} дн.`)}</span>
          <ChevronDown size={12} />
        </button>

        {customOpen && (
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-[200px]">
            <p className="text-xs font-medium text-slate-700 mb-2">Свой период</p>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="number"
                min="1"
                max="3650"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCustomSubmit(); }}
                placeholder="Кол-во дней"
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-md text-xs"
              />
              <button
                onClick={handleCustomSubmit}
                disabled={!customDays || parseInt(customDays) <= 0}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 disabled:opacity-50"
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
