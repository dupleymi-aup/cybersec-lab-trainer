'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, type UserRole } from '@/lib/auth-store';
import { validateEmail, validatePhone, validatePassword } from '@/lib/auth-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Mail, Phone, Eye, EyeOff, CheckCircle2, AlertTriangle, GraduationCap, Users, ShieldCheck } from 'lucide-react';
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
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const login = useAuthStore(s => s.login);
  const register = useAuthStore(s => s.register);
  const sendRecoveryOTP = useAuthStore(s => s.sendRecoveryOTP);
  const verifyRecoveryOTP = useAuthStore(s => s.verifyRecoveryOTP);
  const resetPassword = useAuthStore(s => s.resetPassword);
  const recoveryState = useAuthStore(s => s.recoveryState);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginContact || !loginPassword) {
      toast.error('Заполните все поля');
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
      toast.error('Заполните все поля');
      return;
    }
    if (!validateEmail(regEmail)) {
      toast.error('Некорректный email');
      return;
    }
    if (!validatePhone(regPhone)) {
      toast.error('Некорректный номер телефона');
      return;
    }
    const pwValidation = validatePassword(regPassword);
    if (!pwValidation.valid) {
      toast.error(pwValidation.errors.join(', '));
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    setLoading(true);
    const result = await register(
      { email: regEmail, phone: regPhone, fullName: regName, role: selectedRole, inviteCode: adminInviteCode },
      regPassword
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
      toast.error('Введите email или телефон');
      return;
    }
    if (recoveryMethod === 'email' && !validateEmail(recoveryContact)) {
      toast.error('Некорректный email');
      return;
    }
    if (recoveryMethod === 'phone' && !validatePhone(recoveryContact)) {
      toast.error('Некорректный номер телефона');
      return;
    }
    setLoading(true);
    const result = await sendRecoveryOTP(recoveryContact);
    setLoading(false);
    if (result.success) {
      toast.success('Код отправлен');
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
      toast.error('Неверный или просроченный код');
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    const result = await sendRecoveryOTP(recoveryContact);
    setLoading(false);
    if (result.success) {
      toast.success('Новый код отправлен');
      setCountdown(60);
    } else {
      toast.error(result.error);
    }
  };

  const handleResetPassword = async () => {
    if (!recoveryNewPassword || !recoveryConfirmPassword) {
      toast.error('Заполните все поля');
      return;
    }
    const pwValidation = validatePassword(recoveryNewPassword);
    if (!pwValidation.valid) {
      toast.error(pwValidation.errors.join(', '));
      return;
    }
    if (recoveryNewPassword !== recoveryConfirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    const result = await resetPassword(recoveryOtp, recoveryNewPassword);
    if (result.success) {
      toast.success('Пароль успешно изменён');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-600 rounded-2xl mb-3 shadow-lg shadow-violet-600/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CyberSec Lab</h1>
          <p className="text-slate-400 text-sm mt-1">Тренажёр по информационной безопасности</p>
        </div>

        <AnimatePresence mode="wait">
          {page === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className="border-slate-700/50 bg-slate-800/80 dark:bg-slate-700/50 backdrop-blur-xl shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-xl">Вход в аккаунт</CardTitle>
                  <CardDescription className="text-slate-400">
                    Введите email или телефон и пароль
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-contact" className="text-slate-300">
                        Email или телефон
                      </Label>
                      <Input
                        id="login-contact"
                        value={loginContact}
                        onChange={(e) => setLoginContact(e.target.value)}
                        placeholder="example@mail.com или +7..."
                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-slate-300">
                        Пароль
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Введите пароль"
                          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-muted-foreground pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                        <Label htmlFor="remember-me" className="text-sm text-slate-300 cursor-pointer">
                          Запомнить меня
                        </Label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPage('recovery')}
                        className="text-sm text-violet-400 hover:text-violet-300"
                      >
                        Забыли пароль?
                      </button>
                    </div>
                    <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                      {loading ? 'Вход...' : 'Войти'}
                    </Button>
                  </form>

                  <div className="mt-6 pt-4 border-t border-slate-700/50 text-center text-sm">
                    <p className="text-slate-400">
                      Нет аккаунта?{' '}
                      <button onClick={() => setPage('register')} className="text-violet-400 hover:text-violet-300 font-medium">
                        Зарегистрироваться
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
              <Card className="border-slate-700/50 bg-slate-800/80 dark:bg-slate-700/50 backdrop-blur-xl shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-xl">Регистрация</CardTitle>
                  <CardDescription className="text-slate-400">
                    Создайте аккаунт для начала обучения
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name" className="text-slate-300">
                        ФИО
                      </Label>
                      <Input
                        id="reg-name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Иванов Иван Иванович"
                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="reg-email" className="text-slate-300">
                          Email
                        </Label>
                        <Input
                          id="reg-email"
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="example@mail.com"
                          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-muted-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-phone" className="text-slate-300">
                          Телефон
                        </Label>
                        <Input
                          id="reg-phone"
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+7 (999)..."
                          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-slate-300">Роль</Label>
                      <RadioGroup value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)} className="space-y-2">
                        <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-600 bg-slate-900/30 hover:bg-slate-800 dark:bg-slate-700/50 transition cursor-pointer">
                          <RadioGroupItem value="student" id="role-student" className="mt-1" />
                          <label htmlFor="role-student" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <GraduationCap size={16} className="text-violet-400" />
                              <span className="text-sm font-medium text-white">Студент</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">Изучайте модули, проходите квизы и выполняйте лабораторные работы</p>
                          </label>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-600 bg-slate-900/30 hover:bg-slate-800 dark:bg-slate-700/50 transition cursor-pointer">
                          <RadioGroupItem value="teacher" id="role-teacher" className="mt-1" />
                          <label htmlFor="role-teacher" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-amber-400" />
                              <span className="text-sm font-medium text-white">Преподаватель</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">Отслеживайте прогресс студентов, управляйте группами и смотрите аналитику</p>
                          </label>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-600 bg-slate-900/30 hover:bg-slate-800 dark:bg-slate-700/50 transition cursor-pointer">
                          <RadioGroupItem value="admin" id="role-admin" className="mt-1" />
                          <label htmlFor="role-admin" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={16} className="text-red-400" />
                              <span className="text-sm font-medium text-white">Администратор</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">Полный доступ: управление пользователями, база данных, системные настройки</p>
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
                            Код приглашения администратора
                          </Label>
                          <Input
                            id="admin-invite-code"
                            value={adminInviteCode}
                            onChange={(e) => setAdminInviteCode(e.target.value)}
                            placeholder="Введите код приглашения"
                            className="bg-slate-900/50 border-slate-600 text-white placeholder:text-muted-foreground"
                          />
                          <p className="text-xs text-amber-400">
                            Для получения роли администратора необходим код приглашения
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password" className="text-slate-300">
                        Пароль
                      </Label>
                      <div className="relative">
                        <Input
                          id="reg-password"
                          type={showRegisterPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Минимум 8 символов"
                          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-muted-foreground pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {regPassword && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Надёжность пароля</span>
                            <span className={`text-xs font-medium ${
                              regPwStrength.score >= 70 ? 'text-emerald-400' :
                              regPwStrength.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                            }`}>{regPwStrength.label}</span>
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
                        Подтверждение пароля
                      </Label>
                      <div className="relative">
                        <Input
                          id="reg-confirm"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Повторите пароль"
                          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-muted-foreground pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {regConfirmPassword && regPassword !== regConfirmPassword && (
                        <p className="text-xs text-red-400 mt-1">Пароли не совпадают</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                      {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </Button>
                  </form>

                  <div className="mt-6 pt-4 border-t border-slate-700/50 text-center text-sm text-slate-400">
                    Уже есть аккаунт?{' '}
                    <button onClick={() => setPage('login')} className="text-violet-400 hover:text-violet-300 font-medium">
                      Войти
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
              <Card className="border-slate-700/50 bg-slate-800/80 dark:bg-slate-700/50 backdrop-blur-xl shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-xl">Восстановление пароля</CardTitle>
                  <CardDescription className="text-slate-400">
                    {recoveryStep === 'enter-contact' && 'Укажите email или телефон для восстановления'}
                    {recoveryStep === 'enter-otp' && 'Введите код подтверждения'}
                    {recoveryStep === 'new-password' && 'Придумайте новый пароль'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recoveryStep === 'enter-contact' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <button
                          type="button"
                          onClick={() => setRecoveryMethod('email')}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition ${
                            recoveryMethod === 'email'
                              ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                              : 'border-slate-600 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecoveryMethod('phone')}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition ${
                            recoveryMethod === 'phone'
                              ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                              : 'border-slate-600 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <Phone className="w-4 h-4" />
                          Телефон
                        </button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recovery-contact" className="text-slate-300">
                          {recoveryMethod === 'email' ? 'Email' : 'Телефон'}
                        </Label>
                        <Input
                          id="recovery-contact"
                          type={recoveryMethod === 'email' ? 'email' : 'tel'}
                          value={recoveryContact}
                          onChange={(e) => setRecoveryContact(e.target.value)}
                          placeholder={recoveryMethod === 'email' ? 'example@mail.com' : '+7 (999) 123-45-67'}
                          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-muted-foreground"
                        />
                      </div>
                      <Button onClick={handleSendRecovery} className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                        {loading ? 'Отправка...' : 'Отправить код'}
                      </Button>
                    </div>
                  )}

                  {recoveryStep === 'enter-otp' && (
                    <div className="space-y-4">
                      <div className="text-center mb-2">
                        <button
                          type="button"
                          onClick={() => setShowRecoveryOtp(!showRecoveryOtp)}
                          className="text-xs text-muted-foreground bg-slate-700/50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 hover:bg-slate-700/70 transition"
                        >
                          {showRecoveryOtp ? (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span className="text-violet-400 font-mono">{recoveryState?.otp || '—'}</span>
                              <span className="text-muted-foreground">скрыть</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              Показать код
                            </>
                          )}
                        </button>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Код подтверждения</Label>
                        <Input
                          value={recoveryOtp}
                          onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Введите 6-значный код"
                          maxLength={6}
                          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-muted-foreground text-center text-xl tracking-widest"
                        />
                      </div>
                      <Button onClick={handleVerifyOTP} className="w-full bg-violet-600 hover:bg-violet-700">
                        Подтвердить
                      </Button>
                      <div className="text-center space-y-2">
                        {countdown > 0 ? (
                          <p className="text-xs text-slate-400">
                            Отправить код повторно через <span className="text-violet-400 font-semibold">{countdown} сек</span>
                          </p>
                        ) : (
                          <button
                            onClick={handleResendOTP}
                            disabled={loading}
                            className="text-sm text-violet-400 hover:text-violet-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Отправить код повторно
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => setRecoveryStep('enter-contact')}
                        className="w-full text-sm text-muted-foreground hover:text-slate-400"
                      >
                        Изменить способ восстановления
                      </button>
                    </div>
                  )}

                  {recoveryStep === 'new-password' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="text-slate-300">
                          Новый пароль
                        </Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showNewPassword ? 'text' : 'password'}
                            value={recoveryNewPassword}
                            onChange={(e) => setRecoveryNewPassword(e.target.value)}
                            placeholder="Минимум 8 символов"
                            className="bg-slate-900/50 border-slate-600 text-white placeholder:text-muted-foreground pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {recoveryNewPassword && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400">Надёжность пароля</span>
                              <span className={`text-xs font-medium ${
                                recoveryPwStrength.score >= 70 ? 'text-emerald-400' :
                                recoveryPwStrength.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                              }`}>{recoveryPwStrength.label}</span>
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
                          Подтверждение пароля
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirm-new-password"
                            type={showConfirmNewPassword ? 'text' : 'password'}
                            value={recoveryConfirmPassword}
                            onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                            placeholder="Повторите пароль"
                            className="bg-slate-900/50 border-slate-600 text-white placeholder:text-muted-foreground pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                          >
                            {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {recoveryConfirmPassword && recoveryNewPassword && (
                          <p className={`text-xs mt-1 flex items-center gap-1 ${
                            recoveryNewPassword === recoveryConfirmPassword ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {recoveryNewPassword === recoveryConfirmPassword ? (
                              <><CheckCircle2 size={12} /> Пароли совпадают</>
                            ) : (
                              <><AlertTriangle size={12} /> Пароли не совпадают</>
                            )}
                          </p>
                        )}
                      </div>
                      <Button onClick={handleResetPassword} className="w-full bg-violet-600 hover:bg-violet-700">
                        Сохранить новый пароль
                      </Button>
                    </div>
                  )}

                  {recoveryStep !== 'enter-otp' && (
                    <div className="mt-6 pt-4 border-t border-slate-700/50 text-center text-sm text-slate-400">
                      <button onClick={() => { setPage('login'); setRecoveryStep('enter-contact'); }} className="text-violet-400 hover:text-violet-300 font-medium">
                        Вернуться ко входу
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
