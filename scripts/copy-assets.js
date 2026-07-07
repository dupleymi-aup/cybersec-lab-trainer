const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const standalone = path.join(root, '.next', 'standalone');
const nextStatic = path.join(root, '.next', 'static');
const nextStandaloneStatic = path.join(standalone, '.next', 'static');
const publicDir = path.join(root, 'public');
const standalonePublic = path.join(standalone, 'public');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(standalone)) {
  console.warn('Standalone output not found — skipping asset copy');
  process.exit(0);
}

copyDir(nextStatic, nextStandaloneStatic);
copyDir(publicDir, standalonePublic);
console.log('Assets copied to standalone');
