"use client";

import { useAppStore, getAuthHeaders } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import {
  modules,
  achievements,
  sqlChallenges,
  xssTypes,
  attackSteps,
  secureCodingChallenges,
  quizCategories,
} from "@/lib/data";
import {
  getAchievementStatus,
  countUnlockedAchievements,
} from "@/lib/achievement-utils";
import {
  NotificationHelper,
  loadAnnouncementsIntoNotifications,
} from "@/lib/notification-store";
import NotificationBell from "./NotificationBell";
import ActivityCalendar from "./ActivityCalendar";
import { triggerCelebration } from "./CompletionCelebration";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Shield,
  ShieldCheck,
  Database,
  FileText,
  Link,
  Lock,
  Code,
  HelpCircle,
  KeyRound,
  Menu,
  Trophy,
  Flame,
  BookOpen,
  ChevronRight,
  Star,
  Target,
  ArrowRight,
  Zap,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Activity,
  UserCheck,
  Users,
} from "lucide-react";
import type { PageType } from "@/lib/store";
import type { Announcement } from "@/lib/auth-types";

interface UpcomingDeadline {
  id: string;
  scope: string;
  scopeId: string;
  dueAt: string;
  title: string;
  description: string;
  daysLeft: number;
  isOverdue: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  Shield: <Shield size={28} />,
  ShieldCheck: <ShieldCheck size={28} />,
  Database: <Database size={28} />,
  FileText: <FileText size={28} />,
  Link: <Link size={28} />,
  Lock: <Lock size={28} />,
  Code: <Code size={28} />,
  KeyRound: <KeyRound size={28} />,
};

const achievementIcons: Record<string, React.ReactNode> = {
  "first-steps": <BookOpen size={18} />,
  "sql-master": <Database size={18} />,
  "xss-hunter": <Code size={18} />,
  "security-guard": <Shield size={18} />,
  "auth-expert": <Target size={18} />,
  "code-reviewer": <Code size={18} />,
  "quiz-master": <Trophy size={18} />,
  "quiz-perfect": <Star size={18} />,
  "crypto-ninja": <Lock size={18} />,
  "full-completion": <Zap size={18} />,
  "csrf-shield": <Shield size={18} />,
  "owasp-half": <Shield size={18} />,
  "quiz-all": <Trophy size={18} />,
  "crypto-explorer": <KeyRound size={18} />,
  "coding-pro": <Code size={18} />,
  "headers-guard": <ShieldCheck size={18} />,
  "coding-master": <Code size={18} />,
  "network-ninja": <Shield size={18} />,
  "social-engineer": <Target size={18} />,
  "all-headers-correct": <ShieldCheck size={18} />,
};

function getProficiencyLevel(
  completedCount: number,
  totalModules: number,
  avgScore: number,
  t: ReturnType<typeof useTranslations>,
): { label: string; color: string; bg: string; icon: React.ReactNode } {
  const pct = totalModules > 0 ? completedCount / totalModules : 0;
  if (pct === 0)
    return {
      label: t("proficiency.novice"),
      color: "text-muted-foreground",
      bg: "bg-muted",
      icon: <Star size={14} />,
    };
  if (pct < 0.3)
    return {
      label: t("proficiency.beginner"),
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/40",
      icon: <Star size={14} />,
    };
  if (pct < 0.6)
    return {
      label: t("proficiency.practitioner"),
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-100 dark:bg-sky-900/40",
      icon: <Star size={14} />,
    };
  if (pct < 0.9)
    return {
      label: t("proficiency.advanced"),
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-100 dark:bg-violet-900/40",
      icon: <Star size={14} />,
    };
  if (avgScore >= 80)
    return {
      label: t("proficiency.expert"),
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/40",
      icon: <Trophy size={14} />,
    };
  return {
    label: t("proficiency.advanced"),
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-100 dark:bg-violet-900/40",
    icon: <Star size={14} />,
  };
}

async function fetchActiveAnnouncements(): Promise<Announcement[]> {
  try {
    const res = await fetch("/api/announcements");
    if (!res.ok) return [];
    const data = await res.json();
    return (data.announcements || []) as Announcement[];
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      console.warn("[Dashboard.tsx] fetchActiveAnnouncements failed:", e);
    return [];
  }
}

