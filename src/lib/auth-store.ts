import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  generateUserId,
  hashPassword,
  verifyPassword,
  generateOTP,
  generateToken,
  validateToken,
  validateEmail,
  validatePhone,
} from './auth-utils';

export type UserRole = 'student' | 'admin';

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
}

interface RecoveryState {
  otp: string;
  emailOrPhone: string;
  expiresAt: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  recoveryState: RecoveryState | null;

  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    data: { email: string; phone: string; fullName: string },
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  sendRecoveryOTP: (emailOrPhone: string) => Promise<{ success: boolean; error?: string }>;
  verifyRecoveryOTP: (otp: string) => boolean;
  resetPassword: (otp: string, newPassword: string) => { success: boolean; error?: string };
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
    };
    hashPassword('Admin@123').then((hash) => {
      users[adminId] = { user: admin, passwordHash: hash };
      saveUsers(users);
    });
  }
}
seedAdmin();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      recoveryState: null,

      login: async (emailOrPhone, password) => {
        const users = getUsers();
        const found = Object.values(users).find(
          (u) =>
            u.user.email.toLowerCase() === emailOrPhone.toLowerCase() ||
            u.user.phone.replace(/[\s\-()]/g, '') === emailOrPhone.replace(/[\s\-()]/g, '')
        );

        if (!found) {
          return { success: false, error: 'Неверные учётные данные' };
        }

        const valid = await verifyPassword(password, found.passwordHash);
        if (!valid) {
          return { success: false, error: 'Неверные учётные данные' };
        }

        const token = generateToken(found.user.id, found.user.role);
        set({
          user: found.user,
          isAuthenticated: true,
          token,
        });
        return { success: true };
      },

      register: async (data, password) => {
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
          role: 'student',
          createdAt: new Date().toISOString(),
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

      resetPassword: (otp, newPassword) => {
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

        hashPassword(newPassword).then((hash) => {
          found.passwordHash = hash;
          saveUsers(users);
        });

        set({ recoveryState: null });
        return { success: true };
      },
    }),
    {
      name: 'security-trainer-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    }
  )
);
