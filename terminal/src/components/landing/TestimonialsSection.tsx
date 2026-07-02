"use client";

import {motion} from "framer-motion";
import {Star, Quote, Users, Award, BookOpen, TrendingUp} from "lucide-react";

const testimonials = [
  {
    name: "Иван Морозов",
    role: "Backend Developer, Тинькофф",
    avatar: "ИМ",
    content: "Прошёл все 8 модулей за 2 месяца. Теперь на собеседованиях чувствую себя увереннее в вопросах безопасности. Рекомендую всем разработчикам.",
    rating: 5,
    module: "OWASP Top 10 + Secure Coding"
  },
  {
    name: "Анна Белова",
    role: "CTO, стартап в сфере FinTech",
    avatar: "АБ",
    content: "Внедрили CyberSec Lab для обучения всей команды. Результат — снижение количества уязвимостей на 60% за квартал. Отличный ROI.",
    rating: 5,
    module: "Корпоративное обучение"
  },
  {
    name: "Павел Чернов",
    role: "Security Engineer, VK",
    avatar: "ПЧ",
    content: "Как профессионал в безопасности, могу сказать: материал актуальный и структурированный. Использую для онбординга новых сотрудников.",
    rating: 5,
    module: "Penetration Testing"
  },
  {
    name: "Екатерина Волкова",
    role: "Студент 4 курса, МГТУ им. Баумана",
    avatar: "ЕВ",
    content: "Готовилась к олимпиаде по информационной безопасности с CyberSec Lab. Заняла 3 место! Лабораторные работы максимально приближены к реальным.",
    rating: 5,
    module: "SQL Security + XSS"
  },
  {
    name: "Алексей Соколов",
    role: " преподаватель, НИУ ВШЭ",
    avatar: "АС",
    content: "Интеграция с Moodle через LTI работает безупречно. Студенты получают мгновенную обратную связь, а я — детальную аналитику.",
    rating: 5,
    module: "LTI + LMS Integration"
  },
  {
    name: "Мария Лебедева",
    role: "DevOps Engineer, Яндекс.Облако",
    avatar: "МЛ",
    content: "Модуль по Network Security помог настроить правильную конфигурацию TLS иFirewall. Теперь наши сервисы проходят все аудиты безопасности.",
    rating: 5,
    module: "Network Security"
  }
];

const achievements = [
  { icon: Users, value: "10,000+", label: "Студентов", color: "text-violet-500" },
  { icon: Award, value: "5,000+", label: "Сертификатов", color: "text-emerald-500" },
  { icon: BookOpen, value: "95%", label: "Завершение курсов", color: "text-amber-500" },
  { icon: TrendingUp, value: "4.9", label: "Рейтинг", color: "text-cyan-500" }
];

export default function TestimonialsSection() {

  return (
    <section className="py-20 md:py-32 relative overflow-hidden bg-gradient-to-b from-background via-violet-950/5 to-background">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-emerald-500/5 rounded-full blur-3xl" />
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
            <Quote className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
              Истории успеха
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-foreground">Что говорят </span>
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent">
              наши пользователи
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Более 10 000 студентов и компаний уже используют CyberSec Lab для обучения и подготовки
          </p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16">
          {achievements.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{opacity: 0, scale: 0.9}}
              whileInView={{opacity: 1, scale: 1}}
              viewport={{once: true}}
              transition={{delay: index * 0.1}}
              className="text-center p-6 rounded-2xl bg-gradient-to-br from-background to-accent/20 border border-border hover:border-violet-500/30 transition-colors"
            >
              <item.icon className={`w-8 h-8 mx-auto mb-3 ${item.color}`} />
              <div className={`text-3xl md:text-4xl font-bold mb-1 ${item.color}`}>{item.value}</div>
              <div className="text-sm text-muted-foreground">{item.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{opacity: 0, y: 30}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{delay: index * 0.1}}
              whileHover={{y: -5}}
              className="relative p-6 rounded-2xl bg-gradient-to-br from-background to-accent/20 border border-border backdrop-blur-sm hover:border-violet-500/30 transition-all group"
            >
              {/* Quote Icon */}
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Quote className="w-5 h-5 text-white" />
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-bold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                ))}
              </div>

              {/* Content */}
              <p className="text-muted-foreground mb-4 leading-relaxed">{testimonial.content}</p>

              {/* Module Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-medium text-violet-600 dark:text-violet-400">
                <BookOpen className="w-3 h-3" />
                {testimonial.module}
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}