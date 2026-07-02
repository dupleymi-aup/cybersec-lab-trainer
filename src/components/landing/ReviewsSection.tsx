"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Star, Quote, Shield, Code, Award } from "lucide-react";

const reviewIcons = [Shield, Code, Award, Shield, Code, Award];
const iconColors = [
  "bg-violet-500/10 text-violet-500",
  "bg-emerald-500/10 text-emerald-500",
  "bg-amber-500/10 text-amber-500",
];
const avatars = ["AP", "MI", "DK", "ES", "AV", "ON"];

export default function ReviewsSection() {
  const t = useTranslations("landing.reviews");
  const items = t.raw("items") as Array<{
    name: string;
    role: string;
    text: string;
    rating: number;
    achievement?: string;
  }>;
  return (
    <section
      id="reviews"
      className="py-20 bg-background relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6"
          >
            <Star className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              {t("badge")}
            </span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {items.map((review, index) => {
            const Icon = reviewIcons[index];
            return (
              <motion.div
                key={review.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-border/80 transition-all group relative">
                  <Quote
                    className="absolute top-4 right-4 w-8 h-8 text-muted/20"
                    aria-hidden="true"
                  />
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={
                        "flex items-center justify-center w-12 h-12 rounded-full " +
                        iconColors[index % iconColors.length] +
                        " font-bold text-lg"
                      }
                    >
                      {avatars[index]}
                    </div>
                    <div>
                      <h4 className="text-foreground font-semibold">
                        {review.name}
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {review.role}
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex gap-1 mb-4"
                    role="img"
                    aria-label={"Rating: 5 out of 5"}
                  >
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-current text-amber-500"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {review.text}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-lg">
                    <Icon
                      className="w-4 h-4 text-violet-500"
                      aria-hidden="true"
                    />
                    <span className="text-xs text-muted-foreground">
                      {review.achievement}
                    </span>
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
