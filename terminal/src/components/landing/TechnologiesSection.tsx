"use client";

import {motion} from "framer-motion";
import {Shield, Database, Globe, Lock, Terminal, Zap, Award, Users, CheckCircle, Code} from "lucide-react";

const technologies = [
  {
    icon: Shield,
    title: "OWASP Top 10",
    description: "Изучите 10 наиболее критических уязвимостей веб-приложений",
    color: "from-red-500 to-orange-500",
    bg: "from-red-500/10 to-orange-500/10",
    border: "border-red-500/20",
    skills: ["Injection", "XSS", "CSRF", "SSRF"]
  },
  {
    icon: Lock,
    title: "Security Headers",
    description: "Настройте заголовки безопасности для защиты вашего приложения",
    color: "from-violet-500 to-purple-500",
    bg: "from-violet-500/10 to-purple-500/10",
    border: "border-violet-500/20",
    skills: ["CSP", "HSTS", "X-Frame-Options", "CORS"]
  },
  {
    icon: Code,
    title: "Secure Coding",
    description: "Освойте принципы безопасной разработки кода",
    color: "from-emerald-500 to-teal-500",
    bg: "from-emerald-500/10 to-teal-500/10",
    border: "border-emerald-500/20",
    skills: ["Валидация", "Санитизация", "Шифрование", "Хеширование"]
  },
  {
    icon: Terminal,
    title: "Penetration Testing",
    description: "Научитесь тестировать приложения на уязвимости",
    color: "from-cyan-500 to-blue-500",
    bg: "from-cyan-500/10 to-blue-500/10",
    border: "border-cyan-500/20",
    skills: ["Reconnaissance", "Scanning", "Exploitation", "Reporting"]
  },
  {
    icon: Database,
    title: "SQL Security",
    description: "Защитите базы данных от атак и утечек",
    color: "from-amber-500 to-yellow-500",
    bg: "from-amber-500/10 to-yellow-500/10",
    border: "border-amber-500/20",
    skills: ["Prepared Statements", "ORM Security", "Access Control", "Audit"]
  },
  {
    icon: Globe,
    title: "Network Security",
    description: "Обеспечьте безопасность сетевого уровня",
    color: "from-indigo-500 to-blue-600",
    bg: "from-indigo-500/10 to-blue-600/10",
    border: "border-indigo-500/20",
    skills: ["TLS/SSL", "Firewall", "DDoS Protection", "VPN"]
  },
];

const stats = [
  { icon: CheckCircle, value: "100%", label: "Покрытие OWASP Top 10", color: "text-emerald-500" },
  { icon: Zap, value: "16", label: "Лабораторных работ", color: "text-violet-500" },
  { icon: Award, value: "8", label: "Сертификатов", color: "text-amber-500" },
  { icon: Users, value: "1000+", label: "Студентов", color: "text-cyan-500" },
];

export default function TechnologiesSection() {

  return (
    <section className="py-20 md:py-32 relative overflow-hidden bg-gradient-to-b from-accent/5 via-background to-accent/5">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
            <Shield className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
              Технологии и Стандарты
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-foreground">Изучите </span>
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent">
              ключевые технологии
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Программа курса охватывает все основные аспекты кибербезопасности веб-приложений
          </p>
        </motion.div>

        {/* Technologies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.title}
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{delay: index * 0.1}}
              whileHover={{y: -5, scale: 1.02}}
              className={`relative p-6 rounded-2xl bg-gradient-to-br ${tech.bg} border ${tech.border} backdrop-blur-sm shadow-xl`}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tech.color} flex items-center justify-center mb-4 shadow-lg`}>
                <tech.icon className="w-7 h-7 text-white" />
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-bold mb-2 text-foreground">{tech.title}</h3>
              <p className="text-muted-foreground mb-4">{tech.description}</p>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-2">
                {tech.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-background/50 border border-border text-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Decorative corner */}
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${tech.color} opacity-5 rounded-bl-full`} />
            </motion.div>
          ))}
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{opacity: 0, scale: 0.9}}
              whileInView={{opacity: 1, scale: 1}}
              viewport={{once: true}}
              transition={{delay: index * 0.1}}
              className="text-center p-6 rounded-2xl bg-gradient-to-br from-background to-accent/30 border border-border"
            >
              <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
              <div className={`text-3xl md:text-4xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
