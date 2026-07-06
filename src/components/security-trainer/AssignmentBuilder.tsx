'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Calendar,
  Clock,
  Users,
  Award,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileBarChart,
} from 'lucide-react';
import { toast } from 'sonner';
import { modules } from '@/lib/data';
import { getAuthHeaders } from '@/lib/store';
import { logger } from '@/lib/logger';

interface Assignment {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'code-review' | 'attack' | 'writeup' | 'custom';
  moduleId: string;
  content: string;
  maxScore: number;
  passScore: number;
  autoGrade: boolean;
  timeLimit: number | null;
  attempts: number;
  group: string;
  dueAt: string | null;
  published: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: { id: string; fullName: string; role: string };
  _count: { submissions: number };
}

interface AssignmentForm {
  title: string;
  description: string;
  type: 'quiz' | 'code-review' | 'attack' | 'writeup' | 'custom';
  moduleId: string;
  content: string;
  maxScore: number;
  passScore: number;
  autoGrade: boolean;
  timeLimit: string;
  attempts: number;
  group: string;
  dueAt: string;
  published: boolean;
}

const emptyForm: AssignmentForm = {
  title: '',
  description: '',
  type: 'quiz',
  moduleId: '',
  content: '',
  maxScore: 100,
  passScore: 60,
  autoGrade: false,
  timeLimit: '',
  attempts: 1,
  group: '',
  dueAt: '',
  published: false,
};

const typeLabels: Record<Assignment['type'], string> = {
  quiz: 'Квиз',
  'code-review': 'Code Review',
  attack: 'Атака',
  writeup: 'Write-up',
  custom: 'Своё',
};

const typeIcons: Record<Assignment['type'], typeof FileText> = {
  quiz: FileText,
  'code-review': Edit2,
  attack: AlertCircle,
  writeup: FileBarChart,
  custom: FileText,
};

const typeColors: Record<Assignment['type'], string> = {
  quiz: 'bg-blue-100 text-blue-700 border-blue-200',
  'code-review': 'bg-purple-100 text-purple-700 border-purple-200',
  attack: 'bg-red-100 text-red-700 border-red-200',
  writeup: 'bg-green-100 text-green-700 border-green-200',
  custom: 'bg-gray-100 text-gray-700 border-gray-200',
};

// Get unique groups from students list
function useGroups() {
  const [groups, setGroups] = useState<string[]>([]);

  useEffect(() => {
    import('@/lib/auth-store').then(({ getAllUsers }) => {
      getAllUsers().then((users) => {
        const unique = [...new Set(users.map((u) => u.group).filter(Boolean))];
        setGroups(unique);
      });
    });
  }, []);

  return groups;
}

