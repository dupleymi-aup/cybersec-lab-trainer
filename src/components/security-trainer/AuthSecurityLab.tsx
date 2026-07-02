"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store";
import CodeBlock from "./CodeBlock";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
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
} from "lucide-react";

export default function AuthSecurityLab() {
  const t = useTranslations("labs.auth");
  const completeModule = useAppStore((s) => s.completeModule);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const completedModules = useAppStore((s) => s.completedModules);
  const isCompleted = completedModules.includes("auth");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [crackLength, setCrackLength] = useState(8);
  const [crackComplexity, setCrackComplexity] = useState(1);
  const [hashInput, setHashInput] = useState("");

  // OTP/2FA state
  const [otpInput, setOtpInput] = useState("");
  const [otpSecret] = useState(() => {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(36).padStart(2, "0"))
      .join("")
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
    return Math.abs(hash).toString().padStart(6, "0").substring(0, 6);
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
    if (!password) return { score: 0, label: "", color: "", checks: [] };

    const checks = [
      { label: t("password.minLength"), passed: password.length >= 8 },
      { label: t("password.lowercase"), passed: /[a-z]/.test(password) },
      { label: t("password.uppercase"), passed: /[A-Z]/.test(password) },
      { label: t("password.numbers"), passed: /[0-9]/.test(password) },
      { label: t("password.symbols"), passed: /[^a-zA-Z0-9]/.test(password) },
      { label: t("password.minLength12"), passed: password.length >= 12 },
      { label: t("password.noRepeats"), passed: !/(.)\1{2,}/.test(password) },
      {
        label: t("password.noSequences"),
        passed:
          !/(?:abc|bcd|cde|def|efg|012|123|234|345|456|567|678|789)/i.test(
            password,
          ),
      },
    ];

    const passedCount = checks.filter((c) => c.passed).length;
    const score =
      passedCount <= 2
        ? 20
        : passedCount <= 3
          ? 40
          : passedCount <= 5
            ? 60
            : passedCount <= 6
              ? 80
              : 100;
    const label =
      passedCount <= 2
        ? t("password.veryWeak")
        : passedCount <= 3
          ? t("password.weak")
          : passedCount <= 5
            ? t("password.medium")
            : passedCount <= 6
              ? t("password.strong")
              : t("password.excellent");
    const color =
      passedCount <= 2
        ? "bg-red-500"
        : passedCount <= 3
          ? "bg-red-400"
          : passedCount <= 5
            ? "bg-yellow-500"
            : passedCount <= 6
              ? "bg-emerald-500"
              : "bg-emerald-600";

    return { score, label, color, checks };
  }, [password, t]);

  const formatTime = useCallback(
    (seconds: number) => {
      if (seconds < 1) return t("bruteforce.instant");
      if (seconds < 60)
        return `${Math.round(seconds)} ${t("bruteforce.seconds")}`;
      if (seconds < 3600)
        return `${Math.round(seconds / 60)} ${t("bruteforce.minutes")}`;
      if (seconds < 86400)
        return `${Math.round(seconds / 3600)} ${t("bruteforce.hours")}`;
      if (seconds < 31536000)
        return `${Math.round(seconds / 86400)} ${t("bruteforce.days")}`;
      if (seconds < 31536000 * 100)
        return `${Math.round(seconds / 31536000)} ${t("bruteforce.years")}`;
      if (seconds < 31536000 * 1e6)
        return `${Math.round(seconds / 31536000 / 1000)} ${t("bruteforce.thousandYears")}`;
      if (seconds < 31536000 * 1e9)
        return `${Math.round(seconds / 31536000 / 1e6)} ${t("bruteforce.millionYears")}`;
      return t("bruteforce.infinite");
    },
    [t],
  );

  const crackTimeColor = (seconds: number) => {
    if (seconds < 3600) return "text-red-400";
    if (seconds < 31536000) return "text-amber-400";
    return "text-emerald-400";
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
    if (!hashInput) return "";
    let hash = 0;
    const salt = "a1b2c3d4e5f6";
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash + char + salt.charCodeAt(i % salt.length)) | 0;
    }
    const hexHash = Math.abs(hash).toString(16).padStart(8, "0");
    return `$2b$12$${salt}$${hexHash.repeat(8)}`;
  }, [hashInput]);

  const handleComplete = () => {
    if (!isCompleted) completeModule("auth");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentPage("dashboard")}
        >
          <ChevronLeft size={20} />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Lock size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t("title")}</h1>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <Tabs defaultValue="password" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="password" className="text-xs">
            <KeyRound size={14} className="mr-1" /> {t("tabs.password")}
          </TabsTrigger>
          <TabsTrigger value="bruteforce" className="text-xs">
            <Zap size={14} className="mr-1" /> {t("tabs.bruteforce")}
          </TabsTrigger>
          <TabsTrigger value="hashing" className="text-xs">
            <Hash size={14} className="mr-1" /> {t("tabs.hashing")}
          </TabsTrigger>
          <TabsTrigger value="otp" className="text-xs">
            <ShieldCheck size={14} className="mr-1" /> {t("tabs.otp")}
          </TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs">
            <Clock size={14} className="mr-1" /> {t("tabs.sessions")}
          </TabsTrigger>
        </TabsList>

        {/* Password Strength Checker */}
        <TabsContent value="password" className="space-y-4">
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <KeyRound size={16} className="text-emerald-600" />
                {t("password.checkerTitle")}
              </h3>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("password.placeholder")}
                  className="pr-10 font-mono"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {password && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {passwordAnalysis.label}
                    </span>
                    <Badge
                      variant={
                        passwordAnalysis.score >= 80 ? "default" : "destructive"
                      }
                    >
                      {passwordAnalysis.score}/100
                    </Badge>
                  </div>
                  <Progress value={passwordAnalysis.score} className="h-2" />
                  <div className="h-2 rounded-full overflow-hidden bg-muted">
                    <div
                      className={`h-full ${passwordAnalysis.color} rounded-full transition-all duration-500`}
                      style={{ width: `${passwordAnalysis.score}%` }}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground">
                      {t("password.criteriaTitle")}
                    </h4>
                    {passwordAnalysis.checks.map((check, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {check.passed ? (
                          <CheckCircle2
                            size={14}
                            className="text-emerald-500"
                          />
                        ) : (
                          <AlertTriangle size={14} className="text-slate-300" />
                        )}
                        <span
                          className={
                            check.passed
                              ? "text-foreground/70"
                              : "text-slate-400"
                          }
                        >
                          {check.label}
                        </span>
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
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Zap size={16} className="text-red-500" />
                {t("bruteforce.title")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("bruteforce.description")}
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span>{t("bruteforce.passwordLength")}</span>
                    <span className="font-mono font-bold">
                      {crackLength} {t("bruteforce.characters")}
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
                  <div className="flex justify-between text-xs mb-2">
                    <span>{t("bruteforce.complexity")}</span>
                    <span className="font-mono font-bold">
                      {crackComplexity === 1
                        ? "26 (a-z)"
                        : crackComplexity === 2
                          ? "52 (a-z, A-Z)"
                          : crackComplexity === 3
                            ? "62 (+0-9)"
                            : "94 (+!@#$...)"}
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
                    <span>{t("bruteforce.lowercaseOnly")}</span>
                    <span>{t("bruteforce.fullComplexity")}</span>
                  </div>
                </div>

                <Separator />

                <div className="bg-slate-900 rounded-xl p-5 text-center">
                  <p className="text-xs text-slate-400 mb-2">
                    {t("bruteforce.bruteForceTime")}
                  </p>
                  <p
                    className={`text-3xl font-bold font-mono ${crackData.color}`}
                  >
                    {crackData.text}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {t("bruteforce.combinations")}{" "}
                    {Math.pow(
                      crackComplexity === 1
                        ? 26
                        : crackComplexity === 2
                          ? 52
                          : crackComplexity === 3
                            ? 62
                            : 94,
                      crackLength,
                    ).toExponential(2)}
                  </p>
                </div>

                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs text-emerald-700 flex items-start gap-2">
                    <Lightbulb size={14} className="mt-0.5 shrink-0" />
                    <span>{t("bruteforce.recommendation")}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hashing Demo */}
        <TabsContent value="hashing" className="space-y-4">
          <Card className="border-border">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Hash size={16} className="text-violet-600" />
                {t("hashing.demoTitle")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("hashing.demoDescription")}
              </p>

              <Input
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder={t("hashing.placeholder")}
                type="text"
                className="font-mono"
              />

              {hashInput && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">
                      {t("hashing.originalPassword")}
                    </p>
                    <code className="text-xs font-mono">{hashInput}</code>
                  </div>

                  <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
                    <p className="text-[10px] text-violet-500 mb-1">
                      {t("hashing.generatedHash")}
                    </p>
                    <code className="text-xs font-mono text-violet-700 break-all">
                      {simulatedHash}
                    </code>
                  </div>

                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">
                      {t("hashing.hashStructure")}
                    </p>
                    <div className="space-y-1">
                      <p className="text-[11px]">
                        <code className="bg-red-100 text-red-700 px-1 rounded">
                          $2b$12$
                        </code>
                        <span className="text-muted-foreground ml-1">
                          {t("hashing.algorithmLabel")}
                        </span>
                      </p>
                      <p className="text-[11px]">
                        <code className="bg-amber-100 text-amber-700 px-1 rounded">
                          a1b2c3d4e5f6
                        </code>
                        <span className="text-muted-foreground ml-1">
                          {t("hashing.saltLabel")}
                        </span>
                      </p>
                      <p className="text-[11px]">
                        <code className="bg-emerald-100 text-emerald-700 px-1 rounded">
                          7f3a...
                        </code>
                        <span className="text-muted-foreground ml-1">
                          {t("hashing.hashLabel")}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                    <h4 className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1.5">
                      <ShieldCheck size={14} /> {t("hashing.whyBcrypt")}
                    </h4>
                    <ul className="text-[11px] text-emerald-600 space-y-1">
                      <li>• {t("hashing.autoSalt")}</li>
                      <li>• {t("hashing.adjustableCost")}</li>
                      <li>• {t("hashing.gpuResistant")}</li>
                      <li>• {t("hashing.oneWay")}</li>
                    </ul>
                  </div>
                </motion.div>
              )}

              <CodeBlock
                code={`// Пример использования bcrypt в Node.js
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// Хеширование пароля
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);
  return hash;
  // Результат: $2b$12$N9qo8uLOickgx2ZMRZoMy...
}

// Проверка пароля
async function verify(password, hash) {
  const isMatch = await bcrypt.compare(password, hash);
  return isMatch; // true или false
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
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                {t("otp.title")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("otp.description")}
              </p>

              {/* Simulated TOTP display */}
              <div className="bg-slate-900 rounded-xl p-6 text-center space-y-3">
                <p className="text-xs text-slate-400">{t("otp.secretKey")}</p>
                <code className="text-sm font-mono text-amber-400 bg-amber-400/10 px-3 py-1 rounded">
                  {otpSecret}
                </code>
                <Separator />
                <p className="text-xs text-slate-400">{t("otp.currentCode")}</p>
                <p className="text-4xl font-bold font-mono text-emerald-400 tracking-wider">
                  {currentTOTP}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        otpTimeLeft <= 5
                          ? "bg-red-500"
                          : otpTimeLeft <= 15
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${(otpTimeLeft / 30) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {otpTimeLeft}s
                  </span>
                </div>
              </div>

              {/* Verification simulation */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold">
                  {t("otp.verifyTitle")}
                </h4>
                <div className="flex gap-2">
                  <Input
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(
                        e.target.value.replace(/\D/g, "").substring(0, 6),
                      );
                      setOtpVerified(null);
                    }}
                    placeholder={t("otp.verifyPlaceholder")}
                    className="font-mono text-center text-lg tracking-widest"
                    maxLength={6}
                    onKeyDown={(e) => e.key === "Enter" && verifyOTP()}
                  />
                  <Button
                    onClick={verifyOTP}
                    className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                  >
                    {t("otp.verifyButton")}
                  </Button>
                </div>
                {otpVerified === true && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-emerald-600 font-medium flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> {t("otp.codeCorrect")}
                  </motion.div>
                )}
                {otpVerified === false && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-red-600 font-medium flex items-center gap-2"
                  >
                    <AlertTriangle size={16} /> {t("otp.codeWrong")}
                  </motion.div>
                )}
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Lightbulb size={12} /> {t("otp.hint")} ({currentTOTP})
                </p>
              </div>

              <Separator />

              {/* How 2FA works */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold">{t("otp.howItWorks")}</h4>
                <div className="space-y-2">
                  {[
                    {
                      step: "1",
                      title: t("otp.step1Title"),
                      desc: t("otp.step1Desc"),
                    },
                    {
                      step: "2",
                      title: t("otp.step2Title"),
                      desc: t("otp.step2Desc"),
                    },
                    {
                      step: "3",
                      title: t("otp.step3Title"),
                      desc: t("otp.step3Desc"),
                    },
                    {
                      step: "4",
                      title: t("otp.step4Title"),
                      desc: t("otp.step4Desc"),
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <CodeBlock
                code={`// TOTP на сервере (Node.js)
import { authenticator } from 'otplib';

// 1. Генерация секрета при включении 2FA
const secret = authenticator.generateSecret();
// Сохранить secret в БД пользователя

// 2. Генерация QR-кода для Google Authenticator
const otpauth = authenticator.keyuri(user.email, 'MyApp', secret);
// otpauth://totp/MyApp:user@email?secret=ABCD...

// 3. Проверка кода при входе
const isValid = authenticator.check(token, user.secret);
// Возвращает true, если код совпадает (±1 шаг)

// Без 2FA — только пароль
// С 2FA — пароль + TOTP-код из телефона
// Даже при утечке пароля — аккаунт защищён`}
                language="javascript"
                title="totp-auth.js"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <h4 className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                    <X size={14} /> {t("otp.without2fa")}
                  </h4>
                  <ul className="text-[11px] text-red-600 space-y-1">
                    {t
                      .raw("otp.without2faItems")
                      .map((item: string, i: number) => (
                        <li key={i}>• {item}</li>
                      ))}
                  </ul>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <h4 className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> {t("otp.with2fa")}
                  </h4>
                  <ul className="text-[11px] text-emerald-600 space-y-1">
                    {t
                      .raw("otp.with2faItems")
                      .map((item: string, i: number) => (
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
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock size={16} className="text-sky-600" />
                {t("sessions.title")}
              </h3>

              <div className="space-y-4">
                <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
                  <h4 className="text-xs font-semibold text-sky-800 mb-2">
                    {t("sessions.jwtTitle")}
                  </h4>
                  <p className="text-xs text-sky-700 leading-relaxed">
                    {t("sessions.jwtDescription")}
                  </p>
                </div>

                <CodeBlock
                  code={`// Генерация JWT
const jwt = require('jsonwebtoken');

function login(user) {
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }  // Токен истекает через час
  );
  return token;
}

// Проверка JWT (middleware)
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Нет токена' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[AuthSecurityLab.tsx] authenticate failed:", e);
    return res.status(401).json({ error: 'Невалидный токен' });
  }
}`}
                  language="javascript"
                  title="jwt-auth.js"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <h4 className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                      <X size={14} /> {t("sessions.unsafe")}
                    </h4>
                    <ul className="text-[11px] text-red-600 space-y-1">
                      {t
                        .raw("sessions.unsafeItems")
                        .map((item: string, i: number) => (
                          <li key={i}>• {item}</li>
                        ))}
                    </ul>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                    <h4 className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> {t("sessions.safe")}
                    </h4>
                    <ul className="text-[11px] text-emerald-600 space-y-1">
                      {t
                        .raw("sessions.safeItems")
                        .map((item: string, i: number) => (
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
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          onClick={handleComplete}
        >
          {t("completeModule")}
        </Button>
      ) : (
        <div className="text-center text-sm text-emerald-600 font-medium flex items-center justify-center gap-2">
          <CheckCircle2 size={16} /> {t("moduleCompleted")}
        </div>
      )}
    </div>
  );
}
