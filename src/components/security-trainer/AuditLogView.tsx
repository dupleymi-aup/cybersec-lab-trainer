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
  'role_change': 'Изменение роли',
  'user_created': 'Создание пользователя',
  'user_deleted': 'Удаление пользователя',
  'user_blocked': 'Блокировка',
  'user_unblocked': 'Разблокировка',
  'password_reset': 'Сброс пароля',
  'impersonation_start': 'Начало имперсонации',
  'impersonation_end': 'Конец имперсонации',
  'user_updated': 'Обновление профиля',
  'bulk_delete': 'Массовое удаление',
  'bulk_role_change': 'Массовое изменение ролей',
  'bulk_block': 'Массовая блокировка',
  'group_renamed': 'Переименование группы',
  'group_deleted': 'Удаление группы',
  'group_users_reassigned': 'Переназначение в группу',
};

const actionColors: Record<AuditAction, string> = {
  'role_change': 'bg-violet-100 text-violet-700',
  'user_created': 'bg-emerald-100 text-emerald-700',
  'user_deleted': 'bg-red-100 text-red-700',
  'user_blocked': 'bg-amber-100 text-amber-700',
  'user_unblocked': 'bg-sky-100 text-sky-700',
  'password_reset': 'bg-blue-100 text-blue-700',
  'impersonation_start': 'bg-purple-100 text-purple-700',
  'impersonation_end': 'bg-pink-100 text-pink-700',
  'user_updated': 'bg-teal-100 text-teal-700',
  'bulk_delete': 'bg-red-100 text-red-700',
  'bulk_role_change': 'bg-violet-100 text-violet-700',
  'bulk_block': 'bg-orange-100 text-orange-700',
  'group_renamed': 'bg-indigo-100 text-indigo-700',
  'group_deleted': 'bg-orange-100 text-orange-700',
  'group_users_reassigned': 'bg-indigo-100 text-indigo-700',
};


export default function AuditLogView() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [filterAction, setFilterAction] = useState('');
  const [filterAdmin, setFilterAdmin] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadData = async () => {
    const result = await getAuditLogEntries();
    setEntries(result.reverse());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Get unique admin names for filter
  const adminNames = [...new Set(entries.map((e) => e.adminName))];

  const filtered = entries.filter((e) => {
    const matchAction = filterAction === '' || e.action === filterAction;
    const matchAdmin = filterAdmin === '' || e.adminName === filterAdmin;
    const matchSearch = searchTerm === '' ||
      e.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.adminName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchAction && matchAdmin && matchSearch;
  });

  const handleClear = () => {
    if (!confirm('Очистить весь журнал действий?')) return;
    clearAuditLog();
    loadData();
    toast.success('Журнал очищен');
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по имени, детали..."
            className="text-sm"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={14} className="mr-1" /> Фильтры
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="text-red-600 border-red-200 hover:bg-red-50"
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
            <Card className="border-slate-200">
              <CardContent className="p-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Тип действия</label>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-white"
                  >
                    <option value="">Все действия</option>
                    {(Object.keys(actionLabels) as AuditAction[]).map((a) => (
                      <option key={a} value={a}>{actionLabels[a]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Администратор</label>
                  <select
                    value={filterAdmin}
                    onChange={(e) => setFilterAdmin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-white"
                  >
                    <option value="">Все</option>
                    {adminNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
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
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">Записей не найдено</p>
          <p className="text-xs text-slate-400 mt-1">Действия администраторов будут отображаться здесь</p>
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
              <Card className="border-slate-100 hover:border-slate-200 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={`text-[10px] ${actionColors[entry.action]}`}>
                          {actionLabels[entry.action]}
                        </Badge>
                        <span className="text-xs font-medium text-slate-700">
                          {entry.adminName}
                        </span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="text-xs font-medium text-slate-600 truncate">
                          {entry.targetName || '—'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{entry.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString('ru-RU', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 text-center">
        Показано {filtered.length} из {entries.length} записей
      </p>
    </div>
  );
}
