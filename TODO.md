# CyberSec Lab — План работ

Полный пошаговый план дальнейшего развития проекта. Сгруппирован по фазам, каждая задача — конкретный атомарный шаг с указанием файлов.

---

## Выполнено ранее (сводка)

| # | Улучшение | Статус |
|---|-----------|--------|
| -2 | TeacherPanel data loss, deadline auth, timer fix, XP grinding | ✅ |
| -1 | Account deletion security, LTI token fix, quiz rate limiting | ✅ |
| 0 | Critical bug fixes (assignment submit, teacher panel, password) | ✅ |
| 1 | Security fixes (rate limiting, password validation, CSV injection) | ✅ |
| 2 | OTP email / восстановление пароля | ✅ |
| 3 | CSRF защита + security headers | ✅ |
| 4 | Конструктор заданий для преподавателей | ✅ |
| 7 | Миграция на PostgreSQL | ✅ |
| 8 | PWA и mobile experience | ✅ |
| 9 | API документация (Swagger/OpenAPI 3.0) | ✅ |
| 10 | Система уровней и RPG-геймификация | ✅ |

Текущее состояние (2026-07-06):
- **248 тестов** (240 unit + 8 E2E), покрытие ~30% lines / 25% functions
- **i18n**: next-intl настроен, 3 локали (en/ru/zh). **Все JSON-словари полностью переведены** (landing, auth, common, nav, dashboard, quiz, errors, profile, teacher, admin, labs).
- **Осталось**: заменить хардкод-строки в ~100 компонентах на `useTranslations()`, перенести auth-страницы и dashboard-app в `[locale]/`.
- **Маршрутизация**: landing в `[locale]/`, все остальные страницы (login, register, dashboard-app, offline) — **вне** `[locale]`, без доступа к `NextIntlClientProvider`.

---

# Выполнено

## Фаза 1.1 — Исправить RU-переводы landing page ✅
- **ru.json** — все значения переведены на русский (landing, auth, common, nav, dashboard, quiz, errors, profile, teacher, admin, labs)
- **zh.json** — все значения переведены на китайский
- **en.json** — эталонный словарь
- 291 файл отформатирован Prettier, 0 ESLint warnings, 240/240 тестов green

---

# Фаза 1: i18n — локализация всей платформы (RU ↔ EN)

## 1.2 Перенести auth-страницы в [locale] ✅
> **Статус**: Страницы уже существуют в `[locale]/login`, `[locale]/register`, `[locale]/recovery`.
> Нужно заменить хардкод-строки на `useTranslations('auth')`.

### 1.2.1 Проверить `[locale]/login/page.tsx`
- Убедиться, что используется `useTranslations('auth')` вместо хардкода
- Заменить все строки на `t('login.title')`, `t('login.email')` и т.д.

### 1.2.2 Проверить `[locale]/register/page.tsx`
- Аналогично заменить хардкод на `useTranslations('auth.register')`

### 1.2.3 Проверить `[locale]/recovery/page.tsx`
- Аналогично заменить хардкод на `useTranslations('auth.recovery')`

### 1.2.4 Обновить все ссылки в коде
- Найти все `href="/login"`, `href="/register"`, `router.push('/login')` и т.д.
- Заменить на локально-зависимые: `href="/ru/login"` или использовать `<Link href="/login">` с `next-intl/link`
- **Ключевые файлы для поиска:**
  - `src/components/landing/LandingHeader.tsx` (кнопки Войти/Регистрация)
  - `src/components/landing/CTASection.tsx`
  - `src/components/landing/HeroSection.tsx`
  - `src/components/security-trainer/AuthPages.tsx` (форма логина/регистрации)
  - `src/components/security-trainer/Sidebar.tsx` (кнопка выхода → логин)
  - `src/lib/auth-store.ts` (logout redirect)
  - `src/middleware.ts` (защита маршрутов)

### 1.2.5 Обновить middleware для защиты новых путей
**Файл:** `src/middleware.ts`
- Добавить проверку auth-токена для `/[locale]/login`, `/[locale]/register` (редирект авторизованных на dashboard)
- Обновить matcher если нужно

---

## 1.3 Локализовать компоненты security-trainer ✅ (частично)
> **Статус**: Sidebar.tsx и Dashboard.tsx локализованы. Осталось ~98 компонентов.

### 1.3.1 Sidebar (`src/components/security-trainer/Sidebar.tsx`) ✅
- Все пункты меню локализованы через `t(navKeyMap[item.id])`
- Ключи: `nav.*`

