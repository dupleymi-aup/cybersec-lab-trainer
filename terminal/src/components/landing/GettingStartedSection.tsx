"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {BookOpen, Laptop, Award, Rocket, ArrowRight, CheckCircle2} from "lucide-react";
import Link from "next/link";

const steps = [
  {
    icon: BookOpen,
    color: "from-violet-500 to-purple-600",
    step: "01",
    title: "Выберите модуль",
    description: "Начните с базового модуля или выберите тему по интересам",
    details: ["OWASP Top 10", "Криптография", "Secure Coding", "Пентестинг"]
  },
  {
    icon: Laptop,
    color: "from-cyan-500 to-blue-600",
    step: "02",
    title: "Изучайте теорию",
    description: "Пройдите интерактивные уроки с примерами кода",
    details: ["Видеолекции", "Статьи", "Примеры кода", "Диаграммы"]
  },
  {
    icon: CheckCircle2,
    color: "from-emerald-500 to-teal-600",
    step: "03",
    title: "Практикуйтесь",
    description: "Решайте практические задания в безопасной среде",
    details: ["Песочницы", "CTF задачи", "Реальные кейсы", "Автотесты"]
  },
  {
    icon: Award,
    color: "from-amber-500 to-orange-600",
    step: "04",
    title: "Получите сертификат",
    description: "Сдайте финальный тест и получите сертификат",
    details: ["Онлайн экзамен", "Сертификат с ID", "Верификация", "LinkedIn"]
  }
];

export default function GettingStartedSection() {
  const t = useTranslations("landing.gettingStarted");

  return (
    <section className="py-20 bg-gradient-to-b from-background via-accent/5 to-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Rocket className="w-4 h-4 text-cyan-500" />
            <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
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

        {/* Steps Timeline */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 via-cyan-500 to-emerald-500 md:-translate-x-1/2 hidden md:block" />

          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={index}
                  initial={{opacity: 0, x: isEven ? -50 : 50}}
                  whileInView={{opacity: 1, x: 0}}
                  viewport={{once: true}}
                  transition={{delay: index * 0.1}}
                  className={`relative flex items-center gap-8 md:gap-16 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Content */}
                  <div className={`flex-1 ${isEven ? "md:text-right" : "md:text-left"} pl-20 md:pl-0`}>
                    <div className={`p-6 rounded-2xl bg-gradient-to-br from-background to-accent/20 border border-border ${
                      isEven ? "md:ml-auto" : "md:mr-auto"
                    } max-w-md`}>
                      <div className="text-5xl font-bold text-violet-500/20 mb-2">{step.step}</div>
                      <h3 className="text-2xl font-semibold mb-3 text-foreground">{step.title}</h3>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      <ul className={`space-y-2 ${isEven ? "md:flex md:flex-col md:items-end" : ""}`}>
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                            {isEven && <span>{detail}</span>}
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            {!isEven && <span>{detail}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="absolute left-8 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 border-4 border-background shadow-lg z-10">
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Spacer */}
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            className="text-center mt-16"
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-600/25"
            >
              {t("cta")}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
