'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { apiSecurityTopics } from '@/lib/data/api-security-data';
import CodeBlock from './CodeBlock';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Code2,
  BookOpen,
  Lightbulb,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Unlock: <Shield size={18} />,
  ShieldOff: <Shield size={18} />,
  EyeOff: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>,
  Gauge: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>,
  TriangleAlert: <AlertTriangle size={18} />,
  ShoppingCart: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>,
  Globe: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  Settings: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  ClipboardList: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>,
  FileWarning: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
};

export default function APISecurityLab() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const { completeModule, addStudiedOwasp } = useAppStore();

  const topic = apiSecurityTopics[currentIndex];
  const isCompleted = completedTopics.has(topic.id);

  const handleNext = () => {
    if (currentIndex < apiSecurityTopics.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleComplete = () => {
    const newCompleted = new Set(completedTopics);
    newCompleted.add(topic.id);
    setCompletedTopics(newCompleted);
    addStudiedOwasp(topic.id);
    if (currentIndex < apiSecurityTopics.length - 1) {
      handleNext();
    } else {
      completeModule('api-security');
    }
  };

  // Extract defense recommendations from content
  const defenseItems = topic.content.match(/• (.+)/g)?.map((item) => item.replace('• ', '')) || [];

  // Render theory content, skipping code blocks
  const renderTheory = () => {
    const lines = topic.content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent = '';

    lines.forEach((line, i) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(<CodeBlock key={`code-${i}`} code={codeContent.trim()} language="javascript" />);
          codeContent = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }

      if (line.startsWith('**') && line.endsWith('**')) {
        elements.push(
          <h3 key={i} className="text-base font-semibold text-foreground mt-4 mb-2">
            {line.replace(/\*\*/g, '')}
          </h3>
        );
      } else if (line.startsWith('•')) {
        elements.push(
          <div key={i} className="flex items-start gap-2 my-1">
            <ChevronRight size={14} className="text-violet-500 shrink-0 mt-0.5" />
            <span className="text-sm text-muted-foreground">{line.replace('• ', '')}</span>
          </div>
        );
      } else if (line.trim() === '') {
        elements.push(<br key={i} />);
      } else {
        elements.push(
          <p key={i} className="text-sm text-muted-foreground leading-relaxed">
            {line}
          </p>
        );
      }
    });

    return <div className="space-y-1">{elements}</div>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Shield className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Безопасность API</h1>
            <p className="text-sm text-muted-foreground">OWASP API Security Top 10 (2023)</p>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          Интерактивный гид по 10 самым критическим угрозам безопасности API с примерами кода и мерами защиты.
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="secondary" className="text-xs">10 тем</Badge>
          <Badge variant="secondary" className="text-xs">Продвинутый</Badge>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">
            {completedTopics.size} / {apiSecurityTopics.length} изучено
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 mt-2">
          <div
            className="bg-gradient-to-r from-violet-500 to-purple-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(completedTopics.size / apiSecurityTopics.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Topic Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {apiSecurityTopics.map((t, idx) => {
          const shortLabel = t.id.replace('api-0', '').replace('api-', '').split('-')[0];
          return (
            <button
              key={t.id}
              onClick={() => setCurrentIndex(idx)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                idx === currentIndex
                  ? 'bg-violet-600 text-white'
                  : completedTopics.has(t.id)
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {idx + 1}. {shortLabel}
            </button>
          );
        })}
      </div>

      {/* Topic Content */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
              {iconMap[topic.icon] || <Shield size={18} />}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">{topic.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
            </div>
            <Badge className={`${topic.riskBg} ${topic.riskColor} text-xs font-medium`}>
              {topic.risk}
            </Badge>
          </div>

          <Tabs defaultValue="theory" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="theory" className="flex items-center gap-2">
                <BookOpen size={14} /> Теория
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code2 size={14} /> Код
              </TabsTrigger>
              <TabsTrigger value="defense" className="flex items-center gap-2">
                <Lightbulb size={14} /> Защита
              </TabsTrigger>
            </TabsList>

            <TabsContent value="theory" className="mt-4">
              {renderTheory()}
            </TabsContent>

            <TabsContent value="code" className="mt-4">
              <div className="space-y-4">
                {topic.codeExample && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <Code2 size={16} className="text-violet-500" />
                      Пример кода
                    </h4>
                    <CodeBlock code={topic.codeExample} language="javascript" />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="defense" className="mt-4">
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-green-800 dark:text-green-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    Рекомендации по защите
                  </h4>
                  <ul className="space-y-2">
                    {defenseItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                        <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1"
            >
              <ChevronLeft size={16} /> Назад
            </Button>

            <Button
              size="sm"
              onClick={handleComplete}
              className={`flex items-center gap-1 ${
                isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-violet-600 hover:bg-violet-700'
              } text-white`}
            >
              {isCompleted ? (
                <><CheckCircle2 size={16} /> Изучено</>
              ) : (
                <>Отметить как изученное</>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex === apiSecurityTopics.length - 1}
              className="flex items-center gap-1"
            >
              Далее <ChevronRight size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
