import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import type { Announcement } from '@prisma/client';
import {
  authenticate,
  unauthorized,
  forbidden,
  requireCapability,
  checkRateLimit,
  getClientIp,
} from '@/lib/api-middleware';
import { createAnnouncementSchema, updateAnnouncementSchema } from '@/lib/validations/api';
import { logger } from '@/lib/logger';

// GET /api/admin/announcements - List all announcements
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireCapability(auth, 'announcements:read')) return forbidden();

    // Rate limit: 60 requests per minute
    const rateLimit = checkRateLimit(`announcements-get:${auth.id}`, 60, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests', retryAfter: rateLimit.retryAfter }, { status: 429 });
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

    const announcements = await getPrisma().announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      announcements: announcements.map((a: Announcement) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        priority: a.priority,
        active: a.active,
        expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.error('Failed to list announcements', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/announcements - Create announcement
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireCapability(auth, 'announcements:create')) return forbidden();

    // Rate limit: 20 requests per minute
    const rateLimit = checkRateLimit(`announcements-post:${auth.id}`, 20, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests', retryAfter: rateLimit.retryAfter }, { status: 429 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch (e) {
      logger.error('Invalid JSON body in announcements POST', {
        error: String(e),
      });
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = createAnnouncementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { title, content, priority = 'medium', expiresAt } = parsed.data;

    const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null;

    const adminUser = await getPrisma().user.findUnique({ where: { id: auth.id } });
    const ip = getClientIp(request);
    const announcementId = crypto.randomUUID();

    const announcement = await getPrisma().announcement.create({
      data: {
        id: announcementId,
        title,
        content,
        author: adminUser?.fullName || adminUser?.email || 'Unknown',
        priority: priority,
        expiresAt: parsedExpiresAt,
      },
    });

    // Audit log
    try {
      await getPrisma().auditLog.create({
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
      logger.warn('Audit logging failed', { error: String(error) });
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
          expiresAt: announcement.expiresAt ? announcement.expiresAt.toISOString() : null,
          createdAt: announcement.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error('Failed to create announcement', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/announcements - Update announcement
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireCapability(auth, 'announcements:edit')) return forbidden();

    // Rate limit: 20 requests per minute
    const rateLimit = checkRateLimit(`announcements-put:${auth.id}`, 20, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests', retryAfter: rateLimit.retryAfter }, { status: 429 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch (e) {
      logger.error('Invalid JSON body in announcements PUT', {
        error: String(e),
      });
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = updateAnnouncementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { id, title, content, priority, active, expiresAt } = parsed.data;

    const existing = await getPrisma().announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const parsedExpiresAt = expiresAt === null ? null : expiresAt !== undefined ? new Date(expiresAt) : undefined;

    const adminUser = await getPrisma().user.findUnique({ where: { id: auth.id } });
    const ip = getClientIp(request);

    const announcement = await getPrisma().announcement.update({
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
      await getPrisma().auditLog.create({
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
      logger.warn('Audit logging failed', { error: String(error) });
    }

    return NextResponse.json({
      success: true,
      announcement: {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        active: announcement.active,
        expiresAt: announcement.expiresAt ? announcement.expiresAt.toISOString() : null,
        createdAt: announcement.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to update announcement', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/announcements - Delete announcement
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireCapability(auth, 'announcements:delete')) return forbidden();

    // Rate limit: 20 requests per minute
    const rateLimit = checkRateLimit(`announcements-delete:${auth.id}`, 20, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests', retryAfter: rateLimit.retryAfter }, { status: 429 });
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
      } catch (e) {
        logger.error('Invalid JSON body in announcements DELETE', {
          error: String(e),
        });
        // No JSON body
      }
    }

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    const existing = await getPrisma().announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const adminUser = await getPrisma().user.findUnique({ where: { id: auth.id } });
    const ip = getClientIp(request);

    await getPrisma().announcement.delete({ where: { id } });

    // Audit log
    try {
      await getPrisma().auditLog.create({
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
      logger.warn('Audit logging failed', { error: String(error) });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete announcement', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
