'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import {
  Shield,
  Search,
  Copy,
  Check,
  BookOpen,
  CheckCircle2,
  Lock,
  Globe,
  Database,
  FileText,
  KeyRound,
  Terminal,
} from 'lucide-react';

interface CheatSheet {
  id: string;
  category: string;
  title: string;
  icon: string;
  items: { title: string; content: string; code?: string }[];
}

const cheatSheets: CheatSheet[] = [
  {
    id: 'owasp',
    category: 'OWASP',
    title: 'OWASP Top 10 2021',
    icon: 'Shield',
    items: [
      {
        title: 'A01 — Broken Access Control',
        content: 'Проверяйте авторизацию на каждом эндпоинте. Используйте deny-by-default.',
        code: 'if (resource.userId !== req.user.id) return res.status(403);',
      },
      {
        title: 'A02 — Cryptographic Failures',
        content: 'Используйте bcrypt для паролей, TLS 1.3 для передачи, AES-256 для хранения.',
        code: 'const hash = await bcrypt.hash(password, 12);',
      },
      {
        title: 'A03 — Injection',
        content: 'Используйте параметризованные запросы. Никогда не конкатенируйте SQL.',
        code: 'db.query("SELECT * FROM users WHERE id = $1", [userId]);',
      },
      {
        title: 'A04 — Insecure Design',
        content: 'Threat modeling на этапе проектирования. Rate limiting, CAPTCHA, business logic validation.',
        code: '// Rate limiting\nconst limiter = rateLimit({ windowMs: 15*60*1000, max: 100 });',
      },
      {
        title: 'A05 — Security Misconfiguration',
        content: 'Отключите debug mode в production. Security headers. Обновляйте зависимости.',
        code: 'app.use(helmet());\napp.disable("x-powered-by");',
      },
      {
        title: 'A06 — Vulnerable Components',
        content: 'Аудит зависимостей: npm audit, Snyk, Dependabot. Lock-файлы обязательны.',
        code: 'npm audit fix\nnpx depcheck',
      },
      {
        title: 'A07 — Auth Failures',
        content: 'MFA обязательна. Короткоживущие сессии. Secure password reset tokens.',
        code: 'jwt.sign(payload, secret, { expiresIn: "1h", algorithm: "HS256" });',
      },
      {
        title: 'A08 — Data Integrity',
        content: 'SRI для CDN-ресурсов. Цифровые подписи. CI/CD pipeline security.',
        code: '<script src="cdn.js" integrity="sha384-..." crossorigin="anonymous">',
      },
      {
        title: 'A09 — Logging Failures',
        content: 'Логируйте auth events, ошибки, access. Никогда не логируйте пароли и токены.',
        code: 'console.error(err); // НЕ console.error(password, token);',
      },
      {
        title: 'A10 — SSRF',
        content: 'Allowlist доменов. Блокируйте private IPs. Валидируйте URL после redirect.',
        code: 'if (isPrivateIP(resolved)) throw new Error("Blocked");',
      },
    ],
  },
  {
    id: 'http-headers',
    category: 'Headers',
    title: 'Security Headers',
    icon: 'Lock',
    items: [
      {
        title: 'Content-Security-Policy',
        content: 'Контролирует источники скриптов, стилей, изображений.',
        code: "Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.cdn.com",
      },
      {
        title: 'Strict-Transport-Security',
        content: 'Принудительный HTTPS. Предотвращает downgrade-атаки.',
        code: 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
      },
      {
        title: 'X-Content-Type-Options',
        content: 'Запрещает MIME-type sniffing.',
        code: 'X-Content-Type-Options: nosniff',
      },
      {
        title: 'X-Frame-Options',
        content: 'Защита от clickjacking.',
        code: 'X-Frame-Options: DENY',
      },
      {
        title: 'Referrer-Policy',
        content: 'Контролирует передачу Referer.',
        code: 'Referrer-Policy: strict-origin-when-cross-origin',
      },
      {
        title: 'Permissions-Policy',
        content: 'Ограничивает браузерные API.',
        code: 'Permissions-Policy: camera=(), microphone=(), geolocation=()',
      },
      {
        title: 'Cache-Control',
        content: 'Контролирует кэширование чувствительных данных.',
        code: 'Cache-Control: no-store, no-cache, must-revalidate',
      },
      {
        title: 'X-DNS-Prefetch-Control',
        content: 'Отключает DNS prefetch для приватности.',
        code: 'X-DNS-Prefetch-Control: off',
      },
    ],
  },
  {
    id: 'sql-defense',
    category: 'SQL',
    title: 'Защита от SQL-инъекций',
    icon: 'Database',
    items: [
      {
        title: 'Параметризованные запросы',
        content: 'Золотой стандарт защиты. Данные передаются отдельно от SQL-кода.',
        code: 'const user = await db.query(\n  "SELECT * FROM users WHERE email = $1",\n  [email]\n);',
      },
      {
        title: 'ORM (Prisma, Sequelize)',
        content: 'ORM автоматически параметризирует запросы.',
        code: 'const user = await prisma.user.findUnique({\n  where: { email }\n});',
      },
      {
        title: 'Stored Procedures',
        content: 'Используйте хранимые процедуры для сложных запросов.',
        code: 'EXEC GetUserByEmail @email = ?',
      },
      {
        title: 'Input Validation',
        content: 'Валидируйте тип, формат, длину входных данных.',
        code: 'if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+$/.test(email)) {\n  throw new Error("Invalid email");\n}',
      },
      {
        title: 'Least Privilege DB Account',
        content: 'Приложение не должно использовать SA/root DB аккаунт.',
        code: "GRANT SELECT, INSERT ON app.* TO 'app_user'@'%';\n-- NO GRANT ALL",
      },
      {
        title: 'WAF Rules',
        content: 'Дополнительный слой защиты. Не заменяет параметризацию!',
        code: '# ModSecurity rule\nSecRule ARGS "@detectSQLi" \\\n  "id:1001,deny,status:403"',
      },
    ],
  },
  {
    id: 'xss-defense',
    category: 'XSS',
    title: 'Защита от XSS',
    icon: 'FileText',
    items: [
      {
        title: 'Output Encoding',
        content: 'Экранируйте HTML-сущности при выводе пользовательских данных.',
        code: 'function escapeHtml(str) {\n  return str.replace(/[&<>"\'/]/g, s => ({\n    "&": "&amp;", "<": "&lt;", ">": "&gt;",\n    \'"": "&quot;", "\'": "&#x27;", "/": "&#x2F;"\n  })[s]);\n}',
      },
      {
        title: 'DOMPurify',
        content: 'Библиотека для санитизации HTML.',
        code: 'import DOMPurify from "dompurify";\nconst clean = DOMPurify.sanitize(userInput);',
      },
      {
        title: 'textContent вместо innerHTML',
        content: 'textContent не интерпретирует HTML.',
        code: '// Безопасно:\nelement.textContent = userInput;\n\n// Опасно:\nelement.innerHTML = userInput;',
      },
      {
        title: 'CSP (Content Security Policy)',
        content: 'Блокирует inline-скрипты и внешние источники.',
        code: "Content-Security-Policy: script-src 'self'",
      },
      {
        title: 'HttpOnly Cookies',
        content: 'JavaScript не может прочитать HttpOnly cookie.',
        code: 'res.cookie("session", token, {\n  httpOnly: true,\n  secure: true,\n  sameSite: "strict"\n});',
      },
      {
        title: 'React Auto-Escaping',
        content: 'React автоматически экранирует JSX, но опасен dangerouslySetInnerHTML.',
        code: '// Безопасно:\n<div>{userInput}</div>\n\n// Опасно:\n<div dangerouslySetInnerHTML={{__html: userInput}} />',
      },
    ],
  },
  {
    id: 'auth-best',
    category: 'Auth',
    title: 'Аутентификация — Best Practices',
    icon: 'KeyRound',
    items: [
      {
        title: 'Password Hashing',
        content: 'Используйте bcrypt или Argon2. Никогда MD5/SHA1.',
        code: 'const hash = await bcrypt.hash(password, 12);\nconst match = await bcrypt.compare(input, hash);',
      },
      {
        title: 'JWT Best Practices',
        content: 'Verify algorithm, check exp, short TTL, httpOnly cookie.',
        code: 'const token = jwt.sign(payload, secret, {\n  algorithm: "HS256",\n  expiresIn: "1h"\n});',
      },
      {
        title: 'Rate Limiting',
        content: 'Защита от брутфорса и credential stuffing.',
        code: 'const loginLimiter = rateLimit({\n  windowMs: 15 * 60 * 1000,\n  max: 5,\n  message: "Too many attempts"\n});',
      },
      {
        title: 'MFA / 2FA',
        content: 'TOTP (Google Authenticator), WebAuthn (passkeys).',
        code: '// TOTP verification\nconst verified = speakeasy.totp.verify({\n  secret: user.totpSecret,\n  encoding: "base32",\n  token: userInput,\n  window: 1\n});',
      },
      {
        title: 'Password Reset',
        content: 'Криптографически случайный токен, 1 час expiry, однократное использование.',
        code: 'const token = crypto.randomBytes(32).toString("hex");\nconst expires = Date.now() + 3600000; // 1 hour',
      },
      {
        title: 'Session Security',
        content: 'Secure, HttpOnly, SameSite cookies. Регенерация после логина.',
        code: 'req.session.regenerate((err) => {\n  req.session.userId = user.id;\n});',
      },
    ],
  },
  {
    id: 'crypto-ref',
    category: 'Crypto',
    title: 'Криптография — Quick Reference',
    icon: 'Lock',
    items: [
      {
        title: 'Хеширование паролей',
        content: 'bcrypt (cost 12+), Argon2id (рекомендуется).',
        code: 'bcrypt.hash(password, 12); // cost 12\nargon2.hash(password, { type: argon2.argon2id });',
      },
      {
        title: 'Симметричное шифрование',
        content: 'AES-256-GCM (authenticated encryption).',
        code: 'const cipher = crypto.createCipheriv(\n  "aes-256-gcm", key, iv\n);',
      },
      {
        title: 'Асимметричное шифрование',
        content: 'RSA-2048+, ECDSA (P-256), Ed25519.',
        code: 'const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");',
      },
      {
        title: 'Цифровые подписи',
        content: 'HMAC для integrity, RSA/ECDSA для authentication.',
        code: 'const signature = crypto.sign(\n  "SHA256", data, privateKey\n);',
      },
      {
        title: 'TLS/SSL',
        content: 'TLS 1.3 minimum. Отключите SSLv3, TLS 1.0, 1.1.',
        code: 'const server = https.createServer({\n  minVersion: "TLSv1.3",\n  key, cert\n}, app);',
      },
      {
        title: 'Random Generation',
        content: 'crypto.randomBytes для криптографических случайных значений.',
        code: 'const token = crypto.randomBytes(32).toString("hex");\nconst salt = crypto.randomBytes(16);',
      },
    ],
  },
  {
    id: 'network-security',
    category: 'Network',
    title: 'Сетевая безопасность',
    icon: 'Globe',
    items: [
      {
        title: 'Порты и протоколы',
        content: '22:SSH, 53:DNS, 80:HTTP, 443:HTTPS, 3306:MySQL, 5432:PostgreSQL',
        code: '# Проверить открытые порты\nnmap -sS -O target.com\n# Проверить SSL\ntestssl.sh https://target.com',
      },
      {
        title: 'Фаервол (iptables)',
        content: 'Блокируйте всё, разрешайте необходимое.',
        code: 'iptables -P INPUT DROP\niptables -P FORWARD DROP\niptables -A INPUT -p tcp --dport 443 -j ACCEPT\niptables -A INPUT -p tcp --dport 22 -j ACCEPT',
      },
      {
        title: 'DNS Security',
        content: 'DNSSEC для подписанных записей. DoH/DoT для приватности.',
        code: '# Проверить DNSSEC\ndig +dnssec example.com\n# DoH endpoint\nhttps://cloudflare-dns.com/dns-query',
      },
      {
        title: 'SSH Hardening',
        content: 'Отключите root login, password auth. Используйте ключи.',
        code: '# /etc/ssh/sshd_config\nPermitRootLogin no\nPasswordAuthentication no\nPubkeyAuthentication yes\nMaxAuthTries 3',
      },
      {
        title: 'Network Segmentation',
        content: 'Разделяйте сеть на зоны: public, private, DMZ.',
        code: '# VPC Subnets:\n# Public (Web servers) — 10.0.1.0/24\n# Private (App servers) — 10.0.2.0/24\n# Data (Databases) — 10.0.3.0/24',
      },
      {
        title: 'IDS/IPS',
        content: 'Snort, Suricata для обнаружения аномалий.',
        code: '# Snort rule: detect SQLi\nalert tcp any any -> $HOME_NET 80 \\\n  (msg:"SQL Injection attempt"; \\\n  content:"SELECT"; nocase; \\\n  content:"FROM"; nocase; sid:1001;)',
      },
    ],
  },
  {
    id: 'cli-tools',
    category: 'Tools',
    title: 'Полезные CLI-команды',
    icon: 'Terminal',
    items: [
      {
        title: 'Генерация хеша пароля',
        content: 'Создать bcrypt-хеш из командной строки.',
        code: "node -e \"console.log(require('bcryptjs').hashSync('password', 12))\"",
      },
      {
        title: 'Генерация JWT секрета',
        content: 'Криптографически случайный JWT secret.',
        code: "openssl rand -base64 32\n# или\nnode -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
      },
      {
        title: 'Проверка SSL-сертификата',
        content: 'Проверить срок действия иissuer сертификата.',
        code: 'openssl s_client -connect example.com:443 -servername example.com\nopenssl x509 -noout -dates -issuer',
      },
      {
        title: 'Декодирование Base64 JWT',
        content: 'Расшифровать payload JWT-токена.',
        code: 'echo "eyJzdWIiOiIxMjM0NTY3ODkwIn0" | base64 -d\n# или\nnode -e "console.log(Buffer.from(\'eyJzdWIiOiIxMjM0NTY3ODkwIn0\', \'base64\').toString())"',
      },
      {
        title: 'Шифрование файла (AES)',
        content: 'Зашифровать файл с помощью OpenSSL.',
        code: 'openssl enc -aes-256-cbc -salt -in secret.txt -out secret.enc\n# Расшифровка:\nopenssl enc -aes-256-cbc -d -in secret.enc -out secret.txt',
      },
      {
        title: 'Генерация SSH-ключа',
        content: 'Создать Ed25519 SSH-ключ.',
        code: 'ssh-keygen -t ed25519 -C "user@example.com"\n# Копировать на сервер:\nssh-copy-id user@server',
      },
    ],
  },
];

