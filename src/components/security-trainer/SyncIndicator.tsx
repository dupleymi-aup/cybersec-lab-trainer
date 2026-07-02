"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useSession } from "@/hooks/use-session";
import {
  Cloud,
  CloudOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function SyncIndicator() {
  const syncStatus = useAppStore((s) => s.syncStatus);
  const lastSyncedAt = useAppStore((s) => s.lastSyncedAt);
  const userId = useAppStore((s) => s.userId);
  const syncWithDatabase = useAppStore((s) => s.syncWithDatabase);
  const { isAuthenticated } = useSession();
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  if (!isAuthenticated || !userId) return null;

  const handleManualSync = async () => {
    if (isManualSyncing || syncStatus === "syncing") return;
    setIsManualSyncing(true);
    try {
      await syncWithDatabase();
      toast.success("Прогресс синхронизирован");
    } catch (e) {
      if (process.env.NODE_ENV === "development")
        console.warn("[SyncIndicator.tsx] handleManualSync failed:", e);
      toast.error("Ошибка синхронизации");
    } finally {
      setIsManualSyncing(false);
    }
  };

  const icons = {
    idle: <CloudOff size={14} className="text-muted-foreground" />,
    syncing: <Cloud size={14} className="text-blue-400 animate-pulse" />,
    synced: <CheckCircle2 size={14} className="text-emerald-400" />,
    error: <AlertCircle size={14} className="text-red-400" />,
  };

  const labels = {
    idle: "Offline",
    syncing: "Syncing...",
    synced: lastSyncedAt ? `Synced ${formatTime(lastSyncedAt)}` : "Synced",
    error: "Sync failed",
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400">
      {icons[syncStatus]}
      <span>{labels[syncStatus]}</span>
      <button
        onClick={handleManualSync}
        disabled={isManualSyncing || syncStatus === "syncing"}
        className="ml-1 p-0.5 rounded hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Sync now"
      >
        <RefreshCw
          size={12}
          className={isManualSyncing ? "animate-spin" : ""}
        />
      </button>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString();
}
