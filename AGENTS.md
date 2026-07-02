# Project notes for AI assistants

## Git remotes

- `origin` → GitHub work account (`dupleymi-aup`), SSH: `git@github-work:dupleymi-aup/cybersec-lab-trainer.git`
- `gitverse` → GitVerse mirror, SSH: `git@gitverse.ru:dupleymi-amp/cybersec-lab-trainer.git`

## SSH config (`C:\Users\maksi\.ssh\config`)

This project belongs to the work account — always use the `github-work` host alias (key `id_dupleyi`), not the default `github.com` (key `id_ed25519` for personal `QuadDarv1ne`).

## Session summary

### Done last
- **ESLint v10 + eslint-config-next v16 fix** — updated `package.json` version pins; fixed `terminal/eslint.config.mjs` (old `coreWebVitals` pattern); added `coverage/`, `other-repo/`, `terminal/` to root ignores
- **Prettier config + format** — added `.prettierrc` with `prettier-plugin-tailwindcss`, formatted 290 files
- **Package.json cleanup** — restored missing scripts (typecheck, format, analyze, db:schema), pinned `next ^16.2.9`, added missing `prettier` deps
- **auth-server-secrets.ts fixed** — replaced `console.log` + eslint-disable with `logger.info`
- **0 ESLint warnings** — lint clean
- **Remote sync** — `origin` (GitHub) and `gitverse` (GitVerse) now at `f9bc4cdc`
