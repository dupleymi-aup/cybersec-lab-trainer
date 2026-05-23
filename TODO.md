# CyberSec Lab — Топ-10 улучшений проекта

Приоритизированный список самых impactful улучшений, которые дадут максимальную отдачу проекту.

---

## 1. 🔒 Завершить LTI 1.3 интеграцию с Moodle

**Проблема:** LTI интеграция заявлена в README, но не завершена. Преподаватели не могут полноценно использовать платформу из LMS.

**Что сделать:**
- Завершить OIDC login flow и Deep Linking
- Реализовать Assignment and Grade Services (AGS) для автоматической отправки оценок
- Добавить поддержку Names Role Provisioning Service (NRPS) для синхронизации списков групп
- Протестировать с Moodle 4.x и Canvas
- Добавить UI для привязки модулей к курсам LMS

**Влияние:** Откроет платформу для всех университетов, использующих Moodle/Canvas. Главный канал распространения.

**Сложность:** 🔴 Высокая | **Время:** 2-3 недели

---

## 2. 📧 Реализовать отправку OTP email и безопасное восстановление пароля

**Проблема:** В `/api/auth/recovery/route.ts` OTP возвращается в ответе вместо отправки email. nodemailer настроен, но не используется.

**Что сделать:**
- Подключить nodemailer к реальному SMTP (SendGrid, Resend, Mailgun)
- Реализовать красивые HTML-письма с логотипом и кодом
- Добавить expiry (5 мин) и rate limiting на запросы восстановления
- Реализовать повторную отправку с cooldown 60 сек
- Добавить логирование всех попыток восстановления

**Влияние:** Критический security fix. Без этого восстановление пароля небезопасно и непригодно для production.

**Сложность:** 🟡 Средняя | **Время:** 2-3 дня

---

## 3. 🛡️ Добавить CSRF защиту и security headers

**Проблема:** Платформа с аутентификацией и ролями не имеет CSRF защиты. Отсутствуют security headers (CSP, X-Frame-Options, HSTS).

**Что сделать:**
- Добавить `next.config.ts` security headers: CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS
- Реализовать CSRF токены через double-submit cookie pattern
- Добавить middleware для проверки CSRF на всех state-changing запросах
- Настроить `SameSite=strict` для auth cookies
- Добавить `next-safe` или аналогичную библиотеку

**Влияние:** Фундаментальная безопасность. Platform для обучения security должна сама быть secure.

**Сложность:** 🟡 Средняя | **Время:** 3-5 дней

---

## 4. ~~📊 Конструктор заданий для преподавателей~~ ✅ API ВЫПОЛНЕНО

**Статус:** API реализовано 2026-05-22. UI-билдер — следующий шаг.

**Что сделано (API слой):**
- Prisma модели: Assignment + AssignmentSubmission с relations к User
- CRUD API: GET/POST /api/assignments, GET/PUT/DELETE /api/assignments/[id]
- Submission API: POST /api/assignments/[id]/submit с лимитами попыток
- Grading API: POST /api/assignments/[id]/submissions/[submissionId]/grade
- Список submissions: GET /api/assignments/[id]/submissions с фильтрами
- Zod валидация: createAssignmentSchema, submitAssignmentSchema, gradeSubmissionSchema
- Role-based access: teacher создаёт/оценивает, student отправляет
- Функции: auto-grade flag, time limits, max attempts, group targeting, deadlines

**Осталось (UI слой):**
- UI-билдер для создания заданий в TeacherPanel
- Редактор квизов с preview
- Страница прохождения заданий для студентов

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

## 6. 🧪 Увеличить покрытие тестами до 80%+

**Проблема:** Всего 6 unit-тестов и 2 E2E-теста. Нет integration тестов для 70+ API endpoints.

**Что сделать:**
- Добавить тесты для всех API маршрутов (auth, progress, analytics)
- Integration тесты для ключевых workflows (регистрация → прохождение → результат)
- E2E тесты для всех модулей обучения
- Coverage tracking с минимум 80% threshold в CI
- Property-based тестирование для крипто-функций

**Влияние:** Уверенность в рефакторинге и новых фичах. Без тестов каждое изменение — риск регрессии.

**Сложность:** 🟡 Средняя | **Время:** 2-3 недели

---

## 7. 🚀 Миграция на PostgreSQL + Redis кэширование

**Проблема:** `schema.prisma` использует SQLite, который не подходит для production с concurrent пользователями. Нет кэширования аналитики.

**Что сделать:**
- Перевести Prisma schema на PostgreSQL (уже есть в docker-compose)
- Добавить Prisma migrations вместо `db push`
- Настроить Redis для кэширования analytics endpoints (TTL 5 мин)
- Redis для production rate limiting (вместо in-memory)
- Connection pooling с PgBouncer для high-load

**Влияние:** Масштабируемость от 10 до 1000+ concurrent пользователей. Без этого platform не production-ready.

**Сложность:** 🟡 Средняя | **Время:** 1-2 недели

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

## 10. 🎮 Система уровней и прогрессии (RPG-геймификация)

**Проблема:** Есть достижения и лидерборд, но нет глубокой прогрессии. Студентам не хватает долгосрочной мотивации.

**Что сделать:**
- Система уровней (Junior → Mid → Senior → Lead) с XP
- Skill tree: визуальная карта навыков (MITRE ATT&CK style)
- Ежедневные streaks и серии достижений
- Сертификационные треки (OSCP, CEH prep) с прогресс-барами
- Портфолио экспорта: PDF с навыками для резюме

**Влияние:** Резкое повышение retention и engagement. Студенты возвращаются ради прогрессии, а не контента.

**Сложность:** 🟡 Средняя | **Время:** 2-3 недели

---

## 📋 Рекомендуемый порядок выполнения

| # | Улучшение | Приоритет | Время | Impact |
|---|-----------|-----------|-------|--------|
| 1 | OTP email / восстановление пароля | 🔴 Критический | 2-3 дня | Security fix |
| 2 | CSRF защита + security headers | 🔴 Критический | 3-5 дней | Security fix |
| 3 | Завершить LTI интеграцию | 🟡 Высокий | 2-3 недели | Distribution |
| 4 | Конструктор заданий | 🟡 Высокий | 3-4 недели | Feature |
| 5 | PostgreSQL + Redis | 🟡 Высокий | 1-2 недели | Infrastructure |
| 6 | Тесты 80%+ | 🟡 Высокий | 2-3 недели | Quality |
| 7 | PWA + mobile | 🟡 Высокий | 2-3 недели | UX |
| 8 | API документация | 🟢 Средний | 1 неделя | Developer exp |
| 9 | i18n (RU/EN) | 🟢 Средний | 4-6 недель | Growth |
| 10 | RPG-геймификация | 🟢 Средний | 2-3 недели | Retention |

**Первые 2 — mandatory для production.** Без них platform небезопасна.

**Следующие 4 — ключевые для adoption.** LTI + конструктор = преподаватели приходят. PostgreSQL + тесты = platform stable.

**Последние 4 — growth и polish.** Делают продукт конкурентоспособным на рынке EdTech.

---

*Сгенерировано: 2026-05-22*
*Версия проекта: 0.2.0*
