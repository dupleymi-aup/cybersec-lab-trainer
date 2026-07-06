'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { sqlChallenges } from '@/lib/data';
import CodeBlock from './CodeBlock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  CheckCircle2,
  Play,
  Eye,
  Lightbulb,
  AlertTriangle,
  Zap,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

export default function SQLInjectionLab() {
  const sqlCompletedLevels = useAppStore((s) => s.sqlCompletedLevels);
  const addSqlLevel = useAppStore((s) => s.addSqlLevel);
  const completeModule = useAppStore((s) => s.completeModule);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const [activeChallenge, setActiveChallenge] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const challenge = sqlChallenges[activeChallenge];
  const isCompleted = sqlCompletedLevels.includes(challenge.id);
  const allCompleted = sqlCompletedLevels.length === sqlChallenges.length;

  const checkAnswer = () => {
    const input = userInput.trim();
    if (!input) return;
    setShowResult(true);

    const hasQuote = /'/.test(input);
    const hasSqlKeyword =
      /\b(OR|UNION|SELECT|DROP|INSERT|UPDATE|DELETE|ALTER|EXEC|SLEEP|WAITFOR|BENCHMARK|LOAD_FILE|xp_cmdshell|CHAR|CONCAT|SUBSTRING|VERSION|information_schema|NULL|--|;|\/\*|0x)\b/i.test(
        input,
      );
    const valid = (hasQuote || hasSqlKeyword) && input.length > 2;

    setIsSuccess(valid);
    if (valid && !isCompleted) {
      addSqlLevel(challenge.id);
      const { sqlCompletedLevels: updatedCompleted } = useAppStore.getState();
      if (updatedCompleted.length === sqlChallenges.length) {
        completeModule('sql-injection');
      }
    }
  };

  const tryExample = () => {
    setUserInput(challenge.exampleInput);
  };

  const nextChallenge = () => {
    if (activeChallenge < sqlChallenges.length - 1) {
      setActiveChallenge(activeChallenge + 1);
      resetState();
    }
  };

  const prevChallenge = () => {
    if (activeChallenge > 0) {
      setActiveChallenge(activeChallenge - 1);
      resetState();
    }
  };

  const resetState = () => {
    setUserInput('');
    setShowResult(false);
    setShowHint(false);
    setHintLevel(0);
    setShowExplanation(false);
    setIsSuccess(false);
  };

  const getModifiedQuery = () => {
    if (!userInput.trim()) return challenge.initialQuery;
    return challenge.initialQuery.replace('[ВВОД]', userInput.trim());
  };

  const levelColors: Record<string, string> = {
    Новичок: 'bg-green-100 text-green-700',
    Продвинутый: 'bg-yellow-100 text-yellow-700',
    Эксперт: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')}>
            <ChevronLeft size={20} />
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <Zap size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Лаборатория SQL-инъекций</h1>
            <p className="text-muted-foreground text-xs">Интерактивная среда для изучения уязвимостей SQL</p>
          </div>
        </div>
        {allCompleted && (
          <Badge className="shrink-0 bg-emerald-600 text-white">
            <CheckCircle2 size={14} className="mr-1" />
            Модуль завершён!
          </Badge>
        )}
      </div>

      {/* Progress bar */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              Прогресс: {sqlCompletedLevels.length}/{sqlChallenges.length}
            </span>
          </div>
          <div className="flex gap-1.5">
            {sqlChallenges.map((c, i) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveChallenge(i);
                  resetState();
                }}
                className={`h-2 flex-1 rounded-full transition-all ${
                  sqlCompletedLevels.includes(c.id)
                    ? 'bg-emerald-500'
                    : i === activeChallenge
                      ? 'bg-emerald-300'
                      : 'bg-slate-200'
                }`}
                title={`Задание ${i + 1}: ${c.title}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column: Challenge info + Input */}
        <div className="space-y-6">
          {/* Challenge info */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="mb-2 flex items-center justify-between">
                <Badge className={`text-[11px] ${levelColors[challenge.level]}`}>{challenge.level}</Badge>
                <span className="text-xs text-slate-400">
                  Задание {activeChallenge + 1} из {sqlChallenges.length}
                </span>
              </div>
              <CardTitle className="text-lg">{challenge.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">{challenge.description}</p>
              {isCompleted && (
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 size={14} /> Пройдено
                </div>
              )}
            </CardContent>
          </Card>

          {/* Input section */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Play size={16} className="text-emerald-600" />
                Симуляция — введите payload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-muted-foreground mb-1 block text-xs">SQL-инъекция:</label>
                <div className="flex gap-2">
                  <Input
                    value={userInput}
                    onChange={(e) => {
                      setUserInput(e.target.value);
                      setShowResult(false);
                    }}
                    placeholder="Введите вредоносный код..."
                    className="font-mono text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                  />
                  <Button onClick={checkAnswer} className="shrink-0 bg-emerald-600 hover:bg-emerald-700">
                    <Play size={16} />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={tryExample}>
                  <Lightbulb size={14} className="mr-1" /> Пример
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowHint(true);
                    setHintLevel(1);
                  }}
                >
                  <Lightbulb size={14} className="mr-1" />
                  {showHint ? (hintLevel < 3 ? `Подсказка ${hintLevel + 1}/3` : 'Все показаны') : 'Подсказка'}
                </Button>
              </div>

              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="space-y-2 rounded-lg bg-amber-50 p-3">
                      <div
                        className={`rounded-lg p-2 ${
                          hintLevel === 1 ? 'bg-amber-100/50' : hintLevel === 2 ? 'bg-orange-100/50' : 'bg-red-100/50'
                        }`}
                      >
                        <p
                          className={`mb-1 text-xs font-semibold ${
                            hintLevel === 1 ? 'text-amber-700' : hintLevel === 2 ? 'text-orange-700' : 'text-red-700'
                          }`}
                        >
                          {hintLevel === 1 ? 'Общая идея:' : hintLevel === 2 ? 'Конкретнее:' : 'Подсказка:'}
                        </p>
                        <p className="text-xs text-amber-800">
                          {hintLevel === 1
                            ? 'Попробуйте понять структуру SQL-запроса и найдите точку внедрения.'
                            : hintLevel === 2
                              ? 'Обратите внимание на синтаксис кавычек, комментарии и операторы объединения запросов.'
                              : challenge.hint}
                        </p>
                      </div>
                      {hintLevel < 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto px-2 py-1 text-xs text-amber-700 hover:text-amber-800"
                          onClick={() => setHintLevel(hintLevel + 1)}
                        >
                          Показать следующую подсказку ({hintLevel + 1}/3) →
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Visualization */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Eye size={16} className="text-emerald-600" />
                Визуализация запроса
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={getModifiedQuery()} language="sql" title="SQL Query" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Result section */}
      <AnimatePresence>
        {showResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className={isSuccess ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                  {isSuccess ? (
                    <>
                      <AlertTriangle size={18} className="text-red-500" />
                      <h3 className="text-sm font-semibold text-red-700">Атака успешна! Запрос модифицирован</h3>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} className="text-amber-500" />
                      <h3 className="text-sm font-semibold text-amber-700">Это не похоже на SQL-инъекцию</h3>
                    </>
                  )}
                </div>
                {isSuccess ? (
                  <CodeBlock code={challenge.successQuery} language="sql" title="Модифицированный запрос" />
                ) : (
                  <div className="dark:bg-card rounded-lg bg-white p-3">
                    <p className="text-muted-foreground mb-2 text-xs">
                      Ваш ввод: <code className="font-mono text-red-600">{userInput}</code>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Для SQL-инъекции попробуйте использовать: одинарные кавычки (<code className="font-mono">'</code>
                      ), SQL-ключевые слова (<code className="font-mono">OR</code>,{' '}
                      <code className="font-mono">UNION SELECT</code>, <code className="font-mono">--</code>), или
                      другие конструкции. Нажмите «Пример» для подсказки.
                    </p>
                  </div>
                )}

                <div>
                  <Button variant="outline" size="sm" onClick={() => setShowExplanation(!showExplanation)}>
                    {showExplanation ? 'Скрыть объяснение' : 'Показать объяснение'}
                  </Button>
                </div>

                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="dark:bg-card mt-2 space-y-3 rounded-lg bg-white p-4">
                        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <BookOpen size={14} /> Объяснение
                        </h4>
                        <p className="text-muted-foreground text-xs leading-relaxed">{challenge.explanation}</p>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                          <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <ShieldCheck size={14} /> Как защититься?
                          </h4>
                          <p className="text-xs text-emerald-600">
                            Используйте параметризованные запросы (prepared statements) или ORM-библиотеки (Prisma,
                            Sequelize, TypeORM). Никогда не подставляйте пользовательский ввод напрямую в SQL-запрос
                            через конкатенацию строк.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={prevChallenge} disabled={activeChallenge === 0}>
                    ← Предыдущее
                  </Button>
                  {activeChallenge < sqlChallenges.length - 1 && (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={nextChallenge}>
                      Следующее →
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
