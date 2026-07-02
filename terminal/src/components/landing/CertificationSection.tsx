"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {Award, BadgeCheck, Trophy, TrendingUp, Users, Building2, Globe, Zap} from "lucide-react";

const benefits = [
  {
    icon: Award,
    color: "from-amber-500 to-orange-600",
    title: "Официальные сертификаты",
    description: "Получите сертификаты с уникальным ID для проверки работодателем"
  },
  {
    icon: BadgeCheck,
    color: "from-violet-500 to-purple-600",
    title: "Верификация навыков",
    description: "Подтвердите свои знания перед потенциальными работодателями"
  },
  {
    icon: Trophy,
    color: "from-emerald-500 to-teal-600",
    title: "Геймификация",
    description: "Зарабатывайте баллы, достижения и поднимайтесь в рейтинге"
  },
  {
    icon: TrendingUp,
    color: "from-cyan-500 to-blue-600",
    title: "Карьерный рост",
    description: "Наши выпускники работают в ведущих IT-компаниях"
  },
  {
    icon: Users,
    color: "from-pink-500 to-rose-600",
    title: "Сообщество",
    description: "Присоединяйтесь к сообществу из 10000+ студентов и экспертов"
  },
  {
    icon: Building2,
    color: "from-indigo-500 to-violet-600",
    title: "Партнёры",
    description: "50+ университетов и компаний доверяют нашей платформе"
  },
  {
    icon: Globe,
    color: "from-sky-500 to-cyan-600",
    title: "Международное признание",
    description: "Сертификаты признаются работодателями по всему миру"
  },
  {
    icon: Zap,
    color: "from-lime-500 to-green-600",
    title: "Быстрый старт",
    description: "Начните обучение бесплатно и получите первые навыки за 1 день"
  }
];

const stats = [
  { value: "85%", label: "Выпускников находят работу в течение 3 месяцев" },
  { value: "50+", label: "Компаний-партнёров" },
  { value: "10000+", label: "Успешных выпускников" },
  { value: "95%", label: "Рекомендуют платформу друзьям" }
];

export default function CertificationSection() {
  const t = useTranslations("landing.certification");

  return (
    <section className="py-20 bg-gradient-to-b from-violet-950/20 via-background to-emerald-950/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Award className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {t("badge")}
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            {t("title")}
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{delay: index * 0.05}}
                whileHover={{y: -5}}
                className="p-6 rounded-2xl bg-gradient-to-br from-background to-accent/20 border border-border"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{opacity: 0, scale: 0.9}}
              whileInView={{opacity: 1, scale: 1}}
              viewport={{once: true}}
              transition={{delay: index * 0.1}}
              className="text-center p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-emerald-500/10 border border-violet-500/20"
            >
              <div className="text-3xl md:text-4xl font-bold text-violet-600 dark:text-violet-400 mb-2">
                {stat.value}
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
