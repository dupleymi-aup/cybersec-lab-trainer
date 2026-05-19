'use client';

import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore, type PageType } from '@/lib/store';
import { modules } from '@/lib/data';

const modulePageIds: PageType[] = modules.map((m) => m.id as PageType);

export default function ModuleNavigation({ currentId }: { currentId: string }) {
  const { setCurrentPage, completedModules } = useAppStore();

  const idx = modulePageIds.indexOf(currentId as PageType);
  if (idx === -1) return null;

  const prev = idx > 0 ? modulePageIds[idx - 1] : null;
  const next = idx < modulePageIds.length - 1 ? modulePageIds[idx + 1] : null;
  const prevMod = prev ? modules.find((m) => m.id === prev) : null;
  const nextMod = next ? modules.find((m) => m.id === next) : null;

  return (
    <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 mt-8">
      <div>
        {prev && prevMod && (
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev)}
            className="text-xs"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 font-normal">Предыдущий</div>
              <div className="text-xs font-medium">{prevMod.title}</div>
            </div>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {completedModules.includes(currentId) && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <CheckCircle2 size={14} /> Пройдено
          </span>
        )}
      </div>

      <div>
        {next && nextMod && (
          <Button
            variant="outline"
            onClick={() => setCurrentPage(next)}
            className="text-xs"
          >
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-normal">Следующий</div>
              <div className="text-xs font-medium">{nextMod.title}</div>
            </div>
            <ArrowRight size={14} className="ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
