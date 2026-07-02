"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {UserPlus, BookOpen, Code, Award, ArrowRight} from "lucide-react";
import {useState} from "react";

const steps = [
  { icon: UserPlus, color: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/30" },
  { icon: BookOpen, color: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/30" },
  { icon: Code, color: "from-cyan-500 to-blue-600", shadow: "shadow-cyan-500/30" },
  { icon: Award, color: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/30" },
];

export default function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks");
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-b from-background via-accent/5 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      
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
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">{t("badge")}</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("subtitle")}</p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isHovered = hoveredStep === index;
            
            return (
              <motion.div 
                key={index}
                initial={{opacity: 0, y: 30}} 
                whileInView={{opacity: 1, y: 0}} 
                viewport={{once: true}} 
                transition={{duration: 0.5, delay: index * 0.1}}
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
                className="relative group"
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-20 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden="true">
                    <motion.div 
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{once: true}}
                      transition={{ duration: 0.8, delay: 0.5 + index * 0.2 }}
                      className="h-full bg-gradient-to-r from-violet-500/50 to-emerald-500/50 origin-left"
                    />
                  </div>
                )}
                
                <div className="text-center">
                  {/* Icon with animation */}
                  <motion.div 
                    className="relative inline-block mb-6"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className={`flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} shadow-lg ${step.shadow} group-hover:shadow-xl transition-shadow duration-300`}>
                      <Icon className="w-10 h-10 text-white" aria-hidden="true" />
                    </div>
                    <motion.div 
                      className="absolute -top-2 -right-2 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-border text-foreground text-sm font-bold shadow-lg"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.3 }}
                    >
                      {index + 1}
                    </motion.div>
                  </motion.div>
                  
                  {/* Content */}
                  <motion.h3 
                    className="text-xl font-bold text-foreground mb-3"
                    animate={{ x: isHovered ? 5 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {t(`steps.${index + 1}.title`)}
                  </motion.h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {t(`steps.${index + 1}.description`)}
                  </p>
                  
                  {/* Arrow indicator */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center text-sm font-medium text-violet-600 dark:text-violet-400"
                  >
                    <ArrowRight size={16} className="mr-1" />
                    Начать сейчас
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
