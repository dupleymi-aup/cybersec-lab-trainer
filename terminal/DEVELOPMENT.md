# Руководство разработчика CyberSec Lab

Это руководство поможет вам начать разработку и внести свой вклад в проект.

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 20+
- PostgreSQL 15+ (или Docker)
- npm 10+

### Установка

```bash
# Клонировать репозиторий
git clone git@github-work:dupleymi-aup/cybersec-lab-trainer.git
cd cybersec-lab-trainer

# Установить зависимости
npm ci

# Настроить переменные окружения
cp .env.example .env

# Запустить PostgreSQL через Docker
docker-compose up -d postgres

# Сгенерировать Prisma client
npm run db:generate

# Применить миграции
npm run db:migrate

# Запустить development server
npm run dev
```

## 📦 Скрипты

```bash
# Development
npm run dev              # Найти свободный порт и запустить dev server
npm run dev:auto         # Автозапуск dev server на порту 3000

# Building
npm run build            # Production build
npm run start            # Запустить production server

# Testing
npm run test:unit        # Запустить unit тесты
npm run test:unit:watch  # Unit тесты в watch mode
npm run test:coverage    # Запустить тесты с coverage report
npm run test:e2e         # Запустить E2E тесты (Playwright)

# Database
npm run db:generate      # Сгенерировать Prisma client
npm run db:migrate       # Применить миграции
npm run db:push          # Push schema в БД (без миграций)
npm run db:reset         # Сбросить БД и применить миграции
npm run db:seed          # Заполнить БД тестовыми данными

# Code quality
npm run lint             # Запустить ESLint
npx tsc --noEmit         # Проверка типов TypeScript

# Documentation
npm run docs             # Открыть Swagger UI (требуется dev server)
```

## 🧪 Тестирование

### Unit тесты

Проект использует **Vitest** для unit тестирования:

```bash
# Запустить все тесты
npm run test:unit

# Watch mode
npm run test:unit:watch

# С coverage
npm run test:coverage
```

**Текущее покрытие:**
- Statements: 36.9%
- Branches: 35.56%
- Functions: 47.76%
- Lines: 36.37%

**Структура тестов:**
```
tests/
├── auth-utils.test.ts        # Тесты утилит аутентификации
├── xp-utils.test.ts          # Тесты системы уровней и XP
├── api-validation.test.ts    # Тесты Zod схем
├── csrf-middleware.test.ts   # Тесты CSRF защиты
└── ...
```

### E2E тесты

Проект использует **Playwright** для E2E тестирования:

```bash
# Запустить E2E тесты
npm run test:e2e

# Watch mode
npx playwright test --ui

# Запустить конкретный тест
npx playwright test --grep "login"
```

### Написание тестов

Пример unit теста:

```typescript
// tests/example.test.ts
import { describe, it, expect } from 'vitest';
import { calculateXP } from '@/lib/xp-utils';

describe('calculateXP', () => {
  it('should calculate XP correctly for module completion', () => {
    const result = calculateXP('module_complete', { moduleId: 'sql-injection' });
    expect(result).toBe(100);
  });

  it('should handle invalid XP events', () => {
    const result = calculateXP('invalid_event', {});
    expect(result).toBe(0);
  });
});
```

## 🏗️ Архитектура проекта

### Структура директорий

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── analytics/     # Analytics endpoints
│   │   ├── assignments/   # Assignments CRUD
│   │   └── ...
│   └── ...                # Pages
├── components/
│   ├── security-trainer/  # Основной UI
│   ├── landing/           # Landing page компоненты
│   └── ui/                # Reusable UI компоненты (shadcn/ui)
├── hooks/                 # Custom React hooks
├── lib/
│   ├── validations/       # Zod schemas
│   ├── data/              # Static data (квизы, достижения)
│   └── *.ts               # Утилиты и сервисы
└── types/                 # TypeScript types
```

### API Architecture

API следует RESTful принципам:

```typescript
// Пример API route
// src/app/api/users/[id]/route.ts

