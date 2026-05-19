import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore, NotificationHelper } from '@/lib/notification-store';

describe('NotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.getState().clearNotifications();
  });

  it('should start with empty notifications', () => {
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
  });

  it('should add a notification', () => {
    useNotificationStore.getState().addNotification({
      type: 'achievement',
      title: 'Test',
      message: 'Test message',
    });
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.unreadCount).toBe(1);
    expect(state.notifications[0].title).toBe('Test');
    expect(state.notifications[0].read).toBe(false);
  });

  it('should mark notification as read', () => {
    useNotificationStore.getState().addNotification({
      type: 'progress',
      title: 'Test',
      message: 'Test',
    });
    const id = useNotificationStore.getState().notifications[0].id;
    useNotificationStore.getState().markAsRead(id);
    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.notifications[0].read).toBe(true);
  });

  it('should mark all as read', () => {
    useNotificationStore.getState().addNotification({ type: 'achievement', title: 'A', message: '' });
    useNotificationStore.getState().addNotification({ type: 'quiz', title: 'B', message: '' });
    useNotificationStore.getState().markAllAsRead();
    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.notifications.every((n) => n.read)).toBe(true);
  });

  it('should remove a notification', () => {
    useNotificationStore.getState().addNotification({ type: 'system', title: 'Test', message: '' });
    const id = useNotificationStore.getState().notifications[0].id;
    useNotificationStore.getState().removeNotification(id);
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });

  it('should clear all notifications', () => {
    useNotificationStore.getState().addNotification({ type: 'achievement', title: 'A', message: '' });
    useNotificationStore.getState().addNotification({ type: 'quiz', title: 'B', message: '' });
    useNotificationStore.getState().clearNotifications();
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('should limit notifications to 100', () => {
    for (let i = 0; i < 110; i++) {
      useNotificationStore.getState().addNotification({ type: 'system', title: `Notif ${i}`, message: '' });
    }
    expect(useNotificationStore.getState().notifications.length).toBeLessThanOrEqual(100);
  });
});

describe('NotificationHelper', () => {
  beforeEach(() => {
    useNotificationStore.getState().clearNotifications();
  });

  it('should create achievement notification', () => {
    NotificationHelper.achievementUnlocked('Test Achievement', 'Test description');
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].type).toBe('achievement');
    expect(state.notifications[0].title).toContain('Достижение');
  });

  it('should create module completion notification', () => {
    NotificationHelper.moduleCompleted('SQL-инъекции');
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].type).toBe('progress');
    expect(state.notifications[0].message).toContain('SQL-инъекции');
  });

  it('should create quiz completion notification', () => {
    NotificationHelper.quizCompleted('OWASP', 85);
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].type).toBe('quiz');
    expect(state.notifications[0].message).toContain('OWASP');
    expect(state.notifications[0].message).toContain('85');
  });

  it('should create system warning notification', () => {
    NotificationHelper.systemWarning('Test warning');
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].type).toBe('warning');
    expect(state.notifications[0].message).toBe('Test warning');
  });
});
