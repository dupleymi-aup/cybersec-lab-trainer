'use client';

import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Платформа бесплатная?',
    answer: 'Да, базовые модули доступны бесплатно после регистрации. Расширенные модули и функции для преподавателей доступны по подписке.',
  },
  {
    question: 'Нужны ли знания программирования?',
    answer: 'Базовые модули (OWASP Top 10, аутентификация) не требуют глубоких знаний программирования. Для продвинутых модулей рекомендуется знание JavaScript и основ веб-разработки.',
  },
  {
    question: 'Как работает LTI интеграция?',
    answer: 'Платформа поддерживает LTI 1.3 стандарт. Вы можете подключить CyberSec Lab к Moodle, Canvas или другой LMS системе за несколько минут. Студенты получают доступ к модулям прямо из вашей LMS.',
  },
  {
    question: 'Можно ли отслеживать прогресс студентов?',
    answer: 'Да, преподаватели имеют доступ к детальной аналитике: прогресс по модулям, результаты квизов, тепловые карты активности, сравнение групп и индивидуальные отчёты.',
  },
  {
    question: 'Есть ли сертификаты?',
    answer: 'Да, после завершения каждого модуля вы получаете цифровой сертификат с результатами. Сертификаты можно добавить в портфолио или LinkedIn профиль.',
  },
  {
    question: 'Какие темы покрываются?',
    answer: '12 модулей: OWASP Top 10, SQL-инъекции, XSS, CSRF, аутентификация, управление сессиями, криптография, социальная инженерия, фишинг, инструменты безопасности, безопасная разработка и другие.',
  },
  {
    question: 'Как зарегистрировать аккаунт преподавателя?',
    answer: 'Зарегистрируйтесь как обычно, затем обратитесь к администратору для получения роли преподавателя. Преподаватели могут создавать группы, назначать модули и отслеживать прогресс студентов.',
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-20 bg-slate-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent" />

      <div className="relative z-10 container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6"
          >
            <span className="text-sm text-cyan-300">Частые вопросы</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Часто задаваемые вопросы
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Ответы на самые популярные вопросы о платформе
          </p>
        </div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-slate-900/50 border border-slate-800 rounded-xl px-6 data-[state=open]:border-slate-700 data-[state=open]:bg-slate-900/80"
              >
                <AccordionTrigger className="text-left text-white font-medium hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-400 pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
