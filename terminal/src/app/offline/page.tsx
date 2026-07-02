"use client";

import { Shield, WifiOff, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Shield Icon with pulse animation */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
          <div className="relative bg-card backdrop-blur rounded-full p-5 border border-border">
            <WifiOff className="w-14 h-14 text-blue-400" />
          </div>
        </div>

        {/* Title and description */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">Нет подключения</h1>
          <p className="text-muted-foreground text-lg">
            Похоже, вы потеряли соединение с интернетом.
            <br />
            CyberSec Lab доступен только онлайн.
          </p>
        </div>

        {/* Suggestions */}
        <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-border space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Что можно проверить
          </h2>
          <ul className="text-left space-y-2 text-foreground text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              Проверьте подключение к Wi-Fi или мобильной сети
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              Убедитесь, что не включён режим полёта
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              Попробуйте открыть другой сайт для проверки
            </li>
          </ul>
        </div>

        {/* Retry button */}
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-colors duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
          {isRetrying ? "Переподключение..." : "Попробовать снова"}
        </button>

        {/* Footer */}
        <p className="text-muted-foreground text-xs">
          CyberSec Lab — Тренажёр по информационной безопасности
        </p>
      </div>
    </div>
  );
}
