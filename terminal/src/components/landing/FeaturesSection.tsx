"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {Shield, BookOpen, Trophy, BarChart3, GraduationCap, Users, Zap, CheckCircle} from "lucide-react";

const features = [
  { 
    key: "interactiveModules", 
    icon: Shield, 
    gradient: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-500/20",
    bg: "bg-emerald-500/10"
  },
  { 
    key: "quizQuestions", 
    icon: BookOpen, 
    gradient: "from-violet-500 to-purple-600",
    shadow: "shadow-violet-500/20",
    bg: "bg-violet-500/10"
  },
  { 
    key: "achievements", 
    icon: Trophy, 
    gradient: "from-amber-500 to-orange-600",
    shadow: "shadow-amber-500/20",
    bg: "bg-amber-500/10"
  },
  { 
    key: "analytics", 
    icon: BarChart3, 
    gradient: "from-cyan-500 to-blue-600",
    shadow: "shadow-cyan-500/20",
    bg: "bg-cyan-500/10"
  },
  { 
    key: "ltiIntegration", 
    icon: GraduationCap, 
    gradient: "from-blue-500 to-indigo-600",
    shadow: "shadow-blue-500/20",
    bg: "bg-blue-500/10"
  },
  { 
    key: "teacherAdmin", 
    icon: Users, 
    gradient: "from-purple-500 to-pink-600",
    shadow: "shadow-purple-500/20",
    bg: "bg-purple-500/10"
  },
];

export default function FeaturesSection() {
  const t = useTranslations("landing.features");
  
  return (
    <section id="features" className="py-20 bg-gradient-to-b from-background via-accent/5 to-background relative overflow-hidden" aria-label="Features">
      {/* Background decoration */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6"
          >
            <Zap className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">Возможности платформы</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("subtitle")}</p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={feature.key} 
                initial={{opacity: 0, y: 20}} 
                whileInView={{opacity: 1, y: 0}} 
                viewport={{once: true}} 
                transition={{duration: 0.4, delay: index * 0.1}}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <div className="p-6 rounded-2xl bg-card border border-border hover:border-border/80 transition-all h-full hover:shadow-xl relative overflow-hidden">
                  {/* Hover gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  {/* Icon */}
                  <motion.div 
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5 bg-gradient-to-br ${feature.gradient} shadow-lg ${feature.shadow} group-hover:shadow-xl transition-shadow duration-300`}
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Icon className="w-7 h-7 text-white" aria-hidden="true" />
                  </motion.div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {t(`items.${feature.key}.title`)}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {t(`items.${feature.key}.description`)}
                  </p>
                  
                  {/* Feature highlights */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span>Включено в программу</span>
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
