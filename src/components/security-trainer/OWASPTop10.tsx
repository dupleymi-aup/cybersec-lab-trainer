'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/lib/store';
import { owaspItems } from '@/lib/data';
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
  const t = useTranslations('owaspTop10');
  const studiedOwaspItems = useAppStore((s) => s.studiedOwaspItems);
  const addStudiedOwasp = useAppStore((s) => s.addStudiedOwasp);
  const completeModule = useAppStore((s) => s.completeModule);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const [view, setView] = useState<LessonView>('overview');
  const [currentLesson, setCurrentLesson] = useState(0);
  const [lessonStep, setLessonStep] = useState<
    'description' | 'example' | 'vulnerable' | 'secure' | 'mitigations' | 'resources'
  >('description');

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
    const steps: (typeof lessonStep)[] = ['description', 'example', 'vulnerable', 'secure', 'mitigations'];
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
    const steps: (typeof lessonStep)[] = ['description', 'example', 'vulnerable', 'secure', 'mitigations'];
    const idx = steps.indexOf(lessonStep);
    if (idx > 0) {
      setLessonStep(steps[idx - 1]);
    } else if (currentLesson > 0) {
      goToLesson(currentLesson - 1);
    }
  };

  const steps = [
    { key: 'description' as const, label: t('stepDescription'), icon: BookOpen },
    { key: 'example' as const, label: t('stepExample'), icon: Globe },
    { key: 'vulnerable' as const, label: t('stepVulnerable'), icon: Code },
    { key: 'secure' as const, label: t('stepSecure'), icon: FileCode },
    { key: 'mitigations' as const, label: t('stepMitigations'), icon: Lightbulb },
    { key: 'resources' as const, label: t('stepResources'), icon: ShieldCheck },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === lessonStep);

  if (view === 'overview') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')} aria-label="Back">
            <ChevronLeft size={20} />
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <Shield size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">OWASP Top 10 (2021)</h1>
            <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
          </div>
        </div>

        {/* Progress */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {allStudied ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : (
                  <AlertTriangle size={18} className="text-amber-500" />
                )}
                <span className="text-sm font-medium">
                  {t('studiedLabel')} {studiedCount} {t('studiedOf')} {totalCount}
                </span>
              </div>
              <Badge variant={allStudied ? 'default' : 'secondary'} className={allStudied ? 'bg-emerald-600' : ''}>
                {allStudied ? t('moduleCompleted') : `${Math.round((studiedCount / totalCount) * 100)}%`}
              </Badge>
            </div>
            <Progress value={(studiedCount / totalCount) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Risk Matrix */}
        <Card className="border-none bg-gradient-to-br from-slate-50 to-red-50 shadow-sm">
          <CardContent className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck size={16} className="text-red-500" />
              {t('riskMatrix')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {owaspItems.map((owaspItem) => (
                <div
                  key={owaspItem.id}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white ${owaspItem.severityColor} cursor-pointer transition-opacity hover:opacity-80 ${
                    studiedOwaspItems.includes(owaspItem.id) ? 'ring-2 ring-emerald-400 ring-offset-1' : ''
                  }`}
                  onClick={() => goToLesson(owaspItems.indexOf(owaspItem))}
                >
                  {owaspItem.code} {studiedOwaspItems.includes(owaspItem.id) && '✓'}
                </div>
              ))}
            </div>
            <div className="text-muted-foreground mt-3 flex gap-4 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-red-500" /> {t('severityCritical')}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-orange-500" /> {t('severityHigh')}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-yellow-500" /> {t('severityMedium')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Lesson cards */}
        <div>
          <h2 className="mb-4 text-lg font-bold">{t('lessons')}</h2>
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
                    className={`border-border cursor-pointer transition-all hover:shadow-md ${
                      isItemStudied ? 'border-emerald-300 bg-emerald-50/30' : 'hover:border-emerald-200'
                    }`}
                    onClick={() => goToLesson(index)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isItemStudied ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <ShieldCheck size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {owaspItem.code}
                          </Badge>
                          <Badge className={`text-[10px] text-white ${owaspItem.severityColor} border-0`}>
                            {owaspItem.severity}
                          </Badge>
                        </div>
                        <h3 className="truncate text-sm font-medium">{owaspItem.title}</h3>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setView('overview');
            }}
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <Shield size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t('completionTitle')}</h1>
          </div>
        </div>

        <Card className="border-none bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="bg-card/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <CheckCircle2 size={40} className="text-white" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">
              {allStudied ? t('allLessonsComplete') : t('studiedCount', { count: studiedCount, total: totalCount })}
            </h2>
            <p className="mb-6 text-emerald-100">
              {allStudied
                ? t('congratsAll')
                : t('congratsPartial')}
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                className="hover:bg-card/10 border-white/20 text-white"
                onClick={() => setView('overview')}
              >
                {t('backToLessons')}
              </Button>
              {!isStudied && (
                <Button className="bg-card text-emerald-700 hover:bg-emerald-50" onClick={handleMarkStudied}>
                  {t('markLastStudied')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="mb-3 text-sm font-semibold">{t('progressByTopics')}</h3>
            <div className="space-y-2">
              {owaspItems.map((owaspItem) => {
                const done = studiedOwaspItems.includes(owaspItem.id);
                return (
                  <div key={owaspItem.id} className="flex items-center gap-3 text-xs">
                    {done ? (
                      <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                    ) : (
                      <div className="border-border h-3.5 w-3.5 shrink-0 rounded-full border-2" />
                    )}
                    <span className={`flex-1 ${done ? 'font-medium text-emerald-700' : 'text-muted-foreground'}`}>
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
        <Button variant="ghost" size="icon" onClick={() => setView('overview')} aria-label="Back">
          <ChevronLeft size={20} />
        </Button>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.severityColor} text-white`}>
          <Shield size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px]">
              {item.code}
            </Badge>
            <Badge className={`text-[10px] text-white ${item.severityColor} border-0`}>{item.severity}</Badge>
          </div>
          <h1 className="truncate text-lg font-bold">{item.title}</h1>
        </div>
        {isStudied && <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />}
      </div>

      {/* Step indicator */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              {t('lessonNumber', { current: currentLesson + 1, total: totalCount })}
            </span>
            <span className="text-muted-foreground text-xs">
              {t('stepNumber', { current: currentStepIndex + 1, total: steps.length })}
            </span>
          </div>
          <Progress
            value={((currentLesson * steps.length + currentStepIndex + 1) / (totalCount * steps.length)) * 100}
            className="mb-3 h-2"
          />
          <div className="flex gap-1.5">
            {steps.map((step, i) => (
              <button
                key={step.key}
                onClick={() => setLessonStep(step.key)}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i < currentStepIndex ? 'bg-emerald-500' : i === currentStepIndex ? 'bg-emerald-400' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-center gap-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.key}
                  onClick={() => setLessonStep(step.key)}
                  className={`flex flex-col items-center gap-1 text-[10px] transition-colors ${
                    i === currentStepIndex
                      ? 'font-medium text-emerald-600'
                      : i < currentStepIndex
                        ? 'text-emerald-400'
                        : 'text-slate-400'
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
            <Card className="border-border">
              <CardContent className="space-y-4 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <BookOpen size={16} className="text-emerald-600" />
                  {t('vulnDescription')}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-700">
                    <strong>{t('whyImportant')}</strong> {t('whyImportantText')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {lessonStep === 'example' && (
            <Card className="border-border">
              <CardContent className="space-y-4 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Globe size={16} className="text-amber-600" />
                  {t('realExample')}
                </h3>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm leading-relaxed text-amber-800">{item.realExample}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">
                    <strong>{t('realExampleConclusion')}</strong> {t('realExampleConclusionText')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {lessonStep === 'vulnerable' && (
            <Card className="border-border">
              <CardContent className="space-y-4 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Code size={16} className="text-red-600" />
                  {t('vulnerableCodeTitle')}
                </h3>
                <CodeBlock code={item.vulnerableCode} language="javascript" title="vulnerable.js" />
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs text-red-700">
                    <strong>{t('vulnerableWarning')}</strong> {t('vulnerableWarningText')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {lessonStep === 'secure' && (
            <Card className="border-border">
              <CardContent className="space-y-4 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <FileCode size={16} className="text-emerald-600" />
                  {t('secureCodeTitle')}
                </h3>
                <CodeBlock code={item.secureCode} language="javascript" title="secure.js" />
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-700">
                    <strong>{t('secureNote')}</strong> {t('secureNoteText')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {lessonStep === 'mitigations' && (
            <Card className="border-border">
              <CardContent className="space-y-4 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Lightbulb size={16} className="text-sky-600" />
                  {t('mitigationsTitle')}
                </h3>
                <div className="space-y-3">
                  {item.mitigations.map((m, i) => (
                    <div key={i} className="bg-secondary flex items-start gap-3 rounded-lg p-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">
                        {i + 1}
                      </div>
                      <p className="text-foreground/70 text-sm">{m}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                  <p className="text-xs text-sky-700">
                    <strong>{t('mitigationsTip')}</strong> {t('mitigationsTipText')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {lessonStep === 'resources' && (
            <Card className="border-border">
              <CardContent className="space-y-4 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck size={16} className="text-violet-600" />
                  {t('additionalResources')}
                </h3>
                {'cvssExample' in item && item.cvssExample && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="mb-1 text-xs font-medium text-red-800">{t('cvssExample')}</p>
                    <code className="rounded bg-red-100 px-2 py-1 font-mono text-xs break-all text-red-700">
                      {item.cvssExample}
                    </code>
                  </div>
                )}
                {'toolsForTesting' in item && item.toolsForTesting && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="mb-1 text-xs font-medium text-amber-800">{t('testingTools')}</p>
                    <p className="text-sm text-amber-700">{item.toolsForTesting}</p>
                  </div>
                )}
                {'furtherReading' in item && item.furtherReading && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="mb-1 text-xs font-medium text-blue-800">{t('recommendedReading')}</p>
                    <p className="text-sm text-blue-700">{item.furtherReading}</p>
                  </div>
                )}
                <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                  <p className="text-xs text-violet-700">
                    <strong>{t('resourcesTip')}</strong> {t('resourcesTipText')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={prevStep} disabled={currentLesson === 0 && lessonStep === 'description'}>
          <ArrowLeft size={14} className="mr-1" /> {t('back')}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkStudied}
          disabled={isStudied}
          className={isStudied ? 'text-emerald-600' : ''}
        >
          {isStudied ? (
            <>
              <CheckCircle2 size={14} className="mr-1" /> {t('studied')}
            </>
          ) : (
            t('markAsStudied')
          )}
        </Button>

        <Button onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700">
          {lessonStep === 'mitigations' && currentLesson === owaspItems.length - 1 ? t('completeModule') : t('next')}{' '}
          <ArrowRight size={14} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}
