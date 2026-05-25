import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-muted-foreground mb-8">Страница не найдена</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
}
