"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {Shield, Lock, KeyRound, Mail, ArrowRight} from "lucide-react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";

const moduleIcons = [Shield, Lock, KeyRound, Mail];
const moduleKeys = ["owasp", "auth", "tools", "phishing"];
const diffKeys = ["Beginner", "Beginner", "Beginner", "Medium"];
const iconColors = { emerald: "bg-emerald-500/10 text-emerald-500", violet: "bg-violet-500/10 text-violet-500", cyan: "bg-cyan-500/10 text-cyan-500", amber: "bg-amber-500/10 text-amber-500"};
const moduleColors = ["emerald", "violet", "cyan", "amber"];
const diffColors = {Beginner: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", Medium: "bg-amber-500/10 text-amber-500 border-amber-500/20", Advanced: "bg-red-500/10 text-red-500 border-red-500/20"};
const lessonCounts = [10, 5, 4, 6];

export default function DemoModulesSection() {
  const t = useTranslations("landing.demoModules");
  return (
    <section id="modules" className="py-20 bg-accent/30" aria-label="Demo modules">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("subtitle")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {moduleKeys.map((key, index) => {
            const Icon = moduleIcons[index];
            const diff = diffKeys[index];
            const c = moduleColors[index];
            return (
              <motion.div key={key} initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{duration: 0.4, delay: index * 0.1}}>
                <Card className="h-full bg-card border-border hover:border-border/80 transition-all hover:shadow-lg hover:shadow-violet-500/5 group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className={"inline-flex items-center justify-center w-12 h-12 rounded-xl " + iconColors[c as keyof typeof iconColors]}>
                        <Icon className="w-6 h-6" aria-hidden="true" />
                      </div>
                      <Badge variant="outline" className={diffColors[diff as keyof typeof diffColors]}>
                        {t("difficulties." + diff)}
                      </Badge>
                    </div>
                    <CardTitle className="text-foreground text-xl">{t("modules." + key + ".title")}</CardTitle>
                    <CardDescription className="text-muted-foreground mt-2">{t("modules." + key + ".description")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{lessonCounts[index]} {t("lessons")}</span>
                      <Link href="/register">
                        <Button variant="ghost" className="text-violet-500 hover:text-violet-600 hover:bg-violet-500/10 gap-2">
                          {t("try")}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
        <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} className="text-center mt-12">
          <Link href="/register">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white px-8">{t("registerCTA")}</Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
