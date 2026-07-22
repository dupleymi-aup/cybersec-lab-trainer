# Project notes for AI assistants

## Git remotes

- `origin` → GitHub work account (`dupleymi-aup`), SSH: `git@github-work:dupleymi-aup/cybersec-lab-trainer.git`
- `gitverse` → GitVerse mirror, SSH: `git@gitverse.ru:dupleymi-amp/cybersec-lab-trainer.git`

## SSH config (`C:\Users\maksi\.ssh\config`)

This project belongs to the work account — always use the `github-work` host alias (key `id_dupleyi`), not the default `github.com` (key `id_ed25519` for personal `QuadDarv1ne`).

## Session summary

### Done last
- **Phase 2 test coverage push**: Added 105 tests across 4 new test files, boosting coverage from 40% to 60% statements:
  - `tests/api-middleware.test.ts` (49 tests): getTokenFromRequest, requireRole, requirePermission, requireCapability, withCapability/withAnyCapability/withAllCapabilities, unauthorized/forbidden, getClientIp, checkRateLimit, authenticate
  - `tests/auth-types.test.ts` (22 tests): ROLE_HIERARCHY, ROLE_PERMISSIONS, hasRole, hasPermission, getRoleLabel, getRoleDescription — **auth-types.ts now at 100% statements**
  - `tests/export-utils.test.ts` (22 tests): buildCSV (including CSV injection sanitization), generateGradebookCSV, generateStudentReportCSV, generateModulePerformanceCSV, generateAtRiskCSV, generateGroupComparisonCSV, generateAnalyticsCSV
  - `tests/lti-utils.test.ts` (18 tests): generateToolKeyPair, fetchPlatformJwks (with cache), signAgsToken, syncGradesToPlatform, fetchNrpsMembers — **lti-utils.ts from 25% → 71%**
- **api-middleware.ts**: 15.66% → **92.77%** statements
- **0 ESLint warnings, 0 TypeScript errors** — lint clean, typecheck clean
- **344/344 tests pass** — 22/22 test files, 0 failures
- **Full verification**: lint ✓, typecheck ✓, tests ✓
