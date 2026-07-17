import type { UserRole } from './auth-types';

// ─── Capability Definitions ──────────────────────────────────
// Pattern: resource:action
// Resources define WHAT can be accessed, actions define HOW

export const CAPABILITIES = {
  // Modules — learning content
  'modules:read': 'Read learning modules',
  'modules:read_all': 'Read all modules (including hidden)',

  // Quizzes
  'quizzes:take': 'Take quizzes and tests',
  'quizzes:read_results': 'View quiz results',
  'quizzes:read_all_results': 'View all quiz results',

  // Progress
  'progress:read_own': 'View own progress',
  'progress:write_own': 'Update own progress',
  'progress:read_group': 'View group student progress',
  'progress:read_all': 'View all student progress',

  // Assignments
  'assignments:read_own': 'View own assignments',
  'assignments:submit': 'Submit assignments',
  'assignments:create': 'Create assignments',
  'assignments:edit': 'Edit assignments',
  'assignments:delete': 'Delete assignments',
  'assignments:grade': 'Grade assignments',
  'assignments:read_all': 'View all assignments',

  // Deadlines
  'deadlines:read': 'View deadlines',
  'deadlines:create': 'Create deadlines',
  'deadlines:edit': 'Edit deadlines',
  'deadlines:delete': 'Delete deadlines',

  // Analytics
  'analytics:read_own': 'View own analytics',
  'analytics:read_group': 'View group analytics',
  'analytics:read_all': 'View all analytics',

  // Grade export
  'grades:export': 'Export grades',

  // User management
  'users:read': 'View users',
  'users:create': 'Create users',
  'users:edit': 'Edit users',
  'users:delete': 'Delete users',
  'users:block': 'Block/unblock users',
  'users:change_role': 'Change roles',
  'users:import': 'Import users',
  'users:export': 'Export users',
  'users:bulk_ops': 'Bulk operations (delete, block, role change)',

  // Profile
  'profile:read_own': 'View own profile',
  'profile:write_own': 'Edit own profile',
  'profile:delete_own': 'Delete own account',
  'profile:read_any': 'View any profile',

  // Impersonation
  'auth:impersonate': 'Impersonation (login as another user)',

  // Audit
  'audit:read': 'View audit logs',

  // Announcements
  'announcements:read': 'Read announcements',
  'announcements:create': 'Create announcements',
  'announcements:edit': 'Edit announcements',
  'announcements:delete': 'Delete announcements',

  // LTI
  'lti:manage': 'Manage LTI integration',

  // System
  'system:health': 'View system health',
  'system:settings': 'Manage system settings',
  'system:reports': 'Manage scheduled reports',

  // Leaderboard
  'leaderboard:read': 'View leaderboard',

  // Career
  'career:read': 'View career paths',

  // ═══ Compound / Shortcut capabilities ═══
  // These expand to multiple capabilities for convenience
  'assignments:manage': 'Full assignment management (create+edit+delete+grade)',
} as const;

export type Capability = keyof typeof CAPABILITIES;

// ─── Role → Capability Mapping ───────────────────────────────

export const ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  student: [
    'modules:read',
    'quizzes:take',
    'quizzes:read_results',
    'progress:read_own',
    'progress:write_own',
    'assignments:read_own',
    'assignments:submit',
    'deadlines:read',
    'analytics:read_own',
    'profile:read_own',
    'profile:write_own',
    'profile:delete_own',
    'announcements:read',
    'leaderboard:read',
    'career:read',
  ],

  teacher: [
    // Full student access
    'modules:read',
    'quizzes:take',
    'quizzes:read_results',
    'quizzes:read_all_results',
    'progress:read_own',
    'progress:write_own',
    'progress:read_group',
    'assignments:read_own',
    'assignments:submit',
    'assignments:create',
    'assignments:edit',
    'assignments:grade',
    'assignments:read_all',
    'deadlines:read',
    'deadlines:create',
    'deadlines:edit',
    'deadlines:delete',
    'analytics:read_own',
    'analytics:read_group',
    'grades:export',
    'profile:read_own',
    'profile:write_own',
    'profile:delete_own',
    'profile:read_any',
    'announcements:read',
    'announcements:create',
    'leaderboard:read',
    'career:read',
  ],

  admin: [
    // ═══ Admin gets ALL capabilities ═══
    'modules:read',
    'modules:read_all',
    'quizzes:take',
    'quizzes:read_results',
    'quizzes:read_all_results',
    'progress:read_own',
    'progress:write_own',
    'progress:read_group',
    'progress:read_all',
    'assignments:read_own',
    'assignments:submit',
    'assignments:create',
    'assignments:edit',
    'assignments:delete',
    'assignments:grade',
    'assignments:read_all',
    'deadlines:read',
    'deadlines:create',
    'deadlines:edit',
    'deadlines:delete',
    'analytics:read_own',
    'analytics:read_group',
    'analytics:read_all',
    'grades:export',
    'users:read',
    'users:create',
    'users:edit',
    'users:delete',
    'users:block',
    'users:change_role',
    'users:import',
    'users:export',
    'users:bulk_ops',
    'profile:read_own',
    'profile:write_own',
    'profile:delete_own',
    'profile:read_any',
    'auth:impersonate',
    'audit:read',
    'announcements:read',
    'announcements:create',
    'announcements:edit',
    'announcements:delete',
    'lti:manage',
    'system:health',
    'system:settings',
    'system:reports',
    'leaderboard:read',
    'career:read',
  ],
};

