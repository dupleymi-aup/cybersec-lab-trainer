'use client';

import { motion } from 'framer-motion';
import { Zap, ArrowRight, Users, Trophy, Clock } from 'lucide-react';
import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="py-20 bg-slate-950 relative overflow-hidden" aria-label="Call to action">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-950/30 via-slate-950 to-emerald-950/30" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Готовы начать обучение?
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Присоединяйтесь к тысячам студентов которые уже изучают кибербезопасность
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-6 mb-12 max-w-2xl mx-auto">
            <div className="text-center">
              <Users className="w-6 h-6 text-violet-400 mx-auto mb-2" aria-hidden="true" />
              <div className="text-2xl font-bold text-white">1000+</div>
              <div className="text-sm text-slate-400">Студентов</div>
            </div>
            <div className="text-center">
              <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" aria-hidden="true" />
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-sm text-slate-400">Сертификатов</div>
            </div>
            <div className="text-center">
              <Clock className="w-6 h-6 text-emerald-400 mx-auto mb-2" aria-hidden="true" />
              <div className="text-2xl font-bold text-white">30 сек</div>
              <div className="text-sm text-slate-400">Регистрация</div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-3 px-10 py-5 bg-violet-600 hover:bg-violet-700 text-white text-xl font-bold rounded-2xl shadow-2xl shadow-violet-600/30 transition-all hover:scale-105 group"
            >
              <Zap className="w-6 h-6" aria-hidden="true" />
              Начать бесплатно
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <p className="text-slate-400 text-sm mt-4">
              Без кредитной карты • Бесплатные модули • Мгновенный доступ
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
