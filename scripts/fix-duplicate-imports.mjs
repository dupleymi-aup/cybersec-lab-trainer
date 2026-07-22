import fs from 'fs';
import path from 'path';

function dedupeImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const seen = new Set();
  const result = [];
  let removed = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    // Only dedupe import lines (not const/interface/type lines)
    if (trimmed.startsWith('import ') && trimmed.endsWith(';')) {
      if (seen.has(trimmed)) {
        removed++;
        continue;
      }
      seen.add(trimmed);
    }
    result.push(line);
  }

  if (removed > 0) {
    fs.writeFileSync(filePath, result.join('\n'));
    console.log(`FIXED (${removed} dupes): ${filePath}`);
  }
}

// Fix all analytics routes
const analyticsDir = 'src/app/api/analytics';
const files = fs.readdirSync(analyticsDir, { recursive: true }).filter(f => f.endsWith('route.ts'));
for (const file of files) {
  dedupeImports(path.join(analyticsDir, file));
}

// Fix other files
for (const f of [
  'src/app/api/gamification/xp/route.ts',
  'src/app/api/deadlines/check/route.ts',
  'src/app/api/admin/audit-logs/route.ts',
]) {
  dedupeImports(f);
}

console.log('Done');
