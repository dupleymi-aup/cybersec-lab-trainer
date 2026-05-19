'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { phishingEmails, phishingEducationContent } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Mail, Shield, AlertTriangle, CheckCircle2, XCircle, Eye, EyeOff,
  Target, Clock, Link, User, Paperclip, Lightbulb, BookOpen, ArrowRight, RotateCcw
} from 'lucide-react';

const indicatorIcons: Record<string, React.ReactNode> = {
  header: <Eye size={14} />,
  content: <Mail size={14} />,
  link: <Link size={14} />,
  urgency: <Clock size={14} />,
  sender: <User size={14} />,
  attachment: <Paperclip size={14} />,
};

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

type PageType = import('@/lib/store').PageType;

export default function PhishingAnalyzer() {
  const { setCurrentPage, completedModules, completeModule } = useAppStore();
  const [currentPhase, setCurrentPhase] = useState<'education' | 'practice'>('education');
  const [currentEmailIndex, setCurrentEmailIndex] = useState(0);
  const [userVerdict, setUserVerdict] = useState<'phishing' | 'legit' | null>(null);
  const [revealedIndicators, setRevealedIndicators] = useState<Set<string>>(new Set());
  const [showHeaders, setShowHeaders] = useState(false);
  const [showRawBody, setShowRawBody] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  const isCompleted = completedModules.includes('phishing-analyzer');

  const filteredEmails = filterDifficulty === 'all'
    ? phishingEmails
    : phishingEmails.filter(e => e.difficulty === filterDifficulty);

  const currentEmail = filteredEmails[currentEmailIndex];

  const handleVerdict = (verdict: 'phishing' | 'legit') => {
    setUserVerdict(verdict);
    setScore(s => ({
      correct: s.correct + (verdict === 'phishing' ? currentEmail.isPhishing : !currentEmail.isPhishing ? 1 : 0),
      total: s.total + 1,
    }));
  };

  const nextEmail = () => {
    setCurrentEmailIndex(i => (i + 1) % filteredEmails.length);
    setUserVerdict(null);
    setRevealedIndicators(new Set());
    setShowHeaders(false);
    setShowRawBody(false);
  };

  const toggleIndicator = (id: string) => {
    setRevealedIndicators(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard' as PageType)}>
          <ChevronLeft size={20} />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <Shield size={20} className="text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Анализатор фишинговых писем</h1>
          <p className="text-xs text-slate-500">Научитесь распознавать фишинг по заголовкам, содержимому и ссылкам</p>
        </div>
        {score.total > 0 && (
          <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-0">
            Правильно: {score.correct}/{score.total}
          </Badge>
        )}
      </div>

      {/* Phase selector */}
      <div className="flex gap-2">
        <Button
          variant={currentPhase === 'education' ? 'default' : 'outline'}
          onClick={() => setCurrentPhase('education')}
          className={currentPhase === 'education' ? 'bg-blue-600' : ''}
        >
          <BookOpen size={16} className="mr-2" /> Теория
        </Button>
        <Button
          variant={currentPhase === 'practice' ? 'default' : 'outline'}
          onClick={() => setCurrentPhase('practice')}
          className={currentPhase === 'practice' ? 'bg-emerald-600' : ''}
        >
          <Target size={16} className="mr-2" /> Практика ({phishingEmails.length} писем)
        </Button>
      </div>

      {/* Education phase */}
      {currentPhase === 'education' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-5">
              <h2 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Shield size={18} /> {phishingEducationContent.whatIsPhishing.title}
              </h2>
              <p className="text-sm text-blue-800 leading-relaxed">{phishingEducationContent.whatIsPhishing.description}</p>
            </CardContent>
          </Card>

          <div>
            <h3 className="font-semibold mb-3">Типы фишинговых атак</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {phishingEducationContent.commonTypes.map((t, i) => (
                <Card key={i} className="border-slate-200">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold">{t.type}</h4>
                    <p className="text-xs text-slate-600 mt-1">{t.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-500" /> Как распознать фишинг
            </h3>
            <div className="space-y-2">
              {phishingEducationContent.howToSpot.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-white rounded border border-slate-100">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-700">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Что делать, если вы обнаружили фишинг</h3>
            <div className="space-y-2">
              {phishingEducationContent.whatToDo.map((action, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-white rounded border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <p className="text-sm text-slate-700">{action}</p>
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setCurrentPhase('practice')}>
            Перейти к практике <ArrowRight size={16} className="ml-2" />
          </Button>
        </motion.div>
      )}

      {/* Practice phase */}
      {currentPhase === 'practice' && filteredEmails.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2">
            {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
              <Button
                key={d}
                variant={filterDifficulty === d ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setFilterDifficulty(d); setCurrentEmailIndex(0); setUserVerdict(null); setRevealedIndicators(new Set()); }}
                className={filterDifficulty === d ? 'bg-slate-800' : ''}
              >
                {d === 'all' ? 'Все' : d === 'easy' ? 'Лёгкие' : d === 'medium' ? 'Средние' : 'Сложные'}
              </Button>
            ))}
          </div>

          {/* Email preview */}
          <Card className="border-slate-200">
            <CardContent className="p-5">
              {/* Email metadata */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge className={difficultyColors[currentEmail.difficulty]}>
                  {currentEmail.difficulty === 'easy' ? 'Лёгкий' : currentEmail.difficulty === 'medium' ? 'Средний' : 'Сложный'}
                </Badge>
                <span className="text-xs text-slate-400">Письмо {currentEmailIndex + 1} из {filteredEmails.length}</span>
              </div>

              <div className="space-y-2 mb-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-slate-500 w-12 shrink-0">Тема:</span>
                  <span className="text-sm font-medium">{currentEmail.subject}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-slate-500 w-12 shrink-0">От:</span>
                  <span className="text-sm">{currentEmail.from}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-slate-500 w-12 shrink-0">Кому:</span>
                  <span className="text-sm">{currentEmail.to}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-slate-500 w-12 shrink-0">Дата:</span>
                  <span className="text-sm">{currentEmail.date}</span>
                </div>
              </div>

              {/* Email body preview */}
              <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
                <div className="flex items-center justify-between p-2 bg-slate-100 border-b">
                  <span className="text-xs font-semibold text-slate-600">Тело письма</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowRawBody(!showRawBody)}>
                    {showRawBody ? <><EyeOff size={12} className="mr-1" /> Скрыть HTML</> : <><Eye size={12} className="mr-1" /> Показать HTML</>}
                  </Button>
                </div>
                <div className="p-4">
                  {showRawBody ? (
                    <pre className="text-[11px] font-mono text-slate-700 whitespace-pre-wrap overflow-x-auto bg-slate-50 p-3 rounded">
                      {currentEmail.body}
                    </pre>
                  ) : (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: currentEmail.body }}
                    />
                  )}
                </div>
              </div>

              {/* Headers toggle */}
              <Button variant="outline" size="sm" className="w-full" onClick={() => setShowHeaders(!showHeaders)}>
                {showHeaders ? 'Скрыть' : 'Показать'} заголовки письма
              </Button>
              <AnimatePresence>
                {showHeaders && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <pre className="text-[11px] font-mono text-slate-700 whitespace-pre-wrap overflow-x-auto bg-slate-50 p-3 rounded mt-2 border border-slate-200">
                      {currentEmail.headers}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Verdict buttons */}
          {!userVerdict ? (
            <div className="grid grid-cols-2 gap-3">
              <Button className="bg-red-600 hover:bg-red-700 h-14 text-base" onClick={() => handleVerdict('phishing')}>
                <AlertTriangle size={18} className="mr-2" /> Это фишинг
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 h-14 text-base" onClick={() => handleVerdict('legit')}>
                <CheckCircle2 size={18} className="mr-2" /> Легитимное
              </Button>
            </div>
          ) : (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Verdict result */}
                <Card className={`border-2 ${currentEmail.isPhishing === (userVerdict === 'phishing') ? 'border-emerald-400 bg-emerald-50' : 'border-red-400 bg-red-50'}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {currentEmail.isPhishing === (userVerdict === 'phishing') ? (
                        <CheckCircle2 size={20} className="text-emerald-600" />
                      ) : (
                        <XCircle size={20} className="text-red-600" />
                      )}
                      <span className="font-semibold">
                        {currentEmail.isPhishing === (userVerdict === 'phishing') ? 'Правильно!' : 'Неверно.'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">
                      Это письмо <b>{currentEmail.isPhishing ? 'фишинговое' : 'легитимное'}</b>.
                      {currentEmail.isPhishing && ` Найдено ${currentEmail.indicators.length} индикаторов.`}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">{currentEmail.explanation}</p>
                  </CardContent>
                </Card>

                {/* Indicators */}
                {currentEmail.isPhishing && currentEmail.indicators.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Shield size={14} className="text-red-500" /> Индикаторы фишинга (нажмите для подробностей)
                    </h3>
                    {currentEmail.indicators.map(ind => (
                      <Card
                        key={ind.id}
                        className={`border cursor-pointer transition-colors ${revealedIndicators.has(ind.id) ? 'border-slate-300' : 'border-slate-100'}`}
                        onClick={() => toggleIndicator(ind.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">{indicatorIcons[ind.type]}</span>
                            <Badge variant="outline" className={`text-[10px] ${severityColors[ind.severity]}`}>
                              {ind.severity === 'critical' ? 'Критичный' : ind.severity === 'high' ? 'Высокий' : ind.severity === 'medium' ? 'Средний' : 'Низкий'}
                            </Badge>
                            <span className="text-xs font-medium flex-1">{ind.title}</span>
                          </div>
                          <AnimatePresence>
                            {revealedIndicators.has(ind.id) && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{ind.description}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={nextEmail}>
                    {currentEmailIndex < filteredEmails.length - 1 ? 'Следующее письмо' : 'Начать заново'} <ArrowRight size={14} className="ml-1" />
                  </Button>
                  {score.total === filteredEmails.length && (
                    <Button variant="outline" onClick={() => { setScore({ correct: 0, total: 0 }); setCurrentEmailIndex(0); setUserVerdict(null); setRevealedIndicators(new Set()); }}>
                      <RotateCcw size={14} className="mr-1" /> Сбросить счёт
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Complete module */}
          {score.total >= 3 && !isCompleted && (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => completeModule('phishing-analyzer')}
            >
              <CheckCircle2 size={16} className="mr-2" /> Отметить модуль как изученный
            </Button>
          )}
          {isCompleted && (
            <div className="text-center text-sm text-emerald-600 font-medium flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> Модуль завершён!
            </div>
          )}
        </motion.div>
      )}

      {currentPhase === 'practice' && filteredEmails.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            Нет писем с такой сложностью. Выберите «Все».
          </CardContent>
        </Card>
      )}
    </div>
  );
}
