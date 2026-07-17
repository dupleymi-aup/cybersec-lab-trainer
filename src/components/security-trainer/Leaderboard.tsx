'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Target, Flame, Crown, Award } from 'lucide-react';

interface StudentStats {
  id: string;
  name: string;
  group: string;
  modulesCompleted: number;
  quizAvg: number;
  achievements: number;
  streak: number;
  lastActive: string;
  xp: number;
}

function calculateXP(stats: Omit<StudentStats, 'xp'>): number {
  return stats.modulesCompleted * 100 + Math.round(stats.quizAvg * 5) + stats.achievements * 50 + stats.streak * 10;
}

// Simulated student data (in production, this would come from the API)
const generateSimulatedStudents = (currentUserId: string): StudentStats[] => {
  const students = [
    {
      id: 'usr_1',
      name: 'Alexey Petrov',
      group: 'CS-21',
      modulesCompleted: 10,
      quizAvg: 92,
      achievements: 18,
      streak: 15,
      lastActive: '2026-05-19',
    },
    {
      id: 'usr_2',
      name: 'Maria Ivanova',
      group: 'CS-21',
      modulesCompleted: 9,
      quizAvg: 88,
      achievements: 16,
      streak: 12,
      lastActive: '2026-05-18',
    },
    {
      id: 'usr_3',
      name: 'Dmitry Kozlov',
      group: 'CS-22',
      modulesCompleted: 8,
      quizAvg: 85,
      achievements: 14,
      streak: 8,
      lastActive: '2026-05-17',
    },
    {
      id: 'usr_4',
      name: 'Anna Smirnova',
      group: 'CS-21',
      modulesCompleted: 8,
      quizAvg: 78,
      achievements: 12,
      streak: 5,
      lastActive: '2026-05-19',
    },
    {
      id: 'usr_5',
      name: 'Igor Volkov',
      group: 'CS-22',
      modulesCompleted: 7,
      quizAvg: 82,
      achievements: 13,
      streak: 10,
      lastActive: '2026-05-18',
    },
    {
      id: 'usr_6',
      name: 'Elena Novikova',
      group: 'CS-21',
      modulesCompleted: 6,
      quizAvg: 75,
      achievements: 10,
      streak: 3,
      lastActive: '2026-05-16',
    },
    {
      id: 'usr_7',
      name: 'Sergey Morozov',
      group: 'CS-22',
      modulesCompleted: 6,
      quizAvg: 70,
      achievements: 9,
      streak: 2,
      lastActive: '2026-05-15',
    },
    {
      id: 'usr_8',
      name: 'Olga Sokolova',
      group: 'CS-21',
      modulesCompleted: 5,
      quizAvg: 68,
      achievements: 8,
      streak: 4,
      lastActive: '2026-05-19',
    },
    {
      id: 'usr_9',
      name: 'Andrey Lebedev',
      group: 'CS-22',
      modulesCompleted: 4,
      quizAvg: 62,
      achievements: 6,
      streak: 1,
      lastActive: '2026-05-14',
    },
    {
      id: 'usr_10',
      name: 'Natalya Kuznetsova',
      group: 'CS-21',
      modulesCompleted: 3,
      quizAvg: 55,
      achievements: 4,
      streak: 0,
      lastActive: '2026-05-10',
    },
  ];

  // Add xp to each simulated student
  const studentsWithXP = students.map((s: Omit<StudentStats, 'xp'>) => ({
    ...s,
    xp: calculateXP(s),
  }));

  // Add current user
  const currentUser: StudentStats = {
    id: currentUserId,
    name: 'You',
    group: '—',
    modulesCompleted: 0,
    quizAvg: 0,
    achievements: 0,
    streak: 0,
    lastActive: new Date().toISOString().split('T')[0],
    xp: 0,
  };

  return [...studentsWithXP, currentUser];
};

