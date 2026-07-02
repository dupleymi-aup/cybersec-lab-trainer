'use client';
import Link from 'next/link';
import { Shield, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-violet-700 rounded-3xl mb-8 shadow-2xl shadow-violet-600/30">
          <Shield className="w-10 h-10 text-white" aria-hidden="true" />
        </div>

        <h1 className="text-8xl font-bold text-foreground mb-2" id="not-found-heading">404</h1>
        <p className="text-2xl text-foreground font-semibold mb-3">Страница не найдена</p>
        <p className="text-muted-foreground mb-10 max-w-sm mx-auto">
          Запрашиваемая страница не существует или была перемещена
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-violet-600/25"
          >
            <Home className="w-5 h-5" aria-hidden="true" />
            На главную
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground font-semibold rounded-xl transition-all hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}
