'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { validatePassword } from '@/lib/auth-utils';
import { usePasswordStrength } from '@/hooks/use-password-strength';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { User, Camera, Shield, Eye, EyeOff, Save, CheckCircle2, AlertTriangle, AlertCircle, Clock, Trash2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user, updateProfile, updatePassword, deleteAccount, clearLoginActivity, loginActivity } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [group, setGroup] = useState(user?.group || '');
  const [course, setCourse] = useState(user?.course || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [bio, setBio] = useState(user?.bio || '');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const pwStrength = usePasswordStrength(newPassword);

  // Sync form state when user data changes
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setGroup(user.group || '');
      setCourse(user.course || '');
      setUniversity(user.university || '');
      setBio(user.bio || '');
    }
  }, [user?.fullName, user.group, user.course, user.university, user.bio]);

  const profileCompletion = useMemo(() => {
    const fields = [fullName, group, course, university, bio];
    const filled = fields.filter((f) => f.trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [fullName, group, course, university, bio]);

  if (!user) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 5 МБ)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      updateProfile({ avatar: base64 });
      toast.success('Аватар обновлён');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    if (!fullName.trim()) {
      toast.error('ФИО обязательно');
      return;
    }
    updateProfile({ fullName, group, course, university, bio });
    toast.success('Профиль сохранён');
  };

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Заполните все поля');
      return;
    }
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      toast.error(validation.errors.join(', '));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    const result = await updatePassword(oldPassword, newPassword);
    if (result.success) {
      toast.success('Пароль изменён');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'УДАЛИТЬ') {
      toast.error('Введите "УДАЛИТЬ" для подтверждения');
      return;
    }
    const result = deleteAccount();
    if (result.success) {
      toast.success('Аккаунт удалён');
      window.location.reload();
    } else {
      toast.error(result.error);
    }
  };

  const formatTimeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'только что';
    if (mins < 60) return `${mins} мин назад`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ч назад`;
    const days = Math.floor(hours / 24);
    return `${days} дн назад`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Личный профиль</h1>
        <p className="text-slate-500">Управление данными аккаунта</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center overflow-hidden border-2 border-violet-200">
              {user.avatar ? (
                <img src={user.avatar} alt="Аватар" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-violet-500" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center hover:bg-violet-700 transition"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{user.fullName}</CardTitle>
            <CardDescription>
              {user.role === 'admin' ? (
                <Badge variant="destructive" className="mt-1">Администратор</Badge>
              ) : (
                <Badge variant="secondary" className="mt-1 bg-violet-100 text-violet-700">Студент</Badge>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Заполненность профиля</span>
              <span className={`font-semibold ${
                profileCompletion >= 80 ? 'text-emerald-600' :
                profileCompletion >= 40 ? 'text-amber-600' : 'text-slate-600'
              }`}>{profileCompletion}%</span>
            </div>
            <Progress value={profileCompletion} className="h-2" />
            {profileCompletion < 100 && (
              <p className="text-xs text-slate-400">
                {!fullName && 'Укажите ФИО. '}
                {!group && 'Укажите группу. '}
                {!course && 'Укажите курс. '}
                {!university && 'Укажите университет. '}
                {!bio && 'Добавьте биографию.'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-violet-500" />
            Личные данные
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile-fullname">ФИО *</Label>
              <Input
                id="profile-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" value={user.email} disabled className="bg-slate-50" />
              <p className="text-xs text-slate-400">Email нельзя изменить</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile-phone">Телефон</Label>
              <Input id="profile-phone" value={user.phone} disabled className="bg-slate-50" />
              <p className="text-xs text-slate-400">Телефон нельзя изменить</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-university">Университет</Label>
              <Input
                id="profile-university"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Название университета"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile-course">Курс</Label>
              <Input
                id="profile-course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="Например: 3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-group">Группа</Label>
              <Input
                id="profile-group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="Например: ПИ-21"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-bio">Биография</Label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Расскажите о себе..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
            />
          </div>
          <Button onClick={handleSaveProfile} className="bg-violet-600 hover:bg-violet-700">
            <Save className="w-4 h-4 mr-2" />
            Сохранить
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-500" />
            Смена пароля
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="old-password">Текущий пароль</Label>
            <div className="relative">
              <Input
                id="old-password"
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Введите текущий пароль"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Новый пароль</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Надёжность пароля</span>
                  <span className={`text-xs font-medium ${
                    pwStrength.score >= 70 ? 'text-emerald-600' :
                    pwStrength.score >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`}>{pwStrength.label}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                  <div
                    className={`h-full ${pwStrength.color} rounded-full transition-all duration-500`}
                    style={{ width: `${pwStrength.score}%` }}
                  />
                </div>
                <Separator className="bg-slate-200" />
                <div className="space-y-1">
                  {pwStrength.checks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {check.passed ? (
                        <CheckCircle2 size={12} className="text-emerald-500" />
                      ) : (
                        <AlertTriangle size={12} className="text-slate-300" />
                      )}
                      <span className={check.passed ? 'text-slate-600' : 'text-slate-400'}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Подтверждение пароля</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите новый пароль"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${
                newPassword === confirmPassword ? 'text-emerald-600' : 'text-red-500'
              }`}>
                {newPassword === confirmPassword ? (
                  <><CheckCircle2 size={12} /> Пароли совпадают</>
                ) : (
                  <><AlertCircle size={12} /> Пароли не совпадают</>
                )}
              </p>
            )}
          </div>
          <Button onClick={handlePasswordChange} className="bg-violet-600 hover:bg-violet-700">
            Изменить пароль
          </Button>
        </CardContent>
      </Card>

      {/* Login Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-500" />
            Активность входа
          </CardTitle>
          <CardDescription>Последние попытки входа в аккаунт</CardDescription>
        </CardHeader>
        <CardContent>
          {user?.loginCount !== undefined ? (
            <p className="text-xs text-slate-500 mb-3">Всего входов: <span className="font-semibold text-slate-700">{user.loginCount}</span>{user.lastLoginAt && ` · Последний: ${formatTimeAgo(user.lastLoginAt)}`}</p>
          ) : null}
          {loginActivity && loginActivity.length > 0 ? (
            <div className="space-y-2">
              {[...loginActivity].reverse().slice(0, 10).map((entry, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${
                  entry.success ? 'border-slate-200 bg-white' : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-center gap-3">
                    {entry.success ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={16} className="text-red-500" />
                    )}
                    <div>
                      <p className="text-xs font-medium">{entry.success ? 'Успешный вход' : 'Неверный пароль'}</p>
                      <p className="text-[11px] text-slate-400">{entry.ip} · {formatTimeAgo(entry.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">Нет записей активности</p>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Опасная зона
          </CardTitle>
          <CardDescription>Необратимые действия с аккаунтом</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-red-700">Удалить аккаунт</p>
                <p className="text-xs text-red-600">Все данные будут удалены навсегда</p>
              </div>
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-100"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={14} className="mr-1" />
                Удалить
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-red-50 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-red-700">Вы уверены? Это действие нельзя отменить.</p>
              <p className="text-xs text-red-600">Введите <code className="bg-red-100 px-1 rounded font-bold">УДАЛИТЬ</code> для подтверждения:</p>
              <div className="flex gap-2">
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="УДАЛИТЬ"
                  className="border-red-300"
                />
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                >
                  <Trash2 size={14} className="mr-1" />
                  Подтвердить
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
