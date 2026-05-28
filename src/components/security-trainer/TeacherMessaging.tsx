'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Users, MessageSquare, X, AlertCircle, Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Announcement } from '@/lib/auth-types';

const STORAGE_KEY = 'cybersec-announcements';

function loadAll(): Announcement[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[TeacherMessaging.tsx] loadAll failed:", e);
  }
  return [];
}

function saveAll(items: Announcement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function TeacherMessaging({ currentUser, groups = [] }: { currentUser: string; groups: string[] }) {
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
      toast.error('Заполните заголовок и сообщение');
      return;
    }

    const msg: Announcement = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      title: title.trim(),
      content: content.trim() + (targetGroup ? `\n\nГруппа: ${targetGroup}` : ''),
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
    toast.success('Сообщение отправлено студентам');
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
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <MessageSquare size={16} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Сообщения студентам</h2>
            <p className="text-xs text-muted-foreground">Отправка уведомлений и объявлений</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Send size={14} className="mr-1" /> {showForm ? 'Отмена' : 'Новое'}
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
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">Новое сообщение</h3>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Тема сообщения"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card"
                  maxLength={100}
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Текст сообщения..."
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card min-h-[80px] resize-y"
                  maxLength={1000}
                />
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Приоритет:</span>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')}
                      className="px-2 py-1.5 border border-border rounded-md text-xs bg-card"
                    >
                      <option value="low">Низкий</option>
                      <option value="normal">Обычный</option>
                      <option value="high">Высокий</option>
                    </select>
                  </div>
                  {groups.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-400" />
                      <select
                        value={targetGroup}
                        onChange={(e) => setTargetGroup(e.target.value)}
                        className="px-2 py-1.5 border border-border rounded-md text-xs bg-card"
                      >
                        <option value="">Всем студентам</option>
                        {groups.map((g) => (
                          <option key={g} value={g}>Группа: {g}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleSend}>
                    <Send size={14} className="mr-1" /> Отправить
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
              className="p-3 rounded-lg border border-border bg-card"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  {msg.priority === 'high' ? (
                    <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  ) : (
                    <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold">{msg.title}</p>
                      <Badge className={`text-[10px] ${
                        msg.priority === 'high' ? 'bg-red-100 text-red-700' :
                        msg.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                        'bg-muted text-foreground/70'
                      }`}>
                        {msg.priority === 'high' ? 'Важно' : msg.priority === 'normal' ? 'Обычное' : 'Инфо'}
                      </Badge>
                      {msg.content.includes('Группа:') && (
                        <Badge variant="secondary" className="text-[10px]">
                          {msg.content.split('Группа: ')[1]?.split('\n')[0]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{msg.content.split('\n')[0]}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(msg.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(msg.id)}
                  className="text-slate-300 hover:text-red-500 shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!showForm && recentMessages.length === 0 && (
        <div className="text-center py-8">
          <MessageSquare size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Нет отправленных сообщений</p>
        </div>
      )}
    </div>
  );
}
