"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Award, Loader2 } from "lucide-react";
import {
  getAchievementAnalytics,
  type AchievementStat,
} from "@/lib/auth-store";
import { achievements } from "@/lib/data/achievements-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AchievementAnalyticsProps {
  groupId?: string;
  students?: Array<{ id: string; fullName: string }>;
}

const rarityColors: Record<string, string> = {
  epic: "#ef4444",
  rare: "#f97316",
  uncommon: "#eab308",
  common: "#22c55e",
};

const rarityBgColors: Record<string, string> = {
  epic: "bg-red-100 text-red-700",
  rare: "bg-orange-100 text-orange-700",
  uncommon: "bg-yellow-100 text-yellow-700",
  common: "bg-green-100 text-green-700",
};

const rarityLabels: Record<string, string> = {
  epic: "Эпическое",
  rare: "Редкое",
  uncommon: "Необычное",
  common: "Обычное",
};

export default function AchievementAnalytics({
  groupId,
  students,
}: AchievementAnalyticsProps) {
  const [data, setData] = useState<AchievementStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAchievementAnalytics(groupId).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [groupId]);

  const achievementMap = useMemo(() => {
    const map = new Map<
      string,
      { title: string; description: string; icon?: string }
    >();
    achievements.forEach((a) => {
      map.set(a.id, { title: a.title, description: a.description });
    });
    return map;
  }, []);

  // Bar chart data: sorted by unlockRate ascending (rarest first)
  const barData = useMemo(() => {
    return [...data]
      .sort((a, b) => a.unlockRate - b.unlockRate)
      .map((item) => ({
        name: item.title,
        value: item.unlockRate,
        rarity: item.rarity,
        unlocked: item.unlockedCount,
        total: item.totalCount,
      }));
  }, [data]);

  // Pie chart data: count of achievements per rarity
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
    };
    data.forEach((item) => {
      counts[item.rarity] = (counts[item.rarity] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name: rarityLabels[name] || name,
        value,
        color: rarityColors[name],
      }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Loader2 size={32} className="animate-spin mb-3" />
        <p className="text-sm">Загрузка аналитики достижений...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Award size={40} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">Нет данных о достижениях</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Achievement unlock rates - horizontal bar chart */}
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">
              Частота разблокировки достижений
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={barData}
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fontSize: 9 }}
                  />
                  <Tooltip
                    formatter={(value: unknown, _name, props) => {
                      const p = props.payload as {
                        unlocked?: number;
                        total?: number;
                      };
                      return [
                        `${value}%`,
                        `${p.unlocked ?? 0} из ${p.total ?? 0}`,
                      ];
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {barData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={rarityColors[entry.rarity] || "#94a3b8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rarity distribution pie chart */}
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">
              Распределение по редкости
            </h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    style={{ fontSize: 11 }}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown) => `${value} достижений`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-xs text-slate-400 py-8">
                Нет данных
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Achievement cards grid */}
      <div>
        <h3 className="font-semibold text-sm mb-4">Все достижения</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.map((item, i) => {
            const achievementInfo = achievementMap.get(item.id);
            const title = achievementInfo?.title || item.title;
            const description =
              achievementInfo?.description || item.description;
            const totalStudents = item.totalCount || students?.length || 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="border-border hover:border-emerald-200 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}
                        style={{
                          backgroundColor: `${rarityColors[item.rarity]}20`,
                        }}
                      >
                        <Award
                          size={20}
                          style={{ color: rarityColors[item.rarity] }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm truncate">
                            {title}
                          </p>
                          <Badge
                            className={`text-[10px] border-0 ${rarityBgColors[item.rarity]}`}
                          >
                            {rarityLabels[item.rarity]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                          <span>
                            {item.unlockedCount} из {totalStudents} студентов
                            разблокировали
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: rarityColors[item.rarity],
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.unlockRate}%` }}
                            transition={{ duration: 0.8, delay: i * 0.05 }}
                          />
                        </div>
                      </div>
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
