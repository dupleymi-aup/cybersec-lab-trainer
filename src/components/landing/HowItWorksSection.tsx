"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { UserPlus, BookOpen, Code, Award } from "lucide-react";

const stepIcons = [UserPlus, BookOpen, Code, Award];
const stepColors = [
  {
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    ring: "shadow-violet-500/20",
    text: "text-violet-500",
  },
  {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    ring: "shadow-emerald-500/20",
    text: "text-emerald-500",
  },
  {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    ring: "shadow-cyan-500/20",
    text: "text-cyan-500",
  },
  {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    ring: "shadow-amber-500/20",
    text: "text-amber-500",
  },
];

export default function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks");
  const steps = ["1", "2", "3", "4"];

  return (
    <section
      id="how-it-works"
      className="py-20 bg-background relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6"
          >
            <span className="text-sm text-violet-600 dark:text-violet-400">
              {t("badge")}
            </span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
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
                    className="hidden lg:block absolute top-16 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r to-transparent opacity-30"
                    aria-hidden="true"
                  >
                    <div
                      className={
                        "h-full bg-gradient-to-r from-violet-500/50 to-transparent"
                      }
                    />
                  </div>
                )}
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div
                      className={
                        "flex items-center justify-center w-16 h-16 rounded-2xl " +
                        c.bg +
                        " border " +
                        c.border +
                        " shadow-lg " +
                        c.ring
                      }
                    >
                      <Icon
                        className={"w-8 h-8 " + c.text}
                        aria-hidden="true"
                      />
                    </div>
                    <div
                      className={
                        "absolute -top-2 -right-2 flex items-center justify-center w-7 h-7 rounded-full bg-background border-2 " +
                        c.border +
                        " " +
                        c.text +
                        " text-sm font-bold"
                      }
                    >
                      {step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {t("steps." + step + ".title")}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t("steps." + step + ".description")}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
