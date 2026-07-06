'use client';

import { useState, useEffect } from 'react';
import { getAuditLogEntries, clearAuditLog, type AuditAction, type AuditLogEntry } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

const actionLabels: Record<AuditAction, string> = {
  role_change: 'Изменение роли',
  user_created: 'Создание пользователя',
  user_deleted: 'Удаление пользователя',
  user_blocked: 'Блокировка',
  user_unblocked: 'Разблокировка',
  password_reset: 'Сброс пароля',
  impersonation_start: 'Начало имперсонации',
  impersonation_end: 'Конец имперсонации',
  user_updated: 'Обновление профиля',
  bulk_delete: 'Массовое удаление',
  bulk_role_change: 'Массовое изменение ролей',
  bulk_block: 'Массовая блокировка',
  group_renamed: 'Переименование группы',
  group_deleted: 'Удаление группы',
  group_users_reassigned: 'Переназначение в группу',
};

const actionColors: Record<AuditAction, string> = {
  role_change: 'bg-violet-100 text-violet-700',
  user_created: 'bg-emerald-100 text-emerald-700',
  user_deleted: 'bg-red-100 text-red-700',
  user_blocked: 'bg-amber-100 text-amber-700',
  user_unblocked: 'bg-sky-100 text-sky-700',
  password_reset: 'bg-blue-100 text-blue-700',
  impersonation_start: 'bg-purple-100 text-purple-700',
  impersonation_end: 'bg-pink-100 text-pink-700',
  user_updated: 'bg-teal-100 text-teal-700',
  bulk_delete: 'bg-red-100 text-red-700',
  bulk_role_change: 'bg-violet-100 text-violet-700',
  bulk_block: 'bg-orange-100 text-orange-700',
  group_renamed: 'bg-indigo-100 text-indigo-700',
  group_deleted: 'bg-orange-100 text-orange-700',
  group_users_reassigned: 'bg-indigo-100 text-indigo-700',
};

export default function AuditLogView() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [filterAction, setFilterAction] = useState('');
  const [filterAdmin, setFilterAdmin] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadData = async () => {
    const result = await getAuditLogEntries();
    setEntries([...result].reverse());
  };

  useEffect(() => {
    const controller = new AbortController();
    loadData();
    return () => {
      controller.abort();
    };
  }, []);

  // Get unique admin names for filter
  const adminNames = [...new Set(entries.map((e) => e.adminName))];

  const filtered = entries.filter((e) => {
    const matchAction = filterAction === '' || e.action === filterAction;
    const matchAdmin = filterAdmin === '' || e.adminName === filterAdmin;
    const matchSearch =
      searchTerm === '' ||
      e.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.adminName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchAction && matchAdmin && matchSearch;
  });

  const handleClear = async () => {
    if (!confirm('Очистить записи старше 90 дней?')) return;
    const result = await clearAuditLog(90);
    if (result.success) {
      loadData();
      if (result.deletedCount > 0) {
        toast.success(`Удалено ${result.deletedCount} записей`);
      } else {
        toast.info('Нет записей для удаления');
      }
    } else {
      toast.error(result.error || 'Ошибка очистки');
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по имени, детали..."
            className="text-sm"
          />
        </div>
        <Button variant={showFilters ? 'default' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={14} className="mr-1" /> Фильтры
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          <Trash2 size={14} className="mr-1" /> Очистить
        </Button>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-border">
              <CardContent className="grid grid-cols-2 gap-3 p-4">
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">Тип действия</label>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="border-border bg-card w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="">Все действия</option>
                    {(Object.keys(actionLabels) as AuditAction[]).map((a) => (
                      <option key={a} value={a}>
                        {actionLabels[a]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">Администратор</label>
                  <select
                    value={filterAdmin}
                    onChange={(e) => setFilterAdmin(e.target.value)}
                    className="border-border bg-card w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="">Все</option>
                    {adminNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-muted-foreground text-sm">Записей не найдено</p>
          <p className="mt-1 text-xs text-slate-400">Действия администраторов будут отображаться здесь</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
            >
              <Card className="hover:border-border border-slate-100 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge className={`text-[10px] ${actionColors[entry.action]}`}>
                          {actionLabels[entry.action]}
                        </Badge>
                        <span className="text-foreground/70 text-xs font-medium">{entry.adminName}</span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="text-muted-foreground truncate text-xs font-medium">
                          {entry.targetName || '—'}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs">{entry.details}</p>
                    </div>
                    <span className="text-[10px] whitespace-nowrap text-slate-400">
                      {new Date(entry.timestamp).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        Показано {filtered.length} из {entries.length} записей
      </p>
    </div>
  );
}