const categoryColors: Record<string, string> = {
  OWASP: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Headers: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SQL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  XSS: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Auth: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  Crypto: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Network: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  Tools: 'bg-muted text-foreground/70 dark:bg-slate-900/30 dark:text-slate-400',
};

const iconMap: Record<string, React.ReactNode> = {
  Shield: <Shield size={18} />,
  Lock: <Lock size={18} />,
  Database: <Database size={18} />,
  FileText: <FileText size={18} />,
  KeyRound: <KeyRound size={18} />,
  Globe: <Globe size={18} />,
  Terminal: <Terminal size={18} />,
};

export default function SecurityCheatSheets() {
  const t = useTranslations('securityCheatSheets');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['all', ...cheatSheets.map((s) => s.category)];

  const filteredSheets = cheatSheets.filter((sheet) => {
    if (activeCategory !== 'all' && sheet.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        sheet.title.toLowerCase().includes(q) ||
        sheet.items.some(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.content.toLowerCase().includes(q) ||
            (item.code && item.code.toLowerCase().includes(q)),
        )
      );
    }
    return true;
  });

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code).catch(() => {
      // Clipboard API unavailable
    });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <BookOpen className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-foreground text-xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          {t('description')}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2" size={18} />
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === cat ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat === 'all' ? t('allCategories') : cat}
          </button>
        ))}
      </div>

      {/* Cheat Sheets */}
      <div className="space-y-4">
        {filteredSheets.map((sheet) => (
          <Card key={sheet.id} className="border-border/50">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {iconMap[sheet.icon] || <BookOpen size={18} />}
                </div>
                <h2 className="text-foreground text-lg font-semibold">{sheet.title}</h2>
                <Badge className={categoryColors[sheet.category]}>{sheet.category}</Badge>
                <Badge variant="secondary" className="text-xs">
                  {t('itemsCount', { count: sheet.items.length })}
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {sheet.items.map((item, idx) => (
                  <div key={idx} className="border-border/50 bg-muted/30 rounded-lg border p-3">
                    <h3 className="text-foreground mb-1 flex items-center gap-2 text-sm font-semibold">
                      <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground mb-2 text-xs">{item.content}</p>
                    {item.code && (
                      <div className="relative">
                        <pre className="overflow-x-auto rounded-md bg-slate-900 p-2.5 font-mono text-xs leading-relaxed text-slate-100">
                          <code>{item.code}</code>
                        </pre>
                        <button
                          onClick={() => item.code && handleCopy(item.code, `${sheet.id}-${idx}`)}
                          className="absolute top-1.5 right-1.5 rounded bg-slate-800 p-1 text-slate-400 transition hover:bg-slate-700 hover:text-white dark:bg-slate-700"
                          title={t('copyTitle')}
                        >
                          {copiedId === `${sheet.id}-${idx}` ? (
                            <Check size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredSheets.length === 0 && (
          <div className="py-12 text-center">
            <Search size={48} className="text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('nothingFound', { query: searchQuery })}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
