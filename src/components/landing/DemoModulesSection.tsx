'use client';

import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Shield, Lock, KeyRound, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const moduleIcons = [Shield, Lock, KeyRound, Mail];
const moduleKeys = ['owasp', 'auth', 'tools', 'phishing'];
const diffKeys = ['Beginner', 'Beginner', 'Beginner', 'Medium'];
const iconColors = {
  emerald: 'bg-emerald-500/10 text-emerald-500',
  violet: 'bg-violet-500/10 text-violet-500',
  cyan: 'bg-cyan-500/10 text-cyan-500',
  amber: 'bg-amber-500/10 text-amber-500',
};
const moduleColors = ['emerald', 'violet', 'cyan', 'amber'];
const diffColors = {
  Beginner: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  Medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  Advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};
const lessonCounts = [10, 5, 4, 6];

export default function DemoModulesSection() {
  const t = useTranslations('landing.demoModules');
  const locale = useLocale();
  return (
    <section id="modules" className="bg-accent/30 py-20" aria-label="Demo modules">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="text-foreground mb-4 text-3xl font-bold md:text-4xl">{t('title')}</h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">{t('subtitle')}</p>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {moduleKeys.map((key, index) => {
            const Icon = moduleIcons[index];
            const diff = diffKeys[index];
            const c = moduleColors[index];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="bg-card border-border hover:border-border/80 group h-full transition-all hover:shadow-lg hover:shadow-violet-500/5">
                  <CardHeader>
                    <div className="mb-4 flex items-start justify-between">
                      <div
                        className={
                          'inline-flex h-12 w-12 items-center justify-center rounded-xl ' +
                          iconColors[c as keyof typeof iconColors]
                        }
                      >
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <Badge variant="outline" className={diffColors[diff as keyof typeof diffColors]}>
                        {t('difficulties.' + diff)}
                      </Badge>
                    </div>
                    <CardTitle className="text-foreground text-xl">{t('modules.' + key + '.title')}</CardTitle>
                    <CardDescription className="text-muted-foreground mt-2">
                      {t('modules.' + key + '.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        {lessonCounts[index]} {t('lessons')}
                      </span>
                      <Link href={`/${locale}/register`}>
                        <Button
                          variant="ghost"
                          className="gap-2 text-violet-500 hover:bg-violet-500/10 hover:text-violet-600"
                        >
                          {t('try')}
                          <ArrowRight
                            className="h-4 w-4 transition-transform group-hover:translate-x-1"
                            aria-hidden="true"
                          />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Link href={`/${locale}/register`}>
            <Button className="bg-violet-600 px-8 text-white hover:bg-violet-700">{t('registerCTA')}</Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
