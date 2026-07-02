import type { UserRole } from "./auth-types";

// ─── Capability Definitions ──────────────────────────────────
// Pattern: resource:action
// Resources define WHAT can be accessed, actions define HOW

export const CAPABILITIES = {
  // Modules — learning content
  "modules:read": "Чтение учебных модулей",
  "modules:read_all": "Чтение всех модулей (включая скрытые)",

  // Quizzes
  "quizzes:take": "Прохождение тестов и квизов",
  "quizzes:read_results": "Просмотр результатов тестов",
  "quizzes:read_all_results": "Просмотр результатов всех тестов",

  // Progress
  "progress:read_own": "Просмотр своего прогресса",
  "progress:write_own": "Обновление своего прогресса",
  "progress:read_group": "Просмотр прогресса студентов группы",
  "progress:read_all": "Просмотр прогресса всех студентов",

  // Assignments
  "assignments:read_own": "Просмотр своих заданий",
  "assignments:submit": "Отправка заданий",
  "assignments:create": "Создание заданий",
  "assignments:edit": "Редактирование заданий",
  "assignments:delete": "Удаление заданий",
  "assignments:grade": "Оценка заданий",
  "assignments:read_all": "Просмотр всех заданий",

  // Deadlines
  "deadlines:read": "Просмотр дедлайнов",
  "deadlines:create": "Создание дедлайнов",
  "deadlines:edit": "Редактирование дедлайнов",
  "deadlines:delete": "Удаление дедлайнов",

  // Analytics
  "analytics:read_own": "Просмотр своей аналитики",
  "analytics:read_group": "Просмотр аналитики группы",
  "analytics:read_all": "Просмотр всей аналитики",

  // Grade export
  "grades:export": "Экспорт оценок",

  // User management
  "users:read": "Просмотр пользователей",
  "users:create": "Создание пользователей",
  "users:edit": "Редактирование пользователей",
  "users:delete": "Удаление пользователей",
  "users:block": "Блокировка/разблокировка пользователей",
  "users:change_role": "Изменение ролей",
  "users:import": "Импорт пользователей",
  "users:export": "Экспорт пользователей",
  "users:bulk_ops": "Массовые операции (удаление, блокировка, смена роли)",

  // Profile
  "profile:read_own": "Просмотр своего профиля",
  "profile:write_own": "Редактирование своего профиля",
  "profile:delete_own": "Удаление своего аккаунта",
  "profile:read_any": "Просмотр любого профиля",

  // Impersonation
  "auth:impersonate": "Имперсонация (вход под другим пользователем)",

  // Audit
  "audit:read": "Просмотр аудит-логов",

  // Announcements
  "announcements:read": "Чтение объявлений",
  "announcements:create": "Создание объявлений",
  "announcements:edit": "Редактирование объявлений",
  "announcements:delete": "Удаление объявлений",

  // LTI
  "lti:manage": "Управление LTI-интеграцией",

  // System
  "system:health": "Просмотр состояния системы",
  "system:settings": "Управление настройками системы",
  "system:reports": "Управление отчётами по расписанию",

  // Leaderboard
  "leaderboard:read": "Просмотр таблицы лидеров",

  // Career
  "career:read": "Просмотр карьерных путей",

  // ═══ Compound / Shortcut capabilities ═══
  // These expand to multiple capabilities for convenience
  "assignments:manage":
    "Полное управление заданиями (create+edit+delete+grade)",
} as const;

export type Capability = keyof typeof CAPABILITIES;

// ─── Role → Capability Mapping ───────────────────────────────

