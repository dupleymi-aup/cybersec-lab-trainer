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
  ChevronDown,
  ClipboardList,
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
  LayoutDashboard: <LayoutDashboard size={18} />,
  Shield: <Shield size={18} />,
  Database: <Database size={18} />,
  FileText: <FileText size={18} />,
  Link: <Link size={18} />,
  Lock: <Lock size={18} />,
  Code: <Code size={18} />,
  HelpCircle: <HelpCircle size={18} />,
  KeyRound: <KeyRound size={18} />,
  Trophy: <Trophy size={18} />,
  ShieldCheck: <ShieldCheck size={18} />,
  ShieldAlert: <ShieldAlert size={18} />,
  Mail: <Mail size={18} />,
  Settings: <Settings size={18} />,
  Users: <Users size={18} />,
  BookOpen: <BookOpen size={18} />,
  Key: <Key size={18} />,
  TrendingUp: <TrendingUp size={18} />,
  Target: <Target size={18} />,
  ClipboardList: <ClipboardList size={18} />,
};

// Navigation structure with grouping
const mainNavItems: { id: PageType; label: string; iconKey: string }[] = [
  { id: 'dashboard', label: 'Главная', iconKey: 'LayoutDashboard' },
];

const moduleNavItems: { id: PageType; label: string; iconKey: string }[] = [
  ...modules.map((m) => ({ id: m.id as PageType, label: m.title, iconKey: m.icon })),
];

