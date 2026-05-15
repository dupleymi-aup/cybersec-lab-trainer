'use client';

import { useState } from 'react';
import { useAuthStore, getAllUsers, changeUserRole, deleteUser, type UserRole, getRoleLabel } from '@/lib/auth-store';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { toast } from 'sonner';

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
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteUser = (userId: string, fullName: string) => {
    if (!confirm(`Удалить пользователя "${fullName}"?`)) return;
    const result = deleteUser(userId);
    if (result.success) {
      toast.success('Пользователь удалён');
    } else {
      toast.error(result.error);
    }
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="text-xs">
            <Users size={14} className="mr-1" /> Пользователи
          </TabsTrigger>
          <TabsTrigger value="database" className="text-xs">
            <Database size={14} className="mr-1" /> Статистика БД
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">
            <Settings size={14} className="mr-1" /> Настройки
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex gap-3">
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
          </div>

          <div className="space-y-2">
            {filteredUsers.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={`border-slate-200 hover:border-red-200 transition-colors ${u.id === user?.id ? 'bg-slate-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <Shield size={18} className="text-red-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{u.fullName}</p>
                            {u.id === user?.id && (
                              <Badge variant="outline" className="text-[10px]">Вы</Badge>
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
                      <div className="flex items-center gap-3">
                        <div className="text-right">
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
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  <strong>Внимание:</strong> Эти действия необратимы. Очистка прогресса удалит все данные о прохождении модулей и квизов для всех пользователей.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
