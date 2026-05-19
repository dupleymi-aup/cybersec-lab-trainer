'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  User, BookOpen, Trophy, Activity, Award, AlertTriangle, Loader2,
  CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { getStudentPerformance, type StudentPerformanceData } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import KPICard from './KPICard';

const PERIOD_OPTIONS = [
  { key: 7, label: '7д' },
  { key: 30, label: '30д' },
  { key: 90, label: '90д' },
  { key: 180, label: '180д' },
];

interface Props {
  userId: string;
  initialDays?: number;
  groupId?: string;
}

export default function StudentPerformanceReport({ userId, initialDays = 30, groupId: _groupId }: Props) {
  const [data, setData] = useState<StudentPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(initialDays);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getStudentPerformance(userId, days)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message || 'Ошибка загрузки'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [userId, days]);

  if (!userId) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-slate-500">Выберите студента для просмотра отчёта</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-sm text-slate-500 ml-3">Загрузка данных...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="text-red-500" />
        <p className="text-sm text-slate-600 font-medium ml-3">Ошибка загрузки</p>
      </div>
    );
  }

  const { profile, kpis, moduleProgress, quizResults, categoryBreakdown, activityTimeline, achievements } = data;

  const riskColor = kpis.riskScore >= 70 ? 'text-red-600' : kpis.riskScore >= 30 ? 'text-amber-600' : 'text-emerald-600';
  const riskBg = kpis.riskScore >= 70 ? 'bg-red-50' : kpis.riskScore >= 30 ? 'bg-amber-50' : 'bg-emerald-50';

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {PERIOD_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setDays(key)}
            className={`px-3 py-1.5 text-xs rounded-md transition-all ${
              days === key ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Profile Card */}
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <User size={32} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">{profile.fullName}</h2>
              <p className="text-sm text-slate-500">{profile.email}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {profile.group && <Badge variant="secondary">{profile.group}</Badge>}
                {profile.course && <Badge variant="outline">{profile.course}</Badge>}
                {profile.university && <Badge variant="outline">{profile.university}</Badge>}
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg ${riskBg}`}>
              <p className={`text-2xl font-bold ${riskColor}`}>{kpis.riskScore}</p>
              <p className="text-xs text-slate-500">Риск</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<BookOpen size={18} />}
          value={`${kpis.modulesCompleted}/${kpis.totalModules}`}
          label="Модули"
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <KPICard
          icon={<Trophy size={18} />}
          value={`${kpis.avgQuizScore}%`}
          label="Ср. балл квизов"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <KPICard
          icon={<Activity size={18} />}
          value={kpis.totalQuizAttempts}
          label="Попыток квизов"
          iconBg="bg-sky-100"
          iconColor="text-sky-600"
        />
        <KPICard
          icon={<Clock size={18} />}
          value={kpis.lastActiveDays === 0 ? 'Сегодня' : `${kpis.lastActiveDays}д назад`}
          label="Последняя активность"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="text-xs">Обзор</TabsTrigger>
          <TabsTrigger value="modules" className="text-xs">Модули</TabsTrigger>
          <TabsTrigger value="quizzes" className="text-xs">Квизы</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">Активность</TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs">Достижения</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {categoryBreakdown.length > 0 && (
            <Card className="border-slate-200">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4">Результаты по категориям квизов</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="correctRate" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {activityTimeline.length > 0 && (
            <Card className="border-slate-200">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4">Последняя активность</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {activityTimeline.slice(0, 15).map((activity, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"
                    >
                      {activity.type === 'login' ? (
                        <CheckCircle size={16} className="text-emerald-500" />
                      ) : activity.type === 'module_completed' ? (
                        <Trophy size={16} className="text-amber-500" />
                      ) : (
                        <Activity size={16} className="text-sky-500" />
                      )}
                      <div className="flex-1">
                        <p className="text-xs font-medium">{activity.details}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(activity.date).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="mt-4 space-y-4">
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Прогресс по модулям</h3>
              <div className="space-y-2">
                {moduleProgress.map((module, i) => (
                  <motion.div
                    key={module.moduleId}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      {module.completed ? (
                        <CheckCircle size={18} className="text-emerald-500" />
                      ) : (
                        <XCircle size={18} className="text-slate-300" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{module.moduleName}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(module.updatedAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    {module.score !== null && (
                      <Badge variant={module.score >= 70 ? 'default' : module.score >= 50 ? 'secondary' : 'destructive'}>
                        {module.score}%
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="mt-4 space-y-4">
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Результаты квизов</h3>
              {quizResults.length > 0 ? (
                <div className="space-y-2">
                  {quizResults.map((quiz, i) => (
                    <motion.div
                      key={quiz.quizId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100"
                    >
                      <div>
                        <p className="text-sm font-medium">{quiz.quizId}</p>
                        <p className="text-[10px] text-slate-400">
                          {quiz.score}/{quiz.total} правильных
                        </p>
                      </div>
                      <Badge variant={quiz.percentage >= 70 ? 'default' : quiz.percentage >= 50 ? 'secondary' : 'destructive'}>
                        {quiz.percentage}%
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">Нет результатов квизов</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-4 space-y-4">
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Хронология активности</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activityTimeline.map((activity, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-100"
                  >
                    {activity.type === 'login' ? (
                      <CheckCircle size={16} className="text-emerald-500 mt-0.5" />
                    ) : activity.type === 'module_completed' ? (
                      <Trophy size={16} className="text-amber-500 mt-0.5" />
                    ) : (
                      <Activity size={16} className="text-sky-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-medium">{activity.details}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(activity.date).toLocaleString('ru-RU')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {activity.type === 'login' ? 'Вход' : activity.type === 'module_completed' ? 'Модуль' : 'Прогресс'}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement, i) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`border-slate-200 ${achievement.unlocked ? 'bg-amber-50/50' : 'opacity-60'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        achievement.unlocked ? 'bg-amber-100' : 'bg-slate-100'
                      }`}>
                        <Award size={20} className={achievement.unlocked ? 'text-amber-600' : 'text-slate-400'} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{achievement.title}</p>
                        <p className="text-xs text-slate-500">{achievement.description}</p>
                        {achievement.unlocked && achievement.unlockedAt && (
                          <p className="text-[10px] text-emerald-600 mt-1">
                            Получено {new Date(achievement.unlockedAt).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
