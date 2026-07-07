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
  const t = useTranslations('errors');
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  if (!isAuthenticated || !userId) return null;

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
    idle: 'Offline',
    syncing: 'Syncing...',
    synced: lastSyncedAt ? `Synced ${formatTime(lastSyncedAt)}` : 'Synced',
    error: 'Sync failed',
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400">
      {icons[syncStatus]}
      <span>{labels[syncStatus]}</span>
      <button
        onClick={handleManualSync}
        disabled={isManualSyncing || syncStatus === 'syncing'}
        className="ml-1 rounded p-0.5 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
        title="Sync now"
      >
        <RefreshCw size={12} className={isManualSyncing ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString();
}
