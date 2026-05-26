'use client';

import { Shield, Github, Mail, BookOpen, GraduationCap, Lock } from 'lucide-react';
import Link from 'next/link';

const footerLinks = {
  platform: {
    title: 'Платформа',
    links: [
      { label: 'Модули', href: '#modules' },
      { label: 'Возможности', href: '#features' },
      { label: 'Тарифы', href: '/register' },
      { label: 'LTI интеграция', href: '#features' },
    ],
  },
  resources: {
    title: 'Ресурсы',
    links: [
      { label: 'Документация', href: '/api/docs' },
      { label: 'Руководство', href: '#' },
      { label: 'Блог', href: '#' },
      { label: 'OWASP Top 10', href: '#' },
    ],
  },
  company: {
    title: 'Компания',
    links: [
      { label: 'О нас', href: '#' },
      { label: 'Контакты', href: '#' },
      { label: 'Карьера', href: '#' },
      { label: 'Партнёры', href: '#' },
    ],
  },
  legal: {
    title: 'Правовая информация',
    links: [
      { label: 'Политика конфиденциальности', href: '#' },
      { label: 'Условия использования', href: '#' },
      { label: 'Cookie', href: '#' },
    ],
  },
};

export default function LandingFooter() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/50">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl">
                <Shield className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold text-white">
                CyberSec{' '}
                <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
                  Lab
                </span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
              Интерактивная платформа для обучения кибербезопасности.
              Изучайте уязвимости, проходите квизы и получайте сертификаты.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" aria-hidden="true" />
              </a>
              <a
                href="mailto:contact@cyberseclab.ru"
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Links columns */}
          <nav aria-label="Footer navigation" className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8 col-span-full">
            {Object.values(footerLinks).map((section) => (
              <div key={section.title}>
                <h4 className="text-white font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      {link.href === '#' ? (
                        <span
                          className="text-slate-500 text-sm cursor-not-allowed"
                          aria-disabled="true"
                          tabIndex={-1}
                        >
                          {link.label}
                        </span>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-slate-400 hover:text-white text-sm transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} CyberSec Lab. Все права защищены.
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span>12 модулей</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <GraduationCap className="w-4 h-4" aria-hidden="true" />
                <span>1000+ студентов</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Lock className="w-4 h-4" aria-hidden="true" />
                <span>136+ квизов</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
