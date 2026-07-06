'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { securityHeaders } from '@/lib/data';
import CodeBlock from './CodeBlock';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Trophy,
} from 'lucide-react';

type HeaderStep = 'description' | 'attack' | 'vulnerable' | 'secure' | 'quiz';

const stepLabels: { key: HeaderStep; label: string }[] = [
  { key: 'description', label: 'Описание' },
  { key: 'attack', label: 'Атака' },
  { key: 'vulnerable', label: 'Уязвимый код' },
  { key: 'secure', label: 'Защита' },
  { key: 'quiz', label: 'Квиз' },
];

const categoryColors: Record<string, string> = {
  'Защита от XSS': 'bg-red-100 text-red-700',
  'Защита соединения': 'bg-blue-100 text-blue-700',
  'Защита от кликджекинга': 'bg-amber-100 text-amber-700',
  'Защита от MIME-sniffing': 'bg-purple-100 text-purple-700',
  'Защита приватности': 'bg-indigo-100 text-indigo-700',
  'Контроль API браузера': 'bg-teal-100 text-teal-700',
  'Изоляция процессов': 'bg-rose-100 text-rose-700',
  'Изоляция ресурсов': 'bg-cyan-100 text-cyan-700',
  'Защита ресурсов': 'bg-lime-100 text-lime-700',
  Кэширование: 'bg-orange-100 text-orange-700',
  Приватность: 'bg-pink-100 text-pink-700',
  'Безопасный выход': 'bg-emerald-100 text-emerald-700',
};

