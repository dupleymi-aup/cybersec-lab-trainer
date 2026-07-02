'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Zap,
  RefreshCw,
  Lock,
} from 'lucide-react';

interface PasswordCheck {
  label: string;
  description: string;
  passed: boolean;
}

interface CrackTime {
  label: string;
  seconds: number;
  color: string;
}

function calculateCrackTime(password: string): CrackTime {
  if (!password) return { label: '—', seconds: 0, color: 'text-muted-foreground' };

  // Calculate entropy
  let charSpace = 0;
  if (/[a-z]/.test(password)) charSpace += 26;
  if (/[A-Z]/.test(password)) charSpace += 26;
  if (/[0-9]/.test(password)) charSpace += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charSpace += 33;

  if (charSpace === 0) return { label: 'Мгновенно', seconds: 0, color: 'text-red-500' };

  const entropy = password.length * Math.log2(charSpace);
  // Assume 10 billion guesses per second (GPU cluster)
  const guessesPerSecond = 10_000_000_000;
  const totalGuesses = Math.pow(2, entropy);
  const seconds = totalGuesses / guessesPerSecond / 2; // Average case

  if (seconds < 1) return { label: 'Мгновенно', seconds: 0, color: 'text-red-500' };
  if (seconds < 60) return { label: 'Несколько секунд', seconds, color: 'text-red-500' };
  if (seconds < 3600) return { label: `${Math.round(seconds / 60)} минут`, seconds, color: 'text-orange-500' };
  if (seconds < 86400) return { label: `${Math.round(seconds / 3600)} часов`, seconds, color: 'text-yellow-500' };
  if (seconds < 31536000) return { label: `${Math.round(seconds / 86400)} дней`, seconds, color: 'text-emerald-400' };
  if (seconds < 31536000 * 1000) return { label: `${Math.round(seconds / 31536000)} лет`, seconds, color: 'text-emerald-500' };
  if (seconds < 31536000 * 1_000_000) return { label: `${Math.round(seconds / 31536000 / 1000)} тыс. лет`, seconds, color: 'text-emerald-500' };
  if (seconds < 31536000 * 1_000_000_000) return { label: `${Math.round(seconds / 31536000 / 1_000_000)} млн лет`, seconds, color: 'text-emerald-600' };
  return { label: '∞ (практически невзламываемый)', seconds, color: 'text-emerald-600' };
}

function generatePassword(length: number = 16, options: { uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean } = { uppercase: true, lowercase: true, numbers: true, symbols: true }): string {
  const chars = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  };

  let charset = '';
  if (options.uppercase) charset += chars.uppercase;
  if (options.lowercase) charset += chars.lowercase;
  if (options.numbers) charset += chars.numbers;
  if (options.symbols) charset += chars.symbols;

  if (!charset) charset = chars.lowercase;

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  return Array.from(array, (n) => charset[n % charset.length]).join('');
}

function getStrengthScore(password: string): number {
  if (!password) return 0;
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
    password.length >= 12,
    password.length >= 16,
    !/(.)\1{2,}/.test(password), // No repeated chars
    !/(012|123|234|345|456|567|678|789|abc|bcd|cde|def)/i.test(password), // No sequences
  ];
  return checks.filter(Boolean).length;
}

