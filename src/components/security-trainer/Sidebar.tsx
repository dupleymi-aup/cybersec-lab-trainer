'use client';

import { useState, useEffect } from 'react';
import { useAppStore, type PageType } from '@/lib/store';
import { useAuthStore, hasRole, type UserRole } from '@/lib/auth-store';
import { modules } from '@/lib/data';
import {
  LayoutDashboard,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Database,
  FileText,
  Link,
  Lock,
  Code,
  HelpCircle,
  KeyRound,
  Key,
  Trophy,
  X,
  CheckCircle2,
  User,
  LogOut,
  Settings,
  Users,
  BookOpen,
  TrendingUp,
  Mail,
  Target,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ThemeToggle from './ThemeToggle';
import GlobalSearch from './GlobalSearch';
import SyncIndicator from './SyncIndicator';
import NotificationBell from './NotificationBell';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={20} />,
  Shield: <Shield size={20} />,
  Database: <Database size={20} />,
  FileText: <FileText size={20} />,
  Link: <Link size={20} />,
  Lock: <Lock size={20} />,
  Code: <Code size={20} />,
  HelpCircle: <HelpCircle size={20} />,
  KeyRound: <KeyRound size={20} />,
  Trophy: <Trophy size={20} />,
  ShieldCheck: <ShieldCheck size={20} />,
  ShieldAlert: <ShieldAlert size={20} />,
  Mail: <Mail size={20} />,
  Settings: <Settings size={20} />,
  Users: <Users size={20} />,
  BookOpen: <BookOpen size={20} />,
  Key: <Key size={20} />,
  TrendingUp: <TrendingUp size={20} />,
  Target: <Target size={20} />,
};

const navItems: { id: PageType; label: string; iconKey: string }[] = [
  { id: 'dashboard', label: 'Главная', iconKey: 'LayoutDashboard' },
  ...modules.map((m) => ({ id: m.id as PageType, label: m.title, iconKey: m.icon })),
  { id: 'quiz', label: 'Квизы', iconKey: 'HelpCircle' },
  { id: 'achievements', label: 'Достижения', iconKey: 'Trophy' },
  { id: 'cheat-sheets' as PageType, label: 'Шпаргалки', iconKey: 'BookOpen' },
  { id: 'password-checker' as PageType, label: 'Проверка пароля', iconKey: 'Key' },
  { id: 'leaderboard' as PageType, label: 'Рейтинг', iconKey: 'TrendingUp' },
  { id: 'career-paths' as PageType, label: 'Карьерные пути', iconKey: 'Target' },
];

const roleNavItems: { id: PageType; label: string; iconKey: string; requiredRole: UserRole }[] = [
  { id: 'teacher-panel', label: 'Панель преподавателя', iconKey: 'Users', requiredRole: 'teacher' },
  { id: 'admin-panel', label: 'Панель администратора', iconKey: 'Settings', requiredRole: 'admin' },
];

