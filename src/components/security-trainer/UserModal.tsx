'use client';

import { useState, useEffect, useCallback } from 'react';
import { type User, type UserRole, getRoleLabel, createUser, updateUser } from '@/lib/auth-store';
import { validateEmail, validatePhone, validatePassword } from '@/lib/auth-utils';
import { usePasswordStrength } from '@/hooks/use-password-strength';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Eye, EyeOff, GraduationCap, Briefcase, Shield, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/logger';

const roleIcons: Record<UserRole, React.ReactNode> = {
  student: <GraduationCap size={16} className="text-violet-500" />,
  teacher: <Briefcase size={16} className="text-amber-500" />,
  admin: <Shield size={16} className="text-red-500" />,
};

const roleBorderColors: Record<UserRole, string> = {
  student: 'has-[:checked]:border-violet-500 has-[:checked]:bg-violet-50',
  teacher: 'has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50',
  admin: 'has-[:checked]:border-red-500 has-[:checked]:bg-red-50',
};

interface UserModalProps {
  mode: 'create' | 'edit';
  user?: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserModal({ mode, user, onClose, onSuccess }: UserModalProps) {
  const t = useTranslations('admin.userModal');
  const te = useTranslations('errors');
  const tc = useTranslations('common');
  // Create fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [group, setGroup] = useState('');
  const [course, setCourse] = useState('');
  const [university, setUniversity] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Edit fields
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGroup, setEditGroup] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editUniversity, setEditUniversity] = useState('');
  const [editBio, setEditBio] = useState('');

  const pwStrength = usePasswordStrength(password);

  useEffect(() => {
    if (mode === 'edit' && user) {
      setEditFullName(user.fullName);
      setEditEmail(user.email);
      setEditPhone(user.phone);
      setEditGroup(user.group);
      setEditCourse(user.course);
      setEditUniversity(user.university);
      setEditBio(user.bio);
    }
  }, [mode, user]);

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

  const handleCreate = async () => {
    if (!fullName.trim()) {
      toast.error(te('fillName'));
      return;
    }
    if (!validateEmail(email)) {
      toast.error(te('invalidEmail'));
      return;
    }
    if (!validatePhone(phone)) {
      toast.error(te('invalidPhone'));
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

    try {
      const result = await createUser({ email, phone, fullName, role, group, course, university, inviteCode }, password);
      if (result.success) {
        toast.success(t('userCreated'));
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      logger.error('Failed to create user', { error: e });
      toast.error(te('invalidEmail'));
    }
  };

  const handleEdit = async () => {
    if (!user) return;
    if (!editFullName.trim()) {
      toast.error(te('nameRequired'));
      return;
    }
    if (!validateEmail(editEmail)) {
      toast.error(te('invalidEmail'));
      return;
    }
    if (!validatePhone(editPhone)) {
      toast.error(te('invalidPhone'));
      return;
    }

    try {
      const result = await updateUser(user.id, {
        fullName: editFullName,
        email: editEmail,
        phone: editPhone,
        group: editGroup,
        course: editCourse,
        university: editUniversity,
        bio: editBio,
      });
      if (result.success) {
        toast.success(t('profileUpdated'));
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      logger.error('Failed to update user', { error: e });
      toast.error(te('invalidEmail'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {mode === 'create' ? t('createTitle') : t('editTitle')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={tc('close')}>
            <X size={18} />
          </Button>
        </div>

        {mode === 'create' ? (
          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label>{t('nameLabel')}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('namePlaceholder')} />
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('emailLabel')}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('phoneLabel')}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+79001234567" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label>{t('passwordLabel')}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
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
              <Label>{t('confirmPasswordLabel')}</Label>
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
                <p className="text-xs text-red-500">{te('passwordsMismatch')}</p>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <Label>{t('roleLabel')}</Label>
              <RadioGroup value={role} onValueChange={(v) => setRole(v as UserRole)} className="space-y-2">
                {(['student', 'teacher', 'admin'] as UserRole[]).map((r) => (
                  <div
                    key={r}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-colors ${roleBorderColors[r]}`}
                  >
                    <RadioGroupItem value={r} id={`role-${r}`} />
                    <label htmlFor={`role-${r}`} className="flex flex-1 cursor-pointer items-center gap-2">
                      {roleIcons[r]}
                      <span className="text-sm font-medium">{getRoleLabel(r)}</span>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Admin Invite Code */}
            <AnimatePresence>
              {role === 'admin' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <Label>{t('inviteCodeLabel')}</Label>
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder={t('inviteCodePlaceholder')}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Group, Course, University */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{t('groupLabel')}</Label>
                <Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder={t('groupPlaceholder')} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('courseLabel')}</Label>
                <Input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="2" />
              </div>
              <div className="space-y-1.5">
                <Label>{t('universityLabel')}</Label>
                <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder={t('universityPlaceholder')} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleCreate} className="flex-1">
                {t('createButton')}
              </Button>
              <Button variant="outline" onClick={onClose}>
                {tc('cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label>{t('nameLabel')}</Label>
              <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('emailLabel')}</Label>
                <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('phoneLabel')}</Label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
            </div>

            {/* Group, Course, University */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{t('groupLabel')}</Label>
                <Input value={editGroup} onChange={(e) => setEditGroup(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('courseLabel')}</Label>
                <Input value={editCourse} onChange={(e) => setEditCourse(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('universityLabel')}</Label>
                <Input value={editUniversity} onChange={(e) => setEditUniversity(e.target.value)} />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label>{t('bioLabel')}</Label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                className="border-border w-full resize-none rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder={t('bioPlaceholder')}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleEdit} className="flex-1">
                {t('saveButton')}
              </Button>
              <Button variant="outline" onClick={onClose}>
                {tc('cancel')}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
