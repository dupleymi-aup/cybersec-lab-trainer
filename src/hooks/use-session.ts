"use client";

import { useAuthStore } from "@/lib/auth-store";
import { useAppStore } from "@/lib/store";
import { useCallback } from "react";

/**
 * Hook providing session state and helpers.
 * Bridges useAuthStore with useAppStore for unified session management.
 */
export function useSession() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const register = useAuthStore((s) => s.register);
  const setUserId = useAppStore((s) => s.setUserId);
  const loadFromDatabase = useAppStore((s) => s.loadFromDatabase);
  const syncWithDatabase = useAppStore((s) => s.syncWithDatabase);

  /** Set the session user ID and trigger progress load from DB */
  const setSessionUserId = useCallback(
    (userId: string | null) => {
      setUserId(userId);
      if (userId) {
        loadFromDatabase(userId);
      }
    },
    [setUserId, loadFromDatabase],
  );

  /** Login and sync progress */
  const loginAndSync = useCallback(
    async (emailOrPhone: string, password: string, rememberMe?: boolean) => {
      const result = await login(emailOrPhone, password, rememberMe);
      if (result.success) {
        // login() already calls loadFromDatabase internally, so just set the userId
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.id) {
          setUserId(currentUser.id);
        }
      }
      return result;
    },
    [login, setUserId],
  );

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