export const ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  student: [
    "modules:read",
    "quizzes:take",
    "quizzes:read_results",
    "progress:read_own",
    "progress:write_own",
    "assignments:read_own",
    "assignments:submit",
    "deadlines:read",
    "analytics:read_own",
    "profile:read_own",
    "profile:write_own",
    "profile:delete_own",
    "announcements:read",
    "leaderboard:read",
    "career:read",
  ],

  teacher: [
    // Full student access
    "modules:read",
    "quizzes:take",
    "quizzes:read_results",
    "quizzes:read_all_results",
    "progress:read_own",
    "progress:write_own",
    "progress:read_group",
    "assignments:read_own",
    "assignments:submit",
    "assignments:create",
    "assignments:edit",
    "assignments:grade",
    "assignments:read_all",
    "deadlines:read",
    "deadlines:create",
    "deadlines:edit",
    "deadlines:delete",
    "analytics:read_own",
    "analytics:read_group",
    "grades:export",
    "profile:read_own",
    "profile:write_own",
    "profile:delete_own",
    "profile:read_any",
    "announcements:read",
    "announcements:create",
    "leaderboard:read",
    "career:read",
  ],

  admin: [
    // ═══ Admin gets ALL capabilities ═══
    "modules:read",
    "modules:read_all",
    "quizzes:take",
    "quizzes:read_results",
    "quizzes:read_all_results",
    "progress:read_own",
    "progress:write_own",
    "progress:read_group",
    "progress:read_all",
    "assignments:read_own",
    "assignments:submit",
    "assignments:create",
    "assignments:edit",
    "assignments:delete",
    "assignments:grade",
    "assignments:read_all",
    "deadlines:read",
    "deadlines:create",
    "deadlines:edit",
    "deadlines:delete",
    "analytics:read_own",
    "analytics:read_group",
    "analytics:read_all",
    "grades:export",
    "users:read",
    "users:create",
    "users:edit",
    "users:delete",
    "users:block",
    "users:change_role",
    "users:import",
    "users:export",
    "users:bulk_ops",
    "profile:read_own",
    "profile:write_own",
    "profile:delete_own",
    "profile:read_any",
    "auth:impersonate",
    "audit:read",
    "announcements:read",
    "announcements:create",
    "announcements:edit",
    "announcements:delete",
    "lti:manage",
    "system:health",
    "system:settings",
    "system:reports",
    "leaderboard:read",
    "career:read",
  ],
};

// ─── Compound Capability Expansion ───────────────────────────

const COMPOUND_EXPANSION: Record<string, Capability[]> = {
  "assignments:manage": [
    "assignments:create",
    "assignments:edit",
    "assignments:delete",
    "assignments:grade",
  ],
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
export function hasCapability(
  role: UserRole | null | undefined,
  capability: Capability,
): boolean {
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
export function hasCapabilities(
  role: UserRole | null | undefined,
  ...capabilities: Capability[]
): boolean {
  if (!role) return false;
  const capSet = getRoleCapSet(role);
  return capabilities.every((c) => capSet.has(c));
}

/** Check whether a role possesses ANY of the specified capabilities. */
export function hasAnyCapability(
  role: UserRole | null | undefined,
  ...capabilities: Capability[]
): boolean {
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
export type ScopeLevel = "own" | "group" | "all";

/**
 * Capabilities that are always scoped to 'own' for non-elevated users.
 * Even teachers with `progress:read_group` still have scope 'group',
 * but to READ their own progress they'd fall in 'own' scope.
 */
const SCOPE_OWN_CAPABILITIES: ReadonlySet<Capability> = new Set([
  "progress:read_own",
  "progress:write_own",
  "assignments:read_own",
  "assignments:submit",
  "analytics:read_own",
  "profile:read_own",
  "profile:write_own",
  "profile:delete_own",
]);

/** Compute the access scope for a role given a capability. */
export function getScopeForCap(
  role: UserRole,
  capability: Capability,
): ScopeLevel {
  if (role === "admin") return "all";

  // If the capability is explicitly own-scoped, return 'own'
  if (SCOPE_OWN_CAPABILITIES.has(capability)) return "own";

  // Check if the role has the group-level variant
  const groupCap = capability.replace(/:read$/, ":read_group");
  if (groupCap !== capability && hasCapability(role, groupCap as Capability)) {
    return "group";
  }

  // Check if the role has the all-level variant
  const allCap = capability.replace(/:read$/, ":read_all");
  if (allCap !== capability && hasCapability(role, allCap as Capability)) {
    return "all";
  }

  return "own";
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
