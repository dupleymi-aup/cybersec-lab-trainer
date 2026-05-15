import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import bcrypt from 'bcryptjs';
import { useAppStore } from './store';
import {
  generateUserId,
  hashPassword,
  verifyPassword,
  generateOTP,
  generateToken,
  validateToken,
  validateEmail,
  validatePhone,
  validatePassword,
} from './auth-utils';

export type UserRole = 'student' | 'teacher' | 'admin';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  student: 0,
  teacher: 1,
  admin: 2,
};

// Invite code for admin self-registration
// In production, this should be an environment variable or server-side check
export const ADMIN_INVITE_CODE = 'CYBERSEC-ADMIN-2024';

export function validateAdminInviteCode(code: string): boolean {
  return code.trim().toUpperCase() === ADMIN_INVITE_CODE;
}

export function hasRole(userRole: UserRole | null | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'student': return 'Студент';
    case 'teacher': return 'Преподаватель';
    case 'admin': return 'Администратор';
    default: return role;
  }
}

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  group: string;
  course: string;
  university: string;
  avatar: string;
  bio: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
  loginCount: number;
  isBlocked: boolean;
}

interface RecoveryState {
  otp: string;
  emailOrPhone: string;
  expiresAt: number;
}

export interface LoginActivityEntry {
  timestamp: string;
  ip: string;
  userAgent: string;
  success: boolean;
  userId?: string;
  email?: string;
}

