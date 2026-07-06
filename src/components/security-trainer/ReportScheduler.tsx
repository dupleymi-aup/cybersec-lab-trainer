'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  BookOpen,
  BarChart3,
  AlertTriangle,
  GitCompare,
  FileText,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  getScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
} from '@/lib/analytics-api';
import type { ScheduledReport } from '@/lib/auth-types';
import { getAllUsers } from '@/lib/auth-store';

const REPORT_TYPES = [
  {
    value: 'gradebook',
    label: 'Ведомость',
    icon: FileText,
    color: 'bg-blue-100 text-blue-700',
  },
  {
    value: 'at-risk',
    label: 'Студенты в риске',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-700',
  },
  {
    value: 'analytics',
    label: 'Общая аналитика',
    icon: BarChart3,
    color: 'bg-indigo-100 text-indigo-700',
  },
  {
    value: 'module-performance',
    label: 'Производительность модулей',
    icon: BookOpen,
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    value: 'group-comparison',
    label: 'Сравнение групп',
    icon: GitCompare,
    color: 'bg-violet-100 text-violet-700',
  },
  {
    value: 'quiz-retry',
    label: 'Повторы квизов',
    icon: Calendar,
    color: 'bg-amber-100 text-amber-700',
  },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Ежедневно' },
  { value: 'weekly', label: 'Еженедельно' },
  { value: 'monthly', label: 'Ежемесячно' },
];

