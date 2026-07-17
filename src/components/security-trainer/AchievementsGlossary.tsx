'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/lib/store';
import { achievements as achievementDefs } from '@/lib/data';
import { getAchievementStatus, countUnlockedAchievements } from '@/lib/achievement-utils';
import { glossaryTerms, glossaryCategoryColors } from '@/lib/data/glossary-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Trophy,
  Search,
  Lock as LockIcon,
  BookOpen,
  Star,
  Target,
  Shield,
  Code,
  Database,
  GraduationCap,
  KeyRound,
} from 'lucide-react';

const achievementIcons: Record<string, React.ReactNode> = {
  'first-steps': <BookOpen size={24} />,
  'sql-master': <Database size={24} />,
  'xss-hunter': <Code size={24} />,
  'security-guard': <Shield size={24} />,
  'auth-expert': <Target size={24} />,
  'code-reviewer': <Code size={24} />,
  'quiz-master': <Trophy size={24} />,
  'quiz-perfect': <Star size={24} />,
  'crypto-ninja': <LockIcon size={24} />,
  'full-completion': <GraduationCap size={24} />,
  'csrf-shield': <Shield size={24} />,
  'owasp-half': <Shield size={24} />,
  'quiz-all': <Trophy size={24} />,
  'crypto-explorer': <KeyRound size={24} />,
  'coding-pro': <Code size={24} />,
  'headers-guard': <Shield size={24} />,
  'coding-master': <Code size={24} />,
  'network-ninja': <Shield size={24} />,
  'social-engineer': <Target size={24} />,
  'all-headers-correct': <Shield size={24} />,
};

const CATEGORY_KEYS = [
  'catVulnerabilities',
  'catCryptography',
  'catAuthentication',
  'catProtection',
  'catNetwork',
  'catAttacks',
  'catOrganizations',
  'catMethodologies',
  'catTools',
] as const;

export default function AchievementsAndGlossary() {
  const tc = useTranslations('common');
  const t = useTranslations('achievementsGlossary');
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const completedModules = useAppStore((s) => s.completedModules);
  const quizScores = useAppStore((s) => s.quizScores);
  const owaspChallengeScores = useAppStore((s) => s.owaspChallengeScores);
  const authChallengeScores = useAppStore((s) => s.authChallengeScores);
  const [activeTab, setActiveTab] = useState<'achievements' | 'glossary'>('achievements');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');

  const challengeStats = {
    owaspCorrect: owaspChallengeScores.correct,
    authCorrect: authChallengeScores.correct,
  };

  const getAchievement = (id: string) => getAchievementStatus(id, completedModules, quizScores, challengeStats);
  const unlockedCount = countUnlockedAchievements(completedModules, quizScores, challengeStats);

  const filteredTerms = glossaryTerms.filter(
    (term) =>
      (activeCategory === '' || term.categoryKey === activeCategory) &&
      (searchTerm === '' ||
        t(`g.${term.termKey}.t`).toLowerCase().includes(searchTerm.toLowerCase()) ||
        t(`g.${term.termKey}.d`).toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')} aria-label={tc('back')}>
          <ChevronLeft size={20} />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Trophy size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'achievements' | 'glossary')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="achievements" className="text-xs">
            <Trophy size={14} className="mr-1" /> {t('tabAchievements')} ({unlockedCount}/{achievementDefs.length})
          </TabsTrigger>
          <TabsTrigger value="glossary" className="text-xs">
            <BookOpen size={14} className="mr-1" /> {t('tabGlossary')} ({glossaryTerms.length})
          </TabsTrigger>
        </TabsList>

        {/* ===== ACHIEVEMENTS ===== */}
        <TabsContent value="achievements" className="mt-4 space-y-4">
          <Card className="border-none bg-gradient-to-r from-amber-50 to-yellow-50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">{t('yourSecurityLevel')}</h2>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {unlockedCount === 0
                      ? t('startLearning')
                      : unlockedCount < 5
                        ? t('onRightTrack')
                        : unlockedCount < achievementDefs.length
                          ? t('impressiveProgress')
                          : t('allUnlocked')}
                  </p>
                </div>
                <div className="text-3xl font-bold text-amber-600">
                  {unlockedCount}/{achievementDefs.length}
                </div>
              </div>
              <div className="bg-muted mt-3 h-2 w-full overflow-hidden rounded-full">
                <motion.div
                  className="h-full rounded-full bg-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(unlockedCount / achievementDefs.length) * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {achievementDefs.map((ach, i) => {
              const unlocked = getAchievement(ach.id);
              return (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card
                    className={`border-border transition-colors ${
                      unlocked ? 'border-emerald-200 bg-emerald-50/30' : 'opacity-60'
                    }`}
                  >
                    <CardContent className="flex items-start gap-3 p-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          unlocked ? 'bg-amber-100 text-amber-600' : 'bg-muted text-slate-400'
                        }`}
                      >
                        {achievementIcons[ach.id] || <Trophy size={24} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="text-sm font-semibold">{ach.title}</h3>
                          {unlocked ? (
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                              {t('unlocked')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              {ach.condition}
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs">{ach.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* ===== GLOSSARY ===== */}
        <TabsContent value="glossary" className="mt-4 space-y-4">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchTerms')}
              className="pl-10"
            />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={activeCategory === '' ? 'default' : 'secondary'}
              className={`cursor-pointer text-[10px] hover:opacity-80 ${
                activeCategory === '' ? '' : 'bg-muted text-foreground/70'
              }`}
              onClick={() => setActiveCategory('')}
            >
              {t('all')} ({glossaryTerms.length})
            </Badge>
            {CATEGORY_KEYS.map((catKey) => {
              const count = glossaryTerms.filter((term) => term.categoryKey === catKey).length;
              return (
                <Badge
                  key={catKey}
                  variant="secondary"
                  className={`cursor-pointer text-[10px] hover:opacity-80 ${
                    activeCategory === catKey ? 'ring-2 ring-slate-400' : ''
                  } ${glossaryCategoryColors[catKey] || 'bg-muted text-foreground/70'}`}
                  onClick={() => setActiveCategory(activeCategory === catKey ? '' : catKey)}
                >
                  {t(catKey)} ({count})
                </Badge>
              );
            })}
          </div>
          {activeCategory && (
            <p className="text-muted-foreground text-xs">
              {t('showingCategory', { category: t(activeCategory), count: filteredTerms.length })}
              <button type="button" className="ml-1 text-emerald-600 underline" onClick={() => setActiveCategory('')}>
                {t('reset')}
              </button>
            </p>
          )}

          <div className="space-y-2">
            {filteredTerms.map((term, i) => (
              <motion.div
                key={term.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card className="border-border transition-colors hover:border-emerald-200">
                  <CardContent className="p-4">
                    <div className="mb-1.5 flex items-center gap-2">
                      <h3 className="font-mono text-sm font-semibold">{t(`g.${term.termKey}.t`)}</h3>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${glossaryCategoryColors[term.categoryKey] || 'bg-muted text-foreground/70'}`}
                      >
                        {t(term.categoryKey)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">{t(`g.${term.termKey}.d`)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {filteredTerms.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-400">
                {t('nothingFound', { query: searchTerm })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
