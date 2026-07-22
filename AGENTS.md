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
- **Phase 4 test coverage push**: Added 40 tests across 2 files, boosting coverage from 91% to 95% statements:
  - `tests/achievements-data.test.ts` (36 tests): all 22 switch cases of isAchievementUnlocked (module-based, OWASP-based, quiz-based, secure coding, full-completion, unknown), achievements data structure validation — **achievements-data.ts from 3.57% → 100%**
  - `tests/auth-utils.test.ts` (+4 tests): hashPassword (bcrypt hash output, different hashes for same input), verifyPassword (matching/non-matching) — **auth-utils.ts from 90.9% → 100%**
- **Overall coverage**: 59.81% → **94.66%** statements, 83.75% branches, 97.2% functions
- **0 ESLint warnings, 0 TypeScript errors** — lint clean, typecheck clean
- **462/462 tests pass** — 28/28 test files, 0 failures
- **Full verification**: lint ✓, typecheck ✓, tests ✓
