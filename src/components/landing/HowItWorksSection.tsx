'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { UserPlus, BookOpen, Code, Award } from 'lucide-react';

const stepIcons = [UserPlus, BookOpen, Code, Award];
const stepColors = [
  {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    ring: 'shadow-violet-500/20',
    text: 'text-violet-500',
  },
  {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    ring: 'shadow-emerald-500/20',
    text: 'text-emerald-500',
  },
  {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    ring: 'shadow-cyan-500/20',
    text: 'text-cyan-500',
  },
  {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    ring: 'shadow-amber-500/20',
    text: 'text-amber-500',
  },
];

export default function HowItWorksSection() {
  const t = useTranslations('landing.howItWorks');
  const steps = ['1', '2', '3', '4'];

  return (
    <section id="how-it-works" className="bg-background relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2"
          >
            <span className="text-sm text-violet-600 dark:text-violet-400">{t('badge')}</span>
          </motion.div>
          <h2 className="text-foreground mb-4 text-3xl font-bold md:text-4xl">{t('title')}</h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">{t('subtitle')}</p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = stepIcons[index];
            const c = stepColors[index];
            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                {index < steps.length - 1 && (
                  <div
                    className="absolute top-16 left-[calc(50%+2rem)] hidden h-0.5 w-[calc(100%-4rem)] bg-gradient-to-r to-transparent opacity-30 lg:block"
                    aria-hidden="true"
                  >
                    <div className={'h-full bg-gradient-to-r from-violet-500/50 to-transparent'} />
                  </div>
                )}
                <div className="text-center">
                  <div className="relative mb-6 inline-block">
                    <div
                      className={
                        'flex h-16 w-16 items-center justify-center rounded-2xl ' +
                        c.bg +
                        ' border ' +
                        c.border +
                        ' shadow-lg ' +
                        c.ring
                      }
                    >
                      <Icon className={'h-8 w-8 ' + c.text} aria-hidden="true" />
                    </div>
                    <div
                      className={
                        'bg-background absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 ' +
                        c.border +
                        ' ' +
                        c.text +
                        ' text-sm font-bold'
                      }
                    >
                      {step}
                    </div>
                  </div>
                  <h3 className="text-foreground mb-3 text-xl font-semibold">{t('steps.' + step + '.title')}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t('steps.' + step + '.description')}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
