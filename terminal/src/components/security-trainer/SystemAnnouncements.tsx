'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Plus, Trash2, X, AlertTriangle, Info, AlertCircle,
  Calendar, CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Announcement } from '@/lib/auth-types';

const PRIORITY_CONFIG = {
  high: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
  normal: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  low: { icon: AlertTriangle, color: 'text-muted-foreground', bg: 'bg-secondary', border: 'border-border', badge: 'bg-muted text-foreground/70' },
};

async function fetchAnnouncements(activeOnly = false): Promise<Announcement[]> {
  try {
    const url = activeOnly ? '/api/admin/announcements?active=true' : '/api/admin/announcements';
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.announcements || [];
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[SystemAnnouncements.tsx] fetchAnnouncements failed:", e);
    return [];
  }
}

async function createAnnouncement(
  title: string,
  content: string,
  priority: string,
  expiresAt: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, priority, expiresAt: expiresAt || undefined }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[SystemAnnouncements.tsx] createAnnouncement failed:", e);
    return { success: false, error: 'Network error' };
  }
}

async function deleteAnnouncement(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/announcements?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[SystemAnnouncements.tsx] deleteAnnouncement failed:", e);
    return { success: false, error: 'Network error' };
  }
}

export default function SystemAnnouncements({ currentUser: _currentUser }: { currentUser: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [formExpiry, setFormExpiry] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await fetchAnnouncements();
    // Filter out expired ones client-side too (belt and suspenders)
    const active = data.filter(a => !a.expiresAt || new Date(a.expiresAt) >= new Date());
    setAnnouncements(active);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('Заполните заголовок и содержание');
      return;
    }

    const result = await createAnnouncement(formTitle.trim(), formContent.trim(), formPriority, formExpiry);
    if (!result.success) {
      toast.error(result.error || 'Ошибка создания');
      return;
    }

    setShowForm(false);
    setFormTitle('');
    setFormContent('');
    setFormPriority('normal');
    setFormExpiry('');
    toast.success('Объявление создано');
    loadData();
  };

  const handleDelete = async (id: string) => {
    const result = await deleteAnnouncement(id);
    if (!result.success) {
      toast.error(result.error || 'Ошибка удаления');
      return;
    }
    toast.success('Объявление удалено');
    loadData();
  };

  const handleClearExpired = async () => {
    // Reload from server — server already filters expired
    loadData();
    toast.info('Список обновлён');
  };

  const sorted = [...announcements].sort((a, b) => {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
            <Megaphone size={16} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Системные объявления</h2>
            <p className="text-xs text-muted-foreground">
              Создание и управление объявлениями для всех пользователей
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {announcements.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearExpired}>
              <X size={14} className="mr-1" /> Обновить
            </Button>
          )}
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} className="mr-1" /> Создать
          </Button>
        </div>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-indigo-200 bg-indigo-50/50">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">Новое объявление</h3>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Заголовок объявления"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card"
                  maxLength={100}
                />
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Содержание объявления..."
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card min-h-[80px] resize-y"
                  maxLength={500}
                />
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Приоритет:</span>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as 'low' | 'normal' | 'high')}
                      className="px-2 py-1.5 border border-border rounded-md text-xs bg-card"
                    >
                      <option value="low">Низкий</option>
                      <option value="normal">Обычный</option>
                      <option value="high">Высокий</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <input
                      type="date"
                      value={formExpiry}
                      onChange={(e) => setFormExpiry(e.target.value)}
                      className="px-2 py-1.5 border border-border rounded-md text-xs bg-card"
                    />
                    <span className="text-[10px] text-slate-400">(дата истечения)</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                    Отмена
                  </Button>
                  <Button size="sm" onClick={handleCreate}>
                    <CheckCircle2 size={14} className="mr-1" /> Опубликовать
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-8 text-muted-foreground text-sm">Загрузка...</div>
      )}

      {/* Announcements list */}
      {!loading && sorted.length === 0 ? (
        <div className="text-center py-12">
          <Megaphone size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Нет активных объявлений</p>
          <p className="text-xs text-slate-400 mt-1">
            Создайте первое объявление для всех пользователей
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {!loading && sorted.map((ann) => {
            const pConfig = PRIORITY_CONFIG[ann.priority];
            const Icon = pConfig.icon;
            const isExpiring = ann.expiresAt && new Date(ann.expiresAt).getTime() - Date.now() < 86400000 * 3;

            return (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className={`p-4 rounded-lg border ${pConfig.border} ${pConfig.bg}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5">
                      <Icon size={18} className={pConfig.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold">{ann.title}</h3>
                        <Badge className={`text-[10px] ${pConfig.badge}`}>
                          {ann.priority === 'high' ? 'Важно' : ann.priority === 'normal' ? 'Обычное' : 'Инфо'}
                        </Badge>
                        {isExpiring && (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200">
                            Скоро истекает
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{ann.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                        <span>{new Date(ann.createdAt).toLocaleDateString('ru-RU')}</span>
                        <span>Автор: {ann.author}</span>
                        {ann.expiresAt && (
                          <span>Действ. до: {new Date(ann.expiresAt).toLocaleDateString('ru-RU')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                    onClick={() => handleDelete(ann.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
