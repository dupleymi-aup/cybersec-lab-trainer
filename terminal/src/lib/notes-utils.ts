/**
 * Notes utilities - utility functions for managing user notes
 */

import { prisma } from './db';

export interface Note {
  id: string;
  userId: string;
  itemId: string;
  moduleId: string;
  moduleName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteInput {
  userId: string;
  itemId: string;
  moduleId: string;
  moduleName: string;
  content: string;
}

export interface UpdateNoteInput {
  content: string;
}

/**
 * Create a new note
 */
export async function createNote(input: CreateNoteInput): Promise<Note> {
  const note = await prisma.note.create({
    data: {
      userId: input.userId,
      itemId: input.itemId,
      moduleId: input.moduleId,
      moduleName: input.moduleName,
      content: input.content,
    },
  });

  return note;
}

/**
 * Get a note by ID
 */
export async function getNoteById(noteId: string): Promise<Note | null> {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
  });

  return note;
}

/**
 * Get all notes for a user
 */
export async function getUserNotes(userId: string): Promise<Note[]> {
  const notes = await prisma.note.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  return notes;
}

/**
 * Get notes for a specific module
 */
export async function getModuleNotes(userId: string, moduleId: string): Promise<Note[]> {
  const notes = await prisma.note.findMany({
    where: {
      userId,
      moduleId,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return notes;
}

/**
 * Get notes for a specific item
 */
export async function getItemNotes(userId: string, itemId: string): Promise<Note[]> {
  const notes = await prisma.note.findMany({
    where: {
      userId,
      itemId,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return notes;
}

/**
 * Update a note
 */
export async function updateNote(
  noteId: string,
  userId: string,
  input: UpdateNoteInput
): Promise<Note> {
  const note = await prisma.note.update({
    where: { id: noteId },
    data: {
      content: input.content,
    },
  });

  return note;
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string, userId: string): Promise<Note> {
  const note = await prisma.note.delete({
    where: {
      id: noteId,
      userId,
    },
  });

  return note;
}

/**
 * Search notes by content
 */
export async function searchNotes(userId: string, query: string): Promise<Note[]> {
  if (!query.trim()) {
    return getUserNotes(userId);
  }

  const notes = await prisma.note.findMany({
    where: {
      userId,
      OR: [
        { content: { contains: query } },
        { moduleName: { contains: query } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
  });

  return notes;
}

/**
 * Get notes statistics for a user
 */
export interface NotesStats {
  totalNotes: number;
  notesByModule: Record<string, number>;
  recentNotes: Note[];
}

export async function getNotesStats(userId: string): Promise<NotesStats> {
  const allNotes = await getUserNotes(userId);

  const totalNotes = allNotes.length;
  const notesByModule: Record<string, number> = {};
  const recentNotes = allNotes.slice(0, 10);

  for (const note of allNotes) {
    notesByModule[note.moduleName] = (notesByModule[note.moduleName] || 0) + 1;
  }

  return {
    totalNotes,
    notesByModule,
    recentNotes,
  };
}
