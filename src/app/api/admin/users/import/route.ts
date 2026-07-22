import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole, checkRateLimit, getClientIp } from '@/lib/api-middleware';
import { logger } from '@/lib/logger';
import { hashPassword, validateEmail, validatePhone } from '@/lib/auth-utils';

interface RequestBody {
  csv: string;
  role?: string;
  defaultGroup?: string;
  defaultCourse?: string;
  defaultUniversity?: string;
}

interface ParsedRow {
  email: string;
  phone: string;
  fullName: string;
  group: string;
  course: string;
  university: string;
  bio: string;
}

interface ImportError {
  row: number;
  email?: string;
  error: string;
}

function generateRandomPassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const specials = '!@#$%^&*';
  const allChars = lowercase + uppercase + digits + specials;

  // Ensure at least one character from each category
  const array = new Uint32Array(12);
  crypto.getRandomValues(array);

  const password = [
    lowercase[array[0] % lowercase.length],
    uppercase[array[1] % uppercase.length],
    digits[array[2] % digits.length],
    specials[array[3] % specials.length],
  ];

  for (let i = 4; i < 12; i++) {
    password.push(allChars[array[i] % allChars.length]);
  }

  // Shuffle the password
  for (let i = password.length - 1; i > 0; i--) {
    const j = array[i] % (i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
}

function parseCSV(csv: string): ParsedRow[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    rows.push({
      email: row.email || '',
      phone: row.phone || '',
      fullName: row.fullname || '',
      group: row.group || '',
      course: row.course || '',
      university: row.university || '',
      bio: row.bio || '',
    });
  }

  return rows;
}

// POST /api/admin/users/import - import users from CSV
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  // Rate limit: 5 imports per minute per admin
  const rateLimit = checkRateLimit(`import:${auth.id}`, 5, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests', retryAfter: rateLimit.retryAfter }, { status: 429 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch (e) {
    logger.error('Invalid JSON in users import', { error: String(e) });
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { csv, role, defaultGroup = '', defaultCourse = '', defaultUniversity = '' } = body;

  if (!csv || typeof csv !== 'string' || csv.trim().length === 0) {
    return NextResponse.json({ error: 'CSV content is required' }, { status: 400 });
  }

  // Validate role if provided
  if (role && !['student', 'teacher', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role. Must be: student, teacher, admin' }, { status: 400 });
  }

  const rows = parseCSV(csv);
  if (rows.length === 0) {
    return NextResponse.json({ error: 'No data rows found in CSV' }, { status: 400 });
  }

  const errors: ImportError[] = [];
  const tempPasswords: { email: string; password: string }[] = [];
  let imported = 0;
  let skipped = 0;

  // Collect all emails and phones from CSV to detect intra-CSV duplicates
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1; // 1-based row number (excluding header)

    // Validate required fields
    if (!row.email) {
      errors.push({ row: rowNum, error: 'Email is required' });
      skipped++;
      continue;
    }
    if (!row.phone) {
      errors.push({
        row: rowNum,
        email: row.email,
        error: 'Phone is required',
      });
      skipped++;
      continue;
    }
    if (!row.fullName) {
      errors.push({
        row: rowNum,
        email: row.email,
        error: 'Full name is required',
      });
      skipped++;
      continue;
    }

    // Validate email format
    if (!validateEmail(row.email)) {
      errors.push({
        row: rowNum,
        email: row.email,
        error: 'Invalid email format',
      });
      skipped++;
      continue;
    }

    // Validate phone format
    if (!validatePhone(row.phone)) {
      errors.push({
        row: rowNum,
        email: row.email,
        error: 'Invalid phone format',
      });
      skipped++;
      continue;
    }

    // Check for intra-CSV duplicates
    if (seenEmails.has(row.email.toLowerCase())) {
      errors.push({
        row: rowNum,
        email: row.email,
        error: 'Duplicate email in CSV',
      });
      skipped++;
      continue;
    }
    if (seenPhones.has(row.phone)) {
      errors.push({
        row: rowNum,
        email: row.email,
        error: 'Duplicate phone in CSV',
      });
      skipped++;
      continue;
    }

    seenEmails.add(row.email.toLowerCase());
    seenPhones.add(row.phone);
  }

  // Check for existing users in database (emails and phones)
  const existingUsers = await getPrisma().user.findMany({
    where: {
      OR: [{ email: { in: Array.from(seenEmails) } }, { phone: { in: Array.from(seenPhones) } }],
    },
    select: { email: true, phone: true },
  });

  const existingEmails = new Set(existingUsers.map((u: { email: string; phone: string }) => u.email.toLowerCase()));
  const existingPhones = new Set(existingUsers.map((u: { email: string; phone: string }) => u.phone));

  // Filter out rows that conflict with existing users
  const rowsToImport: (ParsedRow & { rowNum: number })[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    // Skip if already had validation errors
    const existingError = errors.find((e) => e.row === rowNum);
    if (existingError) continue;

    if (existingEmails.has(row.email.toLowerCase())) {
      errors.push({
        row: rowNum,
        email: row.email,
        error: 'Email already exists',
      });
      skipped++;
      continue;
    }
    if (existingPhones.has(row.phone)) {
      errors.push({
        row: rowNum,
        email: row.email,
        error: 'Phone already exists',
      });
      skipped++;
      continue;
    }

    rowsToImport.push({ ...row, rowNum });
  }

  // Import users in batches using createMany for better performance
  const BATCH_SIZE = 50;
  for (let i = 0; i < rowsToImport.length; i += BATCH_SIZE) {
    const batchRows = rowsToImport.slice(i, i + BATCH_SIZE);
    const passwords = batchRows.map(() => generateRandomPassword());
    const passwordHashes = await Promise.all(passwords.map((p) => hashPassword(p)));

    batchRows.forEach((row, idx) => {
      tempPasswords.push({ email: row.email, password: passwords[idx] });
    });

    try {
      await getPrisma().user.createMany({
        data: batchRows.map((row, idx) => ({
          id: crypto.randomUUID(),
          email: row.email,
          phone: row.phone,
          fullName: row.fullName,
          group: row.group || defaultGroup,
          course: row.course || defaultCourse,
          university: row.university || defaultUniversity,
          bio: row.bio,
          role: (role || 'student') as 'student' | 'teacher' | 'admin',
          passwordHash: passwordHashes[idx],
        })),
      });
      imported += batchRows.length;
    } catch (error) {
      for (const row of batchRows) {
        errors.push({
          row: row.rowNum,
          email: row.email,
          error: error instanceof Error ? error.message : 'Failed to create user',
        });
        skipped++;
      }
    }
  }

  // Audit log the import action
  try {
    const adminUser = await getPrisma().user.findUnique({ where: { id: auth.id } });
    const ip = getClientIp(request);
    await getPrisma().auditLog.create({
      data: {
        id: crypto.randomUUID(),
        adminId: auth.id,
        adminName: adminUser?.fullName || adminUser?.email || 'Unknown',
        action: 'users_import',
        targetId: 'csv_import',
        targetName: `${imported} users imported`,
        details: `Admin ${auth.id} imported ${imported} users from CSV, ${skipped} skipped [IP: ${ip}]`,
      },
    });
  } catch (error) {
    logger.warn('Audit logging failed', { error });
  }

  return NextResponse.json({
    success: true,
    imported,
    skipped,
    errors,
    passwordCount: tempPasswords.length,
    note: 'Temporary passwords generated for imported users. Distribute securely via out-of-band channel.',
  });
}
