"use client";

import {motion} from "framer-motion";
import {Shield, Building2, GraduationCap, Rocket, Globe, Award} from "lucide-react";

const partners = [
  { name: "Яндекс", logo: "Я", category: "Tech" },
  { name: "Тинькофф", logo: "Т", category: "Finance" },
  { name: "VK", logo: "V", category: "Tech" },
  { name: "Сбер", logo: "С", category: "Finance" },
  { name: "МГТУ", logo: "М", category: "Education" },
  { name: "НИУ ВШЭ", logo: "В", category: "Education" },
  { name: "Лаборатория Касперского", logo: "K", category: "Security" },
  { name: "Positive Technologies", logo: "P", category: "Security" },
];

const benefits = [
  {
    icon: Shield,
    title: "Безопасность",
    description: "Сертифицированные материалы по стандартам OWASP"
  },
  {
    icon: Building2,
    title: "Для бизнеса",
    description: "Корпоративные программы обучения сотрудников"
  },
  {
    icon: GraduationCap,
    title: "Для вузов",
    description: "Интеграция с LMS и готовые учебные планы"
  },
  {
    icon: Rocket,
    title: "Стартапы",
    description: "Специальные условия для технологических компаний"
  }
];

export default function PartnersSection() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden bg-gradient-to-b from-accent/5 via-background to-accent/5">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-violet-500/5 to-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Globe className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Партнёры и клиенты
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-foreground">Нам доверяют </span>
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent">
              ведущие компании
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            CyberSec Lab используют для обучения сотрудников и студентов в крупнейших компаниях и вузах России
          </p>
        </motion.div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 mb-16">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{opacity: 0, scale: 0.9}}
              whileInView={{opacity: 1, scale: 1}}
              viewport={{once: true}}
              transition={{delay: index * 0.05}}
              whileHover={{scale: 1.05, y: -5}}
              className="group p-8 rounded-2xl bg-gradient-to-br from-background to-accent/20 border border-border hover:border-violet-500/30 transition-all flex flex-col items-center justify-center gap-4"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:shadow-violet-500/25 transition-shadow">
                {partner.logo}
              </div>
              <div className="text-center">
                <div className="font-bold text-foreground">{partner.name}</div>
                <div className="text-xs text-muted-foreground">{partner.category}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{delay: index * 0.1}}
              whileHover={{y: -5}}
              className="text-center p-6 rounded-2xl bg-gradient-to-br from-background to-accent/20 border border-border hover:border-emerald-500/30 transition-all"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <benefit.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-violet-500/10 border border-violet-500/20">
            <Award className="w-5 h-5 text-violet-500" />
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
              Станьте партнёром CyberSec Lab
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}