// Audit log types
export type AuditAction =
  | 'role_change'
  | 'user_created'
  | 'user_deleted'
  | 'user_blocked'
  | 'user_unblocked'
  | 'password_reset'
  | 'impersonation_start'
  | 'impersonation_end'
  | 'user_updated'
  | 'bulk_delete'
  | 'bulk_role_change'
  | 'bulk_block'
  | 'group_renamed'
  | 'group_deleted'
  | 'group_users_reassigned';

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: AuditAction;
  targetId: string;
  targetName: string;
  timestamp: string;
  details: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  recoveryState: RecoveryState | null;
  loginActivity: LoginActivityEntry[];

  login: (emailOrPhone: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (
    data: { email: string; phone: string; fullName: string; role: UserRole; inviteCode?: string },
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  sendRecoveryOTP: (emailOrPhone: string) => Promise<{ success: boolean; error?: string }>;
  verifyRecoveryOTP: (otp: string) => boolean;
  resetPassword: (otp: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => { success: boolean; error?: string };
  clearLoginActivity: () => void;
}

// Simulated user database in localStorage
function getUsers(): Record<string, { user: User; passwordHash: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('security-trainer-users');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, { user: User; passwordHash: string }>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('security-trainer-users', JSON.stringify(users));
}

function getLoginActivity(): LoginActivityEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('security-trainer-login-activity');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLoginActivity(activity: LoginActivityEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('security-trainer-login-activity', JSON.stringify(activity.slice(-50)));
}

function simulateIP(): string {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function getUserAgent(): string {
  if (typeof window === 'undefined') return '';
  return navigator.userAgent.length > 80 ? navigator.userAgent.substring(0, 80) + '...' : navigator.userAgent;
}

function migrateProgress(userId: string) {
  if (typeof window === 'undefined') return;
  const anonKey = 'security-trainer-progress-anonymous';
  const userKey = `security-trainer-progress-${userId}`;
  const data = localStorage.getItem(anonKey);
  if (data) {
    localStorage.setItem(userKey, data);
    localStorage.removeItem(anonKey);
  }
  useAppStore.persist.rehydrate();
}

// Pre-computed bcrypt hash for admin password 'Admin@123' (generated once with bcrypt.hashSync)
const ADMIN_PASSWORD_HASH = '$2b$12$ZAcKXx.S3n3wZNQuxBgtFeu0Yz4FMeEkwbS6lnnQZO0aOm0m8Mvpy';

// Seed default admin user
function seedAdmin() {
  if (typeof window === 'undefined') return;
  const users = getUsers();
  if (Object.keys(users).length === 0) {
    const adminId = generateUserId();
    const admin: User = {
      id: adminId,
      email: 'admin@cybersec.lab',
      phone: '+70000000000',
      fullName: 'Администратор',
      group: '',
      course: '',
      university: '',
      avatar: '',
      bio: '',
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastLoginAt: '',
      loginCount: 0,
      isBlocked: false,
    };
    users[adminId] = { user: admin, passwordHash: ADMIN_PASSWORD_HASH };
    saveUsers(users);
  }
}
seedAdmin();

// Pre-computed bcrypt hash for teacher password 'Teacher@123'
const TEACHER_PASSWORD_HASH = '$2b$12$Wejo3M/j.76GAHLH6yyK4eU5vFCJWnb7FSMwSDCSm4otEoWtObB3q';

// Seed default teacher user
function seedTeacher() {
  if (typeof window === 'undefined') return;
  const users = getUsers();
  const teacherExists = Object.values(users).some((u) => u.user.role === 'teacher');
  if (!teacherExists) {
    const teacherId = generateUserId();
    const teacher: User = {
      id: teacherId,
      email: 'teacher@cybersec.lab',
      phone: '+70000000001',
      fullName: 'Преподаватель',
      group: '',
      course: '',
      university: '',
      avatar: '',
      bio: '',
      role: 'teacher',
      createdAt: new Date().toISOString(),
      lastLoginAt: '',
      loginCount: 0,
      isBlocked: false,
    };
    users[teacherId] = { user: teacher, passwordHash: TEACHER_PASSWORD_HASH };
    saveUsers(users);
  }
}
seedTeacher();

// Export helper to get all users (without password hashes)
export function getAllUsers(): User[] {
  const users = getUsers();
  return Object.values(users).map((u) => u.user);
}

// Admin: change user role
export function changeUserRole(userId: string, newRole: UserRole): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Not available' };
  const users = getUsers();
  if (!users[userId]) return { success: false, error: 'Пользователь не найден' };
  const oldRole = users[userId].user.role;
  users[userId].user.role = newRole;
  saveUsers(users);

  const { user: admin } = useAuthStore.getState();
  if (admin) {
    addAuditLogEntry(
      admin.id, admin.fullName, 'role_change',
      userId, users[userId].user.fullName,
      `Role changed from ${getRoleLabel(oldRole)} to ${getRoleLabel(newRole)}`
    );
  }

  return { success: true };
}

// Admin: delete user
export function deleteUser(userId: string): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Not available' };
  const { user: currentUser } = useAuthStore.getState();
  if (!currentUser) return { success: false, error: 'Не авторизован' };
  if (currentUser.id === userId) return { success: false, error: 'Нельзя удалить себя' };
  const users = getUsers();
  if (!users[userId]) return { success: false, error: 'Пользователь не найден' };
  const deletedUser = users[userId].user;
  delete users[userId];
  saveUsers(users);

  addAuditLogEntry(
    currentUser.id, currentUser.fullName, 'user_deleted',
    userId, deletedUser.fullName,
    `User deleted, role: ${getRoleLabel(deletedUser.role)}`
  );

  return { success: true };
}

// Admin: create user
export function createUser(
  data: {
    email: string;
    phone: string;
    fullName: string;
    role: UserRole;
    group: string;
    course: string;
    university: string;
    inviteCode?: string;
  },
  password: string
): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Not available' };

  if (!data.fullName.trim()) return { success: false, error: 'Введите имя' };
  if (!validateEmail(data.email)) return { success: false, error: 'Неверный email' };
  if (!validatePhone(data.phone)) return { success: false, error: 'Неверный телефон' };

  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) return { success: false, error: pwCheck.errors.join(', ') };

  if (data.role === 'admin' && !validateAdminInviteCode(data.inviteCode || '')) {
    return { success: false, error: 'Неверный код приглашения' };
  }

  const users = getUsers();
  const emailExists = Object.values(users).some((u) => u.user.email.toLowerCase() === data.email.toLowerCase());
  if (emailExists) return { success: false, error: 'Email уже зарегистрирован' };

  const phoneExists = Object.values(users).some(
    (u) => u.user.phone.replace(/[\s\-()]/g, '') === data.phone.replace(/[\s\-()]/g, '')
  );
  if (phoneExists) return { success: false, error: 'Телефон уже зарегистрирован' };

  const id = generateUserId();
  const newUser: User = {
    id,
    email: data.email,
    phone: data.phone,
    fullName: data.fullName.trim(),
    group: data.group,
    course: data.course,
    university: data.university,
    avatar: '',
    bio: '',
    role: data.role,
    createdAt: new Date().toISOString(),
    lastLoginAt: '',
    loginCount: 0,
    isBlocked: false,
  };

  const passwordHash = hashPasswordSync(password);
  users[id] = { user: newUser, passwordHash };
  saveUsers(users);

  const { user: admin } = useAuthStore.getState();
  if (admin) {
    addAuditLogEntry(
      admin.id, admin.fullName, 'user_created',
      id, newUser.fullName,
      `User created with role ${getRoleLabel(newUser.role)}`
    );
  }

  return { success: true };
}

