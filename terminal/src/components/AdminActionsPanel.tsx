'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  User,
  Clock,
  Activity,
} from 'lucide-react';

interface AdminAction {
  id: string;
  adminId: string;
  admin: { id: string; fullName: string; email: string };
  actionType: string;
  targetType: string;
  targetId: string;
  targetName: string;
  details: string;
  metadata: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

interface AdminActionsData {
  actions: AdminAction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function AdminActionsPanel() {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchActions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (actionTypeFilter) params.append('actionType', actionTypeFilter);
      if (targetTypeFilter) params.append('targetType', targetTypeFilter);

      const response = await fetch(`/api/admin-actions?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data: AdminActionsData = await response.json();
        setActions(data.actions);
        setTotalPages(data.pagination.totalPages);
      }
    } catch {
      toast.error('Не удалось загрузить список действий');
    } finally {
      setLoading(false);
    }
  }, [page, actionTypeFilter, targetTypeFilter]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const getActionBadgeColor = (actionType: string) => {
    if (actionType.includes('create')) return 'bg-green-500';
    if (actionType.includes('delete')) return 'bg-red-500';
    if (actionType.includes('change') || actionType.includes('update')) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getTargetTypeBadge = (targetType: string) => {
    const colors: Record<string, string> = {
      user: 'bg-purple-500',
      assignment: 'bg-indigo-500',
      deadline: 'bg-orange-500',
      announcement: 'bg-yellow-500',
    };
    return colors[targetType] || 'bg-gray-500';
  };

  const filteredActions = searchQuery
    ? actions.filter(
        a =>
          a.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.details.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : actions;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или деталям..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={actionTypeFilter}
          onChange={(e) => {
            setActionTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-md border bg-background"
        >
          <option value="">Все действия</option>
          <option value="user_create">User Create</option>
          <option value="user_delete">User Delete</option>
          <option value="role_change">Role Change</option>
          <option value="user_blocked">User Blocked</option>
          <option value="bulk_import">Bulk Import</option>
          <option value="bulk_export">Bulk Export</option>
        </select>
        <select
          value={targetTypeFilter}
          onChange={(e) => {
            setTargetTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-md border bg-background"
        >
          <option value="">Все типы целей</option>
          <option value="user">User</option>
          <option value="assignment">Assignment</option>
          <option value="deadline">Deadline</option>
          <option value="announcement">Announcement</option>
        </select>
        <Button onClick={fetchActions} variant="outline" size="sm">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Actions List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
      ) : filteredActions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Действий не найдено</div>
      ) : (
        <div className="space-y-2">
          {filteredActions.map((action) => (
            <Card key={action.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getActionBadgeColor(action.actionType)}>
                        {action.actionType}
                      </Badge>
                      <Badge variant="outline" className={getTargetTypeBadge(action.targetType)}>
                        {action.targetType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{action.admin.fullName}</span>
                      <span className="text-muted-foreground">
                        выполнил действие с{' '}
                        <span className="font-medium">{action.targetName || action.targetId}</span>
                      </span>
                    </div>
                    {action.details && (
                      <p className="text-sm text-muted-foreground mt-1">{action.details}</p>
                    )}
                    {action.metadata && (
                      <pre className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
                        {action.metadata}
                      </pre>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {new Date(action.createdAt).toLocaleString('ru-RU')}
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-1 text-xs">
                      <Activity className="w-3 h-3" />
                      {action.ip}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="outline"
          >
            Назад
          </Button>
          <span className="px-4 py-2">
            Стр. {page} из {totalPages}
          </span>
          <Button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            variant="outline"
          >
            Вперёд
          </Button>
        </div>
      )}
    </div>
  );
}
