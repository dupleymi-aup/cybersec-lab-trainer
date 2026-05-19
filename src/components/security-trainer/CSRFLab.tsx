'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { quizQuestions, attackSteps, defenseMechanisms } from '@/lib/data';
import CodeBlock from './CodeBlock';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Lock, Globe, Server, ShieldCheck, Trophy, Target, RotateCcw } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Globe: <Globe size={20} className="text-emerald-600" />,
  AlertTriangle: <AlertTriangle size={20} className="text-amber-600" />,
  Server: <Server size={20} className="text-orange-600" />,
};

const mappedAttackSteps = attackSteps.map(step => ({
  ...step,
  icon: iconMap[step.icon] || step.icon,
}));

export default function CSRFLab() {
  const { completedModules, completeModule, setCurrentPage, addCsrfStep } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [showDefense, setShowDefense] = useState(false);
  const [activeDefense, setActiveDefense] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const isCompleted = completedModules.includes('csrf');
  const csrfQuizzes = quizQuestions.filter(q => q.category === 'CSRF');
  const currentQuiz = csrfQuizzes.length > 0 ? csrfQuizzes[quizIndex % csrfQuizzes.length] : null;

  const handleComplete = () => {
    if (!isCompleted) {
      completeModule('csrf');
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    addCsrfStep(step);
  };

  const goNext = () => {
    const next = Math.min(currentStep + 1, mappedAttackSteps.length - 1);
    setCurrentStep(next);
    addCsrfStep(next);
  };

  const goPrev = () => {
    const prev = Math.max(0, currentStep - 1);
    setCurrentStep(prev);
    addCsrfStep(prev);
  };

  const submitQuiz = (optionIndex: number) => {
    if (!currentQuiz) return;
    setQuizAnswer(optionIndex);
    setQuizSubmitted(true);
    if (optionIndex === currentQuiz.correctIndex) {
      setCorrectCount(c => c + 1);
    }
  };

  const nextQuiz = () => {
    setQuizIndex(q => q + 1);
    setQuizAnswer(null);
    setQuizSubmitted(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')}>
          <ChevronLeft size={20} />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Lock size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">CSRF-атаки</h1>
          <p className="text-xs text-slate-500">Cross-Site Request Forgery — подделка межсайтовых запросов</p>
        </div>
      </div>

      {/* What is CSRF */}
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <h2 className="font-semibold mb-2">Что такое CSRF?</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            CSRF — это атака, при которой злоумышленник заставляет браузер аутентифицированного пользователя
            выполнить нежелательное действие на сайте, на котором пользователь уже авторизован. Атака
            эксплуатирует то, что браузер автоматически прикрепляет куки аутентификации к каждому запросу
            к домену, для которого они установлены. Злоумышленник создаёт вредоносную страницу с
            скрытой HTML-формой, которая автоматически отправляет запрос к целевому сайту.
          </p>
        </CardContent>
      </Card>

      {/* Attack simulation */}
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <Target size={16} className="text-emerald-600" /> Симуляция атаки — пошаговая демонстрация
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Нажимайте «Далее», чтобы увидеть каждый этап CSRF-атаки
          </p>

          {/* Steps */}
          <div className="space-y-3">
            {mappedAttackSteps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className={`rounded-lg border-2 p-4 transition-all duration-300 ${
                  i <= currentStep ? step.color : 'border-slate-100 bg-slate-50 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                      i <= currentStep ? 'bg-slate-800' : 'bg-slate-300'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {step.icon}
                      <h4 className="text-sm font-semibold">{step.title}</h4>
                    </div>
                    <AnimatePresence>
                      {i <= currentStep && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                        >
                          <p className="text-xs text-slate-600 leading-relaxed mb-2">
                            {step.description}
                          </p>
                          <div className="bg-white/70 rounded p-2">
                            <code className="text-[11px] font-mono text-slate-700 whitespace-pre-wrap">
                              {step.detail}
                            </code>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goPrev}
              disabled={currentStep === 0}
            >
              <ArrowLeft size={14} className="mr-1" /> Назад
            </Button>
            <div className="flex gap-1">
              {mappedAttackSteps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i <= currentStep ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
            {currentStep < mappedAttackSteps.length - 1 ? (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={goNext}
              >
                Далее <ArrowRight size={14} className="ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowDefense(true)}
              >
                К защите <ShieldCheck size={14} className="ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Defense mechanisms */}
      {showDefense && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-emerald-800 mb-1 flex items-center gap-2">
                <ShieldCheck size={16} />
                Механизмы защиты от CSRF
              </h3>
              <p className="text-xs text-emerald-700">
                Нажимайте на каждый механизм, чтобы увидеть пример кода
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {defenseMechanisms.map((def, i) => (
              <Card
                key={i}
                className="border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors"
                onClick={() => setActiveDefense(activeDefense === i ? -1 : i)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{def.title}</h4>
                    <Badge variant="outline" className="text-[10px]">
                      {activeDefense === i ? 'Скрыть' : 'Показать код'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{def.description}</p>

                  <AnimatePresence>
                    {activeDefense === i && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="mt-3">
                          <CodeBlock code={def.code} language="javascript" title="defense.js" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quiz button */}
          {!showQuiz ? (
            <Button
              className="w-full mt-4 bg-violet-600 hover:bg-violet-700"
              onClick={() => setShowQuiz(true)}
            >
              <Trophy size={16} className="mr-2" /> Проверить знания
            </Button>
          ) : (
            <div className="mt-4 space-y-4">
              <Card className="border-violet-200">
                <CardContent className="p-5 space-y-4">
                  {!currentQuiz ? (
                    <p className="text-sm text-slate-500 text-center">Вопросы для CSRF пока не добавлены</p>
                  ) : (
                    <>
                  <h3 className="text-sm font-semibold text-violet-800 flex items-center gap-2">
                    <Trophy size={16} /> Вопрос {quizIndex + 1}/{csrfQuizzes.length}
                    <span className="text-xs font-normal ml-auto">Правильно: {correctCount}</span>
                  </h3>
                  <p className="text-sm font-medium">{currentQuiz.question}</p>
                  <div className="space-y-2">
                    {currentQuiz.options.map((option, i) => {
                      let optionStyle = 'border-slate-200 hover:border-violet-300';
                      if (quizSubmitted) {
                        if (i === currentQuiz.correctIndex) {
                          optionStyle = 'border-emerald-400 bg-emerald-50';
                        } else if (i === quizAnswer && quizAnswer !== currentQuiz.correctIndex) {
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
                          className={`w-full text-left p-3 rounded-lg border-2 text-sm transition-all ${optionStyle}`}
                        >
                          <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                          {option}
                          {quizSubmitted && i === currentQuiz.correctIndex && (
                            <CheckCircle2 size={14} className="inline ml-2 text-emerald-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {quizSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`p-3 rounded-lg text-sm ${
                        quizAnswer === currentQuiz.correctIndex
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <p className="font-medium mb-1">
                        {quizAnswer === currentQuiz.correctIndex ? 'Правильно!' : 'Неверно.'}
                      </p>
                      <p className="text-xs leading-relaxed">{currentQuiz.explanation}</p>
                    </motion.div>
                  )}
                  {quizSubmitted && quizIndex < csrfQuizzes.length - 1 && (
                    <Button size="sm" className="w-full bg-violet-600 hover:bg-violet-700" onClick={nextQuiz}>
                      Следующий вопрос <ArrowRight size={14} className="ml-1" />
                    </Button>
                  )}
                  {quizSubmitted && quizIndex >= csrfQuizzes.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-4 rounded-lg bg-violet-50 border border-violet-200 text-center"
                    >
                      <p className="text-sm font-semibold text-violet-800 mb-1">Квиз завершён!</p>
                      <p className="text-2xl font-bold text-violet-600">{correctCount}/{csrfQuizzes.length}</p>
                      <p className="text-xs text-violet-500 mb-3">
                        {correctCount === csrfQuizzes.length ? 'Отлично! Все ответы правильные!' :
                         correctCount >= csrfQuizzes.length * 0.7 ? 'Хороший результат!' : 'Стоит повторить материал.'}
                      </p>
                      <Button size="sm" variant="outline" onClick={() => { setQuizIndex(0); setCorrectCount(0); setQuizSubmitted(false); setQuizAnswer(null); }}>
                        <RotateCcw size={14} className="mr-1" /> Пройти заново
                      </Button>
                    </motion.div>
                  )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Complete */}
              {!isCompleted ? (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleComplete}
                >
                  Отметить модуль как изученный
                </Button>
              ) : (
                <div className="text-center text-sm text-emerald-600 font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} /> Модуль завершён!
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