export default function AssignmentBuilder() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AssignmentForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [viewingId, setViewingId] = useState<string | null>(null);
  const groups = useGroups();

  const fetchAssignments = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/assignments', { headers });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      } else {
        toast.error('Не удалось загрузить задания');
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development')
        logger.warn('AssignmentBuilder fetchAssignments failed', { error: e });
      toast.error('Ошибка сети при загрузке заданий');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const openCreateForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (a: Assignment) => {
    setForm({
      title: a.title,
      description: a.description,
      type: a.type,
      moduleId: a.moduleId,
      content: a.content,
      maxScore: a.maxScore,
      passScore: a.passScore,
      autoGrade: a.autoGrade,
      timeLimit: a.timeLimit?.toString() ?? '',
      attempts: a.attempts,
      group: a.group,
      dueAt: a.dueAt ? a.dueAt.slice(0, 16) : '',
      published: a.published,
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Введите название задания');
      return;
    }
    if (form.passScore > form.maxScore) {
      toast.error('Проходной балл не может быть больше максимального');
      return;
    }

    setSaving(true);
    try {
      const body = {
        ...form,
        maxScore: Number(form.maxScore),
        passScore: Number(form.passScore),
        attempts: Number(form.attempts),
        timeLimit: form.timeLimit ? Number(form.timeLimit) : undefined,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
        content: form.content || '',
      };

      const url = editingId ? `/api/assignments/${editingId}` : '/api/assignments';
      const method = editingId ? 'PUT' : 'POST';
      const authHeaders = await getAuthHeaders();

      const res = await fetch(url, {
        method,
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingId ? 'Задание обновлено' : 'Задание создано');
        setShowForm(false);
        setEditingId(null);
        fetchAssignments();
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(err.error || 'Ошибка сохранения');
      }
    } catch (e) {
logger.warn('AssignmentBuilder handleSubmit failed', { error: e });
      toast.error('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить это задание? Все submissions тоже будут удалены.')) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/assignments/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        toast.success('Задание удалено');
        fetchAssignments();
      } else {
        toast.error('Не удалось удалить');
      }
    } catch (e) {
logger.warn('AssignmentBuilder handleDelete failed', { error: e });
      toast.error('Ошибка сети');
    }
  };

  const togglePublished = async (a: Assignment) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/assignments/${a.id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !a.published }),
      });
      if (res.ok) {
        toast.success(a.published ? 'Скрыто из публикации' : 'Опубликовано');
        fetchAssignments();
      }
    } catch (e) {
logger.warn('AssignmentBuilder togglePublished failed', { error: e });
      toast.error('Ошибка');
    }
  };

  const filtered = assignments.filter((a) => {
    if (filter === 'published') return a.published;
    if (filter === 'draft') return !a.published;
    return true;
  });

  // View single assignment detail
  if (viewingId) {
    const a = assignments.find((x) => x.id === viewingId);
    if (!a) return null;
    const TypeIcon = typeIcons[a.type];

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${typeColors[a.type]}`}>
                  <TypeIcon size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{a.title}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={a.published ? 'default' : 'secondary'} className="text-[10px]">
                      {a.published ? 'Опубликовано' : 'Черновик'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {typeLabels[a.type]}
                    </Badge>
                    {a.moduleId && (
                      <Badge variant="outline" className="text-[10px]">
                        {modules.find((m) => m.id === a.moduleId)?.title || a.moduleId}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setViewingId(null)}>
                <X size={16} /> Назад
              </Button>
            </div>

            {a.description && <p className="text-muted-foreground text-sm">{a.description}</p>}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Макс. балл</p>
                <p className="text-lg font-bold text-violet-600">{a.maxScore}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Проходной</p>
                <p className="text-lg font-bold text-emerald-600">{a.passScore}%</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Попытки</p>
                <p className="text-lg font-bold">{a.attempts === 0 ? '∞' : a.attempts}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Submission'ы</p>
                <p className="text-lg font-bold">{a._count?.submissions ?? 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Таймер</p>
                <p className="font-medium">{a.timeLimit ? `${a.timeLimit} мин` : 'Без лимита'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Автопроверка</p>
                <p className="font-medium">{a.autoGrade ? 'Да' : 'Нет'}</p>
              </div>
              {a.dueAt && (
                <div>
                  <p className="text-muted-foreground">Дедлайн</p>
                  <p className="font-medium">
                    {new Date(a.dueAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              {a.group && (
                <div>
                  <p className="text-muted-foreground">Группа</p>
                  <p className="font-medium">{a.group}</p>
                </div>
              )}
            </div>

            {a.content && (
              <div>
                <p className="mb-2 text-sm font-medium">Содержимое</p>
                <pre className="bg-muted max-h-40 overflow-auto rounded-lg p-3 text-xs whitespace-pre-wrap">
                  {a.content}
                </pre>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => {
                  openEditForm(a);
                  setViewingId(null);
                }}
              >
                <Edit2 size={14} className="mr-1" /> Редактировать
              </Button>
              <Button size="sm" variant={a.published ? 'outline' : 'default'} onClick={() => togglePublished(a)}>
                {a.published ? (
                  <>
                    <EyeOff size={14} className="mr-1" /> Скрыть
                  </>
                ) : (
                  <>
                    <Eye size={14} className="mr-1" /> Опубликовать
                  </>
                )}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(a.id)}>
                <Trash2 size={14} className="mr-1" /> Удалить
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Form modal
  if (showForm) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                {editingId ? (
                  <>
                    <Edit2 size={20} /> Редактирование задания
                  </>
                ) : (
                  <>
                    <Plus size={20} /> Новое задание
                  </>
                )}
              </h2>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                <X size={16} />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Title */}
              <div className="md:col-span-2">
                <Label className="mb-1 block text-sm font-medium">Название *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Например: SQL Injection — основы"
                />
              </div>

              {/* Type */}
              <div>
                <Label className="mb-1 block text-sm font-medium">Тип задания</Label>
                <Tabs value={form.type} onValueChange={(v) => setForm({ ...form, type: v as AssignmentForm['type'] })}>
                  <TabsList className="grid w-full grid-cols-5">
                    {(Object.keys(typeLabels) as Assignment['type'][]).map((t) => (
                      <TabsTrigger key={t} value={t} className="px-1 text-[10px]">
                        {typeLabels[t]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Module */}
              <div>
                <Label className="mb-1 block text-sm font-medium">Привязка к модулю</Label>
                <select
                  value={form.moduleId}
                  onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
                  className="border-border bg-card w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Без привязки</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <Label className="mb-1 block text-sm font-medium">Описание</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Краткое описание задания"
                />
              </div>

              {/* Content */}
              <div className="md:col-span-2">
                <Label className="mb-1 block text-sm font-medium">Содержимое (JSON или текст)</Label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder='{"questions": [...]}'
                  className="border-border bg-card min-h-[80px] w-full rounded-md border px-3 py-2 font-mono text-sm"
                />
              </div>

              {/* Max Score */}
              <div>
                <Label className="mb-1 block text-sm font-medium">Макс. балл</Label>
                <Input
                  type="number"
                  value={form.maxScore}
                  onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })}
                  min={1}
                  max={1000}
                />
              </div>

              {/* Pass Score */}
              <div>
                <Label className="mb-1 block text-sm font-medium">Проходной балл (%)</Label>
                <Input
                  type="number"
                  value={form.passScore}
                  onChange={(e) => setForm({ ...form, passScore: Number(e.target.value) })}
                  min={0}
                  max={100}
                />
              </div>

              {/* Time Limit */}
              <div>
                <Label className="mb-1 block text-sm font-medium">Таймер (минуты, пусто = без лимита)</Label>
                <Input
                  type="number"
                  value={form.timeLimit}
                  onChange={(e) => setForm({ ...form, timeLimit: e.target.value })}
                  min={1}
                  placeholder="60"
                />
              </div>

              {/* Attempts */}
              <div>
                <Label className="mb-1 block text-sm font-medium">Попытки (0 = безлимит)</Label>
                <Input
                  type="number"
                  value={form.attempts}
                  onChange={(e) => setForm({ ...form, attempts: Number(e.target.value) })}
                  min={0}
                  max={10}
                />
              </div>

              {/* Due Date */}
              <div>
                <Label className="mb-1 block text-sm font-medium">Дедлайн</Label>
                <Input
                  type="datetime-local"
                  value={form.dueAt}
                  onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                />
              </div>

              {/* Group */}
              <div>
                <Label className="mb-1 block text-sm font-medium">Группа (пусто = все)</Label>
                <select
                  value={form.group}
                  onChange={(e) => setForm({ ...form, group: e.target.value })}
                  className="border-border bg-card w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Все студенты</option>
                  {groups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Switches */}
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.autoGrade}
                  onCheckedChange={(v) => setForm({ ...form, autoGrade: v })}
                  id="autoGrade"
                />
                <Label htmlFor="autoGrade" className="text-sm">
                  Автопроверка
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.published}
                  onCheckedChange={(v) => setForm({ ...form, published: v })}
                  id="published"
                />
                <Label htmlFor="published" className="text-sm">
                  Опубликовать сразу
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
                Отмена
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />}
                {editingId ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Assignment list
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <FileText size={20} className="text-violet-500" />
          Задания
        </h2>
        <Button size="sm" onClick={openCreateForm}>
          <Plus size={14} className="mr-1" /> Создать
        </Button>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="grid w-fit grid-cols-3">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="published">Опубликованные</TabsTrigger>
          <TabsTrigger value="draft">Черновики</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <Loader2 size={32} className="mx-auto mb-3 animate-spin opacity-50" />
          <p className="text-sm">Загрузка заданий...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center text-slate-400">
            <FileText size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {filter === 'all'
                ? 'Нет заданий. Создайте первое!'
                : filter === 'published'
                  ? 'Нет опубликованных заданий'
                  : 'Нет черновиков'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const TypeIcon = typeIcons[a.type];
            const dueDate = a.dueAt ? new Date(a.dueAt) : null;
            const now = new Date();
            const isOverdue = dueDate && dueDate < now;
            const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

            return (
              <Card key={a.id} className="border-border transition-shadow hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeColors[a.type]}`}
                    >
                      <TypeIcon size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setViewingId(a.id)}
                          className="text-left text-sm font-semibold transition-colors hover:text-violet-600"
                        >
                          {a.title}
                        </button>
                        <Badge variant={a.published ? 'default' : 'secondary'} className="text-[10px]">
                          {a.published ? 'Опубликовано' : 'Черновик'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {typeLabels[a.type]}
                        </Badge>
                        {a.moduleId && (
                          <Badge variant="outline" className="text-[10px]">
                            {modules.find((m) => m.id === a.moduleId)?.title || a.moduleId}
                          </Badge>
                        )}
                        {a.autoGrade && (
                          <Badge className="border-0 bg-emerald-100 text-[10px] text-emerald-700">
                            <CheckCircle size={10} className="mr-0.5" /> Авто
                          </Badge>
                        )}
                      </div>

                      <div className="text-muted-foreground mt-1.5 flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Award size={12} /> {a.maxScore} баллов
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {a._count?.submissions ?? 0} submission'ов
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {a.timeLimit ? `${a.timeLimit} мин` : 'Без лимита'}
                        </span>
                        {a.attempts > 0 && <span>Попытки: {a.attempts}</span>}
                        {a.group && (
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {a.group}
                          </span>
                        )}
                        {dueDate && daysLeft !== null && (
                          <span
                            className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : daysLeft <= 3 ? 'text-orange-500' : ''}`}
                          >
                            <Calendar size={12} />
                            {isOverdue
                              ? `Просрочен (${Math.abs(daysLeft)} дн.)`
                              : daysLeft === 0
                                ? 'Сегодня'
                                : daysLeft === 1
                                  ? 'Завтра'
                                  : `${daysLeft} дн.`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => togglePublished(a)}
                        className="text-muted-foreground hover:text-foreground rounded p-1.5 transition-colors"
                        title={a.published ? 'Скрыть' : 'Опубликовать'}
                      >
                        {a.published ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => openEditForm(a)}
                        className="text-muted-foreground rounded p-1.5 transition-colors hover:text-blue-600"
                        title="Редактировать"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="text-muted-foreground rounded p-1.5 transition-colors hover:text-red-600"
                        title="Удалить"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
