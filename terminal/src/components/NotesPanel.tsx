'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Save,
  X,
  Bookmark,
  Loader2,
} from 'lucide-react';

interface Note {
  id: string;
  content: string;
  moduleId: string;
  itemId: string;
  moduleName: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesPanelProps {
  moduleId?: string;
  itemId?: string;
  moduleName?: string;
}

export function NotesPanel({ moduleId, itemId, moduleName }: NotesPanelProps) {
  const { user } = useAuthStore();
  const [searchInput, setSearchInput] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);

  const queryClient = useQueryClient();

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (moduleId) params.append('moduleId', moduleId);
    if (itemId) params.append('itemId', itemId);
    if (submittedSearch) params.append('search', submittedSearch);
    return params.toString();
  }, [moduleId, itemId, submittedSearch]);

  const queryKey = ['notes', searchParams] as const;

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/notes?${searchParams}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to fetch notes');
      return res.json();
    },
    enabled: !!user,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newNoteContent.trim() || !user) throw new Error('No content');
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNoteContent,
          moduleId: moduleId || '',
          itemId: itemId || '',
          moduleName: moduleName || '',
        }),
      });
      if (!res.ok) throw new Error('Failed to create note');
      return res.json() as Promise<Note>;
    },
    onSuccess: () => {
      invalidate();
      setNewNoteContent('');
      setShowNewNoteForm(false);
    },
    onError: () => toast.error('Не удалось создать заметку'),
  });

  const updateMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error('Failed to update note');
      return res.json() as Promise<Note>;
    },
    onSuccess: () => {
      invalidate();
      setEditingNote(null);
    },
    onError: () => toast.error('Не удалось обновить заметку'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to delete note');
    },
    onSuccess: () => invalidate(),
    onError: () => toast.error('Не удалось удалить заметку'),
  });

  const handleSearch = useCallback(() => {
    setSubmittedSearch(searchInput);
  }, [searchInput]);

  const filteredNotes = moduleId
    ? notes.filter(n => n.moduleId === moduleId)
    : itemId
    ? notes.filter(n => n.itemId === itemId)
    : notes;

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Войдите, чтобы видеть заметки
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bookmark className="w-5 h-5" />
          Заметки
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск заметок..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
              onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} variant="outline" size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* New Note Form */}
        {showNewNoteForm && (
          <div className="mb-4 space-y-2">
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Новая заметка..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              maxLength={2000}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={() => createMutation.mutate()} size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Сохранить
              </Button>
              <Button
                onClick={() => { setShowNewNoteForm(false); setNewNoteContent(''); }}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {newNoteContent.length}/2000 символов
            </p>
          </div>
        )}

        {!showNewNoteForm && (
          <Button onClick={() => setShowNewNoteForm(true)} className="mb-4" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Новая заметка
          </Button>
        )}

        {/* Notes List */}
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">
            Загрузка...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {submittedSearch ? 'Заметок не найдено' : 'Пока нет заметок'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="p-4">
                {editingNote === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      maxLength={2000}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateMutation.mutate(note.id)}
                        size="sm"
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                        Сохранить
                      </Button>
                      <Button onClick={() => setEditingNote(null)} variant="outline" size="sm">
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        {note.moduleName && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {note.moduleName}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          onClick={() => { setEditingNote(note.id); setEditContent(note.content); }}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => deleteMutation.mutate(note.id)}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
