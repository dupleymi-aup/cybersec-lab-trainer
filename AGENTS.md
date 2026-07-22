# Project notes for AI assistants

## Git remotes

- `origin` → GitHub work account (`dupleymi-aup`), SSH: `git@github-work:dupleymi-aup/cybersec-lab-trainer.git`
- `gitverse` → GitVerse mirror, SSH: `git@gitverse.ru:dupleymi-amp/cybersec-lab-trainer.git`

## SSH config (`C:\Users\maksi\.ssh\config`)

This project belongs to the work account — always use the `github-work` host alias (key `id_dupleyi`), not the default `github.com` (key `id_ed25519` for personal `QuadDarv1ne`).

## Session summary

### Done last
- **Phase 3 test coverage push**: Added 78 tests across 5 new test files, boosting coverage from 60% to 91% statements:
  - `tests/auth-server-extended.test.ts` (13 tests): signJwt, generateToken with rememberMe, getTokenPayload, authenticate, verifyToken edge cases — **auth-server.ts from 65% → 100%**
  - `tests/logger.test.ts` (10 tests): info/warn/error in dev and production, context logging, sensitive key redaction — **logger.ts from 75% → 100%**
  - `tests/env.test.ts` (8 tests): env validation, invalid URL/NODE_ENV, missing TOKEN_SECRET in prod, random secret generation, DATABASE_URL warning — **env.ts from 60% → 88%**
  - `tests/notification-store-extended.test.ts` (24 tests): addNotification cap at 100, markAsRead/markAllAsRead/clear/removeNotification, NotificationHelper (all 7 types), loadAnnouncementsIntoNotifications with dedup — **notification-store.ts from 60% → 100%**
  - `tests/export-pdf.test.ts` (19 tests): all 7 PDF generators (mocked jsPDF), downloadCSV, all 6 CSV generators with full data — **export-utils.ts from 20% → 98%**
  - `tests/capabilities.test.ts` (+4 tests): getScopeForCap group/all/own scope returns — **capabilities.ts from 96% → 98%**
- **Overall coverage**: 59.81% → **91.15%** statements, 76% branches, 95.1% functions
- **0 ESLint warnings, 0 TypeScript errors** — lint clean, typecheck clean
- **422/422 tests pass** — 27/27 test files, 0 failures
- **Full verification**: lint ✓, typecheck ✓, tests ✓