export default function SecurityHeadersLab() {
  const completedModules = useAppStore((s) => s.completedModules);
  const completeModule = useAppStore((s) => s.completeModule);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const [currentHeader, setCurrentHeader] = useState(0);
  const [step, setStep] = useState<HeaderStep>('description');
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [correctHeaders, setCorrectHeaders] = useState<Set<number>>(new Set());

  const header = securityHeaders[currentHeader];
  const isCompleted = completedModules.includes('security-headers');
  const stepIndex = stepLabels.findIndex((s) => s.key === step);

  const handleComplete = () => {
    if (!isCompleted) {
      completeModule('security-headers');
    }
  };

  const nextStep = () => {
    const idx = stepLabels.findIndex((s) => s.key === step);
    if (idx < stepLabels.length - 1) {
      setStep(stepLabels[idx + 1].key);
      setQuizAnswer(null);
      setQuizSubmitted(false);
    }
  };

  const prevStep = () => {
    const idx = stepLabels.findIndex((s) => s.key === step);
    if (idx > 0) {
      setStep(stepLabels[idx - 1].key);
      setQuizAnswer(null);
      setQuizSubmitted(false);
    }
  };

  const nextHeader = () => {
    if (currentHeader < securityHeaders.length - 1) {
      setCurrentHeader(currentHeader + 1);
      setStep('description');
      setQuizAnswer(null);
      setQuizSubmitted(false);
    }
  };

  const prevHeader = () => {
    if (currentHeader > 0) {
      setCurrentHeader(currentHeader - 1);
      setStep('description');
      setQuizAnswer(null);
      setQuizSubmitted(false);
    }
  };

  const submitQuiz = (optionIndex: number) => {
    setQuizAnswer(optionIndex);
    setQuizSubmitted(true);
    if (optionIndex === header.quiz.correctIndex) {
      setCorrectHeaders((prev) => new Set(prev).add(currentHeader));
    }
  };

  const isQuizCorrect = quizAnswer === header.quiz.correctIndex;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')}>
          <ChevronLeft size={20} />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
          <ShieldCheck size={20} className="text-sky-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Security Headers</h1>
          <p className="text-muted-foreground text-xs">Интерактивный гид по HTTP-заголовкам безопасности</p>
        </div>
      </div>

      {/* Progress */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              Заголовки: {correctHeaders.size}/{securityHeaders.length} правильных
            </span>
            {isCompleted && <Badge className="bg-emerald-600 text-white">Модуль завершён!</Badge>}
          </div>
          <div className="flex gap-1.5">
            {securityHeaders.map((h, i) => (
              <button
                key={h.id}
                onClick={() => {
                  setCurrentHeader(i);
                  setStep('description');
                  setQuizAnswer(null);
                  setQuizSubmitted(false);
                }}
                className={`h-2 flex-1 rounded-full transition-all ${
                  correctHeaders.has(i) ? 'bg-emerald-500' : i === currentHeader ? 'bg-sky-300' : 'bg-slate-200'
                }`}
                title={h.name}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Header title & category */}
      <Card className="border-border">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-lg font-bold">{header.name}</h2>
            <Badge className={`text-[11px] ${categoryColors[header.category] || 'bg-muted text-foreground/70'}`}>
              {header.category}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">{header.description}</p>
        </CardContent>
      </Card>

      {/* Step indicators */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {stepLabels.map((s, i) => (
          <button
            key={s.key}
            onClick={() => {
              setStep(s.key);
              setQuizAnswer(null);
              setQuizSubmitted(false);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
              i < stepIndex
                ? 'bg-sky-100 text-sky-700'
                : i === stepIndex
                  ? 'bg-sky-600 text-white'
                  : 'bg-muted text-slate-400'
            }`}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentHeader}-${step}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Description step */}
          {step === 'description' && (
            <Card className="border-sky-200 bg-sky-50">
              <CardContent className="space-y-4 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-sky-800">
                  <Lightbulb size={16} /> Общее описание
                </h3>
                <p className="text-sm leading-relaxed text-sky-700">{header.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Attack demo step */}
          {step === 'attack' && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="space-y-4 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-red-800">
                  <AlertTriangle size={16} /> Сценарий атаки
                </h3>
                <p className="text-sm leading-relaxed text-red-700">{header.attackDemo}</p>
              </CardContent>
            </Card>
          )}

          {/* Vulnerable config step */}
          {step === 'vulnerable' && (
            <Card className="border-amber-200">
              <CardContent className="space-y-4 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <AlertTriangle size={16} /> Уязвимая конфигурация
                </h3>
                <CodeBlock code={header.vulnerableConfig} language="javascript" title="vulnerable.js" />
              </CardContent>
            </Card>
          )}

          {/* Secure config step */}
          {step === 'secure' && (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="space-y-4 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <ShieldCheck size={16} /> Безопасная конфигурация
                </h3>
                <CodeBlock code={header.secureConfig} language="javascript" title="secure.js" />
              </CardContent>
            </Card>
          )}

          {/* Quiz step */}
          {step === 'quiz' && (
            <Card className="border-violet-200">
              <CardContent className="space-y-4 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-violet-800">
                  <Trophy size={16} /> Проверьте знания
                </h3>
                <p className="text-sm font-medium">{header.quiz.question}</p>
                <div className="space-y-2">
                  {header.quiz.options.map((option, i) => {
                    let optionStyle = 'border-border hover:border-violet-300';
                    if (quizSubmitted) {
                      if (i === header.quiz.correctIndex) {
                        optionStyle = 'border-emerald-400 bg-emerald-50';
                      } else if (i === quizAnswer && !isQuizCorrect) {
                        optionStyle = 'border-red-400 bg-red-50';
                      }
                    } else if (i === quizAnswer) {
                      optionStyle = 'border-violet-400 bg-violet-50';
                    }
                    return (
                      <button
                        key={i}
                        disabled={quizSubmitted}
                        onClick={() => submitQuiz(i)}
                        className={`w-full rounded-lg border-2 p-3 text-left text-sm transition-all ${optionStyle}`}
                      >
                        <span className="mr-2 font-medium">{String.fromCharCode(65 + i)}.</span>
                        {option}
                        {quizSubmitted && i === header.quiz.correctIndex && (
                          <CheckCircle2 size={14} className="ml-2 inline text-emerald-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {quizSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`rounded-lg p-3 text-sm ${
                      isQuizCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    <p className="mb-1 font-medium">{isQuizCorrect ? 'Правильно!' : 'Неверно.'}</p>
                    <p className="text-xs leading-relaxed">{header.quiz.explanation}</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={prevStep} disabled={stepIndex === 0}>
            <ArrowLeft size={14} className="mr-1" /> Пред. шаг
          </Button>
          <Button variant="outline" size="sm" onClick={prevHeader} disabled={currentHeader === 0}>
            <ArrowLeft size={14} className="mr-1" /> Пред. заголовок
          </Button>
        </div>
        <div className="flex gap-2">
          {step === 'quiz' && quizSubmitted && isQuizCorrect ? (
            currentHeader < securityHeaders.length - 1 ? (
              <Button size="sm" className="bg-sky-600 hover:bg-sky-700" onClick={nextHeader}>
                Следующий заголовок <ArrowRight size={14} className="ml-1" />
              </Button>
            ) : !isCompleted ? (
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleComplete}>
                <CheckCircle2 size={16} className="mr-1" /> Отметить модуль как изученный
              </Button>
            ) : null
          ) : stepIndex < stepLabels.length - 1 ? (
            <Button size="sm" className="bg-sky-600 hover:bg-sky-700" onClick={nextStep}>
              Далее <ArrowRight size={14} className="ml-1" />
            </Button>
          ) : (
            <Button size="sm" className="bg-sky-600 hover:bg-sky-700" onClick={nextHeader}>
              Следующий заголовок <ArrowRight size={14} className="ml-1" />
            </Button>
          )}
          {isCompleted && (
            <div className="ml-2 flex items-center gap-1 text-sm font-medium text-emerald-600">
              <CheckCircle2 size={16} /> Модуль завершён!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
