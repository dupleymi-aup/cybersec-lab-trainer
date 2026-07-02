import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/api-middleware';
import { prisma } from '@/lib/db';

/**
 * GET /api/ctf-labs
 * List all CTF labs with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const difficulty = searchParams.get('difficulty');
    const type = searchParams.get('type');
    const showFlags = auth.role === 'admin';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };

    if (moduleId) where.moduleId = moduleId;
    if (difficulty) where.difficulty = difficulty;
    if (type) where.type = type;

    const labs = await prisma.ctfLab.findMany({
      where,
      include: {
        tags: true,
      },
      orderBy: { order: 'asc' },
    });

    // Hide flags for non-admin users
    const sanitizedLabs = labs.map(lab => ({
      ...lab,
      flag: showFlags ? lab.flag : undefined,
    }));

    return NextResponse.json(sanitizedLabs);
  } catch (error) {
    console.error('GET /api/ctf-labs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ctf-labs
 * Admin-only: Create a new CTF lab
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, moduleId, difficulty, type, points, isActive, order, instructions, hint, flag, tags } = body;

    if (!title || !moduleId || !difficulty || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, moduleId, difficulty, type' },
        { status: 400 }
      );
    }

    const lab = await prisma.ctfLab.create({
      data: {
        title,
        description: description || '',
        moduleId,
        difficulty,
        type,
        points: points || 100,
        isActive: isActive !== false,
        order: order || 0,
        instructions: instructions || '',
        hint: hint || '',
        flag: flag || '',
        tags: tags && tags.length > 0
          ? { create: tags.map((name: string) => ({ name })) }
          : undefined,
      },
      include: { tags: true },
    });

    return NextResponse.json(lab, { status: 201 });
  } catch (error) {
    console.error('POST /api/ctf-labs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
