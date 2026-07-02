"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {ArrowRight, Sparkles, Shield, Zap, BookOpen, CheckCircle2, Play, Target, Code, Award} from "lucide-react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import CodeTerminal from "./CodeTerminal";

const floatingIcons = [
  { Icon: Shield, color: "text-emerald-500", delay: 0, x: "10%", y: "20%" },
  { Icon: Zap, color: "text-violet-500", delay: 0.2, x: "85%", y: "15%" },
  { Icon: BookOpen, color: "text-blue-500", delay: 0.4, x: "90%", y: "70%" },
  { Icon: Shield, color: "text-amber-500", delay: 0.6, x: "15%", y: "75%" },
];

export default function HeroSection() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-background via-background to-accent/10">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Floating icons */}
        {floatingIcons.map((item, i) => (
          <motion.div
            key={i}
            className={`absolute ${item.color} opacity-20`}
            style={{ left: item.x, top: item.y }}
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 3, delay: item.delay, repeat: Infinity, ease: "easeInOut" }}
          >
            <item.Icon size={48} />
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Content */}
          <motion.div
            initial={{opacity: 0, y: 30}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.6}}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-violet-500" aria-hidden="true" />
              <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                {t("badge")}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{duration: 0.6, delay: 0.3}}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            >
              <span className="text-foreground">{t("title")}</span>{" "}
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent">
                {t("titleHighlight")}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{duration: 0.6, delay: 0.4}}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              {t("subtitle")}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{duration: 0.6, delay: 0.5}}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
            >
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white px-8 text-lg group shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 transition-all duration-300">
                  {t("startLearning")}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="border-2 hover:bg-accent/50">
                  <Play className="w-4 h-4 mr-2" />
                  {t("learnMore")}
                </Button>
              </Link>
            </motion.div>

            {/* Features List */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{duration: 0.6, delay: 0.6}}
              className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>8 модулей</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>136 квизов</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>16 лабораторных</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Interactive Cards */}
          <motion.div
            initial={{opacity: 0, scale: 0.95}}
            animate={{opacity: 1, scale: 1}}
            transition={{duration: 0.6, delay: 0.2}}
            className="relative"
          >
            {/* Main glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-emerald-500/20 blur-3xl rounded-full" />
            
            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 max-w-lg mx-auto">
              {/* Code Terminal - Full Width on Mobile */}
              <motion.div 
                className="col-span-1 sm:col-span-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <CodeTerminal />
              </motion.div>

              {/* Feature Cards - 2 columns on tablet+, hidden on small mobile if needed */}
              {/* Feature Card 1 - Modules */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-violet-600/10 to-violet-600/5 border border-violet-500/20 backdrop-blur-sm shadow-lg shadow-violet-500/10"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Модулей</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">8</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-500">
                  <CheckCircle2 size={12} />
                  <span className="truncate">Актуально 2026</span>
                </div>
              </motion.div>

              {/* Feature Card 2 - Quiz */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-600/10 to-emerald-600/5 border border-emerald-500/20 backdrop-blur-sm shadow-lg shadow-emerald-500/10"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Квизов</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">136</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-500">
                  <CheckCircle2 size={12} />
                  <span className="truncate">С проверкой</span>
                </div>
              </motion.div>

              {/* Feature Card 3 - Labs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-cyan-600/10 to-cyan-600/5 border border-cyan-500/20 backdrop-blur-sm shadow-lg shadow-cyan-500/10"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                    <Code className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Лабораторных</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">16</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-500">
                  <CheckCircle2 size={12} />
                  <span className="truncate">Практика</span>
                </div>
              </motion.div>

              {/* Feature Card 4 - Certificates */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-amber-600/10 to-amber-600/5 border border-amber-500/20 backdrop-blur-sm shadow-lg shadow-amber-500/10"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Достижений</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">20+</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-500">
                  <CheckCircle2 size={12} />
                  <span className="truncate">Геймификация</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
