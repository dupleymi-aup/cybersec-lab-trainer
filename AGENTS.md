# Project notes for AI assistants

## Git remotes

- `origin` → GitHub work account (`dupleymi-aup`), SSH: `git@github-work:dupleymi-aup/cybersec-lab-trainer.git`
- `gitverse` → GitVerse mirror, SSH: `git@gitverse.ru:dupleymi-amp/cybersec-lab-trainer.git`

## SSH config (`C:\Users\maksi\.ssh\config`)

This project belongs to the work account — always use the `github-work` host alias (key `id_dupleyi`), not the default `github.com` (key `id_ed25519` for personal `QuadDarv1ne`).

## Session summary

### Done
- **API route hardening** — added outer try/catch + logger to 11 handlers across 8 routes: admin/announcements (GET/POST/PUT/DELETE), admin/users/[id]/reset-password (POST), users (GET/POST), users/[id] (GET/PUT/DELETE), users/[id]/block (PUT), users/[id]/role (PUT), progress (GET/POST), lti/platforms (GET)
- **Bug fix**: analytics/error-patterns/route.ts — `allAttempts` → `filteredAll` (undefined variable reference)
- **Bug fix**: ToolsLab.tsx — `tc` properly defined with `useTranslations('common')` inside CopyButton
- **Bug fix**: recovery/page.tsx — redirect was going to `/login` instead of `/recovery`
- **Bug fix**: AuthSecurityLab.tsx — `!` assertion replaced with `??` fallback
- **Middleware→Proxy**: Renamed `src/middleware.ts` → `src/proxy.ts` (Next.js 16 deprecation)
- **Dead routes removed**: `src/app/main/` and `src/app/dashboard-app/` — root-level redirect pages that always returned 404 due to next-intl proxy locale prefixing
- **next.config.ts**: Removed stale `/app` → `/dashboard-app` redirects that led to 404
- **0 ESLint warnings, 0 TypeScript errors**
- **261 tests pass** across 22 files
- **Full verification**: lint ✓, typecheck ✓, build ✓, tests ✓

### In Progress
- (none)

### Blocked
- 6 npm vulns unfixable without breaking changes (Prisma transitive via @prisma/dev, Next.js transitive via postcss)

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
