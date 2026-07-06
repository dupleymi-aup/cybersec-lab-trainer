'use client';

import { useState, useEffect } from 'react';
import { useAppStore, type PageType, getAuthHeaders } from '@/lib/store';
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
import { useTranslations } from 'next-intl';
import ThemeToggle from './ThemeToggle';
import GlobalSearch from './GlobalSearch';
import SyncIndicator from './SyncIndicator';
import NotificationBell from './NotificationBell';
import { logger } from '@/lib/logger';

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

const navKeyMap: Record<string, string> = {
  dashboard: 'dashboard',
  quiz: 'quiz',
  assignments: 'assignments',
  achievements: 'achievements',
  'cheat-sheets': 'cheatSheets',
  'password-checker': 'passwordChecker',
  leaderboard: 'leaderboard',
  'career-paths': 'careerPaths',
  'teacher-panel': 'teacherPanel',
  'admin-panel': 'adminPanel',
  owasp: 'owasp',
  'sql-injection': 'sqlInjection',
  xss: 'xss',
  csrf: 'csrf',
  auth: 'authSecurity',
  'secure-coding': 'secureCoding',
  tools: 'tools',
  'security-headers': 'securityHeaders',
  idor: 'idor',
  ssrf: 'ssrf',
  'api-security': 'apiSecurity',
  'phishing-analyzer': 'phishingAnalyzer',
};

const mainNavItems: { id: PageType; iconKey: string }[] = [{ id: 'dashboard', iconKey: 'LayoutDashboard' }];

const moduleNavItems: { id: PageType; label: string; iconKey: string }[] = [
  ...modules.map((m) => ({
    id: m.id as PageType,
    label: m.title,
    iconKey: m.icon,
  })),
];

const toolNavItems: { id: PageType; iconKey: string }[] = [
  { id: 'quiz', iconKey: 'HelpCircle' },
  { id: 'assignments' as PageType, iconKey: 'ClipboardList' },
  { id: 'achievements', iconKey: 'Trophy' },
  { id: 'cheat-sheets' as PageType, iconKey: 'BookOpen' },
  { id: 'password-checker' as PageType, iconKey: 'Key' },
  { id: 'leaderboard' as PageType, iconKey: 'TrendingUp' },
  { id: 'career-paths' as PageType, iconKey: 'Target' },
];

const roleNavItems: {
  id: PageType;
  iconKey: string;
  requiredRole: UserRole;
}[] = [
  { id: 'teacher-panel', iconKey: 'Users', requiredRole: 'teacher' },
  { id: 'admin-panel', iconKey: 'Settings', requiredRole: 'admin' },
];

