'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  BookOpen,
  Trophy,
  BarChart3,
  GraduationCap,
  Users,
  type LucideIcon,
} from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: Shield,
    title: '12 интерактивных модулей',
    description: 'OWASP Top 10, SQL-инъекции, XSS, CSRF, аутентификация и другие темы с практическими заданиями',
    color: 'emerald',
  },
  {
    icon: BookOpen,
    title: '136+ вопросов в квизах',
    description: 'Проверьте свои знания по 9 категориям: от SQL до социальной инженерии',
    color: 'violet',
  },
  {
    icon: Trophy,
    title: 'Система достижений',
    description: 'Получайте награды за прогресс, мотивируйте себя продолжать обучение',
    color: 'amber',
  },
  {
    icon: BarChart3,
    title: 'Аналитика прогресса',
    description: 'Отслеживайте свой прогресс с помощью детальных графиков и отчётов',
    color: 'cyan',
  },
  {
    icon: GraduationCap,
    title: 'LTI интеграция',
    description: 'Интеграция с Moodle, Canvas и другими LMS через LTI 1.3 стандарт',
    color: 'blue',
  },
  {
    icon: Users,
    title: 'Роль учителя и админа',
    description: 'Управляйте студентами, группами и курсами с помощью мощных инструментов',
    color: 'purple',
  },
];

const iconColors: Record<string, string> = {
  emerald: 'text-emerald-400 bg-emerald-500/10',
  violet: 'text-violet-400 bg-violet-500/10',
  amber: 'text-amber-400 bg-amber-500/10',
  cyan: 'text-cyan-400 bg-cyan-500/10',
  blue: 'text-blue-400 bg-blue-500/10',
  purple: 'text-purple-400 bg-purple-500/10',
};

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-slate-950" aria-label="Features">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Всё для обучения кибербезопасности
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Платформа объединяет теорию, практику и аналитику в единую систему
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all h-full">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${iconColors[feature.color]}`}>
                  <feature.icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
