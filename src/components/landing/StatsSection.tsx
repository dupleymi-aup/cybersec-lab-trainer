"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {Shield, BookOpen, Trophy, Briefcase} from "lucide-react";

const icons = [Shield, BookOpen, Trophy, Briefcase];
const colors = ["text-emerald-500 bg-emerald-500/10", "text-violet-500 bg-violet-500/10", "text-amber-500 bg-amber-500/10", "text-cyan-500 bg-cyan-500/10"];
const values = ["12", "136+", "20+", "5"];
const statKeys = ["modules", "quizQuestions", "achievements", "careerPaths"];

export default function StatsSection() {
  const t = useTranslations("landing.stats");
  return (
    <section className="py-16 bg-gradient-to-r from-violet-500/5 via-accent/30 to-emerald-500/5 border-y border-border/50" aria-label="Statistics">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {statKeys.map((key, index) => {
            const Icon = icons[index];
            return (
              <motion.div
                key={key}
                initial={{opacity: 0, scale: 0.9}}
                whileInView={{opacity: 1, scale: 1}}
                viewport={{once: true}}
                transition={{duration: 0.4, delay: index * 0.1}}
                className="text-center"
              >
                <div className={"inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 " + colors[index]}>
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{values[index]}</div>
                <div className="text-sm text-muted-foreground">{t(key)}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
