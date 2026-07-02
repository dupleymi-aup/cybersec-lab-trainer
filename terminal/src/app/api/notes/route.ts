import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/api-middleware';
import { createNote, getUserNotes, searchNotes } from '@/lib/notes-utils';
import { z } from 'zod';

const createNoteSchema = z.object({
  itemId: z.string().min(1),
  moduleId: z.string().min(1),
  moduleName: z.string().min(1),
  content: z.string().min(1).max(2000),
});

/**
 * GET /api/notes
 * Get all notes for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const itemId = searchParams.get('itemId');
    const search = searchParams.get('search');

    let notes;

    if (search) {
      notes = await searchNotes(auth.id, search);
    } else if (moduleId) {
      const { getModuleNotes } = await import('@/lib/notes-utils');
      notes = await getModuleNotes(auth.id, moduleId);
    } else if (itemId) {
      const { getItemNotes } = await import('@/lib/notes-utils');
      notes = await getItemNotes(auth.id, itemId);
    } else {
      notes = await getUserNotes(auth.id);
    }

    return NextResponse.json(notes);
  } catch (error) {
    console.error('GET /api/notes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notes
 * Create a new note
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createNoteSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const note = await createNote({
      userId: auth.id,
      ...validated.data,
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('POST /api/notes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
