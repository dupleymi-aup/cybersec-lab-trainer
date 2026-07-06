'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Shield, BookOpen, Trophy, Briefcase } from 'lucide-react';

const icons = [Shield, BookOpen, Trophy, Briefcase];
const colors = [
  'text-emerald-500 bg-emerald-500/10',
  'text-violet-500 bg-violet-500/10',
  'text-amber-500 bg-amber-500/10',
  'text-cyan-500 bg-cyan-500/10',
];
const values = ['12', '136+', '20+', '5'];
const statKeys = ['modules', 'quizQuestions', 'achievements', 'careerPaths'];

export default function StatsSection() {
  const t = useTranslations('landing.stats');
  return (
    <section
      className="via-accent/30 border-border/50 border-y bg-gradient-to-r from-violet-500/5 to-emerald-500/5 py-16"
      aria-label="Statistics"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
          {statKeys.map((key, index) => {
            const Icon = icons[index];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <div className={'mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ' + colors[index]}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="text-foreground mb-1 text-3xl font-bold md:text-4xl">{values[index]}</div>
                <div className="text-muted-foreground text-sm">{t(key)}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
