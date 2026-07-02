"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface AnalyticsFilters {
  groupId: string;
  days: number;
}

interface AnalyticsContextValue extends AnalyticsFilters {
  setGroupId: (id: string) => void;
  setDays: (days: number) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

const DEFAULT_DAYS = 30;

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [groupId, setGroupId] = useState("");
  const [days, setDays] = useState(DEFAULT_DAYS);

  return (
    <AnalyticsContext.Provider value={{ groupId, days, setGroupId, setDays }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsFilters(): AnalyticsContextValue {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    throw new Error(
      "useAnalyticsFilters must be used within AnalyticsProvider",
    );
  }
  return ctx;
}

export function daysToLabel(days: number): string {
  if (days === 7) return "7 дней";
  if (days === 30) return "30 дней";
  if (days === 90) return "90 дней";
  if (days === 180) return "180 дней";
  return `${days} дней`;
}
