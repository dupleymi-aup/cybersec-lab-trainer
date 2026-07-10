'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
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
  key: string;
  value?: number;
  unitKey?: string;
  seconds: number;
  color: string;
}

function calculateCrackTime(password: string): CrackTime {
  if (!password) return { key: '—', seconds: 0, color: 'text-muted-foreground' };

  let charSpace = 0;
  if (/[a-z]/.test(password)) charSpace += 26;
  if (/[A-Z]/.test(password)) charSpace += 26;
  if (/[0-9]/.test(password)) charSpace += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charSpace += 33;

  if (charSpace === 0) return { key: 'crackInstant', seconds: 0, color: 'text-red-500' };

  const entropy = password.length * Math.log2(charSpace);
  const guessesPerSecond = 10_000_000_000;
  const totalGuesses = Math.pow(2, entropy);
  const seconds = totalGuesses / guessesPerSecond / 2;

  if (seconds < 1) return { key: 'crackInstant', seconds: 0, color: 'text-red-500' };
  if (seconds < 60) return { key: 'crackSeconds', seconds, color: 'text-red-500' };
  if (seconds < 3600) return { key: 'crackMinutes', value: Math.round(seconds / 60), seconds, color: 'text-orange-500' };
  if (seconds < 86400) return { key: 'crackHours', value: Math.round(seconds / 3600), seconds, color: 'text-yellow-500' };
  if (seconds < 31536000) return { key: 'crackDays', value: Math.round(seconds / 86400), seconds, color: 'text-emerald-400' };
  if (seconds < 31536000 * 1000) return { key: 'crackYears', value: Math.round(seconds / 31536000), seconds, color: 'text-emerald-500' };
  if (seconds < 31536000 * 1_000_000) return { key: 'crackThousandYears', value: Math.round(seconds / 31536000 / 1000), seconds, color: 'text-emerald-500' };
  if (seconds < 31536000 * 1_000_000_000) return { key: 'crackMillionYears', value: Math.round(seconds / 31536000 / 1_000_000), seconds, color: 'text-emerald-600' };
  return { key: 'crackInfinite', seconds, color: 'text-emerald-600' };
}

function generatePassword(
  length: number = 16,
  options: { uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean } = { uppercase: true, lowercase: true, numbers: true, symbols: true },
): string {
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
    !/(.)\1{2,}/.test(password),
    !/(012|123|234|345|456|567|678|789|abc|bcd|cde|def)/i.test(password),
  ];
  return checks.filter(Boolean).length;
}