// Synchronous hash for admin-created users (async not available in sync function)
function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, 12);
}

// Admin: update user profile
export function updateUser(
  userId: string,
  data: Partial<Pick<User, 'fullName' | 'email' | 'phone' | 'group' | 'course' | 'university' | 'bio'>>
): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Not available' };
  const users = getUsers();
  if (!users[userId]) return { success: false, error: 'Пользователь не найден' };

  if (data.email) {
    if (!validateEmail(data.email)) return { success: false, error: 'Неверный email' };
    const emailExists = Object.values(users).some(
      (u) => u.user.id !== userId && u.user.email.toLowerCase() === data.email!.toLowerCase()
    );
    if (emailExists) return { success: false, error: 'Email уже используется' };
  }

  if (data.phone) {
    if (!validatePhone(data.phone)) return { success: false, error: 'Неверный телефон' };
    const phoneExists = Object.values(users).some(
      (u) => u.user.id !== userId && u.user.phone.replace(/[\s\-()]/g, '') === data.phone!.replace(/[\s\-()]/g, '')
    );
    if (phoneExists) return { success: false, error: 'Телефон уже используется' };
  }

  if (data.fullName) {
    const trimmed = data.fullName.trim();
    if (!trimmed) return { success: false, error: 'Имя не может быть пустым' };
    data.fullName = trimmed;
  }

  users[userId].user = { ...users[userId].user, ...data };
  saveUsers(users);

  const { user: admin } = useAuthStore.getState();
  if (admin) {
    addAuditLogEntry(
      admin.id, admin.fullName, 'user_updated',
      userId, users[userId].user.fullName,
      `Profile updated: ${Object.keys(data).join(', ')}`
    );
  }

  // Update current user in store if editing self
  const { user: currentUser } = useAuthStore.getState();
  if (currentUser && currentUser.id === userId) {
    useAuthStore.getState().updateProfile(data);
  }

  return { success: true };
}

// Admin: toggle blocked status
export function toggleUserBlock(userId: string): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Not available' };
  const { user: currentUser } = useAuthStore.getState();
  if (!currentUser) return { success: false, error: 'Не авторизован' };
  if (currentUser.id === userId) return { success: false, error: 'Нельзя заблокировать себя' };
  const users = getUsers();
  if (!users[userId]) return { success: false, error: 'Пользователь не найден' };
  const wasBlocked = users[userId].user.isBlocked;
  users[userId].user.isBlocked = !users[userId].user.isBlocked;
  saveUsers(users);

  const action = users[userId].user.isBlocked ? 'user_blocked' : 'user_unblocked';
  addAuditLogEntry(
    currentUser.id, currentUser.fullName, action,
    userId, users[userId].user.fullName,
    `User ${users[userId].user.isBlocked ? 'blocked' : 'unblocked'}`
  );

  return { success: true };
}

// Admin: bulk delete
export function bulkDeleteUsers(userIds: string[], currentUserId: string): { success: boolean; error?: string; count: number } {
  if (typeof window === 'undefined') return { success: false, error: 'Not available', count: 0 };
  if (userIds.includes(currentUserId)) return { success: false, error: 'Нельзя удалить себя', count: 0 };
  const users = getUsers();
  let count = 0;
  const { user: admin } = useAuthStore.getState();
  for (const id of userIds) {
    if (users[id]) {
      const targetUser = users[id].user;
      if (admin) {
        addAuditLogEntry(
          admin.id, admin.fullName, 'bulk_delete',
          id, targetUser.fullName,
          `Deleted in bulk operation, role: ${getRoleLabel(targetUser.role)}`
        );
      }
      delete users[id];
      count++;
    }
  }
  saveUsers(users);

  if (admin && count > 0) {
    addAuditLogEntry(
      admin.id, admin.fullName, 'bulk_delete',
      '', `${count} users`,
      `Bulk delete summary: ${count} users removed`
    );
  }

  return { success: true, count };
}

