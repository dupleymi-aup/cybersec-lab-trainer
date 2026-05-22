'use client';

import { motion } from 'framer-motion';
import { Shield, BookOpen, Trophy, Briefcase } from 'lucide-react';

const stats = [
  {
    icon: Shield,
    value: '12',
    label: 'Модулей',
    color: 'text-emerald-400 bg-emerald-500/10',
  },
  {
    icon: BookOpen,
    value: '136+',
    label: 'Вопросов в квизах',
    color: 'text-violet-400 bg-violet-500/10',
  },
  {
    icon: Trophy,
    value: '20+',
    label: 'Достижений',
    color: 'text-amber-400 bg-amber-500/10',
  },
  {
    icon: Briefcase,
    value: '5',
    label: 'Карьерных путей',
    color: 'text-cyan-400 bg-cyan-500/10',
  },
];

export default function StatsSection() {
  return (
    <section className="py-16 bg-gradient-to-r from-violet-950/50 via-slate-950 to-emerald-950/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="text-center"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
