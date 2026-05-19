'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ssrfScenarios, ssrfDefenseMechanisms } from '@/lib/data';
import CodeBlock from './CodeBlock';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Shield,
  ShieldCheck,
  Lock,
  RotateCcw,
  BookOpen,
  Code,
  Lightbulb,
} from 'lucide-react';

export default function SSRFLab() {
  const { completedModules, completeModule } = useAppStore();
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [optionSubmitted, setOptionSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showAllDefenses, setShowAllDefenses] = useState(false);

  const isCompleted = completedModules.includes('ssrf');
  const scenario = ssrfScenarios[currentScenario];
  const progressPct = Math.round(((currentScenario + 1) / ssrfScenarios.length) * 100);

  const handleOptionSelect = (index: number) => {
    if (optionSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmitOption = () => {
    if (selectedOption === null) return;
    setOptionSubmitted(true);
    if (scenario.options[selectedOption]?.correct) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNextScenario = () => {
    if (currentScenario < ssrfScenarios.length - 1) {
      setCurrentScenario((s) => s + 1);
      setSelectedOption(null);
      setOptionSubmitted(false);
    } else {
      if (!isCompleted) {
        completeModule('ssrf');
      }
    }
  };

  const handlePrevScenario = () => {
    if (currentScenario > 0) {
      setCurrentScenario((s) => s - 1);
      setSelectedOption(null);
      setOptionSubmitted(false);
    }
  };

  const handleComplete = () => {
    if (!isCompleted) {
      completeModule('ssrf');
    }
  };

  const handleReset = () => {
    setCurrentScenario(0);
    setSelectedOption(null);
    setOptionSubmitted(false);
    setCorrectCount(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <Globe size={22} className="text-red-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">SSRF-атаки</h1>
            <Badge variant="secondary" className="bg-red-100 text-red-800">Продвинутый</Badge>
            {isCompleted && <Badge className="bg-emerald-100 text-emerald-700 border-0">Пройден</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Server-Side Request Forgery — подделка запросов на стороне сервера
          </p>
        </div>
      </div>

      {/* Progress */}
      <Card className="border-none shadow-sm bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Прогресс лаборатории</span>
            <span className="font-medium text-foreground/70">
              Сценарий {currentScenario + 1} из {ssrfScenarios.length}
            </span>
          </div>
          <Progress value={progressPct} className="h-2" />
          {correctCount > 0 && (
            <p className="text-xs text-emerald-600 mt-2">
              <CheckCircle2 size={12} className="inline mr-1" />
              Правильных ответов: {correctCount}/{currentScenario + (optionSubmitted ? 1 : 0)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Scenario Navigation */}
      <div className="flex gap-1 flex-wrap">
        {ssrfScenarios.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              setCurrentScenario(i);
              setSelectedOption(null);
              setOptionSubmitted(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              i === currentScenario
                ? 'bg-red-600 text-white'
                : i < currentScenario
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-muted text-muted-foreground hover:bg-slate-200'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Scenario Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScenario}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-red-200">
            <CardContent className="p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <AlertTriangle size={20} className="text-red-500" />
                  {scenario.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">{scenario.description}</p>
              </div>

              {/* Vulnerable code */}
              <div>
                <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
                  <Code size={16} /> Уязвимый код
                </h3>
                <CodeBlock code={scenario.code} language="javascript" />
              </div>

              {/* Explanation */}
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                    <Lightbulb size={16} /> Анализ уязвимости
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">{scenario.explanation}</p>
                </CardContent>
              </Card>

              {/* Quiz */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <BookOpen size={16} /> Как исправить эту уязвимость?
                </h3>
                <div className="space-y-2">
                  {scenario.options.map((opt, i) => {
                    let itemClass = 'border-border hover:border-border bg-card';
                    if (selectedOption === i) {
                      itemClass = optionSubmitted
                        ? opt.correct
                          ? 'border-emerald-400 bg-emerald-50'
                          : 'border-red-400 bg-red-50'
                        : 'border-red-400 bg-red-50';
                    }
                    if (optionSubmitted && opt.correct && selectedOption !== i) {
                      itemClass = 'border-emerald-400 bg-emerald-50';
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleOptionSelect(i)}
                        disabled={optionSubmitted}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-colors text-sm ${itemClass}`}
                      >
                        <div className="flex items-center gap-2">
                          {optionSubmitted && opt.correct && (
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                          )}
                          {optionSubmitted && selectedOption === i && !opt.correct && (
                            <AlertTriangle size={16} className="text-red-500 shrink-0" />
                          )}
                          {!optionSubmitted && selectedOption === i && (
                            <div className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-500 shrink-0" />
                          )}
                          {!optionSubmitted && selectedOption !== i && (
                            <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
                          )}
                          <span>{opt.text}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!optionSubmitted ? (
                  <Button
                    className="mt-3 bg-red-600 hover:bg-red-700"
                    onClick={handleSubmitOption}
                    disabled={selectedOption === null}
                  >
                    Проверить ответ
                  </Button>
                ) : (
                  <Card className="mt-3 border-none bg-secondary">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium">
                        {scenario.options[selectedOption!]?.correct ? (
                          <span className="text-emerald-600">Правильно! {scenario.fixExplanation}</span>
                        ) : (
                          <span className="text-red-600">Неверно. {scenario.fixExplanation}</span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Fixed code */}
              {optionSubmitted && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="text-sm font-semibold text-emerald-600 mb-2 flex items-center gap-2">
                    <ShieldCheck size={16} /> Исправленный код
                  </h3>
                  <CodeBlock code={scenario.fix} language="javascript" />
                  <p className="text-xs text-muted-foreground mt-2">{scenario.fixExplanation}</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Defense mechanisms */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardContent className="p-5">
          <button
            onClick={() => setShowAllDefenses(!showAllDefenses)}
            className="flex items-center gap-2 w-full"
          >
            <Shield size={20} className="text-emerald-600" />
            <h3 className="font-semibold text-emerald-800">Механизмы защиты от SSRF</h3>
            <ChevronLeft
              size={18}
              className={`ml-auto transition-transform ${showAllDefenses ? 'rotate-90' : '-rotate-90'}`}
            />
          </button>

          <AnimatePresence>
            {showAllDefenses && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3"
              >
                {ssrfDefenseMechanisms.map((d, i) => (
                  <Card key={i} className="border-white/50 bg-white/80 dark:bg-card/70">
                    <CardContent className="p-3">
                      <h4 className="text-sm font-semibold text-emerald-700">{d.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{d.description}</p>
                      <CodeBlock code={d.code} language="javascript" />
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrevScenario}
            disabled={currentScenario === 0}
          >
            <ArrowLeft size={16} className="mr-1" />
            Назад
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw size={16} className="mr-1" />
            Сбросить
          </Button>
        </div>
        <div className="flex gap-2">
          {optionSubmitted && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleComplete}
            >
              <Lock size={16} className="mr-1" />
              Завершить модуль
            </Button>
          )}
          {currentScenario < ssrfScenarios.length - 1 && (
            <Button onClick={handleNextScenario}>
              Далее
              <ArrowRight size={16} className="ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