### 1.3.2 Dashboard (`src/components/security-trainer/Dashboard.tsx`) ✅
- Заменены хардкод-строки на `useTranslations('dashboard')`
- Модули: `t('modules.{id}.title')`, `t('modules.{id}.description')`, `t('modules.{id}.difficulty')`
- Ключи: `dashboard.*`

### 1.3.3 AuthPages (`src/components/security-trainer/AuthPages.tsx`) ✅
- Все строки используют `useTranslations('auth')`
- Ключи: `auth.*`

### 1.3.4 QuizSystem (`src/components/security-trainer/QuizSystem.tsx`) ✅
- Категории квизов: `t('categories.{name}')`
- Ключи: `quiz.*`

### 1.3.5 ProfilePage (`src/components/security-trainer/ProfilePage.tsx`) ✅
- Активность модулей: `t('modules.{id}.title')`
- Ключи: `profile.*`

### 1.3.6 TeacherPanel (`src/components/security-trainer/TeacherPanel.tsx`) ✅
- Модули: `t('modules.{id}.title')`
- Категории: `t('categories.{id}')`
- At-risk: `t('atRisk.*')`
- Ключи: `teacher.*`

### 1.3.7 AdminPanel (`src/components/security-trainer/AdminPanel.tsx`) ✅
- Ключ `users.impersonationStarted` добавлен
- Ключи: `admin.*`

---

## Итоги сессии (2026-07-06)

### Выполнено
1. **Sidebar.tsx** — все пункты меню через `t(navKeyMap[item.id])`
2. **Dashboard.tsx** — модули через `t('modules.{id}.title/description/difficulty')`
3. **AuthPages.tsx** — все строки через `useTranslations('auth')`
4. **QuizSystem.tsx** — категории квизов через `t('categories.{name}')`
5. **ProfilePage.tsx** — активность модулей через `t('modules.{id}.title')`
6. **TeacherPanel.tsx** — модули, категории, at-risk через `t()`
7. **AdminPanel.tsx** — ключ `users.impersonationStarted` добавлен
8. **Словари** — добавлены ключи `dashboard.modules.*`, `quiz.categories.*`, `register.contact*`, `users.impersonationStarted`

### Статус
- **0 ESLint warnings, 0 TypeScript errors**
- **240/240 тестов green**
- **7 компонентов локализовано** (Sidebar, Dashboard, AuthPages, QuizSystem, ProfilePage, TeacherPanel, AdminPanel)
- **~93 компонента осталось** (labs, analytics, error pages, etc.)

### 1.4.4 QuizSystem (`src/components/security-trainer/QuizSystem.tsx`)
- ~60 строк: интерфейс квиза, результаты, категории
- Ключи: `quiz.*`

### 1.4.5 ProfilePage (`src/components/security-trainer/ProfilePage.tsx`)
- ~50 строк: профиль, настройки, смена пароля
- Ключи: `profile.*`

### 1.4.6 TeacherPanel (`src/components/security-trainer/TeacherPanel.tsx`)
- ~80 строк: вкладки, таблицы, фильтры, метрики
- Ключи: `teacher.*`

### 1.4.7 AdminPanel (`src/components/security-trainer/AdminPanel.tsx`)
- ~80 строк: управление пользователями, экспорт, модерация
- Ключи: `admin.*`

### 1.4.8 Labs (SQLInjectionLab, XSSLab, CSRFLab, IDORLab, SSRFLab, etc.) — 10 компонентов
- Каждый по ~40-100 строк
- Ключи: `labs.{moduleName}.*`

### 1.4.9 Остальные компоненты (~80 файлов)
- AchievementAnalytics, AchievementsGlossary, ActivityCalendar, etc.
- AssignmentBuilder, StudentAssignments
- Leaderboard
- SecurityCheatSheets
- PasswordStrengthChecker
- CareerPaths
- Все аналитические компоненты (~30 файлов)
- ErrorBoundary
- NotificationBell, OTPModal, OnboardingTour, etc.

### 1.4.10 Типовой паттерн замены (для каждого компонента):
```tsx
// Было:
<h1>Панель преподавателя</h1>
<p>Загрузка данных студентов...</p>

// Стало:
import { useTranslations } from 'next-intl';
const t = useTranslations('teacher');
<h1>{t('title')}</h1>
<p>{t('loading')}</p>
```

---

## 1.5 Перенести dashboard-app в [locale]

> **Проблема**: `/dashboard-app` — SPA-оболочка всего приложения, не под `[locale]`, нет доступа к `NextIntlClientProvider`.