const toolNavItems: { id: PageType; label: string; iconKey: string }[] = [
  { id: 'quiz', label: 'Квизы', iconKey: 'HelpCircle' },
  { id: 'assignments' as PageType, label: 'Задания', iconKey: 'ClipboardList' },
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

  // Expandable sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    modules: true,
    tools: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Role-based navigation
  const visibleRoleNavItems = roleNavItems.filter((item) => hasRole(user?.role, item.requiredRole));

  // Deadlines indicator
  const [deadlineMap, setDeadlineMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/deadlines/upcoming')
      .then(r => r.json())
      .then(data => {
        if (data.upcoming) {
          const map: Record<string, number> = {};
          for (const d of data.upcoming) {
            if (d.scope === 'module' || d.scope === 'quiz') {
              if (!map[d.scopeId] || d.daysLeft < map[d.scopeId]) {
                map[d.scopeId] = d.daysLeft;
              }
            }
          }
          setDeadlineMap(map);
        }
      })
      .catch(() => {
        // Intentionally silent
      });
  }, []);

  // Progress calculation
  const trackableItems = [...moduleNavItems, ...toolNavItems.filter(item => item.id !== 'achievements' && item.id !== 'cheat-sheets' && item.id !== 'password-checker' && item.id !== 'leaderboard' && item.id !== 'career-paths')];
  const completedCount = trackableItems.filter((item) => completedModules.includes(item.id)).length;
  const progressPct = trackableItems.length > 0 ? Math.round((completedCount / trackableItems.length) * 100) : 0;

  const handleLogout = () => {
    logout();
    setCurrentPage('dashboard');
  };

  const NavItem = ({ item, isRolePanel }: { item: { id: PageType; label: string; iconKey: string }; isRolePanel?: boolean }) => {
    const isActive = currentPage === item.id;
    const isCompleted = item.id !== 'dashboard' && completedModules.includes(item.id);

    return (
      <button
        onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
        className={`
          w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium
          transition-all duration-200 text-left group
          ${isActive
            ? 'bg-emerald-600/20 text-emerald-400'
            : isRolePanel
              ? 'text-red-400 hover:bg-sidebar-accent hover:text-red-300'
              : item.id === 'achievements'
                ? 'text-amber-500 hover:bg-sidebar-accent hover:text-amber-400'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
          }
        `}
      >
        <span className={`shrink-0 ${isActive
          ? 'text-emerald-400'
          : isRolePanel
            ? 'text-red-400 group-hover:text-red-300'
            : item.id === 'achievements'
              ? 'text-amber-500 group-hover:text-amber-400'
              : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70'
        }`}>
          {iconMap[item.iconKey]}
        </span>
        <span className="flex-1 truncate">{item.label}</span>
        {deadlineMap[item.id] !== undefined && (
          <span className={`flex items-center gap-0.5 text-[10px] font-medium shrink-0 ${
            deadlineMap[item.id] <= 0 ? 'text-red-400' : deadlineMap[item.id] <= 2 ? 'text-orange-400' : 'text-amber-400'
          }`}>
            <Clock size={11} />
            {deadlineMap[item.id] <= 0 ? '!' : deadlineMap[item.id]}
          </span>
        )}
        {isCompleted && !isRolePanel && (
          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
        )}
      </button>
    );
  };

  const SectionHeader = ({ title, isExpanded, onToggle, count }: { title: string; isExpanded: boolean; onToggle: () => void; count?: number }) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider hover:text-sidebar-foreground/70 transition-colors"
    >
      <span className="flex items-center gap-2">
        {title}
        {count !== undefined && (
          <span className="text-[10px] bg-sidebar-accent px-1.5 py-0.5 rounded">{count}</span>
        )}
      </span>
      <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
    </button>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-colors duration-200">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm leading-tight">CyberSec Lab</h2>
            <p className="text-[10px] text-sidebar-foreground/50">09.03.04</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </Button>
        </div>
      </div>

      {/* Global search */}
      <div className="px-3 py-3">
        <GlobalSearch />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {/* Main nav */}
        {mainNavItems.map((item) => (
          <NavItem key={item.id} item={item} />
        ))}

        <Separator className="bg-sidebar-border/50 my-2" />

        {/* Modules section */}
        <SectionHeader
          title="Модули"
          isExpanded={expandedSections.modules}
          onToggle={() => toggleSection('modules')}
          count={completedModules.filter(id => modules.some(m => m.id === id)).length}
        />
        <AnimatePresence initial={false}>
          {expandedSections.modules && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-0.5 overflow-hidden"
            >
              {moduleNavItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Separator className="bg-sidebar-border/50 my-2" />

        {/* Tools section */}
        <SectionHeader
          title="Инструменты"
          isExpanded={expandedSections.tools}
          onToggle={() => toggleSection('tools')}
        />
        <AnimatePresence initial={false}>
          {expandedSections.tools && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-0.5 overflow-hidden"
            >
              {toolNavItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Role-based panels */}
        {visibleRoleNavItems.length > 0 && (
          <>
            <Separator className="bg-sidebar-border/50 my-2" />
            <div className="space-y-0.5">
              {visibleRoleNavItems.map((item) => (
                <NavItem key={item.id} item={item} isRolePanel />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User Profile & Progress */}
      <div className="border-t border-sidebar-border bg-sidebar-accent/30">
        {/* Progress */}
        <div className="p-3 pb-2">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-sidebar-foreground/50">Прогресс</span>
            <span className="text-emerald-400 font-semibold">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-1.5 bg-sidebar-border [&>div]:bg-emerald-500" />
        </div>

        {/* User section */}
        {user && (
          <div className="p-2 space-y-1">
            <button
              onClick={() => { setCurrentPage('profile'); setSidebarOpen(false); }}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition"
            >
              <div className="w-7 h-7 rounded-full bg-violet-600/30 dark:bg-violet-600/20 flex items-center justify-center overflow-hidden shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-violet-600 dark:text-violet-400" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-sidebar-foreground truncate text-xs">{user.fullName}</p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">{user.email}</p>
              </div>
              {user.role === 'student' && (
                <Badge className="text-[9px] px-1 py-0 h-4 bg-violet-500 text-white">S</Badge>
              )}
              {user.role === 'admin' && (
                <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">A</Badge>
              )}
              {user.role === 'teacher' && (
                <Badge className="text-[9px] px-1 py-0 h-4 bg-amber-500 text-white">T</Badge>
              )}
            </button>

            <div className="flex items-center gap-1 px-1">
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-600/10 hover:text-red-300 transition"
              >
                <LogOut size={14} />
                Выйти
              </button>
              <div className="px-1">
                <SyncIndicator />
              </div>
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
