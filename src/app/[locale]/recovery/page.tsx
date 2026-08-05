'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { validatePassword } from '@/lib/auth-utils';
import { usePasswordStrength } from '@/hooks/use-password-strength';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { logger } from '@/lib/logger';

type Step = 'contact' | 'otp' | 'reset' | 'done';

export default function RecoveryPage() {
  const t = useTranslations('auth');
  const te = useTranslations('errors');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<Step>('contact');
  const [loading, setLoading] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showOtp, setShowOtp] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cooldown, setCooldown] = useState(30);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const sendRecoveryOTP = useAuthStore((s) => s.sendRecoveryOTP);
  const verifyRecoveryOTP = useAuthStore((s) => s.verifyRecoveryOTP);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const pwStrength = usePasswordStrength(password);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (step === 'otp') {
      inputsRef.current[0]?.focus();
    }
  }, [step]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      toast.error(t('validation.allFieldsRequired'));
      return;
    }
    setLoading(true);
    try {
      const result = await sendRecoveryOTP(emailOrPhone.trim());
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('recovery.otpSent'));
      setCooldown(30);
      setStep('otp');
    } catch {
      toast.error(t('validation.allFieldsRequired'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;
    const newDigits = [...digits];
    for (let i = 0; i < pasted.length && i < 6; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    const focusIndex = Math.min(pasted.length, 5);
    inputsRef.current[focusIndex]?.focus();
  };

  const handleVerifyOTP = async () => {
    const code = digits.join('');
    if (code.length !== 6) {
      toast.error(te('enterAllDigits'));
      return;
    }
    setLoading(true);
    try {
      const valid = await verifyRecoveryOTP(code);
      if (!valid) {
        toast.error(t('recovery.invalidOtp'));
        return;
      }
      setStep('reset');
    } catch {
      toast.error(t('recovery.invalidOtp'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      await sendRecoveryOTP(emailOrPhone);
    } catch (e) {
      logger.warn('Recovery page: OTP resend failed', { error: String(e) });
    } finally {
      setLoading(false);
    }
    setDigits(['', '', '', '', '', '']);
    setCooldown(30);
    toast.success(t('recovery.otpResent'));
    inputsRef.current[0]?.focus();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error(t('validation.allFieldsRequired'));
      return;
    }
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      toast.error(pwCheck.errors.join(', '));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('validation.passwordMismatch'));
      return;
    }
    const code = digits.join('');
    setLoading(true);
    try {
      const result = await resetPassword(code, password);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('recovery.passwordResetSuccess'));
      setStep('done');
    } catch {
      toast.error(t('validation.allFieldsRequired'));
    } finally {
      setLoading(false);
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
            {step !== 'contact' && (
              <button
                type="button"
                onClick={() => {
                  if (step === 'otp') {
                    setStep('contact');
                    setDigits(['', '', '', '', '', '']);
                  } else if (step === 'reset') setStep('otp');
                }}
                className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm"
              >
                <ArrowLeft size={14} />
                {tc('back')}
              </button>
            )}
            <CardTitle className="text-xl">
              {step === 'contact' && t('recovery.title')}
              {step === 'otp' && t('recovery.otpDescription')}
              {step === 'reset' && t('recovery.newPasswordDescription')}
              {step === 'done' && t('recovery.passwordResetSuccess')}
            </CardTitle>
            <CardDescription>
              {step === 'contact' && t('recovery.description')}
              {step === 'otp' && t('recovery.otpDescription')}
              {step === 'reset' && t('recovery.newPasswordDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {step === 'contact' && (
                <motion.form
                  key="contact"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSendOTP}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="recovery-contact">{t('login.contact')}</Label>
                    <Input
                      id="recovery-contact"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder={t('login.contactPlaceholder')}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                    {loading ? t('recovery.sending') : t('recovery.enterContact')}
                  </Button>
                  <div className="text-center">
                    <Link href={`/${locale}/login`} className="text-muted-foreground hover:text-foreground text-sm">
                      {t('recovery.backToLogin')}
                    </Link>
                  </div>
                </motion.form>
              )}

              {step === 'otp' && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                    {digits.map((digit, i) => (
                      <Input
                        key={i}
                        ref={(el) => {
                          inputsRef.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="border-border h-14 w-12 rounded-xl border-2 text-center text-2xl font-bold focus:border-violet-500 focus:ring-violet-500"
                      />
                    ))}
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowOtp(!showOtp)}
                      className="bg-muted inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition hover:bg-slate-200"
                    >
                      {showOtp ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {showOtp ? t('recovery.hideOtp') : t('recovery.showOtp')}
                    </button>
                  </div>
                  {showOtp && digits.some(Boolean) && (
                    <p className="text-foreground/70 text-center font-mono text-lg tracking-widest">
                      {digits.join('')}
                    </p>
                  )}
                  <Button
                    onClick={handleVerifyOTP}
                    className="w-full bg-violet-600 hover:bg-violet-700"
                    disabled={loading}
                  >
                    {loading ? t('recovery.sending') : t('recovery.enterOtp')}
                  </Button>
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={cooldown > 0 || loading}
                      className={`text-violet-600 ${cooldown > 0 ? 'cursor-not-allowed opacity-50' : 'hover:underline'}`}
                    >
                      {cooldown > 0 ? t('recovery.resendCountdown', { seconds: cooldown }) : t('recovery.resendOtp')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('contact');
                        setDigits(['', '', '', '', '', '']);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {t('recovery.changeMethod')}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'reset' && (
                <motion.form
                  key="reset"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleResetPassword}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="reset-password">{t('recovery.newPasswordLabel')}</Label>
                    <div className="relative">
                      <Input
                        id="reset-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('recovery.newPasswordPlaceholder')}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? t('recovery.hidePassword') : t('recovery.showPassword')}
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-1.5"
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
                    <Label htmlFor="reset-confirm">{t('recovery.confirmNewPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="reset-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('recovery.confirmNewPasswordPlaceholder')}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? t('recovery.hidePassword') : t('recovery.showPassword')}
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-destructive mt-1 text-xs">{t('validation.passwordMismatch')}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                    {loading ? t('recovery.sending') : t('recovery.submit')}
                  </Button>
                </motion.form>
              )}

              {step === 'done' && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 text-center"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-muted-foreground text-sm">{t('recovery.passwordResetSuccess')}</p>
                  <Button
                    onClick={() => router.push(`/${locale}/login`)}
                    className="w-full bg-violet-600 hover:bg-violet-700"
                  >
                    {t('recovery.backToLogin')}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