### 1.5.1 Создать `src/app/[locale]/app/page.tsx`
- Импортировать логику из `src/app/dashboard-app/page.tsx`
- Убедиться что `NextIntlClientProvider` работает (layout уже оборачивает)
- Обновить точку входа для всех lazy-loaded компонентов

### 1.5.2 Создать `src/app/[locale]/app/layout.tsx` (при необходимости)
- Если нужна отдельная разметка для dashboard

### 1.5.3 Обновить redirect после логина
**Файлы:** `src/components/security-trainer/AuthPages.tsx`, `src/lib/auth-store.ts`
- `router.push('/dashboard-app')` → `router.push('/ru/app')` (locale-aware)

### 1.5.4 Обновить Sidebar навигацию
**Файл:** `src/components/security-trainer/Sidebar.tsx`
- `setCurrentPage('dashboard')` — не требует изменений (zustand state, не URL)

### 1.5.5 Удалить старый `src/app/dashboard-app/`

---

## 1.6 Локализовать error / not-found / offline страницы

### 1.6.1 `src/app/[locale]/not-found.tsx`
- Создать locale-aware версию
- Заменить хардкод на `useTranslations('errors')`

### 1.6.2 `src/app/[locale]/error.tsx`
- Аналогично

### 1.6.3 `src/app/[locale]/offline/page.tsx`
- Переместить из `src/app/offline/page.tsx`
- Заменить хардкод на `useTranslations('errors')`

### 1.6.4 Удалить старые `src/app/error.tsx`, `src/app/not-found.tsx`, `src/app/offline/`

---

## 1.7 Динамический `lang` атрибут в `<html>`

**Файл:** `src/app/[locale]/layout.tsx` или через middleware
- Текущий `src/app/layout.tsx` имеет хардкод `<html lang="ru">`
- Нужно установить `lang` динамически в зависимости от locale
- Вариант: middleware устанавливает `lang`, или [locale]/layout передаёт в HTML

---

# Фаза 2: Тестовое покрытие — цель 80%+

## 2.0 Базовая подготовка

### 2.0.1 Запустить покрытие и сохранить baseline
```bash
npm run test:coverage
```
- Сохранить `coverage/lcov-report/index.html` как baseline
- Зафиксировать текущие проценты (≈30% lines / 25% functions / 20% branches)

### 2.0.2 Настроить `@prisma/client` mock для интеграционных тестов
- Создать `tests/__mocks__/prisma.ts` — singleton с `vi.mock('@prisma/client')`
- Helper-функции для создания mock-пользователей, прогресса, квизов
- **Файлы:** `tests/__mocks__/prisma.ts`, `tests/setup.ts` (дополнить)

---

## 2.1 Интеграционные тесты API endpoints (mock Prisma)

> Каждый тестовый файл покрывает одну группу endpoints. Паттерн: arrange (mock Prisma returns), act (call handler), assert (response + Prisma calls).

### 2.1.1 `tests/api-auth.test.ts` — Auth endpoints
- `POST /api/auth/register` — успех, дубликат email, слабый пароль, невалидные данные
- `POST /api/auth/login` — успех, неверный пароль, несуществующий пользователь, заблокированный
- `GET /api/auth/profile` — с токеном, без токена, истёкший токен
- `PUT /api/auth/password` — успех, старый пароль неверный, слабый новый пароль
- `DELETE /api/auth/delete` — успех (с password), без password (ошибка), 3-попытки rate limit
- `POST /api/auth/recovery` — успех, email не найден, rate limit
- `POST /api/auth/recovery/reset` — успех, неверный OTP, истёкший OTP
- Цель: ~25 тестов

### 2.1.2 `tests/api-quiz.test.ts` — Quiz endpoints
- `GET /api/quiz` — получить вопросы (с категорией/без)
- `POST /api/quiz` — отправить ответы (успех, fail), rate limit (10 за 5 мин)
- `GET /api/quiz/results` — история результатов
- Цель: ~15 тестов

### 2.1.3 `tests/api-progress.test.ts` — Progress endpoints
- `GET /api/progress` — свой прогресс
- `GET /api/progress/[userId]` — чужой прогресс (teacher) + forbidden (student)
- `POST /api/progress` — сохранить прогресс модуля
- Цель: ~12 тестов

### 2.1.4 `tests/api-assignments.test.ts` — Assignment endpoints
- `POST /api/assignments` — создать задание (teacher) + forbidden (student)
- `GET /api/assignments` — список заданий
- `GET /api/assignments/[id]` — одно задание
- `PUT /api/assignments/[id]` — обновить
- `DELETE /api/assignments/[id]` — удалить
- `POST /api/assignments/[id]/submit` — отправить решение (student), лимит попыток
- `POST /api/assignments/[id]/submissions/[subId]/grade` — оценить (teacher)
- Цель: ~18 тестов