const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export default function ReportScheduler({ groupId, days: _days }: { groupId?: string; days?: number }) {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [groups, setGroups] = useState<string[]>([]);

  // Form state
  const [reportType, setReportType] = useState('gradebook');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [email, setEmail] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [lookbackDays, setLookbackDays] = useState(30);

  useEffect(() => {
    loadReports();
    getAllUsers().then((users) => {
      const uniqueGroups = [...new Set(users.map((u) => u.group).filter(Boolean))];
      setGroups(uniqueGroups);
    });
  }, []);

  const loadReports = async () => {
    setLoading(true);
    const result = await getScheduledReports();
    setReports(result.reports || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!reportType || !frequency) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const data: {
      reportType: string;
      frequency: 'daily' | 'weekly' | 'monthly';
      email?: string;
      groupId?: string;
      days?: number;
      dayOfWeek?: number;
      dayOfMonth?: number;
    } = {
      reportType,
      frequency,
      email,
      groupId: selectedGroup || groupId || '',
      days: lookbackDays,
    };

    if (frequency === 'weekly') data.dayOfWeek = dayOfWeek;
    if (frequency === 'monthly') data.dayOfMonth = dayOfMonth;

    const result = await createScheduledReport(data);
    if (result.success) {
      toast.success('Отчёт создан');
      setShowForm(false);
      resetForm();
      loadReports();
    } else {
      toast.error(result.error || 'Ошибка создания');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const result = await updateScheduledReport(id, {
      isActive: !currentActive,
    });
    if (result.success) {
      toast.success(currentActive ? 'Отчёт отключён' : 'Отчёт включён');
      loadReports();
    } else {
      toast.error(result.error || 'Ошибка обновления');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот отчёт?')) return;
    const result = await deleteScheduledReport(id);
    if (result.success) {
      toast.success('Отчёт удалён');
      loadReports();
    } else {
      toast.error(result.error || 'Ошибка удаления');
    }
  };

  const resetForm = () => {
    setReportType('gradebook');
    setFrequency('weekly');
    setDayOfWeek(1);
    setDayOfMonth(1);
    setEmail('');
    setSelectedGroup('');
    setLookbackDays(30);
  };

  const formatLastGenerated = (dateStr: string | null) => {
    if (!dateStr) return 'Не генерировался';
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSchedule = (report: ScheduledReport) => {
    switch (report.frequency) {
      case 'daily':
        return 'Каждый день';
      case 'weekly':
        return `Каждый ${WEEKDAYS[report.dayOfWeek ?? 1] || 'Понедельник'}`;
      case 'monthly':
        return `${report.dayOfMonth || 1}-го числа каждого месяца`;
      default:
        return report.frequency;
    }
  };

  const getReportTypeLabel = (type: string) => {
    const rt = REPORT_TYPES.find((r) => r.value === type);
    return rt ? rt.label : type;
  };

  const getReportTypeIcon = (type: string) => {
    const rt = REPORT_TYPES.find((r) => r.value === type);
    return rt ? rt.icon : FileText;
  };

  const getReportTypeColor = (type: string) => {
    const rt = REPORT_TYPES.find((r) => r.value === type);
    return rt ? rt.color : 'bg-gray-100 text-gray-700';
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="mx-auto mb-3 animate-spin text-indigo-500" />
        <p className="text-muted-foreground text-sm">Загрузка расписания...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Расписание отчётов</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">Автоматическая генерация отчётов по расписанию</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          {showForm ? <X size={16} className="mr-1" /> : <Plus size={16} className="mr-1" />}
          {showForm ? 'Отмена' : 'Новое расписание'}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="border-indigo-200">
            <CardContent className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Report Type */}
                <div>
                  <label className="mb-1 block text-xs font-medium">Тип отчёта *</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="border-border bg-card w-full rounded-md border px-3 py-2 text-sm"
                  >
                    {REPORT_TYPES.map((rt) => (
                      <option key={rt.value} value={rt.value}>
                        {rt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Frequency */}
                <div>
                  <label className="mb-1 block text-xs font-medium">Частота *</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    className="border-border bg-card w-full rounded-md border px-3 py-2 text-sm"
                  >
                    {FREQUENCY_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Day of Week (for weekly) */}
                {frequency === 'weekly' && (
                  <div>
                    <label className="mb-1 block text-xs font-medium">День недели</label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(Number(e.target.value))}
                      className="border-border bg-card w-full rounded-md border px-3 py-2 text-sm"
                    >
                      {WEEKDAYS.map((day, i) => (
                        <option key={i} value={i}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Day of Month (for monthly) */}
                {frequency === 'monthly' && (
                  <div>
                    <label className="mb-1 block text-xs font-medium">Число месяца</label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(Number(e.target.value))}
                      className="text-sm"
                    />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="mb-1 block text-xs font-medium">Email для уведомлений</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@example.com"
                    className="text-sm"
                  />
                </div>

                {/* Group */}
                <div>
                  <label className="mb-1 block text-xs font-medium">Группа</label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="border-border bg-card w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="">Все группы</option>
                    {groups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lookback Days */}
                <div>
                  <label className="mb-1 block text-xs font-medium">Период данных (дней)</label>
                  <select
                    value={lookbackDays}
                    onChange={(e) => setLookbackDays(Number(e.target.value))}
                    className="border-border bg-card w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value={7}>7 дней</option>
                    <option value={30}>30 дней</option>
                    <option value={90}>90 дней</option>
                    <option value={180}>180 дней</option>
                  </select>
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full">
                Создать расписание
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Reports List */}
      {reports.length === 0 && !showForm ? (
        <Card className="border-border">
          <CardContent className="p-8 text-center">
            <Calendar size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">Нет расписаний</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Создайте первое расписание для автоматической генерации отчётов
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reports.map((report, i) => {
            const Icon = getReportTypeIcon(report.reportType);
            const colorClass = getReportTypeColor(report.reportType);

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  className={`border-border transition-colors hover:border-indigo-200 ${!report.isActive ? 'opacity-60' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{getReportTypeLabel(report.reportType)}</p>
                            <Badge variant={report.isActive ? 'default' : 'secondary'} className="text-[10px]">
                              {report.isActive ? 'Активен' : 'Отключён'}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground mt-0.5 flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatSchedule(report)}
                            </span>
                            {report.groupId && <span>Группа: {report.groupId}</span>}
                            <span>{report.days}д данных</span>
                          </div>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            Последняя генерация: {formatLastGenerated(report.lastGenerated)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(report.id, report.isActive)}
                          className="text-muted-foreground transition-colors hover:text-indigo-600"
                          title={report.isActive ? 'Отключить' : 'Включить'}
                        >
                          {report.isActive ? (
                            <ToggleRight size={24} className="text-indigo-600" />
                          ) : (
                            <ToggleLeft size={24} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="text-muted-foreground transition-colors hover:text-red-600"
                          title="Удалить"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
