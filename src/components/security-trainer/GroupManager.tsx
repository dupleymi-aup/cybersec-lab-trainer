'use client';

import { useState, useEffect } from 'react';
import { getAllGroups, renameGroup, deleteGroup, getAllUsers } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Pencil, Trash2, Users, Plus, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface GroupManagerProps {
  onRefresh: () => void;
}

export default function GroupManager({ onRefresh }: GroupManagerProps) {
  const t = useTranslations('admin.groupManager');
  const tc = useTranslations('common');
  const [groups, setGroups] = useState<string[]>([]);
  const [groupCounts, setGroupCounts] = useState<Record<string, number>>({});
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  const loadData = async () => {
    const allGroups = await getAllGroups();
    setGroups(allGroups);
    const users = await getAllUsers();
    const counts: Record<string, number> = {};
    for (const g of allGroups) {
      counts[g] = users.filter((u) => u.group === g).length;
    }
    setGroupCounts(counts);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRename = async (oldName: string) => {
    if (!editValue.trim()) {
      toast.error(t('emptyName'));
      return;
    }
    const result = await renameGroup(oldName, editValue);
    if (result.success) {
      toast.success(`Группа переименована, ${result.count} пользователей обновлено`);
      setEditingGroup(null);
      setEditValue('');
      loadData();
      onRefresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async (name: string) => {
    const count = groupCounts[name] || 0;
    if (!confirm(`Удалить группу "${name}"? ${count} пользователей потеряют привязку к группе.`)) return;
    const result = await deleteGroup(name);
    if (result.success) {
      toast.success(`Группа удалена, ${result.count} пользователей отвязано`);
      loadData();
      onRefresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleCreate = () => {
    if (!newGroupName.trim()) {
      toast.error(t('enterName'));
      return;
    }
    if (groups.includes(newGroupName.trim())) {
      toast.error(t('groupExists'));
      return;
    }
    toast.success(`Группа "${newGroupName.trim()}" создана. Назначьте пользователей через массовые действия.`);
    setNewGroupName('');
    loadData();
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Create new group */}
      <Card className="border-border">
        <CardContent className="p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Plus size={14} className="text-emerald-500" /> {tc('create')}
          </h3>
          <div className="flex gap-2">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder={t('enterName')}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate} size="sm">
              <Plus size={14} className="mr-1" /> {tc('create')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Groups list */}
      <Card className="border-border">
        <CardContent className="p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Users size={14} className="text-sky-500" /> Группы ({groups.length})
          </h3>

          {groups.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Нет групп. Назначьте пользователям поле «Группа» или создайте группу выше.
            </p>
          ) : (
            <div className="space-y-2">
              {groups.map((name) => (
                <div
                  key={name}
                  className="hover:border-border flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-colors"
                >
                  {editingGroup === name ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(name);
                          if (e.key === 'Escape') {
                            setEditingGroup(null);
                            setEditValue('');
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRename(name)}
                        className="text-emerald-600"
                        aria-label="Confirm rename"
                      >
                        <Check size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingGroup(null);
                          setEditValue('');
                        }}
                        aria-label="Cancel rename"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
                          <Users size={16} className="text-sky-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{name}</p>
                          <p className="text-muted-foreground text-xs">{groupCounts[name] || 0} пользователей</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingGroup(name);
                            setEditValue(name);
                          }}
                          className="text-muted-foreground hover:text-emerald-700"
                          aria-label="Edit group"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(name)}
                          className="text-muted-foreground hover:text-red-700"
                          aria-label="Delete group"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-secondary border-border rounded-lg border p-3">
        <p className="text-muted-foreground text-xs">
          <strong>Совет:</strong> Для назначения пользователей в группу выберите их в списке пользователей и используйте
          кнопку «Назначить группу» в панели массовых действий.
        </p>
      </div>
    </div>
  );
}
