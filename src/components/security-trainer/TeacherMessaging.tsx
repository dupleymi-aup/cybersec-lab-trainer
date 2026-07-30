'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, MessageSquare, X, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useDateFormatter } from '@/lib/format';
import type { Announcement } from '@/lib/auth-types';
import { logger } from '@/lib/logger';

const STORAGE_KEY = 'cybersec-announcements';

function loadAll(): Announcement[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    logger.warn('TeacherMessaging loadAll failed', { error: e });
  }
  return [];
}

function saveAll(items: Announcement[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    logger.warn('TeacherMessaging saveAll failed', { error: e });
  }
}

export default function TeacherMessaging({ currentUser, groups = [] }: { currentUser: string; groups: string[] }) {
  const formatDate = useDateFormatter();
  const t = useTranslations('teacher.messaging');
  const tc = useTranslations('common');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [targetGroup, setTargetGroup] = useState('');
  const [recentMessages, setRecentMessages] = useState<Announcement[]>([]);

  useEffect(() => {
    const all = loadAll();
    setRecentMessages(all.slice(0, 5));
  }, []);

  const handleSend = () => {
    if (!title.trim() || !content.trim()) {
      toast.error(t('fillRequired'));
      return;
    }

    const msg: Announcement = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      title: title.trim(),
      content: content.trim() + (targetGroup ? `\n\nGroup: ${targetGroup}` : ''),
      author: currentUser,
      createdAt: new Date().toISOString(),
      priority,
      active: true,
    };

    const all = loadAll();
    all.unshift(msg);
    saveAll(all);
    setRecentMessages(all.slice(0, 5));
    setShowForm(false);
    setTitle('');
    setContent('');
    setPriority('normal');
    setTargetGroup('');
    toast.success(t('sent'));
  };

  const handleDelete = (id: string) => {
    const all = loadAll().filter((a) => a.id !== id);
    saveAll(all);
    setRecentMessages(all.slice(0, 5));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
            <MessageSquare size={16} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold">{t('title')}</h2>
            <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Send size={14} className="mr-1" /> {showForm ? t('cancel') : t('newMessage')}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="space-y-3 p-4">
                <h3 className="text-sm font-semibold">{t('formTitle')}</h3>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('subjectPlaceholder')}
                  className="border-border bg-card w-full rounded-md border px-3 py-2 text-sm"
                  maxLength={100}
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('contentPlaceholder')}
                  className="border-border bg-card min-h-[80px] w-full resize-y rounded-md border px-3 py-2 text-sm"
                  maxLength={1000}
                />
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{t('priority')}</span>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')}
                      className="border-border bg-card rounded-md border px-2 py-1.5 text-xs"
                    >
                      <option value="low">{t('priorityLow')}</option>
                      <option value="normal">{t('priorityNormal')}</option>
                      <option value="high">{t('priorityHigh')}</option>
                    </select>
                  </div>
                  {groups.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-400" />
                      <select
                        value={targetGroup}
                        onChange={(e) => setTargetGroup(e.target.value)}
                        className="border-border bg-card rounded-md border px-2 py-1.5 text-xs"
                      >
                        <option value="">{t('allStudents')}</option>
                        {groups.map((g) => (
                          <option key={g} value={g}>
                            {t('groupLabel', { name: g })}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleSend}>
                    <Send size={14} className="mr-1" /> {t('send')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent messages */}
      {recentMessages.length > 0 && (
        <div className="space-y-2">
          {recentMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-border bg-card rounded-lg border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  {msg.priority === 'high' ? (
                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                  ) : (
                    <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold">{msg.title}</p>
                      <Badge
                        className={`text-[10px] ${
                          msg.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : msg.priority === 'normal'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-muted text-foreground/70'
                        }`}
                      >
                        {msg.priority === 'high' ? t('important') : msg.priority === 'normal' ? t('normal') : t('info')}
                      </Badge>
                      {msg.content.includes('Group: ') && (
                        <Badge variant="secondary" className="text-[10px]">
                          {msg.content.split('Group: ')[1]?.split('\n')[0]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px]">
                      {msg.content.split('\n')[0]}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">{formatDate(msg.createdAt)}</p>
                  </div>
                </div>
                <button type="button" onClick={() => handleDelete(msg.id)} className="shrink-0 text-slate-300 hover:text-red-500" aria-label={tc('delete')}>
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!showForm && recentMessages.length === 0 && (
        <div className="py-8 text-center">
          <MessageSquare size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="text-xs text-slate-400">{t('noMessages')}</p>
        </div>
      )}
    </div>
  );
}
