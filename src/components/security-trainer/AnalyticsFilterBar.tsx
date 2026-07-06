'use client';

import { useEffect, useState } from 'react';
import { getAllGroups } from '@/lib/auth-store';
import { useAnalyticsFilters } from '@/lib/analytics-context';
import { Calendar, Users } from 'lucide-react';

const DAY_PRESETS = [7, 30, 90, 180];

export default function AnalyticsFilterBar() {
  const { groupId, days, setGroupId, setDays } = useAnalyticsFilters();
  const [groups, setGroups] = useState<string[]>([]);

  useEffect(() => {
    getAllGroups().then(setGroups);
  }, []);

  return (
    <div className="border-border mb-4 flex flex-wrap items-center gap-3 rounded-xl border bg-gradient-to-r from-slate-50 to-white p-3">
      {/* Group filter */}
      <div className="flex items-center gap-2">
        <Users size={15} className="text-muted-foreground" />
        <span className="text-muted-foreground text-xs font-medium">Группа:</span>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="border-border bg-card hover:border-border rounded-md border px-2.5 py-1.5 text-sm transition-colors outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
        >
          <option value="">Все группы</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-slate-200" />

      {/* Period presets */}
      <div className="flex items-center gap-2">
        <Calendar size={15} className="text-muted-foreground" />
        <span className="text-muted-foreground text-xs font-medium">Период:</span>
        <div className="bg-muted flex gap-1 rounded-md p-0.5">
          {DAY_PRESETS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                days === d ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {d}д
            </button>
          ))}
        </div>
      </div>

      {/* Active filter indicator */}
      {(groupId || days !== 30) && (
        <>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5 text-xs text-blue-600">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            Фильтр:
            {groupId && <span className="font-medium">{groupId}</span>}
            {groupId && days !== 30 && <span>·</span>}
            {days !== 30 && <span className="font-medium">{days} дней</span>}
          </div>
        </>
      )}
    </div>
  );
}