const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function Leaderboard() {
  const t = useTranslations('leaderboard');
  const completedModules = useAppStore((s) => s.completedModules);
  const quizScores = useAppStore((s) => s.quizScores);
  const user = useAuthStore((s) => s.user);
  const [sortBy, setSortBy] = useState<'xp' | 'modules' | 'quiz' | 'streak'>('xp');

  const allStudents = useMemo(() => {
    const students = generateSimulatedStudents(user?.id || 'current');

    // Update current user stats from store
    const quizAvgValues = Object.values(quizScores);
    const avgQuiz =
      quizAvgValues.length > 0 ? Math.round(quizAvgValues.reduce((a, b) => a + b, 0) / quizAvgValues.length) : 0;

    return students.map((s) => {
      if (s.id === (user?.id || 'current')) {
        return {
          ...s,
          modulesCompleted: completedModules.length,
          quizAvg: avgQuiz,
          xp: calculateXP({
            ...s,
            modulesCompleted: completedModules.length,
            quizAvg: avgQuiz,
          }),
        };
      }
      return { ...s, xp: calculateXP(s) };
    });
  }, [user, completedModules, quizScores]);

  const sortedStudents = useMemo(() => {
    return [...allStudents].sort((a, b) => {
      switch (sortBy) {
        case 'xp':
          return b.xp - a.xp;
        case 'modules':
          return b.modulesCompleted - a.modulesCompleted;
        case 'quiz':
          return b.quizAvg - a.quizAvg;
        case 'streak':
          return b.streak - a.streak;
        default:
          return 0;
      }
    });
  }, [allStudents, sortBy]);

  const currentUserRank = useMemo(() => {
    return sortedStudents.findIndex((s) => s.id === (user?.id || 'current')) + 1;
  }, [sortedStudents, user]);

  const currentUserStats = allStudents.find((s) => s.id === (user?.id || 'current'));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
            <Trophy className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-foreground text-xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      {/* User Stats Card */}
      {currentUserStats && (
        <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-900/20 dark:to-orange-900/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">#{currentUserRank}</div>
                <div className="text-muted-foreground text-xs">{t('yourRank')}</div>
              </div>
              <div className="flex-1">
                <h3 className="text-foreground font-semibold">{t('yourStats')}</h3>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Target size={14} className="text-emerald-500" />
                    <span className="text-sm">{completedModules.length} {t('modulesLabel')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star size={14} className="text-amber-500" />
                    <span className="text-sm">{currentUserStats.quizAvg}% {t('quizzesLabel')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Flame size={14} className="text-orange-500" />
                    <span className="text-sm">{currentUserStats.streak} {t('daysLabel')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap size={14} className="text-violet-500" />
                    <span className="text-sm">{currentUserStats.xp} XP</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{currentUserStats.xp}</div>
                <div className="text-muted-foreground text-xs">XP</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sort Tabs */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-muted-foreground text-sm">{t('sortBy')}</span>
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="xp" className="flex items-center gap-1.5">
              <Zap size={14} /> {t('sortXP')}
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-1.5">
              <Target size={14} /> {t('sortModules')}
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center gap-1.5">
              <Star size={14} /> {t('sortQuizzes')}
            </TabsTrigger>
            <TabsTrigger value="streak" className="flex items-center gap-1.5">
              <Flame size={14} /> {t('sortStreak')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {sortedStudents.map((student, index) => {
          const isCurrentUser = student.id === (user?.id || 'current');
          const rank = index + 1;

          return (
            <Card
              key={student.id}
              className={`border transition ${
                isCurrentUser
                  ? 'border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-900/20'
                  : 'border-border/50 hover:border-border'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: rank <= 3 ? medalColors[rank - 1] : 'transparent',
                    }}
                  >
                    {rank <= 3 ? (
                      <Crown size={18} className="text-white" />
                    ) : (
                      <span className="text-muted-foreground text-sm font-bold">{rank}</span>
                    )}
                  </div>

                  {/* Name & Group */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`truncate font-semibold ${isCurrentUser ? 'text-violet-700 dark:text-violet-300' : 'text-foreground'}`}
                      >
                        {student.name}
                      </p>
                      {isCurrentUser && <Badge className="bg-violet-600 text-xs">{t('you')}</Badge>}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {student.group} · {t('activity')}: {student.lastActive}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden items-center gap-4 text-sm md:flex">
                    <div className="text-center">
                      <div className="text-foreground font-semibold">{student.modulesCompleted}</div>
                      <div className="text-muted-foreground text-xs">{t('modules')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-foreground font-semibold">{student.quizAvg}%</div>
                      <div className="text-muted-foreground text-xs">{t('quizzes')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-foreground font-semibold">{student.achievements}</div>
                      <div className="text-muted-foreground text-xs">{t('achievements')}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 font-semibold text-orange-500">
                        <Flame size={14} />
                        {student.streak}
                      </div>
                      <div className="text-muted-foreground text-xs">{t('days')}</div>
                    </div>
                  </div>

                  {/* XP */}
                  <div className="w-16 shrink-0 text-right">
                    <div className="font-bold text-violet-600 dark:text-violet-400">{student.xp}</div>
                    <div className="text-muted-foreground text-xs">XP</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2">
                  <Progress value={(student.modulesCompleted / 12) * 100} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* How XP is calculated */}
      <Card className="border-border/50 mt-6">
        <CardContent className="p-5">
          <h3 className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
            <Award size={16} className="text-amber-500" />
            {t('howXP')}
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: t('xpModule'), value: '+100 XP', desc: t('xpModuleDesc') },
              { label: t('xpQuiz'), value: '+5 XP', desc: t('xpQuizDesc') },
              { label: t('xpAchievement'), value: '+50 XP', desc: t('xpAchievementDesc') },
              { label: t('xpStreak'), value: '+10 XP', desc: t('xpStreakDesc') },
            ].map((item, i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="font-bold text-violet-600 dark:text-violet-400">{item.value}</div>
                <div className="text-foreground text-sm font-medium">{item.label}</div>
                <div className="text-muted-foreground text-xs">{item.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
