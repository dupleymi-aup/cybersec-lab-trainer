'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/lib/store';
import CodeBlock from './CodeBlock';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Lock,
  Eye,
  EyeOff,
  Zap,
  Clock,
  ShieldCheck,
  Hash,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  X,
} from 'lucide-react';

export default function AuthSecurityLab() {
  const t = useTranslations('labs.auth');
  const tc = useTranslations('common');
  const completeModule = useAppStore((s) => s.completeModule);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const completedModules = useAppStore((s) => s.completedModules);
  const isCompleted = completedModules.includes('auth');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [crackLength, setCrackLength] = useState(8);
  const [crackComplexity, setCrackComplexity] = useState(1);
  const [hashInput, setHashInput] = useState('');

  // OTP/2FA state
  const [otpInput, setOtpInput] = useState('');
  const [otpSecret] = useState(() => {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(36).padStart(2, '0'))
      .join('')
      .substring(0, 8)
      .toUpperCase();
  });
  const [otpTimeLeft, setOtpTimeLeft] = useState(30);
  const [otpVerified, setOtpVerified] = useState<boolean | null>(null);

  // Simulated TOTP code (changes every 30 seconds)
  const generateTOTP = useCallback((secret: string, timeStep: number) => {
    let hash = 0;
    const input = secret + timeStep;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString().padStart(6, '0').substring(0, 6);
  }, []);

  const currentTOTP = generateTOTP(otpSecret, Math.floor(Date.now() / 30000));
  const currentTOTPRef = useRef(currentTOTP);
  currentTOTPRef.current = currentTOTP;

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = 30 - (Math.floor(Date.now() / 1000) % 30);
      setOtpTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const verifyOTP = () => {
    const expected = generateTOTP(otpSecret, Math.floor(Date.now() / 30000));
    if (otpInput === expected) {
      setOtpVerified(true);
    } else if (otpInput.length === 6) {
      setOtpVerified(false);
    }
  };

  // Password strength checker
  const passwordAnalysis = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '', checks: [] };

    const checks = [
      { label: t('password.minLength'), passed: password.length >= 8 },
      { label: t('password.lowercase'), passed: /[a-z]/.test(password) },
      { label: t('password.uppercase'), passed: /[A-Z]/.test(password) },
      { label: t('password.numbers'), passed: /[0-9]/.test(password) },
      { label: t('password.symbols'), passed: /[^a-zA-Z0-9]/.test(password) },
      { label: t('password.minLength12'), passed: password.length >= 12 },
      { label: t('password.noRepeats'), passed: !/(.)\1{2,}/.test(password) },
      {
        label: t('password.noSequences'),
        passed: !/(?:abc|bcd|cde|def|efg|012|123|234|345|456|567|678|789)/i.test(password),
      },
    ];

    const passedCount = checks.filter((c) => c.passed).length;
    const strengthLevels = [
      { max: 2, score: 20, labelKey: 'password.veryWeak', color: 'bg-red-500' },
      { max: 3, score: 40, labelKey: 'password.weak', color: 'bg-red-400' },
      { max: 5, score: 60, labelKey: 'password.medium', color: 'bg-yellow-500' },
      { max: 6, score: 80, labelKey: 'password.strong', color: 'bg-emerald-500' },
      { max: Infinity, score: 100, labelKey: 'password.excellent', color: 'bg-emerald-600' },
    ];
    const level = strengthLevels.find((l) => passedCount <= l.max) ?? strengthLevels[strengthLevels.length - 1];

    return { score: level.score, label: t(level.labelKey), color: level.color, checks };
  }, [password, t]);

  const formatTime = useCallback(
    (seconds: number) => {
      if (seconds < 1) return t('bruteforce.instant');
      if (seconds < 60) return `${Math.round(seconds)} ${t('bruteforce.seconds')}`;
      if (seconds < 3600) return `${Math.round(seconds / 60)} ${t('bruteforce.minutes')}`;
      if (seconds < 86400) return `${Math.round(seconds / 3600)} ${t('bruteforce.hours')}`;
      if (seconds < 31536000) return `${Math.round(seconds / 86400)} ${t('bruteforce.days')}`;
      if (seconds < 31536000 * 100) return `${Math.round(seconds / 31536000)} ${t('bruteforce.years')}`;
      if (seconds < 31536000 * 1e6) return `${Math.round(seconds / 31536000 / 1000)} ${t('bruteforce.thousandYears')}`;
      if (seconds < 31536000 * 1e9) return `${Math.round(seconds / 31536000 / 1e6)} ${t('bruteforce.millionYears')}`;
      return t('bruteforce.infinite');
    },
    [t],
  );

  const crackTimeColor = (seconds: number) => {
    if (seconds < 3600) return 'text-red-400';
    if (seconds < 31536000) return 'text-amber-400';
    return 'text-emerald-400';
  };

  // Brute force time estimation
  const crackData = useMemo(() => {
    let charsetSize = 26;
    if (crackComplexity >= 2) charsetSize += 26;
    if (crackComplexity >= 3) charsetSize += 10;
    if (crackComplexity >= 4) charsetSize += 32;
    const combinations = Math.pow(charsetSize, crackLength);
    const attemptsPerSecond = 1e10;
    const seconds = combinations / attemptsPerSecond / 2;
    return {
      text: formatTime(seconds),
      seconds,
      color: crackTimeColor(seconds),
    };
  }, [crackLength, crackComplexity, formatTime]);

  // Simulated hash
  const simulatedHash = useMemo(() => {
    if (!hashInput) return '';
    let hash = 0;
    const salt = 'a1b2c3d4e5f6';
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash + char + salt.charCodeAt(i % salt.length)) | 0;
    }
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    return `$2b$12$${salt}$${hexHash.repeat(8)}`;
  }, [hashInput]);

  const handleComplete = () => {
    if (!isCompleted) completeModule('auth');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')} aria-label={tc('back')}>
          <ChevronLeft size={20} />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <Lock size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="password" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="password" className="text-xs">
            <KeyRound size={14} className="mr-1" /> {t('tabs.password')}
          </TabsTrigger>
          <TabsTrigger value="bruteforce" className="text-xs">
            <Zap size={14} className="mr-1" /> {t('tabs.bruteforce')}
          </TabsTrigger>
          <TabsTrigger value="hashing" className="text-xs">
            <Hash size={14} className="mr-1" /> {t('tabs.hashing')}
          </TabsTrigger>
          <TabsTrigger value="otp" className="text-xs">
            <ShieldCheck size={14} className="mr-1" /> {t('tabs.otp')}
          </TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs">
            <Clock size={14} className="mr-1" /> {t('tabs.sessions')}
          </TabsTrigger>
        </TabsList>

        {/* Password Strength Checker */}
        <TabsContent value="password" className="space-y-4">
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <KeyRound size={16} className="text-emerald-600" />
                {t('password.checkerTitle')}
              </h3>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('password.placeholder')}
                  className="pr-10 font-mono"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {password && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{passwordAnalysis.label}</span>
                    <Badge variant={passwordAnalysis.score >= 80 ? 'default' : 'destructive'}>
                      {passwordAnalysis.score}/100
                    </Badge>
                  </div>
                  <Progress value={passwordAnalysis.score} className="h-2" />
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className={`h-full ${passwordAnalysis.color} rounded-full transition-all duration-500`}
                      style={{ width: `${passwordAnalysis.score}%` }}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-muted-foreground text-xs font-semibold">{t('password.criteriaTitle')}</h4>
                    {passwordAnalysis.checks.map((check, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {check.passed ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                          <AlertTriangle size={14} className="text-slate-300" />
                        )}
                        <span className={check.passed ? 'text-foreground/70' : 'text-slate-400'}>{check.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brute Force Visualizer */}
        <TabsContent value="bruteforce" className="space-y-4">
          <Card className="border-border">
            <CardContent className="space-y-4 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Zap size={16} className="text-red-500" />
                {t('bruteforce.title')}
              </h3>
              <p className="text-muted-foreground text-xs">{t('bruteforce.description')}</p>

              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-xs">
                    <span>{t('bruteforce.passwordLength')}</span>
                    <span className="font-mono font-bold">
                      {crackLength} {t('bruteforce.characters')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={20}
                    value={crackLength}
                    onChange={(e) => setCrackLength(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>4</span>
                    <span>20</span>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-xs">
                    <span>{t('bruteforce.complexity')}</span>
                    <span className="font-mono font-bold">
                      {crackComplexity === 1
                        ? '26 (a-z)'
                        : crackComplexity === 2
                          ? '52 (a-z, A-Z)'
                          : crackComplexity === 3
                            ? '62 (+0-9)'
                            : '94 (+!@#$...)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={4}
                    step={1}
                    value={crackComplexity}
                    onChange={(e) => setCrackComplexity(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{t('bruteforce.lowercaseOnly')}</span>
                    <span>{t('bruteforce.fullComplexity')}</span>
                  </div>
                </div>

                <Separator />

                <div className="rounded-xl bg-slate-900 p-5 text-center">
                  <p className="mb-2 text-xs text-slate-400">{t('bruteforce.bruteForceTime')}</p>
                  <p className={`font-mono text-3xl font-bold ${crackData.color}`}>{crackData.text}</p>
                  <p className="text-muted-foreground mt-2 text-[11px]">
                    {t('bruteforce.combinations')}{' '}
                    {Math.pow(
                      crackComplexity === 1 ? 26 : crackComplexity === 2 ? 52 : crackComplexity === 3 ? 62 : 94,
                      crackLength,
                    ).toExponential(2)}
                  </p>
                </div>

                <div className="rounded-lg bg-emerald-50 p-3">
                  <p className="flex items-start gap-2 text-xs text-emerald-700">
                    <Lightbulb size={14} className="mt-0.5 shrink-0" />
                    <span>{t('bruteforce.recommendation')}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hashing Demo */}
        <TabsContent value="hashing" className="space-y-4">
          <Card className="border-border">
            <CardContent className="space-y-4 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Hash size={16} className="text-violet-600" />
                {t('hashing.demoTitle')}
              </h3>
              <p className="text-muted-foreground text-xs">{t('hashing.demoDescription')}</p>

              <Input
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder={t('hashing.placeholder')}
                type="text"
                className="font-mono"
              />

              {hashInput && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-muted-foreground mb-1 text-[10px]">{t('hashing.originalPassword')}</p>
                    <code className="font-mono text-xs">{hashInput}</code>
                  </div>

                  <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                    <p className="mb-1 text-[10px] text-violet-500">{t('hashing.generatedHash')}</p>
                    <code className="font-mono text-xs break-all text-violet-700">{simulatedHash}</code>
                  </div>

                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-muted-foreground mb-1 text-[10px]">{t('hashing.hashStructure')}</p>
                    <div className="space-y-1">
                      <p className="text-[11px]">
                        <code className="rounded bg-red-100 px-1 text-red-700">$2b$12$</code>
                        <span className="text-muted-foreground ml-1">{t('hashing.algorithmLabel')}</span>
                      </p>
                      <p className="text-[11px]">
                        <code className="rounded bg-amber-100 px-1 text-amber-700">a1b2c3d4e5f6</code>
                        <span className="text-muted-foreground ml-1">{t('hashing.saltLabel')}</span>
                      </p>
                      <p className="text-[11px]">
                        <code className="rounded bg-emerald-100 px-1 text-emerald-700">7f3a...</code>
                        <span className="text-muted-foreground ml-1">{t('hashing.hashLabel')}</span>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <ShieldCheck size={14} /> {t('hashing.whyBcrypt')}
                    </h4>
                    <ul className="space-y-1 text-[11px] text-emerald-600">
                      <li>• {t('hashing.autoSalt')}</li>
                      <li>• {t('hashing.adjustableCost')}</li>
                      <li>• {t('hashing.gpuResistant')}</li>
                      <li>• {t('hashing.oneWay')}</li>
                    </ul>
                  </div>
                </motion.div>
              )}

              <CodeBlock
                code={`// bcrypt usage example in Node.js
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// Hash a password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);
  return hash;
  // Result: $2b$12$N9qo8uLOickgx2ZMRZoMy...
}

// Verify a password
async function verify(password, hash) {
  const isMatch = await bcrypt.compare(password, hash);
  return isMatch; // true or false
}`}
                language="javascript"
                title="bcrypt-usage.js"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* OTP/2FA */}
        <TabsContent value="otp" className="space-y-4">
          <Card className="border-border">
            <CardContent className="space-y-4 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck size={16} className="text-emerald-600" />
                {t('otp.title')}
              </h3>
              <p className="text-muted-foreground text-xs">{t('otp.description')}</p>

              {/* Simulated TOTP display */}
              <div className="space-y-3 rounded-xl bg-slate-900 p-6 text-center">
                <p className="text-xs text-slate-400">{t('otp.secretKey')}</p>
                <code className="rounded bg-amber-400/10 px-3 py-1 font-mono text-sm text-amber-400">{otpSecret}</code>
                <Separator />
                <p className="text-xs text-slate-400">{t('otp.currentCode')}</p>
                <p className="font-mono text-4xl font-bold tracking-wider text-emerald-400">{currentTOTP}</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        otpTimeLeft <= 5 ? 'bg-red-500' : otpTimeLeft <= 15 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(otpTimeLeft / 30) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-slate-400">{otpTimeLeft}s</span>
                </div>
              </div>

              {/* Verification simulation */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold">{t('otp.verifyTitle')}</h4>
                <div className="flex gap-2">
                  <Input
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value.replace(/\D/g, '').substring(0, 6));
                      setOtpVerified(null);
                    }}
                    placeholder={t('otp.verifyPlaceholder')}
                    className="text-center font-mono text-lg tracking-widest"
                    maxLength={6}
                    onKeyDown={(e) => e.key === 'Enter' && verifyOTP()}
                  />
                  <Button onClick={verifyOTP} className="shrink-0 bg-emerald-600 hover:bg-emerald-700">
                    {t('otp.verifyButton')}
                  </Button>
                </div>
                {otpVerified === true && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-sm font-medium text-emerald-600"
                  >
                    <CheckCircle2 size={16} /> {t('otp.codeCorrect')}
                  </motion.div>
                )}
                {otpVerified === false && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-sm font-medium text-red-600"
                  >
                    <AlertTriangle size={16} /> {t('otp.codeWrong')}
                  </motion.div>
                )}
                <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Lightbulb size={12} /> {t('otp.hint')} ({currentTOTP})
                </p>
              </div>

              <Separator />

              {/* How 2FA works */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold">{t('otp.howItWorks')}</h4>
                <div className="space-y-2">
                  {[
                    {
                      step: '1',
                      title: t('otp.step1Title'),
                      desc: t('otp.step1Desc'),
                    },
                    {
                      step: '2',
                      title: t('otp.step2Title'),
                      desc: t('otp.step2Desc'),
                    },
                    {
                      step: '3',
                      title: t('otp.step3Title'),
                      desc: t('otp.step3Desc'),
                    },
                    {
                      step: '4',
                      title: t('otp.step4Title'),
                      desc: t('otp.step4Desc'),
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                        {item.step}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{item.title}</p>
                        <p className="text-muted-foreground text-[11px]">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <CodeBlock
                code={`// TOTP on server (Node.js)
import { authenticator } from 'otplib';

// 1. Generate secret when 2FA is enabled
const secret = authenticator.generateSecret();
// Store secret in user's DB

// 2. Generate QR code for Google Authenticator
const otpauth = authenticator.keyuri(user.email, 'MyApp', secret);
// otpauth://totp/MyApp:user@email?secret=ABCD...

// 3. Verify code on login
const isValid = authenticator.check(token, user.secret);
// Returns true if code matches (±1 step)

// Without 2FA: password only
// With 2FA: password + TOTP code from phone
// Even if password leaks, account stays protected`}
                language="javascript"
                title="totp-auth.js"
              />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-red-700">
                    <X size={14} /> {t('otp.without2fa')}
                  </h4>
                  <ul className="space-y-1 text-[11px] text-red-600">
                    {t.raw('otp.without2faItems').map((item: string, i: number) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 size={14} /> {t('otp.with2fa')}
                  </h4>
                  <ul className="space-y-1 text-[11px] text-emerald-600">
                    {t.raw('otp.with2faItems').map((item: string, i: number) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session Security */}
        <TabsContent value="sessions" className="space-y-4">
          <Card className="border-border">
            <CardContent className="space-y-4 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Clock size={16} className="text-sky-600" />
                {t('sessions.title')}
              </h3>

              <div className="space-y-4">
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                  <h4 className="mb-2 text-xs font-semibold text-sky-800">{t('sessions.jwtTitle')}</h4>
                  <p className="text-xs leading-relaxed text-sky-700">{t('sessions.jwtDescription')}</p>
                </div>

              <CodeBlock
                code={`// JWT generation
const jwt = require('jsonwebtoken');

function login(user) {
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }  // Token expires in 1 hour
  );
  return token;
}

// JWT verification (middleware)
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}`}
                  language="javascript"
                  title="jwt-auth.js"
                />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-red-700">
                      <X size={14} /> {t('sessions.unsafe')}
                    </h4>
                    <ul className="space-y-1 text-[11px] text-red-600">
                      {t.raw('sessions.unsafeItems').map((item: string, i: number) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={14} /> {t('sessions.safe')}
                    </h4>
                    <ul className="space-y-1 text-[11px] text-emerald-600">
                      {t.raw('sessions.safeItems').map((item: string, i: number) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Complete module */}
      {!isCompleted ? (
        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleComplete}>
          {t('completeModule')}
        </Button>
      ) : (
        <div className="flex items-center justify-center gap-2 text-center text-sm font-medium text-emerald-600">
          <CheckCircle2 size={16} /> {t('moduleCompleted')}
        </div>
      )}
    </div>
  );
}
