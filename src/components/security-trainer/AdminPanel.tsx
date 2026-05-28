'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuthStore, getAllUsers, changeUserRole, deleteUser, toggleUserBlock, createUser, startImpersonation, getComprehensiveSummary, getRoleLabel, type UserRole, type User, type ComprehensiveSummary } from '@/lib/auth-store';
import { useAppStore } from '@/lib/store';
import { AnalyticsProvider, useAnalyticsFilters } from '@/lib/analytics-context';
import KPICard from './KPICard';
import AnalyticsFilterBar from './AnalyticsFilterBar';
import AchievementAnalytics from './AchievementAnalytics';
import LearningPathReport from './LearningPathReport';
import QuizTrajectoryReport from './QuizTrajectoryReport';
import CohortAnalysis from './CohortAnalysis';
import CompetencyRadar from './CompetencyRadar';
import WeaknessAnalyzer from './WeaknessAnalyzer';
import PredictiveInsights from './PredictiveInsights';
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
  UserPlus,
  KeyRound,
  LogIn,
  Activity,
  FileBarChart,
  Calendar,
  LineChart,
  BarChart3,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  GitCompare,
  HelpCircle,
  Table,
  Flame,
  Award,
  GitBranch,
  Target,
  Layers,
  Megaphone,
  Radar,
  Zap,
  Clock,
  Heart,
  ListChecks,
  Grid,
  Repeat,
  AlertOctagon,
  ShieldCheck,
  Loader2,
  ArrowLeftRight,
} from 'lucide-react';
import { toast } from 'sonner';
import UserModal from './UserModal';
import BulkActionsBar from './BulkActionsBar';
import PasswordResetModal from './PasswordResetModal';
import UserActivityModal from './UserActivityModal';
import GroupManager from './GroupManager';
import AuditLogView from './AuditLogView';
import AdminSummaryReport from './AdminSummaryReport';
import ActivityHeatmap from './ActivityHeatmap';
import ComprehensiveDashboard from './ComprehensiveDashboard';
import ModulePerformanceReport from './ModulePerformanceReport';
import ProgressDynamicsChart from './ProgressDynamicsChart';
import AtRiskReport from './AtRiskReport';
import GroupComparisonReport from './GroupComparisonReport';
import QuizCategoryDeepDive from './QuizCategoryDeepDive';
import AnalyticsExportPanel from './AnalyticsExportPanel';
import ProgressTrendsChart from './ProgressTrendsChart';
import QuizQuestionAnalytics from './QuizQuestionAnalytics';
import StudentPerformanceReport from './StudentPerformanceReport';
import StudentComparisonView from './StudentComparisonView';
import GradebookView from './GradebookView';
import EngagementAnalytics from './EngagementAnalytics';
import ModuleManager from './ModuleManager';
import SystemAnnouncements from './SystemAnnouncements';
import ModuleDeepDive from './ModuleDeepDive';
import CertificationReadiness from './CertificationReadiness';
import LearningVelocity from './LearningVelocity';
import QuizSessionAnalytics from './QuizSessionAnalytics';
import GroupDynamics from './GroupDynamics';
import LoginPatterns from './LoginPatterns';
import AdvancedAnalytics from './AdvancedAnalytics';
import QuizDifficultyAnalysis from './QuizDifficultyAnalysis';
import QuizRetryAnalytics from './QuizRetryAnalytics';
import ErrorPatternsAnalytics from './ErrorPatternsAnalytics';
import ProgressSankey from './ProgressSankey';
import StudentHeatmapCalendar from './StudentHeatmapCalendar';
import PredictiveRiskDashboard from './PredictiveRiskDashboard';
import ReportScheduler from './ReportScheduler';
import NotificationBell from './NotificationBell';
import ExecutiveSummaryExport from './ExecutiveSummaryExport';
import DataQualityMonitor from './DataQualityMonitor';
import PeriodComparison from './PeriodComparison';
import LtiPlatformManager from './LtiPlatformManager';
import { Link } from 'lucide-react';

