'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Loader2, AlertTriangle, Users, BookOpen, HelpCircle, Award, Activity } from 'lucide-react';
import { getStudentPerformance, type StudentPerformanceData } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentDrillDown({
  userId,
  days = 30,
  onClose,
}: {
  userId: string;
  days?: number;
  onClose: () => void;
}) {
  const [data, setData] = useState<StudentPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleExport = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-report-${data.profile?.fullName || userId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          className="relative w-full max-w-4xl max-h-[80vh] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">
                  {data?.profile?.fullName || 'Загрузка...'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {data?.profile?.email} {data?.profile?.group && `• ${data.profile.group}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleExport} variant="outline" size="sm" disabled={!data}>
                <Download size={14} className="mr-1" /> Экспорт
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X size={18} />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="text-sm text-muted-foreground ml-3">Загрузка данных студента...</p>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center py-16">
                <AlertTriangle size={32} className="text-red-500" />
                <p className="text-sm text-muted-foreground font-medium ml-3">{error}</p>
              </div>
            )}

            {data && !loading && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="border-border">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{data.kpis?.modulesCompleted ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Модулей пройдено</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{data.kpis?.avgQuizScore ?? 0}%</p>
                      <p className="text-xs text-muted-foreground">Средний балл</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-amber-600">{data.kpis?.totalQuizAttempts ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Попыток quiz</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-purple-600">{data.achievements?.filter((a: { unlocked?: boolean }) => a.unlocked).length ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Достижений</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Module Progress Chart */}
                {data.moduleProgress && data.moduleProgress.length > 0 && (
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <BookOpen size={16} className="text-blue-500" /> Прогресс по модулям
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.moduleProgress}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="moduleId" tick={{ fontSize: 10 }} tickFormatter={(v) => v.substring(0, 8)} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(value) => `${value}%`} />
                          <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Quiz Category Breakdown */}
                {data.categoryBreakdown && data.categoryBreakdown.length > 0 && (
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <HelpCircle size={16} className="text-amber-500" /> Результаты по категориям quiz
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {data.categoryBreakdown.map((cat) => (
                          <div key={cat.category} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                            <span className="text-xs font-medium truncate">{cat.category || cat.category}</span>
                            <Badge className={
                              cat.avgScore >= 70 ? 'bg-emerald-100 text-emerald-700' :
                              cat.avgScore >= 50 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {cat.avgScore}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Activity Timeline */}
                {data.activityTimeline && data.activityTimeline.length > 0 && (
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Activity size={16} className="text-purple-500" /> Последняя активность
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {data.activityTimeline.slice(0, 10).map((item, i) => (
                          <div key={i} className="flex items-start gap-3 p-2 bg-secondary rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">{item.details}</p>
                              <p className="text-[10px] text-slate-400">
                                {item.date ? new Date(item.date).toLocaleString('ru-RU') : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Achievements */}
                {data.achievements && data.achievements.length > 0 && (
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Award size={16} className="text-amber-500" /> Достижения ({data.achievements.length})
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {data.achievements.map((ach) => (
                          <div key={ach.id} className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
                            <span className="text-lg">🏆</span>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{ach.title}</p>
                              <p className="text-[10px] text-slate-400">
                                {ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString('ru-RU') : 'Не разблокировано'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
