'use client';

import { memo } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore, type PageType } from '@/lib/store';
import { modules } from '@/lib/data';
import { useTranslations } from 'next-intl';

const modulePageIds: PageType[] = modules.map((m) => m.id as PageType);

export default memo(function ModuleNavigation({ currentId }: { currentId: string }) {
  const t = useTranslations('errors');
  const tc = useTranslations('common');
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const completedModules = useAppStore((s) => s.completedModules);

  const idx = modulePageIds.indexOf(currentId as PageType);
  if (idx === -1) return null;

  const prev = idx > 0 ? modulePageIds[idx - 1] : null;
  const next = idx < modulePageIds.length - 1 ? modulePageIds[idx + 1] : null;
  const prevMod = prev ? modules.find((m) => m.id === prev) : null;
  const nextMod = next ? modules.find((m) => m.id === next) : null;

  return (
    <div className="border-border mt-8 flex items-center justify-between gap-3 border-t pt-4">
      <div>
        {prev && prevMod && (
          <Button variant="outline" onClick={() => setCurrentPage(prev)} className="text-xs">
            <ArrowLeft size={14} className="mr-1.5" />
            <div className="text-left">
              <div className="text-[10px] font-normal text-slate-400">{tc('previous')}</div>
              <div className="text-xs font-medium">{prevMod.title}</div>
            </div>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {completedModules.includes(currentId) && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <CheckCircle2 size={14} /> {t('completed')}
          </span>
        )}
      </div>

      <div>
        {next && nextMod && (
          <Button variant="outline" onClick={() => setCurrentPage(next)} className="text-xs">
            <div className="text-right">
              <div className="text-[10px] font-normal text-slate-400">{tc('next')}</div>
              <div className="text-xs font-medium">{nextMod.title}</div>
            </div>
            <ArrowRight size={14} className="ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
});
