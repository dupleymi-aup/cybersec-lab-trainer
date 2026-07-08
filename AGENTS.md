# Project notes for AI assistants

## Git remotes

- `origin` → GitHub work account (`dupleymi-aup`), SSH: `git@github-work:dupleymi-aup/cybersec-lab-trainer.git`
- `gitverse` → GitVerse mirror, SSH: `git@gitverse.ru:dupleymi-amp/cybersec-lab-trainer.git`

## SSH config (`C:\Users\maksi\.ssh\config`)

This project belongs to the work account — always use the `github-work` host alias (key `id_dupleyi`), not the default `github.com` (key `id_ed25519` for personal `QuadDarv1ne`).

## Session summary

### Done last
- **`743e3cf`**: add try/catch to 19 API routes missing error handling — quiz, auth/recovery, auth/delete, assignments, deadlines, progress/batch, audit-log, admin/stats, export, gamification, login-activity
- **`cd946d8`**: fix Amvera deployment — renamed `amvera.yml` → `amvera.yaml`, simplified for Docker-based deployment, fixed Prisma schema comment, updated `.dockerignore`
- **`bb4ca11e`**: lazy PrismaClient init to fix build without DATABASE_URL — `getPrisma()` replaces eager `new PrismaClient()`, 87 route/lib files updated, tests mocks fixed, `PrismaTransactionClient` type exported
- **0 ESLint warnings, 0 TypeScript errors** — lint clean, typecheck clean
- **239/239 tests passing** (19 files) — all unit tests green
- **Remote sync** — `origin` and `gitverse` at `743e3cf`
- **Full verification passed**: lint ✓, typecheck ✓, tests ✓
