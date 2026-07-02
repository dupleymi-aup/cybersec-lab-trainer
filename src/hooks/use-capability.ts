import { useAuthStore } from "@/lib/auth-store";
import {
  hasCapability,
  hasAnyCapability,
  hasCapabilities,
  type Capability,
} from "@/lib/capabilities";
import type { UserRole } from "@/lib/auth-types";

/**
 * React hook for client-side capability checks.
 * Ties into the auth store to get the current user's role.
 *
 * Usage:
 *   const { can } = useCapability();
 *   if (can('assignments:grade')) { ... }
 *
 *   // Multiple capabilities (ALL required)
 *   if (canAll('assignments:grade', 'deadlines:create')) { ... }
 *
 *   // Multiple capabilities (ANY required)
 *   if (canAny('assignments:grade', 'assignments:create')) { ... }
 */
export function useCapability() {
  const role = useAuthStore((s) => s.user?.role as UserRole | undefined);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return {
    /** Whether the current user has a specific capability */
    can(capability: Capability): boolean {
      if (!isAuthenticated || !role) return false;
      return hasCapability(role, capability);
    },

    /** Whether the current user has ALL of the specified capabilities */
    canAll(...capabilities: Capability[]): boolean {
      if (!isAuthenticated || !role) return false;
      return hasCapabilities(role, ...capabilities);
    },

    /** Whether the current user has ANY of the specified capabilities */
    canAny(...capabilities: Capability[]): boolean {
      if (!isAuthenticated || !role) return false;
      return hasAnyCapability(role, ...capabilities);
    },

    /** Current user's role (for role-based checks) */
    role,

    /** Whether user is authenticated */
    isAuthenticated,
  };
}
