'use client';

import { useState, useEffect, useCallback } from 'react';
import { type User, resetUserPassword } from '@/lib/auth-store';
import { validatePassword } from '@/lib/auth-utils';
import { usePasswordStrength } from '@/hooks/use-password-strength';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { X, Eye, EyeOff, Check, Copy, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';

interface PasswordResetModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PasswordResetModal({ user, onClose, onSuccess }: PasswordResetModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const pwStrength = usePasswordStrength(password);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const handleReset = async () => {
    if (!password) { toast.error('Введите пароль'); return; }
    if (password !== confirmPassword) { toast.error('Пароли не совпадают'); return; }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) { toast.error(pwCheck.errors.join(', ')); return; }

    const { user: admin } = useAuthStore.getState();
    if (!admin) { toast.error('Не авторизован'); return; }

    const result = await resetUserPassword(user.id, password, admin.id);
    if (result.success) {
      setNewPassword(password);
      setResetDone(true);
      toast.success('Пароль сброшен');
    } else {
      toast.error(result.error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    toast.success('Пароль скопирован');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-card rounded-2xl shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <KeyRound size={20} className="text-sky-600" />
            <h2 className="text-lg font-bold">Сброс пароля</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </Button>
        </div>

        {/* User info */}
        <div className="mb-4 p-3 bg-secondary rounded-lg">
          <p className="text-sm font-medium">{user.fullName}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>

        {!resetDone ? (
          <div className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <Label>Новый пароль *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Progress value={pwStrength.score} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground">{pwStrength.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pwStrength.checks.map((check, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className={`text-[9px] px-1 py-0 ${check.passed ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-border text-slate-400'}`}
                      >
                        {check.passed && <Check size={8} className="mr-0.5" />}
                        {check.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label>Подтверждение пароля *</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-muted-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Пароли не совпадают</p>
              )}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                <strong>Внимание:</strong> Сообщите новый пароль пользователю. Рекомендуется сменить пароль при следующем входе.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleReset} className="flex-1">Сбросить пароль</Button>
              <Button variant="outline" onClick={onClose}>Отмена</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm font-medium text-emerald-700 mb-2">Пароль успешно сброшен!</p>
              <div className="flex items-center gap-2 bg-card rounded-lg p-3 border border-emerald-200">
                <code className="text-sm font-mono flex-1">{newPassword}</code>
                <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0" aria-label="Копировать пароль">
                  <Copy size={16} className={copied ? 'text-emerald-600' : 'text-slate-400'} />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={onSuccess} className="flex-1">Готово</Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
