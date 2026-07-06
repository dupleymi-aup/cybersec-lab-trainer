# Project notes for AI assistants

## Git remotes

- `origin` → GitHub work account (`dupleymi-aup`), SSH: `git@github-work:dupleymi-aup/cybersec-lab-trainer.git`
- `gitverse` → GitVerse mirror, SSH: `git@gitverse.ru:dupleymi-amp/cybersec-lab-trainer.git`

## SSH config (`C:\Users\maksi\.ssh\config`)

This project belongs to the work account — always use the `github-work` host alias (key `id_dupleyi`), not the default `github.com` (key `id_ed25519` for personal `QuadDarv1ne`).

## Session summary

### Done last
- **API route type safety** — replaced `any` types with proper interfaces (`ProgressSnapshotBody`, `ScheduledReportUpdateBody`) in 2 API routes, removed eslint-disable comments
- **Prettier format pass** — formatted 291 src files (zh.json formatting fixes, consistent line endings)
- **0 ESLint warnings, 0 TypeScript errors** — lint clean, typecheck clean
- **240/240 tests passing** — all unit tests green
- **Remote sync** — `origin` and `gitverse` at `8d33ffa3`
