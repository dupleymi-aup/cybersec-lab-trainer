'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Reorder } from 'framer-motion';
import { GripVertical, Eye, EyeOff, Star, BookOpen, Save, RotateCcw } from 'lucide-react';
import { modules } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface ModuleConfig {
  moduleId: string;
  enabled: boolean;
  required: boolean;
}

const STORAGE_KEY = 'cybersec-module-config';

interface StoredConfig {
  modules: Record<string, ModuleConfig>;
  order: string[];
}

function loadConfig(): StoredConfig {
  if (typeof window === 'undefined') return { modules: {}, order: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    logger.warn('ModuleManager loadConfig failed', { error: e });
    // Intentionally silent — fallback to defaults if localStorage fails
  }
  return { modules: {}, order: [] };
}

function saveConfig(config: StoredConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export default function ModuleManager() {
  const t = useTranslations('moduleManager');

  const [moduleOrder, setModuleOrder] = useState(() => {
    const saved = loadConfig();
    const savedOrder: string[] = saved.order || [];
    const ordered = modules.map((m, i) => ({
      ...m,
      enabled: saved.modules[m.id]?.enabled ?? true,
      required: saved.modules[m.id]?.required ?? true,
      order: i,
    }));
    if (savedOrder.length > 0) {
      ordered.sort((a, b) => {
        const aIdx = savedOrder.indexOf(a.id);
        const bIdx = savedOrder.indexOf(b.id);
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      });
    }
    return ordered;
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggleEnabled = (moduleId: string) => {
    setModuleOrder((prev) => {
      const next = prev.map((m) => (m.id === moduleId ? { ...m, enabled: !m.enabled } : m));
      setHasChanges(true);
      return next;
    });
  };

  const handleToggleRequired = (moduleId: string) => {
    setModuleOrder((prev) => {
      const next = prev.map((m) => (m.id === moduleId ? { ...m, required: !m.required } : m));
      setHasChanges(true);
      return next;
    });
  };

  const handleSave = () => {
    const moduleConfigs: Record<string, ModuleConfig> = {};
    moduleOrder.forEach((m) => {
      moduleConfigs[m.id] = {
        moduleId: m.id,
        enabled: m.enabled,
        required: m.required,
      };
    });
    const stored: StoredConfig = {
      modules: moduleConfigs,
      order: moduleOrder.map((m) => m.id),
    };
    saveConfig(stored);
    setHasChanges(false);
    toast.success(t('saveSuccess'));
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setModuleOrder(
      modules.map((m, i) => ({
        ...m,
        enabled: true,
        required: true,
        order: i,
      })),
    );
    setHasChanges(false);
    toast.success(t('resetSuccess'));
  };

  const enabledCount = moduleOrder.filter((m) => m.enabled).length;
  const requiredCount = moduleOrder.filter((m) => m.required).length;

  const handleReorder = (reordered: typeof moduleOrder) => {
    setModuleOrder(reordered);
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <BookOpen size={16} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold">{t('title')}</h2>
              <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {t('activeCount', { count: enabledCount, total: modules.length })}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {t('requiredCount', { count: requiredCount })}
          </Badge>
          {hasChanges && (
            <>
              <Button size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw size={14} className="mr-1" /> {t('reset')}
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save size={14} className="mr-1" /> {t('save')}
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          <Reorder.Group axis="y" values={moduleOrder} onReorder={handleReorder} className="divide-y divide-slate-100">
            {moduleOrder.map((mod) => (
              <Reorder.Item
                key={mod.id}
                value={mod}
                as="div"
                className="bg-card hover:bg-secondary p-4 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="hover:text-muted-foreground cursor-grab text-slate-300 active:cursor-grabbing">
                    <GripVertical size={18} />
                  </div>

                  <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                    <BookOpen size={18} className={mod.enabled ? 'text-indigo-600' : 'text-slate-300'} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${mod.enabled ? '' : 'text-slate-400 line-through'}`}>
                        {mod.title}
                      </p>
                      {mod.required && mod.enabled && <Star size={12} className="fill-amber-500 text-amber-500" />}
                    </div>
                    <p className="truncate text-xs text-slate-400">{mod.description}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge className={`text-[10px] ${mod.difficultyColor}`}>{mod.difficulty}</Badge>
                      <span className="text-[10px] text-slate-400">{t('lessons', { count: mod.lessons })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-muted-foreground flex items-center gap-2 text-xs">
                      <span>{t('required')}</span>
                      <Switch
                        checked={mod.required && mod.enabled}
                        onCheckedChange={() => handleToggleRequired(mod.id)}
                        disabled={!mod.enabled}
                        className="data-[state=checked]:bg-amber-500"
                      />
                    </label>

                    <label className="text-muted-foreground flex items-center gap-2 text-xs">
                      {mod.enabled ? (
                        <Eye size={14} className="text-emerald-500" />
                      ) : (
                        <EyeOff size={14} className="text-slate-300" />
                      )}
                      <Switch
                        checked={mod.enabled}
                        onCheckedChange={() => handleToggleEnabled(mod.id)}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </label>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </CardContent>
      </Card>

      {!hasChanges && (
        <div className="rounded-lg border border-sky-100 bg-sky-50 p-4">
          <p className="text-xs text-sky-700">
            <strong>{t('howItWorks')}</strong> {t('howItWorksDescription')}
          </p>
        </div>
      )}
    </div>
  );
}