export default function Dashboard() {
  const t = useTranslations("dashboard");
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const completedModules = useAppStore((s) => s.completedModules);
  const quizScores = useAppStore((s) => s.quizScores);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const sqlCompletedLevels = useAppStore((s) => s.sqlCompletedLevels);
  const xssCompletedLevels = useAppStore((s) => s.xssCompletedLevels);
  const csrfCompletedSteps = useAppStore((s) => s.csrfCompletedSteps);
  const secureCodingAnsweredChallenges = useAppStore(
    (s) => s.secureCodingAnsweredChallenges,
  );
  const owaspChallengeScores = useAppStore((s) => s.owaspChallengeScores);
  const authChallengeScores = useAppStore((s) => s.authChallengeScores);
  const moduleTimestamps = useAppStore((s) => s.moduleTimestamps);
  const quizTimestamps = useAppStore((s) => s.quizTimestamps);
  const user = useAuthStore((s) => s.user);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<
    Set<string>
  >(new Set());
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<
    UpcomingDeadline[]
  >([]);
  const [teacherStats, setTeacherStats] = useState<{
    totalStudents: number;
    activeStudents: number;
    avgModules: number;
    atRiskCount: number;
  } | null>(null);
  useEffect(() => {
    fetchActiveAnnouncements()
      .then(setAnnouncements)
      .catch((e) => {
        if (process.env.NODE_ENV === "development")
          console.warn("[Dashboard] fetchActiveAnnouncements failed:", e);
      });
    loadAnnouncementsIntoNotifications();
    const interval = setInterval(() => {
      fetchActiveAnnouncements()
        .then(setAnnouncements)
        .catch((e) => {
          if (process.env.NODE_ENV === "development")
            console.warn("[Dashboard] fetchActiveAnnouncements failed:", e);
        });
      loadAnnouncementsIntoNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getAuthHeaders()
      .then((headers) => fetch("/api/deadlines/upcoming", { headers }))
      .then((r) => r.json())
      .then((data) => {
        if (data.upcoming) {
          setUpcomingDeadlines(data.upcoming);
          for (const d of data.upcoming) {
            if (d.daysLeft <= 2) {
              NotificationHelper.deadlineWarning(d.title, d.daysLeft);
            }
          }
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV === "development")
          console.error("Dashboard: Failed to load notifications:", err);
      });
  }, []);

  useEffect(() => {
    if (user?.role !== "teacher" && user?.role !== "admin") return;
    getAuthHeaders()
      .then((h) =>
        fetch("/api/analytics/admin-summary?days=30", { headers: h }),
      )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.current) {
          setTeacherStats({
            totalStudents: data.current.totalStudents || 0,
            activeStudents: data.current.activeStudents || 0,
            avgModules: Math.round(data.current.avgCompletionRate || 0),
            atRiskCount: data.atRiskCount || 0,
          });
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV === "development")
          console.warn("Dashboard: Failed to load teacher stats:", err);
      });
  }, [user?.role]);

  const dismissAnnouncement = (id: string) => {
    setDismissedAnnouncements((prev) => new Set([...prev, id]));
  };

  const visibleAnnouncements = useMemo(
    () => announcements.filter((a) => !dismissedAnnouncements.has(a.id)),
    [announcements, dismissedAnnouncements],
  );

  const challengeStats = useMemo(
    () => ({
      owaspCorrect: owaspChallengeScores.correct,
      authCorrect: authChallengeScores.correct,
    }),
    [owaspChallengeScores.correct, authChallengeScores.correct],
  );

  const totalModules = modules.length;
  const completedCount = useMemo(
    () =>
      completedModules.filter((id) => modules.some((m) => m.id === id)).length,
    [completedModules],
  );
  const totalProgress = useMemo(
    () => Math.round((completedCount / totalModules) * 100),
    [completedCount, totalModules],
  );

  const avgQuizScore = useMemo(() => {
    const keys = Object.keys(quizScores);
    if (keys.length === 0) return 0;
    const values = Object.values(quizScores).filter(
      (v) => typeof v === "number" && !Number.isNaN(v),
    );
    return values.length > 0
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0;
  }, [quizScores]);

  const unlockedAchievements = useMemo(
    () =>
      achievements.filter((a) =>
        getAchievementStatus(
          a.id,
          completedModules,
          quizScores,
          challengeStats,
        ),
      ),
    [completedModules, quizScores, challengeStats],
  );

  const nextAchievement = useMemo(
    () =>
      achievements.find(
        (a) =>
          !getAchievementStatus(
            a.id,
            completedModules,
            quizScores,
            challengeStats,
          ),
      ),
    [completedModules, quizScores, challengeStats],
  );

  const unlockedCount = useMemo(
    () =>
      countUnlockedAchievements(completedModules, quizScores, challengeStats),
    [completedModules, quizScores, challengeStats],
  );

  const getModuleProgress = useCallback(
    (moduleId: string, completed: boolean): { pct: number; label: string } => {
      const TOTALS: Record<string, number> = {
        "sql-injection": sqlChallenges.length,
        xss: xssTypes.length,
        csrf: attackSteps.length,
        "secure-coding": secureCodingChallenges.length,
      };
      if (completed) return { pct: 100, label: "" };
      const total = TOTALS[moduleId];
      if (!total) return { pct: 0, label: "" };
      const done = (() => {
        switch (moduleId) {
          case "sql-injection":
            return sqlCompletedLevels.length;
          case "xss":
            return xssCompletedLevels.length;
          case "csrf":
            return csrfCompletedSteps.length;
          case "secure-coding":
            return secureCodingAnsweredChallenges.length;
          default:
            return 0;
        }
      })();
      const pct = Math.round((done / total) * 100);
      return { pct, label: `${done}/${total}` };
    },
    [
      sqlCompletedLevels.length,
      xssCompletedLevels.length,
      csrfCompletedSteps.length,
      secureCodingAnsweredChallenges.length,
    ],
  );

  const prevUnlockedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const current = new Set(unlockedAchievements.map((a) => a.id));
    const prev = prevUnlockedRef.current;
    for (const id of current) {
      if (!prev.has(id)) {
        const achievement = achievements.find((a) => a.id === id);
        if (achievement) {
          toast.success(`🏆 ${achievement.title}`, {
            description: achievement.description,
            duration: 5000,
          });
          NotificationHelper.achievementUnlocked(
            achievement.title,
            achievement.description,
          );
          triggerCelebration({
            type: "achievement",
            title: `🏆 ${achievement.title}`,
            subtitle: achievement.description,
          });
        }
      }
    }
    prevUnlockedRef.current = current;
  }, [unlockedAchievements]);

  const proficiency = getProficiencyLevel(
    completedCount,
    totalModules,
    avgQuizScore,
    t,
  );

  const activityTimeline = useMemo(() => {
    const events: Array<{
      date: Date;
      type: "module" | "quiz";
      label: string;
    }> = [];
    for (const [moduleId, ts] of Object.entries(moduleTimestamps)) {
      const mod = modules.find((m) => m.id === moduleId);
      if (mod) {
        events.push({
          date: new Date(ts),
          type: "module" as const,
          label: mod.title,
        });
      }
    }
    for (const [quizId, ts] of Object.entries(quizTimestamps)) {
      events.push({
        date: new Date(ts),
        type: "quiz" as const,
        label: t("activityTimeline.quizPrefix", { id: quizId }),
      });
    }
    events.sort((a, b) => b.date.getTime() - a.date.getTime());
    return events;
  }, [moduleTimestamps, quizTimestamps, t]);

  const streakData = useMemo(() => {
    const allDates = new Set<string>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const ts of Object.values(moduleTimestamps)) {
      const d = new Date(ts);
      d.setHours(0, 0, 0, 0);
      allDates.add(d.toISOString().split("T")[0]);
    }
    for (const ts of Object.values(quizTimestamps)) {
      const d = new Date(ts);
      d.setHours(0, 0, 0, 0);
      allDates.add(d.toISOString().split("T")[0]);
    }

    if (allDates.size === 0)
      return { current: 0, longest: 0, isToday: false, daysSinceLast: 999 };

    let current = 0;
    const todayStr = today.toISOString().split("T")[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const checkDate = allDates.has(todayStr)
      ? today
      : allDates.has(yesterdayStr)
        ? yesterday
        : null;
    if (checkDate) {
      while (checkDate) {
        const dateStr = checkDate.toISOString().split("T")[0];
        if (allDates.has(dateStr)) {
          current++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    let longest = 0;
    let currentLongest = 0;
    const sortedAsc = Array.from(allDates).sort();
    for (let i = 0; i < sortedAsc.length; i++) {
      if (i === 0) {
        currentLongest = 1;
      } else {
        const prev = new Date(sortedAsc[i - 1]);
        const curr = new Date(sortedAsc[i]);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        currentLongest = diff === 1 ? currentLongest + 1 : 1;
      }
      longest = Math.max(longest, currentLongest);
    }

    const lastDate = new Date(sortedAsc[sortedAsc.length - 1]);
    const daysSinceLast = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      current,
      longest: Math.max(longest, current),
      isToday: allDates.has(todayStr),
      daysSinceLast,
    };
  }, [moduleTimestamps, quizTimestamps]);

  const recommendation = useMemo(() => {
    const buildRecommendation = () => {
      if (user?.role === "admin" && completedModules.length === 0) {
        return {
          text: t("recommendations.adminNew"),
          page: "admin-panel" as PageType,
        };
      }
      if (user?.role === "teacher" && completedModules.length === 0) {
        return {
          text: t("recommendations.teacherNew"),
          page: "teacher-panel" as PageType,
        };
      }

      if (streakData.current >= 7) {
        return {
          text: t("recommendations.greatStreak", {
            streak: streakData.current,
          }),
          page: "achievements" as PageType,
        };
      }
      if (streakData.current === 0 && streakData.daysSinceLast >= 3) {
        const nextModule = modules.find(
          (m) => !completedModules.includes(m.id),
        );
        return {
          text: t("recommendations.inactive", {
            days: streakData.daysSinceLast,
          }),
          page: (nextModule?.id || "quiz") as PageType,
        };
      }

      if (completedModules.length === 0) {
        return {
          text: t("recommendations.startOwasp"),
          page: "owasp" as PageType,
        };
      }
      if (!completedModules.includes("sql-injection")) {
        return {
          text: t("recommendations.trySql"),
          page: "sql-injection" as PageType,
        };
      }
      if (!completedModules.includes("xss")) {
        return { text: t("recommendations.learnXss"), page: "xss" as PageType };
      }
      if (!completedModules.includes("csrf")) {
        return {
          text: t("recommendations.learnCsrf"),
          page: "csrf" as PageType,
        };
      }
      if (!completedModules.includes("security-headers")) {
        return {
          text: t("recommendations.masterHeaders"),
          page: "security-headers" as PageType,
        };
      }
      if (!completedModules.includes("auth")) {
        return { text: t("recommendations.tryAuth"), page: "auth" as PageType };
      }
      if (!completedModules.includes("secure-coding")) {
        return {
          text: t("recommendations.practiceCoding"),
          page: "secure-coding" as PageType,
        };
      }
      if (!completedModules.includes("tools")) {
        return {
          text: t("recommendations.tryTools"),
          page: "tools" as PageType,
        };
      }
      if (!completedModules.includes("api-security")) {
        return {
          text: t("recommendations.learnApi"),
          page: "api-security" as PageType,
        };
      }
      if (Object.keys(quizScores).length < 11) {
        return {
          text: t("recommendations.tryQuizzes"),
          page: "quiz" as PageType,
        };
      }
      if (totalProgress < 100) {
        const nextModule = modules.find(
          (m) => !completedModules.includes(m.id),
        );
        return {
          text: t("recommendations.finishModules"),
          page: (nextModule?.id || "dashboard") as PageType,
        };
      }
      return {
        text: t("recommendations.allDone"),
        page: "achievements" as PageType,
      };
    };
    return buildRecommendation();
  }, [user?.role, completedModules, quizScores, totalProgress, streakData, t]);

  const [showAllActivity, setShowAllActivity] = useState(false);

  const handleStartModule = (moduleId: string) => {
    setCurrentPage(moduleId as PageType);
  };

  const quickActions = [
    ...(user?.role === "admin" || user?.role === "teacher"
      ? [
          {
            label: t("quickActions.adminPanel"),
            page: "admin-panel" as PageType,
            icon: Shield,
            color: "bg-red-100 text-red-600",
          },
        ]
      : []),
    ...(user?.role === "teacher" || user?.role === "admin"
      ? [
          {
            label: t("quickActions.teacherPanel"),
            page: "teacher-panel" as PageType,
            icon: UserCheck,
            color: "bg-amber-100 text-amber-600",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Mobile top bar */}
      <div className="flex items-center gap-3 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={t("openMenu")}
        >
          <Menu size={22} />
        </Button>
        <Shield size={22} className="text-emerald-600" />
        <span className="font-bold text-lg">CyberSec Lab</span>
        <div className="ml-auto">
          <NotificationBell />
        </div>
      </div>

      {/* Announcements */}
      {visibleAnnouncements.length > 0 && (
        <div className="space-y-2">
          {visibleAnnouncements.map((ann) => {
            const priorityStyles = {
              high: {
                border: "border-red-300",
                bg: "bg-red-50",
                icon: AlertCircle,
                color: "text-red-600",
              },
              normal: {
                border: "border-blue-200",
                bg: "bg-blue-50",
                icon: Info,
                color: "text-blue-600",
              },
              low: {
                border: "border-border",
                bg: "bg-secondary",
                icon: Info,
                color: "text-muted-foreground",
              },
            };
            const ps = priorityStyles[ann.priority];
            const Icon = ps.icon;
            return (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg border ${ps.border} ${ps.bg} p-4`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon size={18} className={ps.color + " mt-0.5 shrink-0"} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground/80">
                          {ann.title}
                        </p>
                        {ann.priority === "high" && (
                          <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">
                            {t("announcement.important")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ann.content}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAnnouncement(ann.id)}
                    className="text-slate-400 hover:text-muted-foreground shrink-0"
                    aria-label={t("announcement.dismiss", { title: ann.title })}
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white p-6 md:p-10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="bg-emerald-600/30 text-emerald-300 border-emerald-600/30">
              {t("heroBadge")}
            </Badge>
            <Badge
              className={`${proficiency.bg} ${proficiency.color} border-0`}
            >
              {proficiency.icon} {proficiency.label}
            </Badge>
          </div>
          <h1 className="text-xl md:text-3xl font-bold mb-3">
            {t("welcome")}
            {user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
            {t("subtitle")}
          </p>
          <div className="flex flex-wrap gap-3 md:gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen size={16} className="text-emerald-400" />
              <span className="text-slate-300">
                {totalModules} {t("stats.modules")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Flame size={16} className="text-emerald-400" />
              <span className="text-slate-300">
                {totalProgress}% {t("stats.progressLabel")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Trophy size={16} className="text-emerald-400" />
              <span className="text-slate-300">
                {avgQuizScore > 0
                  ? `${t("stats.avgScoreLabel")} ${avgQuizScore}%`
                  : t("takeQuiz")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star size={16} className="text-amber-400" />
              <span className="text-slate-300">
                {unlockedCount} {t("stats.achievementsLabel")}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats grid - key metrics first */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {[
          {
            label: t("stats.modulesLabel"),
            value: `${completedCount}/${totalModules}`,
            color: "text-emerald-600",
          },
          {
            label: t("stats.quizzes"),
            value: `${Object.keys(quizScores).length}/${quizCategories.length}`,
            color: "text-amber-600",
          },
          {
            label: t("stats.avgScore"),
            value: `${avgQuizScore}%`,
            color: "text-sky-600",
          },
          {
            label: t("achievements"),
            value: `${unlockedCount}/${achievements.length}`,
            color: "text-violet-600",
          },
          {
            label: streakData.current > 0 ? t("streak") : t("stats.noStreak"),
            value:
              streakData.current > 0
                ? `${streakData.current} ${t("days")}`
                : "—",
            color: "text-orange-600",
            tooltip:
              streakData.longest > 0
                ? t("stats.bestStreak", { streak: streakData.longest })
                : undefined,
            streakKey: true,
          },
          {
            label: t("level"),
            value: proficiency.label,
            color: proficiency.color,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                {"streakKey" in stat ? (
                  <>
                    <Flame
                      size={20}
                      className={`mx-auto mb-1 ${streakData.current > 0 ? "text-orange-500" : "text-slate-300"}`}
                    />
                    <p className={`text-xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                    {stat.tooltip && streakData.longest > 0 && (
                      <p className="text-[10px] text-orange-500 mt-0.5">
                        {stat.tooltip}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stat.label}
                    </p>
                  </>
                ) : (
                  <>
                    <p
                      className={`text-xl md:text-2xl font-bold ${stat.color}`}
                    >
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.label}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      {quickActions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              onClick={() => setCurrentPage(action.page)}
              className={`flex items-center gap-2 ${action.color} border-border`}
            >
              <action.icon size={16} />
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Teacher/Admin: Class Overview */}
      {teacherStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50"
        >
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">
              {t("classOverview")}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xl font-bold text-amber-700">
                {teacherStats.totalStudents}
              </p>
              <p className="text-xs text-amber-600/80">
                {t("stats.totalStudents")}
              </p>
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-700">
                {teacherStats.activeStudents}
              </p>
              <p className="text-xs text-emerald-600/80">
                {t("stats.active30d")}
              </p>
            </div>
            <div>
              <p className="text-xl font-bold text-violet-700">
                {teacherStats.avgModules}%
              </p>
              <p className="text-xs text-violet-600/80">
                {t("stats.avgCompletion")}
              </p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-600">
                {teacherStats.atRiskCount}
              </p>
              <p className="text-xs text-red-500/80">{t("stats.atRisk")}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommendation + Next Achievement side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card
            className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 cursor-pointer hover:shadow-md transition-shadow h-full"
            onClick={() => setCurrentPage(recommendation.page)}
          >
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                  <ArrowRight size={20} />
                </div>
                <div>
                  <p className="text-xs text-emerald-600 font-medium">
                    {t("recommendation")}
                  </p>
                  <p className="text-sm font-semibold text-foreground/80">
                    {recommendation.text}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-emerald-400 shrink-0" />
            </CardContent>
          </Card>
        </motion.div>

        {nextAchievement && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 h-full">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                  {achievementIcons[nextAchievement.id]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-600">
                    {t("nextAchievement")}
                  </p>
                  <p className="text-sm font-semibold text-amber-900">
                    {nextAchievement.title}
                  </p>
                  <p className="text-[11px] text-amber-700">
                    {nextAchievement.condition}
                  </p>
                </div>
                <Trophy size={20} className="text-amber-300 shrink-0" />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-none shadow-sm bg-card">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Clock size={16} className="text-orange-500" />
                {t("upcomingDeadlines")}
              </h3>
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline) => {
                  const urgencyColor = deadline.isOverdue
                    ? "border-l-crimson-500 bg-red-50"
                    : deadline.daysLeft <= 1
                      ? "border-l-red-500 bg-red-50"
                      : deadline.daysLeft <= 3
                        ? "border-l-orange-500 bg-orange-50"
                        : "border-l-emerald-500 bg-emerald-50";

                  const urgencyBadge = deadline.isOverdue ? (
                    <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">
                      {t("deadline.overdue")}
                    </Badge>
                  ) : deadline.daysLeft <= 1 ? (
                    <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">
                      {deadline.daysLeft === 0
                        ? t("deadline.today")
                        : t("deadline.tomorrow")}
                    </Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px]">
                      {deadline.daysLeft} {t("days")}
                    </Badge>
                  );

                  const scopeLabel =
                    deadline.scope === "course"
                      ? t("deadline.scopeCourse")
                      : deadline.scope === "module"
                        ? modules.find((m) => m.id === deadline.scopeId)
                            ?.title || deadline.scopeId
                        : t("deadline.scopeQuiz", { id: deadline.scopeId });

                  const dueDate = new Date(deadline.dueAt).toLocaleDateString(
                    "ru-RU",
                    {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  );

                  const targetPage: PageType =
                    deadline.scope === "course"
                      ? "dashboard"
                      : deadline.scope === "module"
                        ? (deadline.scopeId as PageType)
                        : "quiz";

                  return (
                    <div
                      key={deadline.id}
                      className={`rounded-lg border-l-4 ${urgencyColor} p-4 cursor-pointer hover:shadow-md transition-shadow`}
                      onClick={() => setCurrentPage(targetPage)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-foreground/80 truncate">
                              {deadline.title}
                            </p>
                            {urgencyBadge}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {scopeLabel}
                          </p>
                          {deadline.description && (
                            <p className="text-xs text-slate-400 mt-1">
                              {deadline.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {dueDate}
                          </p>
                          <ChevronRight
                            size={14}
                            className="text-slate-300 mt-1 ml-auto"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Module Cards */}
      <div>
        <h2 className="text-lg md:text-xl font-bold mb-4">
          {t("learningModules")}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {modules.map((mod, i) => {
            const isCompleted = completedModules.includes(mod.id);
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card
                  className="group cursor-pointer border-border hover:border-emerald-300 hover:shadow-md transition-all duration-300 overflow-hidden h-full"
                  onClick={() => handleStartModule(mod.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex">
                      <div
                        className={`w-16 md:w-20 shrink-0 flex items-center justify-center ${
                          isCompleted ? "bg-emerald-50" : "bg-secondary"
                        }`}
                      >
                        <span
                          className={
                            isCompleted ? "text-emerald-600" : "text-slate-400"
                          }
                        >
                          {iconMap[mod.icon]}
                        </span>
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm group-hover:text-emerald-700 transition-colors">
                              {mod.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                              {mod.description}
                            </p>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-slate-300 group-hover:text-emerald-500 transition-colors mt-1 shrink-0"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${mod.difficultyColor}`}
                          >
                            {mod.difficulty}
                          </Badge>
                          <span className="text-[11px] text-slate-400">
                            {mod.lessons} {t("module.lessons")}
                          </span>
                          {isCompleted && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">
                              {t("module.completed")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {(() => {
                      const { pct, label } = getModuleProgress(
                        mod.id,
                        isCompleted,
                      );
                      return pct > 0 || isCompleted ? (
                        <div className="px-4 pb-3 pt-1">
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-emerald-500" : "bg-emerald-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {label && (
                            <p className="text-[10px] text-slate-400 mt-1">
                              {label}
                            </p>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Quiz + Achievements cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: modules.length * 0.04 }}
          >
            <Card
              className="group cursor-pointer border-amber-200 hover:border-amber-400 hover:shadow-md transition-all duration-300 overflow-hidden h-full"
              onClick={() => setCurrentPage("quiz")}
            >
              <CardContent className="p-0">
                <div className="flex">
                  <div className="w-16 md:w-20 shrink-0 flex items-center justify-center bg-amber-50">
                    <span className="text-amber-500">
                      <HelpCircle size={28} />
                    </span>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm group-hover:text-amber-700 transition-colors">
                          {t("quizCard.title")}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {t("quizCard.description")}
                        </p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-slate-300 group-hover:text-amber-500 transition-colors mt-1 shrink-0"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">
                        {t("quizCard.categoriesBadge")}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        {t("quizCard.questionsBadge")}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (modules.length + 1) * 0.04 }}
          >
            <Card
              className="group cursor-pointer border-violet-200 hover:border-violet-400 hover:shadow-md transition-all duration-300 overflow-hidden h-full"
              onClick={() => setCurrentPage("achievements")}
            >
              <CardContent className="p-0">
                <div className="flex">
                  <div className="w-16 md:w-20 shrink-0 flex items-center justify-center bg-violet-50">
                    <span className="text-violet-500">
                      <Trophy size={28} />
                    </span>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm group-hover:text-violet-700 transition-colors">
                          {t("achievementsCard.title")}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {t("achievementsCard.description")}
                        </p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-slate-300 group-hover:text-violet-500 transition-colors mt-1 shrink-0"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge className="bg-violet-100 text-violet-700 border-0 text-[10px]">
                        {t("achievementsCard.unlocked", {
                          unlocked: unlockedCount,
                          total: achievements.length,
                        })}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        {t("achievementsCard.terms")}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Activity Calendar + Timeline side by side on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActivityCalendar />

        {activityTimeline.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-border h-full">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Activity size={16} className="text-indigo-500" />
                    {t("activityTimeline.title")}
                  </h3>
                  {activityTimeline.length > 5 && (
                    <button
                      onClick={() => setShowAllActivity(!showAllActivity)}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      {showAllActivity
                        ? t("activityTimeline.collapse")
                        : t("activityTimeline.showAll")}
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {(showAllActivity
                    ? activityTimeline
                    : activityTimeline.slice(0, 5)
                  ).map((event, i) => (
                    <motion.div
                      key={`${event.type}-${event.label}-${event.date.getTime()}-${i}`}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0"
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          event.type === "module"
                            ? "bg-emerald-100"
                            : "bg-amber-100"
                        }`}
                      >
                        {event.type === "module" ? (
                          <CheckCircle2
                            size={14}
                            className="text-emerald-600"
                          />
                        ) : (
                          <Trophy size={14} className="text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {event.label}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {event.date.toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {event.type === "module"
                          ? t("activityTimeline.moduleBadge")
                          : t("activityTimeline.quizBadge")}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Overall progress */}
      <Card className="border-none shadow-sm bg-card">
        <CardContent className="p-6">
          <h3 className="font-semibold text-sm mb-3">{t("overallProgress")}</h3>
          <Progress value={totalProgress} className="h-3 mb-2" />
          <p className="text-xs text-muted-foreground">
            {totalProgress === 100
              ? t("progressCompleteMessage")
              : totalProgress === 0
                ? t("progressStartMessage")
                : t("progressContinueMessage", {
                    remaining: totalModules - completedCount,
                  })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
