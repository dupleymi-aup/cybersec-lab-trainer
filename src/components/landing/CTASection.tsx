'use client';

import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Users, Trophy, Clock } from 'lucide-react';
import Link from 'next/link';

export default function CTASection() {
  const t = useTranslations('landing.cta');
  const ta = useTranslations('landing.ariaLabels');
  const locale = useLocale();
  return (
    <section className="bg-background relative overflow-hidden py-20" aria-label={ta('callToAction')}>
      <div className="via-accent/20 absolute inset-0 bg-gradient-to-r from-violet-500/10 to-emerald-500/10" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />
      </div>
      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl"
        >
          <div className="mb-12 text-center">
            <h2 className="text-foreground mb-4 text-3xl font-bold md:text-5xl">{t('title')}</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">{t('subtitle')}</p>
          </div>
          <div className="mx-auto mb-12 grid max-w-2xl grid-cols-3 gap-6">
            <div className="text-center">
              <Users className="mx-auto mb-2 h-6 w-6 text-violet-500" aria-hidden="true" />
              <div className="text-foreground text-2xl font-bold">1000+</div>
              <div className="text-muted-foreground text-sm">{t('students')}</div>
            </div>
            <div className="text-center">
              <Trophy className="mx-auto mb-2 h-6 w-6 text-amber-500" aria-hidden="true" />
              <div className="text-foreground text-2xl font-bold">500+</div>
              <div className="text-muted-foreground text-sm">{t('certificates')}</div>
            </div>
            <div className="text-center">
              <Clock className="mx-auto mb-2 h-6 w-6 text-emerald-500" aria-hidden="true" />
              <div className="text-foreground text-2xl font-bold">30 {t('registration')}</div>
              <div className="text-muted-foreground text-sm">{t('registration')}</div>
            </div>
          </div>
          <div className="text-center">
            <Link
              href={`/${locale}/register`}
              className="group inline-flex items-center gap-3 rounded-2xl bg-violet-600 px-10 py-5 text-xl font-bold text-white shadow-2xl shadow-violet-600/30 transition-all hover:scale-105 hover:bg-violet-700"
            >
              <Zap className="h-6 w-6" aria-hidden="true" />
              {t('startFree')}
              <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <p className="text-muted-foreground mt-4 text-sm">{t('disclaimer')}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
