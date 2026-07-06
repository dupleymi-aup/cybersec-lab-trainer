'use client';

import { useAppStore } from '@/lib/store';
import { careerPaths, skillLevels, industryDemand, modules } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Shield,
  Code,
  ShieldAlert,
  TrendingUp,
  Lock,
  ArrowRight,
  CheckCircle2,
  Target,
  Briefcase,
  GraduationCap,
  Building2,
  BarChart3,
  Zap,
} from 'lucide-react';
import type { PageType } from '@/lib/store';

const careerIcons: Record<string, React.ReactNode> = {
  Shield: <Shield size={24} />,
  Code: <Code size={24} />,
  ShieldAlert: <ShieldAlert size={24} />,
  TrendingUp: <TrendingUp size={24} />,
  Lock: <Lock size={24} />,
};

const demandColors: Record<string, string> = {
  'very-high': 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
};

export default function CareerPaths() {
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const completedModules = useAppStore((s) => s.completedModules);

  const getCareerProgress = (pathModules: string[]) => {
    const completed = pathModules.filter((m) => completedModules.includes(m)).length;
    return Math.round((completed / pathModules.length) * 100);
  };

  const getSkillLevel = (completedCount: number) => {
    if (completedCount >= 9) return skillLevels[3];
    if (completedCount >= 7) return skillLevels[2];
    if (completedCount >= 5) return skillLevels[1];
    return skillLevels[0];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')}>
          <ChevronLeft size={20} />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <Target size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Карьерные пути в кибербезопасности</h1>
          <p className="text-muted-foreground text-xs">Выберите специализацию и отслеживайте прогресс</p>
        </div>
      </div>

      {/* Current skill level */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-3">
            <BarChart3 size={20} className="text-indigo-600" />
            <h2 className="font-semibold text-indigo-900">Ваш текущий уровень</h2>
          </div>
          {(() => {
            const level = getSkillLevel(completedModules.length);
            return (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`text-lg font-bold ${level.color}`}>{level.level}</span>
                  <span className="text-muted-foreground text-sm">
                    — {completedModules.length}/{modules.length} модулей пройдено
                  </span>
                </div>
                <Progress value={(completedModules.length / modules.length) * 100} className="mb-2 h-2" />
                <p className="text-muted-foreground text-sm">{level.description}</p>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Career paths */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Briefcase size={18} className="text-foreground/70" /> Направления специализации
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {careerPaths.map((path, i) => {
            const progress = getCareerProgress(path.learningPath);
            return (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-border overflow-hidden transition-colors hover:border-indigo-300">
                  <div className={`h-1 bg-gradient-to-r ${path.color}`} />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-12 w-12 rounded-xl bg-gradient-to-br ${path.color} flex shrink-0 items-center justify-center text-white`}
                      >
                        {careerIcons[path.icon]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">{path.title}</h3>
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{path.description}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Зарплата:</span>
                        <p className="font-semibold">{path.salaryRange}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Спрос:</span>
                        <Badge className={`ml-1 text-[10px] ${demandColors[path.demandLevel]}`}>
                          {path.demandLevel === 'very-high' ? 'Очень высокий' : 'Высокий'}
                        </Badge>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mt-3">
                      <span className="text-muted-foreground text-xs">Ключевые навыки:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {path.skills.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">
                            {completedModules.includes(path.learningPath[path.skills.indexOf(s)] || '') && (
                              <CheckCircle2 size={10} className="mr-0.5 text-emerald-500" />
                            )}
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Learning path progress */}
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium">Прогресс обучения</span>
                        <span className="text-xs font-semibold">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>

                    {/* Recommended modules */}
                    <div className="mt-3">
                      <span className="text-muted-foreground text-xs">Рекомендуемые модули:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {path.learningPath.map((modId, idx) => {
                          const mod = modules.find((m) => m.id === modId);
                          const isDone = completedModules.includes(modId);
                          return (
                            <Badge
                              key={modId}
                              variant={isDone ? 'default' : 'outline'}
                              className={`cursor-pointer text-[10px] ${isDone ? 'border-0 bg-emerald-100 text-emerald-700' : ''}`}
                              onClick={() => setCurrentPage(modId as PageType)}
                            >
                              {idx + 1}. {mod?.title || modId} {isDone && '✓'}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    {/* Certifications */}
                    <div className="bg-secondary mt-3 rounded-lg p-3">
                      <div className="mb-1 flex items-center gap-1.5">
                        <GraduationCap size={14} className="text-amber-500" />
                        <span className="text-xs font-semibold">Сертификации:</span>
                      </div>
                      <div className="space-y-0.5">
                        {path.certifications.slice(0, 2).map((cert) => (
                          <p key={cert} className="text-muted-foreground text-[11px]">
                            {cert}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Roles */}
                    <div className="mt-3">
                      <span className="text-muted-foreground text-xs">Должности:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {path.roles.slice(0, 2).map((role) => (
                          <span
                            key={role}
                            className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-700"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Industry demand */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Building2 size={18} className="text-foreground/70" /> Спрос по отраслям
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {industryDemand.map((sector, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border transition-shadow hover:shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold">{sector.sector}</h3>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <Zap size={12} className="text-amber-500" />
                    <span className="font-medium">{sector.demand}</span>
                  </div>
                  <p className="mt-1 text-xs text-emerald-600">{sector.growth}</p>
                  <p className="text-muted-foreground mt-1 text-[11px]">Ключевые: {sector.key}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Skill progression */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Target size={18} className="text-foreground/70" /> Уровни компетенций
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {skillLevels.map((level, i) => {
            const isCurrentLevel =
              completedModules.length >= (i === 0 ? 0 : i === 1 ? 3 : i === 2 ? 5 : 7) &&
              completedModules.length < (i === 0 ? 3 : i === 1 ? 5 : i === 2 ? 7 : 10);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`border-border ${isCurrentLevel ? 'border-indigo-300 bg-indigo-50/30' : ''}`}>
                  <CardContent className="p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                          i === 0
                            ? 'bg-emerald-500'
                            : i === 1
                              ? 'bg-blue-500'
                              : i === 2
                                ? 'bg-violet-500'
                                : 'bg-amber-500'
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span className={`text-sm font-semibold ${level.color}`}>{level.level}</span>
                    </div>
                    <p className="text-muted-foreground mb-2 text-xs">Модулей: {level.modules}+</p>
                    <p className="text-muted-foreground text-[11px]">{level.description}</p>
                    {isCurrentLevel && (
                      <Badge className="mt-2 border-0 bg-indigo-100 text-[10px] text-indigo-700">Ваш уровень</Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <Card className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white">
        <CardContent className="p-6">
          <h3 className="mb-2 text-lg font-bold">Готовы начать обучение?</h3>
          <p className="mb-4 text-sm text-indigo-100">
            Выберите модуль из рекомендованного пути и начните изучение. Каждый модуль приближает вас к цели!
          </p>
          <Button className="bg-card text-indigo-700 hover:bg-indigo-50" onClick={() => setCurrentPage('dashboard')}>
            Вернуться на дашборд <ArrowRight size={16} className="ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
