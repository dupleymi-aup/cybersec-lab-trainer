'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/lib/store';
import { xssTypes } from '@/lib/data';
import CodeBlock from './CodeBlock';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  XCircle,
  Lightbulb,
} from 'lucide-react';

export default function XSSLab() {
  const t = useTranslations('labs.xss');
  const xssCompletedLevels = useAppStore((s) => s.xssCompletedLevels);
  const addXssLevel = useAppStore((s) => s.addXssLevel);
  const completeModule = useAppStore((s) => s.completeModule);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sanitized, setSanitized] = useState(false);
  const [showAttack, setShowAttack] = useState(false);
  const [userPayload, setUserPayload] = useState('');
  const [showPayloadResult, setShowPayloadResult] = useState(false);

  const currentXss = xssTypes[currentIndex];
  const isCompleted = xssCompletedLevels.includes(currentXss.id);
  const allCompleted = xssCompletedLevels.length === xssTypes.length;

  const handleMarkComplete = (id: string) => {
    if (!xssCompletedLevels.includes(id)) {
      addXssLevel(id);
      const { xssCompletedLevels: updatedCompleted } = useAppStore.getState();
      if (updatedCompleted.length === xssTypes.length) {
        completeModule('xss');
      }
    }
  };

  const nextType = () => {
    if (currentIndex < xssTypes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAttack(false);
      setSanitized(false);
      setUserPayload('');
      setShowPayloadResult(false);
    }
  };

  const prevType = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAttack(false);
      setSanitized(false);
      setUserPayload('');
      setShowPayloadResult(false);
    }
  };

  const renderSimulatedPreview = (payload?: string) => {
    const text = payload || currentXss.attackDemo;
    if (sanitized) {
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      return (
        <div className="bg-card rounded-lg border border-emerald-200 p-4">
          <p className="text-muted-foreground mb-2 text-xs">{t('safeOutput')}</p>
          <code className="bg-muted block rounded px-2 py-1 font-mono text-xs break-all whitespace-pre-wrap">
            {escaped}
          </code>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 size={14} /> {t('codeNotExecuted')}
          </p>
        </div>
      );
    }
    return (
      <div className="bg-card rounded-lg border border-red-200 p-4">
        <p className="text-muted-foreground mb-2 text-xs">{t('unsafeOutput')}</p>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <code className="font-mono text-xs break-all whitespace-pre-wrap text-red-700">{text}</code>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertTriangle size={14} /> {t('wouldExecute')}
        </p>
      </div>
    );
  };

  const badgeTexts: Record<string, string> = {
    reflected: t('reflected'),
    stored: t('stored'),
    dom: t('dom'),
    svg: t('svg'),
    markdown: t('markdown'),
    pdf: t('pdf'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')} aria-label="Back">
          <ChevronLeft size={20} />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <FileText size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
        </div>
      </div>

      {/* Progress */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              {t('studied')} {xssCompletedLevels.length}/{xssTypes.length}
            </span>
            {allCompleted && <Badge className="bg-emerald-600 text-white">{t('moduleCompleted')}</Badge>}
          </div>
          <div className="flex gap-2">
            {xssTypes.map((x, i) => (
              <button
                key={x.id}
                onClick={() => {
                  setCurrentIndex(i);
                  setShowAttack(false);
                  setSanitized(false);
                  setUserPayload('');
                  setShowPayloadResult(false);
                }}
                className={`h-2 flex-1 rounded-full transition-all ${
                  xssCompletedLevels.includes(x.id)
                    ? 'bg-emerald-500'
                    : i === currentIndex
                      ? 'bg-emerald-300'
                      : 'bg-slate-200'
                }`}
                title={x.title}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Type selector */}
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {xssTypes.map((x, i) => (
          <button
            key={x.id}
            onClick={() => {
              setCurrentIndex(i);
              setShowAttack(false);
              setSanitized(false);
              setUserPayload('');
              setShowPayloadResult(false);
            }}
            className={`rounded-lg border-2 px-3 py-2 text-center text-xs font-medium transition-all ${
              i === currentIndex
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-border bg-card text-muted-foreground hover:border-border'
            }`}
          >
            {x.id === 'reflected'
              ? 'Отражённый'
              : x.id === 'stored'
                ? 'Хранимый'
                : x.id === 'dom'
                  ? 'DOM-based'
                  : x.id === 'svg'
                    ? 'SVG'
                    : x.id === 'markdown'
                      ? 'Markdown'
                      : 'PDF'}
            {xssCompletedLevels.includes(x.id) && <CheckCircle2 size={12} className="ml-1 inline" />}
          </button>
        ))}
      </div>

      {/* Sanitization toggle */}
      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ShieldAlert size={16} className="text-amber-500" />
                {t('sanitizationToggle')}
              </h3>
              <p className="text-muted-foreground mt-1 text-xs">
                {t('sanitizationDesc')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={sanitized ? 'default' : 'destructive'} className="text-[10px]">
                {sanitized ? t('protected') : t('vulnerable')}
              </Badge>
              <button
                onClick={() => setSanitized(!sanitized)}
                className={`relative h-6 w-12 rounded-full transition-colors ${
                  sanitized ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`bg-card absolute top-0.5 left-0.5 h-5 w-5 rounded-full shadow transition-transform ${
                    sanitized ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* XSS type content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentXss.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* Description */}
          <Card className="border-border">
            <CardContent className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <h2 className="font-semibold">{currentXss.title}</h2>
                <Badge variant="secondary" className="text-[10px]">
                  {badgeTexts[currentXss.id] || ''}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{currentXss.description}</p>
            </CardContent>
          </Card>

          {/* Vulnerable code */}
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <XCircle size={14} /> {t('vulnerableCode')}
              </h3>
              <CodeBlock code={currentXss.vulnerableCode} language="html" title="vulnerable.html" />
            </CardContent>
          </Card>

          {/* Secure code */}
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 size={14} /> {t('secureCode')}
              </h3>
              <CodeBlock code={currentXss.secureCode} language="html" title="secure.html" />
            </CardContent>
          </Card>

          {/* Interactive demo */}
          <Card className="border-border">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Lightbulb size={16} className="text-amber-500" />
                  {t('interactiveDemo')}
                </h3>
                <Button variant="outline" size="sm" onClick={() => setShowAttack(!showAttack)}>
                  {showAttack ? t('hideDemo') : t('showDemo')}
                </Button>
              </div>

              <AnimatePresence>
                {showAttack && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <p className="text-muted-foreground mb-1 text-xs">{t('attackPayload')}</p>
                      <div className="bg-secondary rounded-lg p-3">
                        <code className="font-mono text-xs break-all whitespace-pre-wrap text-red-600">
                          {currentXss.attackDemo}
                        </code>
                      </div>
                    </div>

                    <p className="text-muted-foreground text-xs">{t('outputResult')}</p>
                    {renderSimulatedPreview()}

                    {/* Custom payload input */}
                    <div className="space-y-2 border-t pt-2">
                      <h4 className="text-xs font-semibold">{t('tryPayload')}</h4>
                      <div className="flex gap-2">
                        <Input
                          value={userPayload}
                          onChange={(e) => {
                            setUserPayload(e.target.value);
                            setShowPayloadResult(false);
                          }}
                          placeholder="<script>alert('XSS')</script>"
                          className="font-mono text-xs"
                          onKeyDown={(e) => e.key === 'Enter' && setShowPayloadResult(true)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowPayloadResult(!showPayloadResult)}
                          disabled={!userPayload.trim()}
                        >
                          {showPayloadResult ? <EyeOff size={14} /> : <Eye size={14} />}
                        </Button>
                      </div>
                      <AnimatePresence>
                        {showPayloadResult && userPayload && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {renderSimulatedPreview(userPayload)}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                        <Lightbulb size={14} /> {t('defense')}
                      </h4>
                      <p className="text-xs text-blue-600">{currentXss.mitigation}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Mark complete */}
          {!isCompleted ? (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handleMarkComplete(currentXss.id)}
            >
              {t('markAsStudied')}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-center text-sm font-medium text-emerald-600">
              <CheckCircle2 size={16} /> {t('studiedBadge')}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={prevType} disabled={currentIndex === 0}>
          <ArrowLeft size={14} className="mr-1" /> {t('previousType')}
        </Button>
        {currentIndex < xssTypes.length - 1 ? (
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={nextType}>
            {t('nextType')} <ArrowRight size={14} className="ml-1" />
          </Button>
        ) : (
          allCompleted && <Badge className="bg-emerald-600 text-white">{t('allTypesStudied')}</Badge>
        )}
      </div>
    </div>
  );
}
