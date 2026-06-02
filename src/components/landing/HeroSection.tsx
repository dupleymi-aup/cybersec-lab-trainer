"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {ArrowRight, Sparkles} from "lucide-react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import CodeTerminal from "./CodeTerminal";

export default function HeroSection() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-background via-background to-accent/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          <motion.div
            initial={{opacity: 0, y: 30}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.6}}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-violet-500" aria-hidden="true" />
              <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                {t("badge")}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="text-foreground">{t("title")}</span>{" "}
              <span className="bg-gradient-to-r from-violet-600 to-emerald-500 bg-clip-text text-transparent">
                {t("titleHighlight")}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              {t("subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/register">
                <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white px-8 text-lg group">
                  {t("startLearning")}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg">
                  {t("learnMore")}
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{opacity: 0, scale: 0.95}}
            animate={{opacity: 1, scale: 1}}
            transition={{duration: 0.6, delay: 0.2}}
          >
            <CodeTerminal />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
