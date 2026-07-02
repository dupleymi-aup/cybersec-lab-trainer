"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {Target, Eye, Shield, Users, Rocket, Globe, Zap, Brain} from "lucide-react";
import Link from "next/link";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import LanguageSwitcher from "@/components/landing/LanguageSwitcher";

const values = [
  {
    icon: Shield,
    title: "Безопасность",
    description: "Защита данных и приватность пользователей — наш приоритет",
    color: "from-violet-500 to-purple-600"
  },
  {
    icon: Brain,
    title: "Образование",
    description: "Доступное и качественное образование в области кибербезопасности",
    color: "from-emerald-500 to-teal-600"
  },
  {
    icon: Users,
    title: "Сообщество",
    description: "Объединяем студентов, преподавателей и профессионалов",
    color: "from-cyan-500 to-blue-600"
  },
  {
    icon: Zap,
    title: "Инновации",
    description: "Постоянное развитие и внедрение новых технологий",
    color: "from-amber-500 to-orange-600"
  }
];

const stats = [
  { value: "8", label: "Модулей", suffix: "" },
  { value: "136", label: "Вопросов в тестах", suffix: "+" },
  { value: "10000", label: "Студентов", suffix: "+" },
  { value: "50", label: "Вузов-партнёров", suffix: "+" }
];

const timeline = [
  {
    year: "2023",
    title: "Запуск проекта",
    description: "Первые 3 модуля и 50 студентов"
  },
  {
    year: "2024",
    title: "Расширение",
    description: "8 модулей, интеграция с LMS, 5000+ студентов"
  },
  {
    year: "2025",
    title: "Международное признание",
    description: "Партнёрства с вузами, корпоративные клиенты"
  },
  {
    year: "2026",
    title: "Новые горизонты",
    description: "AI-ассистенты, адаптивное обучение, мобильное приложение"
  }
];

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <div className="min-h-screen bg-background">
      <LanguageSwitcher />
      <LandingHeader />
      
      <main id="main-content">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{opacity: 0, y: 30}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.6}}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
                <Globe className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                  {t("badge")}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-foreground">{t("title")}</span>
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent">
                  {" "}CyberSec Lab
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("subtitle")}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 bg-gradient-to-b from-background via-accent/5 to-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <motion.div
                initial={{opacity: 0, x: -30}}
                whileInView={{opacity: 1, x: 0}}
                viewport={{once: true}}
                className="p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-foreground">{t("mission.title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("mission.description")}</p>
              </motion.div>

              <motion.div
                initial={{opacity: 0, x: 30}}
                whileInView={{opacity: 1, x: 0}}
                viewport={{once: true}}
                className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6">
                  <Eye className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-foreground">{t("vision.title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("vision.description")}</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{t("values.title")}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">{t("values.subtitle")}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{opacity: 0, y: 30}}
                  whileInView={{opacity: 1, y: 0}}
                  viewport={{once: true}}
                  transition={{delay: index * 0.1}}
                  whileHover={{y: -5}}
                  className="p-6 rounded-2xl bg-gradient-to-br from-background to-accent/20 border border-border hover:border-violet-500/30 transition-all"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-4`}>
                    <value.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 bg-gradient-to-b from-violet-950/20 via-background to-emerald-950/20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{opacity: 0, scale: 0.9}}
                  whileInView={{opacity: 1, scale: 1}}
                  viewport={{once: true}}
                  transition={{delay: index * 0.1}}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 to-emerald-500 bg-clip-text text-transparent mb-2">
                    {stat.value}{stat.suffix}
                  </div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{t("timeline.title")}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">{t("timeline.subtitle")}</p>
            </motion.div>

            <div className="relative max-w-4xl mx-auto">
              {/* Line */}
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 via-purple-500 to-emerald-500" />

              {timeline.map((item, index) => (
                <motion.div
                  key={item.year}
                  initial={{opacity: 0, x: index % 2 === 0 ? -30 : 30}}
                  whileInView={{opacity: 1, x: 0}}
                  viewport={{once: true}}
                  transition={{delay: index * 0.15}}
                  className={`relative mb-8 md:mb-12 ${index % 2 === 0 ? "md:text-right" : "md:text-left md:ml-auto"}`}
                >
                  <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? "md:pr-12" : "md:pl-12"}`}>
                    {/* Dot */}
                    <div className="absolute left-4 md:left-0 top-6 w-4 h-4 rounded-full bg-violet-500 border-4 border-background md:translate-x-0" style={{left: index % 2 === 0 ? "12px" : "auto", right: index % 2 === 0 ? "auto" : "12px"}} />
                    
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-background to-accent/20 border border-border">
                      <div className="text-sm font-bold text-violet-600 dark:text-violet-400 mb-2">{item.year}</div>
                      <h3 className="text-xl font-bold mb-2 text-foreground">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team CTA */}
        <section className="py-20 bg-gradient-to-br from-violet-950/30 via-purple-950/30 to-emerald-950/30">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              className="max-w-3xl mx-auto"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">{t("cta.title")}</h2>
              <p className="text-lg text-muted-foreground mb-8">{t("cta.subtitle")}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25"
                >
                  {t("cta.start")}
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-background border border-border text-foreground font-semibold hover:bg-accent transition-all"
                >
                  {t("cta.contact")}
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
