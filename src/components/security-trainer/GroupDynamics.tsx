"use client";

import { useState, useEffect } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  Loader2,
  AlertTriangle,
  Users,
  TrendingUp,
  Heart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { getGroupDynamics, type GroupDynamicsData } from "@/lib/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface GroupDynamicsProps {
  groupId?: string;
  days?: number;
}

const TREND_ICONS = {
  improving: ArrowUpRight,
  stable: Minus,
  declining: ArrowDownRight,
};

const TREND_COLORS = {
  improving: "text-emerald-600",
  stable: "text-muted-foreground",
  declining: "text-red-600",
};

export default function GroupDynamics({
  groupId: propGroupId,
  days: propDays,
}: GroupDynamicsProps = {}) {
  const [data, setData] = useState<GroupDynamicsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalDays, setInternalDays] = useState(90);
  const [internalGroupId] = useState("");

  const days = propDays ?? internalDays;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getGroupDynamics(days, propGroupId || internalGroupId || undefined)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || "Ошибка загрузки");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [days, propGroupId, internalGroupId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-sm text-muted-foreground ml-3">Загрузка данных...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <AlertTriangle size={32} className="text-red-500" />
        <p className="text-sm text-muted-foreground font-medium ml-3">
          {error || "Нет данных"}
        </p>
      </div>
    );
  }

  const { groups, overallTrends } = data;

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Users size={40} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">
          Нет данных о группах. Студенты должны быть распределены по группам.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart size={20} className="text-rose-600" />
          <h2 className="text-lg font-bold">Динамика групп</h2>
        </div>
        {propDays === undefined && (
          <select
            value={internalDays}
            onChange={(e) => setInternalDays(Number(e.target.value))}
            className="px-3 py-1.5 border border-border rounded-md text-sm bg-card"
          >
            <option value={30}>30 дней</option>
            <option value={90}>90 дней</option>
            <option value={180}>180 дней</option>
          </select>
        )}
      </div>

      {/* Group cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((g) => {
          const TrendIcon = TREND_ICONS[g.trend];
          return (
            <Card
              key={g.groupName}
              className={`border-border ${g.trend === "improving" ? "border-emerald-200" : g.trend === "declining" ? "border-red-200" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">{g.groupName}</h3>
                  <div className="flex items-center gap-1">
                    <TrendIcon size={14} className={TREND_COLORS[g.trend]} />
                    <Badge
                      className={`text-[10px] ${g.trend === "improving" ? "bg-emerald-100 text-emerald-700" : g.trend === "declining" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}`}
                    >
                      {g.trend === "improving"
                        ? "Улучшение"
                        : g.trend === "declining"
                          ? "Снижение"
                          : "Стабильно"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center mb-3">
                  <div>
                    <p className="text-lg font-bold text-indigo-600">
                      {g.studentCount}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Студентов
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-violet-600">
                      {g.healthScore}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Здоровье
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-600">
                      {g.performanceVariance}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Вариация
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-600">
                      {g.peerInfluenceScore}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Влияние</p>
                  </div>
                </div>

                {/* Activity timeline */}
                {g.activityTimeline.length > 0 && (
                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={g.activityTimeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="week"
                          tick={{ fontSize: 9 }}
                          tickFormatter={(v: string) => v.slice(5)}
                        />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="activeStudents"
                          name="Активные"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="quizAttempts"
                          name="Квизы"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overall trends */}
      {overallTrends.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={16} /> Общая динамика здоровья групп
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overallTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="avgHealthScore"
                    name="Ср. здоровье"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalActive"
                    name="Активных"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
