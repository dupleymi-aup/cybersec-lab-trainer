# Project notes for AI assistants

## Git remotes

- `origin` → GitHub work account (`dupleymi-aup`), SSH: `git@github-work:dupleymi-aup/cybersec-lab-trainer.git`
- `gitverse` → GitVerse mirror, SSH: `git@gitverse.ru:dupleymi-amp/cybersec-lab-trainer.git`

## SSH config (`C:\Users\maksi\.ssh\config`)

This project belongs to the work account — always use the `github-work` host alias (key `id_dupleyi`), not the default `github.com` (key `id_ed25519` for personal `QuadDarv1ne`).

## Session summary

### Done last
- **`dda4d24e`**: i18n: localize QuizSessionAnalytics with en/ru/zh keys
- **`d463f6fa`**: i18n: add quiz analytics, report scheduler, progressSankey i18n keys (en/ru/zh) + fix broken JSON in all 3 locale files
- **`4704a593`**: i18n: localize CSRFLab with en/ru/zh keys
- **`71d7b34f`**: i18n: localize SSRFLab, SecureCodingLab, SecurityHeadersLab with en/ru/zh keys
- **`70a06b20`**: i18n: localize SQLInjectionLab and XSSLab with en/ru/zh keys + add lab i18n keys for CSRF/SSRF/SecureCoding/SecurityHeaders
- **`c3d0be2b`**: fix: resolve 5 ESLint warnings (missing deps in hooks) + i18n: localize OWASPTop10 (~50 strings) and SecurityCheatSheets (~15 strings) with en/ru/zh keys
- **`fbebeb16`**: i18n: localize 6 more components (WeaknessAnalyzer, StudentDrillDown, GradebookView, AtRiskReport, ExecutiveSummaryExport, StudentHeatmapCalendar) with en/ru/zh keys
- **`68ffccc3`**: i18n: localize 4 components (SystemAnnouncements, StudentProgressView, StudentComparisonView, AchievementAnalytics) with en/ru/zh keys
- **`2412bc4b`**: i18n: localize AssignmentBuilder (~60 strings) and LtiPlatformManager (~40 strings) with en/ru/zh keys
- **`7ee918eb`**: Added try/catch error handling to 25 API routes (all analytics + gamification/xp); i18n localization of 4 components (CareerPaths, LearningVelocity, LoginPatterns, NotificationBell) with en/ru/zh keys
- **`e8f83058`**: Fixed hardcoded `locale: 'ru'` in all 7 root-level redirect pages → dynamic locale from `NEXT_LOCALE` cookie; fixed missing `catch` block and misindentation in `audit-logs/route.ts`; added try/catch to 7 analytics routes (predictive-risk, progress-dynamics, progress-trends, quiz-categories, quiz-difficulty, quiz-questions, quiz-retry)
- **`dbdae417`**: i18n locale-aware not-found and error pages (Phase 1.6)
- **0 ESLint warnings, 0 TypeScript errors** — lint clean, typecheck clean
- **239/239 tests passing** (19 files) — all unit tests green
- **Remote sync** — both remotes at `dda4d24e`
- **Full verification passed**: lint ✓, typecheck ✓, tests ✓
