'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNotificationStore, type Notification as NotifType } from '@/lib/notification-store';
import {
  Bell, BellOff, Check, Trash2, X, AlertTriangle, Trophy, BookOpen, Brain, Megaphone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ICON_MAP: Record<NotifType['type'], { icon: typeof Trophy; className: string }> = {
  achievement: { icon: Trophy, className: 'text-amber-500' },
  progress: { icon: BookOpen, className: 'text-green-500' },
  quiz: { icon: Brain, className: 'text-blue-500' },
  warning: { icon: AlertTriangle, className: 'text-red-500' },
  system: { icon: Bell, className: 'text-slate-500' },
  announcement: { icon: Megaphone, className: 'text-purple-500' },
};

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Только что';
  if (m < 60) return `${m} мин. назад`;
  if (h < 24) return `${h} ч. назад`;
  return `${d} дн. назад`;
}

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'unread', label: 'Новые' },
  { key: 'announcement', label: 'Объявления' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, removeNotification } =
    useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    if (filter === 'announcement') return notifications.filter((n) => n.type === 'announcement');
    return notifications;
  }, [notifications, filter]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Уведомления"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-96 max-h-[80vh] bg-card border rounded-xl shadow-xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-lg">Уведомления</h3>
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title="Отметить все"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="p-1.5 rounded hover:bg-muted transition-colors text-red-500"
                      title="Очистить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-1 px-4 py-2 border-b bg-muted/20">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      filter === f.key
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {f.label}
                    {f.key === 'unread' && unreadCount > 0 && (
                      <span className="ml-1.5 text-[10px] opacity-70">({unreadCount})</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <BellOff className="h-12 w-12 mb-2 opacity-50" />
                    <p className="text-sm">
                      {filter === 'unread' ? 'Нет непрочитанных' : filter === 'announcement' ? 'Нет объявлений' : 'Нет уведомлений'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filtered.map((notif) => {
                      const Icon = ICON_MAP[notif.type]?.icon || Bell;
                      const colorClass = ICON_MAP[notif.type]?.className || 'text-slate-500';
                      return (
                        <div
                          key={notif.id}
                          className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                            !notif.read ? 'bg-muted/30' : ''
                          }`}
                          onClick={() => markAsRead(notif.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 shrink-0 ${colorClass}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium truncate">{notif.title}</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notif.id);
                                  }}
                                  className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
                                >
                                  <X className="h-3 w-3 text-muted-foreground" />
                                </button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                              <p className="text-xs text-muted-foreground/60 mt-1">
                                {formatTime(notif.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
