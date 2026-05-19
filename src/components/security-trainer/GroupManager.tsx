'use client';

import { useState, useEffect } from 'react';
import { getAllGroups, renameGroup, deleteGroup, getAllUsers } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Pencil, Trash2, Users, Plus, Check, X } from 'lucide-react';

interface GroupManagerProps {
  adminId: string;
  onRefresh: () => void;
}

export default function GroupManager({ adminId, onRefresh }: GroupManagerProps) {
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
    if (!editValue.trim()) { toast.error('Название не может быть пустым'); return; }
    const result = await renameGroup(oldName, editValue, adminId);
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
    const result = await deleteGroup(name, adminId);
    if (result.success) {
      toast.success(`Группа удалена, ${result.count} пользователей отвязано`);
      loadData();
      onRefresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleCreate = () => {
    if (!newGroupName.trim()) { toast.error('Введите название группы'); return; }
    if (groups.includes(newGroupName.trim())) { toast.error('Группа уже существует'); return; }
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
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Plus size={14} className="text-emerald-500" /> Создать группу
          </h3>
          <div className="flex gap-2">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Название группы (например, ИС-101)"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate} size="sm">
              <Plus size={14} className="mr-1" /> Создать
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Groups list */}
      <Card className="border-border">
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Users size={14} className="text-sky-500" /> Группы ({groups.length})
          </h3>

          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Нет групп. Назначьте пользователям поле «Группа» или создайте группу выше.
            </p>
          ) : (
            <div className="space-y-2">
              {groups.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-border transition-colors"
                >
                  {editingGroup === name ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(name);
                          if (e.key === 'Escape') { setEditingGroup(null); setEditValue(''); }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRename(name)}
                        className="text-emerald-600"
                      >
                        <Check size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingGroup(null); setEditValue(''); }}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                          <Users size={16} className="text-sky-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{name}</p>
                          <p className="text-xs text-muted-foreground">{groupCounts[name] || 0} пользователей</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditingGroup(name); setEditValue(name); }}
                          className="text-muted-foreground hover:text-emerald-700"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(name)}
                          className="text-muted-foreground hover:text-red-700"
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

      <div className="p-3 bg-secondary border border-border rounded-lg">
        <p className="text-xs text-muted-foreground">
          <strong>Совет:</strong> Для назначения пользователей в группу выберите их в списке пользователей и используйте кнопку «Назначить группу» в панели массовых действий.
        </p>
      </div>
    </div>
  );
}
