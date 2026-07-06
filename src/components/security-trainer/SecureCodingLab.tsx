'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { secureCodingChallenges } from '@/lib/data';
import CodeBlock from './CodeBlock';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Code, CheckCircle2, XCircle, ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';

export default function SecureCodingLab() {
  const completeModule = useAppStore((s) => s.completeModule);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const completedModules = useAppStore((s) => s.completedModules);
  const secureCodingAnsweredChallenges = useAppStore((s) => s.secureCodingAnsweredChallenges);
  const addSecureCodingAnswer = useAppStore((s) => s.addSecureCodingAnswer);
  const removeSecureCodingAnswer = useAppStore((s) => s.removeSecureCodingAnswer);
  const secureCodingCorrectCount = useAppStore((s) => s.secureCodingCorrectCount);
  const setSecureCodingCorrectCount = useAppStore((s) => s.setSecureCodingCorrectCount);
  const [activeChallenge, setActiveChallenge] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const answeredSet = new Set(secureCodingAnsweredChallenges);
  const challenge = secureCodingChallenges[activeChallenge];
  const isAnswered = answeredSet.has(activeChallenge);
  const isCompleted = completedModules.includes('secure-coding');

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null || isAnswered) return;
    const isCorrect = challenge.options[selectedOption].correct;
    setShowResult(true);
    addSecureCodingAnswer(activeChallenge);
    if (isCorrect) {
      setSecureCodingCorrectCount(secureCodingCorrectCount + 1);
    }

    // Check completion: count current answered (not yet in store) + store length
    const totalAnswered = answeredSet.size + 1;
    if (totalAnswered === secureCodingChallenges.length) {
      completeModule('secure-coding');
    }
  };

  const nextChallenge = () => {
    if (activeChallenge < secureCodingChallenges.length - 1) {
      setActiveChallenge(activeChallenge + 1);
      setSelectedOption(null);
      setShowResult(false);
    }
  };

  const prevChallenge = () => {
    if (activeChallenge > 0) {
      setActiveChallenge(activeChallenge - 1);
      setSelectedOption(null);
      setShowResult(false);
    }
  };

  const retryChallenge = () => {
    removeSecureCodingAnswer(activeChallenge);
    setSelectedOption(null);
    setShowResult(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')}>
          <ChevronLeft size={20} />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <Code size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Безопасное кодирование</h1>
          <p className="text-muted-foreground text-xs">Найдите уязвимость и выберите правильное решение</p>
        </div>
      </div>

      {/* Progress */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              Задание {activeChallenge + 1} из {secureCodingChallenges.length}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1 text-[10px]">
                <CheckCircle2 size={12} /> {secureCodingCorrectCount} правильных
              </Badge>
              {isCompleted && <Badge className="bg-emerald-600 text-white">Модуль завершён!</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            {secureCodingChallenges.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveChallenge(i);
                  setSelectedOption(null);
                  setShowResult(false);
                }}
                className={`h-2 flex-1 rounded-full transition-all ${
                  answeredSet.has(i) ? 'bg-emerald-500' : i === activeChallenge ? 'bg-emerald-300' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Challenge */}
      <motion.div
        key={activeChallenge}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {challenge.category}
              </Badge>
              <span className="text-xs text-slate-400">Код-ревью</span>
            </div>
            <h2 className="mb-3 font-semibold">{challenge.title}</h2>

            {/* Vulnerable code */}
            <CodeBlock code={challenge.code} language="javascript" title="vulnerable.js" />

            <div className="mt-4">
              <h3 className="mb-3 text-sm font-semibold">Что нужно исправить?</h3>
              <div className="space-y-2">
                {challenge.options.map((option, i) => {
                  let optionStyle = 'border-border hover:border-slate-400 hover:bg-secondary';
                  if (isAnswered) {
                    if (option.correct) {
                      optionStyle = 'border-emerald-400 bg-emerald-50';
                    } else if (selectedOption === i && !option.correct) {
                      optionStyle = 'border-red-400 bg-red-50';
                    } else {
                      optionStyle = 'border-slate-100 opacity-60';
                    }
                  } else if (selectedOption === i) {
                    optionStyle = 'border-emerald-400 bg-emerald-50/50';
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectOption(i)}
                      disabled={isAnswered}
                      className={`w-full rounded-lg border-2 p-3 text-left transition-all duration-200 ${optionStyle}`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                            isAnswered && option.correct
                              ? 'border-emerald-500 bg-emerald-500'
                              : isAnswered && selectedOption === i && !option.correct
                                ? 'border-red-500 bg-red-500'
                                : selectedOption === i
                                  ? 'border-emerald-500 bg-emerald-100'
                                  : 'border-border'
                          }`}
                        >
                          {isAnswered && option.correct && <CheckCircle2 size={14} className="text-white" />}
                          {isAnswered && selectedOption === i && !option.correct && (
                            <XCircle size={14} className="text-white" />
                          )}
                        </div>
                        <span className="text-sm">{option.text}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Check button */}
            {!isAnswered && (
              <Button
                className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleCheckAnswer}
                disabled={selectedOption === null}
              >
                Проверить ответ
              </Button>
            )}

            {/* Explanation */}
            <AnimatePresence>
              {showResult && selectedOption !== null && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                  <div
                    className={`rounded-lg p-4 ${
                      challenge.options[selectedOption]?.correct
                        ? 'border border-emerald-200 bg-emerald-50'
                        : 'border border-red-200 bg-red-50'
                    }`}
                  >
                    <h4
                      className={`mb-1 text-xs font-semibold ${
                        challenge.options[selectedOption]?.correct ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {challenge.options[selectedOption]?.correct ? (
                        <>
                          <CheckCircle2 size={14} className="mr-1 inline" /> Правильно!
                        </>
                      ) : (
                        <>
                          <XCircle size={14} className="mr-1 inline" /> Неправильно
                        </>
                      )}
                    </h4>
                    <p className="text-muted-foreground text-xs leading-relaxed">{challenge.explanation}</p>
                  </div>

                  {/* Retry button */}
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={retryChallenge}>
                    <RotateCcw size={14} className="mr-1" /> Повторить
                  </Button>

                  <div className="mt-4 flex justify-between">
                    <Button variant="outline" size="sm" onClick={prevChallenge} disabled={activeChallenge === 0}>
                      <ArrowLeft size={14} className="mr-1" /> Назад
                    </Button>
                    {activeChallenge < secureCodingChallenges.length - 1 ? (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={nextChallenge}>
                        Следующее <ArrowRight size={14} className="ml-1" />
                      </Button>
                    ) : (
                      <Badge className="bg-emerald-600 py-1.5 text-white">Все задания завершены!</Badge>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