### 2.1.5 `tests/api-gamification.test.ts` — Gamification endpoints
- `GET /api/gamification/level` — уровень пользователя
- `POST /api/gamification/xp` — начислить XP (rate limit 20/час)
- `GET /api/gamification/leaderboard` — таблица лидеров (с фильтром по группе, без)
- Цель: ~10 тестов

### 2.1.6 `tests/api-admin.test.ts` — Admin endpoints
- `GET /api/admin/users` — список пользователей (admin) + forbidden (student)
- `PUT /api/admin/users/[id]/role` — сменить роль
- `PUT /api/admin/users/[id]/block` — заблокировать/разблокировать
- `POST /api/admin/users/export` — экспорт CSV
- Цель: ~12 тестов

### 2.1.7 `tests/api-deadlines.test.ts` — Deadline endpoints
- `GET /api/deadlines` — свои дедлайны (student)
- `POST /api/deadlines` — создать дедлайн (teacher)
- `GET /api/deadlines/teacher/reminders` — напоминания (teacher)
- Цель: ~8 тестов

---

## 2.2 Компонентные тесты (React Testing Library)

### 2.2.1 `tests/components/QuizSystem.test.tsx`
- Рендер вопросов разных категорий
- Выбор ответа, переход к следующему
- Сабмит, отображение результата (passed/failed/perfect)
- Retry
- Цель: ~12 тестов

### 2.2.2 `tests/components/AuthPages.test.tsx`
- Форма логина: заполнение полей, валидация email, вызов submit
- Форма регистрации: проверка совпадения паролей, валидация телефона
- Сообщения об ошибках от сервера
- Цель: ~10 тестов

### 2.2.3 `tests/components/Sidebar.test.tsx`
- Рендер всех пунктов меню для student
- Скрытые пункты для teacher/admin
- Активный пункт выделен
- Переключение страницы при клике
- Цель: ~8 тестов

### 2.2.4 `tests/components/Dashboard.test.tsx`
- Загрузка данных (loading state)
- Отображение статистики, карточек
- Обработка ошибки API
- Цель: ~6 тестов

### 2.2.5 `tests/components/ProfilePage.test.tsx`
- Отображение данных профиля
- Форма редактирования
- Смена пароля (валидация)
- Цель: ~8 тестов

### 2.2.6 `tests/components/TeacherPanel.test.tsx`
- Вкладки (Прогресс, Журнал, Аналитика, Дедлайны, Группы)
- Загрузка списка студентов
- Фильтрация по группе
- Цель: ~10 тестов

### 2.2.7 `tests/components/AdminPanel.test.tsx`
- Список пользователей
- Блокировка/разблокировка пользователя
- Смена роли
- Экспорт
- Цель: ~8 тестов

### 2.2.8 `tests/components/NotificationBell.test.tsx`
- Отображение количества непрочитанных
- Открытие/закрытие списка
- Mark as read
- Цель: ~5 тестов

---

## 2.3 Расширение E2E тестов (Playwright)

### 2.3.1 `e2e/registration.spec.ts` — Registration flow
- Успешная регистрация нового пользователя
- Валидация полей (email, пароль, телефон)
- Регистрация с уже существующим email
- Цель: ~4 теста

### 2.3.2 `e2e/quiz-flow.spec.ts` — Quiz flow
- Выбор модуля → открытие квиза
- Прохождение всех вопросов
- Результат passed / failed / perfect
- Retry quiz
- Цель: ~5 тестов

### 2.3.3 `e2e/assignments.spec.ts` — Assignment workflow
- Студент видит список заданий
- Отправка решения
- Преподаватель оценивает
- Студент видит оценку
- Цель: ~5 тестов

### 2.3.4 `e2e/admin-actions.spec.ts` — Admin actions
- Просмотр списка пользователей
- Блокировка пользователя
- Смена роли student → teacher
- Экспорт пользователей
- Цель: ~5 тестов

### 2.3.5 `e2e/i18n-switch.spec.ts` — Language switching
- Переключение RU → EN → ZH на landing
- Переключение на dashboard (после реализации i18n)
- Сохранение выбранного языка между страницами
- Цель: ~4 теста

### 2.3.6 `e2e/password-recovery.spec.ts` — Password recovery
- Запрос OTP
- Ввод неверного OTP
- Успешный сброс пароля
- Rate limit превышение
- Цель: ~4 теста

---

