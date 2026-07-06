'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Star, Quote, Shield, Code, Award } from 'lucide-react';

const reviewIcons = [Shield, Code, Award, Shield, Code, Award];
const iconColors = [
  'bg-violet-500/10 text-violet-500',
  'bg-emerald-500/10 text-emerald-500',
  'bg-amber-500/10 text-amber-500',
];
const avatars = ['AP', 'MI', 'DK', 'ES', 'AV', 'ON'];

export default function ReviewsSection() {
  const t = useTranslations('landing.reviews');
  const items = t.raw('items') as Array<{
    name: string;
    role: string;
    text: string;
    rating: number;
    achievement?: string;
  }>;
  return (
    <section id="reviews" className="bg-background relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2"
          >
            <Star className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            <span className="text-sm text-emerald-600 dark:text-emerald-400">{t('badge')}</span>
          </motion.div>
          <h2 className="text-foreground mb-4 text-3xl font-bold md:text-4xl">{t('title')}</h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">{t('subtitle')}</p>
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((review, index) => {
            const Icon = reviewIcons[index];
            return (
              <motion.div
                key={review.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <div className="bg-card border-border hover:border-border/80 group relative h-full rounded-2xl border p-6 transition-all">
                  <Quote className="text-muted/20 absolute top-4 right-4 h-8 w-8" aria-hidden="true" />
                  <div className="mb-4 flex items-center gap-4">
                    <div
                      className={
                        'flex h-12 w-12 items-center justify-center rounded-full ' +
                        iconColors[index % iconColors.length] +
                        ' text-lg font-bold'
                      }
                    >
                      {avatars[index]}
                    </div>
                    <div>
                      <h4 className="text-foreground font-semibold">{review.name}</h4>
                      <p className="text-muted-foreground text-sm">{review.role}</p>
                    </div>
                  </div>
                  <div className="mb-4 flex gap-1" role="img" aria-label={'Rating: 5 out of 5'}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current text-amber-500" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{review.text}</p>
                  <div className="bg-accent/50 inline-flex items-center gap-2 rounded-lg px-3 py-1.5">
                    <Icon className="h-4 w-4 text-violet-500" aria-hidden="true" />
                    <span className="text-muted-foreground text-xs">{review.achievement}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
