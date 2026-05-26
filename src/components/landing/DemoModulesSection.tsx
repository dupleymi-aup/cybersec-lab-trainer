'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, KeyRound, Mail, ArrowRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DemoModule {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  difficulty: 'Beginner' | 'Medium' | 'Advanced';
  lessons: number;
  color: string;
}

const demoModules: DemoModule[] = [
  {
    id: 'owasp',
    title: 'OWASP Top 10',
    description: 'Изучите 10 самых критических рисков веб-безопасности и способы защиты от них',
    icon: Shield,
    difficulty: 'Beginner',
    lessons: 10,
    color: 'emerald',
  },
  {
    id: 'auth',
    title: 'Аутентификация',
    description: 'Научитесь создавать надёжные системы аутентификации и избегать распространённых ошибок',
    icon: Lock,
    difficulty: 'Beginner',
    lessons: 5,
    color: 'violet',
  },
  {
    id: 'tools',
    title: 'Инструменты безопасности',
    description: 'Освойте базовые инструменты для анализа и тестирования безопасности приложений',
    icon: KeyRound,
    difficulty: 'Beginner',
    lessons: 4,
    color: 'cyan',
  },
  {
    id: 'phishing-analyzer',
    title: 'Анализатор фишинга',
    description: 'Научитесь распознавать фишинговые письма и защищаться от социальной инженерии',
    icon: Mail,
    difficulty: 'Medium',
    lessons: 6,
    color: 'amber',
  },
];

const difficultyColors = {
  Beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const difficultyLabels: Record<string, string> = {
  Beginner: 'Начальный',
  Medium: 'Средний',
  Advanced: 'Продвинутый',
};

const iconColorClasses: Record<string, { bg: string; text: string }> = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
};

export default function DemoModulesSection() {
  return (
    <section className="py-20 bg-slate-950/50" aria-label="Demo modules">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Попробуйте бесплатно
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Начните с этих модулей — регистрация займёт всего минуту
          </p>
        </div>

        {/* Module cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {demoModules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-violet-500/5 group">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${iconColorClasses[module.color]?.bg}`}>
                      <module.icon className={`w-6 h-6 ${iconColorClasses[module.color]?.text}`} aria-hidden="true" />
                    </div>
                    <Badge variant="outline" className={difficultyColors[module.difficulty]}>
                      {difficultyLabels[module.difficulty]}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-xl">{module.title}</CardTitle>
                  <CardDescription className="text-slate-400 mt-2">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      {module.lessons} уроков
                    </span>
                    <Link href="/register" aria-label={`Try module ${module.title}`}>
                      <Button
                        variant="ghost"
                        className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 gap-2"
                      >
                        Попробовать
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link href="/register" aria-label="Register to access all modules">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white px-8">
              Зарегистрироваться и получить доступ ко всем модулям
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
