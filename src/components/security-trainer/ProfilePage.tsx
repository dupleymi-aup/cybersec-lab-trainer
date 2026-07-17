'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
  User,
  Camera,
  Shield,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Trash2,
  BookOpen,
  Brain,
  Trophy,
  Target,
  GraduationCap,
  Star,
  Activity,
  Calendar,
  Database,
  Code,
  LockIcon,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const loginActivity = useAuthStore((s) => s.loginActivity);
  const completedModules = useAppStore((s) => s.completedModules);
  const quizScores = useAppStore((s) => s.quizScores);
  const studiedOwaspItems = useAppStore((s) => s.studiedOwaspItems);
  const sqlCompletedLevels = useAppStore((s) => s.sqlCompletedLevels);
  const xssCompletedLevels = useAppStore((s) => s.xssCompletedLevels);
  const csrfCompletedSteps = useAppStore((s) => s.csrfCompletedSteps);
  const secureCodingAnsweredChallenges = useAppStore((s) => s.secureCodingAnsweredChallenges);
  const secureCodingCorrectCount = useAppStore((s) => s.secureCodingCorrectCount);
  const resetProgress = useAppStore((s) => s.resetProgress);
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
    getAchievementStatus(a.id, completedModules, quizScores, challengeStats),
  );
  const unlockedCount = unlockedAchievements.length;
  const totalAchievements = achievements.length;

  // Build recent activity from timestamps
  const recentActivity = useMemo(() => {
    const events: Array<{ date: Date; type: string; label: string }> = [];
    for (const [moduleId, ts] of Object.entries(timestamps.modules)) {
      const mod = modules.find((m) => m.id === moduleId);
      if (mod) events.push({ date: new Date(ts), type: 'module', label: t(`modules.${mod.id}.title`) });
    }
    for (const [quizId, ts] of Object.entries(timestamps.quizzes)) {
      const cat = modules.find((m) => m.id === quizId);
      events.push({
        date: new Date(ts),
        type: 'quiz',
        label: cat?.title ? t(`modules.${cat.id}.title`) : t('activityQuizPrefix', { id: quizId }),
      });
    }
    return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [timestamps, t]);

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
      return new Date(iso).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      logger.warn('ProfilePage formatDate failed', { error: e });
      return iso;
    }
  };

  const formatTimeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('timeJustNow');
    if (mins < 60) return t('timeMinAgo', { n: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('timeHourAgo', { n: hours });
    const days = Math.floor(hours / 24);
    return t('timeDayAgo', { n: days });
  };

  if (!user) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('avatarUploadError'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('avatarUploadSizeError'));
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64 = ev.target?.result as string;
        await updateProfile({ avatar: base64 });
        toast.success(t('avatarUpdated'));
      } catch (e) {
        logger.error('Failed to update avatar', { error: e });
        toast.error(t('avatarUploadError'));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error(t('fullNameRequired'));
      return;
    }
    try {
      await updateProfile({ fullName, group, course, university, bio });
      toast.success(t('profileSaved'));
    } catch (e) {
      logger.error('Failed to save profile', { error: e });
    }
  };

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error(t('fillAllPasswordFields'));
      return;
    }
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      toast.error(validation.errors.join(', '));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('passwordsMismatch'));
      return;
    }
    try {
      const result = await updatePassword(oldPassword, newPassword);
      if (result.success) {
        toast.success(t('passwordChanged'));
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      logger.error('Failed to change password', { error: e });
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
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cybersec-progress-${user.id}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('progressExported'));
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
          toast.error(t('invalidFileFormat'));
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
        toast.success(t('progressImported'));
      } catch (e) {
        if (process.env.NODE_ENV === 'development')
          logger.warn('ProfilePage handleImportProgress failed', { error: e });
        toast.error(t('fileReadError'));
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-imported
    e.target.value = '';
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== t('deleteAccountConfirmText')) {
      toast.error(t('wrongDeleteConfirmation'));
      return;
    }
    try {
      const result = await deleteAccount(deletePassword);
      if (result.success) {
        toast.success(t('accountDeleted'));
        window.location.reload();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      logger.error('Failed to delete account', { error: e });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-violet-200 bg-violet-100">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={t('avatarAlt', {
                    name: user.fullName || t('avatarAltDefault'),
                  })}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-violet-500" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 transition hover:bg-violet-700"
            >
              <Camera className="h-3.5 w-3.5 text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{user.fullName}</CardTitle>
            <CardDescription>
              {user.role === 'admin' ? (
                <Badge variant="destructive" className="mt-1">
                  {t('roleAdmin')}
                </Badge>
              ) : user.role === 'teacher' ? (
                <Badge className="mt-1 border-0 bg-amber-100 text-amber-700">{t('roleTeacher')}</Badge>
              ) : (
                <Badge variant="secondary" className="mt-1 bg-violet-100 text-violet-700">
                  {t('roleStudent')}
                </Badge>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('profileCompletion')}</span>
              <span
                className={`font-semibold ${
                  profileCompletion >= 80
                    ? 'text-emerald-600'
                    : profileCompletion >= 40
                      ? 'text-amber-600'
                      : 'text-muted-foreground'
                }`}
              >
                {profileCompletion}%
              </span>
            </div>
            <Progress value={profileCompletion} className="h-2" />
            {profileCompletion < 100 && (
              <p className="text-xs text-slate-400">
                {!fullName && t('profileCompletionHintFullName')}
                {!group && t('profileCompletionHintGroup')}
                {!course && t('profileCompletionHintCourse')}
                {!university && t('profileCompletionHintUniversity')}
                {!bio && t('profileCompletionHintBio')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-emerald-500" />
            {t('stats')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="mb-1 flex items-center gap-2">
                <BookOpen size={14} className="text-emerald-600" />
                <span className="text-[11px] font-medium text-emerald-700">{t('statsModules')}</span>
              </div>
              <p className="text-lg font-bold">
                {completedCount}/{totalModules}
              </p>
              <div className="mt-1 h-1.5 w-full rounded-full bg-emerald-200">
                <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${totalProgress}%` }} />
              </div>
            </div>
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
              <div className="mb-1 flex items-center gap-2">
                <Brain size={14} className="text-violet-600" />
                <span className="text-[11px] font-medium text-violet-700">{t('statsAvgScore')}</span>
              </div>
              <p className="text-lg font-bold">{avgQuizScore}%</p>
              <p className="mt-0.5 text-[11px] text-violet-600">
                {Object.keys(quizScores).length} {t('statsQuizzesCount')}
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="mb-1 flex items-center gap-2">
                <Trophy size={14} className="text-amber-600" />
                <span className="text-[11px] font-medium text-amber-700">{t('statsAchievements')}</span>
              </div>
              <p className="text-lg font-bold">
                {unlockedCount}/{totalAchievements}
              </p>
              <div className="mt-1 h-1.5 w-full rounded-full bg-amber-200">
                <div
                  className="h-1.5 rounded-full bg-amber-500"
                  style={{
                    width: `${(unlockedCount / totalAchievements) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="mb-1 flex items-center gap-2">
                <Calendar size={14} className="text-blue-600" />
                <span className="text-[11px] font-medium text-blue-700">{t('statsOnPlatform')}</span>
              </div>
              <p className="text-lg font-bold">{formatDate(user.createdAt).split(' ').slice(1, 3).join(' ')}</p>
              <p className="mt-0.5 text-[11px] text-blue-600">{t('statsLogins', { count: user.loginCount })}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="text-muted-foreground h-5 w-5" />
              {t('recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {recentActivity.map((event, i) => (
                <div key={i} className="hover:bg-secondary flex items-center gap-3 rounded-lg p-2">
                  <div
                    className={`h-2 w-2 rounded-full ${event.type === 'module' ? 'bg-emerald-400' : 'bg-violet-400'}`}
                  />
                  <span className="min-w-[80px] text-[11px] text-slate-400">{event.date.toLocaleDateString()}</span>
                  <span className="text-foreground/70 text-xs">{event.label}</span>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {event.type === 'module' ? t('activityBadgeModule') : t('activityBadgeQuiz')}
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
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-amber-500" />
              {t('unlockedAchievements')}
              <Badge className="ml-auto text-[11px]">
                {unlockedCount}/{totalAchievements}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {unlockedAchievements.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    {achievementIcons[a.id] || <Trophy size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold">{a.title}</p>
                    <p className="truncate text-[10px] text-amber-700">{a.description}</p>
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
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-violet-500" />
            {t('personalInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-fullname">{t('fullName')}</Label>
              <Input
                id="profile-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('fullNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">{t('email')}</Label>
              <Input id="profile-email" value={user.email} disabled className="bg-secondary" />
              <p className="text-xs text-slate-400">{t('emailNotEditable')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-phone">{t('phone')}</Label>
              <Input id="profile-phone" value={user.phone} disabled className="bg-secondary" />
              <p className="text-xs text-slate-400">{t('phoneNotEditable')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-university">{t('university')}</Label>
              <Input
                id="profile-university"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder={t('universityPlaceholder')}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-course">{t('course')}</Label>
              <Input
                id="profile-course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder={t('coursePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-group">{t('group')}</Label>
              <Input
                id="profile-group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder={t('groupPlaceholder')}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-bio">{t('bio')}</Label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('bioPlaceholder')}
              rows={3}
              className="border-border w-full resize-none rounded-lg border px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
            />
          </div>
          <Button onClick={handleSaveProfile} className="bg-violet-600 hover:bg-violet-700">
            <Save className="mr-2 h-4 w-4" />
            {t('saveChanges')}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-violet-500" />
            {t('changePassword')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="old-password">{t('currentPassword')}</Label>
            <div className="relative">
              <Input
                id="old-password"
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={t('currentPasswordPlaceholder')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">{t('newPassword')}</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">{t('passwordStrength')}</span>
                  <span
                    className={`text-xs font-medium ${
                      pwStrength.score >= 70
                        ? 'text-emerald-600'
                        : pwStrength.score >= 50
                          ? 'text-amber-600'
                          : 'text-red-600'
                    }`}
                  >
                    {pwStrength.label}
                  </span>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
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
                      <span className={check.passed ? 'text-muted-foreground' : 'text-slate-400'}>{check.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && newPassword && (
              <p
                className={`mt-1 flex items-center gap-1 text-xs ${
                  newPassword === confirmPassword ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {newPassword === confirmPassword ? (
                  <>
                    <CheckCircle2 size={12} /> {t('passwordsMatch')}
                  </>
                ) : (
                  <>
                    <AlertCircle size={12} /> {t('passwordsMismatch')}
                  </>
                )}
              </p>
            )}
          </div>
          <Button onClick={handlePasswordChange} className="bg-violet-600 hover:bg-violet-700">
            {t('changePasswordButton')}
          </Button>
        </CardContent>
      </Card>

      {/* Login Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-violet-500" />
            {t('loginActivity')}
          </CardTitle>
          <CardDescription>{t('loginActivityDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {user?.loginCount !== undefined ? (
            <p className="text-muted-foreground mb-3 text-xs">
              {t('totalLogins')} <span className="text-foreground/70 font-semibold">{user.loginCount}</span>
              {user.lastLoginAt && ` · ${t('lastLogin', { time: formatTimeAgo(user.lastLoginAt) })}`}
            </p>
          ) : null}
          {loginActivity && loginActivity.length > 0 ? (
            <div className="space-y-2">
              {[...loginActivity]
                .reverse()
                .slice(0, 10)
                .map((entry, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      entry.success ? 'border-border bg-card' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {entry.success ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={16} className="text-red-500" />
                      )}
                      <div>
                        <p className="text-xs font-medium">{entry.success ? t('loginSuccess') : t('loginFailed')}</p>
                        <p className="text-[11px] text-slate-400">
                          {entry.ip} · {formatTimeAgo(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-slate-400">{t('noLoginActivity')}</p>
          )}
        </CardContent>
      </Card>

      {/* Export / Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-violet-500" />
            {t('exportImport')}
          </CardTitle>
          <CardDescription>{t('exportImportDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={handleExportProgress} className="flex-1 bg-violet-600 hover:bg-violet-700">
              {t('exportProgress')}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => importInputRef.current?.click()}>
              {t('importProgress')}
            </Button>
            <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={handleImportProgress} />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-red-600">
            <Trash2 className="h-5 w-5" />
            {t('dangerZone')}
          </CardTitle>
          <CardDescription>{t('dangerZoneDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between rounded-lg bg-red-50 p-4">
              <div>
                <p className="text-sm font-semibold text-red-700">{t('deleteAccount')}</p>
                <p className="text-xs text-red-600">{t('deleteAccountWarning')}</p>
              </div>
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-100"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={14} className="mr-1" />
                {t('delete')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">{t('deleteAccountConfirm')}</p>
              <p className="text-xs text-red-600">
                {t.rich('deleteAccountHint', {
                  code: (chunks) => <code className="rounded bg-red-100 px-1 font-bold">{chunks}</code>,
                })}
              </p>
              <div className="flex gap-2">
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={t('deleteAccountConfirmText')}
                  className="border-red-300"
                />
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  <Trash2 size={14} className="mr-1" />
                  {t('confirmDelete')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                    setDeletePassword('');
                  }}
                >
                  {t('cancel')}
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-red-600">{t('enterPasswordToDelete')}</p>
                <Input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder={t('deletePasswordPlaceholder')}
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
