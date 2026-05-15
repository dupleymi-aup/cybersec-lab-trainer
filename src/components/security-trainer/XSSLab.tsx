'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { xssTypes } from '@/lib/security-data';
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
  const { xssCompletedLevels, addXssLevel, completeModule, setCurrentPage } = useAppStore();
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
        <div className="bg-white rounded-lg p-4 border border-emerald-200">
          <p className="text-xs text-slate-500 mb-2">Безопасный вывод (textContent / экранирование):</p>
          <code className="text-xs bg-slate-100 px-2 py-1 rounded block font-mono break-all whitespace-pre-wrap">
            {escaped}
          </code>
          <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Код не выполнен — все спецсимволы закодированы
          </p>
        </div>
      );
    }
    return (
      <div className="bg-white rounded-lg p-4 border border-red-200">
        <p className="text-xs text-slate-500 mb-2">Небезопасный вывод (innerHTML):</p>
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <code className="text-xs font-mono text-red-700 break-all whitespace-pre-wrap">
            {text}
          </code>
        </div>
        <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1.5">
          <AlertTriangle size={14} /> В реальном приложении этот скрипт БЫ ВЫПОЛНЕН в браузере жертвы!
        </p>
      </div>
    );
  };

  const badgeTexts: Record<string, string> = {
    reflected: 'Самый распространённый',
    stored: 'Самый опасный',
    dom: 'Невидимый для сервера',
    svg: 'Через изображения',
    markdown: 'Через парсеры MD',
    pdf: 'Через документы',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')}>
          <ChevronLeft size={20} />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <FileText size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Лаборатория XSS-атак</h1>
          <p className="text-xs text-slate-500">6 типов Cross-Site Scripting уязвимостей</p>
        </div>
      </div>

      {/* Progress */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">
              Изучено: {xssCompletedLevels.length}/{xssTypes.length}
            </span>
            {allCompleted && <Badge className="bg-emerald-600 text-white">Модуль завершён!</Badge>}
          </div>
          <div className="flex gap-2">
            {xssTypes.map((x, i) => (
              <button
                key={x.id}
                onClick={() => { setCurrentIndex(i); setShowAttack(false); setSanitized(false); setUserPayload(''); setShowPayloadResult(false); }}
                className={`flex-1 h-2 rounded-full transition-all ${
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
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {xssTypes.map((x, i) => (
          <button
            key={x.id}
            onClick={() => { setCurrentIndex(i); setShowAttack(false); setSanitized(false); setUserPayload(''); setShowPayloadResult(false); }}
            className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all text-center ${
              i === currentIndex
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            {x.id === 'reflected' ? 'Отражённый' : x.id === 'stored' ? 'Хранимый' : x.id === 'dom' ? 'DOM-based' : x.id === 'svg' ? 'SVG' : x.id === 'markdown' ? 'Markdown' : 'PDF'}
            {xssCompletedLevels.includes(x.id) && <CheckCircle2 size={12} className="inline ml-1" />}
          </button>
        ))}
      </div>

      {/* Sanitization toggle */}
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-500" />
                Переключатель санитизации
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Включите, чтобы увидеть разницу между безопасным и опасным выводом
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={sanitized ? 'default' : 'destructive'} className="text-[10px]">
                {sanitized ? 'Защищённый' : 'Уязвимый'}
              </Badge>
              <button
                onClick={() => setSanitized(!sanitized)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  sanitized ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
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
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="font-semibold">{currentXss.title}</h2>
                <Badge variant="secondary" className="text-[10px]">
                  {badgeTexts[currentXss.id] || ''}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{currentXss.description}</p>
            </CardContent>
          </Card>

          {/* Vulnerable code */}
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <h3 className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                <XCircle size={14} /> Уязвимый код
              </h3>
              <CodeBlock code={currentXss.vulnerableCode} language="html" title="vulnerable.html" />
            </CardContent>
          </Card>

          {/* Secure code */}
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <h3 className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Безопасный код
              </h3>
              <CodeBlock code={currentXss.secureCode} language="html" title="secure.html" />
            </CardContent>
          </Card>

          {/* Interactive demo */}
          <Card className="border-slate-200">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Lightbulb size={16} className="text-amber-500" />
                  Интерактивная демонстрация
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAttack(!showAttack)}
                >
                  {showAttack ? 'Скрыть демо' : 'Показать атаку'}
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
                      <p className="text-xs text-slate-500 mb-1">Payload атаки:</p>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <code className="text-xs font-mono text-red-600 break-all whitespace-pre-wrap">
                          {currentXss.attackDemo}
                        </code>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500">Результат вывода:</p>
                    {renderSimulatedPreview()}

                    {/* Custom payload input */}
                    <div className="space-y-2 pt-2 border-t">
                      <h4 className="text-xs font-semibold">Попробуйте свой payload:</h4>
                      <div className="flex gap-2">
                        <Input
                          value={userPayload}
                          onChange={(e) => { setUserPayload(e.target.value); setShowPayloadResult(false); }}
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

                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                        <Lightbulb size={14} /> Защита
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
              Отметить как изученное
            </Button>
          ) : (
            <div className="text-center text-sm text-emerald-600 font-medium flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> Изучено!
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={prevType} disabled={currentIndex === 0}>
          <ArrowLeft size={14} className="mr-1" /> Предыдущий тип
        </Button>
        {currentIndex < xssTypes.length - 1 ? (
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={nextType}>
            Следующий тип <ArrowRight size={14} className="ml-1" />
          </Button>
        ) : (
          allCompleted && (
            <Badge className="bg-emerald-600 text-white">Все типы изучены!</Badge>
          )
        )}
      </div>
    </div>
  );
}
