import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  authenticate,
  unauthorized,
  forbidden,
  requireRole,
  checkRateLimit,
  getClientIp,
} from '@/lib/api-middleware';

// GET /api/admin/announcements - List all announcements
export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  // Rate limit: 60 requests per minute
  const rateLimit = checkRateLimit(`announcements-get:${auth.id}`, 60, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const activeFilter = searchParams.get('active');

  let where: Record<string, unknown> = {};
  if (activeFilter === 'true') {
    where = {
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    };
  }

  const announcements = await prisma.announcement.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      priority: a.priority,
      active: a.active,
      expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}

// POST /api/admin/announcements - Create announcement
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  // Rate limit: 20 requests per minute
  const rateLimit = checkRateLimit(`announcements-post:${auth.id}`, 20, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, content, priority, expiresAt } = body;

  // Validation
  if (!title || typeof title !== 'string' || title.length > 100) {
    return NextResponse.json(
      { error: 'Title is required and must be 100 characters or fewer' },
      { status: 400 }
    );
  }
  if (!content || typeof content !== 'string' || content.length > 500) {
    return NextResponse.json(
      { error: 'Content is required and must be 500 characters or fewer' },
      { status: 400 }
    );
  }

  const validPriorities = ['low', 'normal', 'high'];
  const announcementPriority =
    typeof priority === 'string' && validPriorities.includes(priority)
      ? priority
      : 'normal';

  const parsedExpiresAt =
    typeof expiresAt === 'string' ? new Date(expiresAt) : null;
  if (expiresAt && parsedExpiresAt && isNaN(parsedExpiresAt.getTime())) {
    return NextResponse.json(
      { error: 'Invalid expiresAt date format' },
      { status: 400 }
    );
  }

  const adminUser = await prisma.user.findUnique({ where: { id: auth.id } });
  const ip = getClientIp(request);
  const announcementId = crypto.randomUUID();

  const announcement = await prisma.announcement.create({
    data: {
      id: announcementId,
      title,
      content,
      author: adminUser?.fullName || adminUser?.email || 'Unknown',
      priority: announcementPriority,
      expiresAt: parsedExpiresAt,
    },
  });

  // Audit log
  try {
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        adminId: auth.id,
        adminName: adminUser?.fullName || adminUser?.email || 'Unknown',
        action: 'announcement_create',
        targetId: announcement.id,
        targetName: announcement.title,
        details: `Admin ${auth.id} created announcement "${announcement.title}" [IP: ${ip}]`,
      },
    });
  } catch (error) {
    // Audit log failure should not block the response
    if (process.env.NODE_ENV === 'development') {
      console.warn('Audit logging failed:', error);
    }
  }

  return NextResponse.json(
    {
      success: true,
      announcement: {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        active: announcement.active,
        expiresAt: announcement.expiresAt
          ? announcement.expiresAt.toISOString()
          : null,
        createdAt: announcement.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}

// PUT /api/admin/announcements - Update announcement
export async function PUT(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  // Rate limit: 20 requests per minute
  const rateLimit = checkRateLimit(`announcements-put:${auth.id}`, 20, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { id, title, content, priority, active, expiresAt } = body;

  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { error: 'Announcement ID is required' },
      { status: 400 }
    );
  }

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: 'Announcement not found' },
      { status: 404 }
    );
  }

  if (title !== undefined && (typeof title !== 'string' || title.length > 100)) {
    return NextResponse.json(
      { error: 'Title must be 100 characters or fewer' },
      { status: 400 }
    );
  }
  if (
    content !== undefined &&
    (typeof content !== 'string' || content.length > 500)
  ) {
    return NextResponse.json(
      { error: 'Content must be 500 characters or fewer' },
      { status: 400 }
    );
  }

  const validPriorities = ['low', 'normal', 'high'];
  if (priority !== undefined && !validPriorities.includes(priority as string)) {
    return NextResponse.json(
      { error: 'Priority must be low, normal, or high' },
      { status: 400 }
    );
  }

  let parsedExpiresAt: Date | null | undefined = undefined;
  if (expiresAt !== undefined) {
    if (expiresAt === null) {
      parsedExpiresAt = null;
    } else if (typeof expiresAt === 'string') {
      parsedExpiresAt = new Date(expiresAt);
      if (isNaN(parsedExpiresAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expiresAt date format' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid expiresAt value' },
        { status: 400 }
      );
    }
  }

  const adminUser = await prisma.user.findUnique({ where: { id: auth.id } });
  const ip = getClientIp(request);

  const announcement = await prisma.announcement.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(priority !== undefined && typeof priority === 'string' ? { priority } : {}),
      ...(active !== undefined && typeof active === 'boolean' ? { active } : {}),
      ...(parsedExpiresAt !== undefined ? { expiresAt: parsedExpiresAt } : {}),
    },
  });

  // Audit log
  try {
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        adminId: auth.id,
        adminName: adminUser?.fullName || adminUser?.email || 'Unknown',
        action: 'announcement_update',
        targetId: announcement.id,
        targetName: announcement.title,
        details: `Admin ${auth.id} updated announcement "${announcement.title}" [IP: ${ip}]`,
      },
    });
  } catch (error) {
    // Audit log failure should not block the response
    if (process.env.NODE_ENV === 'development') {
      console.warn('Audit logging failed:', error);
    }
  }

  return NextResponse.json({
    success: true,
    announcement: {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      active: announcement.active,
      expiresAt: announcement.expiresAt
        ? announcement.expiresAt.toISOString()
        : null,
      createdAt: announcement.createdAt.toISOString(),
    },
  });
}

// DELETE /api/admin/announcements - Delete announcement
export async function DELETE(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  // Rate limit: 20 requests per minute
  const rateLimit = checkRateLimit(
    `announcements-delete:${auth.id}`,
    20,
    60_000
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  let id: string | undefined;

  // Try to get id from query param first
  id = searchParams.get('id') || undefined;

  // If not in query, try to get from body
  if (!id) {
    try {
      const body = await request.json();
      id = body?.id;
    } catch {
      // No JSON body
    }
  }

  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { error: 'Announcement ID is required' },
      { status: 400 }
    );
  }

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: 'Announcement not found' },
      { status: 404 }
    );
  }

  const adminUser = await prisma.user.findUnique({ where: { id: auth.id } });
  const ip = getClientIp(request);

  await prisma.announcement.delete({ where: { id } });

  // Audit log
  try {
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        adminId: auth.id,
        adminName: adminUser?.fullName || adminUser?.email || 'Unknown',
        action: 'announcement_delete',
        targetId: id,
        targetName: existing.title,
        details: `Admin ${auth.id} deleted announcement "${existing.title}" [IP: ${ip}]`,
      },
    });
  } catch (error) {
    // Audit log failure should not block the response
    if (process.env.NODE_ENV === 'development') {
      console.warn('Audit logging failed:', error);
    }
  }

  return NextResponse.json({ success: true });
}