export default function PasswordStrengthChecker() {
  const t = useTranslations('passwordChecker');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [genOptions, setGenOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [genLength, setGenLength] = useState(16);

  const checks: PasswordCheck[] = useMemo(
    () => [
      { label: t('checkMin8'), description: t('checkMin8Desc'), passed: password.length >= 8 },
      { label: t('checkMin12'), description: t('checkMin12Desc'), passed: password.length >= 12 },
      { label: t('checkMin16'), description: t('checkMin16Desc'), passed: password.length >= 16 },
      { label: t('checkLowercase'), description: t('checkLowercaseDesc'), passed: /[a-z]/.test(password) },
      { label: t('checkUppercase'), description: t('checkUppercaseDesc'), passed: /[A-Z]/.test(password) },
      { label: t('checkNumbers'), description: t('checkNumbersDesc'), passed: /[0-9]/.test(password) },
      { label: t('checkSymbols'), description: t('checkSymbolsDesc'), passed: /[^a-zA-Z0-9]/.test(password) },
      { label: t('checkNoRepeats'), description: t('checkNoRepeatsDesc'), passed: !/(.)\1{2,}/.test(password) },
      { label: t('checkNoSequences'), description: t('checkNoSequencesDesc'), passed: !/(012|123|234|345|456|567|678|789|abc|bcd|cde|def)/i.test(password) },
    ],
    [password, t],
  );

  const score = useMemo(() => getStrengthScore(password), [password]);
  const crackTime = useMemo(() => calculateCrackTime(password), [password]);

  const strengthKey =
    score <= 2 ? 'veryWeak' : score <= 4 ? 'weak' : score <= 5 ? 'medium' : score <= 6 ? 'strong' : score <= 7 ? 'secure' : 'excellent';
  const strengthLabel = t(strengthKey);

  const strengthColor =
    score <= 2 ? 'text-red-500' : score <= 4 ? 'text-orange-500' : score <= 5 ? 'text-yellow-500' : score <= 6 ? 'text-emerald-400' : score <= 7 ? 'text-emerald-500' : 'text-emerald-600';
  const strengthBg =
    score <= 2 ? 'bg-red-500' : score <= 4 ? 'bg-orange-500' : score <= 5 ? 'bg-yellow-500' : score <= 6 ? 'bg-emerald-400' : score <= 7 ? 'bg-emerald-500' : 'bg-emerald-600';

  const passedCount = checks.filter((c) => c.passed).length;

  const formatCrackTime = (ct: CrackTime): string => {
    if (ct.key === '—') return '—';
    if (ct.value !== undefined) return `${ct.value} ${t(ct.key)}`;
    return t(ct.key);
  };

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
    setGenOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const entropyValue = useMemo(() => {
    if (!password) return 0;
    return Math.round(
      password.length *
        Math.log2(
          (/[a-z]/.test(password) ? 26 : 0) +
            (/[A-Z]/.test(password) ? 26 : 0) +
            (/[0-9]/.test(password) ? 10 : 0) +
            (/[^a-zA-Z0-9]/.test(password) ? 33 : 0),
        ) || 0,
    );
  }, [password]);

  const entropyLevel = useMemo(() => {
    if (password.length >= 60) return '∞';
    if (password.length >= 40) return t('entropyVeryHigh');
    if (password.length >= 28) return t('entropyHigh');
    if (password.length >= 20) return t('entropyMedium');
    return t('entropyLow');
  }, [password.length, t]);

  const recommendations = useMemo(() => [
    { title: t('rec1Title'), desc: t('rec1Desc') },
    { title: t('rec2Title'), desc: t('rec2Desc') },
    { title: t('rec3Title'), desc: t('rec3Desc') },
    { title: t('rec4Title'), desc: t('rec4Desc') },
    { title: t('rec5Title'), desc: t('rec5Desc') },
  ], [t]);

  const generatorOptions = useMemo(() => [
    { key: 'uppercase' as const, label: 'A-Z', desc: t('uppercaseAZ') },
    { key: 'lowercase' as const, label: 'a-z', desc: t('lowercaseAZ') },
    { key: 'numbers' as const, label: '0-9', desc: t('numbersLabel') },
    { key: 'symbols' as const, label: '!@#', desc: t('symbolsLabel') },
  ], [t]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
          <Lock className="text-white" size={22} />
        </div>
        <div>
          <h1 className="text-foreground text-xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
      </div>

      {/* Password Input */}
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="space-y-4">
            <div>
              <Label htmlFor="password-input">{t('enterPassword')}</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('enterPlaceholder')}
                  className="pr-24 font-mono text-base"
                  autoComplete="off"
                />
                <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:bg-muted text-muted-foreground rounded-md p-1.5 transition"
                    title={showPassword ? t('hidePassword') : t('showPassword')}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="hover:bg-muted text-muted-foreground rounded-md p-1.5 transition"
                    title={t('copyPassword')}
                    disabled={!password}
                  >
                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Strength Meter */}
            {password && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm font-medium">{t('strength')}</span>
                  <Badge className={`${strengthColor} bg-opacity-10 font-semibold`}>
                    {strengthLabel} — {passedCount}/{checks.length}
                  </Badge>
                </div>

                <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(score / checks.length) * 100}%` }}
                    className={`h-full rounded-full ${strengthBg} transition-all duration-500`}
                  />
                </div>

                {/* Crack Time */}
                <div className="bg-muted/50 flex items-center gap-2 rounded-lg p-3">
                  <Clock size={18} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground text-sm">{t('crackTime')}</span>
                  <span className={`text-sm font-bold ${crackTime.color}`}>{formatCrackTime(crackTime)}</span>
                </div>

                {/* Entropy */}
                <div className="bg-muted/50 flex items-center gap-2 rounded-lg p-3">
                  <Zap size={18} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground text-sm">{t('entropy')}</span>
                  <span className="text-foreground text-sm font-bold">
                    {entropyValue} {t('bits')}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    ({entropyLevel})
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
            <h3 className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck size={16} className="text-emerald-500" />
              {t('checks')}
            </h3>
            <div className="grid gap-2 md:grid-cols-2">
              {checks.map((check, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition ${
                    check.passed
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${check.passed ? 'bg-emerald-500' : 'bg-muted'}`}>
                    {check.passed ? <Check size={12} className="text-white" /> : <X size={12} className="text-muted-foreground" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${check.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}>{check.label}</p>
                    <p className="text-muted-foreground text-xs">{check.description}</p>
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
          <h3 className="text-foreground mb-4 flex items-center gap-2 text-sm font-semibold">
            <RefreshCw size={16} className="text-violet-500" />
            {t('generator')}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {generatorOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleCheckChange(opt.key)}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition ${
                    genOptions[opt.key]
                      ? 'border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-900/20'
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded ${genOptions[opt.key] ? 'bg-violet-500' : 'bg-muted'}`}>
                    {genOptions[opt.key] ? <Check size={12} className="text-white" /> : null}
                  </div>
                  <div className="text-left">
                    <p className="font-mono text-sm font-medium">{opt.label}</p>
                    <p className="text-muted-foreground text-xs">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Length Slider */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-sm">{t('length')}</Label>
                <Badge variant="secondary" className="font-mono">{genLength}</Badge>
              </div>
              <input type="range" min="8" max="64" value={genLength} onChange={(e) => setGenLength(Number(e.target.value))} className="w-full accent-violet-500" />
              <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                <span>8</span><span>16</span><span>32</span><span>48</span><span>64</span>
              </div>
            </div>

            <Button onClick={handleGenerate} className="w-full bg-violet-600 text-white hover:bg-violet-700">
              <RefreshCw size={16} className="mr-2" />
              {t('generateButton')}
            </Button>

            {password && (
              <div className="relative rounded-lg bg-slate-900 p-3 font-mono text-sm break-all text-slate-100">
                {showPassword ? password : '•'.repeat(password.length)}
                <button onClick={handleCopy} className="absolute top-2 right-2 rounded bg-slate-800 p-1.5 transition hover:bg-slate-700 dark:bg-slate-700">
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Common Passwords Warning */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
        <CardContent className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-400">
            <ShieldAlert size={16} />
            {t('top10')}
          </h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {['123456', 'password', '12345678', 'qwerty', '123456789', '111111', '1234567', 'dragon', '123123', 'baseball'].map((p, i) => (
              <div key={i} className="rounded bg-red-100 px-3 py-2 text-center font-mono text-sm text-red-700 line-through opacity-60 dark:bg-red-900/30 dark:text-red-400">{p}</div>
            ))}
          </div>
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-500">{t('top10Warning')}</p>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-border/50">
        <CardContent className="p-5">
          <h3 className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
            <Shield size={16} className="text-emerald-500" />
            {t('recommendations')}
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{i + 1}</span>
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">{rec.title}</p>
                  <p className="text-muted-foreground text-xs">{rec.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