export default function Sidebar() {
  const t = useTranslations('nav');
  const currentPage = useAppStore((s) => s.currentPage);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const completedModules = useAppStore((s) => s.completedModules);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // Expandable sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    modules: true,
    tools: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Role-based navigation
  const visibleRoleNavItems = roleNavItems.filter((item) => hasRole(user?.role, item.requiredRole));

  // Deadlines indicator
  const [deadlineMap, setDeadlineMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const controller = new AbortController();
    getAuthHeaders()
      .then((headers) => {
        if (controller.signal.aborted) return;
        return fetch('/api/deadlines/upcoming', {
          headers,
          signal: controller.signal,
        });
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data?.upcoming) {
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
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') logger.error('Sidebar failed to load deadlines', { error: err });
      });
    return () => controller.abort();
  }, []);

  // Progress calculation
  const trackableItems = [
    ...moduleNavItems,
    ...toolNavItems.filter(
      (item) =>
        item.id !== 'achievements' &&
        item.id !== 'cheat-sheets' &&
        item.id !== 'password-checker' &&
        item.id !== 'leaderboard' &&
        item.id !== 'career-paths',
    ),
  ];
  const completedCount = trackableItems.filter((item) => completedModules.includes(item.id)).length;
  const progressPct = trackableItems.length > 0 ? Math.round((completedCount / trackableItems.length) * 100) : 0;

  const handleLogout = () => {
    logout();
    setCurrentPage('dashboard');
  };

  const NavItem = ({
    item,
    isRolePanel,
  }: {
    item: { id: PageType; label?: string; iconKey: string };
    isRolePanel?: boolean;
  }) => {
    const isActive = currentPage === item.id;
    const isCompleted = item.id !== 'dashboard' && completedModules.includes(item.id);
    const itemLabel = navKeyMap[item.id] ? t(navKeyMap[item.id]) : item.label || item.id;

    return (
      <button
        onClick={() => {
          setCurrentPage(item.id);
          setSidebarOpen(false);
        }}
        aria-current={isActive ? 'page' : undefined}
        className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-emerald-600/20 text-emerald-400'
            : isRolePanel
              ? 'hover:bg-sidebar-accent text-red-400 hover:text-red-300'
              : item.id === 'achievements'
                ? 'hover:bg-sidebar-accent text-amber-500 hover:text-amber-400'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
        } `}
      >
        <span
          className={`shrink-0 ${
            isActive
              ? 'text-emerald-400'
              : isRolePanel
                ? 'text-red-400 group-hover:text-red-300'
                : item.id === 'achievements'
                  ? 'text-amber-500 group-hover:text-amber-400'
                  : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70'
          }`}
        >
          {iconMap[item.iconKey]}
        </span>
        <span className="flex-1 truncate">{itemLabel}</span>
        {deadlineMap[item.id] !== undefined && (
          <span
            className={`flex shrink-0 items-center gap-0.5 text-[10px] font-medium ${
              deadlineMap[item.id] <= 0
                ? 'text-red-400'
                : deadlineMap[item.id] <= 2
                  ? 'text-orange-400'
                  : 'text-amber-400'
            }`}
          >
            <Clock size={11} />
            {deadlineMap[item.id] <= 0 ? '!' : deadlineMap[item.id]}
          </span>
        )}
        {isCompleted && !isRolePanel && <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />}
      </button>
    );
  };

  const SectionHeader = ({
    title,
    isExpanded,
    onToggle,
    count,
  }: {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    count?: number;
  }) => (
    <button
      onClick={onToggle}
      aria-expanded={isExpanded}
      className="text-sidebar-foreground/50 hover:text-sidebar-foreground/70 flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors"
    >
      <span className="flex items-center gap-2">
        {title}
        {count !== undefined && <span className="bg-sidebar-accent rounded px-1.5 py-0.5 text-[10px]">{count}</span>}
      </span>
      <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
    </button>
  );

  const sidebarContent = (
    <div className="bg-sidebar text-sidebar-foreground border-sidebar-border flex h-full flex-col border-r transition-colors duration-200">
      {/* Header */}
      <div className="border-sidebar-border flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="text-sm leading-tight font-bold">CyberSec Lab</h2>
            <p className="text-sidebar-foreground/50 text-[10px]">09.03.04</p>
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
            aria-label={t('closeSidebar')}
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
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3" aria-label={t('dashboard')}>
        {/* Main nav */}
        {mainNavItems.map((item) => (
          <NavItem key={item.id} item={item} />
        ))}

        <Separator className="bg-sidebar-border/50 my-2" />

        {/* Modules section */}
        <SectionHeader
          title={t('modules')}
          isExpanded={expandedSections.modules}
          onToggle={() => toggleSection('modules')}
          count={completedModules.filter((id) => modules.some((m) => m.id === id)).length}
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
          title={t('toolsSection')}
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
      <div className="border-sidebar-border bg-sidebar-accent/30 border-t">
        {/* Progress */}
        <div className="p-3 pb-2">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-sidebar-foreground/50">{t('progress')}</span>
            <span className="font-semibold text-emerald-400">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="bg-sidebar-border h-1.5 [&>div]:bg-emerald-500" />
        </div>

        {/* User section */}
        {user && (
          <div className="space-y-1 p-2">
            <button
              onClick={() => {
                setCurrentPage('profile');
                setSidebarOpen(false);
              }}
              className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-600/30 dark:bg-violet-600/20">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt={t('avatarAlt')} className="h-full w-full object-cover" />
                ) : (
                  <User size={14} className="text-violet-600 dark:text-violet-400" />
                )}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sidebar-foreground truncate text-xs font-medium">{user.fullName}</p>
                <p className="text-sidebar-foreground/50 truncate text-[10px]">{user.email}</p>
              </div>
              {user.role === 'student' && (
                <Badge className="h-4 bg-violet-500 px-1 py-0 text-[9px] text-white">S</Badge>
              )}
              {user.role === 'admin' && (
                <Badge variant="destructive" className="h-4 px-1 py-0 text-[9px]">
                  A
                </Badge>
              )}
              {user.role === 'teacher' && <Badge className="h-4 bg-amber-500 px-1 py-0 text-[9px] text-white">T</Badge>}
            </button>

            <div className="flex items-center gap-1 px-1">
              <button
                onClick={handleLogout}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-red-400 transition hover:bg-red-600/10 hover:text-red-300"
              >
                <LogOut size={14} />
                {t('logout')}
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
              className="fixed inset-0 z-40 bg-black md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 bottom-0 left-0 z-50 w-[280px] md:hidden"
              aria-label={t('closeSidebar')}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 md:block">{sidebarContent}</aside>
    </>
  );
}
