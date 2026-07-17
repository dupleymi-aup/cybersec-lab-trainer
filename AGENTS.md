# Project notes for AI assistants

## Git remotes

- `origin` → GitHub work account (`dupleymi-aup`), SSH: `git@github-work:dupleymi-aup/cybersec-lab-trainer.git`
- `gitverse` → GitVerse mirror, SSH: `git@gitverse.ru:dupleymi-amp/cybersec-lab-trainer.git`

## SSH config (`C:\Users\maksi\.ssh\config`)

This project belongs to the work account — always use the `github-work` host alias (key `id_dupleyi`), not the default `github.com` (key `id_ed25519` for personal `QuadDarv1ne`).

## Session summary

### Done last
- **`6125c87f`**: fix: replace console.error with logger in 2 API routes, add .catch() to 9 unhandled promise rejections in useEffect, add try/catch to 3 clipboard API calls, centralize localhost:3000 fallback to DEFAULT_APP_URL constant
- **`847a0d62`**: i18n: replace remaining hardcoded Russian in 5 more API routes (users/[id], role, block, scheduled-reports)
- **`66cb43ae`**: i18n: replace hardcoded Russian in 16 analytics API routes (month/day names, category labels, time ranges, risk factors, recommendations, achievements)
- **`48ae0e2b`**: i18n: replace hardcoded Russian in 11 API routes (login, register, password, delete, impersonate, recovery, profile, quiz, users, bulk)
- **`0eece45b`**: i18n: replace hardcoded Russian in hooks, auth-types, auth-utils, module-names, capabilities, EngagementAnalytics
- **`6913ac79`**: fix: replace hardcoded Russian in Leaderboard/SQLInjectionLab, move prisma to devDeps, remove tailwindcss-animate duplicate
- **`10e48120`**: i18n: replace hardcoded Russian in 5 lib files with English (auth-store, notification-store, email, export-utils, validations)
- **`2479551b`**: fix: dynamic locale in root/dashboard redirects, try/catch in 2 API routes, localize period labels/day names/unit suffixes across 8 analytics components, fix remaining hardcoded Russian in StudentPerformanceReport
- **`4fc3684e`**: i18n: localize 15 components (APISecurityLab, AchievementsGlossary, AnalyticsExportPanel, BulkActionsBar, CertificationReadiness, CohortAnalysis, GroupComparisonReport, GroupDynamics, LearningPathReport, ModuleDeepDive, PhishingAnalyzer, PredictiveInsights, PredictiveRiskDashboard, StudentPerformanceReport, SyncIndicator) with en/ru/zh keys
- **`331b0c4c`**: fix: show invite code input for teacher role on register page, update i18n keys en/ru/zh
- **`65481de7`**: i18n: localize 3 more components (QuizQuestionAnalytics, ProgressSankey, CohortAnalysis) with en/ru/zh keys
- **`802d7674`**: i18n: localize 5 more analytics components (QuizRetryAnalytics, QuizDifficultyAnalysis, AdminSummaryReport, AdvancedAnalytics, ReportScheduler) with en/ru/zh keys
- **`d9af0309`**: i18n: localize 7 analytics components (QuizSessionAnalytics, StudentDrillDown, ProgressDynamicsChart, PredictiveRiskDashboard, EngagementAnalytics, ErrorPatternsAnalytics, ModulePerformanceReport) with en/ru/zh keys
- **`c2e782d6`**: i18n: localize aria-labels, module names, and fix lint warnings (16 components aria-label, app/page.tsx module names, CohortAnalysis dep fix, tsconfig cleanup)
- **`97941b1f`**: fix: find-port.js support `--port` flag, use full path to next.cmd binary
- **`69a891db`**: docs: update AGENTS.md
- **`f675e180`**: fix: dev-mode OTP logging in recovery API, clean up sendRecoveryOTP store return type (removed unused `otp` field); added `logger` usage to recovery route
- **`e9a4f6c9`**: feat: proper password recovery page with full 3-step OTP flow (contact → OTP → reset), replacing redirect stub; added IP-based rate limiting to login route (20 req/60s) alongside identifier-based limit
- **`1f8a8197`**: docs: update AGENTS.md
- **`e8f83058`**: Fixed hardcoded `locale: 'ru'` in 7 redirect pages → dynamic locale from cookie; fixed missing `catch` block + try/catch in 7 analytics routes
- **`dbdae417`**: i18n locale-aware not-found and error pages (Phase 1.6)
- **`90d58021`**: i18n: localize ActivityHeatmap, GlobalSearch, Leaderboard, PasswordStrengthChecker, IDORLab with en/ru/zh keys
- **`8c8c6ab3`**: fix: resolve LandingFooter {year} FORMATTING_ERROR + add lab i18n keys (en/ru/zh)
- **`dda4d24e`**: i18n: localize QuizSessionAnalytics with en/ru/zh keys
- **`d463f6fa`**: i18n: add quiz analytics, report scheduler, progressSankey i18n keys (en/ru/zh) + fix broken JSON in all 3 locale files
- **`4704a593`**: i18n: localize CSRFLab with en/ru/zh keys
- **`71d7b34f`**: i18n: localize SSRFLab, SecureCodingLab, SecurityHeadersLab with en/ru/zh keys
- **`70a06b20`**: i18n: localize SQLInjectionLab and XSSLab with en/ru/zh keys + add lab i18n keys for CSRF/SSRF/SecureCoding/SecurityHeaders
- **`c3d0be2b`**: fix: resolve 5 ESLint warnings (missing deps in hooks) + i18n: localize OWASPTop10 (~50 strings) and SecurityCheatSheets (~15 strings) with en/ru/zh keys
- **`fbebeb16`**: i18n: localize 6 more components (WeaknessAnalyzer, StudentDrillDown, GradebookView, AtRiskReport, ExecutiveSummaryExport, StudentHeatmapCalendar) with en/ru/zh keys
- **`68ffccc3`**: i18n: localize 4 components (SystemAnnouncements, StudentProgressView, StudentComparisonView, AchievementAnalytics) with en/ru/zh keys
- **`2412bc4b`**: i18n: localize AssignmentBuilder (~60 strings) and LtiPlatformManager (~40 strings) with en/ru/zh keys
- **`7ee918eb`**: Added try/catch error handling to 25 API routes; i18n localization of 4 components (CareerPaths, LearningVelocity, LoginPatterns, NotificationBell) with en/ru/zh keys
- **`e8f83058`**: Fixed hardcoded `locale: 'ru'` in 7 redirect pages → dynamic locale from cookie; fixed missing `catch` block + try/catch in 7 analytics routes
- **`dbdae417`**: i18n locale-aware not-found and error pages (Phase 1.6)
- **0 ESLint warnings, 0 TypeScript errors** — lint clean, typecheck clean
- **Remote sync** — both remotes at `6125c87f`
- **Full verification passed**: lint ✓, typecheck ✓, build ✓
