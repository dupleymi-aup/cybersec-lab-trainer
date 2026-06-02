"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {Shield, BookOpen, Trophy, BarChart3, GraduationCap, Users} from "lucide-react";

const featureIcons = [Shield, BookOpen, Trophy, BarChart3, GraduationCap, Users];
const iconColors = ["text-emerald-500 bg-emerald-500/10", "text-violet-500 bg-violet-500/10", "text-amber-500 bg-amber-500/10", "text-cyan-500 bg-cyan-500/10", "text-blue-500 bg-blue-500/10", "text-purple-500 bg-purple-500/10"];
const featureKeys = ["interactiveModules", "quizQuestions", "achievements", "analytics", "ltiIntegration", "teacherAdmin"];

export default function FeaturesSection() {
  const t = useTranslations("landing.features");
  return (
    <section id="features" className="py-20 bg-background" aria-label="Features">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("subtitle")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {featureKeys.map((key, index) => {
            const Icon = featureIcons[index];
            return (
              <motion.div key={key} initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{duration: 0.4, delay: index * 0.05}}>
                <div className="p-6 rounded-2xl bg-card border border-border hover:border-border/80 transition-all h-full hover:shadow-lg hover:shadow-violet-500/5">
                  <div className={"inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 " + iconColors[index]}>
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t("items." + key + ".title")}</h3>
                  <p className="text-muted-foreground text-sm">{t("items." + key + ".description")}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