import { NextRequest } from 'next/server';
import { authenticate } from '@/lib/auth-server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Аутентификация
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Проверка прав
  if (user.role !== 'admin' && user.id !== (await params).id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Бизнес-логика
  const userData = await prisma.user.findUnique({
    where: { id: (await params).id },
    select: { id: true, email: true, fullName: true }
  });

  // 4. Ответ
  return NextResponse.json(userData);
}
```

### Authentication Flow

```
1. Пользователь входит через POST /api/auth/login
2. Сервер генерирует JWT токен
3. Токен сохраняется в httpOnly cookie
4. Каждый запрос включает токен в Authorization header
5. API проверяет токен через authenticate()
6. User данные добавляются к request
```

## 🌐 i18n (Интернационализация)

Проект использует `next-intl` для поддержки нескольких языков.

### Добавление нового языка

1. Создать файл переводов: `src/messages/fr.json`
2. Добавить язык в конфиг в `next.config.ts`
3. Использовать `useTranslations` хук:

```typescript
import { useTranslations } from 'next-intl';

export default function Component() {
  const t = useTranslations();
  return <h1>{t('common.welcome')}</h1>;
}
```

### Извлечение строк в locale файлы

```typescript
// ❌ Плохо - хардкод строки
<h1>Добро пожаловать</h1>

// ✅ Хорошо - i18n
<h1>{t('common.welcome')}</h1>
```

## 🎨 UI Components

Проект использует **shadcn/ui** для UI компонентов.

### Добавление нового компонента

```bash
# Установить компонент через shadcn
npx shadcn@latest add button
```

### Создание кастомного компонента

```typescript
// src/components/security-trainer/CustomComponent.tsx
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CustomComponentProps {
  title: string;
  onClick?: () => void;
  className?: string;
}

export function CustomComponent({ title, onClick, className }: CustomComponentProps) {
  return (
    <div className={cn('p-4 border rounded', className)}>
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <Button onClick={onClick}>Action</Button>
    </div>
  );
}
```

## 🔐 Безопасность

### CSRF защита

Все POST/PUT/DELETE запросы должны включать CSRF токен:

```typescript
// Клиентская сторона
import { getCsrfHeaders } from '@/lib/csrf-client';

const response = await fetch('/api/assignments', {
  method: 'POST',
  headers: await getCsrfHeaders(),
  body: JSON.stringify(data)
});
```

### Rate Limiting

Критичные endpoints имеют rate limiting:

```typescript
// Пример: 5 запросов за 10 минут
const limit = {
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many requests, please try again later'
};
```

### Валидация данных

Используйте Zod для валидации:

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  fullName: z.string().min(2)
});

// В API route
const validated = createUserSchema.safeParse(await request.json());
if (!validated.success) {
  return NextResponse.json({ error: validated.error.errors }, { status: 400 });
}
```

## 📊 Работа с базой данных

### Prisma ORM

```typescript
import { prisma } from '@/lib/db';

// Create
const user = await prisma.user.create({
  data: { email: 'test@example.com', password: 'hashed' }
});

// Read
const users = await prisma.user.findMany({
  where: { role: 'student' },
  include: { progress: true }
});

// Update
await prisma.user.update({
  where: { id: userId },
  data: { fullName: 'New Name' }
});

// Delete
await prisma.user.delete({ where: { id: userId } });
```

### Миграции

```bash
# Создать новую миграцию
npx prisma migrate dev --name add_user_preferences

# Применить миграции
npm run db:migrate

# Сбросить БД (ОПАСНО!)
npm run db:reset
```

## 🚀 Deployment

### Vercel

1. Подключить репозиторий к Vercel
2. Добавить environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `SMTP_*` (для email)
3. Deploy автоматически при push в main

### Docker

```bash
# Build
docker build -t cybersec-lab .

# Run
docker-compose up -d
```

## 🤝 Вклад в проект

1. Fork репозиторий
2. Создать feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Открыть Pull Request

### Guidelines

- Написать тесты для новых функций
- Обновить документацию при необходимости
- Следовать существующему стилю кода
- Make clear, descriptive commits

## 🐛 Отладка

### Включить debug logging

```bash
# В .env
DEBUG=true
LOG_LEVEL=debug
```

### Chrome DevTools

```bash
# Запустить с debugger
NODE_OPTIONS='--inspect' npm run dev
```

## 📚 Дополнительные ресурсы

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zod Documentation](https://zod.dev/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

## 🆘 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверить существующие issues
2. Создать новый issue с подробным описанием
3. Добавить logs и stack trace при ошибках

---

*Последнее обновление: 2026-06-08*
*Версия документа: 1.0.0*
