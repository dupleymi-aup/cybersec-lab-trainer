'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useSession } from '@/hooks/use-session';
import { Cloud, CloudOff, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/logger';

export default function SyncIndicator() {
  const syncStatus = useAppStore((s) => s.syncStatus);
  const lastSyncedAt = useAppStore((s) => s.lastSyncedAt);
  const userId = useAppStore((s) => s.userId);
  const syncWithDatabase = useAppStore((s) => s.syncWithDatabase);
  const { isAuthenticated } = useSession();
  const t = useTranslations('syncIndicator');
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  if (!isAuthenticated || !userId) return null;

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 5) return t('justNow');
    if (diff < 60) return t('secondsAgo', { diff });
    if (diff < 3600) return t('minutesAgo', { diff: Math.floor(diff / 60) });
    return date.toLocaleTimeString();
  };

  const handleManualSync = async () => {
    if (isManualSyncing || syncStatus === 'syncing') return;
    setIsManualSyncing(true);
    try {
      await syncWithDatabase();
      toast.success(t('syncSuccess'));
    } catch (e) {
      logger.warn('SyncIndicator handleManualSync failed', { error: e });
      toast.error(t('syncError'));
    } finally {
      setIsManualSyncing(false);
    }
  };

  const icons = {
    idle: <CloudOff size={14} className="text-muted-foreground" />,
    syncing: <Cloud size={14} className="animate-pulse text-blue-400" />,
    synced: <CheckCircle2 size={14} className="text-emerald-400" />,
    error: <AlertCircle size={14} className="text-red-400" />,
  };

  const labels = {
    idle: t('idle'),
    syncing: t('syncing'),
    synced: lastSyncedAt ? t('syncedTime', { time: formatTime(lastSyncedAt) }) : t('synced'),
    error: t('error'),
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400">
      {icons[syncStatus]}
      <span>{labels[syncStatus]}</span>
      <button
        onClick={handleManualSync}
        disabled={isManualSyncing || syncStatus === 'syncing'}
        className="ml-1 rounded p-0.5 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
        title={t('syncNow')}
      >
        <RefreshCw size={12} className={isManualSyncing ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}
