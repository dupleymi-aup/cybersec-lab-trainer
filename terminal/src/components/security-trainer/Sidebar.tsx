'use client';

import { useState, useEffect } from 'react';
import { useAppStore, type PageType } from '@/lib/store';
import { useAuthStore, hasRole, type UserRole } from '@/lib/auth-store';
import { modules } from '@/lib/data';
import { useApiQuery } from '@/hooks/use-api';
import { useTranslations } from 'next-intl';
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
  Zap,
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
import LanguageSwitcher from '../landing/LanguageSwitcher';

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

// Navigation structure with grouping — labels will be set inside the component using i18n
const mainNavItemDefs: { id: PageType; labelKey: string; iconKey: string }[] = [
  { id: 'dashboard', labelKey: 'sidebar.home', iconKey: 'LayoutDashboard' },
];

const moduleNavItemDefs: { id: PageType; labelKey: string | null; iconKey: string }[] = [
  ...modules.map((m) => ({ id: m.id as PageType, labelKey: null as string | null, iconKey: m.icon })),
];

const toolNavItemDefs: { id: PageType; labelKey: string; iconKey: string }[] = [
  { id: 'quiz', labelKey: 'sidebar.quizzes', iconKey: 'HelpCircle' },
  { id: 'assignments' as PageType, labelKey: 'sidebar.assignments', iconKey: 'ClipboardList' },
  { id: 'achievements', labelKey: 'sidebar.achievements', iconKey: 'Trophy' },
  { id: 'cheat-sheets' as PageType, labelKey: 'sidebar.cheatSheets', iconKey: 'BookOpen' },
  { id: 'password-checker' as PageType, labelKey: 'sidebar.passwordChecker', iconKey: 'Key' },
  { id: 'leaderboard' as PageType, labelKey: 'sidebar.leaderboard', iconKey: 'TrendingUp' },
  { id: 'career-paths' as PageType, labelKey: 'sidebar.careerPaths', iconKey: 'Target' },
];

const roleNavItemDefs: { id: PageType; labelKey: string; iconKey: string; requiredRole: UserRole }[] = [
  { id: 'teacher-panel', labelKey: 'sidebar.teacherPanel', iconKey: 'Users', requiredRole: 'teacher' },
  { id: 'admin-panel', labelKey: 'sidebar.adminPanel', iconKey: 'Settings', requiredRole: 'admin' },
];

