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

export default function RegisterPage() {
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

  const { register } = useAuthStore();
  const pwStrength = usePasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !phone || !fullName || !password || !confirmPassword) {
      toast.error('Заполните все поля');
      return;
    }
    if (!validateEmail(email)) {
      toast.error('Некорректный email');
      return;
    }
    if (!validatePhone(phone)) {
      toast.error('Некорректный номер телефона');
      return;
    }
    const pwValidation = validatePassword(password);
    if (!pwValidation.valid) {
      toast.error(pwValidation.errors.join(', '));
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    setLoading(true);
    const result = await register(
      { email, phone, fullName, role: selectedRole, inviteCode: adminInviteCode },
      password
    );
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
    } else {
      router.push('/app');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-16 h-16 bg-violet-600 rounded-2xl mb-3 shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition">
            <Shield className="w-8 h-8 text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-white">CyberSec Lab</h1>
          <p className="text-slate-400 text-sm mt-1">Тренажёр по информационной безопасности</p>
        </div>

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
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Минимум 8 символов"
                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-muted-foreground pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && (
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
                    <div className="space-y-1">
                      {pwStrength.checks.map((check, i) => (
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Пароли не совпадают</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-700/50 text-center text-sm space-y-2">
              <p className="text-slate-400">
                Уже есть аккаунт?{' '}
                <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium">
                  Войти
                </Link>
              </p>
              <p className="text-slate-500">
                <Link href="/" className="text-slate-400 hover:text-slate-300">
                  ← На главную
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