export default function PasswordStrengthChecker() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [genOptions, setGenOptions] = useState({ uppercase: true, lowercase: true, numbers: true, symbols: true });
  const [genLength, setGenLength] = useState(16);

  const checks: PasswordCheck[] = useMemo(() => [
    { label: 'Минимум 8 символов', description: 'Базовое требование NIST', passed: password.length >= 8 },
    { label: 'Минимум 12 символов', description: 'Рекомендуемая минимальная длина', passed: password.length >= 12 },
    { label: 'Минимум 16 символов', description: 'Оптимальная длина для высокой безопасности', passed: password.length >= 16 },
    { label: 'Строчные буквы (a-z)', description: 'Расширяет пространство символов на 26', passed: /[a-z]/.test(password) },
    { label: 'Заглавные буквы (A-Z)', description: 'Удваивает алфавитное пространство', passed: /[A-Z]/.test(password) },
    { label: 'Цифры (0-9)', description: 'Добавляет 10 дополнительных символов', passed: /[0-9]/.test(password) },
    { label: 'Спецсимволы (!@#$...)', description: 'Добавляет ~33 специальных символа', passed: /[^a-zA-Z0-9]/.test(password) },
    { label: 'Нет повторяющихся символов', description: '«aaa» снижает энтропию', passed: !/(.)\1{2,}/.test(password) },
    { label: 'Нет очевидных последовательностей', description: '«123», «abc» легко угадать', passed: !/(012|123|234|345|456|567|678|789|abc|bcd|cde|def)/i.test(password) },
  ], [password]);

  const score = useMemo(() => getStrengthScore(password), [password]);
  const crackTime = useMemo(() => calculateCrackTime(password), [password]);

  const strengthLabel = score <= 2 ? 'Очень слабый' : score <= 4 ? 'Слабый' : score <= 5 ? 'Средний' : score <= 6 ? 'Хороший' : score <= 7 ? 'Надёжный' : 'Отличный';
  const strengthColor = score <= 2 ? 'text-red-500' : score <= 4 ? 'text-orange-500' : score <= 5 ? 'text-yellow-500' : score <= 6 ? 'text-emerald-400' : score <= 7 ? 'text-emerald-500' : 'text-emerald-600';
  const strengthBg = score <= 2 ? 'bg-red-500' : score <= 4 ? 'bg-orange-500' : score <= 5 ? 'bg-yellow-500' : score <= 6 ? 'bg-emerald-400' : score <= 7 ? 'bg-emerald-500' : 'bg-emerald-600';

  const passedCount = checks.filter(c => c.passed).length;

  const handleGenerate = () => {
    const newPass = generatePassword(genLength, genOptions);
    setPassword(newPass);
    setShowPassword(true);
  };

  const handleCopy = async () => {
    if (password) {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCheckChange = (key: keyof typeof genOptions) => {
    setGenOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Lock className="text-white" size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Проверка надёжности пароля</h1>
          <p className="text-sm text-muted-foreground">Оцените стойкость пароля к взлому и узнайте рекомендации</p>
        </div>
      </div>

      {/* Password Input */}
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="space-y-4">
            <div>
              <Label htmlFor="password-input">Введите пароль для проверки</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль..."
                  className="pr-24 font-mono text-base"
                  autoComplete="off"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 rounded-md hover:bg-muted transition text-muted-foreground"
                    title={showPassword ? 'Скрыть' : 'Показать'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md hover:bg-muted transition text-muted-foreground"
                    title="Копировать"
                    disabled={!password}
                  >
                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Strength Meter */}
            {password && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Надёжность:</span>
                  <Badge className={`${strengthColor} bg-opacity-10 font-semibold`}>
                    {strengthLabel} — {passedCount}/{checks.length}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(score / checks.length) * 100}%` }}
                    className={`h-full rounded-full ${strengthBg} transition-all duration-500`}
                  />
                </div>

                {/* Crack Time */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Clock size={18} className="text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">Время взлома (10 млрд попыток/сек):</span>
                  <span className={`text-sm font-bold ${crackTime.color}`}>{crackTime.label}</span>
                </div>

                {/* Entropy */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Zap size={18} className="text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">Энтропия:</span>
                  <span className="text-sm font-bold text-foreground">
                    {Math.round(password.length * Math.log2(
                      (/[a-z]/.test(password) ? 26 : 0) +
                      (/[A-Z]/.test(password) ? 26 : 0) +
                      (/[0-9]/.test(password) ? 10 : 0) +
                      (/[^a-zA-Z0-9]/.test(password) ? 33 : 0)
                    ) || 0)} бит
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({password.length >= 60 ? '∞' : password.length >= 40 ? 'очень высокая' : password.length >= 28 ? 'высокая' : password.length >= 20 ? 'средняя' : 'низкая'})
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checks */}
      {password && (
        <Card className="border-border/50">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              Проверки
            </h3>
            <div className="grid gap-2 md:grid-cols-2">
              {checks.map((check, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition ${
                    check.passed
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    check.passed ? 'bg-emerald-500' : 'bg-muted'
                  }`}>
                    {check.passed ? <Check size={12} className="text-white" /> : <X size={12} className="text-muted-foreground" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${check.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                      {check.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{check.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password Generator */}
      <Card className="border-border/50">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <RefreshCw size={16} className="text-violet-500" />
            Генератор паролей
          </h3>

          <div className="space-y-4">
            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: 'uppercase' as const, label: 'A-Z', desc: 'Заглавные' },
                { key: 'lowercase' as const, label: 'a-z', desc: 'Строчные' },
                { key: 'numbers' as const, label: '0-9', desc: 'Цифры' },
                { key: 'symbols' as const, label: '!@#', desc: 'Символы' },
              ]).map(opt => (
                <button
                  key={opt.key}
                  onClick={() => handleCheckChange(opt.key)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                    genOptions[opt.key]
                      ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800'
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${
                    genOptions[opt.key] ? 'bg-violet-500' : 'bg-muted'
                  }`}>
                    {genOptions[opt.key] ? <Check size={12} className="text-white" /> : null}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-mono font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Length Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm">Длина пароля</Label>
                <Badge variant="secondary" className="font-mono">{genLength}</Badge>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={genLength}
                onChange={(e) => setGenLength(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>8</span>
                <span>16</span>
                <span>32</span>
                <span>48</span>
                <span>64</span>
              </div>
            </div>

            {/* Generate Button */}
            <Button onClick={handleGenerate} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
              <RefreshCw size={16} className="mr-2" />
              Сгенерировать пароль
            </Button>

            {/* Generated Password Preview */}
            {password && (
              <div className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-sm break-all relative">
                {showPassword ? password : '•'.repeat(password.length)}
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 transition"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Common Passwords Warning */}
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
            <ShieldAlert size={16} />
            Топ-10 самых популярных паролей (никогда не используйте!)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {['123456', 'password', '12345678', 'qwerty', '123456789', '111111', '1234567', 'dragon', '123123', 'baseball'].map((p, i) => (
              <div key={i} className="px-3 py-2 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-mono text-sm text-center line-through opacity-60">
                {p}
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-500 mt-3">
            Эти пароли взламываются менее чем за 0.001 секунды. По данным Have I Been Pwned, пароль «123456» встречается в 10+ миллионах утечек.
          </p>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-border/50">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield size={16} className="text-emerald-500" />
            Рекомендации по созданию паролей
          </h3>
          <div className="space-y-3">
            {[
              { title: 'Используйте passphrase', desc: 'Например: «correct-horse-battery-staple» — длинный, легко запомнить, высокая энтропия' },
              { title: 'Не используйте личные данные', desc: 'Даты рождения, имена питомцев, номера телефонов — первое, что проверяет злоумышленник' },
              { title: 'Уникальный пароль для каждого сервиса', desc: 'Используйте менеджер паролей (Bitwarden, KeePassXC, 1Password)' },
              { title: 'Включите 2FA/MFA', desc: 'Даже если пароль скомпрометирован, второй фактор защитит аккаунт' },
              { title: 'Проверяйте пароли на Have I Been Pwned', desc: 'https://haveibeenpwned.com/Passwords — проверка по базе утечек (k-Anonymity)' },
            ].map((rec, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{i + 1}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{rec.title}</p>
                  <p className="text-xs text-muted-foreground">{rec.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
