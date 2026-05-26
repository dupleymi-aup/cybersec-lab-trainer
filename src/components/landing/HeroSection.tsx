'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Lock, Code } from 'lucide-react';
import Link from 'next/link';
import CodeTerminal from './CodeTerminal';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center pt-20">
      {/* Background gradient and decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/50 to-slate-950" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div className="max-w-xl lg:max-w-none">
            {/* Logo and badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-violet-700 rounded-3xl mb-6 shadow-2xl shadow-violet-600/30">
                <Shield className="w-10 h-10 text-white" aria-hidden="true" />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
                <Zap className="w-4 h-4 text-violet-400" aria-hidden="true" />
                <span className="text-sm text-violet-300">Интерактивное обучение кибербезопасности</span>
              </div>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            >
              CyberSec{' '}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                Lab
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-300 mb-4"
            >
              Тренажёр по информационной безопасности с интерактивными лабораторными работами
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-lg text-slate-400 mb-10"
            >
              Изучайте OWASP Top 10, SQL-инъекции, XSS-атаки и другие темы через практику
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-violet-600/25 transition-all hover:scale-105"
              >
                <Zap className="w-5 h-5" aria-hidden="true" />
                Начать обучение
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-white text-lg font-semibold rounded-xl transition-all hover:scale-105"
              >
                <Lock className="w-5 h-5" aria-hidden="true" />
                Войти
              </Link>
            </motion.div>

            {/* Feature icons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="grid grid-cols-3 gap-8 max-w-md"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-xl mb-3">
                  <Code className="w-6 h-6 text-emerald-400" aria-hidden="true" />
                </div>
                <p className="text-sm text-slate-400">12 модулей</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/10 rounded-xl mb-3">
                  <Shield className="w-6 h-6 text-amber-400" aria-hidden="true" />
                </div>
                <p className="text-sm text-slate-400">136+ квизов</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-500/10 rounded-xl mb-3">
                  <Zap className="w-6 h-6 text-violet-400" aria-hidden="true" />
                </div>
                <p className="text-sm text-slate-400">Практика</p>
              </div>
            </motion.div>
          </div>

          {/* Right: Code Terminal */}
          <div className="hidden lg:block">
            <CodeTerminal />
          </div>
        </div>
      </div>
    </section>
  );
}
