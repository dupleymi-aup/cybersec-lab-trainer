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
    <div className="flex flex-wrap items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl mb-4">
      {/* Group filter */}
      <div className="flex items-center gap-2">
        <Users size={15} className="text-slate-500" />
        <span className="text-xs font-medium text-slate-600">Группа:</span>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-200 rounded-md text-sm bg-white hover:border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-colors"
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
        <Calendar size={15} className="text-slate-500" />
        <span className="text-xs font-medium text-slate-600">Период:</span>
        <div className="flex gap-1 p-0.5 bg-slate-100 rounded-md">
          {DAY_PRESETS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                days === d
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
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
