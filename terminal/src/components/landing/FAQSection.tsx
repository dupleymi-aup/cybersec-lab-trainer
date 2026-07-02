"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {HelpCircle, ChevronDown, Zap, BookOpen, Users, Award} from "lucide-react";
import {useState} from "react";

const categoryIcons = [Zap, BookOpen, Users, Award];

export default function FAQSection() {
  const t = useTranslations("landing.faq");
  const items = t.raw("items") as Array<{ question: string; answer: string; category?: string }>;
  const [openItem, setOpenItem] = useState<string | null>(null);
  
  return (
    <section id="faq" className="py-20 bg-gradient-to-b from-background via-accent/5 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 container mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{opacity: 0, y: 20}} 
          whileInView={{opacity: 1, y: 0}} 
          viewport={{once: true}}
          className="text-center mb-16"
        >
          <motion.div 
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6"
          >
            <HelpCircle className="w-4 h-4 text-cyan-500" aria-hidden="true" />
            <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">{t("badge")}</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("subtitle")}</p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div 
          initial={{opacity: 0, y: 20}} 
          whileInView={{opacity: 1, y: 0}} 
          viewport={{once: true}} 
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {items.map((faq, index) => {
              const CategoryIcon = categoryIcons[index % categoryIcons.length];
              const value = `item-${index}`;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AccordionItem 
                    value={value} 
                    className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5"
                    onClick={() => setOpenItem(openItem === value ? null : value)}
                  >
                    <AccordionTrigger className="text-left text-foreground font-medium hover:no-underline py-5 px-6 group">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/10 to-violet-500/10 group-hover:from-cyan-500/20 group-hover:to-violet-500/20 transition-colors">
                          <CategoryIcon className="w-5 h-5 text-cyan-500 group-hover:text-violet-500 transition-colors" />
                        </div>
                        <span className="text-base md:text-lg">{faq.question}</span>
                      </div>
                      <motion.div
                        animate={{ rotate: openItem === value ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                      </motion.div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-5">
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-1 h-full bg-gradient-to-b from-violet-500 to-cyan-500 rounded-full mt-1" />
                          <p className="text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              );
            })}
          </Accordion>
        </motion.div>

        {/* Help CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-4">Не нашли ответ на свой вопрос?</p>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <HelpCircle className="w-5 h-5 text-violet-500" />
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
              Напишите нам в поддержку
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
