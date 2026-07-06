'use client';

import { useState } from 'react';
import { useAuthStore, type UserRole } from '@/lib/auth-store';
import { validateEmail, validatePhone, validatePassword } from '@/lib/auth-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shield, Eye, EyeOff, CheckCircle2, AlertTriangle, GraduationCap, Users, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { usePasswordStrength } from '@/hooks/use-password-strength';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [adminInviteCode, setAdminInviteCode] = useState('');

  const register = useAuthStore((s) => s.register);
  const pwStrength = usePasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !phone || !fullName || !password || !confirmPassword) {
      toast.error(t('validation.allFieldsRequired'));
      return;
    }
    if (!validateEmail(email)) {
      toast.error(t('validation.invalidEmail'));
      return;
    }
    if (!validatePhone(phone)) {
      toast.error(t('validation.invalidPhone'));
      return;
    }
    const pwValidation = validatePassword(password);
    if (!pwValidation.valid) {
      toast.error(pwValidation.errors.join(', '));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('validation.passwordMismatch'));
      return;
    }
    setLoading(true);
    const result = await register(
      {
        email,
        phone,
        fullName,
        role: selectedRole,
        inviteCode: adminInviteCode,
      },
      password,
    );
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
    } else {
      router.push(`/${locale}/app`);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href={`/${locale}`}
            className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-600/20 transition hover:bg-violet-700"
          >
            <Shield className="h-8 w-8 text-white" />
          </Link>
          <h1 className="text-foreground text-2xl font-bold">{t('brand.name')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('brand.tagline')}</p>
        </div>

        <Card className="shadow-xl backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{t('register.title')}</CardTitle>
            <CardDescription>{t('register.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">{t('register.fullName')}</Label>
                <Input
                  id="reg-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('register.fullNamePlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="reg-email">{t('register.email')}</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('register.emailPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">{t('register.phone')}</Label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('register.phonePlaceholder')}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-foreground">{t('register.role')}</Label>
                <RadioGroup
                  value={selectedRole}
                  onValueChange={(v) => setSelectedRole(v as UserRole)}
                  className="space-y-2"
                >
                  <div className="border-border bg-card/30 hover:bg-accent flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition">
                    <RadioGroupItem value="student" id="role-student" className="mt-1" />
                    <label htmlFor="role-student" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={16} className="text-violet-400" />
                        <span className="text-sm font-medium">{t('register.roleStudent')}</span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">{t('register.roleStudentDesc')}</p>
                    </label>
                  </div>
                  <div className="border-border bg-card/30 hover:bg-accent flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition">
                    <RadioGroupItem value="teacher" id="role-teacher" className="mt-1" />
                    <label htmlFor="role-teacher" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-amber-400" />
                        <span className="text-sm font-medium">{t('register.roleTeacher')}</span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">{t('register.roleTeacherDesc')}</p>
                    </label>
                  </div>
                  <div className="border-border bg-card/30 hover:bg-accent flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition">
                    <RadioGroupItem value="admin" id="role-admin" className="mt-1" />
                    <label htmlFor="role-admin" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-red-400" />
                        <span className="text-sm font-medium">{t('register.roleAdmin')}</span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">{t('register.roleAdminDesc')}</p>
                    </label>
                  </div>
                </RadioGroup>
              </div>
              <AnimatePresence>
                {selectedRole === 'admin' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="admin-invite-code">{t('register.inviteCode')}</Label>
                    <Input
                      id="admin-invite-code"
                      value={adminInviteCode}
                      onChange={(e) => setAdminInviteCode(e.target.value)}
                      placeholder={t('register.inviteCodePlaceholder')}
                    />
                    <p className="text-xs text-amber-500 dark:text-amber-400">{t('register.inviteCodeHint')}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="space-y-2">
                <Label htmlFor="reg-password">{t('register.password')}</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('register.passwordPlaceholder')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t('register.hidePassword') : t('register.showPassword')}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">{t('register.passwordStrength')}</span>
                      <span
                        className={`text-xs font-medium ${
                          pwStrength.score >= 70
                            ? 'text-emerald-400'
                            : pwStrength.score >= 50
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        }`}
                      >
                        {pwStrength.label}
                      </span>
                    </div>
                    <Progress value={pwStrength.score} className="h-1.5" />
                    <div className="space-y-1">
                      {pwStrength.checks.map((check, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {check.passed ? (
                            <CheckCircle2 size={12} className="text-emerald-400" />
                          ) : (
                            <AlertTriangle size={12} className="text-muted-foreground" />
                          )}
                          <span className={check.passed ? 'text-foreground' : 'text-muted-foreground'}>
                            {check.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-confirm">{t('register.confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="reg-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('register.confirmPasswordPlaceholder')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? t('register.hideConfirm') : t('register.showConfirm')}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-destructive mt-1 text-xs">{t('register.confirmPasswordMismatch')}</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                {loading ? t('register.submitting') : t('register.submit')}
              </Button>
            </form>

            <div className="border-border mt-6 space-y-2 border-t pt-4 text-center text-sm">
              <p className="text-muted-foreground">
                {t('register.hasAccount')}{' '}
                <Link href={`/${locale}/login`} className="text-primary hover:text-primary/80 font-medium">
                  {t('register.loginLink')}
                </Link>
              </p>
              <p className="text-muted-foreground">
                <Link href={`/${locale}`} className="text-muted-foreground hover:text-foreground">
                  {t('login.backToHome')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
