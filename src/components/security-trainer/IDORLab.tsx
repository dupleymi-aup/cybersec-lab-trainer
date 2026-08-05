'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/lib/store';
import { idorScenarios, idorDefenseMechanisms } from '@/lib/data';
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
  Eye,
  Shield,
  ShieldCheck,
  Lock,
  RotateCcw,
  BookOpen,
  Code,
  Lightbulb,
} from 'lucide-react';

export default function IDORLab() {
  const t = useTranslations('idorLab');
  const completedModules = useAppStore((s) => s.completedModules);
  const completeModule = useAppStore((s) => s.completeModule);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [optionSubmitted, setOptionSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showAllDefenses, setShowAllDefenses] = useState(false);

  const isCompleted = completedModules.includes('idor');
  const scenario = idorScenarios[currentScenario];
  const progressPct = Math.round(((currentScenario + 1) / idorScenarios.length) * 100);

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
    if (currentScenario < idorScenarios.length - 1) {
      setCurrentScenario((s) => s + 1);
      setSelectedOption(null);
      setOptionSubmitted(false);
    } else {
      if (!isCompleted) {
        completeModule('idor');
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
      completeModule('idor');
    }
  };

  const handleReset = () => {
    setCurrentScenario(0);
    setSelectedOption(null);
    setOptionSubmitted(false);
    setCorrectCount(0);
    setShowAllDefenses(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
          <Eye size={22} className="text-red-600" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">{t('title')}</h1>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {t('difficulty')}
            </Badge>
            {isCompleted && <Badge className="border-0 bg-emerald-100 text-emerald-700">{t('completed')}</Badge>}
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm">{t('description')}</p>
        </div>
      </div>

      {/* Progress */}
      <Card className="bg-card border-none shadow-sm">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('labProgress')}</span>
            <span className="text-foreground/70 font-medium">
              {currentScenario + 1} / {idorScenarios.length} —{' '}
              {t('scenarioOf', { current: currentScenario + 1, total: idorScenarios.length })}
            </span>
          </div>
          <Progress value={progressPct} className="h-2" />
          {correctCount > 0 && (
            <p className="mt-2 text-xs text-emerald-600">
              <CheckCircle2 size={12} className="mr-1 inline" />
              {t('correctAnswers')} {correctCount}/{currentScenario + (optionSubmitted ? 1 : 0)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Scenario Navigation */}
      <div className="flex flex-wrap gap-1">
        {idorScenarios.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              setCurrentScenario(i);
              setSelectedOption(null);
              setOptionSubmitted(false);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
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
            <CardContent className="space-y-5 p-6">
              {/* Title and description */}
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <AlertTriangle size={20} className="text-red-500" />
                  {scenario.title}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">{scenario.description}</p>
              </div>

              {/* Vulnerable code */}
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-600">
                  <Code size={16} /> {t('vulnerableCode')}
                </h3>
                <CodeBlock code={scenario.code} language="javascript" />
              </div>

              {/* Explanation */}
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <Lightbulb size={16} /> {t('vulnerabilityAnalysis')}
                  </h3>
                  <p className="mt-1 text-sm text-amber-700">{scenario.explanation}</p>
                </CardContent>
              </Card>

              {/* Quiz */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <BookOpen size={16} /> {t('howToFix')}
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
                        className={`w-full rounded-lg border-2 p-3 text-left text-sm transition-colors ${itemClass}`}
                      >
                        <div className="flex items-center gap-2">
                          {optionSubmitted && opt.correct && (
                            <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                          )}
                          {optionSubmitted && selectedOption === i && !opt.correct && (
                            <AlertTriangle size={16} className="shrink-0 text-red-500" />
                          )}
                          {!optionSubmitted && selectedOption === i && (
                            <div className="h-4 w-4 shrink-0 rounded-full border-2 border-red-500 bg-red-500" />
                          )}
                          {!optionSubmitted && selectedOption !== i && (
                            <div className="border-border h-4 w-4 shrink-0 rounded-full border-2" />
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
                    {t('checkAnswer')}
                  </Button>
                ) : (
                  <Card className="bg-secondary mt-3 border-none">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium">
                        {selectedOption != null && scenario.options[selectedOption]?.correct ? (
                          <span className="text-emerald-600">
                            {t('correct')} {scenario.fixExplanation}
                          </span>
                        ) : (
                          <span className="text-red-600">
                            {t('incorrect')} {scenario.fixExplanation}
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Fixed code */}
              {optionSubmitted && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600">
                    <ShieldCheck size={16} /> {t('fixedCode')}
                  </h3>
                  <CodeBlock code={scenario.fix} language="javascript" />
                  <p className="text-muted-foreground mt-2 text-xs">{scenario.fixExplanation}</p>
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
            type="button"
            onClick={() => setShowAllDefenses(!showAllDefenses)}
            className="flex w-full items-center gap-2"
          >
            <Shield size={20} className="text-emerald-600" />
            <h3 className="font-semibold text-emerald-800">{t('idorDefense')}</h3>
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
                {idorDefenseMechanisms.map((d, i) => (
                  <Card key={i} className="dark:bg-card/70 border-white/50 bg-white/80">
                    <CardContent className="p-3">
                      <h4 className="text-sm font-semibold text-emerald-700">{d.title}</h4>
                      <p className="text-muted-foreground mt-1 text-xs">{d.description}</p>
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
          <Button variant="outline" onClick={handlePrevScenario} disabled={currentScenario === 0}>
            <ArrowLeft size={16} className="mr-1" />
            {t('back')}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw size={16} className="mr-1" />
            {t('reset')}
          </Button>
        </div>
        <div className="flex gap-2">
          {optionSubmitted && (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleComplete}>
              <Lock size={16} className="mr-1" />
              {t('completeModule')}
            </Button>
          )}
          {currentScenario < idorScenarios.length - 1 && (
            <Button onClick={handleNextScenario}>
              {t('next')}
              <ArrowRight size={16} className="ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
