'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/lib/store';
import CodeBlock from './CodeBlock';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { useDateTimeFormatter } from '@/lib/format';
import { logger } from '@/lib/logger';
import { ChevronLeft, KeyRound, Lock, Unlock, Copy, CheckCircle2, RefreshCw, Eye, EyeOff, Shuffle } from 'lucide-react';

// ============================================================
// Caesar Cipher
// ============================================================
function caesarEncrypt(text: string, shift: number): string {
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      return char;
    })
    .join('');
}

function caesarDecrypt(text: string, shift: number): string {
  return caesarEncrypt(text, 26 - shift);
}

// ============================================================
// Vigenere Cipher
// ============================================================
function vigenereEncrypt(text: string, key: string): string {
  const k = key.toLowerCase().replace(/[^a-z]/g, '');
  if (!k) return text;
  let ki = 0;
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        const shift = k.charCodeAt(ki % k.length) - 97;
        ki++;
        return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      }
      if (code >= 97 && code <= 122) {
        const shift = k.charCodeAt(ki % k.length) - 97;
        ki++;
        return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      }
      return char;
    })
    .join('');
}

function vigenereDecrypt(text: string, key: string): string {
  const k = key.toLowerCase().replace(/[^a-z]/g, '');
  if (!k) return text;
  let ki = 0;
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        const shift = k.charCodeAt(ki % k.length) - 97;
        ki++;
        return String.fromCharCode(((code - 65 - shift + 26) % 26) + 65);
      }
      if (code >= 97 && code <= 122) {
        const shift = k.charCodeAt(ki % k.length) - 97;
        ki++;
        return String.fromCharCode(((code - 97 - shift + 26) % 26) + 97);
      }
      return char;
    })
    .join('');
}

// ============================================================
// XOR Cipher
// ============================================================
function xorEncrypt(text: string, key: string): string {
  if (!key) return text;
  return text
    .split('')
    .map((char, i) => {
      const xored = char.charCodeAt(0) ^ key.charCodeAt(i % key.length);
      return xored.toString(16).padStart(2, '0');
    })
    .join(' ');
}

function xorDecrypt(hex: string, key: string): string {
  if (!key) return hex;
  try {
    return hex
      .split(' ')
      .filter((h) => h.length > 0)
      .map((h, i) => String.fromCharCode(parseInt(h, 16) ^ key.charCodeAt(i % key.length)))
      .join('');
  } catch (e) {
    if (process.env.NODE_ENV === 'development') logger.warn('ToolsLab xorDecrypt failed', { error: e });
    return 'Ошибка декодирования';
  }
}

// ============================================================
// Base64
// ============================================================
function base64Encode(text: string): string {
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch (e) {
    if (process.env.NODE_ENV === 'development') logger.warn('ToolsLab base64Encode failed', { error: e });
    return 'Ошибка кодирования';
  }
}
function base64Decode(text: string): string {
  try {
    return decodeURIComponent(escape(atob(text)));
  } catch (e) {
    if (process.env.NODE_ENV === 'development') logger.warn('ToolsLab base64Decode failed', { error: e });
    return 'Ошибка декодирования';
  }
}

// ============================================================
// URL Encoding
// ============================================================
function urlEncode(text: string): string {
  return encodeURIComponent(text);
}
function urlDecode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch (e) {
    if (process.env.NODE_ENV === 'development') logger.warn('ToolsLab urlDecode failed', { error: e });
    return 'Ошибка декодирования';
  }
}

// ============================================================
// Hash visualization (simple djb2)
// ============================================================
function simpleHash(text: string): {
  md5Like: string;
  shaLike: string;
  djb2: string;
} {
  let h1 = 5381;
  let h2 = 0x6a09e667;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = ((h1 << 5) + h1 + c) & 0xffffffff;
    h2 = ((h2 ^ (c << 13)) + (c << 7) + (c >> 2)) & 0xffffffff;
  }
  return {
    md5Like: Math.abs(h1).toString(16).padStart(8, '0').repeat(4),
    shaLike: Math.abs(h2).toString(16).padStart(8, '0').repeat(8),
    djb2: Math.abs(h1).toString(16).padStart(8, '0'),
  };
}

