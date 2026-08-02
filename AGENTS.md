# Project notes for AI assistants

## Git remotes

- `origin` → GitHub work account (`dupleymi-aup`), SSH: `git@github-work:dupleymi-aup/cybersec-lab-trainer.git`
- `gitverse` → GitVerse mirror, SSH: `git@gitverse.ru:dupleymi-amp/cybersec-lab-trainer.git`

## SSH config (`C:\Users\maksi\.ssh\config`)

This project belongs to the work account — always use the `github-work` host alias (key `id_dupleyi`), not the default `github.com` (key `id_ed25519` for personal `QuadDarv1ne`).

## Session summary

### Done
- **Hydration fixes**: replaced `<head>` inside `<body>` with `next/script` for JSON-LD in locale layout; fixed ThemeToggle hydration mismatch with mounted state guard
- **Zod validation**: added schemas to 20+ API routes (admin, auth, LTI, progress, users, CSP report, scheduled reports)
- **i18n**: added missing `goBack` key to `studentProgress` in ru.json and zh.json
- **Lint**: suppressed unused `target_link_uri` warning in oidc-login route
- **Repo cleanup**: removed 76 generated Playwright report/test-result files from git tracking (were in .gitignore but still tracked, ~102K lines deleted)
- **Removed unused `uuid` dependency** — project uses custom `validate-uuid.ts` with regex
- **Fixed `packageManager` field** — corepack injected yarn reference; project uses npm
- **Tracked `public/sw.js`** service worker (removed from .gitignore)
- **Vulnerabilities eliminated**: 11 npm vulns (2 critical) → **0**. `npm update` all deps in range + `overrides`: postcss 8.5.25 (3 high postcss CVEs), sharp 0.35.3 (libvips CVEs) inside next
- **Prisma pinned to 6.19.3** (exact) — Prisma 7.x breaking change: `url` in datasource block rejected (needs prisma.config.ts + adapter); project runtime expects Prisma 6 client architecture (`@prisma/client/runtime/library.js`). Do NOT bump to 7.x without migrating schema/config.
- **Bug fix**: 5 TS2345 errors from recharts 3.10.1 stricter `Tooltip labelFormatter` typing (ReactNode) — fixed with `formatDate(String(v))` in AdvancedAnalytics, ErrorPatternsAnalytics, StudentPerformanceReport
- **Removed legacy `tailwind.config.ts`** — imported `tailwindcss-animate` (pruned transitive dep); Tailwind 4 uses CSS-first config (`globals.css` with `@import 'tw-animate-css'`)
- **0 ESLint warnings, 0 TypeScript errors, 531 tests pass** (31 files)
- **Full verification**: lint ✓, typecheck ✓, build ✓, tests ✓, `npm audit` → 0 vulnerabilities

### In Progress
- (none)

### Blocked
- (none)

## Historic (previous sessions)

- **Phase 6 test coverage push**: Added 8 tests for verifyLtiLaunch, boosting coverage from 96% to 99% statements
- **Phase 5 test coverage push**: Added 9 tests across 2 files, boosting coverage from 95% to 96% statements
- **Phase 4 test coverage push**: Added 40 tests across 2 files, boosting coverage from 91% to 95% statements
- **Phase 3 test coverage push**: Added 78 tests across 5 new test files, boosting coverage from 60% to 91% statements
- **Overall coverage**: 59.81% → **98.95%** statements, 90.5% branches, 99.3% functions
- **479/479 tests pass** — 28/28 test files, 0 failures
- **Security hardening**: Fixed 3 IDOR vulnerabilities, rate limiting to password change, Zod validation to batch progress endpoint
- **Accessibility**: role/tabIndex/onKeyDown on interactive elements, global Escape handlers, aria-labels on icon buttons, localStorage try/catch
- **i18n**: LanguageSwitcher from routing.locales, hardcoded Russian cleanup, 22 test assertion fixes
- **Root layout fix**: NEXT_LOCALE cookie drives `<html lang>`, localized skip-link/metadata
