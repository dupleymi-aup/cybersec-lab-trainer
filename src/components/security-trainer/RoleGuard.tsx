'use client';

import { useAuthStore, type UserRole, hasRole, getRoleLabel } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface RoleGuardProps {
  requiredRole: UserRole;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export default function RoleGuard({ requiredRole, fallback, children }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  if (!user || !hasRole(user.role, requiredRole)) {
    if (fallback) return <>{fallback}</>;
    return (
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="p-8 text-center">
          <Shield size={48} className="mx-auto mb-4 text-amber-400" />
          <h2 className="mb-2 text-xl font-bold text-amber-800 dark:text-amber-300">Доступ ограничен</h2>
          <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">
            Для доступа к этой странице требуется роль: <strong>{getRoleLabel(requiredRole)}</strong>
          </p>
          <Button
            onClick={() => setCurrentPage('dashboard')}
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <ArrowLeft size={16} className="mr-2" />
            На главную
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
