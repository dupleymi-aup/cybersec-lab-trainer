'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trophy, Star } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { modules } from '@/lib/data';

interface CelebrationEvent {
  id: string;
  type: 'module' | 'quiz' | 'achievement';
  title: string;
  subtitle?: string;
}

let celebrationListeners: Array<(event: CelebrationEvent) => void> = [];

export function triggerCelebration(event: Omit<CelebrationEvent, 'id'>) {
  const id = `celebrate-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  celebrationListeners.forEach((fn) => fn({ ...event, id }));
}

const CONFETTI_COLORS = [
  '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#22c55e',
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function CompletionCelebration() {
  const [event, setEvent] = useState<CelebrationEvent | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; rotation: number; delay: number; size: number }>>([]);
  const prevModulesRef = useRef<string[]>(useAppStore.getState().completedModules);

  // Subscribe to module completions
  useEffect(() => {
    const unsub = useAppStore.subscribe((state, prev) => {
      if (state.completedModules.length > prev.completedModules.length) {
        const newIds = state.completedModules.filter(
          (id) => !prev.completedModules.includes(id)
        );
        for (const id of newIds) {
          const mod = modules.find((m) => m.id === id);
          if (mod) {
            triggerCelebration({
              type: 'module',
              title: `Модуль завершён!`,
              subtitle: `«${mod.title}» — отличная работа!`,
            });
          }
        }
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handler = (e: CelebrationEvent) => {
      setEvent(e);
      const newParticles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: randomBetween(0, 100),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: randomBetween(0, 360),
        delay: randomBetween(0, 0.5),
        size: randomBetween(6, 12),
      }));
      setParticles(newParticles);
      setTimeout(() => {
        setEvent(null);
        setParticles([]);
      }, 3000);
    };
    celebrationListeners.push(handler);
    return () => {
      celebrationListeners = celebrationListeners.filter((l) => l !== handler);
    };
  }, []);

  return (
    <AnimatePresence>
      {event && (
        <>
          {/* Confetti */}
          <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute top-0 rounded-sm"
                style={{
                  left: `${p.x}%`,
                  width: p.size,
                  height: p.size * 0.6,
                  backgroundColor: p.color,
                  rotate: p.rotation,
                  borderRadius: 2,
                }}
                initial={{ y: -20, opacity: 1, rotate: 0 }}
                animate={{
                  y: '100vh',
                  opacity: 0,
                  rotate: p.rotation + 360 * (Math.random() > 0.5 ? 1 : -1),
                }}
                transition={{
                  duration: randomBetween(1.5, 3),
                  delay: p.delay,
                  ease: 'easeIn',
                }}
              />
            ))}
          </div>

          {/* Center toast */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] pointer-events-none"
          >
            <div className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-white shadow-2xl border border-emerald-200">
              {event.type === 'module' ? (
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 size={36} className="text-emerald-600" />
                </div>
              ) : event.type === 'achievement' ? (
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <Trophy size={36} className="text-amber-500" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
                  <Star size={36} className="text-violet-500" />
                </div>
              )}
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800">{event.title}</p>
                {event.subtitle && (
                  <p className="text-sm text-slate-500 mt-1">{event.subtitle}</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
