"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {Shield, Trophy, Users, Zap, Target} from "lucide-react";
import {useEffect, useState, useRef} from "react";

const stats = [
  { key: "modules", value: 8, suffix: "", icon: Shield, color: "from-emerald-500 to-emerald-600" },
  { key: "quizQuestions", value: 136, suffix: "+", icon: Target, color: "from-violet-500 to-violet-600" },
  { key: "achievements", value: 16, suffix: "", icon: Trophy, color: "from-amber-500 to-amber-600" },
  { key: "careerPaths", value: 5, suffix: "", icon: Users, color: "from-cyan-500 to-cyan-600" },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const steps = 60;
          const increment = value / steps;
          let current = 0;
          
          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function StatsSection() {
  const t = useTranslations("landing.stats");
  
  return (
    <section className="py-12 md:py-20 bg-gradient-to-r from-violet-500/10 via-accent/20 to-emerald-500/10 border-y border-border/50 relative overflow-hidden" aria-label="Statistics">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12"
        >
          <motion.div 
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-3 md:mb-4"
          >
            <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-500" />
            <span className="text-xs md:text-sm font-medium">Статистика платформы</span>
          </motion.div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3">Масштабное обучение</h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Комплексная программа по кибербезопасности с практическими заданиями
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.key}
                initial={{opacity: 0, y: 30}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: index * 0.1}}
                whileHover={{ y: -5, scale: 1.02 }}
                className="text-center group"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl mb-2 md:mb-4 bg-gradient-to-br ${stat.color} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" aria-hidden="true" />
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-1 md:mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium leading-tight">
                  {t(stat.key)}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
