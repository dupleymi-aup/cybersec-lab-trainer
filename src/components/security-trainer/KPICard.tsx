'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KPICardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'stable';
  delta?: number;
  deltaSuffix?: string;
  delay?: number;
  iconBg?: string;
  iconColor?: string;
}

export default function KPICard({
  icon,
  value,
  label,
  trend,
  delta,
  deltaSuffix = '',
  delay = 0,
  iconBg = 'bg-indigo-100',
  iconColor = 'text-indigo-600',
}: KPICardProps) {
  const trendIcon = trend === 'up' ? (
    <TrendingUp size={14} className="text-emerald-500" />
  ) : trend === 'down' ? (
    <TrendingDown size={14} className="text-red-500" />
  ) : (
    <Minus size={14} className="text-slate-400" />
  );

  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-400';
  const deltaDisplay = delta !== undefined ? `${delta > 0 ? '+' : ''}${delta}${deltaSuffix}` : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08 }}
    >
      <Card className="border-slate-200 hover:border-slate-300 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
                <span className={iconColor}>{icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            </div>
            {trend && (
              <div className="flex items-center gap-1">
                {trendIcon}
                {delta !== undefined && delta !== 0 && (
                  <span className={`text-xs font-medium ${trendColor}`}>{deltaDisplay}</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
