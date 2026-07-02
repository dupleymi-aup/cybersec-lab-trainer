# CyberSec Lab — План улучшений (10 пунктов)

**Текущий статус:** 337 тестов (23 файла), 57.27% coverage, TS 0 ошибок, lint 0, React Query интегрирован

**Последнее обновление (09.06.2026):** env.ts — 77% coverage (9 новых тестов), всего 337 тестов

---

## 1. Мигрировать все компоненты на React Query
- **Что:** Заменить ручные `fetch` + `useState`/`useEffect` на `useApiQuery`/`useApiMutation` во всех 30+ компонентах
- **Где:** Dashboard, Sidebar, TeacherPanel, NotesPanel, AdminPanel, ProfilePage, CtfLabsPanel и др.
- **Эффект:** Единый подход к кэшированию, retry, refetch, отмена дублирующих запросов

## 2. Toast-уведомления для всех API-ошибок ✅
- **Что:** Заменить `console.error` на `toast.error()` в NotesPanel, AdminActionsPanel, CtfLabsPanel, StudySessionsPanel, TeacherPanel
- **Эффект:** Пользователь видит все ошибки, а не только разработчик в консоли
- **Сделано:** NotesPanel (4 блока), AdminActionsPanel, CtfLabsPanel (2 блока), StudySessionsPanel

## 3. Loading states на все кнопки действий ✅
- **Что:** Добавить `disabled` + spinner на кнопки ProfilePage (save/password/delete), BulkActionsBar, TeacherPanel (CRUD)
- **Эффект:** Защита от двойного клика, визуальная обратная связь
- **Сделано:** ProfilePage — 3 кнопки (save/password/delete)

## 4. Component-level ErrorBoundary
- **Что:** Обернуть TeacherPanel, AdminPanel, ProfilePage, NotesPanel в индивидуальные `<ErrorBoundary>`
- **Эффект:** Локализация ошибок — один сломавшийся блок не валит всю страницу

## 5. Увеличить coverage до 70%+
- **Что:** Добавить тесты для export-utils (сейчас 19%), middleware (15%), auth-types (16%), env.ts (42%)
- **Эффект:** Надёжность рефакторингов, уверенность в регрессиях
- **Сделано:** auth-types.ts — 100% (13 тестов, все 4 функции покрыты)
- **Сделано:** env.ts — 77% (9 тестов, все 5 веток NODE_ENV + URL + TOKEN_SECRET)

## 6. Оптимизация производительности API (Redis + Prisma)
- **Что:** Кэширование analytics endpoints через Redis, оптимизация JOIN-запросов, select only нужных полей, pagination для больших датасетов
- **Эффект:** Ускорение API в 2-3 раза на больших данных

## 7. Storybook для UI-компонентов
- **Что:** Документировать все shadcn/ui-компоненты + ключевые кастомные компоненты (Skeleton, ErrorBoundary, Dashboard cards)
- **Эффект:** Единый источник правды для дизайн-системы

## 8. Английская локализация (i18n)
- **Что:** Вынести все строки в locale-файлы (уже есть next-intl), добавить EN-переводы, переключатель языка
- **Эффект:** Международная аудитория, публикация на GitHub

## 9. CI/CD: matrix + deploy + dependabot
- **Что:** Matrix strategy (node 18/20/22), deploy workflow на Vercel, auto-merge dependabot, stale issue tracker
- **Эффект:** Более надёжный CI, меньше ручной работы

## 10. Новые интерактивные labs
- **Что:** Добавить XXE, SSRF (продвинутый), Insecure Deserialization, Business Logic уязвимости
- **Эффект:** Полное покрытие OWASP Top 10 + advanced topics
