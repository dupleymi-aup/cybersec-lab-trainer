"use client";

import {motion} from "framer-motion";
import {BookOpen, GraduationCap, Building2, CheckCircle, ArrowRight, Laptop, BarChart3, Shield, Zap, Award, UserCheck} from "lucide-react";
import Link from "next/link";
import {Button} from "@/components/ui/button";

const audiences = [
  {
    icon: BookOpen,
    title: "Студентам",
    description: "Практические навыки для начала карьеры в кибербезопасности",
    color: "from-violet-500 to-purple-500",
    bg: "from-violet-500/10 to-purple-500/10",
    border: "border-violet-500/20",
    benefits: [
      "Интерактивные лабораторные работы",
      "136 квизов для самопроверки",
      "Сертификаты по завершении модулей",
      "Геймификация обучения",
      "Подготовка к собеседованиям"
    ],
    cta: "Начать обучение",
    link: "/register"
  },
  {
    icon: UserCheck,
    title: "Преподавателям",
    description: "Готовые материалы для проведения занятий по безопасности",
    color: "from-emerald-500 to-teal-500",
    bg: "from-emerald-500/10 to-teal-500/10",
    border: "border-emerald-500/20",
    benefits: [
      "8 готовых модулей обучения",
      "Автоматическая проверка заданий",
      "Трекинг прогресса студентов",
      "Методические материалы",
      "Интеграция с LMS"
    ],
    cta: "Для преподавателей",
    link: "/register"
  },
  {
    icon: Building2,
    title: "Компаниям",
    description: "Повышение квалификации сотрудников в области безопасности",
    color: "from-cyan-500 to-blue-500",
    bg: "from-cyan-500/10 to-blue-500/10",
    border: "border-cyan-500/20",
    benefits: [
      "Корпоративные тарифы",
      "Аналитика по сотрудникам",
      "Индивидуальные программы",
      "Сертификация команды",
      "Снижение рисков утечек"
    ],
    cta: "Для бизнеса",
    link: "/register"
  }
];

const features = [
  { icon: Laptop, text: "Онлайн доступ 24/7" },
  { icon: Shield, text: "Безопасная среда" },
  { icon: Zap, text: "Быстрый старт" },
  { icon: Award, text: "Сертификаты" },
  { icon: BarChart3, text: "Аналитика прогресса" },
  { icon: GraduationCap, text: "Поддержка менторов" }
];

export default function ForWhoSection() {

  return (
    <section className="py-20 md:py-32 relative overflow-hidden bg-gradient-to-b from-background via-accent/5 to-background">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl" />
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
            <GraduationCap className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Для кого этот курс
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-foreground">Идеально подходит </span>
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent">
              каждому
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Независимо от вашего уровня подготовки, вы найдёте подходящий формат обучения
          </p>
        </motion.div>

        {/* Audience Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.title}
              initial={{opacity: 0, y: 30}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{delay: index * 0.15}}
              whileHover={{y: -8}}
              className={`relative p-8 rounded-3xl bg-gradient-to-br ${audience.bg} border ${audience.border} backdrop-blur-sm shadow-2xl flex flex-col`}
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${audience.color} flex items-center justify-center mb-6 shadow-xl`}>
                <audience.icon className="w-8 h-8 text-white" />
              </div>

              {/* Title & Description */}
              <h3 className="text-2xl font-bold mb-3 text-foreground">{audience.title}</h3>
              <p className="text-muted-foreground mb-6 flex-grow">{audience.description}</p>

              {/* Benefits List */}
              <ul className="space-y-3 mb-8">
                {audience.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link href={audience.link}>
                <Button className={`w-full bg-gradient-to-r ${audience.color} hover:opacity-90 text-white group`}>
                  {audience.cta}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              {/* Decorative elements */}
              <div className={`absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br ${audience.color} opacity-10 rounded-full blur-2xl`} />
            </motion.div>
          ))}
        </div>

        {/* Additional Features */}
        <motion.div
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          className="flex flex-wrap justify-center gap-4 md:gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.text}
              initial={{opacity: 0, scale: 0.9}}
              whileInView={{opacity: 1, scale: 1}}
              viewport={{once: true}}
              transition={{delay: index * 0.05}}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-accent/50 border border-border text-sm font-medium text-foreground hover:bg-accent hover:border-violet-500/30 transition-colors"
            >
              <feature.icon className="w-4 h-4 text-violet-500" />
              {feature.text}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
