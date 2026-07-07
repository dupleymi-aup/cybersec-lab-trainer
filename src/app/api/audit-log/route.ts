import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { parseBody } from '@/lib/utils';

interface AuditLogBody {
  action: string;
  targetId: string;
  targetName?: string;
  details?: string;
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  const logs = await getPrisma().auditLog.findMany({
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

  const bodyResult = await parseBody<AuditLogBody>(request);
  if (!bodyResult.ok) return bodyResult.response;
  const { action, targetId, targetName, details } = bodyResult.data;

  if (!action || !targetId) {
    return NextResponse.json({ error: 'action and targetId required' }, { status: 400 });
  }

  const user = await getPrisma().user.findUnique({ where: { id: auth.id } });
  const log = await getPrisma().auditLog.create({
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
