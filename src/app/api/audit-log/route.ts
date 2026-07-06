import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 500,
  });

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      adminId: l.adminId,
      adminName: l.adminName,
      action: l.action,
      targetId: l.targetId,
      targetName: l.targetName,
      details: l.details,
      timestamp: l.timestamp.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { action, targetId, targetName, details } = body;

  if (!action || !targetId) {
    return NextResponse.json({ error: 'action and targetId required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: auth.id } });
  const log = await prisma.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      adminId: auth.id,
      adminName: user?.fullName || 'Unknown',
      action,
      targetId,
      targetName: targetName || '',
      details: details || '',
    },
  });

  return NextResponse.json({ success: true, log });
}
