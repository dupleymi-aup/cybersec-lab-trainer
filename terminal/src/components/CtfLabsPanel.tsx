'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useApiQuery, useApiInvalidate, createApiQueryKey } from '@/hooks/use-api';
import {
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  Search,
  Filter,
} from 'lucide-react';

interface Tag {
  id: string;
  name: string;
}

interface CtfLab {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  difficulty: string;
  type: string;
  points: number;
  isActive: boolean;
  order: number;
  instructions: string;
  hint: string;
  tags: Tag[];
  submissionsCount: number;
  completionRate: number;
  isCompleted?: boolean;
}

export function CtfLabsPanel({ moduleId }: { moduleId?: string }) {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedLab, setSelectedLab] = useState<CtfLab | null>(null);
  const [flag, setFlag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    correct?: boolean;
    message?: string;
    points?: number;
  } | null>(null);

  const queryKey = createApiQueryKey('/api/ctf-labs', { moduleId, difficulty: difficultyFilter, type: typeFilter });
  const { data: labs = [], isLoading, refetch } = useApiQuery<CtfLab[]>(queryKey, {
    enabled: !!user,
  });
  const invalidate = useApiInvalidate();

  const submitFlag = async () => {
    if (!flag.trim() || !selectedLab) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/ctf-labs/${selectedLab.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ flag }),
      });

      const result = await response.json();

      if (response.ok || result.correct) {
        setSubmissionResult({
          correct: true,
          message: result.message,
          points: result.points,
        });
        invalidate(queryKey);
      } else {
        setSubmissionResult({
          correct: false,
          message: result.message,
        });
      }
    } catch {
      toast.error('Ошибка отправки флага');
      setSubmissionResult({
        correct: false,
        message: 'Ошибка отправки',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLabs = labs.filter(lab => {
    const matchesSearch = lab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-orange-500';
      case 'expert': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      web: 'Web',
      crypto: 'Crypto',
      reverse: 'Reverse',
      forensics: 'Forensics',
      pwn: 'Pwn',
      misc: 'Misc',
    };
    return labels[type] || type;
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Войдите, чтобы участвовать в CTF
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск лаб..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background"
        >
          <option value="">Все сложности</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="expert">Expert</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background"
        >
          <option value="">Все типы</option>
          <option value="web">Web</option>
          <option value="crypto">Crypto</option>
          <option value="reverse">Reverse</option>
          <option value="forensics">Forensics</option>
          <option value="pwn">Pwn</option>
          <option value="misc">Misc</option>
        </select>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Labs Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
      ) : filteredLabs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Лабы не найдены</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLabs.map((lab) => (
            <Card
              key={lab.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedLab(lab)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {lab.isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Target className="w-4 h-4" />
                      )}
                      {lab.title}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {lab.description.substring(0, 80)}...
                    </CardDescription>
                  </div>
                  <Badge className={`${getDifficultyColor(lab.difficulty)} text-white`}>
                    {lab.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{getTypeLabel(lab.type)}</Badge>
                    <span className="flex items-center gap-1 text-yellow-600">
                      <Trophy className="w-3 h-3" />
                      {lab.points} XP
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {lab.completionRate}% успеха
                  </div>
                </div>
                {lab.isCompleted && (
                  <div className="mt-2 flex items-center gap-1 text-green-600 text-xs">
                    <Unlock className="w-3 h-3" />
                    Пройдено
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lab Detail Modal */}
      {selectedLab && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedLab.isCompleted ? (
                      <Unlock className="w-5 h-5 text-green-500" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                    {selectedLab.title}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {selectedLab.description}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setSelectedLab(null);
                    setFlag('');
                    setSubmissionResult(null);
                  }}
                  variant="ghost"
                  size="icon"
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={getDifficultyColor(selectedLab.difficulty)}>
                  {selectedLab.difficulty}
                </Badge>
                <Badge variant="secondary">{getTypeLabel(selectedLab.type)}</Badge>
                <Badge variant="outline">{selectedLab.points} XP</Badge>
                {selectedLab.tags.map(tag => (
                  <Badge key={tag.id} variant="outline">{tag.name}</Badge>
                ))}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Инструкции:</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedLab.instructions}</p>
              </div>

              {selectedLab.hint && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                  <h4 className="font-semibold text-sm mb-1">Подсказка:</h4>
                  <p className="text-sm">{selectedLab.hint}</p>
                </div>
              )}

              {!selectedLab.isCompleted && (
                <div>
                  <h4 className="font-semibold mb-2">Отправить флаг:</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="CTF{flag}"
                      value={flag}
                      onChange={(e) => setFlag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitFlag()}
                    />
                    <Button onClick={submitFlag} disabled={submitting}>
                      {submitting ? 'Проверка...' : 'Отправить'}
                    </Button>
                  </div>
                  {submissionResult && (
                    <div
                      className={`mt-2 p-2 rounded-md ${
                        submissionResult.correct
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {submissionResult.correct && submissionResult.points && (
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          <span>
                            {submissionResult.message} +{submissionResult.points} XP!
                          </span>
                        </div>
                      )}
                      {!submissionResult.correct && (
                        <span>{submissionResult.message}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedLab.isCompleted && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-green-700 dark:text-green-300">
                    Лаба пройдена! +{selectedLab.points} XP
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
