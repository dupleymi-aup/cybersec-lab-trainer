# CyberSec Lab — Топ-10 улучшений проекта (v0.3.0)

Приоритизированный список самых impactful улучшений, которые дадут максимальную отдачу проекту.

*Последнее обновление: 2026-06-09*
*Текущий статус: 315 тестов, 54.73% coverage, TypeScript — 0 ошибок, React Query интегрирован*

---

## -2. ~~🐛 TeacherPanel data loss, deadline auth, timer fix, XP grinding~~ ✅ ВЫПОЛНЕНО

**Статус:** Реализовано 2026-05-24

**Что сделано:**
- **TeacherPanel type mismatch — lab progress silently dropped**: `getStudentProgress()` читал `p.sqlLevels.completed`, `p.xssLevels.completed`, `p.csrfSteps.completed` — но API возвращает эти поля как массивы, а не объекты с `.completed`. Все lab-данные терялись. Заменено на `Array.isArray(p.sqlLevels) ? p.sqlLevels : []` (и аналогично для xssLevels, csrfSteps)
- **TeacherPanel deadline fetch без auth headers**: `fetch('/api/deadlines')` и `fetch('/api/deadlines/teacher/reminders')` не отправляли Bearer токен — преподаватель получал 401, UI дедлайнов молча пустой. Обёрнуто в async IIFE с `getAuthHeaders()`
- **StudentAssignments timer interval recreation**: `useEffect` таймера имел `timer` в dependency array `[timerRunning, timer]` — interval пересоздавался каждую секунду, приводя к toast-спаму и некорректному отсчёту. Убран `timer` из зависимостей: `}, [timerRunning])`
- **XP endpoint rate limiting**: `POST /api/gamification/xp` без лимита — бот мог бесконечно фармить XP. Добавлено: 20 запросов за час на пользователя через `checkRateLimit()`
- Тесты: bugfixes-round5.test.ts (6 тестов)
- Всего тестов: 201 (было 195)

---

## -1. ~~🔐 Account deletion security, LTI token fix, quiz rate limiting~~ ✅ ВЫПОЛНЕНО

**Статус:** Реализовано 2026-05-24

**Что сделано:**
- **Account deletion без password confirmation**: `DELETE /api/auth/delete` удалял аккаунт только по токену — stolen token = удаление аккаунта. Добавлена обязательная проверка `currentPassword` через `verifyPassword()`
- **Rate limiting на удаление аккаунта**: 3 попытки за час на пользователя + 5 на IP — предотвращает массовое удаление
- **LTI token leakage**: JWT токен был в URL query (`?lti_token=...`) — попадал в логи, историю браузера, referer. Токен теперь в теле ответа, redirect на `/lti-callback` без токена
- **LTI error message leakage**: внутренние ошибки (stack traces, crypto errors) возвращались клиенту. Заменено на generic сообщение
- **Quiz submission rate limiting**: `POST /api/quiz` без лимита — возможен спам/DoS. Добавлено: 10 попыток за 5 минут
- Тесты: security-deletion.test.ts (9 тестов)
- Всего тестов: 195 (было 186)

---

## 0. ~~🐛 Critical bug fixes: assignment submit, teacher panel, password change~~ ✅ ВЫПОЛНЕНО

**Статус:** Реализовано 2026-05-24

**Что сделано:**
- **Assignment submit без auth headers**: `StudentAssignments.tsx` не отправлял Bearer токен — студенты получали 401 при отправке заданий. Добавлен `getAuthHeaders()` для всех fetch запросов
- **TeacherPanel читал прогресс из localStorage**: преподаватель видел только данные из своего браузера, а не студентов. Заменено на API вызов `/api/progress/[userId]` с загрузкой всех данных в state
- **Password validation на смену пароля**: `PUT /api/auth/password` принимал слабые пароли (только min 8 символов). Добавлена `validatePassword()` с требованиями к верхним/строчным, цифрам, спецсимволам
- Тесты: security-fixes.test.ts (13 тестов)
- Всего тестов: 186 (было 173)

---

## 1. ~~🔒 Security fixes: rate limiting, password validation, CSV injection~~ ✅ ВЫПОЛНЕНО

**Статус:** Реализовано 2026-05-24

