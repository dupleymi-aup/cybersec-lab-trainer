# CyberSec Lab — Топ-10 улучшений проекта

Приоритизированный список самых impactful улучшений, которые дадут максимальную отдачу проекту.

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

## 5. 🌐 i18n — поддержка русского и английского языков

**Проблема:** Весь UI и контент на русском. Английская документация есть, но платформа недоступна для международной аудитории.

**Что сделать:**
- Интегрировать `next-intl` или `react-i18next`
- Вынести все строки UI в locale-файлы (RU + EN)
- Добавить переключатель языка в sidebar
- Перевести контент модулей и квизов
- Настроить маршрутизацию `/ru/` и `/en/`

**Влияние:** Удвоение потенциальной аудитории. Возможность публикации на GitHub с international reach.

**Сложность:** 🔴 Высокая | **Время:** 4-6 недель

---

## 6. ~~🧪 Увеличить покрытие тестами до 80%+~~ ✅ ЧАСТИЧНО ВЫПОЛНЕНО

**Статус:** 146 тестов (было 6). Реализовано 2026-05-22.

**Что сделано:**
- 11 test files: 146 passing tests (было 6 unit + 2 E2E)
- xp-utils.test.ts: 19 тестов для системы уровней и XP
- api-validation.test.ts: 17 тестов для Zod схем assignments
- auth-schemas.test.ts: 22 теста для login/register/password схем
- progress-schemas.test.ts: 9 тестов для progress schemas
- achievement-utils.test.ts: 13 тестов для системы достижений
- Настроен vitest coverage с v8 provider
- Скрипт `npm run test:coverage` для отчёта
- Thresholds: 30% lines, 25% functions, 20% branches

**Осталось:**
- Integration тесты для API endpoints (mock Prisma)
- E2E тесты для всех модулей обучения
- Увеличить покрытие до 80%+

---

## 7. ~~🚀 Миграция на PostgreSQL~~ ✅ ВЫПОЛНЕНО

**Статус:** Реализовано 2026-05-22

**Что сделано:**
- Prisma datasource переключён с SQLite на PostgreSQL
- Все String @id поля получили @default(cuid()) для PostgreSQL совместимости
- DATABASE_URL replaces SQLITE_URL в .env.example
- docker-compose.yml уже содержит PostgreSQL сервис с healthcheck
- README обновлён с инструкциями по настройке БД (Docker + cloud варианты)
- Скрипты db:migrate и db:reset уже настроены для миграций

---

## 8. ~~📱 Улучшить PWA и mobile experience~~ ✅ ВЫПОЛНЕНО

**Статус:** Реализовано 2026-05-22

**Что сделано:**
- Обновлён manifest.json: добавлены screenshots, share_target, protocol_handlers, edge_side_panel, 3 shortcut'а
- Создана offline страница (`/offline`) с UI для проверки подключения и кнопкой retry
- Улучшены PWA meta теи в layout.tsx: apple-touch-icon, mobile-web-app-capable, theme color по схеме
- Расширены runtimeCaching в next.config.ts: кэширование JS/CSS бандлов и API ответов (NetworkFirst)
- Добавлены mobile-responsive CSS: safe-area-inset для notch устройств, min tap target 44px, iOS font-size fix
- Viewport: viewportFit=cover, maximumScale=5, userScalable=true
- overscroll-behavior-y: contain для предотвращения pull-to-refresh в PWA

---

## 9. ~~📖 API документация (Swagger/OpenAPI)~~ ✅ ВЫПОЛНЕНО

**Статус:** Реализовано 2026-05-22

**Что сделано:**
- Создана полная OpenAPI 3.0 спецификация (`/public/openapi.yaml`) для 70+ endpoints
- Swagger UI доступен по адресу `/api/docs`
- Документация покрывает все категории: Auth, Progress, Quiz, Analytics, Admin, Users, Deadlines, LTI, Export, Reports
- Поддержка авторизации через JWT Bearer token прямо в UI
- Try-it-out функциональность для тестирования endpoints
- Добавлен скрипт `npm run docs` для быстрого доступа

---

## 10. ~~🎮 Система уровней и прогрессии (RPG-геймификация)~~ ✅ ВЫПОЛНЕНО

**Статус:** Реализовано 2026-05-22

**Что сделано:**
- Prisma: поля xp, level, streak, lastActivityAt в User model
- XP Calculator (xp-utils.ts): 50 уровней, 4 ранга (Junior → Mid → Senior → Lead), таблица 0-125000 XP
- XP Rewards: module complete (100), quiz pass (50), perfect (100), assignment submit (25), assignment passed (50)
- Daily login: 10 XP + streak bonus (5 XP за каждый день серии)
- API: GET /api/gamification/level, POST /api/gamification/xp, GET /api/gamification/leaderboard
- Leaderboard с фильтрацией по группе, ranking position, rankTitle
- Streak system: автоматический подсчёт дней + reset при пропуске

---

## 📋 Рекомендуемый порядок выполнения

| # | Улучшение | Приоритет | Время | Impact |
|---|-----------|-----------|-------|--------|
| 0 | Critical bug fixes (auth, teacher panel, password) | ✅ Реализовано | | Bug fixes |
| 1 | Security fixes (rate limit, password, CSV) | ✅ Реализовано | | Security fix |
| 2 | OTP email / восстановление пароля | ✅ Реализовано | | Security fix |
| 3 | CSRF защита + security headers | ✅ Реализовано | | Security fix |
| 4 | Завершить LTI интеграцию | 🔴 Критический | 2-3 недели | Distribution |
| 5 | Конструктор заданий | 🟡 Высокий | 3-4 недели | Feature |
| 6 | PostgreSQL + Redis | 🟡 Высокий | 1-2 недели | Infrastructure |
| 7 | Тесты 80%+ | 🟡 Высокий | 2-3 недели | Quality |
| 8 | PWA + mobile | 🟡 Высокий | 2-3 недели | UX |
| 9 | API документация | 🟢 Средний | 1 неделя | Developer exp |
| 10 | i18n (RU/EN) | 🟢 Средний | 4-6 недель | Growth |

**Первые 2 — mandatory для production.** Без них platform небезопасна.

**Следующие 4 — ключевые для adoption.** LTI + конструктор = преподаватели приходят. PostgreSQL + тесты = platform stable.

**Последние 4 — growth и polish.** Делают продукт конкурентоспособным на рынке EdTech.

---

*Сгенерировано: 2026-05-22*
*Версия проекта: 0.2.0*
