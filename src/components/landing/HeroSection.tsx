'use client';

import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import CodeTerminal from './CodeTerminal';

export default function HeroSection() {
  const t = useTranslations('landing.hero');
  const locale = useLocale();

  return (
    <section className="from-background via-background to-accent/20 relative overflow-hidden bg-gradient-to-b py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2">
              <Sparkles className="h-4 w-4 text-violet-500" aria-hidden="true" />
              <span className="text-sm font-medium text-violet-600 dark:text-violet-400">{t('badge')}</span>
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              <span className="text-foreground">{t('title')}</span>{' '}
              <span className="bg-gradient-to-r from-violet-600 to-emerald-500 bg-clip-text text-transparent">
                {t('titleHighlight')}
              </span>
            </h1>

            <p className="text-muted-foreground mx-auto mb-8 max-w-xl text-lg md:text-xl lg:mx-0">{t('subtitle')}</p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Link href={`/${locale}/register`}>
                <Button size="lg" className="group bg-violet-600 px-8 text-lg text-white hover:bg-violet-700">
                  {t('startLearning')}
                  <ArrowRight
                    className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg">
                  {t('learnMore')}
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <CodeTerminal />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