**Что сделано:**
- Rate limiting на `POST /api/auth/recovery`: 3 запроса за 10 минут на email/phone + 10 на IP
- Password validation на `POST /api/auth/recovery/reset`: новый пароль проверяется через `validatePassword()` (минимум 8 символов, верхние/строчные, цифры, спецсимволы)
- CSV injection prevention в `POST /api/admin/users/export`: поля с `=`, `+`, `-`, `@`, `\t`, `\r` оборачиваются в кавычки
- Тесты: recovery-validation.test.ts (8 тестов), csv-export.test.ts (10 тестов)
- Всего тестов: 173 (было 155)

---

## 2. ~~📧 Реализовать отправку OTP email и безопасное восстановление пароля~~ ✅ ВЫПОЛНЕНО

**Статус:** Реализовано (OTP email отправка через nodemailer, HTML письма с кодом, rate limiting, expiry)

**Что сделано:**
- `sendOTPRecoveryEmail()` в `src/lib/email.ts` — красивые HTML письма с OTP кодом
- OTP сохраняется в in-memory store с expiry (10 минут)
- Rate limiting на verification (5 попыток за 10 минут)
- Анти-enumeration: одинаковый ответ даже если пользователь не найден
- Dev mode: OTP выводится в консоль если SMTP не настроен

---

## 3. ~~🛡️ Добавить CSRF защиту и security headers~~ ✅ ВЫПОЛНЕНО

**Статус:** Реализовано 2026-05-23

**Что сделано:**
- Security headers в `next.config.ts`: CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS, Permissions-Policy
- CSRF middleware в `src/middleware.ts`: double-submit cookie pattern
- Публичные endpoints (login, register, recovery, health, docs, lti) исключены из CSRF проверки
- Клиентская утилита `src/lib/csrf-client.ts`: getCsrfToken(), getCsrfHeaders(), csrfFetch()
- SameSite=strict для CSRF cookie, secure flag в production
- Тесты: csrf-middleware.test.ts (8 тестов), auth-server.test.ts (4 теста)

**Бонусные исправления:**
- Исправлен баг в `verifyToken()`: теперь корректно возвращает group и fullName из JWT payload
- Добавлены 155 passing unit тестов (было 146)

---

## 4. ~~📊 Конструктор заданий для преподавателей~~ ✅ ВЫПОЛНЕНО

**Статус:** Полностью реализовано 2026-05-22 (API + UI)

**Что сделано (API слой):**
- Prisma модели: Assignment + AssignmentSubmission с relations к User
- CRUD API: GET/POST /api/assignments, GET/PUT/DELETE /api/assignments/[id]
- Submission API: POST /api/assignments/[id]/submit с лимитами попыток
- Grading API: POST /api/assignments/[id]/submissions/[submissionId]/grade
- Список submissions: GET /api/assignments/[id]/submissions с фильтрами
- Zod валидация: createAssignmentSchema, submitAssignmentSchema, gradeSubmissionSchema
- Role-based access: teacher создаёт/оценивает, student отправляет
- Функции: auto-grade flag, time limits, max attempts, group targeting, deadlines

