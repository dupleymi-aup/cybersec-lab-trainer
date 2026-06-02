"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";

export default function FAQSection() {
  const t = useTranslations("landing.faq");
  const items = t.raw("items") as Array<{ question: string; answer: string }>;
  return (
    <section id="faq" className="py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
            <span className="text-sm text-cyan-600 dark:text-cyan-400">{t("badge")}</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("subtitle")}</p>
        </div>
        <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {items.map((faq, index) => (
              <AccordionItem key={index} value={"item-" + index} className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-border/80 data-[state=open]:bg-accent/30">
                <AccordionTrigger className="text-left text-foreground font-medium hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