// ─── Compound Capability Expansion ───────────────────────────

const COMPOUND_EXPANSION: Record<string, Capability[]> = {
  'assignments:manage': ['assignments:create', 'assignments:edit', 'assignments:delete', 'assignments:grade'],
};

function expandCapability(cap: Capability): Capability[] {
  const expansion = COMPOUND_EXPANSION[cap];
  if (!expansion) return [cap];
  return expansion.flatMap((c) => expandCapability(c));
}

// ─── Core API ─────────────────────────────────────────────────

/**
 * Cache of role → set of capability strings (pre-expanded).
 * Built lazily on first lookup.
 */
const _roleCapCache = new Map<UserRole, Set<string>>();

function getRoleCapSet(role: UserRole): Set<string> {
  let cached = _roleCapCache.get(role);
  if (cached) return cached;

  const caps = ROLE_CAPABILITIES[role] ?? [];
  const expanded = caps.flatMap((c) => expandCapability(c));
  cached = new Set(expanded);
  _roleCapCache.set(role, cached);
  return cached;
}

/** Check whether a role possesses a specific capability. */
export function hasCapability(role: UserRole | null | undefined, capability: Capability): boolean {
  if (!role) return false;
  const capSet = getRoleCapSet(role);
  if (capSet.has(capability)) return true;
  const expanded = expandCapability(capability);
  if (expanded.length > 1 || expanded[0] !== capability) {
    return expanded.every((c) => capSet.has(c));
  }
  return false;
}

/** Check whether a role possesses ALL specified capabilities. */
export function hasCapabilities(role: UserRole | null | undefined, ...capabilities: Capability[]): boolean {
  if (!role) return false;
  const capSet = getRoleCapSet(role);
  return capabilities.every((c) => capSet.has(c));
}

/** Check whether a role possesses ANY of the specified capabilities. */
export function hasAnyCapability(role: UserRole | null | undefined, ...capabilities: Capability[]): boolean {
  if (!role) return false;
  const capSet = getRoleCapSet(role);
  return capabilities.some((c) => capSet.has(c));
}

// ─── Scoping Rules ────────────────────────────────────────────

/**
 * Scoping level for data access based on role.
 * - 'own':   Only the user's own data
 * - 'group': User's group data
 * - 'all':   All data (admin level)
 */
export type ScopeLevel = 'own' | 'group' | 'all';

/**
 * Capabilities that are always scoped to 'own' for non-elevated users.
 * Even teachers with `progress:read_group` still have scope 'group',
 * but to READ their own progress they'd fall in 'own' scope.
 */
const SCOPE_OWN_CAPABILITIES: ReadonlySet<Capability> = new Set([
  'progress:read_own',
  'progress:write_own',
  'assignments:read_own',
  'assignments:submit',
  'analytics:read_own',
  'profile:read_own',
  'profile:write_own',
  'profile:delete_own',
]);

/** Compute the access scope for a role given a capability. */
export function getScopeForCap(role: UserRole, capability: Capability): ScopeLevel {
  if (role === 'admin') return 'all';

  // If the capability is explicitly own-scoped, return 'own'
  if (SCOPE_OWN_CAPABILITIES.has(capability)) return 'own';

  // Check if the role has the group-level variant
  const groupCap = capability.replace(/:read$/, ':read_group');
  if (groupCap !== capability && hasCapability(role, groupCap as Capability)) {
    return 'group';
  }

  // Check if the role has the all-level variant
  const allCap = capability.replace(/:read$/, ':read_all');
  if (allCap !== capability && hasCapability(role, allCap as Capability)) {
    return 'all';
  }

  return 'own';
}

// ─── Utility: Describe Capabilities ───────────────────────────

export function describeCapability(cap: Capability): string {
  return CAPABILITIES[cap] ?? cap;
}

export function listCapabilities(role: UserRole): Capability[] {
  return ROLE_CAPABILITIES[role] ?? [];
}

export function getAllCapabilities(): {
  key: Capability;
  description: string;
}[] {
  return Object.entries(CAPABILITIES).map(([key, description]) => ({
    key: key as Capability,
    description,
  }));
}