export default function Sidebar() {
  const {
    currentPage,
    sidebarOpen,
    setSidebarOpen,
    setCurrentPage,
    completedModules,
  } = useAppStore();
  const { user, logout } = useAuthStore();

  // Role-based navigation
  const visibleNavItems = [
    ...navItems,
    ...roleNavItems.filter((item) => hasRole(user?.role, item.requiredRole)),
  ];

  // Deadlines indicator: map moduleId -> daysLeft
  const [deadlineMap, setDeadlineMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/deadlines/upcoming')
      .then(r => r.json())
      .then(data => {
        if (data.upcoming) {
          const map: Record<string, number> = {};
          for (const d of data.upcoming) {
            if (d.scope === 'module' || d.scope === 'quiz') {
              // Only show the most urgent deadline per item
              if (!map[d.scopeId] || d.daysLeft < map[d.scopeId]) {
                map[d.scopeId] = d.daysLeft;
              }
            }
          }
          setDeadlineMap(map);
        }
      })
      .catch(() => {});
  }, []);

  // Count trackable items (excluding dashboard, achievements, profile, and role panels)
  const trackableItems = visibleNavItems.filter(
    (item) => item.id !== 'dashboard' && item.id !== 'achievements' && item.id !== 'profile' && item.id !== 'teacher-panel' && item.id !== 'admin-panel'
  );
  const completedCount = trackableItems.filter((item) => completedModules.includes(item.id)).length;
  const progressPct = trackableItems.length > 0 ? Math.round((completedCount / trackableItems.length) * 100) : 0;

  const handleLogout = () => {
    logout();
    setCurrentPage('dashboard');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-colors duration-200">
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="font-bold text-sm leading-tight">CyberSec Lab</h2>
            <p className="text-[11px] text-sidebar-foreground/50">09.03.04</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground/50 hover:text-sidebar-foreground md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={20} />
        </Button>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>

      {/* Global search */}
      <div className="px-3 pt-2">
        <GlobalSearch />
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {visibleNavItems.map((item) => {
          const isActive = currentPage === item.id;
          const isCompleted =
            item.id === 'dashboard' || completedModules.includes(item.id);
          const isRolePanel = item.id === 'teacher-panel' || item.id === 'admin-panel';

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200 text-left group
                ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400'
                    : isRolePanel
                      ? 'text-red-400 dark:text-red-400 hover:bg-sidebar-accent hover:text-red-300'
                      : item.id === 'achievements'
                        ? 'text-amber-500 hover:bg-sidebar-accent hover:text-amber-400'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }
              `}
            >
              <span className={isActive
                ? 'text-emerald-400'
                : isRolePanel
                  ? 'text-red-400 group-hover:text-red-300'
                  : item.id === 'achievements'
                    ? 'text-amber-500 group-hover:text-amber-400'
                    : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70'
              }>
                {iconMap[item.iconKey]}
              </span>
              <span className="flex-1">{item.label}</span>
              {deadlineMap[item.id] !== undefined && (
                <span className={`flex items-center gap-0.5 text-[10px] font-medium ${
                  deadlineMap[item.id] <= 0 ? 'text-red-400' : deadlineMap[item.id] <= 2 ? 'text-orange-400' : 'text-amber-400'
                }`}>
                  <Clock size={11} />
                  {deadlineMap[item.id] <= 0 ? '!' : deadlineMap[item.id]}
                </span>
              )}
              {isCompleted && !isRolePanel && (
                <CheckCircle2 size={16} className="text-emerald-500" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Progress */}
      <div className="border-t border-sidebar-border">
        {/* Progress */}
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-sidebar-foreground/50">Общий прогресс</span>
            <span className="text-emerald-400 font-semibold">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2 bg-sidebar-border [&>div]:bg-emerald-500" />
          <p className="text-[11px] text-sidebar-foreground/40 mt-2">
            Пройдено {completedCount} из {trackableItems.length} модулей
          </p>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* User section */}
        {user && (
          <div className="p-3 space-y-2">
            <button
              onClick={() => { setCurrentPage('profile'); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition"
            >
              <div className="w-8 h-8 rounded-full bg-violet-600/30 dark:bg-violet-600/20 flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-violet-600 dark:text-violet-400" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sidebar-foreground truncate">{user.fullName}</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
              </div>
              {user.role === 'student' && (
                <Badge className="text-[10px] px-1.5 py-0 bg-violet-500 text-white">S</Badge>
              )}
              {user.role === 'admin' && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">A</Badge>
              )}
              {user.role === 'teacher' && (
                <Badge className="text-[10px] px-1.5 py-0 bg-amber-500 text-white">T</Badge>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-600/10 hover:text-red-300 transition"
            >
              <LogOut size={16} />
              Выйти
            </button>

            <div className="px-3 pb-1">
              <SyncIndicator />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] z-50 md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-[260px] shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>
    </>
  );
}
