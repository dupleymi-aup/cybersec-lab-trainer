"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {Shield, Lock, KeyRound, Mail, ArrowRight, Sparkles, BookOpen, Clock} from "lucide-react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";

const modules = [
  { key: "owasp", icon: Shield, color: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/20", difficulty: "Beginner", lessons: 10 },
  { key: "auth", icon: Lock, color: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/20", difficulty: "Beginner", lessons: 5 },
  { key: "tools", icon: KeyRound, color: "from-cyan-500 to-blue-600", shadow: "shadow-cyan-500/20", difficulty: "Beginner", lessons: 4 },
  { key: "phishing", icon: Mail, color: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20", difficulty: "Medium", lessons: 6 },
];

const diffColors: Record<string, string> = {
  Beginner: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Advanced: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function DemoModulesSection() {
  const t = useTranslations("landing.demoModules");
  
  return (
    <section id="modules" className="py-20 bg-gradient-to-b from-accent/20 via-background to-accent/30 relative overflow-hidden" aria-label="Demo modules">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{opacity: 0, y: 20}} 
          whileInView={{opacity: 1, y: 0}} 
          viewport={{once: true}}
          className="text-center mb-12"
        >
          <motion.div 
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">Популярные модули</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("subtitle")}</p>
        </motion.div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {modules.map((module, index) => {
            const Icon = module.icon;
            
            return (
              <motion.div 
                key={module.key} 
                initial={{opacity: 0, y: 20}} 
                whileInView={{opacity: 1, y: 0}} 
                viewport={{once: true}} 
                transition={{duration: 0.4, delay: index * 0.1}}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <Card className="h-full bg-card border-border hover:border-border/80 transition-all hover:shadow-xl relative overflow-hidden">
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <motion.div 
                        className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${module.color} shadow-lg ${module.shadow}`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <Icon className="w-7 h-7 text-white" aria-hidden="true" />
                      </motion.div>
                      <Badge variant="outline" className={diffColors[module.difficulty] + " font-medium"}>
                        {t(`difficulties.${module.difficulty}`)}
                      </Badge>
                    </div>
                    <CardTitle className="text-foreground text-xl group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {t(`modules.${module.key}.title`)}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground mt-2 leading-relaxed">
                      {t(`modules.${module.key}.description`)}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="w-4 h-4 text-violet-500" />
                        <span>{module.lessons} {t("lessons")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        <span>~{module.lessons * 15} мин</span>
                      </div>
                    </div>
                    
                    {/* CTA */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <div className="flex -space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-[8px] text-white font-bold border border-background">
                              {["A", "M", "D"][i]}
                            </div>
                          ))}
                        </div>
                        <span>+120 прошли</span>
                      </div>
                      
                      <Link href="/register">
                        <Button variant="ghost" className="text-violet-500 hover:text-violet-600 hover:bg-violet-500/10 gap-2 group/btn">
                          {t("try")}
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" aria-hidden="true" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
        
        {/* CTA Button */}
        <motion.div 
          initial={{opacity: 0, y: 20}} 
          whileInView={{opacity: 1, y: 0}} 
          viewport={{once: true}} 
          className="text-center mt-12"
        >
          <Link href="/register">
            <Button className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white px-8 shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 transition-all duration-300">
              {t("registerCTA")}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
