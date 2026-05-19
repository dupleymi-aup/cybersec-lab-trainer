'use client';

import { useState } from 'react';
import { useNotificationStore, type Notification } from '@/lib/notification-store';
import { Bell, BellOff, Check, Trash2, X, AlertTriangle, Trophy, BookOpen, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'achievement':
      return <Trophy className="h-4 w-4 text-amber-500" />;
    case 'progress':
      return <BookOpen className="h-4 w-4 text-green-500" />;
    case 'quiz':
      return <Brain className="h-4 w-4 text-blue-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  return `${days} дн. назад`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, removeNotification } =
    useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Уведомления"
      >
        {unreadCount > 0 ? (
          <Bell className="h-5 w-5 text-foreground" />
        ) : (
          <BellOff className="h-5 w-5 text-muted-foreground" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-96 max-h-[80vh] bg-card border rounded-xl shadow-xl z-50 flex flex-col"
              style={{ right: '0' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-lg">Уведомления</h3>
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title="Отметить все как прочитанные"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="p-1.5 rounded hover:bg-muted transition-colors text-red-500"
                      title="Очистить все"
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

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <BellOff className="h-12 w-12 mb-2 opacity-50" />
                    <p className="text-sm">Нет уведомлений</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                          !notif.read ? 'bg-muted/30' : ''
                        }`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">{getNotificationIcon(notif.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium truncate">{notif.title}</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notif.id);
                                }}
                                className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                                style={{ opacity: 0.5 }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTime(notif.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
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
