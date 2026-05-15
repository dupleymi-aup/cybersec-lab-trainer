'use client';

import { useState } from 'react';
import { useAuthStore, getAllUsers, type UserRole } from '@/lib/auth-store';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Users,
  Search,
  GraduationCap,
  BarChart3,
  Trophy,
  BookOpen,
  Filter,
} from 'lucide-react';

interface StudentProgress {
  userId: string;
  completedModules: string[];
  quizScores: Record<string, number>;
  studiedOwaspItems: string[];
}

function getStudentProgress(userId: string): StudentProgress {
  try {
    const key = `security-trainer-progress-${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        userId,
        completedModules: data.completedModules || [],
        quizScores: data.quizScores || {},
        studiedOwaspItems: data.studiedOwaspItems || [],
      };
    }
  } catch {
    // ignore
  }
  return {
    userId,
    completedModules: [],
    quizScores: {},
    studiedOwaspItems: [],
  };
}

const roleColors: Record<UserRole, string> = {
  student: 'bg-violet-100 text-violet-700',
  teacher: 'bg-amber-100 text-amber-700',
  admin: 'bg-red-100 text-red-700',
};

const roleLabels: Record<UserRole, string> = {
  student: 'Студент',
  teacher: 'Преподаватель',
  admin: 'Администратор',
};

export default function TeacherPanel() {
  const { user } = useAuthStore();
  const { setCurrentPage } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  const allUsers = getAllUsers();
  const students = allUsers.filter((u) => u.role === 'student');

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      searchTerm === '' ||
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = groupFilter === '' || s.group === groupFilter;
    return matchesSearch && matchesGroup;
  });

  // Get unique groups
  const groups = [...new Set(students.map((s) => s.group).filter(Boolean))];

  // Calculate stats
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => {
    const progress = getStudentProgress(s.id);
    return progress.completedModules.length > 0;
  }).length;

  const avgCompletion =
    totalStudents > 0
      ? Math.round(
          students.reduce((acc, s) => {
            const progress = getStudentProgress(s.id);
            return acc + progress.completedModules.length;
          }, 0) / totalStudents
        )
      : 0;

  const avgQuizScore =
    totalStudents > 0
      ? Math.round(
          students.reduce((acc, s) => {
            const progress = getStudentProgress(s.id);
            const scores = Object.values(progress.quizScores);
            if (scores.length === 0) return acc;
            return acc + scores.reduce((a, b) => a + b, 0) / scores.length;
          }, 0) / totalStudents
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')}>
          <ChevronLeft size={20} />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Users size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Панель преподавателя</h1>
          <p className="text-xs text-slate-500">Отслеживайте прогресс и управляйте группами</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Всего студентов', value: totalStudents, icon: Users, color: 'text-sky-600' },
          { label: 'Активных', value: activeStudents, icon: GraduationCap, color: 'text-emerald-600' },
          { label: 'Ср. модулей', value: avgCompletion, icon: BookOpen, color: 'text-violet-600' },
          { label: 'Ср. балл квизов', value: `${avgQuizScore}%`, icon: Trophy, color: 'text-amber-600' },
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-white">
            <CardContent className="p-4 text-center">
              <stat.icon size={20} className={`mx-auto mb-2 ${stat.color}`} />
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="progress">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="progress" className="text-xs">
            <BarChart3 size={14} className="mr-1" /> Прогресс студентов
          </TabsTrigger>
          <TabsTrigger value="groups" className="text-xs">
            <Users size={14} className="mr-1" /> Группы
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">
            <Filter size={14} className="mr-1" /> Аналитика
          </TabsTrigger>
        </TabsList>

        {/* Progress Tab */}
        <TabsContent value="progress" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по имени или email..."
                className="pl-10"
              />
            </div>
            {groups.length > 0 && (
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white"
              >
                <option value="">Все группы</option>
                {groups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            {filteredStudents.map((student, i) => {
              const progress = getStudentProgress(student.id);
              const moduleCount = progress.completedModules.length;
              const quizCount = Object.keys(progress.quizScores).length;
              const avgScore = Object.values(progress.quizScores).length > 0
                ? Math.round(Object.values(progress.quizScores).reduce((a, b) => a + b, 0) / Object.values(progress.quizScores).length)
                : 0;

              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="border-slate-200 hover:border-emerald-200 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center overflow-hidden">
                            {student.avatar ? (
                              <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <GraduationCap size={18} className="text-violet-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{student.fullName}</p>
                            <p className="text-xs text-slate-500">{student.email}</p>
                            {student.group && (
                              <Badge variant="secondary" className="text-[10px] mt-0.5">{student.group}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <p className="text-xs text-slate-500">Модули</p>
                            <p className="text-sm font-bold">{moduleCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Квизы</p>
                            <p className="text-sm font-bold">{quizCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Ср. балл</p>
                            <p className="text-sm font-bold">{avgScore}%</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            {filteredStudents.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Users size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Студенты не найдены</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="mt-4 space-y-4">
          {groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => {
                const groupStudents = students.filter((s) => s.group === group);
                return (
                  <Card key={group} className="border-slate-200">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm mb-2">{group}</h3>
                      <p className="text-xs text-slate-500 mb-3">{groupStudents.length} студентов</p>
                      <div className="space-y-1">
                        {groupStudents.slice(0, 5).map((s) => (
                          <div key={s.id} className="flex items-center gap-2 text-xs">
                            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                              <GraduationCap size={12} className="text-violet-600" />
                            </div>
                            <span className="text-slate-700">{s.fullName}</span>
                          </div>
                        ))}
                        {groupStudents.length > 5 && (
                          <p className="text-xs text-slate-400 italic">+{groupStudents.length - 5} ещё</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Users size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Группы ещё не созданы. Студенты могут указать группу в профиле.</p>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4 space-y-4">
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Общая статистика</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-sky-50 rounded-lg">
                  <p className="text-2xl font-bold text-sky-600">{totalStudents}</p>
                  <p className="text-xs text-slate-500">Всего студентов</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{activeStudents}</p>
                  <p className="text-xs text-slate-500">Активных</p>
                </div>
                <div className="text-center p-3 bg-violet-50 rounded-lg">
                  <p className="text-2xl font-bold text-violet-600">{avgCompletion}</p>
                  <p className="text-xs text-slate-500">Ср. модулей пройдено</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">{avgQuizScore}%</p>
                  <p className="text-xs text-slate-500">Средний балл квизов</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Популярность модулей</h3>
              <div className="space-y-3">
                {['owasp', 'sql-injection', 'xss', 'csrf', 'auth', 'secure-coding', 'tools', 'security-headers'].map((modId) => {
                  const count = students.filter((s) => {
                    const progress = getStudentProgress(s.id);
                    return progress.completedModules.includes(modId);
                  }).length;
                  const pct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
                  return (
                    <div key={modId}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-700 capitalize">{modId.replace(/-/g, ' ')}</span>
                        <span className="text-slate-500">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
