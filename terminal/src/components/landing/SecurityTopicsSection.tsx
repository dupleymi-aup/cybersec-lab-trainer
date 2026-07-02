"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {Shield, Lock, Code, Database, Globe, Terminal, Bug, Key} from "lucide-react";

const topics = [
  {
    icon: Shield,
    color: "from-violet-500 to-purple-600",
    title: "OWASP Top 10",
    description: "Изучите 10 наиболее критических уязвимостей веб-приложений",
    items: ["Инъекции", "XSS атаки", "Небезопасная аутентификация", "XXE уязвимости"]
  },
  {
    icon: Lock,
    color: "from-emerald-500 to-teal-600",
    title: "Криптография",
    description: "Основы шифрования и защиты данных",
    items: ["Хеширование", "Симметричное шифрование", "Асимметричное шифрование", "Цифровые подписи"]
  },
  {
    icon: Code,
    color: "from-cyan-500 to-blue-600",
    title: "Secure Coding",
    description: "Принципы безопасного программирования",
    items: ["Валидация входных данных", "Санитизация вывода", "Обработка ошибок", "Логирование"]
  },
  {
    icon: Database,
    color: "from-amber-500 to-orange-600",
    title: "Защита данных",
    description: "Безопасное хранение и обработка информации",
    items: ["SQL инъекции", "NoSQL инъекции", "Защита PII", "GDPR compliance"]
  },
  {
    icon: Globe,
    color: "from-pink-500 to-rose-600",
    title: "Сетевая безопасность",
    description: "Защита сетевых протоколов и коммуникаций",
    items: ["HTTPS/TLS", "CORS политики", "Content Security Policy", "Защита от DDoS"]
  },
  {
    icon: Terminal,
    color: "from-indigo-500 to-violet-600",
    title: "Пентестинг",
    description: "Методологии тестирования на проникновение",
    items: ["Разведка", "Сканирование", "Эксплуатация", "Постэксплуатация"]
  },
  {
    icon: Bug,
    color: "from-lime-500 to-green-600",
    title: "Bug Bounty",
    description: "Поиск и описание уязвимостей для программ вознаграждений",
    items: ["Поиск уязвимостей", "Написание отчётов", "Triaging", "Responsible disclosure"]
  },
  {
    icon: Key,
    color: "from-sky-500 to-cyan-600",
    title: "Аутентификация",
    description: "Системы управления доступом и идентификации",
    items: ["OAuth 2.0", "JWT токены", "MFA/2FA", "Session management"]
  }
];

export default function SecurityTopicsSection() {
  const t = useTranslations("landing.securityTopics");

  return (
    <section className="py-20 bg-gradient-to-b from-background via-accent/5 to-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
            <Shield className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {topics.map((topic, index) => {
            const Icon = topic.icon;
            return (
              <motion.div
                key={index}
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{delay: index * 0.05}}
                whileHover={{y: -5, scale: 1.02}}
                className="group p-6 rounded-2xl bg-gradient-to-br from-background to-accent/20 border border-border hover:border-violet-500/30 transition-all"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${topic.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-violet-500 transition-colors">
                  {topic.title}
                </h3>

                <p className="text-muted-foreground text-sm mb-4">
                  {topic.description}
                </p>

                <ul className="space-y-2">
                  {topic.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
