'use client';

import { useState, useEffect } from 'react';
import {
  type UserRole,
  getRoleLabel,
  bulkDeleteUsers,
  bulkChangeRole,
  bulkToggleBlock,
  assignUsersToGroup,
  getAllGroups,
} from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, Shield, Ban, CheckCircle, X, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface BulkActionsBarProps {
  selectedIds: string[];
  currentUserId: string;
  onDone: () => void;
}

export default function BulkActionsBar({ selectedIds, currentUserId, onDone }: BulkActionsBarProps) {
  const t = useTranslations('bulkActionsBar');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [newGroupInput, setNewGroupInput] = useState('');
  const [groups, setGroups] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    getAllGroups()
      .then((g) => {
        setGroups(g);
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development')
          logger.error('BulkActionsBar failed to load groups', { error: err });
      });
    return () => {
      controller.abort();
    };
  }, []);

  const handleBulkDelete = async () => {
    if (!confirm(t('deleteConfirm', { count: selectedIds.length }))) return;
    const result = await bulkDeleteUsers(selectedIds, currentUserId);
    if (result.success) {
      toast.success(t('deleted', { count: result.count }));
      onDone();
    } else {
      toast.error(result.error);
    }
  };

  const handleBulkRoleChange = async (role: UserRole) => {
    const result = await bulkChangeRole(selectedIds, role);
    if (result.success) {
      toast.success(t('roleChanged', { count: result.count }));
      setShowRolePicker(false);
      onDone();
    }
  };

  const handleBulkBlock = async (blocked: boolean) => {
    const result = await bulkToggleBlock(selectedIds, currentUserId, blocked);
    if (result.success) {
      toast.success(blocked ? t('blocked', { count: result.count }) : t('unblocked', { count: result.count }));
      onDone();
    } else {
      toast.error(result.error);
    }
  };

  const handleGroupAssign = async (groupName: string) => {
    if (!groupName.trim()) {
      toast.error(t('enterGroupName'));
      return;
    }
    const result = await assignUsersToGroup(selectedIds, groupName);
    if (result.success) {
      toast.success(t('groupAssigned', { name: groupName.trim(), count: result.count }));
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
          className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
        >
          <div className="flex items-center gap-4 rounded-xl bg-slate-900 px-5 py-3 text-white shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                {selectedIds.length}
              </span>
              <span className="text-sm">{t('selected')}</span>
            </div>

            <div className="h-6 w-px bg-slate-700" />

            {/* Role change */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:bg-slate-800 hover:text-white dark:bg-slate-700"
                onClick={() => setShowRolePicker(!showRolePicker)}
              >
                <Shield size={14} className="mr-1" /> {t('role')}
              </Button>
              {showRolePicker && (
                <div className="bg-card absolute bottom-full left-0 mb-2 min-w-[160px] rounded-lg p-1 shadow-xl">
                  {(['student', 'teacher', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleBulkRoleChange(r)}
                      className="text-foreground/70 hover:bg-muted w-full rounded-md px-3 py-1.5 text-left text-sm"
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
              className="text-amber-400 hover:bg-slate-800 hover:text-amber-300 dark:bg-slate-700"
              onClick={() => handleBulkBlock(true)}
            >
              <Ban size={14} className="mr-1" /> {t('block')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 dark:bg-slate-700"
              onClick={() => handleBulkBlock(false)}
            >
              <CheckCircle size={14} className="mr-1" /> {t('unblock')}
            </Button>

            {/* Group assignment */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="text-sky-400 hover:bg-slate-800 hover:text-sky-300 dark:bg-slate-700"
                onClick={() => setShowGroupPicker(!showGroupPicker)}
              >
                <Users size={14} className="mr-1" /> {t('group')}
              </Button>
              {showGroupPicker && (
                <div className="bg-card absolute bottom-full left-0 mb-2 min-w-[220px] rounded-lg p-2 shadow-xl">
                  <div className="space-y-1">
                    {groups.map((g) => (
                      <button
                        key={g}
                        onClick={() => handleGroupAssign(g)}
                        className="text-foreground/70 hover:bg-muted w-full rounded-md px-3 py-1.5 text-left text-sm"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <div className="border-border mt-1 border-t pt-1">
                    <div className="flex gap-1">
                      <Input
                        value={newGroupInput}
                        onChange={(e) => setNewGroupInput(e.target.value)}
                        placeholder={t('newGroup')}
                        className="h-7 text-xs"
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
              className="text-red-400 hover:bg-slate-800 hover:text-red-300 dark:bg-slate-700"
              onClick={handleBulkDelete}
            >
              <Trash2 size={14} className="mr-1" /> {t('delete')}
            </Button>

            {/* Clear selection */}
            <div className="h-6 w-px bg-slate-700" />
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:bg-slate-800 hover:text-white dark:bg-slate-700"
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
