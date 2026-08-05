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
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/logger';

interface PasswordResetModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PasswordResetModal({ user, onClose, onSuccess }: PasswordResetModalProps) {
  const t = useTranslations('admin.passwordReset');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
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
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const handleReset = async () => {
    if (!password) {
      toast.error(te('enterPassword'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('passwordsMismatch'));
      return;
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      toast.error(pwCheck.errors.join(', '));
      return;
    }

    const { user: _currentUser } = useAuthStore.getState();
    if (!_currentUser) {
      toast.error(te('notAuthorized'));
      return;
    }

    try {
      const result = await resetUserPassword(user.id, password);
      if (result.success) {
        setNewPassword(password);
        setResetDone(true);
        toast.success(t('success'));
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      logger.error('Failed to reset user password', { error: e });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword).catch(() => {
      // Clipboard API unavailable
    });
    setCopied(true);
    toast.success(t('copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={tc('resetPassword')}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-card w-full max-w-md rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound size={20} className="text-sky-600" />
            <h2 className="text-lg font-bold">{t('title')}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={tc('close')}>
            <X size={18} />
          </Button>
        </div>

        {/* User info */}
        <div className="bg-secondary mb-4 rounded-lg p-3">
          <p className="text-sm font-medium">{user.fullName}</p>
          <p className="text-muted-foreground text-xs">{user.email}</p>
        </div>

        {!resetDone ? (
          <div className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <Label>{t('newPassword')}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('newPasswordPlaceholder')}
                />
                <button
                  type="button"
                  className="hover:text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 text-slate-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Progress value={pwStrength.score} className="h-1.5 flex-1" />
                    <span className="text-muted-foreground text-[10px]">{pwStrength.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pwStrength.checks.map((check, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className={`px-1 py-0 text-[9px] ${check.passed ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-border text-slate-400'}`}
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
              <Label>{t('confirmPassword')}</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('confirmPasswordPlaceholder')}
                />
                <button
                  type="button"
                  className="hover:text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 text-slate-400"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">{t('passwordsMismatch')}</p>
              )}
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-700">
                <strong>{t('warning')}</strong>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleReset} className="flex-1">
                {t('resetButton')}
              </Button>
              <Button variant="outline" onClick={onClose}>
                {tc('cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="mb-2 text-sm font-medium text-emerald-700">{t('success')}</p>
              <div className="bg-card flex items-center gap-2 rounded-lg border border-emerald-200 p-3">
                <code className="flex-1 font-mono text-sm">{newPassword}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                  aria-label={t('copyAria')}
                >
                  <Copy size={16} className={copied ? 'text-emerald-600' : 'text-slate-400'} />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={onSuccess} className="flex-1">
                {t('done')}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
