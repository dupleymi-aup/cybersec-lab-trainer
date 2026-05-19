'use client';

import { useState, useEffect } from 'react';
import { UserRole, getRoleLabel, bulkDeleteUsers, bulkChangeRole, bulkToggleBlock, assignUsersToGroup, getAllGroups } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, Shield, Ban, CheckCircle, X, Users } from 'lucide-react';
import { toast } from 'sonner';

interface BulkActionsBarProps {
  selectedIds: string[];
  currentUserId: string;
  onDone: () => void;
}

export default function BulkActionsBar({ selectedIds, currentUserId, onDone }: BulkActionsBarProps) {
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [newGroupInput, setNewGroupInput] = useState('');
  const [groups, setGroups] = useState<string[]>([]);

  useEffect(() => {
    getAllGroups().then(setGroups);
  }, []);

  const handleBulkDelete = async () => {
    if (!confirm(`Удалить ${selectedIds.length} пользователей?`)) return;
    const result = await bulkDeleteUsers(selectedIds, currentUserId);
    if (result.success) {
      toast.success(`Удалено: ${result.count}`);
      onDone();
    } else {
      toast.error(result.error);
    }
  };

  const handleBulkRoleChange = async (role: UserRole) => {
    const result = await bulkChangeRole(selectedIds, role);
    if (result.success) {
      toast.success(`Роль изменена у ${result.count} пользователей`);
      setShowRolePicker(false);
      onDone();
    }
  };

  const handleBulkBlock = async (blocked: boolean) => {
    const result = await bulkToggleBlock(selectedIds, currentUserId, blocked);
    if (result.success) {
      toast.success(blocked ? `Заблокировано: ${result.count}` : `Разблокировано: ${result.count}`);
      onDone();
    } else {
      toast.error(result.error);
    }
  };

  const handleGroupAssign = async (groupName: string) => {
    if (!groupName.trim()) { toast.error('Введите название группы'); return; }
    const result = await assignUsersToGroup(selectedIds, groupName, currentUserId);
    if (result.success) {
      toast.success(`Группа "${groupName.trim()}" назначена ${result.count} пользователям`);
      setShowGroupPicker(false);
      setNewGroupInput('');
      onDone();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <AnimatePresence>
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="bg-slate-900 text-white rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                {selectedIds.length}
              </span>
              <span className="text-sm">выбрано</span>
            </div>

            <div className="w-px h-6 bg-slate-700" />

            {/* Role change */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800 dark:bg-slate-700"
                onClick={() => setShowRolePicker(!showRolePicker)}
              >
                <Shield size={14} className="mr-1" /> Роль
              </Button>
              {showRolePicker && (
                <div className="absolute bottom-full mb-2 left-0 bg-card rounded-lg shadow-xl p-1 min-w-[160px]">
                  {(['student', 'teacher', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleBulkRoleChange(r)}
                      className="w-full text-left px-3 py-1.5 text-sm text-foreground/70 hover:bg-muted rounded-md"
                    >
                      {getRoleLabel(r)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Block/Unblock */}
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-400 hover:text-amber-300 hover:bg-slate-800 dark:bg-slate-700"
              onClick={() => handleBulkBlock(true)}
            >
              <Ban size={14} className="mr-1" /> Блокировать
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 dark:bg-slate-700"
              onClick={() => handleBulkBlock(false)}
            >
              <CheckCircle size={14} className="mr-1" /> Разблокировать
            </Button>

            {/* Group assignment */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="text-sky-400 hover:text-sky-300 hover:bg-slate-800 dark:bg-slate-700"
                onClick={() => setShowGroupPicker(!showGroupPicker)}
              >
                <Users size={14} className="mr-1" /> Группа
              </Button>
              {showGroupPicker && (
                <div className="absolute bottom-full mb-2 left-0 bg-card rounded-lg shadow-xl p-2 min-w-[220px]">
                  <div className="space-y-1">
                    {groups.map((g) => (
                      <button
                        key={g}
                        onClick={() => handleGroupAssign(g)}
                        className="w-full text-left px-3 py-1.5 text-sm text-foreground/70 hover:bg-muted rounded-md"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border mt-1 pt-1">
                    <div className="flex gap-1">
                      <Input
                        value={newGroupInput}
                        onChange={(e) => setNewGroupInput(e.target.value)}
                        placeholder="Новая группа..."
                        className="text-xs h-7"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleGroupAssign(newGroupInput);
                        }}
                      />
                      <Button size="sm" className="h-7 px-2" onClick={() => handleGroupAssign(newGroupInput)}>
                        OK
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Delete */}
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-slate-800 dark:bg-slate-700"
              onClick={handleBulkDelete}
            >
              <Trash2 size={14} className="mr-1" /> Удалить
            </Button>

            {/* Clear selection */}
            <div className="w-px h-6 bg-slate-700" />
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800 dark:bg-slate-700"
              onClick={onDone}
            >
              <X size={14} />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