// Admin: bulk change role
export function bulkChangeRole(userIds: string[], newRole: UserRole): { success: boolean; error?: string; count: number } {
  if (typeof window === 'undefined') return { success: false, error: 'Not available', count: 0 };
  const users = getUsers();
  let count = 0;
  const { user: admin } = useAuthStore.getState();
  for (const id of userIds) {
    if (users[id]) {
      const oldRole = users[id].user.role;
      const targetUser = users[id].user;
      users[id].user.role = newRole;
      count++;
      if (admin) {
        addAuditLogEntry(
          admin.id, admin.fullName, 'bulk_role_change',
          id, targetUser.fullName,
          `Role changed from ${getRoleLabel(oldRole)} to ${getRoleLabel(newRole)} in bulk operation`
        );
      }
    }
  }
  saveUsers(users);

  if (admin && count > 0) {
    addAuditLogEntry(
      admin.id, admin.fullName, 'bulk_role_change',
      '', `${count} users`,
      `Bulk role change summary: ${count} users changed to ${getRoleLabel(newRole)}`
    );
  }

  return { success: true, count };
}

// Admin: bulk toggle block
export function bulkToggleBlock(userIds: string[], currentUserId: string, blocked: boolean): { success: boolean; error?: string; count: number } {
  if (typeof window === 'undefined') return { success: false, error: 'Not available', count: 0 };
  if (userIds.includes(currentUserId)) return { success: false, error: 'Нельзя заблокировать себя', count: 0 };
  const users = getUsers();
  let count = 0;
  const { user: admin } = useAuthStore.getState();
  for (const id of userIds) {
    if (users[id] && id !== currentUserId) {
      const targetUser = users[id].user;
      users[id].user.isBlocked = blocked;
      count++;
      if (admin) {
        addAuditLogEntry(
          admin.id, admin.fullName, 'bulk_block',
          id, targetUser.fullName,
          `User ${blocked ? 'blocked' : 'unblocked'} in bulk operation`
        );
      }
    }
  }
  saveUsers(users);

  if (admin && count > 0) {
    addAuditLogEntry(
      admin.id, admin.fullName, 'bulk_block',
      '', `${count} users`,
      `Bulk ${blocked ? 'block' : 'unblock'} summary: ${count} users affected`
    );
  }

  return { success: true, count };
}

// ========== Audit Log ==========

const AUDIT_LOG_KEY = 'security-trainer-audit-log';
const MAX_AUDIT_ENTRIES = 500;

function getAuditLog(): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAuditLog(entries: AuditLogEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(entries.slice(-MAX_AUDIT_ENTRIES)));
}

export function addAuditLogEntry(
  adminId: string,
  adminName: string,
  action: AuditAction,
  targetId: string,
  targetName: string,
  details: string
): void {
  const log = getAuditLog();
  log.push({
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    adminId, adminName, action, targetId, targetName,
    timestamp: new Date().toISOString(),
    details,
  });
  saveAuditLog(log);
}

export function getAuditLogEntries(): AuditLogEntry[] {
  return getAuditLog();
}

export function clearAuditLog(): void {
  saveAuditLog([]);
}

// ========== Password Reset ==========

export function resetUserPassword(
  userId: string,
  newPassword: string,
  adminId: string
): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Not available' };
  const users = getUsers();
  if (!users[userId]) return { success: false, error: 'Пользователь не найден' };

  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.valid) return { success: false, error: pwCheck.errors.join(', ') };

  const targetUser = users[userId].user;
  users[userId].passwordHash = hashPasswordSync(newPassword);
  saveUsers(users);

  const adminUser = users[adminId]?.user;
  addAuditLogEntry(
    adminId, adminUser?.fullName || 'Admin',
    'password_reset', userId, targetUser.fullName,
    'Password reset by admin'
  );

  return { success: true };
}

// ========== Impersonation ==========

