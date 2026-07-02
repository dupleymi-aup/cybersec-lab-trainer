"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {Zap, ArrowRight, Users, Trophy, Clock, CheckCircle2, Sparkles} from "lucide-react";
import Link from "next/link";

const benefits = [
  { icon: Users, value: "1000+", label: "Студентов обучается" },
  { icon: Trophy, value: "500+", label: "Сертификатов" },
  { icon: Clock, value: "30 сек", label: "На регистрацию" },
];

export default function CTASection() {
  const t = useTranslations("landing.cta");
  
  return (
    <section className="py-24 bg-gradient-to-b from-background via-accent/10 to-background relative overflow-hidden" aria-label="Call to action">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-accent/20 to-emerald-500/10" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/10 to-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      </div>
      
      <div className="relative z-10 container mx-auto px-4">
        <motion.div 
          initial={{opacity: 0, y: 30}} 
          whileInView={{opacity: 1, y: 0}} 
          viewport={{once: true}} 
          transition={{duration: 0.6}} 
          className="max-w-5xl mx-auto"
        >
          {/* Main CTA Card */}
          <div className="relative bg-gradient-to-br from-violet-600/10 via-background to-emerald-600/10 border border-violet-500/20 rounded-3xl p-8 md:p-12 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-10">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6"
                >
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-medium text-violet-600 dark:text-violet-400">Начните обучение сегодня</span>
                </motion.div>
                
                <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                  {t("title")}
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {t("subtitle")}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      className="text-center p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50"
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 mx-auto mb-3">
                        <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-emerald-500 bg-clip-text text-transparent mb-1">
                        {benefit.value}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        {benefit.label}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* CTA Button */}
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <Link href="/register">
                    <motion.button 
                      className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white text-xl font-bold rounded-2xl shadow-2xl shadow-violet-600/30 hover:shadow-violet-600/50 transition-all duration-300 group relative overflow-hidden"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Shine effect */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                        whileHover={{ translateX: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                      <Zap className="w-6 h-6 relative z-10" aria-hidden="true" />
                      <span className="relative z-10">{t("startFree")}</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform relative z-10" aria-hidden="true" />
                    </motion.button>
                  </Link>
                </motion.div>
                
                {/* Trust indicators */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Бесплатный доступ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Без кредитной карты</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Мгновенный старт</span>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-xs mt-6">
                  {t("disclaimer")}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
