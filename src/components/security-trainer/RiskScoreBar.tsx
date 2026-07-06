"use client";

import { memo } from "react";

interface RiskScoreBarProps {
  score: number; // 0-100
  className?: string;
  showLabel?: boolean;
}

export default memo(function RiskScoreBar({
  score,
  className = "",
  showLabel = true,
}: RiskScoreBarProps) {
  const clampedScore = Math.max(0, Math.min(100, score));

  let colorClass = "bg-emerald-500";
  let textColor = "text-emerald-700";
  let bgClass = "bg-emerald-100";
  if (clampedScore >= 80) {
    colorClass = "bg-red-500";
    textColor = "text-red-700";
    bgClass = "bg-red-100";
  } else if (clampedScore >= 60) {
    colorClass = "bg-orange-500";
    textColor = "text-orange-700";
    bgClass = "bg-orange-100";
  } else if (clampedScore >= 30) {
    colorClass = "bg-amber-500";
    textColor = "text-amber-700";
    bgClass = "bg-amber-100";
  }

  const label =
    clampedScore >= 80
      ? "Критический"
      : clampedScore >= 60
        ? "Высокий"
        : clampedScore >= 30
          ? "Средний"
          : "Низкий";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 h-2.5 rounded-full ${bgClass} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-300`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-medium ${textColor} whitespace-nowrap`}>
          {label} ({clampedScore})
        </span>
      )}
    </div>
  );
});
