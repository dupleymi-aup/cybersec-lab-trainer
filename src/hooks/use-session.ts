'use client';

import { useAuthStore } from '@/lib/auth-store';
import { useAppStore } from '@/lib/store';
import { useCallback } from 'react';

/**
 * Hook providing session state and helpers.
 * Bridges useAuthStore with useAppStore for unified session management.
 */
export function useSession() {
  const { user, isAuthenticated, login, logout, register } = useAuthStore();
  const { setUserId, loadFromDatabase, syncWithDatabase } = useAppStore();

  /** Set the session user ID and trigger progress load from DB */
  const setSessionUserId = useCallback((userId: string | null) => {
    setUserId(userId);
    if (userId) {
      loadFromDatabase(userId);
    }
  }, [setUserId, loadFromDatabase]);

  /** Login and sync progress */
  const loginAndSync = useCallback(async (emailOrPhone: string, password: string, rememberMe?: boolean) => {
    const result = await login(emailOrPhone, password, rememberMe);
    if (result.success) {
      // Use getState() to get the updated user after login() set it
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.id) {
        setSessionUserId(currentUser.id);
      }
    }
    return result;
  }, [login, setSessionUserId]);

  /** Logout and clear session state */
  const logoutAndClear = useCallback(() => {
    logout();
    setSessionUserId(null);
  }, [logout, setSessionUserId]);

  return {
    user,
    isAuthenticated,
    login: loginAndSync,
    logout: logoutAndClear,
    register,
    sync: syncWithDatabase,
  };
}
