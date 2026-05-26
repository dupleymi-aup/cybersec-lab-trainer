'use client';

import { motion } from 'framer-motion';
import { UserPlus, BookOpen, Code, Award, type LucideIcon } from 'lucide-react';

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
  step: number;
  color: string;
}

const steps: Step[] = [
  {
    icon: UserPlus,
    title: 'Зарегистрируйтесь',
    description: 'Создайте аккаунт за 30 секунд — только email и пароль',
    step: 1,
    color: 'violet',
  },
  {
    icon: BookOpen,
    title: 'Выберите модуль',
    description: 'OWASP Top 10, SQL-инъекции, XSS, CSRF и другие темы',
    step: 2,
    color: 'emerald',
  },
  {
    icon: Code,
    title: 'Решайте квизы',
    description: '136+ практических заданий с мгновенной проверкой',
    step: 3,
    color: 'cyan',
  },
  {
    icon: Award,
    title: 'Получите сертификат',
    description: 'Завершите модуль и получите подтверждение навыков',
    step: 4,
    color: 'amber',
  },
];

const stepColors: Record<string, { bg: string; border: string; ring: string; text: string; line: string }> = {
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    ring: 'shadow-violet-500/20',
    text: 'text-violet-400',
    line: 'from-violet-500/50',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    ring: 'shadow-emerald-500/20',
    text: 'text-emerald-400',
    line: 'from-emerald-500/50',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    ring: 'shadow-cyan-500/20',
    text: 'text-cyan-400',
    line: 'from-cyan-500/50',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    ring: 'shadow-amber-500/20',
    text: 'text-amber-400',
    line: 'from-amber-500/50',
  },
};

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent" />

      <div className="relative z-10 container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6"
          >
            <span className="text-sm text-violet-300">Простой процесс</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Как это работает
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Четыре простых шага от регистрации до получения сертификата
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const colors = stepColors[step.color];
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                {/* Connector line (except last) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r to-transparent opacity-30"
                    style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}
                    aria-hidden="true"
                  >
                    <div className={`h-full bg-gradient-to-r ${colors.line} to-transparent`} />
                  </div>
                )}

                <div className="text-center">
                  {/* Step number badge */}
                  <div className="relative inline-block mb-6">
                    <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${colors.bg} border ${colors.border} shadow-lg ${colors.ring}`}>
                      <step.icon className={`w-8 h-8 ${colors.text}`} aria-hidden="true" />
                    </div>
                    <div className={`absolute -top-2 -right-2 flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 border-2 ${colors.border} ${colors.text} text-sm font-bold`} aria-hidden="true">
                      {step.step}
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
