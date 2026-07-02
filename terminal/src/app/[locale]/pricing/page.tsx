"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {Check, X, Zap, Shield, Building2, Crown, ArrowRight} from "lucide-react";
import Link from "next/link";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import LanguageSwitcher from "@/components/landing/LanguageSwitcher";

const plans = [
  {
    id: "free",
    name: "Базовый",
    description: "Для начала обучения",
    price: "0",
    period: "навсегда",
    icon: Zap,
    color: "from-cyan-500 to-blue-600",
    features: [
      { text: "3 модуля обучения", included: true },
      { text: "50+ вопросов в тестах", included: true },
      { text: "Базовые сертификаты", included: true },
      { text: "Доступ 24/7", included: true },
      { text: "Сообщество студентов", included: true },
      { text: "Продвинутые модули", included: false },
      { text: "LTI интеграция", included: false },
      { text: "Приоритетная поддержка", included: false }
    ],
    cta: "Начать бесплатно",
    popular: false
  },
  {
    id: "pro",
    name: "Профессиональный",
    description: "Для серьёзного обучения",
    price: "990",
    period: "в месяц",
    icon: Shield,
    color: "from-violet-500 to-purple-600",
    features: [
      { text: "Все 8 модулей", included: true },
      { text: "136+ вопросов в тестах", included: true },
      { text: "Сертификаты с печатью", included: true },
      { text: "Доступ 24/7", included: true },
      { text: "Приоритет в чате", included: true },
      { text: "Персональные задания", included: true },
      { text: "Аналитика прогресса", included: true },
      { text: "LTI интеграция", included: false }
    ],
    cta: "Попробовать Pro",
    popular: true
  },
  {
    id: "enterprise",
    name: "Корпоративный",
    description: "Для команд и вузов",
    price: "4990",
    period: "в месяц",
    icon: Building2,
    color: "from-emerald-500 to-teal-600",
    features: [
      { text: "Всё из Pro", included: true },
      { text: "До 50 сотрудников/студентов", included: true },
      { text: "LTI интеграция с LMS", included: true },
      { text: "Панель преподавателя", included: true },
      { text: "Групповая аналитика", included: true },
      { text: "Методические материалы", included: true },
      { text: "Персональный менеджер", included: true },
      { text: "API доступ", included: true }
    ],
    cta: "Связаться с нами",
    popular: false
  }
];

const faqItems = [
  {
    question: "Можно ли перейти с бесплатного на платный тариф?",
    answer: "Да, вы можете обновить тариф в любой момент в личном кабинете."
  },
  {
    question: "Есть ли скидки для студентов?",
    answer: "Да, студенты получают скидку 50% на Pro тариф при предъявлении студенческого билета."
  },
  {
    question: "Можно ли оплатить годовой абонемент?",
    answer: "Да, при оплате за год вы получаете 2 месяца бесплатно."
  },
  {
    question: "Как работает корпоративный тариф?",
    answer: "Вы получаете доступ для всей команды с панелью управления и аналитикой прогресса каждого сотрудника."
  }
];

export default function PricingPage() {
  const t = useTranslations("pricing");

  return (
    <div className="min-h-screen bg-background">
      <LanguageSwitcher />
      <LandingHeader />
      
      <main id="main-content">
        {/* Hero */}
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
                <Crown className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                  {t("badge")}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-foreground">{t("title")}</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("subtitle")}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 bg-gradient-to-b from-background via-accent/5 to-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {plans.map((plan, index) => {
                const Icon = plan.icon;
                return (
                  <motion.div
                    key={plan.id}
                    initial={{opacity: 0, y: 30}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: index * 0.1}}
                    className={`relative p-8 rounded-3xl border ${
                      plan.popular 
                        ? "bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/50 shadow-xl shadow-violet-500/20" 
                        : "bg-gradient-to-br from-background to-accent/20 border-border"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold">
                        Популярный
                      </div>
                    )}

                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold mb-2 text-foreground">{plan.name}</h3>
                    <p className="text-muted-foreground mb-6">{plan.description}</p>

                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold text-foreground">{plan.price} ₽</span>
                        <span className="text-muted-foreground">/{plan.period}</span>
                      </div>
                    </div>

                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                          )}
                          <span className={feature.included ? "text-foreground" : "text-muted-foreground/50"}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/register"
                      className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        plan.popular
                          ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-600/25"
                          : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{t("comparison.title")}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">{t("comparison.subtitle")}</p>
            </motion.div>

            <div className="overflow-x-auto">
              <table className="w-full max-w-5xl mx-auto">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 text-foreground font-semibold">{t("comparison.feature")}</th>
                    <th className="text-center py-4 px-6 text-cyan-600 dark:text-cyan-400 font-semibold">Базовый</th>
                    <th className="text-center py-4 px-6 text-violet-600 dark:text-violet-400 font-semibold">Pro</th>
                    <th className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400 font-semibold">Корпоративный</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Модули обучения", free: "3", pro: "8", enterprise: "8 + эксклюзивные" },
                    { feature: "Вопросы в тестах", free: "50+", pro: "136+", enterprise: "136+ + кастомные" },
                    { feature: "Сертификаты", free: "Базовые", pro: "С печатью", enterprise: "Именные" },
                    { feature: "Поддержка", free: "Сообщество", pro: "Приоритетная", enterprise: "Персональная" },
                    { feature: "LTI интеграция", free: "—", pro: "—", enterprise: "✓" },
                    { feature: "Аналитика", free: "Базовая", pro: "Расширенная", enterprise: "Полная" },
                    { feature: "API доступ", free: "—", pro: "—", enterprise: "✓" },
                    { feature: "Методические материалы", free: "—", pro: "—", enterprise: "✓" }
                  ].map((row, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="py-4 px-6 text-foreground">{row.feature}</td>
                      <td className="text-center py-4 px-6 text-muted-foreground">{row.free}</td>
                      <td className="text-center py-4 px-6 text-foreground">{row.pro}</td>
                      <td className="text-center py-4 px-6 text-foreground">{row.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-gradient-to-b from-violet-950/20 via-background to-emerald-950/20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{t("faq.title")}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">{t("faq.subtitle")}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {faqItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{opacity: 0, y: 20}}
                  whileInView={{opacity: 1, y: 0}}
                  viewport={{once: true}}
                  transition={{delay: index * 0.1}}
                  className="p-6 rounded-2xl bg-gradient-to-br from-background to-accent/20 border border-border"
                >
                  <h3 className="text-lg font-semibold mb-3 text-foreground">{item.question}</h3>
                  <p className="text-muted-foreground">{item.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-emerald-500/10 border border-violet-500/20"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">{t("cta.title")}</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">{t("cta.subtitle")}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-600/25"
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
