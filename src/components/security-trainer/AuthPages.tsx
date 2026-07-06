'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, type UserRole } from '@/lib/auth-store';
import { useTranslations } from 'next-intl';
import { validateEmail, validatePhone, validatePassword } from '@/lib/auth-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  Mail,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { usePasswordStrength } from '@/hooks/use-password-strength';
import { Progress } from '@/components/ui/progress';

type AuthPage = 'login' | 'register' | 'recovery';
type RecoveryStep = 'enter-contact' | 'enter-otp' | 'new-password';

export default function AuthPages() {
  const [page, setPage] = useState<AuthPage>('login');
  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Login state
  const [loginContact, setLoginContact] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [adminInviteCode, setAdminInviteCode] = useState('');

  // Recovery state
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>('enter-contact');
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'phone'>('email');
  const [recoveryContact, setRecoveryContact] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [showRecoveryOtp, setShowRecoveryOtp] = useState(false);
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');

  // OTP countdown timer
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const sendRecoveryOTP = useAuthStore((s) => s.sendRecoveryOTP);
  const verifyRecoveryOTP = useAuthStore((s) => s.verifyRecoveryOTP);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const recoveryState = useAuthStore((s) => s.recoveryState);

  const t = useTranslations('auth');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginContact || !loginPassword) {
      toast.error(t('validation.allFieldsRequired'));
      return;
    }
    setLoading(true);
    const result = await login(loginContact, loginPassword, rememberMe);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPhone || !regName || !regPassword || !regConfirmPassword) {
      toast.error(t('validation.allFieldsRequired'));
      return;
    }
    if (!validateEmail(regEmail)) {
      toast.error(t('validation.invalidEmail'));
      return;
    }
    if (!validatePhone(regPhone)) {
      toast.error(t('validation.invalidPhone'));
      return;
    }
    const pwValidation = validatePassword(regPassword);
    if (!pwValidation.valid) {
      toast.error(pwValidation.errors.join(', '));
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error(t('validation.passwordMismatch'));
      return;
    }
    setLoading(true);
    const result = await register(
      {
        email: regEmail,
        phone: regPhone,
        fullName: regName,
        role: selectedRole,
        inviteCode: adminInviteCode,
      },
      regPassword,
    );
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
    } else {
      setAdminInviteCode('');
    }
  };

  const handleSendRecovery = async () => {
    if (!recoveryContact) {
      toast.error(t('validation.allFieldsRequired'));
      return;
    }
    if (recoveryMethod === 'email' && !validateEmail(recoveryContact)) {
      toast.error(t('validation.invalidEmail'));
      return;
    }
    if (recoveryMethod === 'phone' && !validatePhone(recoveryContact)) {
      toast.error(t('validation.invalidPhone'));
      return;
    }
    setLoading(true);
    const result = await sendRecoveryOTP(recoveryContact);
    setLoading(false);
    if (result.success) {
      toast.success(t('recovery.otpSent'));
      setShowRecoveryOtp(false);
      setRecoveryStep('enter-otp');
      setCountdown(60);
    } else {
      toast.error(result.error);
    }
  };

  const handleVerifyOTP = async () => {
    const valid = await verifyRecoveryOTP(recoveryOtp);
    if (valid) {
      setRecoveryStep('new-password');
    } else {
      toast.error(t('recovery.invalidOtp'));
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    const result = await sendRecoveryOTP(recoveryContact);
    setLoading(false);
    if (result.success) {
      toast.success(t('recovery.otpResent'));
      setCountdown(60);
    } else {
      toast.error(result.error);
    }
  };

  const handleResetPassword = async () => {
    if (!recoveryNewPassword || !recoveryConfirmPassword) {
      toast.error(t('validation.allFieldsRequired'));
      return;
    }
    const pwValidation = validatePassword(recoveryNewPassword);
    if (!pwValidation.valid) {
      toast.error(pwValidation.errors.join(', '));
      return;
    }
    if (recoveryNewPassword !== recoveryConfirmPassword) {
      toast.error(t('validation.passwordMismatch'));
      return;
    }
    const result = await resetPassword(recoveryOtp, recoveryNewPassword);
    if (result.success) {
      toast.success(t('recovery.passwordResetSuccess'));
      setPage('login');
      setRecoveryStep('enter-contact');
      setRecoveryContact('');
      setRecoveryOtp('');
      setRecoveryNewPassword('');
      setRecoveryConfirmPassword('');
    } else {
      toast.error(result.error);
    }
  };

  const regPwStrength = usePasswordStrength(regPassword);
  const recoveryPwStrength = usePasswordStrength(recoveryNewPassword);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-4">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-600/20">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('brand.name')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('brand.tagline')}</p>
        </div>

        <AnimatePresence mode="wait">
          {page === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className="border-slate-700/50 bg-slate-800/80 shadow-xl backdrop-blur-xl dark:bg-slate-700/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-white">{t('login.title')}</CardTitle>
                  <CardDescription className="text-slate-400">{t('login.subtitle')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-contact" className="text-slate-300">
                        {t('login.contact')}
                      </Label>
                      <Input
                        id="login-contact"
                        value={loginContact}
                        onChange={(e) => setLoginContact(e.target.value)}
                        placeholder={t('login.contactPlaceholder')}
                        className="placeholder:text-muted-foreground border-slate-600 bg-slate-900/50 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-slate-300">
                        {t('login.password')}
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder={t('login.passwordPlaceholder')}
                          className="placeholder:text-muted-foreground border-slate-600 bg-slate-900/50 pr-10 text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="remember-me"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(!!checked)}
                        />
                        <Label htmlFor="remember-me" className="cursor-pointer text-sm text-slate-300">
                          {t('login.rememberMe')}
                        </Label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPage('recovery')}
                        className="text-sm text-violet-400 hover:text-violet-300"
                      >
                        {t('login.forgotPassword')}
                      </button>
                    </div>
                    <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                      {loading ? t('login.submitting') : t('login.submit')}
                    </Button>
                  </form>

                  <div className="mt-6 border-t border-slate-700/50 pt-4 text-center text-sm">
                    <p className="text-slate-400">
                      {t('login.noAccount')}{' '}
                      <button
                        type="button"
                        onClick={() => setPage('register')}
                        className="font-medium text-violet-400 hover:text-violet-300"
                      >
                        {t('login.registerLink')}
                      </button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {page === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-slate-700/50 bg-slate-800/80 shadow-xl backdrop-blur-xl dark:bg-slate-700/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-white">{t('register.title')}</CardTitle>
                  <CardDescription className="text-slate-400">{t('register.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name" className="text-slate-300">
                        {t('register.fullName')}
                      </Label>
                      <Input
                        id="reg-name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder={t('register.fullNamePlaceholder')}
                        className="placeholder:text-muted-foreground border-slate-600 bg-slate-900/50 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="reg-email" className="text-slate-300">
                          {t('register.email')}
                        </Label>
                        <Input
                          id="reg-email"
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder={t('register.emailPlaceholder')}
                          className="placeholder:text-muted-foreground border-slate-600 bg-slate-900/50 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-phone" className="text-slate-300">
                          {t('register.phone')}
                        </Label>
                        <Input
                          id="reg-phone"
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder={t('register.phonePlaceholder')}
                          className="placeholder:text-muted-foreground border-slate-600 bg-slate-900/50 text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-slate-300">{t('register.role')}</Label>
                      <RadioGroup
                        value={selectedRole}
                        onValueChange={(v) => setSelectedRole(v as UserRole)}
                        className="space-y-2"
                      >
                        <div className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-600 bg-slate-900/30 p-3 transition hover:bg-slate-800 dark:bg-slate-700/50">
                          <RadioGroupItem value="student" id="role-student" className="mt-1" />
                          <label htmlFor="role-student" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <GraduationCap size={16} className="text-violet-400" />
                              <span className="text-sm font-medium text-white">{t('register.roleStudent')}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-400">{t('register.roleStudentDesc')}</p>
                          </label>
                        </div>
                        <div className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-600 bg-slate-900/30 p-3 transition hover:bg-slate-800 dark:bg-slate-700/50">
                          <RadioGroupItem value="teacher" id="role-teacher" className="mt-1" />
                          <label htmlFor="role-teacher" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-amber-400" />
                              <span className="text-sm font-medium text-white">{t('register.roleTeacher')}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-400">{t('register.roleTeacherDesc')}</p>
                          </label>
                        </div>
                        <div className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-600 bg-slate-900/30 p-3 transition hover:bg-slate-800 dark:bg-slate-700/50">
                          <RadioGroupItem value="admin" id="role-admin" className="mt-1" />
                          <label htmlFor="role-admin" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={16} className="text-red-400" />
                              <span className="text-sm font-medium text-white">{t('register.roleAdmin')}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-400">{t('register.roleAdminDesc')}</p>
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
                          <Label htmlFor="admin-invite-code" className="text-slate-300">
                            {t('register.inviteCode')}
                          </Label>
                          <Input
                            id="admin-invite-code"
                            value={adminInviteCode}
                            onChange={(e) => setAdminInviteCode(e.target.value)}
                            placeholder={t('register.inviteCodePlaceholder')}
                            className="placeholder:text-muted-foreground border-slate-600 bg-slate-900/50 text-white"
                          />
                          <p className="text-xs text-amber-400">{t('register.inviteCodeHint')}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password" className="text-slate-300">
                        {t('register.password')}
                      </Label>
                      <div className="relative">
                        <Input
                          id="reg-password"
                          type={showRegisterPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder={t('recovery.newPasswordPlaceholder')}
                          className="placeholder:text-muted-foreground border-slate-600 bg-slate-900/50 pr-10 text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {regPassword && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">{t('register.passwordStrength')}</span>
                            <span
                              className={`text-xs font-medium ${
                                regPwStrength.score >= 70
                                  ? 'text-emerald-400'
                                  : regPwStrength.score >= 50
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                              }`}
                            >
                              {regPwStrength.label}
                            </span>
                          </div>
                          <Progress value={regPwStrength.score} className="h-1.5" />
                          <div className="space-y-1">
                            {regPwStrength.checks.map((check, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                {check.passed ? (
                                  <CheckCircle2 size={12} className="text-emerald-400" />
                                ) : (
                                  <AlertTriangle size={12} className="text-muted-foreground" />
                                )}
                                <span className={check.passed ? 'text-slate-300' : 'text-muted-foreground'}>
                                  {check.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-confirm" className="text-slate-300">
                        {t('register.confirmPassword')}
                      </Label>
                      <div className="relative">
                        <Input
                          id="reg-confirm"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder={t('recovery.confirmNewPasswordPlaceholder')}
                          className="placeholder:text-muted-foreground border-slate-600 bg-slate-900/50 pr-10 text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {regConfirmPassword && regPassword !== regConfirmPassword && (
                        <p className="mt-1 text-xs text-red-400">{t('register.confirmPasswordMismatch')}</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                      {loading ? t('register.submitting') : t('register.submit')}
                    </Button>
                  </form>

                  <div className="mt-6 border-t border-slate-700/50 pt-4 text-center text-sm text-slate-400">
                    {t('register.hasAccount')}{' '}
                    <button
                      type="button"
                      onClick={() => setPage('login')}
                      className="font-medium text-violet-400 hover:text-violet-300"
                    >
                      {t('register.loginLink')}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {page === 'recovery' && (
            <motion.div
              key="recovery"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className="border-slate-700/50 bg-slate-800/80 shadow-xl backdrop-blur-xl dark:bg-slate-700/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-white">{t('recovery.title')}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {recoveryStep === 'enter-contact' && t('recovery.description')}
                    {recoveryStep === 'enter-otp' && t('recovery.otpDescription')}
                    {recoveryStep === 'new-password' && t('recovery.newPasswordDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recoveryStep === 'enter-contact' && (
                    <div className="space-y-4">
                      <div className="mb-4 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRecoveryMethod('email')}
                          className={`flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 transition ${
                            recoveryMethod === 'email'
                              ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                              : 'border-slate-600 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <Mail className="h-4 w-4" />
                          {t('register.email')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecoveryMethod('phone')}
                          className={`flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 transition ${
                            recoveryMethod === 'phone'
                              ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                              : 'border-slate-600 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <Phone className="h-4 w-4" />
                          {t('register.phone')}
                        </button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recovery-contact" className="text-slate-300">
                          {t('register.contact')}
                        </Label>
                        <Input
                          id="recovery-contact"
                          type={recoveryMethod === 'email' ? 'email' : 'tel'}
                          value={recoveryContact}
                          onChange={(e) => setRecoveryContact(e.target.value)}
                          placeholder={t('register.contactPlaceholder')}
                          className="placeholder:text-muted-foreground border-slate-600 bg-slate-900/50 text-white"
                        />
                      </div>
                      <Button
                        onClick={handleSendRecovery}
                        className="w-full bg-violet-600 hover:bg-violet-700"
                        disabled={loading}
                      >
                        {loading ? t('recovery.sending') : t('recovery.enterContact')}
                      </Button>
                    </div>
                  )}

                  {recoveryStep === 'enter-otp' && (
                    <div className="space-y-4">
                      <div className="mb-2 text-center">
                        <button
                          type="button"
                          onClick={() => setShowRecoveryOtp(!showRecoveryOtp)}
                          className="text-muted-foreground inline-flex items-center gap-1.5 rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs transition hover:bg-slate-700/70"
                        >
                          {showRecoveryOtp ? (
                            <>
                              <EyeOff className="h-3 w-3" />
                              <span className="font-mono text-violet-400">{recoveryState?.otp || '—'}</span>
                              <span className="text-muted-foreground">{t('recovery.hideOtp')}</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3" />
                              {t('recovery.showOtp')}
                            </>
                          )}
                        </button>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">{t('recovery.otpLabel')}</Label>
                        <Input
                          value={recoveryOtp}
                          onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder={t('recovery.otpPlaceholder')}
                          maxLength={6}
                          className="placeholder:text-muted-foreground border-slate-600 bg-slate-900/50 text-center text-xl tracking-widest text-white"
                        />
                      </div>
                      <Button onClick={handleVerifyOTP} className="w-full bg-violet-600 hover:bg-violet-700">
                        {t('recovery.enterOtp')}
                      </Button>
                      <div className="space-y-2 text-center">
                        {countdown > 0 ? (
                          <p className="text-xs text-slate-400">
                            {t('recovery.resendCountdown', {
                              seconds: countdown,
                            })}
                          </p>
                        ) : (
                          <button
                            onClick={handleResendOTP}
                            disabled={loading}
                            className="text-sm text-violet-400 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {t('recovery.resendOtp')}
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => setRecoveryStep('enter-contact')}
                        className="text-muted-foreground w-full text-sm hover:text-slate-400"
                      >
                        {t('recovery.changeMethod')}
                      </button>
                    </div>
                  )}

                  {recoveryStep === 'new-password' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="text-slate-300">
                          {t('recovery.newPasswordLabel')}
                        </Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showNewPassword ? 'text' : 'password'}
                            value={recoveryNewPassword}
                            onChange={(e) => setRecoveryNewPassword(e.target.value)}
                            placeholder={t('register.passwordPlaceholder')}
                            className="placeholder:text-muted-foreground border-slate-600 bg-slate-900/50 pr-10 text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {recoveryNewPassword && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400">{t('register.passwordStrength')}</span>
                              <span
                                className={`text-xs font-medium ${
                                  recoveryPwStrength.score >= 70
                                    ? 'text-emerald-400'
                                    : recoveryPwStrength.score >= 50
                                      ? 'text-yellow-400'
                                      : 'text-red-400'
                                }`}
                              >
                                {recoveryPwStrength.label}
                              </span>
                            </div>
                            <Progress value={recoveryPwStrength.score} className="h-1.5" />
                            <div className="space-y-1">
                              {recoveryPwStrength.checks.map((check, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  {check.passed ? (
                                    <CheckCircle2 size={12} className="text-emerald-400" />
                                  ) : (
                                    <AlertTriangle size={12} className="text-muted-foreground" />
                                  )}
                                  <span className={check.passed ? 'text-slate-300' : 'text-muted-foreground'}>
                                    {check.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-new-password" className="text-slate-300">
                          {t('recovery.confirmNewPassword')}
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirm-new-password"
                            type={showConfirmNewPassword ? 'text' : 'password'}
                            value={recoveryConfirmPassword}
                            onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                            placeholder={t('register.confirmPasswordPlaceholder')}
                            className="placeholder:text-muted-foreground border-slate-600 bg-slate-900/50 pr-10 text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                          >
                            {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {recoveryConfirmPassword && recoveryNewPassword && (
                          <p
                            className={`mt-1 flex items-center gap-1 text-xs ${
                              recoveryNewPassword === recoveryConfirmPassword ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {recoveryNewPassword === recoveryConfirmPassword ? (
                              <>
                                <CheckCircle2 size={12} /> {t('recovery.passwordsMatch')}
                              </>
                            ) : (
                              <>
                                <AlertTriangle size={12} /> {t('register.confirmPasswordMismatch')}
                              </>
                            )}
                          </p>
                        )}
                      </div>
                      <Button onClick={handleResetPassword} className="w-full bg-violet-600 hover:bg-violet-700">
                        {t('recovery.submit')}
                      </Button>
                    </div>
                  )}

                  {recoveryStep !== 'enter-otp' && (
                    <div className="mt-6 border-t border-slate-700/50 pt-4 text-center text-sm text-slate-400">
                      <button
                        type="button"
                        onClick={() => {
                          setPage('login');
                          setRecoveryStep('enter-contact');
                        }}
                        className="font-medium text-violet-400 hover:text-violet-300"
                      >
                        {t('recovery.backToLogin')}
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
