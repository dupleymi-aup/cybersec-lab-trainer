"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {Star, Quote, Shield, Code, Award, CheckCircle, TrendingUp} from "lucide-react";

const reviewIcons = [Shield, Code, Award, Shield, Code, Award];
const gradients = ["from-violet-500 to-purple-600", "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600"];
const avatars = ["AP", "MI", "DK", "ES", "AV", "ON"];

export default function ReviewsSection() {
  const t = useTranslations("landing.reviews");
  const items = t.raw("items") as Array<{ name: string; role: string; text: string; rating: number; achievement?: string }>;
  
  return (
    <section id="reviews" className="py-20 bg-gradient-to-b from-background via-accent/5 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 container mx-auto px-4">
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6"
          >
            <Star className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{t("badge")}</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("subtitle")}</p>
        </motion.div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {items.map((review, index) => {
            const Icon = reviewIcons[index];
            const gradient = gradients[index % gradients.length];
            
            return (
              <motion.div 
                key={review.name} 
                initial={{opacity: 0, y: 30}} 
                whileInView={{opacity: 1, y: 0}} 
                viewport={{once: true}} 
                transition={{duration: 0.5, delay: index * 0.1}}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-border/80 transition-all relative overflow-hidden">
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  {/* Quote icon */}
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-muted/20 group-hover:text-violet-500/20 transition-colors" aria-hidden="true" />
                  
                  {/* Avatar and Name */}
                  <div className="flex items-center gap-4 mb-4 relative z-10">
                    <motion.div 
                      className={`flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br ${gradient} font-bold text-lg text-white shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {avatars[index]}
                    </motion.div>
                    <div>
                      <h4 className="text-foreground font-bold">{review.name}</h4>
                      <p className="text-muted-foreground text-sm">{review.role}</p>
                    </div>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex gap-1 mb-4 relative z-10" role="img" aria-label={"Rating: 5 out of 5"}>
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                      >
                        <Star className="w-4 h-4 fill-current text-amber-500" aria-hidden="true" />
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Review text */}
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4 relative z-10">
                    {review.text}
                  </p>
                  
                  {/* Achievement badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-500/10 to-emerald-500/10 rounded-lg border border-violet-500/20 group-hover:border-violet-500/40 transition-colors">
                    <Icon className="w-4 h-4 text-violet-500" aria-hidden="true" />
                    <span className="text-xs font-medium text-muted-foreground">{review.achievement}</span>
                  </div>
                  
                  {/* Verified badge */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle size={12} />
                    <span>Проверено</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Stats footer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-6 px-6 py-4 rounded-2xl bg-accent/30 border border-border/50">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {avatars.slice(0, 4).map((avatar, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-xs text-white font-bold border-2 border-background">
                    {avatar}
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">+1000 студентов</span>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-foreground">98% рекомендуют</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
