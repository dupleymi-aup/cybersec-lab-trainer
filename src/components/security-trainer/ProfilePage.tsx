'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { validatePassword } from '@/lib/auth-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Camera, Shield, Eye, EyeOff, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, updateProfile, updatePassword } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          <div>
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
          </div>
          <Button onClick={handlePasswordChange} className="bg-violet-600 hover:bg-violet-700">
            Изменить пароль
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