const IMPERSONATION_KEY = 'security-trainer-impersonation';

export function startImpersonation(
  targetUserId: string,
  adminId: string
): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Not available' };
  const users = getUsers();
  if (!users[targetUserId]) return { success: false, error: 'Пользователь не найден' };
  if (targetUserId === adminId) return { success: false, error: 'Нельзя войти как себя' };

  const targetUser = users[targetUserId].user;
  const token = generateToken(targetUser.id, targetUser.role);

  localStorage.setItem(IMPERSONATION_KEY, JSON.stringify({
    isImpersonating: true,
    originalUserId: adminId,
    impersonatingUserId: targetUserId,
    startedAt: new Date().toISOString(),
  }));

  useAuthStore.setState({ user: targetUser, isAuthenticated: true, token });

  const adminUser = users[adminId]?.user;
  addAuditLogEntry(
    adminId, adminUser?.fullName || 'Admin',
    'impersonation_start', targetUserId, targetUser.fullName,
    'Admin started impersonation'
  );

  return { success: true };
}

export function stopImpersonation(): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Not available' };
  const raw = localStorage.getItem(IMPERSONATION_KEY);
  if (!raw) return { success: false, error: 'Нет активной имперсонации' };

  try {
    const data = JSON.parse(raw);
    if (!data.originalUserId) return { success: false, error: 'Нет активной имперсонации' };

    const users = getUsers();
    const originalUser = users[data.originalUserId]?.user;
    if (!originalUser) return { success: false, error: 'Исходный пользователь не найден' };

    const token = generateToken(originalUser.id, originalUser.role);
    useAuthStore.setState({ user: originalUser, isAuthenticated: true, token });

    addAuditLogEntry(
      data.originalUserId, originalUser.fullName,
      'impersonation_end', data.impersonatingUserId,
      users[data.impersonatingUserId]?.user.fullName || 'Unknown',
      'Admin stopped impersonation'
    );

    localStorage.removeItem(IMPERSONATION_KEY);
    return { success: true };
  } catch {
    return { success: false, error: 'Ошибка завершения имперсонации' };
  }
}

export function getImpersonationState(): { isImpersonating: boolean; originalUserId: string | null; impersonatingUserId: string | null; startedAt: string | null } {
  if (typeof window === 'undefined') return { isImpersonating: false, originalUserId: null, impersonatingUserId: null, startedAt: null };
  try {
    const raw = localStorage.getItem(IMPERSONATION_KEY);
    if (!raw) return { isImpersonating: false, originalUserId: null, impersonatingUserId: null, startedAt: null };
    const data = JSON.parse(raw);
    return {
      isImpersonating: data.isImpersonating || false,
      originalUserId: data.originalUserId || null,
      impersonatingUserId: data.impersonatingUserId || null,
      startedAt: data.startedAt || null,
    };
  } catch {
    return { isImpersonating: false, originalUserId: null, impersonatingUserId: null, startedAt: null };
  }
}

// ========== Group Management ==========

export function getAllGroups(): string[] {
  const users = getAllUsers();
  return [...new Set(users.map((u) => u.group).filter(Boolean))].sort();
}

export function renameGroup(
  oldName: string,
  newName: string,
  adminId: string
): { success: boolean; error?: string; count: number } {
  if (typeof window === 'undefined') return { success: false, error: 'Not available', count: 0 };
  if (!newName.trim()) return { success: false, error: 'Название группы не может быть пустым', count: 0 };

  const users = getUsers();
  const allGroups = getAllGroups();
  const trimmedNew = newName.trim();
  if (allGroups.includes(trimmedNew) && trimmedNew !== oldName) {
    return { success: false, error: 'Группа с таким названием уже существует', count: 0 };
  }

  let count = 0;
  for (const id of Object.keys(users)) {
    if (users[id].user.group === oldName) {
      users[id].user.group = trimmedNew;
      count++;
    }
  }
  saveUsers(users);

  const adminUser = users[adminId]?.user;
  addAuditLogEntry(
    adminId, adminUser?.fullName || 'Admin',
    'group_renamed', '', oldName,
    `Group renamed from "${oldName}" to "${trimmedNew}", ${count} users updated`
  );

  return { success: true, count };
}

