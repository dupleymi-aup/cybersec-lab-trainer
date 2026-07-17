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
    getAllGroups().then(setGroups).catch(() => { /* ignore */ });
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-white border border-border rounded-xl mb-4">
      {/* Group filter */}
      <div className="flex items-center gap-2">
        <Users size={15} className="text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Группа:</span>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="px-2.5 py-1.5 border border-border rounded-md text-sm bg-card hover:border-border focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-colors"
        >
          <option value="">Все группы</option>
          {groups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-200" />

      {/* Period presets */}
      <div className="flex items-center gap-2">
        <Calendar size={15} className="text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Период:</span>
        <div className="flex gap-1 p-0.5 bg-muted rounded-md">
          {DAY_PRESETS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                days === d
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
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
          <div className="w-px h-6 bg-slate-200" />
          <div className="flex items-center gap-1.5 text-xs text-blue-600">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
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
