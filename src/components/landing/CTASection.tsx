"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Zap, ArrowRight, Users, Trophy, Clock } from "lucide-react";
import Link from "next/link";

export default function CTASection() {
  const t = useTranslations("landing.cta");
  const locale = useLocale();
  return (
    <section
      className="py-20 bg-background relative overflow-hidden"
      aria-label="Call to action"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-accent/20 to-emerald-500/10" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              {t("title")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 mb-12 max-w-2xl mx-auto">
            <div className="text-center">
              <Users
                className="w-6 h-6 text-violet-500 mx-auto mb-2"
                aria-hidden="true"
              />
              <div className="text-2xl font-bold text-foreground">1000+</div>
              <div className="text-sm text-muted-foreground">
                {t("students")}
              </div>
            </div>
            <div className="text-center">
              <Trophy
                className="w-6 h-6 text-amber-500 mx-auto mb-2"
                aria-hidden="true"
              />
              <div className="text-2xl font-bold text-foreground">500+</div>
              <div className="text-sm text-muted-foreground">
                {t("certificates")}
              </div>
            </div>
            <div className="text-center">
              <Clock
                className="w-6 h-6 text-emerald-500 mx-auto mb-2"
                aria-hidden="true"
              />
              <div className="text-2xl font-bold text-foreground">
                30 {t("registration")}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("registration")}
              </div>
            </div>
          </div>
          <div className="text-center">
            <Link
              href={`/${locale}/register`}
              className="inline-flex items-center gap-3 px-10 py-5 bg-violet-600 hover:bg-violet-700 text-white text-xl font-bold rounded-2xl shadow-2xl shadow-violet-600/30 transition-all hover:scale-105 group"
            >
              <Zap className="w-6 h-6" aria-hidden="true" />
              {t("startFree")}
              <ArrowRight
                className="w-6 h-6 group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              />
            </Link>
            <p className="text-muted-foreground text-sm mt-4">
              {t("disclaimer")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
