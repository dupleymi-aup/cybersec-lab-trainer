'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { validateEmail, validatePhone, validatePassword } from '@/lib/auth-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import OTPModal from './OTPModal';
import { Shield, Mail, Phone, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

type AuthPage = 'login' | 'register' | 'recovery';
type RecoveryStep = 'enter-contact' | 'enter-otp' | 'new-password';

export default function AuthPages() {
  const [page, setPage] = useState<AuthPage>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Login state
  const [loginContact, setLoginContact] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Recovery state
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>('enter-contact');
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'phone'>('email');
  const [recoveryContact, setRecoveryContact] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');

  const { login, register, sendRecoveryOTP, verifyRecoveryOTP, resetPassword, recoveryState } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginContact || !loginPassword) {
      toast.error('Заполните все поля');
      return;
    }
    setLoading(true);
    const result = await login(loginContact, loginPassword);
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
    const result = await register({ email: regEmail, phone: regPhone, fullName: regName }, regPassword);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
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
      setRecoveryStep('enter-otp');
    } else {
      toast.error(result.error);
    }
  };

  const handleVerifyOTP = () => {
    const valid = verifyRecoveryOTP(recoveryOtp);
    if (valid) {
      setRecoveryStep('new-password');
    } else {
      toast.error('Неверный или просроченный код');
    }
  };

  const handleResetPassword = () => {
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
    const result = resetPassword(recoveryOtp, recoveryNewPassword);
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

  const passwordErrors = validatePassword(regPassword);

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: '', color: 'bg-slate-200', checks: [] };
    const checks = [
      { label: 'Минимум 8 символов', passed: pw.length >= 8 },
      { label: 'Строчные буквы (a-z)', passed: /[a-z]/.test(pw) },
      { label: 'Заглавные буквы (A-Z)', passed: /[A-Z]/.test(pw) },
      { label: 'Цифры (0-9)', passed: /[0-9]/.test(pw) },
      { label: 'Спецсимволы (!@#$...)', passed: /[^a-zA-Z0-9]/.test(pw) },
      { label: 'Минимум 12 символов', passed: pw.length >= 12 },
    ];
    const passedCount = checks.filter((c) => c.passed).length;
    let score = 0;
    let label = '';
    let color = 'bg-slate-200';
    if (passedCount <= 1) { score = 15; label = 'Очень слабый'; color = 'bg-red-500'; }
    else if (passedCount <= 2) { score = 30; label = 'Слабый'; color = 'bg-red-400'; }
    else if (passedCount <= 3) { score = 50; label = 'Средний'; color = 'bg-yellow-500'; }
    else if (passedCount <= 4) { score = 70; label = 'Хороший'; color = 'bg-emerald-400'; }
    else if (passedCount <= 5) { score = 85; label = 'Надёжный'; color = 'bg-emerald-500'; }
    else { score = 100; label = 'Отличный'; color = 'bg-emerald-600'; }
    return { score, label, color, checks };
  };
  const pwStrength = getPasswordStrength(regPassword);

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
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-600 rounded-2xl mb-3">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CyberSec Lab</h1>
          <p className="text-slate-400 text-sm">Тренажёр по информационной безопасности</p>
        </div>

        <AnimatePresence mode="wait">
          {page === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Вход в аккаунт</CardTitle>
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
                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-slate-300">
                        Пароль
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Введите пароль"
                          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                      {loading ? 'Вход...' : 'Войти'}
                    </Button>
                  </form>

                  <div className="mt-4 space-y-2 text-sm text-center">
                    <button
                      onClick={() => setPage('recovery')}
                      className="text-violet-400 hover:text-violet-300 block w-full"
                    >
                      Забыли пароль?
                    </button>
                    <p className="text-slate-400">
                      Нет аккаунта?{' '}
                      <button onClick={() => setPage('register')} className="text-violet-400 hover:text-violet-300">
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
            >
              <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Регистрация</CardTitle>
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
                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </div>
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
                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
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
                        placeholder="+7 (999) 123-45-67"
                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password" className="text-slate-300">
                        Пароль
                      </Label>
                      <div className="relative">
                        <Input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Минимум 8 символов"
                          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                              pwStrength.score >= 70 ? 'text-emerald-400' :
                              pwStrength.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                            }`}>{pwStrength.label}</span>
                          </div>
                          <Progress value={pwStrength.score} className="h-1.5" />
                          <div className="h-1.5 rounded-full overflow-hidden bg-slate-700">
                            <div
                              className={`h-full ${pwStrength.color} rounded-full transition-all duration-500`}
                              style={{ width: `${pwStrength.score}%` }}
                            />
                          </div>
                          <Separator className="bg-slate-700" />
                          <div className="space-y-1">
                            {pwStrength.checks.map((check, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                {check.passed ? (
                                  <CheckCircle2 size={12} className="text-emerald-400" />
                                ) : (
                                  <AlertTriangle size={12} className="text-slate-600" />
                                )}
                                <span className={check.passed ? 'text-slate-300' : 'text-slate-500'}>
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
                          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 pr-10"
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

                  <div className="mt-4 text-sm text-center text-slate-400">
                    Уже есть аккаунт?{' '}
                    <button onClick={() => setPage('login')} className="text-violet-400 hover:text-violet-300">
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
              <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Восстановление пароля</CardTitle>
                  <CardDescription className="text-slate-400">
                    {recoveryStep === 'enter-contact' && 'Укажите email или телефон для восстановления'}
                    {recoveryStep === 'enter-otp' && 'Введите код подтверждения'}
                    {recoveryStep === 'new-password' && 'Придумайте новый пароль'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recoveryStep === 'enter-contact' && (
                    <div className="space-y-4">
                      <div className="flex gap-2 mb-4">
                        <button
                          type="button"
                          onClick={() => setRecoveryMethod('email')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition ${
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
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition ${
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
                          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
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
                        <span className="text-xs text-slate-500 bg-slate-700/50 px-3 py-1.5 rounded-lg inline-block">
                          Ваш код: <strong className="text-violet-400 select-all">{recoveryState?.otp || '—'}</strong>
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Код подтверждения</Label>
                        <Input
                          value={recoveryOtp}
                          onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Введите 6-значный код"
                          maxLength={6}
                          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 text-center text-xl tracking-widest"
                        />
                      </div>
                      <Button onClick={handleVerifyOTP} className="w-full bg-violet-600 hover:bg-violet-700">
                        Подтвердить
                      </Button>
                      <button
                        onClick={() => setRecoveryStep('enter-contact')}
                        className="w-full text-sm text-violet-400 hover:text-violet-300"
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
                            className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
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
                            className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                          >
                            {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <Button onClick={handleResetPassword} className="w-full bg-violet-600 hover:bg-violet-700">
                        Сохранить новый пароль
                      </Button>
                    </div>
                  )}

                  {recoveryStep !== 'enter-otp' && (
                    <div className="mt-4 text-sm text-center text-slate-400">
                      <button onClick={() => { setPage('login'); setRecoveryStep('enter-contact'); }} className="text-violet-400 hover:text-violet-300">
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

      {/* We need the OTP from the store, but since it's in state, we pass it from a custom hook */}
      {/* For simplicity, the OTP is shown inline in the recovery step */}
    </div>
  );
}
