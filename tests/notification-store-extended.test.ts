import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('zustand/middleware', () => ({
  persist: (fn: unknown) => fn,
}));

import {
  useNotificationStore,
  NotificationHelper,
  loadAnnouncementsIntoNotifications,
} from '@/lib/notification-store';

describe('notification-store extended', () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [], unreadCount: 0 });
    vi.clearAllMocks();
  });

  describe('addNotification', () => {
    it('should add a notification with generated id and timestamp', () => {
      const { addNotification } = useNotificationStore.getState();
      addNotification({ type: 'system', title: 'Test', message: 'msg' });
      const { notifications, unreadCount } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].id).toMatch(/^notif-/);
      expect(notifications[0].timestamp).toBeGreaterThan(0);
      expect(notifications[0].read).toBe(false);
      expect(unreadCount).toBe(1);
    });

    it('should cap at 100 notifications', () => {
      const { addNotification } = useNotificationStore.getState();
      for (let i = 0; i < 110; i++) {
        addNotification({ type: 'system', title: `n${i}`, message: 'm' });
      }
      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(100);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', () => {
      const { addNotification } = useNotificationStore.getState();
      addNotification({ type: 'quiz', title: 'Q', message: 'm' });
      const { notifications } = useNotificationStore.getState();
      const id = notifications[0].id;

      useNotificationStore.getState().markAsRead(id);
      const state = useNotificationStore.getState();
      expect(state.notifications[0].read).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    it('should not decrement unread if already read', () => {
      const { addNotification } = useNotificationStore.getState();
      addNotification({ type: 'quiz', title: 'Q', message: 'm' });
      const id = useNotificationStore.getState().notifications[0].id;
      useNotificationStore.getState().markAsRead(id);
      useNotificationStore.getState().markAsRead(id);
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('should ignore non-existent id', () => {
      useNotificationStore.getState().markAsRead('fake-id');
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('should leave other notifications untouched when marking one as read', () => {
      const { addNotification } = useNotificationStore.getState();
      addNotification({ type: 'system', title: 'a', message: 'm' });
      addNotification({ type: 'system', title: 'b', message: 'm' });
      const [first, second] = useNotificationStore.getState().notifications;
      useNotificationStore.getState().markAsRead(first.id);
      const state = useNotificationStore.getState();
      expect(state.notifications[0].read).toBe(true);
      expect(state.notifications[1].read).toBe(false);
      expect(state.notifications[1].id).toBe(second.id);
      expect(state.unreadCount).toBe(1);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all as read', () => {
      const { addNotification } = useNotificationStore.getState();
      addNotification({ type: 'system', title: 'a', message: 'm' });
      addNotification({ type: 'system', title: 'b', message: 'm' });
      expect(useNotificationStore.getState().unreadCount).toBe(2);
      useNotificationStore.getState().markAllAsRead();
      const state = useNotificationStore.getState();
      expect(state.unreadCount).toBe(0);
      expect(state.notifications.every((n) => n.read)).toBe(true);
    });
  });

  describe('clearNotifications', () => {
    it('should clear all', () => {
      const { addNotification } = useNotificationStore.getState();
      addNotification({ type: 'system', title: 'a', message: 'm' });
      useNotificationStore.getState().clearNotifications();
      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(0);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('removeNotification', () => {
    it('should remove by id and decrement unread if unread', () => {
      const { addNotification } = useNotificationStore.getState();
      addNotification({ type: 'system', title: 'a', message: 'm' });
      const id = useNotificationStore.getState().notifications[0].id;
      useNotificationStore.getState().removeNotification(id);
      expect(useNotificationStore.getState().notifications).toHaveLength(0);
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('should not decrement unread if notification was already read', () => {
      const { addNotification } = useNotificationStore.getState();
      addNotification({ type: 'system', title: 'a', message: 'm' });
      const id = useNotificationStore.getState().notifications[0].id;
      useNotificationStore.getState().markAsRead(id);
      useNotificationStore.getState().removeNotification(id);
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  describe('NotificationHelper', () => {
    it('achievementUnlocked should add notification', () => {
      NotificationHelper.achievementUnlocked('Badge', 'Desc');
      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('achievement');
    });

    it('moduleCompleted should add notification', () => {
      NotificationHelper.moduleCompleted('SQL Injection');
      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].type).toBe('progress');
      expect(notifications[0].message).toContain('SQL Injection');
    });

    it('quizCompleted with high score', () => {
      NotificationHelper.quizCompleted('XSS', 95);
      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].title).toBe('Great Result!');
    });

    it('quizCompleted with low score', () => {
      NotificationHelper.quizCompleted('CSRF', 50);
      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].title).toBe('Quiz Completed');
    });

    it('streakAchieved', () => {
      NotificationHelper.streakAchieved(5);
      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].message).toContain('5');
    });

    it('systemWarning', () => {
      NotificationHelper.systemWarning('Disk full');
      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].type).toBe('warning');
    });

    it('announcement normal priority', () => {
      NotificationHelper.announcement('Title', 'Body', 'normal');
      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].title).toBe('Announcement');
    });

    it('announcement high priority', () => {
      NotificationHelper.announcement('Title', 'Body', 'high');
      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].title).toBe('Important Announcement');
    });

    it('deadlineWarning overdue', () => {
      NotificationHelper.deadlineWarning('Lab 1', 0);
      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].message).toBe('Overdue!');
    });

    it('deadlineWarning 1 day left', () => {
      NotificationHelper.deadlineWarning('Lab 2', 1);
      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].message).toBe('Last day tomorrow!');
    });

    it('deadlineWarning multiple days', () => {
      NotificationHelper.deadlineWarning('Lab 3', 5);
      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].message).toBe('5 days left');
    });
  });

  describe('loadAnnouncementsIntoNotifications', () => {
    it('should fetch and add announcements', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          announcements: [
            { id: '1', title: 'Title', content: 'Content line 1\nmore', priority: 'normal' },
            { id: '2', title: 'Hi', content: 'Hi content', priority: 'high' },
          ],
        }),
      });
      await loadAnnouncementsIntoNotifications();
      const { notifications } = useNotificationStore.getState();
      expect(notifications.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle fetch failure gracefully', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      await loadAnnouncementsIntoNotifications();
      const { logger } = await import('@/lib/logger');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle non-ok response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });
      await loadAnnouncementsIntoNotifications();
      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it('should not duplicate existing announcements', async () => {
      const { addNotification } = useNotificationStore.getState();
      // Dedup key: existing uses title+message, announcements use title+content.split('\n')[0]
      addNotification({ type: 'announcement', title: 'Title', message: 'Content line 1' });
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          announcements: [
            { id: '1', title: 'Title', content: 'Content line 1\nmore', priority: 'normal' },
          ],
        }),
      });
      await loadAnnouncementsIntoNotifications();
      expect(useNotificationStore.getState().notifications).toHaveLength(1);
    });

    it('should handle response without announcements field', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });
      await loadAnnouncementsIntoNotifications();
      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });
  });
});
