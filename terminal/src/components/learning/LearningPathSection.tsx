"use client";

import {motion} from "framer-motion";
import {Shield, Lock, Code, Database, Globe, Eye, Award, ChevronRight, Clock, BookOpen, ArrowRight} from "lucide-react";
import {Button} from "@/components/ui/button";
import Link from "next/link";

const modules = [
  {
    number: "01",
    icon: Shield,
    title: "OWASP Top 10",
    description: "Изучите 10 наиболее критических уязвимостей веб-приложений",
    color: "from-red-500 to-orange-500",
    bg: "from-red-500/10 to-orange-500/10",
    border: "border-red-500/20",
    duration: "2 недели",
    lessons: 12,
    quizzes: 18,
    topics: ["Injection", "Broken Authentication", "XSS", "Insecure Deserialization"]
  },
  {
    number: "02",
    icon: Lock,
    title: "Security Headers",
    description: "Настройте заголовки HTTP для защиты от атак",
    color: "from-violet-500 to-purple-500",
    bg: "from-violet-500/10 to-purple-500/10",
    border: "border-violet-500/20",
    duration: "1 неделя",
    lessons: 8,
    quizzes: 14,
    topics: ["CSP", "HSTS", "X-Frame-Options", "CORS"]
  },
  {
    number: "03",
    icon: Code,
    title: "Secure Coding",
    description: "Принципы написания безопасного кода",
    color: "from-emerald-500 to-teal-500",
    bg: "from-emerald-500/10 to-teal-500/10",
    border: "border-emerald-500/20",
    duration: "2 недели",
    lessons: 15,
    quizzes: 20,
    topics: ["Input Validation", "Output Encoding", "Error Handling", "Logging"]
  },
  {
    number: "04",
    icon: Database,
    title: "SQL Security",
    description: "Защита баз данных от атак и утечек",
    color: "from-amber-500 to-yellow-500",
    bg: "from-amber-500/10 to-yellow-500/10",
    border: "border-amber-500/20",
    duration: "1.5 недели",
    lessons: 10,
    quizzes: 16,
    topics: ["SQL Injection", "Prepared Statements", "Access Control", "Encryption"]
  },
  {
    number: "05",
    icon: Eye,
    title: "XSS & CSRF",
    description: "Защита от межсайтовых атак",
    color: "from-cyan-500 to-blue-500",
    bg: "from-cyan-500/10 to-blue-500/10",
    border: "border-cyan-500/20",
    duration: "1.5 недели",
    lessons: 11,
    quizzes: 15,
    topics: ["Reflected XSS", "Stored XSS", "DOM XSS", "CSRF Tokens"]
  },
  {
    number: "06",
    icon: Globe,
    title: "Network Security",
    description: "Безопасность сетевого уровня",
    color: "from-indigo-500 to-blue-600",
    bg: "from-indigo-500/10 to-blue-600/10",
    border: "border-indigo-500/20",
    duration: "2 недели",
    lessons: 14,
    quizzes: 18,
    topics: ["TLS/SSL", "Firewall", "DDoS Protection", "VPN"]
  },
  {
    number: "07",
    icon: BookOpen,
    title: "Security Tools",
    description: "Инструменты для тестирования безопасности",
    color: "from-pink-500 to-rose-500",
    bg: "from-pink-500/10 to-rose-500/10",
    border: "border-pink-500/20",
    duration: "1.5 недели",
    lessons: 12,
    quizzes: 16,
    topics: ["Burp Suite", "OWASP ZAP", "Nmap", "Wireshark"]
  },
  {
    number: "08",
    icon: Award,
    title: "Final Project",
    description: "Комплексный проект по аудиту безопасности",
    color: "from-violet-600 to-emerald-500",
    bg: "from-violet-600/10 to-emerald-500/10",
    border: "border-violet-500/20",
    duration: "3 недели",
    lessons: 5,
    quizzes: 19,
    topics: ["Security Audit", "Penetration Test", "Report Writing", "Remediation"]
  }
];

export default function LearningPathSection() {

  return (
    <section className="py-20 md:py-32 relative overflow-hidden bg-gradient-to-b from-accent/5 via-background to-accent/5">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
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
            <BookOpen className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
              Программа обучения
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-foreground">Путь от </span>
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent">
              новичка до профи
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            8 модулей, которые проведут вас через все аспекты кибербезопасности веб-приложений
          </p>
        </motion.div>

        {/* Modules Timeline */}
        <div className="relative max-w-6xl mx-auto">
          {/* Connection Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 via-emerald-500 to-cyan-500 hidden lg:block" />

          <div className="space-y-6">
            {modules.map((module, index) => (
              <motion.div
                key={module.number}
                initial={{opacity: 0, x: index % 2 === 0 ? -30 : 30}}
                whileInView={{opacity: 1, x: 0}}
                viewport={{once: true}}
                transition={{delay: index * 0.1}}
                className="relative"
              >
                {/* Module Card */}
                <div className={`lg:ml-20 p-6 rounded-2xl bg-gradient-to-br ${module.bg} border ${module.border} backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow`}>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Number & Icon */}
                    <div className="flex items-center gap-4 md:flex-col md:items-center">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <module.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-violet-500/50 hidden md:block">{module.number}</div>
                    </div>

                    {/* Content */}
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold text-violet-500">Модуль {module.number}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {module.duration}
                        </div>
                      </div>
                      
                      <h3 className="text-xl md:text-2xl font-bold mb-2 text-foreground">{module.title}</h3>
                      <p className="text-muted-foreground mb-4">{module.description}</p>

                      {/* Topics */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {module.topics.map((topic) => (
                          <span
                            key={topic}
                            className="px-2.5 py-1 text-xs font-medium rounded-full bg-background/50 border border-border text-foreground"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-violet-500" />
                          <span>{module.lessons} уроков</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span>{module.quizzes} квизов</span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="hidden lg:flex items-center justify-center">
                      <ChevronRight className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* Dot on timeline */}
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 border-4 border-background hidden lg:block" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          className="text-center mt-16"
        >
          <Link href="/register">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-emerald-500 hover:from-violet-700 hover:to-emerald-600 text-white px-8 text-lg shadow-lg shadow-violet-600/25">
              Начать обучение бесплатно
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