// ============================================================
// Copy helper
// ============================================================
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for non-HTTPS contexts or older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // Silently fail
      }
      document.body.removeChild(ta);
    }
  };
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
      {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </Button>
  );
}

export default function ToolsLab() {
  const t = useTranslations('labs.tools');
  const formatDateTime = useDateTimeFormatter();
  const completeModule = useAppStore((s) => s.completeModule);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const completedModules = useAppStore((s) => s.completedModules);
  const isCompleted = completedModules.includes('tools');

  // Caesar state
  const [caesarText, setCaesarText] = useState('');
  const [caesarShift, setCaesarShift] = useState(3);
  const [caesarMode, setCaesarMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  // Vigenere state
  const [vigenereText, setVigenereText] = useState('');
  const [vigenereKey, setVigenereKey] = useState('secret');
  const [vigenereMode, setVigenereMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  // XOR state
  const [xorText, setXorText] = useState('');
  const [xorKey, setXorKey] = useState('key');
  const [xorMode, setXorMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  // Base64 state
  const [b64Text, setB64Text] = useState('');
  const [b64Mode, setB64Mode] = useState<'encode' | 'decode'>('encode');

  // URL state
  const [urlText, setUrlText] = useState('');
  const [urlMode, setUrlMode] = useState<'encode' | 'decode'>('encode');

  // Hash state
  const [hashText, setHashText] = useState('');

  // Password generator state
  const [pwLength, setPwLength] = useState(16);
  const [pwUppercase, setPwUppercase] = useState(true);
  const [pwLowercase, setPwLowercase] = useState(true);
  const [pwNumbers, setPwNumbers] = useState(true);
  const [pwSymbols, setPwSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Advanced tools state
  const [aesText, setAesText] = useState('');
  const [aesKey, setAesKey] = useState('');
  const [aesResult, setAesResult] = useState('');
  const [aesMode, setAesMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [jwtToken, setJwtToken] = useState('');
  const [jwtDecoded, setJwtDecoded] = useState<{
    header?: object;
    payload?: object;
    valid: boolean;
    error?: string;
  }>({ valid: false });
  const [rot13Text, setRot13Text] = useState('');

  // ROT13 cipher
  const rot13 = (text: string): string =>
    text.replace(/[a-zA-Z]/g, (char) => {
      const base = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
    });

  // Simple AES-GCM simulation (demo only — real AES in browser needs Web Crypto API)
  const aesEncryptDemo = (text: string, key: string): string => {
    if (!text || !key) return '';
    // Derive a simple key hash
    let keyHash = 0;
    for (let i = 0; i < key.length; i++) keyHash = ((keyHash << 5) - keyHash + key.charCodeAt(i)) | 0;
    // XOR-based simulation (educational — not real AES)
    const bytes = new TextEncoder().encode(text);
    const result = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      result[i] = bytes[i] ^ (keyHash & 0xff);
      keyHash = ((keyHash << 7) - keyHash + i) | 0;
    }
    return btoa(String.fromCharCode(...result));
  };

  const aesDecryptDemo = (text: string, key: string): string => {
    if (!text || !key) return '';
    try {
      let keyHash = 0;
      for (let i = 0; i < key.length; i++) keyHash = ((keyHash << 5) - keyHash + key.charCodeAt(i)) | 0;
      const bytes = Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
      const result = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        result[i] = bytes[i] ^ (keyHash & 0xff);
        keyHash = ((keyHash << 7) - keyHash + i) | 0;
      }
      return new TextDecoder().decode(result);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') logger.warn('ToolsLab aesDecrypt failed', { error: e });
      return '❌ Ошибка: неверный ключ или повреждённые данные';
    }
  };

  // JWT decoder
  const decodeJWT = (token: string) => {
    if (!token) {
      setJwtDecoded({ valid: false });
      return;
    }
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        setJwtDecoded({
          valid: false,
          error: 'JWT должен содержать 3 части, разделённые точкой',
        });
        return;
      }
      const decodePart = (part: string) => JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
      const header = decodePart(parts[0]);
      const payload = decodePart(parts[1]);
      const isExpired = payload.exp ? Date.now() >= payload.exp * 1000 : false;
      setJwtDecoded({
        header,
        payload,
        valid: true,
        error: isExpired ? '⚠️ Токен истёк' : undefined,
      });
    } catch (e: unknown) {
      setJwtDecoded({
        valid: false,
        error: `Неверный JWT: ${e instanceof Error ? e.message : 'ошибка парсинга'}`,
      });
    }
  };

  const generatePassword = () => {
    let chars = '';
    if (pwUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (pwLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (pwNumbers) chars += '0123456789';
    if (pwSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';
    const arr = new Uint32Array(pwLength);
    crypto.getRandomValues(arr);
    const pw = Array.from(arr, (v) => chars[v % chars.length]).join('');
    setGeneratedPassword(pw);
  };

  const caesarResult =
    caesarMode === 'encrypt' ? caesarEncrypt(caesarText, caesarShift) : caesarDecrypt(caesarText, caesarShift);

  const vigenereResult =
    vigenereMode === 'encrypt'
      ? vigenereEncrypt(vigenereText, vigenereKey)
      : vigenereDecrypt(vigenereText, vigenereKey);

  const xorResult = xorMode === 'encrypt' ? xorEncrypt(xorText, xorKey) : xorDecrypt(xorText, xorKey);

  const b64Result = b64Mode === 'encode' ? base64Encode(b64Text) : base64Decode(b64Text);
  const urlResult = urlMode === 'encode' ? urlEncode(urlText) : urlDecode(urlText);
  const hashResult = simpleHash(hashText);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')}>
          <ChevronLeft size={20} />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
          <KeyRound size={20} className="text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="ciphers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="ciphers" className="text-xs">
            <Lock size={14} className="mr-1" /> {t('tabs.ciphers')}
          </TabsTrigger>
          <TabsTrigger value="encoding" className="text-xs">
            <Shuffle size={14} className="mr-1" /> {t('tabs.encoding')}
          </TabsTrigger>
          <TabsTrigger value="hashing" className="text-xs">
            <KeyRound size={14} className="mr-1" /> {t('tabs.hashing')}
          </TabsTrigger>
          <TabsTrigger value="passwords" className="text-xs">
            <Unlock size={14} className="mr-1" /> {t('tabs.passwords')}
          </TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">
            <KeyRound size={14} className="mr-1" /> {t('tabs.advanced')}
          </TabsTrigger>
        </TabsList>

        {/* ===== CIPHERS TAB ===== */}
        <TabsContent value="ciphers" className="space-y-4">
          {/* Caesar */}
          <Card className="border-border">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-amber-600" />
                <h3 className="text-sm font-semibold">{t('caesar.title')}</h3>
                <Badge variant="secondary" className="text-[10px]">
                  {t('caesar.badge')}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">{t('caesar.description')}</p>

              <RadioGroup
                value={caesarMode}
                onValueChange={(v) => setCaesarMode(v as 'encrypt' | 'decrypt')}
                className="flex gap-4"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="encrypt" id="caesar-e" />
                  <Label htmlFor="caesar-e" className="text-xs">
                    {t('caesar.encrypt')}
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="decrypt" id="caesar-d" />
                  <Label htmlFor="caesar-d" className="text-xs">
                    {t('caesar.decrypt')}
                  </Label>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t('caesar.shift', { value: caesarShift })}</Label>
                </div>
                <Slider value={[caesarShift]} min={1} max={25} step={1} onValueChange={(v) => setCaesarShift(v[0])} />
              </div>

              <div>
                <Label className="mb-1 block text-xs">{t('caesar.text')}</Label>
                <Input
                  value={caesarText}
                  onChange={(e) => setCaesarText(e.target.value)}
                  placeholder={t('caesar.placeholder')}
                  className="font-mono text-sm"
                />
              </div>

              <div className="bg-secondary flex items-center justify-between gap-2 rounded-lg p-3">
                <code className="flex-1 font-mono text-sm break-all text-amber-700">{caesarResult || '...'}</code>
                <CopyButton text={caesarResult} />
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-[11px] text-amber-700">
                  <strong>{t('caesar.example')}</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Vigenere */}
          <Card className="border-border">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-violet-600" />
                <h3 className="text-sm font-semibold">{t('vigenere.title')}</h3>
                <Badge variant="secondary" className="text-[10px]">
                  {t('vigenere.badge')}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">{t('vigenere.description')}</p>

              <RadioGroup
                value={vigenereMode}
                onValueChange={(v) => setVigenereMode(v as 'encrypt' | 'decrypt')}
                className="flex gap-4"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="encrypt" id="vig-e" />
                  <Label htmlFor="vig-e" className="text-xs">
                    {t('caesar.encrypt')}
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="decrypt" id="vig-d" />
                  <Label htmlFor="vig-d" className="text-xs">
                    {t('caesar.decrypt')}
                  </Label>
                </div>
              </RadioGroup>

              <div>
                <Label className="mb-1 block text-xs">{t('vigenere.keyword')}</Label>
                <Input
                  value={vigenereKey}
                  onChange={(e) => setVigenereKey(e.target.value)}
                  placeholder="secret"
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">{t('caesar.text')}</Label>
                <Input
                  value={vigenereText}
                  onChange={(e) => setVigenereText(e.target.value)}
                  placeholder={t('caesar.placeholder')}
                  className="font-mono text-sm"
                />
              </div>

              <div className="bg-secondary flex items-center justify-between gap-2 rounded-lg p-3">
                <code className="flex-1 font-mono text-sm break-all text-violet-700">{vigenereResult || '...'}</code>
                <CopyButton text={vigenereResult} />
              </div>

              <CodeBlock
                code={`// Шифр Виженера — JavaScript
function vigenereEncrypt(text, key) {
  const k = key.toLowerCase().replace(/[^a-z]/g, '');
  let ki = 0;
  return text.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      const shift = k.charCodeAt(ki++ % k.length) - 97;
      return String.fromCharCode(((code - 65 + shift) % 26) + 65);
    }
    return char;
  }).join('');
}`}
                language="javascript"
                title="vigenere.js"
              />
            </CardContent>
          </Card>

          {/* XOR */}
          <Card className="border-border">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Unlock size={16} className="text-sky-600" />
                <h3 className="text-sm font-semibold">{t('xor.title')}</h3>
                <Badge variant="secondary" className="text-[10px]">
                  {t('xor.badge')}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">{t('xor.description')}</p>

              <RadioGroup
                value={xorMode}
                onValueChange={(v) => setXorMode(v as 'encrypt' | 'decrypt')}
                className="flex gap-4"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="encrypt" id="xor-e" />
                  <Label htmlFor="xor-e" className="text-xs">
                    {t('caesar.encrypt')}
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="decrypt" id="xor-d" />
                  <Label htmlFor="xor-d" className="text-xs">
                    {t('caesar.decrypt')}
                  </Label>
                </div>
              </RadioGroup>

              <div>
                <Label className="mb-1 block text-xs">{t('xor.key')}</Label>
                <Input
                  value={xorKey}
                  onChange={(e) => setXorKey(e.target.value)}
                  placeholder="key"
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">
                  {xorMode === 'encrypt' ? t('xor.textLabel') : t('xor.hexLabel')}:
                </Label>
                <Input
                  value={xorText}
                  onChange={(e) => setXorText(e.target.value)}
                  placeholder={xorMode === 'encrypt' ? t('xor.textPlaceholder') : t('xor.hexPlaceholder')}
                  className="font-mono text-sm"
                />
              </div>

              <div className="bg-secondary flex items-center justify-between gap-2 rounded-lg p-3">
                <code className="flex-1 font-mono text-sm break-all text-sky-700">{xorResult || '...'}</code>
                <CopyButton text={xorResult} />
              </div>

              <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                <p className="text-[11px] text-sky-700">
                  <strong>{t('xor.property')}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ENCODING TAB ===== */}
        <TabsContent value="encoding" className="space-y-4">
          {/* Base64 */}
          <Card className="border-border">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Shuffle size={16} className="text-emerald-600" />
                <h3 className="text-sm font-semibold">{t('base64.title')}</h3>
                <Badge variant="secondary" className="text-[10px]">
                  {t('base64.badge')}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">{t('base64.description')}</p>

              <RadioGroup
                value={b64Mode}
                onValueChange={(v) => setB64Mode(v as 'encode' | 'decode')}
                className="flex gap-4"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="encode" id="b64-e" />
                  <Label htmlFor="b64-e" className="text-xs">
                    Encode
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="decode" id="b64-d" />
                  <Label htmlFor="b64-d" className="text-xs">
                    Decode
                  </Label>
                </div>
              </RadioGroup>

              <div>
                <Label className="mb-1 block text-xs">{t('base64.text')}</Label>
                <Input
                  value={b64Text}
                  onChange={(e) => setB64Text(e.target.value)}
                  placeholder={b64Mode === 'encode' ? t('caesar.placeholder') : 'SGVsbG8gV29ybGQ='}
                  className="font-mono text-sm"
                />
              </div>

              <div className="bg-secondary flex items-center justify-between gap-2 rounded-lg p-3">
                <code className="flex-1 font-mono text-sm break-all text-emerald-700">{b64Result || '...'}</code>
                <CopyButton text={b64Result} />
              </div>
            </CardContent>
          </Card>

          {/* URL Encoding */}
          <Card className="border-border">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Shuffle size={16} className="text-amber-600" />
                <h3 className="text-sm font-semibold">URL Encoding / Decoding</h3>
                <Badge variant="secondary" className="text-[10px]">
                  RFC 3986
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">{t('urlEncoding.description')}</p>

              <RadioGroup
                value={urlMode}
                onValueChange={(v) => setUrlMode(v as 'encode' | 'decode')}
                className="flex gap-4"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="encode" id="url-e" />
                  <Label htmlFor="url-e" className="text-xs">
                    Encode
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="decode" id="url-d" />
                  <Label htmlFor="url-d" className="text-xs">
                    Decode
                  </Label>
                </div>
              </RadioGroup>

              <div>
                <Label className="mb-1 block text-xs">{t('caesar.text')}</Label>
                <Input
                  value={urlText}
                  onChange={(e) => setUrlText(e.target.value)}
                  placeholder='<script>alert("XSS")</script>'
                  className="font-mono text-sm"
                />
              </div>

              <div className="bg-secondary flex items-center justify-between gap-2 rounded-lg p-3">
                <code className="flex-1 font-mono text-sm break-all text-amber-700">{urlResult || '...'}</code>
                <CopyButton text={urlResult} />
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-[11px] text-amber-700">
                  <strong>{t('urlEncoding.securityNote')}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== HASHING TAB ===== */}
        <TabsContent value="hashing" className="space-y-4">
          <Card className="border-border">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-red-600" />
                <h3 className="text-sm font-semibold">{t('hashing.title')}</h3>
              </div>
              <p className="text-muted-foreground text-xs">{t('hashing.description')}</p>

              <div>
                <Label className="mb-1 block text-xs">{t('hashing.enterText')}</Label>
                <Input
                  value={hashText}
                  onChange={(e) => setHashText(e.target.value)}
                  placeholder={t('hashing.placeholder')}
                  className="font-mono text-sm"
                />
              </div>

              {hashText && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-muted-foreground mb-1 text-[10px]">{t('hashing.md5Like')}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 font-mono text-xs break-all text-red-700">{hashResult.md5Like}</code>
                      <CopyButton text={hashResult.md5Like} />
                    </div>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-muted-foreground mb-1 text-[10px]">{t('hashing.shaLike')}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 font-mono text-xs break-all text-orange-700">{hashResult.shaLike}</code>
                      <CopyButton text={hashResult.shaLike} />
                    </div>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-muted-foreground mb-1 text-[10px]">{t('hashing.djb2')}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 font-mono text-xs break-all text-sky-700">{hashResult.djb2}</code>
                      <CopyButton text={hashResult.djb2} />
                    </div>
                  </div>

                  <Separator />

                  {/* Avalanche effect demo */}
                  <div>
                    <p className="mb-2 text-xs font-semibold">{t('hashing.avalanche')}</p>
                    {hashText.length > 0 && (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                          <p className="mb-1 text-[10px] text-emerald-600">
                            {t('hashing.original')}: &quot;{hashText}&quot;
                          </p>
                          <code className="font-mono text-[11px] break-all text-emerald-800">{hashResult.djb2}</code>
                        </div>
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <p className="mb-1 text-[10px] text-red-600">
                            {t('hashing.modified')}: &quot;
                            {hashText.slice(0, -1) + (hashText[hashText.length - 1] === 'a' ? 'b' : 'a')}
                            &quot;
                          </p>
                          <code className="font-mono text-[11px] break-all text-red-800">
                            {
                              simpleHash(hashText.slice(0, -1) + (hashText[hashText.length - 1] === 'a' ? 'b' : 'a'))
                                .djb2
                            }
                          </code>
                        </div>
                      </div>
                    )}
                    <p className="text-muted-foreground mt-2 text-[11px]">{t('hashing.avalancheNote')}</p>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-semibold">{t('hashing.comparisonTitle')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-border border-b">
                      <th className="text-muted-foreground py-2 pr-4 text-left">{t('hashing.algo')}</th>
                      <th className="text-muted-foreground py-2 pr-4 text-left">{t('hashing.hashLength')}</th>
                      <th className="text-muted-foreground py-2 pr-4 text-left">{t('hashing.security')}</th>
                      <th className="text-muted-foreground py-2 text-left">{t('hashing.usage')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['MD5', '128 bits', t('hashing.unsafe'), t('hashing.md5Usage')],
                      ['SHA-1', '160 bits', t('hashing.unsafe'), t('hashing.sha1Usage')],
                      ['SHA-256', '256 bits', t('hashing.safe'), t('hashing.sha256Usage')],
                      ['SHA-512', '512 bits', t('hashing.safe'), t('hashing.sha512Usage')],
                      ['bcrypt', '192 bits', t('hashing.safe'), t('hashing.bcryptUsage')],
                      ['Argon2', t('hashing.hashLength'), t('hashing.safe'), t('hashing.argon2Usage')],
                    ].map(([name, len, sec, use]) => (
                      <tr key={name} className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono font-medium">{name}</td>
                        <td className="py-2 pr-4">{len}</td>
                        <td className="py-2 pr-4">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${
                              sec === t('hashing.safe') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {sec}
                          </Badge>
                        </td>
                        <td className="text-muted-foreground py-2">{use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== PASSWORD GENERATOR TAB ===== */}
        <TabsContent value="passwords" className="space-y-4">
          <Card className="border-border">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Unlock size={16} className="text-emerald-600" />
                <h3 className="text-sm font-semibold">{t('passwords.title')}</h3>
              </div>
              <p className="text-muted-foreground text-xs">{t('passwords.description')}</p>

              {/* Generated password display */}
              <div className="flex items-center gap-3 rounded-xl bg-slate-900 p-5">
                <code
                  className={`flex-1 font-mono text-lg break-all ${showPw ? 'text-emerald-400' : 'text-slate-400'}`}
                >
                  {generatedPassword || t('passwords.placeholder')}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
                <CopyButton text={generatedPassword} />
              </div>

              {/* Length slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t('passwords.length')}</Label>
                  <span className="font-mono text-sm font-bold">{pwLength}</span>
                </div>
                <Slider value={[pwLength]} min={4} max={64} step={1} onValueChange={(v) => setPwLength(v[0])} />
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: t('passwords.uppercase'),
                    value: pwUppercase,
                    setter: setPwUppercase,
                  },
                  {
                    label: t('passwords.lowercase'),
                    value: pwLowercase,
                    setter: setPwLowercase,
                  },
                  {
                    label: t('passwords.numbers'),
                    value: pwNumbers,
                    setter: setPwNumbers,
                  },
                  {
                    label: t('passwords.symbols'),
                    value: pwSymbols,
                    setter: setPwSymbols,
                  },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => opt.setter(!opt.value)}
                    className={`flex items-center gap-2 rounded-lg border-2 p-3 text-xs transition-all ${
                      opt.value ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-border text-slate-400'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
                        opt.value ? 'border-emerald-500 bg-emerald-500' : 'border-border'
                      }`}
                    >
                      {opt.value && <CheckCircle2 size={12} className="text-white" />}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </div>

              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={generatePassword}>
                <RefreshCw size={14} className="mr-2" /> {t('passwords.generate')}
              </Button>

              {/* Entropy info */}
              {generatedPassword && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <h4 className="mb-1 text-xs font-semibold text-emerald-700">{t('passwords.managersTitle')}</h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-600">
                      <span>
                        {t('passwords.charCount', {
                          count: generatedPassword.length,
                        })}
                      </span>
                      <span>
                        {t('passwords.entropy', {
                          bits: Math.round(
                            generatedPassword.length *
                              Math.log2(
                                (pwUppercase ? 26 : 0) +
                                  (pwLowercase ? 26 : 0) +
                                  (pwNumbers ? 10 : 0) +
                                  (pwSymbols ? 32 : 0) || 26,
                              ),
                          ),
                        })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-semibold">{t('passwords.managersTitle')}</h3>
              <p className="text-muted-foreground mb-3 text-xs leading-relaxed">{t('passwords.managersDescription')}</p>
              <div className="space-y-2">
                {[
                  { name: 'Bitwarden', desc: t('passwords.bitwarden') },
                  { name: 'KeePassXC', desc: t('passwords.keepassxc') },
                  { name: '1Password', desc: t('passwords.1password') },
                ].map((pm) => (
                  <div key={pm.name} className="bg-secondary flex items-start gap-2 rounded-lg p-3">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-xs font-medium">{pm.name}</p>
                      <p className="text-muted-foreground text-[11px]">{pm.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ADVANCED TAB ===== */}
        <TabsContent value="advanced" className="space-y-4">
          {/* AES Demo */}
          <Card className="border-border">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-blue-600" />
                <h3 className="text-sm font-semibold">{t('aes.title')}</h3>
                <Badge variant="secondary" className="text-[10px]">
                  {t('aes.badge')}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">{t('aes.description')}</p>

              <RadioGroup
                value={aesMode}
                onValueChange={(v) => setAesMode(v as 'encrypt' | 'decrypt')}
                className="flex gap-4"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="encrypt" id="aes-e" />
                  <Label htmlFor="aes-e" className="text-xs">
                    {t('caesar.encrypt')}
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="decrypt" id="aes-d" />
                  <Label htmlFor="aes-d" className="text-xs">
                    {t('caesar.decrypt')}
                  </Label>
                </div>
              </RadioGroup>

              <div>
                <Label className="mb-1 block text-xs">{t('aes.key')}</Label>
                <Input
                  value={aesKey}
                  onChange={(e) => setAesKey(e.target.value)}
                  placeholder={t('aes.keyPlaceholder')}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">
                  {aesMode === 'encrypt' ? t('aes.plaintext') : t('aes.ciphertext')}
                </Label>
                <Input
                  value={aesText}
                  onChange={(e) => setAesText(e.target.value)}
                  placeholder={t('caesar.placeholder')}
                  className="font-mono text-sm"
                />
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setAesResult(
                    aesMode === 'encrypt' ? aesEncryptDemo(aesText, aesKey) : aesDecryptDemo(aesText, aesKey),
                  );
                }}
              >
                {aesMode === 'encrypt' ? <Lock size={14} className="mr-1" /> : <Unlock size={14} className="mr-1" />}
                {aesMode === 'encrypt' ? t('aes.encryptButton') : t('aes.decryptButton')}
              </Button>

              {aesResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="bg-secondary flex items-center justify-between gap-2 rounded-lg p-3">
                    <code className="flex-1 font-mono text-sm break-all text-blue-700">{aesResult}</code>
                    <CopyButton text={aesResult} />
                  </div>
                </motion.div>
              )}

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-[11px] text-blue-700">
                  <strong>{t('aes.note')}</strong>
                  <code className="mt-1 block rounded bg-blue-100 px-2 py-1 text-[10px]">
                    {'crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, data)'}
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* JWT Decoder */}
          <Card className="border-border">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-violet-600" />
                <h3 className="text-sm font-semibold">{t('jwt.title')}</h3>
                <Badge variant="secondary" className="text-[10px]">
                  {t('jwt.badge')}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">{t('jwt.description')}</p>

              <div>
                <Label className="mb-1 block text-xs">{t('jwt.token')}</Label>
                <Input
                  value={jwtToken}
                  onChange={(e) => {
                    setJwtToken(e.target.value);
                    decodeJWT(e.target.value);
                  }}
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                  className="font-mono text-xs"
                />
              </div>

              {jwtDecoded.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs text-red-700">{jwtDecoded.error}</p>
                </div>
              )}

              {jwtDecoded.valid && jwtDecoded.header && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="mb-1 text-[10px] font-semibold text-red-700">{t('jwt.header')}</p>
                    <CodeBlock code={JSON.stringify(jwtDecoded.header, null, 2)} language="json" title="header.json" />
                  </div>
                  <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                    <p className="mb-1 text-[10px] font-semibold text-violet-700">{t('jwt.payload')}</p>
                    <CodeBlock
                      code={JSON.stringify(jwtDecoded.payload, null, 2)}
                      language="json"
                      title="payload.json"
                    />
                  </div>
                  {typeof (jwtDecoded.payload as Record<string, unknown>)?.exp === 'number' && (
                    <div className="bg-secondary rounded-lg p-3">
                      <p className="text-muted-foreground text-[11px]">
                        <strong>{t('jwt.expiry')}</strong>{' '}
                        {jwtDecoded.error ? (
                          <span className="text-red-600">
                            {t('jwt.expired', {
                              date: formatDateTime((jwtDecoded.payload as Record<string, number>).exp * 1000),
                            })}
                          </span>
                        ) : (
                          <span className="text-emerald-600">
                            {t('jwt.validUntil', {
                              date: formatDateTime((jwtDecoded.payload as Record<string, number>).exp * 1000),
                            })}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                <p className="text-[11px] text-violet-700">
                  <strong>{t('jwt.tryDemo')}</strong>{' '}
                  <button
                    className="font-medium text-violet-600 underline"
                    onClick={() => {
                      const demo =
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
                      setJwtToken(demo);
                      decodeJWT(demo);
                    }}
                  >
                    {t('jwt.insertDemo')}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ROT13 */}
          <Card className="border-border">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-amber-600" />
                <h3 className="text-sm font-semibold">{t('rot13.title')}</h3>
                <Badge variant="secondary" className="text-[10px]">
                  {t('rot13.badge')}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">{t('rot13.description')}</p>

              <div>
                <Label className="mb-1 block text-xs">{t('caesar.text')}</Label>
                <Input
                  value={rot13Text}
                  onChange={(e) => setRot13Text(e.target.value)}
                  placeholder={t('rot13.placeholder')}
                  className="font-mono text-sm"
                />
              </div>

              {rot13Text && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="bg-secondary flex items-center justify-between gap-2 rounded-lg p-3">
                    <code className="flex-1 font-mono text-sm break-all text-amber-700">{rot13(rot13Text)}</code>
                    <CopyButton text={rot13(rot13Text)} />
                  </div>
                </motion.div>
              )}

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-[11px] text-amber-700">
                  <strong>{t('rot13.example')}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Complete */}
      {!isCompleted ? (
        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => completeModule('tools')}>
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
