import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore, NotificationHelper, loadAnnouncementsIntoNotifications } from '@/lib/notification-store';

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

  it('should create streak achievement notification', () => {
    NotificationHelper.streakAchieved(5);
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].type).toBe('achievement');
    expect(state.notifications[0].title).toContain('Серия');
    expect(state.notifications[0].message).toContain('5');
  });

  it('should create announcement notification', () => {
    NotificationHelper.announcement('Test Title', 'Test content');
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].type).toBe('announcement');
  });

  it('should create important announcement with high priority', () => {
    NotificationHelper.announcement('Urgent', 'Very important', 'high');
    const state = useNotificationStore.getState();
    expect(state.notifications[0].title).toContain('Важное');
  });

  it('should create deadline warning with days left', () => {
    NotificationHelper.deadlineWarning('Тест', 3);
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].type).toBe('deadline');
    expect(state.notifications[0].message).toContain('3');
  });

  it('should create deadline warning with overdue message', () => {
    NotificationHelper.deadlineWarning('Просрочка', 0);
    const state = useNotificationStore.getState();
    expect(state.notifications[0].message).toContain('Просрочен');
  });

  it('should create deadline warning with urgent message for 1 day', () => {
    NotificationHelper.deadlineWarning('Срочно', 1);
    const state = useNotificationStore.getState();
    expect(state.notifications[0].message).toContain('последний');
  });

  it('should create quiz notification with low score title', () => {
    NotificationHelper.quizCompleted('XSS', 45);
    const state = useNotificationStore.getState();
    expect(state.notifications[0].title).toContain('завершён');
    expect(state.notifications[0].message).toContain('45');
  });
});

describe('loadAnnouncementsIntoNotifications', () => {
  beforeEach(() => {
    useNotificationStore.getState().clearNotifications();
  });

  it('should load announcements from API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        announcements: [
          { id: '1', title: 'Maintenance', content: 'System will be down', priority: 'high' },
          { id: '2', title: 'New Module', content: 'XSS module added', priority: 'normal' },
        ],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await loadAnnouncementsIntoNotifications();
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(2);
    expect(state.notifications[0].type).toBe('announcement');
    expect(mockFetch).toHaveBeenCalledWith('/api/announcements');

    vi.unstubAllGlobals();
  });

  it('should cap announcements at 10 per load', async () => {
    const items = Array.from({ length: 15 }, (_, i) => ({
      id: String(i), title: `Announcement ${i}`, content: `Content ${i}`, priority: 'normal',
    }));
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ announcements: items }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await loadAnnouncementsIntoNotifications();
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(10);

    vi.unstubAllGlobals();
  });

  it('should handle API failure gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', mockFetch);

    await loadAnnouncementsIntoNotifications();
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(0);

    vi.unstubAllGlobals();
  });

  it('should deduplicate announcements on repeated loads', async () => {
    const announcement = { id: '1', title: 'Maintenance', content: 'System will be down\nDetails here', priority: 'high' };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ announcements: [announcement] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await loadAnnouncementsIntoNotifications();
    expect(useNotificationStore.getState().notifications).toHaveLength(1);

    await loadAnnouncementsIntoNotifications();
    expect(useNotificationStore.getState().notifications).toHaveLength(1);

    vi.unstubAllGlobals();
  });

  it('should handle network errors gracefully', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    await loadAnnouncementsIntoNotifications();
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(0);

    vi.unstubAllGlobals();
  });
});
