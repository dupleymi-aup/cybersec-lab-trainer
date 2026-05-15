'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { owaspItems } from '@/lib/security-data';
import CodeBlock from './CodeBlock';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Shield,
  ArrowRight,
  ArrowLeft,
  Globe,
  BookOpen,
  Code,
  Lightbulb,
  FileCode,
} from 'lucide-react';

type LessonView = 'overview' | 'lesson' | 'complete';

export default function OWASPTop10() {
  const { studiedOwaspItems, addStudiedOwasp, completeModule, setCurrentPage } = useAppStore();
  const [view, setView] = useState<LessonView>('overview');
  const [currentLesson, setCurrentLesson] = useState(0);
  const [lessonStep, setLessonStep] = useState<'description' | 'example' | 'vulnerable' | 'secure' | 'mitigations' | 'resources'>('description');

  const studiedCount = studiedOwaspItems.length;
  const totalCount = owaspItems.length;
  const allStudied = studiedCount === totalCount;

  const item = owaspItems[currentLesson];
  const isStudied = studiedOwaspItems.includes(item.id);

  const handleMarkStudied = () => {
    if (isStudied) return;
    addStudiedOwasp(item.id);
    // Check completion using functional update to avoid stale closure
    setTimeout(() => {
      const { studiedOwaspItems: updatedStudied } = useAppStore.getState();
      if (updatedStudied.length === totalCount) {
        completeModule('owasp');
      }
    }, 0);
  };

  const goToLesson = (index: number) => {
    setCurrentLesson(index);
    setLessonStep('description');
    setView('lesson');
  };

  const nextStep = () => {
    const steps: typeof lessonStep[] = ['description', 'example', 'vulnerable', 'secure', 'mitigations'];
    const idx = steps.indexOf(lessonStep);
    if (idx < steps.length - 1) {
      setLessonStep(steps[idx + 1]);
    } else if (currentLesson < owaspItems.length - 1) {
      goToLesson(currentLesson + 1);
    } else {
      setView('complete');
    }
  };

  const prevStep = () => {
    const steps: typeof lessonStep[] = ['description', 'example', 'vulnerable', 'secure', 'mitigations'];
    const idx = steps.indexOf(lessonStep);
    if (idx > 0) {
      setLessonStep(steps[idx - 1]);
    } else if (currentLesson > 0) {
      goToLesson(currentLesson - 1);
    }
  };

  const steps = [
    { key: 'description' as const, label: 'Описание', icon: BookOpen },
    { key: 'example' as const, label: 'Реальный пример', icon: Globe },
    { key: 'vulnerable' as const, label: 'Уязвимый код', icon: Code },
    { key: 'secure' as const, label: 'Безопасный код', icon: FileCode },
    { key: 'mitigations' as const, label: 'Способы защиты', icon: Lightbulb },
    { key: 'resources' as const, label: 'Ресурсы', icon: ShieldCheck },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === lessonStep);

  if (view === 'overview') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')}>
            <ChevronLeft size={20} />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Shield size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">OWASP Top 10 (2021)</h1>
            <p className="text-xs text-slate-500">
              10 критических угроз безопасности веб-приложений
            </p>
          </div>
        </div>

        {/* Progress */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {allStudied ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : (
                  <AlertTriangle size={18} className="text-amber-500" />
                )}
                <span className="text-sm font-medium">
                  Изучено: {studiedCount} из {totalCount}
                </span>
              </div>
              <Badge variant={allStudied ? 'default' : 'secondary'} className={allStudied ? 'bg-emerald-600' : ''}>
                {allStudied ? 'Модуль завершён!' : `${Math.round((studiedCount / totalCount) * 100)}%`}
              </Badge>
            </div>
            <Progress value={(studiedCount / totalCount) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Risk Matrix */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-slate-50 to-red-50">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-red-500" />
              Матрица рисков
            </h3>
            <div className="flex flex-wrap gap-2">
              {owaspItems.map((owaspItem) => (
                <div
                  key={owaspItem.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white ${owaspItem.severityColor} cursor-pointer hover:opacity-80 transition-opacity ${
                    studiedOwaspItems.includes(owaspItem.id) ? 'ring-2 ring-offset-1 ring-emerald-400' : ''
                  }`}
                  onClick={() => goToLesson(owaspItems.indexOf(owaspItem))}
                >
                  {owaspItem.code} {studiedOwaspItems.includes(owaspItem.id) && '✓'}
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500" /> Критический</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-500" /> Высокий</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-yellow-500" /> Средний</span>
            </div>
          </CardContent>
        </Card>

        {/* Lesson cards */}
        <div>
          <h2 className="text-lg font-bold mb-4">Уроки</h2>
          <div className="space-y-3">
            {owaspItems.map((owaspItem, index) => {
              const isItemStudied = studiedOwaspItems.includes(owaspItem.id);
              return (
                <motion.div
                  key={owaspItem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Card
                    className={`cursor-pointer border-slate-200 hover:shadow-md transition-all ${
                      isItemStudied ? 'border-emerald-300 bg-emerald-50/30' : 'hover:border-emerald-200'
                    }`}
                    onClick={() => goToLesson(index)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isItemStudied ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <ShieldCheck size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] font-mono">{owaspItem.code}</Badge>
                          <Badge className={`text-[10px] text-white ${owaspItem.severityColor} border-0`}>
                            {owaspItem.severity}
                          </Badge>
                        </div>
                        <h3 className="text-sm font-medium truncate">{owaspItem.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isItemStudied && <CheckCircle2 size={16} className="text-emerald-500" />}
                        <ArrowRight size={16} className="text-slate-300" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'complete') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setView('overview'); }}>
            <ChevronLeft size={20} />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Shield size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">OWASP Top 10 — Завершение</h1>
          </div>
        </div>

        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {allStudied ? 'Все уроки пройдены!' : `${studiedCount} из ${totalCount} изучено`}
            </h2>
            <p className="text-emerald-100 mb-6">
              {allStudied
                ? 'Поздравляем! Вы изучили все 10 критических угроз OWASP Top 10.'
                : 'Продолжайте изучать оставшиеся темы для полного прохождения.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" onClick={() => setView('overview')}>
                К списку уроков
              </Button>
              {!isStudied && (
                <Button className="bg-white text-emerald-700 hover:bg-emerald-50" onClick={handleMarkStudied}>
                  Отметить последний как изученный
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">Прогресс по темам</h3>
            <div className="space-y-2">
              {owaspItems.map((owaspItem) => {
                const done = studiedOwaspItems.includes(owaspItem.id);
                return (
                  <div key={owaspItem.id} className="flex items-center gap-3 text-xs">
                    {done ? (
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0" />
                    )}
                    <span className={`flex-1 ${done ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                      {owaspItem.code} — {owaspItem.title}
                    </span>
                    <Badge className={`text-[10px] text-white ${owaspItem.severityColor} border-0`}>
                      {owaspItem.severity}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Lesson view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setView('overview')}>
          <ChevronLeft size={20} />
        </Button>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.severityColor} text-white`}>
          <Shield size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Badge variant="outline" className="text-[10px] font-mono">{item.code}</Badge>
            <Badge className={`text-[10px] text-white ${item.severityColor} border-0`}>{item.severity}</Badge>
          </div>
          <h1 className="text-lg font-bold truncate">{item.title}</h1>
        </div>
        {isStudied && <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />}
      </div>

      {/* Step indicator */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">
              Урок {currentLesson + 1} из {totalCount}
            </span>
            <span className="text-xs text-slate-500">
              Шаг {currentStepIndex + 1} из {steps.length}
            </span>
          </div>
          <Progress value={((currentLesson * steps.length + currentStepIndex + 1) / (totalCount * steps.length)) * 100} className="h-2 mb-3" />
          <div className="flex gap-1.5">
            {steps.map((step, i) => (
              <button
                key={step.key}
                onClick={() => setLessonStep(step.key)}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  i < currentStepIndex
                    ? 'bg-emerald-500'
                    : i === currentStepIndex
                      ? 'bg-emerald-400'
                      : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.key}
                  onClick={() => setLessonStep(step.key)}
                  className={`flex flex-col items-center gap-1 text-[10px] transition-colors ${
                    i === currentStepIndex ? 'text-emerald-600 font-medium' : i < currentStepIndex ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden md:block">{step.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${item.id}-${lessonStep}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {lessonStep === 'description' && (
            <Card className="border-slate-200">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen size={16} className="text-emerald-600" />
                  Описание уязвимости
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <p className="text-xs text-emerald-700">
                    <strong>Почему это важно:</strong> Эта уязвимость входит в OWASP Top 10 —
                    список наиболее критических угроз для веб-приложений. Знание и понимание
                    этой категории необходимо каждому разработчику.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {lessonStep === 'example' && (
            <Card className="border-slate-200">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Globe size={16} className="text-amber-600" />
                  Реальный пример из практики
                </h3>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <p className="text-sm text-amber-800 leading-relaxed">{item.realExample}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600">
                    <strong>Вывод:</strong> Реальные инциденты показывают, что даже крупные компании
                    с большими бюджетами на безопасность подвержены этим уязвимостям.
                    Понимание механизмов атак — первый шаг к защите.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {lessonStep === 'vulnerable' && (
            <Card className="border-slate-200">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Code size={16} className="text-red-600" />
                  Уязвимый код — что НЕЛЬЗЯ делать
                </h3>
                <CodeBlock code={item.vulnerableCode} language="javascript" title="vulnerable.js" />
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <p className="text-xs text-red-700">
                    <strong>Внимание:</strong> Приведённый код содержит уязвимости. Не используйте
                    подобные паттерны в продакшене. Каждая строка с комментарием «УЯЗВИМЫЙ КОД»
                    демонстрирует типичную ошибку разработчика.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {lessonStep === 'secure' && (
            <Card className="border-slate-200">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileCode size={16} className="text-emerald-600" />
                  Безопасный код — как ПРАВИЛЬНО
                </h3>
                <CodeBlock code={item.secureCode} language="javascript" title="secure.js" />
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <p className="text-xs text-emerald-700">
                    <strong>Обратите внимание:</strong> Безопасный код всегда включает валидацию
                    входных данных, проверку прав доступа и обработку ошибок. Разница между
                    уязвимым и безопасным кодом часто заключается в нескольких строках проверок.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {lessonStep === 'mitigations' && (
            <Card className="border-slate-200">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Lightbulb size={16} className="text-sky-600" />
                  Способы защиты
                </h3>
                <div className="space-y-3">
                  {item.mitigations.map((m, i) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-sm text-slate-700">{m}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-sky-50 rounded-lg p-3 border border-sky-200">
                  <p className="text-xs text-sky-700">
                    <strong>Совет:</strong> Применяйте эти рекомендации комплексно. Один метод защиты
                    редко бывает достаточен — используйте «глубокую защиту» (Defense in Depth).
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {lessonStep === 'resources' && (
            <Card className="border-slate-200">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck size={16} className="text-violet-600" />
                  Дополнительные ресурсы
                </h3>
                {'cvssExample' in item && item.cvssExample && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <p className="text-xs font-medium text-red-800 mb-1">Пример CVSS-вектора:</p>
                    <code className="text-xs bg-red-100 px-2 py-1 rounded font-mono text-red-700 break-all">
                      {item.cvssExample}
                    </code>
                  </div>
                )}
                {'toolsForTesting' in item && item.toolsForTesting && (
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-xs font-medium text-amber-800 mb-1">Инструменты для тестирования:</p>
                    <p className="text-sm text-amber-700">{item.toolsForTesting}</p>
                  </div>
                )}
                {'furtherReading' in item && item.furtherReading && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-xs font-medium text-blue-800 mb-1">Рекомендуемая литература:</p>
                    <p className="text-sm text-blue-700">{item.furtherReading}</p>
                  </div>
                )}
                <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
                  <p className="text-xs text-violet-700">
                    <strong>Совет:</strong> Используйте эти ресурсы для углублённого изучения темы
                    и практического тестирования на лабораторных стендах.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentLesson === 0 && lessonStep === 'description'}
        >
          <ArrowLeft size={14} className="mr-1" /> Назад
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkStudied}
          disabled={isStudied}
          className={isStudied ? 'text-emerald-600' : ''}
        >
          {isStudied ? <><CheckCircle2 size={14} className="mr-1" /> Изучено</> : 'Отметить как изученное'}
        </Button>

        <Button onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700">
          {lessonStep === 'mitigations' && currentLesson === owaspItems.length - 1
            ? 'Завершить модуль'
            : 'Далее'} <ArrowRight size={14} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}
