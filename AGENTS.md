# Project notes for AI assistants

## Git remotes

- `origin` → GitHub work account (`dupleymi-aup`), SSH: `git@github-work:dupleymi-aup/cybersec-lab-trainer.git`
- `gitverse` → GitVerse mirror, SSH: `git@gitverse.ru:dupleymi-amp/cybersec-lab-trainer.git`

## SSH config (`C:\Users\maksi\.ssh\config`)

This project belongs to the work account — always use the `github-work` host alias (key `id_dupleyi`), not the default `github.com` (key `id_ed25519` for personal `QuadDarv1ne`).

## Session summary

### Done last
- **(working tree)**: Phase 1.8 root layout fix: `NEXT_LOCALE` cookie drives `<html lang>`, localized skip-link, and `generateMetadata()` title/description via `landing.header`/`landing.hero` translations (3 locale JSON files imported statically); `LocaleLangSetter` retained as fallback for client-side nav
- **(working tree)**: Fixed 22 pre-existing test failures (stale Russian assertions from i18n English conversion):
  - `tests/auth-utils.test.ts` (5): Russian error messages → English (`'Minimum 8 characters'`, `'uppercase'`, `'lowercase'`, `'digit'`, `'special character'`)
  - `tests/password-strength.test.tsx` (6): Russian labels → English (`'Very weak'`, `'Weak'`, `'Fair'`, `'Good'`, `'Strong'`, `'Excellent'`)
  - `tests/recovery-validation.test.ts` (5): same as auth-utils
  - `tests/security-fixes.test.ts` (5): same as auth-utils
  - `tests/notification-store.test.ts` (1): `'Достижение'` → `'Achievement Unlocked'`
- **(working tree)**: Bug fixes in 8 files:
  - `PhishingAnalyzer.tsx`: `currentEmail?.body ?? ''` guard against crash when filter yields empty list
  - `OnboardingTour.tsx`: 2 aria-labels added on icon buttons; 5 localStorage calls wrapped in try/catch
  - `ComprehensiveDashboard.tsx`: `<p onClick>` → `<button type="button">` for keyboard accessibility
  - `StudentPerformanceReport.tsx`: array index → stable key `rec.title`
  - `StudentHeatmapCalendar.tsx`: `.catch()` on `loadStudents()` promise
  - `AnalyticsExportPanel.tsx`: 2 localStorage accesss wrapped in try/catch
  - `SecurityHeadersLab.tsx` + `security-headers-data.ts`: Russian category keys → English keys (xss, connection, clickjacking, mime, privacy, browserApi, processIsolation, resourceIsolation, resourceProtection, caching, browserPrivacy, safeExit)
- **0 ESLint warnings, 0 TypeScript errors** — lint clean, typecheck clean
- **239/239 tests pass** — 19/19 test files, 0 failures
- **Full verification**: lint ✓, typecheck ✓, build ✓, tests ✓
