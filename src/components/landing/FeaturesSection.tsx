'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Shield, BookOpen, Trophy, BarChart3, GraduationCap, Users } from 'lucide-react';

const featureIcons = [Shield, BookOpen, Trophy, BarChart3, GraduationCap, Users];
const iconColors = [
  'text-emerald-500 bg-emerald-500/10',
  'text-violet-500 bg-violet-500/10',
  'text-amber-500 bg-amber-500/10',
  'text-cyan-500 bg-cyan-500/10',
  'text-blue-500 bg-blue-500/10',
  'text-purple-500 bg-purple-500/10',
];
const featureKeys = [
  'interactiveModules',
  'quizQuestions',
  'achievements',
  'analytics',
  'ltiIntegration',
  'teacherAdmin',
];

export default function FeaturesSection() {
  const t = useTranslations('landing.features');
  const ta = useTranslations('landing.ariaLabels');
  return (
    <section id="features" className="bg-background py-20" aria-label={ta('features')}>
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="text-foreground mb-4 text-3xl font-bold md:text-4xl">{t('title')}</h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">{t('subtitle')}</p>
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((key, index) => {
            const Icon = featureIcons[index];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <div className="bg-card border-border hover:border-border/80 h-full rounded-2xl border p-6 transition-all hover:shadow-lg hover:shadow-violet-500/5">
                  <div
                    className={'mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ' + iconColors[index]}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-foreground mb-2 text-lg font-semibold">{t('items.' + key + '.title')}</h3>
                  <p className="text-muted-foreground text-sm">{t('items.' + key + '.description')}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