const roleColors: Record<UserRole, string> = {
  student: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  teacher: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export default function AdminPanel() {
  const { user } = useAuthStore();
  const { setCurrentPage } = useAppStore();
  const { groupId: analyticsGroupId, days: analyticsDays } = useAnalyticsFilters();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [reportSubTab, setReportSubTab] = useState<'summary' | 'heatmap' | 'quiz-categories' | 'quiz-questions' | 'student-comparison' | 'at-risk' | 'group-compare' | 'export'>('summary');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalUser, setEditModalUser] = useState<User | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [activityUser, setActivityUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Force re-render by toggling key
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Load users from API
  const [loadingUsers, setLoadingUsers] = useState(true);
  useEffect(() => {
    getAllUsers()
      .then(setAllUsers)
      .finally(() => setLoadingUsers(false));
  }, [refreshKey]);
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

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const result = await changeUserRole(userId, newRole);
    if (result.success) {
      toast.success(`Роль изменена на ${getRoleLabel(newRole)}`);
      refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteUser = async (userId: string, fullName: string) => {
    if (!confirm(`Удалить пользователя "${fullName}"?`)) return;
    const result = await deleteUser(userId);
    if (result.success) {
      toast.success('Пользователь удалён');
      refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleToggleBlock = async (userId: string) => {
    const result = await toggleUserBlock(userId);
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
    reader.onload = async (event) => {
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
          const result = await createUser(
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')}>
            <ChevronLeft size={20} />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Settings size={20} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Панель администратора</h1>
            <p className="text-xs text-muted-foreground">Управление пользователями и системой</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnalyticsExportPanel />
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          label="Всего пользователей"
          value={totalUsers}
          icon={<Users size={18} />}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />
        <KPICard
          label="Студенты"
          value={studentCount}
          icon={<Users size={18} />}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
        <KPICard
          label="Преподаватели"
          value={teacherCount}
          icon={<Users size={18} />}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <KPICard
          label="Заблокировано"
          value={blockedCount}
          icon={<Shield size={18} />}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
      </div>

      <AnalyticsProvider>
      <Tabs defaultValue="users">
        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <TabsList className="grid w-full grid-cols-5 md:grid-cols-10 min-w-[700px] md:min-w-0">
            <TabsTrigger value="users" className="text-xs">
              <Users size={14} className="mr-1" /> Пользователи
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-xs">
              <Database size={14} className="mr-1" /> Группы
            </TabsTrigger>
            <TabsTrigger value="database" className="text-xs hidden md:block">
              <Database size={14} className="mr-1" /> Статистика
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs hidden md:block">
              <Settings size={14} className="mr-1" /> Настройки
            </TabsTrigger>
            <TabsTrigger value="modules" className="text-xs hidden lg:block">
              <BookOpen size={14} className="mr-1" /> Модули
            </TabsTrigger>
            <TabsTrigger value="lms" className="text-xs hidden lg:block">
              <Link size={14} className="mr-1" /> LMS
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs hidden xl:block">
              <Megaphone size={14} className="mr-1" /> Объявления
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs hidden xl:block">
              <LineChart size={14} className="mr-1" /> Аналитика
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs hidden xl:block">
              <Activity size={14} className="mr-1" /> Журнал
            </TabsTrigger>
            <TabsTrigger value="report" className="text-xs hidden xl:block">
              <FileBarChart size={14} className="mr-1" /> Отчёт
            </TabsTrigger>
          </TabsList>
        </div>

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
              className="px-3 py-2 border border-border rounded-md text-sm bg-card"
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
            <span className="text-xs text-muted-foreground">Выбрать всех</span>
            {selectedUserIds.size > 0 && (
              <Badge variant="secondary" className="text-[10px]">Выбрано: {selectedUserIds.size}</Badge>
            )}
          </div>

          <div className="space-y-2">
            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 size={32} className="mb-3 animate-spin opacity-50" />
                <p className="text-sm">Загрузка пользователей...</p>
              </div>
            ) : (
            filteredUsers.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={`border-border hover:border-red-200 transition-colors ${u.isBlocked ? 'opacity-60' : ''} ${u.id === user?.id ? 'bg-secondary' : ''}`}>
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
                          <p className="text-xs text-muted-foreground">{u.email} • {u.phone}</p>
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
                          <p className="text-xs text-muted-foreground">Входов: {u.loginCount || 0}</p>
                          <p className="text-[10px] text-slate-400">
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('ru-RU') : 'Не входил'}
                          </p>
                        </div>
                        {u.id !== user?.id && (
                          <>
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                              className="px-2 py-1 border border-border rounded-md text-xs bg-card"
                            >
                              <option value="student">Студент</option>
                              <option value="teacher">Преподаватель</option>
                              <option value="admin">Администратор</option>
                            </select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-sky-700 hover:bg-sky-50"
                              onClick={() => setActivityUser(u)}
                              title="Активность пользователя"
                            >
                              <Activity size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => setEditModalUser(u)}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => setPasswordResetUser(u)}
                              title="Сброс пароля"
                            >
                              <KeyRound size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-purple-700 hover:bg-purple-50"
                              onClick={async () => {
                                const result = await startImpersonation(u.id, user?.id || '');
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
            ))
            )}
          </div>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="mt-4 space-y-4">
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Пользователи по ролям</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-violet-50 rounded-lg">
                  <p className="text-3xl font-bold text-violet-600">{studentCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Студенты</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-3xl font-bold text-amber-600">{teacherCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Преподаватели</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{adminCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Администраторы</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Хранилище (localStorage)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-sky-50 rounded-lg">
                  <p className="text-3xl font-bold text-sky-600">{keysCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Ключей</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <p className="text-3xl font-bold text-emerald-600">{storageKB} KB</p>
                  <p className="text-xs text-muted-foreground mt-1">Использовано</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card className="border-border">
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
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Общая статистика</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-violet-50 rounded-lg">
                  <p className="text-2xl font-bold text-violet-600">{totalUsers}</p>
                  <p className="text-xs text-muted-foreground mt-1">Всего</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{blockedCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Заблокировано</p>
                </div>
                <div className="text-center p-3 bg-sky-50 rounded-lg">
                  <p className="text-2xl font-bold text-sky-600">{keysCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Ключей localStorage</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{storageKB} KB</p>
                  <p className="text-xs text-muted-foreground mt-1">Хранилище</p>
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
              <p className="text-xs text-muted-foreground">Создание, переименование и удаление групп</p>
            </div>
          </div>
          <GroupManager adminId={user?.id || ''} onRefresh={refresh} />
        </TabsContent>

        {/* Module Manager Tab */}
        <TabsContent value="modules" className="mt-4 space-y-4">
          <ModuleManager />
        </TabsContent>

        {/* LMS Integration Tab */}
        <TabsContent value="lms" className="mt-4 space-y-4">
          <LtiPlatformManager />
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="mt-4 space-y-4">
          <SystemAnnouncements currentUser={user?.fullName || 'Администратор'} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4 space-y-4">
          <AnalyticsFilterBar />
          <AnalyticsSubTabs
              allUsers={allUsers}
              selectedStudentId={selectedStudentId}
              setSelectedStudentId={setSelectedStudentId}
            />
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Activity size={16} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Журнал действий</h2>
              <p className="text-xs text-muted-foreground">История всех действий администраторов</p>
            </div>
          </div>
          <AuditLogView />
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report" className="mt-4 space-y-4">
          {/* Sub-tab selector */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit flex-wrap">
            {[
              { key: 'summary' as const, label: 'Сводка', icon: FileBarChart },
              { key: 'heatmap' as const, label: 'Активность', icon: Calendar },
              { key: 'quiz-categories' as const, label: 'Квизы', icon: HelpCircle },
              { key: 'quiz-questions' as const, label: 'Вопросы', icon: HelpCircle },
              { key: 'student-comparison' as const, label: 'Студенты', icon: GitCompare },
              { key: 'export' as const, label: 'Экспорт', icon: Download },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setReportSubTab(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  reportSubTab === key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* Summary sub-tab */}
          {reportSubTab === 'summary' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <AdminSummaryReport />
            </motion.div>
          )}

          {/* Heatmap sub-tab */}
          {reportSubTab === 'heatmap' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <ActivityHeatmap />
            </motion.div>
          )}

          {/* Quiz Categories sub-tab */}
          {reportSubTab === 'quiz-categories' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <QuizCategoryDeepDive groupId={analyticsGroupId} days={analyticsDays} />
            </motion.div>
          )}

          {/* Quiz Questions sub-tab */}
          {reportSubTab === 'quiz-questions' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <QuizQuestionAnalytics />
            </motion.div>
          )}

          {/* Student Comparison sub-tab */}
          {reportSubTab === 'student-comparison' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <StudentComparisonView groupId={analyticsGroupId} days={analyticsDays} />
            </motion.div>
          )}

          {/* Export sub-tab */}
          {reportSubTab === 'export' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <AnalyticsExportPanel groupId={analyticsGroupId} days={analyticsDays} />
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
      </AnalyticsProvider>

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

function AnalyticsSubTabs({
  allUsers,
  selectedStudentId,
  setSelectedStudentId,
}: {
  allUsers: User[];
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
}) {
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'dashboard' | 'modules' | 'dynamics' | 'trends' | 'at-risk' | 'comparison' | 'engagement' | 'student' | 'achievements' | 'gradebook' | 'learning-path' | 'quiz-trajectory' | 'cohort' | 'competency' | 'weaknesses' | 'predictive' | 'module-deep-dive' | 'certification' | 'velocity' | 'quiz-session' | 'group-dynamics' | 'login-patterns' | 'advanced' | 'difficulty' | 'heatmap' | 'questions' | 'summary' | 'retry' | 'errors' | 'sankey' | 'calendar' | 'predictive-risk' | 'scheduler' | 'data-quality' | 'period-comparison'>('dashboard');
  const { groupId, days } = useAnalyticsFilters();
  const [summary, setSummary] = useState<ComprehensiveSummary | null>(null);

  useEffect(() => {
    getComprehensiveSummary(days, groupId).then(setSummary);
  }, [days, groupId]);

  return (
    <>
      {/* KPI Summary Row */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <KPICard
            icon={<Users size={18} />}
            value={summary.kpis.totalStudents ?? 0}
            label="Всего студентов"
            trend={summary.trends.students ?? 'stable'}
          />
          <KPICard
            icon={<Activity size={18} />}
            value={`${summary.kpis.activePercentage ?? 0}%`}
            label="Активных"
            trend={summary.trends.activity ?? 'stable'}
          />
          <KPICard
            icon={<BookOpen size={18} />}
            value={`${summary.kpis.avgCompletionRate ?? 0}%`}
            label="Среднее завершение"
            trend={summary.trends.completion ?? 'stable'}
          />
          <KPICard
            icon={<HelpCircle size={18} />}
            value={`${summary.kpis.avgQuizScore ?? 0}%`}
            label="Средний балл quiz"
            trend={summary.trends.quizScore ?? 'stable'}
          />
        </div>
      )}

      {/* Sub-tab selector */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit flex-wrap">
        {[
          { key: 'dashboard' as const, label: 'Дашборд', icon: BarChart3 },
          { key: 'modules' as const, label: 'Модули', icon: BookOpen },
          { key: 'dynamics' as const, label: 'Динамика', icon: TrendingUp },
          { key: 'trends' as const, label: 'Тренды', icon: LineChart },
          { key: 'at-risk' as const, label: 'Внимание', icon: AlertTriangle },
          { key: 'comparison' as const, label: 'Сравнение', icon: GitCompare },
          { key: 'engagement' as const, label: 'Вовлечённость', icon: Flame },
          { key: 'achievements' as const, label: 'Достижения', icon: Award },
          { key: 'gradebook' as const, label: 'Ведомость', icon: Table },
          { key: 'learning-path' as const, label: 'Воронка', icon: GitBranch },
          { key: 'quiz-trajectory' as const, label: 'Траектория', icon: Target },
          { key: 'cohort' as const, label: 'Когорты', icon: Layers },
          { key: 'competency' as const, label: 'Компетенции', icon: Radar },
          { key: 'weaknesses' as const, label: 'Слабые места', icon: AlertTriangle },
          { key: 'predictive' as const, label: 'Прогноз', icon: TrendingUp },
          { key: 'student' as const, label: 'Студент', icon: Users },
          { key: 'module-deep-dive' as const, label: 'Модули+', icon: ListChecks },
          { key: 'certification' as const, label: 'Сертификация', icon: Award },
          { key: 'velocity' as const, label: 'Скорость', icon: Zap },
          { key: 'quiz-session' as const, label: 'Сессии квизов', icon: Clock },
          { key: 'group-dynamics' as const, label: 'Динамика групп', icon: Heart },
          { key: 'login-patterns' as const, label: 'Входы', icon: LogIn },
          { key: 'advanced' as const, label: 'Продвинутая', icon: Layers },
          { key: 'difficulty' as const, label: 'Сложность', icon: Target },
          { key: 'heatmap' as const, label: 'Тепловая карта', icon: Grid },
          { key: 'questions' as const, label: 'Вопросы', icon: HelpCircle },
          { key: 'summary' as const, label: 'Сводка', icon: FileBarChart },
          { key: 'retry' as const, label: 'Повторы', icon: Repeat },
          { key: 'errors' as const, label: 'Ошибки', icon: AlertOctagon },
          { key: 'sankey' as const, label: 'Воронка+', icon: GitBranch },
          { key: 'calendar' as const, label: 'Календарь', icon: Calendar },
          { key: 'predictive-risk' as const, label: 'Прогноз риска', icon: TrendingUp },
          { key: 'scheduler' as const, label: 'Расписание', icon: Calendar },
          { key: 'data-quality' as const, label: 'Качество данных', icon: ShieldCheck },
          { key: 'period-comparison' as const, label: 'Сравнение периодов', icon: ArrowLeftRight },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setAnalyticsSubTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              analyticsSubTab === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {analyticsSubTab === 'dashboard' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div className="flex items-center justify-end mb-3">
            <ExecutiveSummaryExport groupId={groupId} days={days} />
          </div>
          <ComprehensiveDashboard groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'modules' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <ModulePerformanceReport groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'dynamics' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <ProgressDynamicsChart groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'trends' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <ProgressTrendsChart groupId={groupId} />
        </motion.div>
      )}
      {analyticsSubTab === 'at-risk' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <AtRiskReport groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'comparison' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <GroupComparisonReport groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'engagement' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <EngagementAnalytics groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'achievements' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <AchievementAnalytics groupId={groupId} />
        </motion.div>
      )}
      {analyticsSubTab === 'gradebook' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <GradebookView groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'learning-path' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <LearningPathReport groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'quiz-trajectory' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <QuizTrajectoryReport groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'cohort' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <CohortAnalysis groupId={groupId} />
        </motion.div>
      )}
      {analyticsSubTab === 'competency' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <CompetencyRadar groupId={groupId} />
        </motion.div>
      )}
      {analyticsSubTab === 'weaknesses' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <WeaknessAnalyzer groupId={groupId} />
        </motion.div>
      )}
      {analyticsSubTab === 'predictive' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <PredictiveInsights groupId={groupId} />
        </motion.div>
      )}
      {analyticsSubTab === 'student' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-2 border border-border rounded-md text-sm bg-card"
              >
                <option value="">Выберите студента...</option>
                {allUsers.filter((u) => u.role === 'student').map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                ))}
              </select>
            </div>
            <StudentPerformanceReport userId={selectedStudentId} />
          </div>
        </motion.div>
      )}
      {analyticsSubTab === 'module-deep-dive' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <ModuleDeepDive groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'certification' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <CertificationReadiness groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'velocity' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <LearningVelocity groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'quiz-session' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <QuizSessionAnalytics groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'group-dynamics' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <GroupDynamics groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'login-patterns' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <LoginPatterns groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'advanced' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <AdvancedAnalytics groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'difficulty' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <QuizDifficultyAnalysis groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'heatmap' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <ActivityHeatmap />
        </motion.div>
      )}
      {analyticsSubTab === 'questions' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <QuizQuestionAnalytics />
        </motion.div>
      )}
      {analyticsSubTab === 'summary' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <AdminSummaryReport />
        </motion.div>
      )}
      {analyticsSubTab === 'retry' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <QuizRetryAnalytics groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'errors' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <ErrorPatternsAnalytics groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'sankey' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <ProgressSankey groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'calendar' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <StudentHeatmapCalendar groupId={groupId} />
        </motion.div>
      )}
      {analyticsSubTab === 'predictive-risk' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <PredictiveRiskDashboard groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'scheduler' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <ReportScheduler groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'data-quality' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <DataQualityMonitor groupId={groupId} days={days} />
        </motion.div>
      )}
      {analyticsSubTab === 'period-comparison' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <PeriodComparison groupId={groupId} />
        </motion.div>
      )}
    </>
  );
}
