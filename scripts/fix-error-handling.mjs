import fs from 'fs';
import path from 'path';

const analyticsDir = 'src/app/api/analytics';
const files = [
  'achievements/route.ts',
  'at-risk/route.ts',
  'admin-summary/route.ts',
  'certification-readiness/route.ts',
  'comprehensive-summary/route.ts',
  'data-quality/route.ts',
  'error-patterns/route.ts',
  'gradebook/route.ts',
  'group-comparison/route.ts',
  'group-dynamics/route.ts',
  'learning-velocity/route.ts',
  'learning-path/route.ts',
  'login-patterns/route.ts',
  'module-performance/route.ts',
  'module-time-to-complete/route.ts',
  'predictive-risk/route.ts',
  'progress-dynamics/route.ts',
  'progress-trends/route.ts',
  'quiz-categories/route.ts',
  'quiz-difficulty/route.ts',
  'quiz-questions/route.ts',
  'quiz-retry/route.ts',
  'quiz-session/route.ts',
  'quiz-trajectory/route.ts',
  'student-comparison/route.ts',
  'student/[userId]/route.ts',
];

// Also fix non-analytics routes
const otherFiles = [
  'src/app/api/gamification/xp/route.ts',
  'src/app/api/deadlines/check/route.ts',
  'src/app/api/progress/route.ts',
  'src/app/api/admin/audit-logs/route.ts',
];

let fixed = 0;
let skipped = 0;

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('SKIP (not found): ' + filePath);
    skipped++;
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already has logger import
  if (!content.includes("from '@/lib/logger'")) {
    // Add logger import after last import line
    const importRegex = /^(import .+ from '.+';\n)(?!import)/m;
    const match = content.match(importRegex);
    if (match) {
      content = content.replace(importRegex, `$1import { logger } from '@/lib/logger';\n`);
    }
  }

  const lines = content.split('\n');

  // For files with multiple handlers (progress/route.ts), we need to handle each one
  // Find all export async function declarations
  const funcStarts = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^export async function (GET|POST|PUT|DELETE)/)) {
      funcStarts.push(i);
    }
  }

  if (funcStarts.length === 0) {
    console.log('SKIP (no func): ' + filePath);
    skipped++;
    return;
  }

  // Process each function (in reverse to not mess up indices)
  for (let fi = funcStarts.length - 1; fi >= 0; fi--) {
    const funcStart = funcStarts[fi];
    const funcEnd = fi + 1 < funcStarts.length ? funcStarts[fi + 1] : lines.length;

    // Find the last auth check line in this function
    let lastAuthLine = -1;
    for (let i = funcStart; i < funcEnd; i++) {
      if (lines[i].includes('return unauthorized()') || lines[i].includes('return forbidden()')) {
        lastAuthLine = i;
      }
    }

    if (lastAuthLine === -1) {
      continue;
    }

    // Check if there's already a try block after auth
    let hasTry = false;
    for (let i = lastAuthLine + 1; i < funcEnd; i++) {
      if (lines[i].trim().startsWith('try {')) {
        hasTry = true;
        break;
      }
      if (lines[i].trim().startsWith('return NextResponse')) break;
      if (lines[i].trim() !== '' && !lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('const')) break;
    }

    if (hasTry) {
      continue;
    }

    // Find the last return NextResponse.json in this function
    let lastReturnIdx = -1;
    for (let i = lastAuthLine + 1; i < funcEnd; i++) {
      if (lines[i].includes('return NextResponse.json(')) {
        lastReturnIdx = i;
      }
    }

    if (lastReturnIdx === -1) {
      continue;
    }

    // Find the end of the return statement (count parens)
    let returnEnd = lastReturnIdx;
    let parenCount = 0;
    for (let i = lastReturnIdx; i < funcEnd; i++) {
      for (const ch of lines[i]) {
        if (ch === '(') parenCount++;
        if (ch === ')') parenCount--;
      }
      if (parenCount === 0) {
        returnEnd = i;
        break;
      }
    }

    // Get route name for logging
    const routeName = filePath
      .replace('src/app/api/', '')
      .replace('/route.ts', '')
      .replace(/\//g, '/');

    // Build the new content for this function
    const before = lines.slice(0, lastAuthLine + 1);
    const businessLogic = lines.slice(lastAuthLine + 1, returnEnd + 1);
    const after = lines.slice(returnEnd + 1);

    // Indent business logic
    const indented = businessLogic.map(line => {
      if (line.trim() === '') return line;
      return '  ' + line;
    });

    const catchBlock = [
      '  } catch (e) {',
      `    logger.error('${routeName} error:', { error: String(e) });`,
      "    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });",
      '  }',
    ];

    const newFuncLines = [
      ...before,
      '  try {',
      ...indented,
      ...catchBlock,
      ...after,
    ];

    lines.splice(funcStart, funcEnd - funcStart, ...newFuncLines);
  }

  fs.writeFileSync(filePath, lines.join('\n'));
  fixed++;
  console.log('FIXED: ' + filePath);
}

// Fix analytics routes
for (const file of files) {
  fixFile(path.join(analyticsDir, file));
}

// Fix other routes
for (const file of otherFiles) {
  fixFile(file);
}

console.log(`\nTotal: ${fixed} fixed, ${skipped} skipped`);
