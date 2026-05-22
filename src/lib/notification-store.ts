import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'achievement' | 'progress' | 'quiz' | 'system' | 'warning' | 'announcement' | 'deadline';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
}

let idCounter = 0;

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      addNotification: (notification) => {
        const id = `notif-${Date.now()}-${idCounter++}`;
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: Date.now(),
          read: false,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 100),
          unreadCount: state.unreadCount + 1,
        }));
      },
      markAsRead: (id) => {
        set((state) => {
          const notif = state.notifications.find((n) => n.id === id);
          if (!notif || notif.read) return state;
          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },
      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },
      removeNotification: (id) => {
        set((state) => {
          const notif = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notif && !notif.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      },
    }),
    {
      name: 'cybersec-notifications',
      version: 1,
      partialize: (state) => ({
        notifications: state.notifications.map(({ action: _, ...rest }) => rest),
        unreadCount: state.unreadCount,
      }),
    }
  )
);

/** Helper to create common notification types */
export const NotificationHelper = {
  achievementUnlocked: (name: string, description: string) => {
    useNotificationStore.getState().addNotification({
      type: 'achievement',
      title: '🏆 Достижение разблокировано!',
      message: `${name}: ${description}`,
    });
  },
  moduleCompleted: (moduleName: string) => {
    useNotificationStore.getState().addNotification({
      type: 'progress',
      title: '✅ Модуль завершён',
      message: `Вы успешно завершили модуль "${moduleName}"`,
    });
  },
  quizCompleted: (category: string, score: number) => {
    useNotificationStore.getState().addNotification({
      type: 'quiz',
      title: score >= 80 ? '🎉 Отличный результат!' : '📝 Квиз завершён',
      message: `Категория: ${category}, Результат: ${score}%`,
    });
  },
  streakAchieved: (count: number) => {
    useNotificationStore.getState().addNotification({
      type: 'achievement',
      title: '🔥 Серия!',
      message: `Вы набрали серию из ${count} квизов с результатом 80%+`,
    });
  },
  systemWarning: (message: string) => {
    useNotificationStore.getState().addNotification({
      type: 'warning',
      title: '⚠️ Внимание',
      message,
    });
  },
  announcement: (title: string, message: string, priority?: 'low' | 'normal' | 'high') => {
    useNotificationStore.getState().addNotification({
      type: 'announcement',
      title: priority === 'high' ? '📢 Важное объявление' : '📢 Объявление',
      message,
    });
  },
  deadlineWarning: (title: string, daysLeft: number) => {
    const urgency = daysLeft <= 0
      ? 'Просрочен!'
      : daysLeft === 1
        ? 'Завтра последний день!'
        : `Осталось ${daysLeft} дн.`;
    useNotificationStore.getState().addNotification({
      type: 'deadline',
      title: `Дедлайн: ${title}`,
      message: urgency,
    });
  },
};

/** Load announcements from API into notifications */
export async function loadAnnouncementsIntoNotifications() {
  try {
    const res = await fetch('/api/announcements');
    if (!res.ok) return;
    const data = await res.json();
    const announcements = (data.announcements || []) as Array<{
      id: string; title: string; content: string; priority: string;
    }>;
    const store = useNotificationStore.getState();
    const existing = new Set(store.notifications.map((n) => n.title + n.message));
    for (const a of announcements.slice(0, 10)) {
      const key = a.title + a.content.split('\n')[0];
      if (!existing.has(key)) {
        store.addNotification({
          type: 'announcement',
          title: a.priority === 'high' ? '📢 Важное объявление' : '📢 Объявление',
          message: `${a.title}: ${a.content.split('\n')[0]}`,
        });
      }
    }
  } catch { /* ignore */ }
}