export function deleteGroup(
  groupName: string,
  adminId: string
): { success: boolean; error?: string; count: number } {
  if (typeof window === 'undefined') return { success: false, error: 'Not available', count: 0 };
  const users = getUsers();
  let count = 0;
  for (const id of Object.keys(users)) {
    if (users[id].user.group === groupName) {
      users[id].user.group = '';
      count++;
    }
  }
  saveUsers(users);

  const adminUser = users[adminId]?.user;
  addAuditLogEntry(
    adminId, adminUser?.fullName || 'Admin',
    'group_deleted', '', groupName,
    `Group "${groupName}" deleted, ${count} users unassigned`
  );

  return { success: true, count };
}

export function assignUsersToGroup(
  userIds: string[],
  groupName: string,
  adminId: string
): { success: boolean; error?: string; count: number } {
  if (typeof window === 'undefined') return { success: false, error: 'Not available', count: 0 };
  if (!groupName.trim()) return { success: false, error: 'Название группы не может быть пустым', count: 0 };

  const users = getUsers();
  let count = 0;
  for (const id of userIds) {
    if (users[id]) {
      users[id].user.group = groupName.trim();
      count++;
    }
  }
  saveUsers(users);

  const adminUser = users[adminId]?.user;
  addAuditLogEntry(
    adminId, adminUser?.fullName || 'Admin',
    'group_users_reassigned', '', groupName.trim(),
    `${count} users assigned to group "${groupName.trim()}"`
  );

  return { success: true, count };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      recoveryState: null,
      loginActivity: typeof window !== 'undefined' ? getLoginActivity() : [],

      login: async (emailOrPhone, password, rememberMe) => {
        const users = getUsers();
        const found = Object.values(users).find(
          (u) =>
            u.user.email.toLowerCase() === emailOrPhone.toLowerCase() ||
            u.user.phone.replace(/[\s\-()]/g, '') === emailOrPhone.replace(/[\s\-()]/g, '')
        );

        if (!found) {
          const activity = getLoginActivity();
          activity.push({
            timestamp: new Date().toISOString(),
            ip: simulateIP(),
            userAgent: getUserAgent(),
            success: false,
          });
          saveLoginActivity(activity);
          set({ loginActivity: getLoginActivity() });
          return { success: false, error: 'Неверные учётные данные' };
        }

        if (found.user.isBlocked) {
          const activity = getLoginActivity();
          activity.push({
            timestamp: new Date().toISOString(),
            ip: simulateIP(),
            userAgent: getUserAgent(),
            success: false,
            userId: found.user.id,
            email: found.user.email,
          });
          saveLoginActivity(activity);
          set({ loginActivity: getLoginActivity() });
          return { success: false, error: 'Аккаунт заблокирован. Обратитесь к администратору.' };
        }

        const valid = await verifyPassword(password, found.passwordHash);
        if (!valid) {
          const activity = getLoginActivity();
          activity.push({
            timestamp: new Date().toISOString(),
            ip: simulateIP(),
            userAgent: getUserAgent(),
            success: false,
            userId: found.user.id,
            email: found.user.email,
          });
          saveLoginActivity(activity);
          set({ loginActivity: getLoginActivity() });
          return { success: false, error: 'Неверные учётные данные' };
        }

        // Update login tracking
        found.user.lastLoginAt = new Date().toISOString();
        found.user.loginCount = (found.user.loginCount || 0) + 1;
        users[found.user.id] = found;
        saveUsers(users);

        const activity = getLoginActivity();
        activity.push({
          timestamp: new Date().toISOString(),
          ip: simulateIP(),
          userAgent: getUserAgent(),
          success: true,
          userId: found.user.id,
          email: found.user.email,
        });
        saveLoginActivity(activity);
        set({ loginActivity: getLoginActivity() });

        const token = generateToken(found.user.id, found.user.role, rememberMe);
        migrateProgress(found.user.id);
        set({
          user: found.user,
          isAuthenticated: true,
          token,
        });
        return { success: true };
      },

      register: async (data, password) => {
        // Validate admin invite code
        if (data.role === 'admin' && !validateAdminInviteCode(data.inviteCode || '')) {
          return { success: false, error: 'Неверный код приглашения для роли администратора' };
        }

        const users = getUsers();
        const emailExists = Object.values(users).some(
          (u) => u.user.email.toLowerCase() === data.email.toLowerCase()
        );
        if (emailExists) {
          return { success: false, error: 'Этот email уже зарегистрирован' };
        }

        const phoneExists = Object.values(users).some(
          (u) => u.user.phone.replace(/[\s\-()]/g, '') === data.phone.replace(/[\s\-()]/g, '')
        );
        if (phoneExists) {
          return { success: false, error: 'Этот номер телефона уже зарегистрирован' };
        }

        const id = generateUserId();
        const newUser: User = {
          id,
          email: data.email,
          phone: data.phone,
          fullName: data.fullName,
          group: '',
          course: '',
          university: '',
          avatar: '',
          bio: '',
          role: data.role,
          createdAt: new Date().toISOString(),
          lastLoginAt: '',
          loginCount: 0,
          isBlocked: false,
        };

        const passwordHash = await hashPassword(password);
        users[id] = { user: newUser, passwordHash };
        saveUsers(users);

        const token = generateToken(newUser.id, newUser.role);
        set({
          user: newUser,
          isAuthenticated: true,
          token,
        });
        return { success: true };
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          token: null,
        });
      },

      updateProfile: (data) => {
        const { user } = get();
        if (!user) return;

        const updated = { ...user, ...data };
        const users = getUsers();
        if (users[user.id]) {
          users[user.id].user = updated;
          saveUsers(users);
        }
        set({ user: updated });
      },

      updatePassword: async (oldPassword, newPassword) => {
        const { user } = get();
        if (!user) return { success: false, error: 'Пользователь не найден' };

        const users = getUsers();
        const record = users[user.id];
        if (!record) return { success: false, error: 'Пользователь не найден' };

        const valid = await verifyPassword(oldPassword, record.passwordHash);
        if (!valid) return { success: false, error: 'Неверный текущий пароль' };

        record.passwordHash = await hashPassword(newPassword);
        saveUsers(users);
        return { success: true };
      },

      sendRecoveryOTP: async (emailOrPhone) => {
        const users = getUsers();
        const found = Object.values(users).find(
          (u) =>
            u.user.email.toLowerCase() === emailOrPhone.toLowerCase() ||
            u.user.phone.replace(/[\s\-()]/g, '') === emailOrPhone.replace(/[\s\-()]/g, '')
        );

        if (!found) {
          return { success: false, error: 'Аккаунт не найден' };
        }

        const otp = generateOTP();
        set({
          recoveryState: {
            otp,
            emailOrPhone,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
          },
        });
        return { success: true };
      },

      verifyRecoveryOTP: (otp) => {
        const { recoveryState } = get();
        if (!recoveryState) return false;
        if (Date.now() > recoveryState.expiresAt) return false;
        return recoveryState.otp === otp;
      },

      resetPassword: async (otp, newPassword) => {
        const { recoveryState } = get();
        if (!recoveryState) return { success: false, error: 'Сначала отправьте код' };
        if (Date.now() > recoveryState.expiresAt) return { success: false, error: 'Код просрочен' };
        if (recoveryState.otp !== otp) return { success: false, error: 'Неверный код' };

        const users = getUsers();
        const found = Object.values(users).find(
          (u) =>
            u.user.email.toLowerCase() === recoveryState.emailOrPhone.toLowerCase() ||
            u.user.phone.replace(/[\s\-()]/g, '') === recoveryState.emailOrPhone.replace(/[\s\-()]/g, '')
        );

        if (!found) return { success: false, error: 'Аккаунт не найден' };

        found.passwordHash = await hashPassword(newPassword);
        saveUsers(users);

        set({ recoveryState: null });
        return { success: true };
      },

      deleteAccount: () => {
        const { user } = get();
        if (!user) return { success: false, error: 'Пользователь не найден' };

        const users = getUsers();
        delete users[user.id];
        saveUsers(users);

        set({
          user: null,
          isAuthenticated: false,
          token: null,
        });
        return { success: true };
      },

      clearLoginActivity: () => {
        saveLoginActivity([]);
        set({ loginActivity: [] });
      },
    }),
    {
      name: 'security-trainer-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        recoveryState: state.recoveryState,
      }),
    }
  )
);
