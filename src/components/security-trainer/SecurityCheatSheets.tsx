'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import {
  Shield,
  Search,
  Copy,
  Check,
  BookOpen,
  CheckCircle2,
  Lock,
  Globe,
  Database,
  FileText,
  KeyRound,
  Terminal,
} from 'lucide-react';
import { cheatSheets, categoryColors } from '@/lib/data/cheatsheets-data';

const iconMap: Record<string, React.ReactNode> = {
  Shield: <Shield size={18} />,
  Lock: <Lock size={18} />,
  Database: <Database size={18} />,
  FileText: <FileText size={18} />,
  KeyRound: <KeyRound size={18} />,
  Globe: <Globe size={18} />,
  Terminal: <Terminal size={18} />,
};

export default function SecurityCheatSheets() {
  const t = useTranslations('securityCheatSheets');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['all', ...cheatSheets.map((s) => s.category)];

  const filteredSheets = cheatSheets.filter((sheet) => {
    if (activeCategory !== 'all' && sheet.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const title = t(sheet.titleKey).toLowerCase();
      if (title.includes(q)) return true;
      return sheet.items.some(
        (item) =>
          t(item.titleKey).toLowerCase().includes(q) ||
          t(item.contentKey).toLowerCase().includes(q) ||
          (item.code && item.code.toLowerCase().includes(q)),
      );
    }
    return true;
  });

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code).catch(() => {
      // Clipboard API unavailable
    });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <BookOpen className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-foreground text-xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2" size={18} />
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === cat ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat === 'all' ? t('allCategories') : cat}
          </button>
        ))}
      </div>

      {/* Cheat Sheets */}
      <div className="space-y-4">
        {filteredSheets.map((sheet) => (
          <Card key={sheet.id} className="border-border/50">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {iconMap[sheet.icon] || <BookOpen size={18} />}
                </div>
                <h2 className="text-foreground text-lg font-semibold">{t(sheet.titleKey)}</h2>
                <Badge className={categoryColors[sheet.category]}>{sheet.category}</Badge>
                <Badge variant="secondary" className="text-xs">
                  {t('itemsCount', { count: sheet.items.length })}
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {sheet.items.map((item, idx) => (
                  <div key={idx} className="border-border/50 bg-muted/30 rounded-lg border p-3">
                    <h3 className="text-foreground mb-1 flex items-center gap-2 text-sm font-semibold">
                      <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                      {t(item.titleKey)}
                    </h3>
                    <p className="text-muted-foreground mb-2 text-xs">{t(item.contentKey)}</p>
                    {item.code && (
                      <div className="relative">
                        <pre className="overflow-x-auto rounded-md bg-slate-900 p-2.5 font-mono text-xs leading-relaxed text-slate-100">
                          <code>{item.code}</code>
                        </pre>
                        <button
                          onClick={() => item.code && handleCopy(item.code, `${sheet.id}-${idx}`)}
                          className="absolute top-1.5 right-1.5 rounded bg-slate-800 p-1 text-slate-400 transition hover:bg-slate-700 hover:text-white dark:bg-slate-700"
                          title={t('copyTitle')}
                        >
                          {copiedId === `${sheet.id}-${idx}` ? (
                            <Check size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredSheets.length === 0 && (
          <div className="py-12 text-center">
            <Search size={48} className="text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('nothingFound', { query: searchQuery })}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
