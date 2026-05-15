'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuthStore, getAllUsers, changeUserRole, deleteUser, toggleUserBlock, createUser, startImpersonation, getAuditLogEntries, clearAuditLog, getRoleLabel, type UserRole, type User } from '@/lib/auth-store';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  Settings,
  Search,
  Users,
  Database,
  Trash2,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Pencil,
  Ban,
  UserPlus,
  KeyRound,
  LogIn,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import UserModal from './UserModal';
import BulkActionsBar from './BulkActionsBar';
import PasswordResetModal from './PasswordResetModal';
import UserActivityModal from './UserActivityModal';
import GroupManager from './GroupManager';
import AuditLogView from './AuditLogView';

const roleColors: Record<UserRole, string> = {
  student: 'bg-violet-100 text-violet-700',
  teacher: 'bg-amber-100 text-amber-700',
  admin: 'bg-red-100 text-red-700',
};

export default function AdminPanel() {
  const { user } = useAuthStore();
  const { setCurrentPage } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalUser, setEditModalUser] = useState<User | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [activityUser, setActivityUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Force re-render by toggling key
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const allUsers = getAllUsers();
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      searchTerm === '' ||
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === '' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // DB Stats
  const totalUsers = allUsers.length;
  const studentCount = allUsers.filter((u) => u.role === 'student').length;
  const teacherCount = allUsers.filter((u) => u.role === 'teacher').length;
  const adminCount = allUsers.filter((u) => u.role === 'admin').length;
  const blockedCount = allUsers.filter((u) => u.isBlocked).length;

  // LocalStorage usage
  let storageUsed = 0;
  let keysCount = 0;
  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        storageUsed += key.length + value.length;
        keysCount++;
      }
    }
  }
  const storageKB = (storageUsed / 1024).toFixed(1);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const result = changeUserRole(userId, newRole);
    if (result.success) {
      toast.success(`Роль изменена на ${getRoleLabel(newRole)}`);
      refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteUser = (userId: string, fullName: string) => {
    if (!confirm(`Удалить пользователя "${fullName}"?`)) return;
    const result = deleteUser(userId);
    if (result.success) {
      toast.success('Пользователь удалён');
      refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleToggleBlock = (userId: string) => {
    const result = toggleUserBlock(userId);
    if (result.success) {
      const isNowBlocked = allUsers.find((u) => u.id === userId)?.isBlocked;
      toast.success(isNowBlocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
      refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleToggleSelect = (userId: string) => {
    const next = new Set(selectedUserIds);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setSelectedUserIds(next);
  };

  const handleSelectAll = () => {
    const filteredIds = filteredUsers.filter((u) => u.id !== user?.id).map((u) => u.id);
    if (selectedUserIds.size === filteredIds.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredIds));
    }
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim());
        if (lines.length < 2) { toast.error('CSV файл пуст'); return; }

        // Parse header
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('имя'));
        const emailIdx = headers.findIndex((h) => h.includes('email'));
        const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('телефон'));
        const roleIdx = headers.findIndex((h) => h.includes('role') || h.includes('роль'));
        const groupIdx = headers.findIndex((h) => h.includes('group') || h.includes('группа'));

        if (nameIdx === -1 || emailIdx === -1) {
          toast.error('CSV должен содержать колонки fullName и email');
          return;
        }

        let created = 0;
        let skipped = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim());
          const fullName = cols[nameIdx] || '';
          const email = cols[emailIdx] || '';
          const phone = cols[phoneIdx] || '+7000000000';
          const roleStr = (cols[roleIdx] || 'student').toLowerCase();
          const group = cols[groupIdx] || '';
          const role: UserRole = ['student', 'teacher', 'admin'].includes(roleStr) ? (roleStr as UserRole) : 'student';

          // Check duplicate
          const existing = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
          if (existing) { skipped++; continue; }

          const defaultPassword = 'Temp@1234';
          const result = createUser(
            { email, phone, fullName, role, group, course: '', university: '' },
            defaultPassword
          );
          if (result.success) created++;
          else skipped++;
        }

        toast.success(`Импортировано: ${created}, пропущено: ${skipped}`);
        refresh();
      } catch {
        toast.error('Ошибка parsing CSV');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearProgress = () => {
    if (!confirm('Очистить весь прогресс всех пользователей?')) return;
    if (typeof window === 'undefined') return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('security-trainer-progress-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    toast.success('Прогресс очищен');
  };

  const handleExportData = () => {
    const data = {
      users: allUsers,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cybersec-lab-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Данные экспортированы');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')}>
          <ChevronLeft size={20} />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <Settings size={20} className="text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Панель администратора</h1>
          <p className="text-xs text-slate-500">Управление пользователями и системой</p>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="text-xs">
            <Users size={14} className="mr-1" /> Пользователи
          </TabsTrigger>
          <TabsTrigger value="groups" className="text-xs">
            <Database size={14} className="mr-1" /> Группы
          </TabsTrigger>
          <TabsTrigger value="database" className="text-xs">
            <Database size={14} className="mr-1" /> Статистика
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">
            <Settings size={14} className="mr-1" /> Настройки
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs">
            <Activity size={14} className="mr-1" /> Журнал
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по имени или email..."
                className="pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white"
            >
              <option value="">Все роли</option>
              <option value="student">Студент</option>
              <option value="teacher">Преподаватель</option>
              <option value="admin">Администратор</option>
            </select>
            <Button onClick={() => setCreateModalOpen(true)}>
              <UserPlus size={16} className="mr-1" /> Создать
            </Button>
          </div>

          {/* Select All */}
          <div className="flex items-center gap-3 px-1">
            <Checkbox
              checked={filteredUsers.filter((u) => u.id !== user?.id).length > 0 && selectedUserIds.size === filteredUsers.filter((u) => u.id !== user?.id).length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-xs text-slate-500">Выбрать всех</span>
            {selectedUserIds.size > 0 && (
              <Badge variant="secondary" className="text-[10px]">Выбрано: {selectedUserIds.size}</Badge>
            )}
          </div>

          <div className="space-y-2">
            {filteredUsers.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={`border-slate-200 hover:border-red-200 transition-colors ${u.isBlocked ? 'opacity-60' : ''} ${u.id === user?.id ? 'bg-slate-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedUserIds.has(u.id)}
                          onCheckedChange={() => handleToggleSelect(u.id)}
                          disabled={u.id === user?.id}
                        />
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <Shield size={18} className="text-red-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{u.fullName}</p>
                            {u.id === user?.id && (
                              <Badge variant="outline" className="text-[10px]">Вы</Badge>
                            )}
                            {u.isBlocked && (
                              <Badge variant="destructive" className="text-[10px]">Заблокирован</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{u.email} • {u.phone}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-[10px] ${roleColors[u.role]}`}>
                              {getRoleLabel(u.role)}
                            </Badge>
                            {u.group && (
                              <Badge variant="secondary" className="text-[10px]">{u.group}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <p className="text-xs text-slate-500">Входов: {u.loginCount || 0}</p>
                          <p className="text-[10px] text-slate-400">
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('ru-RU') : 'Не входил'}
                          </p>
                        </div>
                        {u.id !== user?.id && (
                          <>
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                              className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-white"
                            >
                              <option value="student">Студент</option>
                              <option value="teacher">Преподаватель</option>
                              <option value="admin">Администратор</option>
                            </select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-500 hover:text-sky-700 hover:bg-sky-50"
                              onClick={() => setActivityUser(u)}
                              title="Активность пользователя"
                            >
                              <Activity size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => setEditModalUser(u)}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-500 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => setPasswordResetUser(u)}
                              title="Сброс пароля"
                            >
                              <KeyRound size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-500 hover:text-purple-700 hover:bg-purple-50"
                              onClick={() => {
                                const result = startImpersonation(u.id, user?.id || '');
                                if (result.success) {
                                  toast.success(`Вы вошли как ${u.fullName}`);
                                  setCurrentPage('dashboard');
                                } else {
                                  toast.error(result.error);
                                }
                              }}
                              title="Войти как"
                            >
                              <LogIn size={16} />
                            </Button>
                            <Switch
                              checked={u.isBlocked}
                              onCheckedChange={() => handleToggleBlock(u.id)}
                              className="data-[state=checked]:bg-red-500"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteUser(u.id, u.fullName)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="mt-4 space-y-4">
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Пользователи по ролям</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-violet-50 rounded-lg">
                  <p className="text-3xl font-bold text-violet-600">{studentCount}</p>
                  <p className="text-xs text-slate-500 mt-1">Студенты</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-3xl font-bold text-amber-600">{teacherCount}</p>
                  <p className="text-xs text-slate-500 mt-1">Преподаватели</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{adminCount}</p>
                  <p className="text-xs text-slate-500 mt-1">Администраторы</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Хранилище (localStorage)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-sky-50 rounded-lg">
                  <p className="text-3xl font-bold text-sky-600">{keysCount}</p>
                  <p className="text-xs text-slate-500 mt-1">Ключей</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <p className="text-3xl font-bold text-emerald-600">{storageKB} KB</p>
                  <p className="text-xs text-slate-500 mt-1">Использовано</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card className="border-slate-200">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-sm">Системные действия</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 justify-start"
                  onClick={handleClearProgress}
                >
                  <RotateCcw size={16} className="mr-2" />
                  Очистить весь прогресс
                </Button>

                <Button
                  variant="outline"
                  className="border-sky-200 text-sky-600 hover:bg-sky-50 justify-start"
                  onClick={handleExportData}
                >
                  <Download size={16} className="mr-2" />
                  Экспорт данных (JSON)
                </Button>

                <div>
                  <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleCSVImport}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 justify-start w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} className="mr-2" />
                    Импорт CSV
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  <strong>Внимание:</strong> Эти действия необратимы. Очистка прогресса удалит все данные о прохождении модулей и квизов для всех пользователей.
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  <strong>CSV импорт:</strong> Формат — <code className="bg-amber-100 px-1 rounded">fullName,email,phone,role,group</code>. Пароль по умолчанию: <code className="bg-amber-100 px-1 rounded">Temp@1234</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Общая статистика</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-violet-50 rounded-lg">
                  <p className="text-2xl font-bold text-violet-600">{totalUsers}</p>
                  <p className="text-xs text-slate-500 mt-1">Всего</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{blockedCount}</p>
                  <p className="text-xs text-slate-500 mt-1">Заблокировано</p>
                </div>
                <div className="text-center p-3 bg-sky-50 rounded-lg">
                  <p className="text-2xl font-bold text-sky-600">{keysCount}</p>
                  <p className="text-xs text-slate-500 mt-1">Ключей localStorage</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{storageKB} KB</p>
                  <p className="text-xs text-slate-500 mt-1">Хранилище</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
              <Users size={16} className="text-sky-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Управление группами</h2>
              <p className="text-xs text-slate-500">Создание, переименование и удаление групп</p>
            </div>
          </div>
          <GroupManager adminId={user?.id || ''} onRefresh={refresh} />
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Activity size={16} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Журнал действий</h2>
              <p className="text-xs text-slate-500">История всех действий администраторов</p>
            </div>
          </div>
          <AuditLogView adminId={user?.id || ''} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AnimatePresence>
        {createModalOpen && (
          <UserModal
            mode="create"
            onClose={() => setCreateModalOpen(false)}
            onSuccess={() => { setCreateModalOpen(false); refresh(); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editModalUser && (
          <UserModal
            mode="edit"
            user={editModalUser}
            onClose={() => setEditModalUser(null)}
            onSuccess={() => { setEditModalUser(null); refresh(); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {passwordResetUser && (
          <PasswordResetModal
            user={passwordResetUser}
            onClose={() => setPasswordResetUser(null)}
            onSuccess={() => { setPasswordResetUser(null); refresh(); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activityUser && (
          <UserActivityModal
            user={activityUser}
            onClose={() => setActivityUser(null)}
          />
        )}
      </AnimatePresence>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedIds={Array.from(selectedUserIds)}
        currentUserId={user?.id || ''}
        onDone={() => { setSelectedUserIds(new Set()); refresh(); }}
      />
    </div>
  );
}