## 2.4 Повышение порогов покрытия

### 2.4.1 Поднять thresholds в `vitest.config.ts`
```ts
// Было:   lines: 30, functions: 25, branches: 20, statements: 30
// Стало:  lines: 50, functions: 45, branches: 40, statements: 50
```
- После интеграционных тестов → 50%
- После компонентных тестов → 65%
- После E2E расширения → 80%

### 2.4.2 Добавить `npm run test:all` скрипт
- Последовательно: `vitest run --coverage && playwright test`

---

# Фаза 3: Качество и производительность

## 3.1 ESLint и TypeScript strictness

### 3.1.1 Проверить текущий линтинг
```bash
npm run lint
```
- Исправить все ошибки и предупреждения

### 3.1.2 Рассмотреть включение `strict: true` в tsconfig
- Оценить количество ошибок
- Исправить по файлам если разумно

---

## 3.2 Доступность (a11y)

### 3.2.1 Аудит ARIA-атрибутов
- `Sidebar.tsx`: роли, `aria-label`, `aria-current`
- `QuizSystem.tsx`: `aria-live` для результатов
- Модальные окна: focus trap, `aria-modal`
- Toast-уведомления: `aria-live="polite"`

### 3.2.2 Проверить контраст и keyboard navigation
- Tab-индексы на интерактивных элементах
- Skip-to-content ссылка (уже есть в `layout.tsx`)

---

## 3.3 Производительность

### 3.3.1 Динамические импорты
- Проверить что все lab-компоненты lazy-loaded (уже сделано в `dashboard-app/page.tsx`)
- Применить `next/dynamic` для тяжёлых analytics-компонентов

### 3.3.2 Оптимизация изображений
- `public/logo.svg`, `public/icons/*` — использовать `next/image`
- Lazy loading для изображений вне viewport

### 3.3.3 Bundle size анализ
```bash
npx next build --debug && npx @next/bundle-analyzer
```
- Найти и уменьшить крупные чанки

---

## 3.4 Документация и onboarding

### 3.4.1 Актуализировать `AUTO-START.md`
- Проверить все команды на актуальность

### 3.4.2 Обновить README
- Добавить секцию про i18n (когда будет готово)
- Актуализировать скриншоты

---

# Сводная таблица

| Фаза | Секция | Задач | Приоритет | Оценка времени |
|------|--------|-------|-----------|----------------|
| **1.1** | Исправить RU-переводы landing | 3 | 🔴 Критический | 1 день |
| **1.2** | Перенести auth-страницы в [locale] | 6 | 🔴 Критический | 2–3 дня |
| **1.3** | Расширить JSON-словари | 7 | 🔴 Критический | 3–5 дней |
| **1.4** | Локализовать компоненты (~100 файлов) | 9 групп | 🔴 Критический | 10–20 дней |
| **1.5** | Перенести dashboard-app в [locale] | 5 | 🔴 Критический | 1–2 дня |
| **1.6** | Локализовать error/offline страницы | 4 | 🟡 Высокий | 1 день |
| **1.7** | Динамический lang атрибут | 1 | 🟢 Средний | 0.5 дня |
| **2.1** | Интеграционные тесты API | 7 файлов | 🟡 Высокий | 5–7 дней |
| **2.2** | Компонентные тесты | 8 файлов | 🟡 Высокий | 5–7 дней |
| **2.3** | Расширение E2E тестов | 6 файлов | 🟡 Высокий | 4–6 дней |
| **2.4** | Поднять пороги покрытия | 2 | 🟢 Средний | 0.5 дня |
| **3.1** | ESLint / TypeScript | 2 | 🟢 Средний | 1–2 дня |
| **3.2** | Доступность (a11y) | 2 | 🟢 Средний | 2–3 дня |
| **3.3** | Производительность | 3 | 🟢 Средний | 2–3 дня |
| **3.4** | Документация | 2 | 🟢 Низкий | 1 день |

**Общая оценка:** ~40–70 рабочих дней (8–14 недель) на всю Фазу 1–3.

**Рекомендуемый порядок:**
1. Фаза 1.1 → 1.2 → 1.3 (i18n инфраструктура, 1 неделя)
2. Фаза 1.4 параллельно с Фазой 2.1 (основная работа, 3–4 недели)
3. Фаза 1.5 → 1.6 → 1.7 (финализация i18n, 3 дня)
4. Фаза 2.2 → 2.3 → 2.4 (тесты, 2–3 недели)
5. Фаза 3 (качество, 1–2 недели)

---

*Обновлено: 2026-06-03*
*Версия проекта: 0.2.0*
