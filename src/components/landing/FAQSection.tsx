'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function FAQSection() {
  const t = useTranslations('landing.faq');
  const items = t.raw('items') as Array<{ question: string; answer: string }>;
  return (
    <section id="faq" className="bg-background relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2"
          >
            <span className="text-sm text-cyan-600 dark:text-cyan-400">{t('badge')}</span>
          </motion.div>
          <h2 className="text-foreground mb-4 text-3xl font-bold md:text-4xl">{t('title')}</h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">{t('subtitle')}</p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {items.map((faq, index) => (
              <AccordionItem
                key={index}
                value={'item-' + index}
                className="bg-card border-border data-[state=open]:border-border/80 data-[state=open]:bg-accent/30 rounded-xl border px-6"
              >
                <AccordionTrigger className="text-foreground py-5 text-left font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
