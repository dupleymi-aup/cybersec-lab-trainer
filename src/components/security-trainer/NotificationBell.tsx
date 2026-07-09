'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useNotificationStore, type Notification as NotifType } from '@/lib/notification-store';
import {
  Bell,
  BellOff,
  Check,
  Trash2,
  X,
  AlertTriangle,
  Trophy,
  BookOpen,
  Brain,
  Megaphone,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ICON_MAP: Record<NotifType['type'], { icon: typeof Trophy; className: string }> = {
  achievement: { icon: Trophy, className: 'text-amber-500' },
  progress: { icon: BookOpen, className: 'text-green-500' },
  quiz: { icon: Brain, className: 'text-blue-500' },
  warning: { icon: AlertTriangle, className: 'text-red-500' },
  system: { icon: Bell, className: 'text-muted-foreground' },
  announcement: { icon: Megaphone, className: 'text-purple-500' },
  deadline: { icon: Clock, className: 'text-orange-500' },
};

function formatTime(ts: number, t: (key: string) => string): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return t('justNow');
  if (m < 60) return `${m} ${t('minutesAgo')}`;
  if (h < 24) return `${h} ${t('hoursAgo')}`;
  return `${d} ${t('daysAgo')}`;
}

type FilterKey = 'all' | 'unread' | 'announcement';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, removeNotification } =
    useNotificationStore();
  const t = useTranslations('notificationBell');
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

  const FILTERS = useMemo(() => [
    { key: 'all', label: t('filterAll') },
    { key: 'unread', label: t('filterUnread') },
    { key: 'announcement', label: t('filterAnnouncements') },
  ], [t]);

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    if (filter === 'announcement') return notifications.filter((n) => n.type === 'announcement');
    return notifications;
  }, [notifications, filter]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-muted relative rounded-lg p-2 transition-colors"
        aria-label={t('title')}
      >
        <Bell className="text-foreground h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
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
              className="bg-card absolute top-full right-0 z-50 mt-2 flex max-h-[80vh] w-96 flex-col rounded-xl border shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b p-4">
                <h3 className="text-lg font-semibold">{t('title')}</h3>
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="hover:bg-muted rounded p-1.5 transition-colors"
                      title={t('markAllRead')}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="hover:bg-muted rounded p-1.5 text-red-500 transition-colors"
                      title={t('clear')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="hover:bg-muted rounded p-1.5 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-muted/20 flex gap-1 border-b px-4 py-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key as FilterKey)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      filter === f.key ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'
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
                  <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
                    <BellOff className="mb-2 h-12 w-12 opacity-50" />
                    <p className="text-sm">
                      {filter === 'unread'
                        ? t('noUnread')
                        : filter === 'announcement'
                          ? t('noAnnouncements')
                          : t('noNotifications')}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filtered.map((notif) => {
                      const Icon = ICON_MAP[notif.type]?.icon || Bell;
                      const colorClass = ICON_MAP[notif.type]?.className || 'text-muted-foreground';
                      return (
                        <div
                          key={notif.id}
                          className={`hover:bg-muted/50 cursor-pointer p-3 transition-colors ${
                            !notif.read ? 'bg-muted/30' : ''
                          }`}
                          onClick={() => markAsRead(notif.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 shrink-0 ${colorClass}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="truncate text-sm font-medium">{notif.title}</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notif.id);
                                  }}
                                  className="hover:bg-muted shrink-0 rounded p-0.5 transition-colors"
                                >
                                  <X className="text-muted-foreground h-3 w-3" />
                                </button>
                              </div>
                              <p className="text-muted-foreground mt-0.5 text-xs">{notif.message}</p>
                              <p className="text-muted-foreground/60 mt-1 text-xs">{formatTime(notif.timestamp, t)}</p>
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