export default function Sidebar() {
  const currentPage = useAppStore(s => s.currentPage);
  const sidebarOpen = useAppStore(s => s.sidebarOpen);
  const setSidebarOpen = useAppStore(s => s.setSidebarOpen);
  const setCurrentPage = useAppStore(s => s.setCurrentPage);
  const completedModules = useAppStore(s => s.completedModules);
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const t = useTranslations();

  // Build navigation items with translated labels
  const mainNavItems = mainNavItemDefs.map(d => ({ ...d, label: t(d.labelKey) }));
  const moduleNavItems = moduleNavItemDefs.map(d => ({ ...d, label: modules.find(m => m.id === d.id)?.title || d.id }));
  const toolNavItems = toolNavItemDefs.map(d => ({ ...d, label: t(d.labelKey) }));
  const roleNavItems = roleNavItemDefs.map(d => ({ ...d, label: t(d.labelKey) }));

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

  const { data: deadlinesData } = useApiQuery<{ upcoming: Array<{ scope: string; scopeId: string; daysLeft: number }> }>(
    ['/api/deadlines/upcoming'],
    { enabled: !!user },
  );

  useEffect(() => {
    if (!deadlinesData?.upcoming) return;
    const map: Record<string, number> = {};
    for (const d of deadlinesData.upcoming) {
      if (d.scope === 'module' || d.scope === 'quiz') {
        if (!map[d.scopeId] || d.daysLeft < map[d.scopeId]) {
          map[d.scopeId] = d.daysLeft;
        }
      }
    }
    setDeadlineMap(map);
  }, [deadlinesData]);

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
    const hasDeadline = deadlineMap[item.id] !== undefined;
    const deadline = deadlineMap[item.id];

    return (
      <motion.button
        onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={`
          w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium
          transition-all duration-200 text-left group relative overflow-hidden
          ${isActive
            ? 'bg-emerald-600/20 text-emerald-400 shadow-sm shadow-emerald-600/10'
            : isRolePanel
              ? 'text-red-400 hover:bg-red-600/10 hover:text-red-300'
              : item.id === 'achievements'
                ? 'text-amber-500 hover:bg-amber-600/10 hover:text-amber-400'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
          }
        `}
      >
        {isActive && (
          <motion.div
            layoutId="activeNav"
            className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r"
            initial={false}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <span className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive
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
        <div className="flex items-center gap-1 shrink-0">
          {hasDeadline && deadline !== undefined && (
            <span className={`flex items-center gap-0.5 text-[10px] font-medium ${
              deadline <= 0 ? 'text-red-400 animate-pulse' : deadline <= 2 ? 'text-orange-400' : 'text-amber-400'
            }`}>
              <Clock size={11} />
              {deadline <= 0 ? '!' : deadline}
            </span>
          )}
          {isCompleted && !isRolePanel && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <CheckCircle2 size={14} className="text-emerald-500" />
            </motion.div>
          )}
        </div>
      </motion.button>
    );
  };

  const SectionHeader = ({ title, isExpanded, onToggle, count, icon }: { title: string; isExpanded: boolean; onToggle: () => void; count?: number; icon?: React.ReactNode }) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/50 rounded-lg transition-all group"
    >
      <span className="flex items-center gap-2">
        {icon && <span className="text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60">{icon}</span>}
        {title}
        {count !== undefined && (
          <span className="text-[10px] bg-emerald-600/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">{count}</span>
        )}
      </span>
      <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
    </button>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-colors duration-200">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-600/20"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Shield size={18} className="text-white" />
            </motion.div>
            <div>
              <h2 className="font-bold text-sm leading-tight text-sidebar-foreground">CyberSec Lab</h2>
              <p className="text-[10px] text-sidebar-foreground/50">{t('sidebar.programCode')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <LanguageSwitcher variant="dashboard" />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground/50 hover:text-sidebar-foreground md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label={t('sidebar.closeSidebar')}
            >
              <X size={18} />
            </Button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-sidebar-accent/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-emerald-400">{completedModules.length}</p>
            <p className="text-[9px] text-sidebar-foreground/50">{t('sidebar.completed')}</p>
          </div>
          <div className="bg-sidebar-accent/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-violet-400">{trackableItems.length}</p>
            <p className="text-[9px] text-sidebar-foreground/50">{t('sidebar.total')}</p>
          </div>
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
          title={t('sidebar.modules')}
          isExpanded={expandedSections.modules}
          onToggle={() => toggleSection('modules')}
          count={completedModules.filter(id => modules.some(m => m.id === id)).length}
          icon={<BookOpen size={12} />}
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
          title={t('sidebar.tools')}
          isExpanded={expandedSections.tools}
          onToggle={() => toggleSection('tools')}
          icon={<Zap size={12} />}
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
            <span className="text-sidebar-foreground/50">{t('sidebar.progress')}</span>
            <span className="text-emerald-400 font-semibold">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-1.5 bg-sidebar-border [&>div]:bg-emerald-500" />
        </div>

        {/* User section */}
        {user && (
          <div className="p-3 space-y-2">
            <motion.button
              onClick={() => { setCurrentPage('profile'); setSidebarOpen(false); }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-violet-600/20">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt={`${t('sidebar.avatar')}: ${user.fullName}`} className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-white" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-sidebar-foreground truncate text-xs">{user.fullName}</p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-1">
                {user.role === 'student' && (
                  <Badge className="text-[9px] px-1.5 py-0 h-5 bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-sm">S</Badge>
                )}
                {user.role === 'teacher' && (
                  <Badge className="text-[9px] px-1.5 py-0 h-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-sm">T</Badge>
                )}
                {user.role === 'admin' && (
                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-5 shadow-sm">A</Badge>
                )}
              </div>
            </motion.button>

            <div className="flex items-center gap-2">
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 bg-red-600/10 hover:bg-red-600/20 hover:text-red-300 transition-all"
              >
                <LogOut size={14} />
                {t('sidebar.logout')}
              </motion.button>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="px-1"
              >
                <SyncIndicator />
              </motion.div>
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
