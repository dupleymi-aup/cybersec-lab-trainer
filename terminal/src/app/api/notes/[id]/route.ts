import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/api-middleware';
import { getNoteById, updateNote, deleteNote } from '@/lib/notes-utils';
import { z } from 'zod';

const updateNoteSchema = z.object({
  content: z.string().min(1).max(2000),
});

/**
 * GET /api/notes/[id]
 * Get a specific note by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const note = await getNoteById((await params).id);

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Ensure the note belongs to the user
    if (note.userId !== auth.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('GET /api/notes/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notes/[id]
 * Update a note
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateNoteSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const note = await getNoteById((await params).id);

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Ensure the note belongs to the user
    if (note.userId !== auth.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedNote = await updateNote((await params).id, auth.id, validated.data);

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('PUT /api/notes/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notes/[id]
 * Delete a note
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const note = await getNoteById((await params).id);

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Ensure the note belongs to the user
    if (note.userId !== auth.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteNote((await params).id, auth.id);

    return NextResponse.json({ message: 'Note deleted' });
  } catch (error) {
    console.error('DELETE /api/notes/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
