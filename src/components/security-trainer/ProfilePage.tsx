'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useAppStore } from '@/lib/store';
import { validatePassword } from '@/lib/auth-utils';
import { usePasswordStrength } from '@/hooks/use-password-strength';
import { getAchievementStatus } from '@/lib/achievement-utils';
import { modules, achievements } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  User, Camera, Shield, Eye, EyeOff, Save, CheckCircle2, AlertTriangle, AlertCircle, Clock, Trash2,
  BookOpen, Brain, Trophy, Target, GraduationCap, Star, Activity, Calendar,
  Database, Code, LockIcon, KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const user = useAuthStore(s => s.user);
  const updateProfile = useAuthStore(s => s.updateProfile);
  const updatePassword = useAuthStore(s => s.updatePassword);
  const deleteAccount = useAuthStore(s => s.deleteAccount);
  const loginActivity = useAuthStore(s => s.loginActivity);
  const completedModules = useAppStore(s => s.completedModules);
  const quizScores = useAppStore(s => s.quizScores);
  const studiedOwaspItems = useAppStore(s => s.studiedOwaspItems);
  const sqlCompletedLevels = useAppStore(s => s.sqlCompletedLevels);
  const xssCompletedLevels = useAppStore(s => s.xssCompletedLevels);
  const csrfCompletedSteps = useAppStore(s => s.csrfCompletedSteps);
  const secureCodingAnsweredChallenges = useAppStore(s => s.secureCodingAnsweredChallenges);
  const secureCodingCorrectCount = useAppStore(s => s.secureCodingCorrectCount);
  const resetProgress = useAppStore(s => s.resetProgress);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

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
  }, [user]);

  const profileCompletion = useMemo(() => {
    const fields = [fullName, group, course, university, bio];
    const filled = fields.filter((f) => f.trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [fullName, group, course, university, bio]);

  // Stats
  const totalModules = modules.length;
  const completedCount = completedModules.filter((id) => modules.some((m) => m.id === id)).length;
  const totalProgress = Math.round((completedCount / totalModules) * 100);

  const avgQuizScore = useMemo(() => {
    const keys = Object.keys(quizScores);
    if (keys.length === 0) return 0;
    const values = Object.values(quizScores).filter((v) => typeof v === 'number' && !Number.isNaN(v));
    return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  }, [quizScores]);

  // Track timestamps for activity feed - use state to trigger re-renders
  const [timestamps, setTimestamps] = useState({
    modules: useAppStore.getState().moduleTimestamps || {},
    quizzes: useAppStore.getState().quizTimestamps || {},
  });

  useEffect(() => {
    const unsub = useAppStore.subscribe((state) => {
      setTimestamps({
        modules: state.moduleTimestamps || {},
        quizzes: state.quizTimestamps || {},
      });
    });
    return unsub;
  }, []);

  const challengeStats = {
    owaspCorrect: studiedOwaspItems.length,
    authCorrect: secureCodingCorrectCount,
  };

  const unlockedAchievements = achievements.filter((a) =>
    getAchievementStatus(a.id, completedModules, quizScores, challengeStats)
  );
  const unlockedCount = unlockedAchievements.length;
  const totalAchievements = achievements.length;

  // Build recent activity from timestamps
  const recentActivity = useMemo(() => {
    const events: Array<{ date: Date; type: string; label: string }> = [];
    for (const [moduleId, ts] of Object.entries(timestamps.modules)) {
      const mod = modules.find((m) => m.id === moduleId);
      if (mod) events.push({ date: new Date(ts), type: 'module', label: mod.title });
    }
    for (const [quizId, ts] of Object.entries(timestamps.quizzes)) {
      const cat = modules.find((m) => m.id === quizId);
      events.push({ date: new Date(ts), type: 'quiz', label: cat?.title || `Квиз: ${quizId}` });
    }
    return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [timestamps]);

  const achievementIcons: Record<string, React.ReactNode> = {
    'first-steps': <BookOpen size={20} />,
    'sql-master': <Database size={20} />,
    'xss-hunter': <Code size={20} />,
    'security-guard': <Shield size={20} />,
    'auth-expert': <Target size={20} />,
    'code-reviewer': <Code size={20} />,
    'quiz-master': <Trophy size={20} />,
    'quiz-perfect': <Star size={20} />,
    'crypto-ninja': <LockIcon size={20} />,
    'full-completion': <GraduationCap size={20} />,
    'csrf-shield': <Shield size={20} />,
    'owasp-half': <Shield size={20} />,
    'quiz-all': <Trophy size={20} />,
    'crypto-explorer': <KeyRound size={20} />,
    'coding-pro': <Code size={20} />,
    'headers-guard': <Shield size={20} />,
    'coding-master': <Code size={20} />,
    'network-ninja': <Shield size={20} />,
    'social-engineer': <Target size={20} />,
    'all-headers-correct': <Shield size={20} />,
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.warn("[ProfilePage.tsx] ProfilePage failed:", e);
  };

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
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      await updateProfile({ avatar: base64 });
      toast.success('Аватар обновлён');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error('ФИО обязательно');
      return;
    }
    await updateProfile({ fullName, group, course, university, bio });
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

  // Export progress as JSON file
  const handleExportProgress = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      user: { fullName: user.fullName, email: user.email, role: user.role },
      progress: {
        completedModules,
        quizScores,
        studiedOwaspItems,
        sqlCompletedLevels,
        xssCompletedLevels,
        csrfCompletedSteps,
        secureCodingAnsweredChallenges,
        secureCodingCorrectCount,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cybersec-progress-${user.id}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Прогресс экспортирован');
  };

  // Import progress from JSON file
  const handleImportProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.progress) {
          toast.error('Неверный формат файла');
          return;
        }
        const p = data.progress;
        // Write directly to localStorage for the current user
        const key = `security-trainer-progress-${user.id}`;
        const existing = localStorage.getItem(key) || '{}';
        const merged = { ...JSON.parse(existing), ...p };
        localStorage.setItem(key, JSON.stringify(merged));
        resetProgress(); // Clear current state
        // Re-read from localStorage by setting values
        useAppStore.setState({
          completedModules: p.completedModules || [],
          quizScores: p.quizScores || {},
          studiedOwaspItems: p.studiedOwaspItems || [],
          sqlCompletedLevels: p.sqlCompletedLevels || [],
          xssCompletedLevels: p.xssCompletedLevels || [],
          csrfCompletedSteps: p.csrfCompletedSteps || [],
          secureCodingAnsweredChallenges: p.secureCodingAnsweredChallenges || [],
          secureCodingCorrectCount: p.secureCodingCorrectCount || 0,
        });
        toast.success('Прогресс импортирован');
      } catch (e) {
        if (process.env.NODE_ENV === "development") console.warn("[ProfilePage.tsx] handlePasswordChange failed:", e);
        toast.error('Ошибка при чтении файла');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-imported
    e.target.value = '';
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'УДАЛИТЬ') {
      toast.error('Введите "УДАЛИТЬ" для подтверждения');
      return;
    }
    const result = await deleteAccount(deletePassword);
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
        <p className="text-muted-foreground">Управление данными аккаунта</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center overflow-hidden border-2 border-violet-200">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
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
              ) : user.role === 'teacher' ? (
                <Badge className="mt-1 bg-amber-100 text-amber-700 border-0">Преподаватель</Badge>
              ) : (
                <Badge variant="secondary" className="mt-1 bg-violet-100 text-violet-700">Студент</Badge>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Заполненность профиля</span>
              <span className={`font-semibold ${
                profileCompletion >= 80 ? 'text-emerald-600' :
                profileCompletion >= 40 ? 'text-amber-600' : 'text-muted-foreground'
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

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Статистика обучения
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={14} className="text-emerald-600" />
                <span className="text-[11px] text-emerald-700 font-medium">Модули</span>
              </div>
              <p className="text-lg font-bold">{completedCount}/{totalModules}</p>
              <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-1">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${totalProgress}%` }} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
              <div className="flex items-center gap-2 mb-1">
                <Brain size={14} className="text-violet-600" />
                <span className="text-[11px] text-violet-700 font-medium">Ср. балл</span>
              </div>
              <p className="text-lg font-bold">{avgQuizScore}%</p>
              <p className="text-[11px] text-violet-600 mt-0.5">{Object.keys(quizScores).length} квизов</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-1">
                <Trophy size={14} className="text-amber-600" />
                <span className="text-[11px] text-amber-700 font-medium">Достижения</span>
              </div>
              <p className="text-lg font-bold">{unlockedCount}/{totalAchievements}</p>
              <div className="w-full bg-amber-200 rounded-full h-1.5 mt-1">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(unlockedCount / totalAchievements) * 100}%` }} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} className="text-blue-600" />
                <span className="text-[11px] text-blue-700 font-medium">На платформе</span>
              </div>
              <p className="text-lg font-bold">{formatDate(user.createdAt).split(' ').slice(1, 3).join(' ')}</p>
              <p className="text-[11px] text-blue-600 mt-0.5">Входов: {user.loginCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Последняя активность
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {recentActivity.map((event, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary">
                  <div className={`w-2 h-2 rounded-full ${
                    event.type === 'module' ? 'bg-emerald-400' : 'bg-violet-400'
                  }`} />
                  <span className="text-[11px] text-slate-400 min-w-[80px]">
                    {event.date.toLocaleDateString('ru-RU')}
                  </span>
                  <span className="text-xs text-foreground/70">{event.label}</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    {event.type === 'module' ? 'Модуль' : 'Квиз'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      {unlockedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Разблокированные достижения
              <Badge className="ml-auto text-[11px]">{unlockedCount}/{totalAchievements}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {unlockedAchievements.map((a) => (
                <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    {achievementIcons[a.id] || <Trophy size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold truncate">{a.title}</p>
                    <p className="text-[10px] text-amber-700 truncate">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              <Input id="profile-email" value={user.email} disabled className="bg-secondary" />
              <p className="text-xs text-slate-400">Email нельзя изменить</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile-phone">Телефон</Label>
              <Input id="profile-phone" value={user.phone} disabled className="bg-secondary" />
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
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
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
                  <span className="text-xs text-muted-foreground">Надёжность пароля</span>
                  <span className={`text-xs font-medium ${
                    pwStrength.score >= 70 ? 'text-emerald-600' :
                    pwStrength.score >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`}>{pwStrength.label}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-muted">
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
                      <span className={check.passed ? 'text-muted-foreground' : 'text-slate-400'}>
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
            <p className="text-xs text-muted-foreground mb-3">Всего входов: <span className="font-semibold text-foreground/70">{user.loginCount}</span>{user.lastLoginAt && ` · Последний: ${formatTimeAgo(user.lastLoginAt)}`}</p>
          ) : null}
          {loginActivity && loginActivity.length > 0 ? (
            <div className="space-y-2">
              {[...loginActivity].reverse().slice(0, 10).map((entry, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${
                  entry.success ? 'border-border bg-card' : 'border-red-200 bg-red-50'
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

      {/* Export / Import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-500" />
            Экспорт и импорт прогресса
          </CardTitle>
          <CardDescription>Сохраните или восстановите свой прогресс</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={handleExportProgress} className="flex-1 bg-violet-600 hover:bg-violet-700">
              Экспортировать прогресс
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => importInputRef.current?.click()}>
              Импортировать прогресс
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportProgress}
            />
          </div>
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
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeletePassword(''); }}
                >
                  Отмена
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-red-600">Введите пароль для подтверждения удаления:</p>
                <Input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Текущий пароль"
                  className="border-red-300"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
