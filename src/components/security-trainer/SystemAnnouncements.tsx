'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Plus, Trash2, X, AlertTriangle, Info, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useDateFormatter } from '@/lib/format';
import type { Announcement } from '@/lib/auth-types';
import { logger } from '@/lib/logger';

const PRIORITY_CONFIG = {
  high: {
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
  },
  normal: {
    icon: Info,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
  low: {
    icon: AlertTriangle,
    color: 'text-muted-foreground',
    bg: 'bg-secondary',
    border: 'border-border',
    badge: 'bg-muted text-foreground/70',
  },
};

async function fetchAnnouncements(activeOnly = false): Promise<Announcement[]> {
  try {
    const url = activeOnly ? '/api/admin/announcements?active=true' : '/api/admin/announcements';
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.announcements || [];
  } catch (e) {
    if (process.env.NODE_ENV === 'development')
      logger.warn('SystemAnnouncements fetchAnnouncements failed', { error: e });
    return [];
  }
}

async function createAnnouncement(
  title: string,
  content: string,
  priority: string,
  expiresAt: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        priority,
        expiresAt: expiresAt || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch (e) {
    if (process.env.NODE_ENV === 'development')
      logger.warn('SystemAnnouncements createAnnouncement failed', { error: e });
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
    if (process.env.NODE_ENV === 'development')
      logger.warn('SystemAnnouncements deleteAnnouncement failed', { error: e });
    return { success: false, error: 'Network error' };
  }
}

export default function SystemAnnouncements({ currentUser: _currentUser }: { currentUser: string }) {
  const t = useTranslations('systemAnnouncements');
  const formatDate = useDateFormatter();
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
    const active = data.filter((a) => !a.expiresAt || new Date(a.expiresAt) >= new Date());
    setAnnouncements(active);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error(t('fillTitleAndContent'));
      return;
    }

    const result = await createAnnouncement(formTitle.trim(), formContent.trim(), formPriority, formExpiry);
    if (!result.success) {
      toast.error(result.error || t('creationError'));
      return;
    }

    setShowForm(false);
    setFormTitle('');
    setFormContent('');
    setFormPriority('normal');
    setFormExpiry('');
    toast.success(t('announcementCreated'));
    loadData();
  };

  const handleDelete = async (id: string) => {
    const result = await deleteAnnouncement(id);
    if (!result.success) {
      toast.error(result.error || t('deletionError'));
      return;
    }
    toast.success(t('announcementDeleted'));
    loadData();
  };

  const handleClearExpired = async () => {
    // Reload from server — server already filters expired
    loadData();
    toast.info(t('listRefreshed'));
  };

  const sorted = [...announcements].sort((a, b) => {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
            <Megaphone size={16} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold">{t('title')}</h2>
            <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {announcements.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearExpired}>
              <X size={14} className="mr-1" /> {t('refresh')}
            </Button>
          )}
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} className="mr-1" /> {t('create')}
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
              <CardContent className="space-y-3 p-4">
                <h3 className="text-sm font-semibold">{t('newAnnouncement')}</h3>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={t('titlePlaceholder')}
                  className="border-border bg-card w-full rounded-md border px-3 py-2 text-sm"
                  maxLength={100}
                />
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={t('contentPlaceholder')}
                  className="border-border bg-card min-h-[80px] w-full resize-y rounded-md border px-3 py-2 text-sm"
                  maxLength={500}
                />
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{t('priority')}:</span>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as 'low' | 'normal' | 'high')}
                      className="border-border bg-card rounded-md border px-2 py-1.5 text-xs"
                    >
                      <option value="low">{t('priorityLow')}</option>
                      <option value="normal">{t('priorityNormal')}</option>
                      <option value="high">{t('priorityHigh')}</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <input
                      type="date"
                      value={formExpiry}
                      onChange={(e) => setFormExpiry(e.target.value)}
                      className="border-border bg-card rounded-md border px-2 py-1.5 text-xs"
                    />
                    <span className="text-[10px] text-slate-400">({t('expiryDate')})</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                    {t('cancel')}
                  </Button>
                  <Button size="sm" onClick={handleCreate}>
                    <CheckCircle2 size={14} className="mr-1" /> {t('publish')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {loading && <div className="text-muted-foreground py-8 text-center text-sm">{t('loading')}</div>}

      {/* Announcements list */}
      {!loading && sorted.length === 0 ? (
        <div className="py-12 text-center">
          <Megaphone size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-muted-foreground text-sm">{t('noAnnouncements')}</p>
          <p className="mt-1 text-xs text-slate-400">{t('createFirstAnnouncement')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {!loading &&
            sorted.map((ann) => {
              const pConfig = PRIORITY_CONFIG[ann.priority];
              const Icon = pConfig.icon;
              const isExpiring = ann.expiresAt && new Date(ann.expiresAt).getTime() - Date.now() < 86400000 * 3;

              return (
                <motion.div
                  key={ann.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`rounded-lg border p-4 ${pConfig.border} ${pConfig.bg}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="mt-0.5">
                        <Icon size={18} className={pConfig.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold">{ann.title}</h3>
                          <Badge className={`text-[10px] ${pConfig.badge}`}>
                            {ann.priority === 'high' ? t('priorityHighBadge') : ann.priority === 'normal' ? t('priorityNormalBadge') : t('priorityLowBadge')}
                          </Badge>
                          {isExpiring && (
                            <Badge variant="outline" className="border-amber-200 text-[10px] text-amber-600">
                              {t('expiringSoon')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs whitespace-pre-wrap">{ann.content}</p>
                        <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
                          <span>{formatDate(ann.createdAt)}</span>
                          <span>{t('author')}: {ann.author}</span>
                          {ann.expiresAt && <span>{t('validUntil')}: {formatDate(ann.expiresAt)}</span>}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDelete(ann.id)}
                      aria-label="Delete announcement"
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