**Что сделано (UI слой):**
- AssignmentBuilder компонент: форма создания/редактирования с полями title, type, module, description, content, maxScore, passScore, timeLimit, attempts, dueAt, group, autoGrade, published
- Список заданий с фильтрами (Все/Опубликованные/Черновики)
- Детальный просмотр задания с метриками (баллы, попытки, submission'ы, дедлайн)
- One-click publish/unpublish toggle
- Delete с подтверждением
- Интеграция в TeacherPanel как отдельная вкладка "Задания"
- StudentAssignments страница: список доступных заданий, форма submission с таймером, отслеживание попыток, история результатов, прогресс-бар
- Sidebar: добавлен пункт "Задания" (ClipboardList icon)
- PageType: добавлен 'assignments' в store

**Бонусные исправления:**
- TokenPayload расширен: добавлены group, fullName
- authenticate() возвращает group/fullName из JWT
- generateToken() принимает options { rememberMe, group, fullName }
- Исправлены TS2339 ошибки в assignments и gamification API routes

---

## 11. ✅ 📊 Настроить coverage и увеличить покрытие тестами

**Статус:** Реализовано 2026-06-08

**Что сделано:**
- Установлен `@vitest/coverage-v8` для coverage reports
- `npm run test:coverage` теперь работает корректно
- Текущие метрики: 36.9% statements, 35.56% branches, 47.76% functions, 36.37% lines
- Превышены минимальные пороги (30% lines, 25% functions, 20% branches)
- Высокое покрытие ключевых модулей: `xp-utils.ts` (100%), `db.ts` (100%), `auth-utils.ts` (90.9%), `achievement-utils.ts` (88%)

**Далее:**
- Увеличить покрытие до 50%+ за счёт интеграционных тестов
- Добавить тесты для API middleware и export-utils
- Покрыть lti-utils тестами (сейчас 24.67%)

---

## 12. 🚀 Оптимизация производительности и кэширование

**Проблема:** Аналитические endpoints выполняют сложные агрегации с множеством JOIN и GROUP BY, что может быть медленно на больших данных.

**Что сделать:**
- Добавить Redis для кэширования результатов аналитики
- Реализовать incremental materialized views для часто запрашиваемых метрик
- Оптимизировать Prisma запросы (select только нужные поля, avoid N+1)
- Добавить pagination для больших наборов данных
- Implement query timeouts и cancellation

**Влияние:** Улучшение времени ответа API на 50-80%, снижение нагрузки на БД.

**Сложность:** 🟡 Средняя | **Время:** 2-3 недели

---

## 13. ✅ 🧩 Добавить React Query / TanStack Query

**Статус:** Реализовано 2026-06-09

**Что сделано:**
- Установлен `@tanstack/react-query` + `@tanstack/react-query-devtools`
- Создан `src/lib/query-client.ts` — централизованный QueryClient с defaults (staleTime 30s, retry 1, refetchOnWindowFocus)
- Создан `src/app/providers.tsx` — общий провайдер (NextThemesProvider + QueryClientProvider + ReactQueryDevtools)
- Root layout (`layout.tsx`) переведён на новый `Providers`
- Создан `src/hooks/use-api.ts` — универсальные хуки:
  - `useApiQuery<T>(queryKey, options)` — GET с auth headers, AbortController, timeout
  - `useApiMutation<T>(url, method, options)` — POST/PUT/PATCH/DELETE с CSRF + auth headers
  - `useApiInvalidate()` — хелпер для инвалидации кэша
  - `createApiQueryKey()` — типизированное создание ключей
- Создан `src/hooks/use-analytics-query.ts` — 25 типизированных хуков для analytics endpoints:
  - `useProgressTrends`, `useAdminSummary`, `useAtRiskStudents`, `useComprehensiveSummary` и т.д.
- Все старые хуки (`useAnalyticsFetch`, `useAnalyticsFetcher`, `useAnalyticsMutation`) помечены `@deprecated` с указанием на новые API
- Удалён устаревший `tsc-errors.txt` (0 ошибок)
- Все 315 тестов проходят, TypeScript — 0 ошибок, линт — 0 ошибок

**Влияние:** Уменьшение boilerplate кода, автоматический background refetch, retry, кэширование, оптимистичные апдейты, query invalidation.

**Далее:**
- Мигрировать компоненты с `useAnalyticsFetch` → `useAnalyticsQuery` / `useApiQuery`
- Добавить оптимистичные апдейты для mutations
- Подключить `@tanstack/react-query-devtools` persistence

---

## 14. 🎨 Улучшить UX: Loading states, Error boundaries, Toast notifications

**Статус:** В процессе (2026-06-09)

**Что сделано:**
- Создан `src/components/ui/skeleton.tsx` — компонент skeleton loading
- **Dashboard.tsx**: Мигрирован на React Query:
  - 3 ручных fetch заменены на `useApiQuery` / `useAdminSummary`
  - Добавлены skeleton placeholders для announcements, deadlines, teacher stats
  - Добавлен toast.error при ошибке загрузки объявлений
- **Sidebar.tsx**: Мигрирован на React Query:
  - Ручной deadline fetch заменён на `useApiQuery` с кэшированием
- **Toaster**: Перенесён в корневой `providers.tsx` — работает на всех страницах (login, register, recovery)
- Старые хуки (`useAnalyticsFetch`, `useAnalyticsFetcher`, `useAnalyticsMutation`) помечены `@deprecated`

**Что осталось:**
- notes/apiActions/ctf/study — toast при ошибках (сейчас только console.error)
- TeacherPanel — skeleton + toast для deadline CRUD
- ProfilePage — loading state на кнопках
- ErrorBoundary — обернуть ключевые компоненты индивидуально
- BulkActionsBar — loading state на action кнопках

**Влияние:** Улучшение perceived performance, единообразие UX, глобальная обработка ошибок.

**Сложность:** 🟢 Низкая | **Время:** 1 неделя

---

## 15. ✅ 🔄 CI/CD workflows (GitHub Actions)

**Статус:** Реализовано

**Что есть в `.github/workflows/ci.yml`:**
- **Lint & Type Check** — eslint + tsc --noEmit
- **Unit Tests** — vitest с PostgreSQL service, coverage report upload
- **E2E Tests** — Playwright with Chromium
- **Build** — next build с генерацией Prisma Client

**Влияние:** Автоматическое обнаружение regressions при каждом push/PR.

**Далее:**
- Deploy workflow для production (Vercel/Render)
- Auto-approve dependabot PRs
- Matrix strategy для разных node-версий

---

## 16. 📚 Storybook для UI компонентов

**Проблема:** Нет документации UI компонентов, сложно поддерживать дизайн system.

**Что сделать:**
- Установить Storybook
- Создать stories для всех Radix UI компонентов
- Документировать use cases и variants
- Add controls для dynamic props
- Integrate с Chromatic для visual testing

**Влияние:** Упрощение onboarding новых разработчиков, better component reusability.

**Сложность:** 🟡 Средняя | **Время:** 1-2 недели

---

## 17. 🎮 Добавить больше интерактивных labs

**Проблема:** Текущие labs хороши, но можно расширить охват тем.

**Что сделать:**
- Добавить lab для **XXE (XML External Entity)** атак
- Lab для **Insecure Deserialization**
- Lab для **Server-Side Request Forgery (SSRF)** продвинутый уровень
- Lab для **Business Logic Vulnerabilities**
- Interactive **Crypto Challenges** (padding oracle, timing attacks)

**Влияние:** Более полное покрытие OWASP Top 10 и advanced topics.

**Сложность:** 🟡 Средняя | **Время:** 2-3 недели

---

## 18. 🌐 i18n — поддержка английского языка

**Проблема:** Весь UI и контент на русском. Английская документация есть, но платформа недоступна для международной аудитории.

**Что сделать:**
- Интегрировать `next-intl` (уже установлен!)
- Вынести все строки UI в locale-файлы (EN)
- Добавить переключатель языка в sidebar
- Перевести контент модулей и квизов
- Настроить маршрутизацию `/ru/` и `/en/`

**Влияние:** Удвоение потенциальной аудитории. Возможность публикации на GitHub с international reach.

**Сложность:** 🔴 Высокая | **Время:** 3-4 недели

**Прогресс:** `next-intl` уже установлен, нужны переводы

---

## 19. 📱 Улучшить mobile experience (PWA features)

**Проблема:** PWA уже работает, но можно добавить больше native-like features.

**Что сделать:**
- Добавить **background sync** для оффлайн действий
- Implement **push notifications** для deadline reminders
- Добавить **full-screen mode** для labs
- **Share API** для экспорта результатов
- **Clipboard API** для быстрого копирования кода
- **Keyboard shortcuts** для power users

**Влияние:** Better mobile UX, engagement через push notifications.

**Сложность:** 🟡 Средняя | **Время:** 1-2 недели

---

## 📋 Рекомендуемый порядок выполнения

| # | Улучшение | Приоритет | Время | Impact |
|---|-----------|-----------|-------|--------|
| 11 | Coverage setup | ✅ Реализовано | | Quality |
| 12 | Performance optimization & caching | 🟡 Высокий | 2-3 недели | Performance |
| 13 | React Query integration | ✅ Реализовано | | DX + UX |
| 14 | UX improvements (loading, errors) | 🟡 В процессе | 1 неделя | UX |
| 15 | CI/CD workflows | ✅ Реализовано | | Quality |
| 16 | Storybook | 🟢 Средний | 1-2 недели | DX |
| 17 | Больше интерактивных labs | 🟢 Средний | 2-3 недели | Content |
| 18 | i18n (EN) | 🔴 Низкий | 3-4 недели | Growth |
| 19 | PWA features | 🟢 Средний | 1-2 недели | UX |

**Приоритеты:**
1. **Performance (12)** — Redis кэширование + оптимизация Prisma
2. **UX improvements (14)** — skeleton screens, error boundaries, retry logic
3. **Storybook (16)** — документация UI компонентов
4. **Больше labs (17)** — XXE, SSRF, Insecure Deserialization
5. **i18n (18)** — английская локализация
