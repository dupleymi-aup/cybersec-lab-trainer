'use client';

import { motion } from 'framer-motion';
import { Star, Quote, Shield, Code, Award, type LucideIcon } from 'lucide-react';

interface Review {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  achievement: string;
  icon: LucideIcon;
}

const reviews: Review[] = [
  {
    name: 'Алексей Петров',
    role: 'Студент, МГУ',
    avatar: 'АП',
    rating: 5,
    text: 'Платформа помогла разобраться в OWASP Top 10 за пару недель. Интерактивные квизы намного лучше чем просто читать теорию. Теперь чувствую себя уверен на собеседованиях по безопасности.',
    achievement: 'Завершил OWASP Top 10',
    icon: Shield,
  },
  {
    name: 'Мария Иванова',
    role: 'Junior Developer, Яндекс',
    avatar: 'МИ',
    rating: 5,
    text: 'После прохождения модулей по XSS и SQL Injection стала писать более безопасный код. Работодатель оценил — получила повышение!',
    achievement: '100% в модуле XSS',
    icon: Code,
  },
  {
    name: 'Дмитрий Козлов',
    role: 'Преподаватель, ИТМО',
    avatar: 'ДК',
    rating: 5,
    text: 'Использую платформу для обучения студентов. LTI интеграция с Moodle работает отлично, а аналитика прогресса помогает отслеживать успеваемость.',
    achievement: '50+ студентов в группе',
    icon: Award,
  },
  {
    name: 'Елена Смирнова',
    role: 'Security Intern, Kaspersky',
    avatar: 'ЕС',
    rating: 5,
    text: 'Отличная подготовка к реальной работе. Модули по CSRF и аутентификации дали практические навыки которые пригодились на стажировке.',
    achievement: 'Топ-10 по прогрессу',
    icon: Shield,
  },
  {
    name: 'Артём Волков',
    role: 'Fullstack Developer, Сбер',
    avatar: 'АВ',
    rating: 5,
    text: 'Прошёл все модули за месяц. Особенно понравился модуль по социальной инженерии — много реальных примеров. Рекомендую всем разработчикам!',
    achievement: 'Все 12 модулей завершены',
    icon: Code,
  },
  {
    name: 'Ольга Новикова',
    role: 'Студентка, СПбГУ',
    avatar: 'ОН',
    rating: 5,
    text: 'Готовилась к олимпиаде по информационной безопасности с этой платформой. Результат — вошла в топ-20 на региональном этапе!',
    achievement: 'Призёр олимпиады',
    icon: Award,
  },
];

const ratingColor = 'text-amber-400';
const iconColorClasses = [
  'bg-violet-500/10 text-violet-400',
  'bg-emerald-500/10 text-emerald-400',
  'bg-amber-500/10 text-amber-400',
];

export default function ReviewsSection() {
  return (
    <section id="reviews" className="py-20 bg-slate-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/10 to-transparent" />

      <div className="relative z-10 container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6"
          >
            <Star className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span className="text-sm text-emerald-300">Отзывы студентов</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Что говорят наши пользователи
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Более 1000 студентов уже прошли обучение на платформе
          </p>
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.map((review, index) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="h-full p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group relative">
                {/* Quote icon */}
                <Quote className="absolute top-4 right-4 w-8 h-8 text-slate-800 group-hover:text-slate-700 transition-colors" aria-hidden="true" />

                {/* Avatar and info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full ${iconColorClasses[index % iconColorClasses.length]} font-bold text-lg`} aria-hidden="true">
                    {review.avatar}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{review.name}</h4>
                    <p className="text-slate-400 text-sm">{review.role}</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4" role="img" aria-label={`Rating: ${review.rating} out of 5 stars`}>
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 fill-current ${ratingColor}`} aria-hidden="true" />
                  ))}
                </div>

                {/* Review text */}
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  {review.text}
                </p>

                {/* Achievement badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg">
                  <review.icon className="w-4 h-4 text-violet-400" aria-hidden="true" />
                  <span className="text-xs text-slate-400">{review.achievement}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
