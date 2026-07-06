'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { quizQuestions, attackSteps, defenseMechanisms, csrfChallenges, realWorldExamples } from '@/lib/data';
import CodeBlock from './CodeBlock';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe,
  Server,
  ShieldCheck,
  Trophy,
  Target,
  RotateCcw,
  BookOpen,
  History,
  Lightbulb,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Globe: <Globe size={20} className="text-emerald-600" />,
  AlertTriangle: <AlertTriangle size={20} className="text-amber-600" />,
  Server: <Server size={20} className="text-orange-600" />,
};

const mappedAttackSteps = attackSteps.map((step) => ({
  ...step,
  icon: iconMap[step.icon] || step.icon,
}));

export default function CSRFLab() {
  const completedModules = useAppStore((s) => s.completedModules);
  const completeModule = useAppStore((s) => s.completeModule);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const addCsrfStep = useAppStore((s) => s.addCsrfStep);
  const addCsrfChallengeAnswer = useAppStore((s) => s.addCsrfChallengeAnswer);
  const csrfChallengeScores = useAppStore((s) => s.csrfChallengeScores);
  const [currentStep, setCurrentStep] = useState(0);
  const [showDefense, setShowDefense] = useState(false);
  const [activeDefense, setActiveDefense] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  // Challenge states
  const [showChallenges, setShowChallenges] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [challengeAnswer, setChallengeAnswer] = useState<number | null>(null);
  const [challengeSubmitted, setChallengeSubmitted] = useState(false);
  const [challengeCorrect, setChallengeCorrect] = useState(0);

  // Real-world examples state
  const [showRealWorld, setShowRealWorld] = useState(false);
  const [expandedExample, setExpandedExample] = useState<number | null>(null);

  const isCompleted = completedModules.includes('csrf');
  const csrfQuizzes = quizQuestions.filter((q) => q.category === 'CSRF');
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
      setCorrectCount((c) => c + 1);
    }
  };

  const nextQuiz = () => {
    setQuizIndex((q) => q + 1);
    setQuizAnswer(null);
    setQuizSubmitted(false);
  };

  // Challenge handlers
  const submitChallenge = (optionIndex: number) => {
    const challenge = csrfChallenges[currentChallenge];
    if (!challenge) return;
    setChallengeAnswer(optionIndex);
    setChallengeSubmitted(true);
    const isCorrect = optionIndex === challenge.correctIndex;
    if (isCorrect) setChallengeCorrect((c) => c + 1);
    addCsrfChallengeAnswer(challenge.id, isCorrect);
  };

  const nextChallenge = () => {
    setCurrentChallenge((c) => c + 1);
    setChallengeAnswer(null);
    setChallengeSubmitted(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')}>
          <ChevronLeft size={20} />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <Lock size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">CSRF-атаки</h1>
          <p className="text-muted-foreground text-xs">Cross-Site Request Forgery — подделка межсайтовых запросов</p>
        </div>
      </div>

      {/* What is CSRF */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h2 className="mb-2 font-semibold">Что такое CSRF?</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            CSRF — это атака, при которой злоумышленник заставляет браузер аутентифицированного пользователя выполнить
            нежелательное действие на сайте, на котором пользователь уже авторизован. Атака эксплуатирует то, что
            браузер автоматически прикрепляет куки аутентификации к каждому запросу к домену, для которого они
            установлены. Злоумышленник создаёт вредоносную страницу с скрытой HTML-формой, которая автоматически
            отправляет запрос к целевому сайту.
          </p>
        </CardContent>
      </Card>

      {/* Attack simulation */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <Target size={16} className="text-emerald-600" /> Симуляция атаки — пошаговая демонстрация
          </h3>
          <p className="text-muted-foreground mb-4 text-xs">Нажимайте «Далее», чтобы увидеть каждый этап CSRF-атаки</p>

          {/* Steps */}
          <div className="space-y-3">
            {mappedAttackSteps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className={`rounded-lg border-2 p-4 transition-all duration-300 ${
                  i <= currentStep ? step.color : 'bg-secondary border-slate-100 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                      i <= currentStep ? 'bg-slate-800 dark:bg-slate-700' : 'bg-slate-300'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      {step.icon}
                      <h4 className="text-sm font-semibold">{step.title}</h4>
                    </div>
                    <AnimatePresence>
                      {i <= currentStep && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                          <p className="text-muted-foreground mb-2 text-xs leading-relaxed">{step.description}</p>
                          <div className="bg-card/70 rounded p-2">
                            <code className="text-foreground/70 font-mono text-[11px] whitespace-pre-wrap">
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
          <div className="mt-4 flex justify-between">
            <Button variant="outline" size="sm" onClick={goPrev} disabled={currentStep === 0}>
              <ArrowLeft size={14} className="mr-1" /> Назад
            </Button>
            <div className="flex gap-1">
              {mappedAttackSteps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    i <= currentStep ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
            {currentStep < mappedAttackSteps.length - 1 ? (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={goNext}>
                Далее <ArrowRight size={14} className="ml-1" />
              </Button>
            ) : (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowDefense(true)}>
                К защите <ShieldCheck size={14} className="ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Defense mechanisms */}
      {showDefense && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-5">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <ShieldCheck size={16} />
                Механизмы защиты от CSRF
              </h3>
              <p className="text-xs text-emerald-700">Нажимайте на каждый механизм, чтобы увидеть пример кода</p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {defenseMechanisms.map((def, i) => (
              <Card
                key={i}
                className="border-border cursor-pointer transition-colors hover:border-emerald-300"
                onClick={() => setActiveDefense(activeDefense === i ? -1 : i)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{def.title}</h4>
                    <Badge variant="outline" className="text-[10px]">
                      {activeDefense === i ? 'Скрыть' : 'Показать код'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{def.description}</p>

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

          {/* Real-world examples */}
          {!showChallenges && !showQuiz && (
            <div className="mt-6 space-y-3">
              <Button variant="outline" className="w-full" onClick={() => setShowRealWorld(!showRealWorld)}>
                <History size={16} className="mr-2" />
                {showRealWorld ? 'Скрыть' : 'Показать'} реальные примеры CSRF-атак
              </Button>

              <AnimatePresence>
                {showRealWorld && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    {realWorldExamples.map((ex, i) => (
                      <Card
                        key={i}
                        className="cursor-pointer border-amber-200 transition-colors hover:border-amber-400"
                        onClick={() => setExpandedExample(expandedExample === i ? null : i)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className="border-0 bg-amber-100 text-amber-700">{ex.year}</Badge>
                              <span className="text-sm font-semibold">{ex.company}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              {expandedExample === i ? 'Скрыть' : 'Подробнее'}
                            </Badge>
                          </div>
                          <AnimatePresence>
                            {expandedExample === i && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 space-y-2"
                              >
                                <p className="text-muted-foreground text-xs leading-relaxed">{ex.description}</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="rounded bg-red-50 p-2">
                                    <p className="font-semibold text-red-700">Влияние:</p>
                                    <p className="text-red-600">{ex.impact}</p>
                                  </div>
                                  <div className="rounded bg-emerald-50 p-2">
                                    <p className="font-semibold text-emerald-700">Исправление:</p>
                                    <p className="text-emerald-600">{ex.fix}</p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Interactive challenges */}
          {!showQuiz && (
            <div className="mt-4 space-y-3">
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700"
                onClick={() => setShowChallenges(!showChallenges)}
              >
                <Lightbulb size={16} className="mr-2" />
                {showChallenges ? 'Скрыть' : 'Пройти'} интерактивные задания ({csrfChallenges.length} шт.)
              </Button>

              <AnimatePresence>
                {showChallenges && currentChallenge < csrfChallenges.length && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-amber-200">
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-center justify-between">
                          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                            <BookOpen size={16} /> Задание {currentChallenge + 1}/{csrfChallenges.length}
                          </h3>
                          {csrfChallengeScores.total > 0 && (
                            <Badge className="border-0 bg-amber-100 text-amber-700">
                              {csrfChallengeScores.correct}/{csrfChallengeScores.total}
                            </Badge>
                          )}
                        </div>

                        {(() => {
                          const ch = csrfChallenges[currentChallenge];
                          return (
                            <>
                              <h4 className="text-sm font-semibold">{ch.title}</h4>
                              <p className="text-muted-foreground text-xs">{ch.description}</p>
                              {ch.code && <CodeBlock code={ch.code} language="javascript" title="code.js" />}
                              <p className="text-sm font-medium">{ch.question}</p>

                              <div className="space-y-2">
                                {ch.options.map((option, i) => {
                                  let optionStyle = 'border-border hover:border-amber-300';
                                  if (challengeSubmitted) {
                                    if (i === ch.correctIndex) {
                                      optionStyle = 'border-emerald-400 bg-emerald-50';
                                    } else if (i === challengeAnswer && challengeAnswer !== ch.correctIndex) {
                                      optionStyle = 'border-red-400 bg-red-50';
                                    }
                                  } else if (i === challengeAnswer) {
                                    optionStyle = 'border-amber-400 bg-amber-50';
                                  }
                                  return (
                                    <button
                                      key={i}
                                      disabled={challengeSubmitted}
                                      onClick={() => submitChallenge(i)}
                                      className={`w-full rounded-lg border-2 p-3 text-left text-sm transition-all ${optionStyle}`}
                                    >
                                      <span className="mr-2 font-medium">{String.fromCharCode(65 + i)}.</span>
                                      {option}
                                      {challengeSubmitted && i === ch.correctIndex && (
                                        <CheckCircle2 size={14} className="ml-2 inline text-emerald-600" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {challengeSubmitted && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className={`rounded-lg p-3 text-sm ${
                                    challengeAnswer === ch.correctIndex
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-red-50 text-red-700'
                                  }`}
                                >
                                  <p className="mb-1 font-medium">
                                    {challengeAnswer === ch.correctIndex ? 'Правильно!' : 'Неверно.'}
                                  </p>
                                  <p className="text-xs leading-relaxed">{ch.explanation}</p>
                                </motion.div>
                              )}

                              {challengeSubmitted && currentChallenge < csrfChallenges.length - 1 && (
                                <Button
                                  size="sm"
                                  className="w-full bg-amber-600 hover:bg-amber-700"
                                  onClick={nextChallenge}
                                >
                                  Следующее задание <ArrowRight size={14} className="ml-1" />
                                </Button>
                              )}

                              {challengeSubmitted && currentChallenge >= csrfChallenges.length - 1 && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center"
                                >
                                  <p className="mb-1 text-sm font-semibold text-amber-800">Все задания пройдены!</p>
                                  <p className="text-2xl font-bold text-amber-600">
                                    {challengeCorrect}/{csrfChallenges.length}
                                  </p>
                                  <p className="mb-3 text-xs text-amber-500">
                                    {challengeCorrect === csrfChallenges.length
                                      ? 'Отлично! Все ответы правильные!'
                                      : challengeCorrect >= csrfChallenges.length * 0.7
                                        ? 'Хороший результат!'
                                        : 'Стоит повторить материал.'}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setCurrentChallenge(0);
                                      setChallengeCorrect(0);
                                      setChallengeSubmitted(false);
                                      setChallengeAnswer(null);
                                    }}
                                  >
                                    <RotateCcw size={14} className="mr-1" /> Пройти заново
                                  </Button>
                                </motion.div>
                              )}
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Quiz button */}
          {!showQuiz && !showChallenges ? (
            <Button className="mt-4 w-full bg-violet-600 hover:bg-violet-700" onClick={() => setShowQuiz(true)}>
              <Trophy size={16} className="mr-2" /> Проверить знания
            </Button>
          ) : !showQuiz && showChallenges ? (
            <Button className="mt-4 w-full bg-violet-600 hover:bg-violet-700" onClick={() => setShowQuiz(true)}>
              <Trophy size={16} className="mr-2" /> Или проверьте знания квизом
            </Button>
          ) : (
            <div className="mt-4 space-y-4">
              <Card className="border-violet-200">
                <CardContent className="space-y-4 p-5">
                  {!currentQuiz ? (
                    <p className="text-muted-foreground text-center text-sm">Вопросы для CSRF пока не добавлены</p>
                  ) : (
                    <>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-violet-800">
                        <Trophy size={16} /> Вопрос {quizIndex + 1}/{csrfQuizzes.length}
                        <span className="ml-auto text-xs font-normal">Правильно: {correctCount}</span>
                      </h3>
                      <p className="text-sm font-medium">{currentQuiz.question}</p>
                      <div className="space-y-2">
                        {currentQuiz.options.map((option, i) => {
                          let optionStyle = 'border-border hover:border-violet-300';
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
                              className={`w-full rounded-lg border-2 p-3 text-left text-sm transition-all ${optionStyle}`}
                            >
                              <span className="mr-2 font-medium">{String.fromCharCode(65 + i)}.</span>
                              {option}
                              {quizSubmitted && i === currentQuiz.correctIndex && (
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
                            quizAnswer === currentQuiz.correctIndex
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          <p className="mb-1 font-medium">
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
                          className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-4 text-center"
                        >
                          <p className="mb-1 text-sm font-semibold text-violet-800">Квиз завершён!</p>
                          <p className="text-2xl font-bold text-violet-600">
                            {correctCount}/{csrfQuizzes.length}
                          </p>
                          <p className="mb-3 text-xs text-violet-500">
                            {correctCount === csrfQuizzes.length
                              ? 'Отлично! Все ответы правильные!'
                              : correctCount >= csrfQuizzes.length * 0.7
                                ? 'Хороший результат!'
                                : 'Стоит повторить материал.'}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setQuizIndex(0);
                              setCorrectCount(0);
                              setQuizSubmitted(false);
                              setQuizAnswer(null);
                            }}
                          >
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
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleComplete}>
                  Отметить модуль как изученный
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-2 text-center text-sm font-medium text-emerald-600">
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
