export interface CheatSheet {
  id: string;
  category: string;
  titleKey: string;
  icon: string;
  items: { titleKey: string; contentKey: string; code?: string }[];
}

export const cheatSheets: CheatSheet[] = [
  {
    id: 'owasp',
    category: 'OWASP',
    titleKey: 'owaspTitle',
    icon: 'Shield',
    items: [
      {
        titleKey: 'owasp.a01.title',
        contentKey: 'owasp.a01.content',
        code: 'if (resource.userId !== req.user.id) return res.status(403);',
      },
      {
        titleKey: 'owasp.a02.title',
        contentKey: 'owasp.a02.content',
        code: 'const hash = await bcrypt.hash(password, 12);',
      },
      {
        titleKey: 'owasp.a03.title',
        contentKey: 'owasp.a03.content',
        code: 'db.query("SELECT * FROM users WHERE id = $1", [userId]);',
      },
      {
        titleKey: 'owasp.a04.title',
        contentKey: 'owasp.a04.content',
        code: '// Rate limiting\nconst limiter = rateLimit({ windowMs: 15*60*1000, max: 100 });',
      },
      {
        titleKey: 'owasp.a05.title',
        contentKey: 'owasp.a05.content',
        code: 'app.use(helmet());\napp.disable("x-powered-by");',
      },
      {
        titleKey: 'owasp.a06.title',
        contentKey: 'owasp.a06.content',
        code: 'npm audit fix\nnpx depcheck',
      },
      {
        titleKey: 'owasp.a07.title',
        contentKey: 'owasp.a07.content',
        code: 'jwt.sign(payload, secret, { expiresIn: "1h", algorithm: "HS256" });',
      },
      {
        titleKey: 'owasp.a08.title',
        contentKey: 'owasp.a08.content',
        code: '<script src="cdn.js" integrity="sha384-..." crossorigin="anonymous">',
      },
      {
        titleKey: 'owasp.a09.title',
        contentKey: 'owasp.a09.content',
        code: 'console.error(err); // NOT console.error(password, token);',
      },
      {
        titleKey: 'owasp.a10.title',
        contentKey: 'owasp.a10.content',
        code: 'if (isPrivateIP(resolved)) throw new Error("Blocked");',
      },
    ],
  },
  {
    id: 'http-headers',
    category: 'Headers',
    titleKey: 'headersTitle',
    icon: 'Lock',
    items: [
      {
        titleKey: 'headers.csp.title',
        contentKey: 'headers.csp.content',
        code: "Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.cdn.com",
      },
      {
        titleKey: 'headers.hsts.title',
        contentKey: 'headers.hsts.content',
        code: 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
      },
      {
        titleKey: 'headers.xcto.title',
        contentKey: 'headers.xcto.content',
        code: 'X-Content-Type-Options: nosniff',
      },
      {
        titleKey: 'headers.xfo.title',
        contentKey: 'headers.xfo.content',
        code: 'X-Frame-Options: DENY',
      },
      {
        titleKey: 'headers.rp.title',
        contentKey: 'headers.rp.content',
        code: 'Referrer-Policy: strict-origin-when-cross-origin',
      },
      {
        titleKey: 'headers.pp.title',
        contentKey: 'headers.pp.content',
        code: 'Permissions-Policy: camera=(), microphone=(), geolocation=()',
      },
      {
        titleKey: 'headers.cc.title',
        contentKey: 'headers.cc.content',
        code: 'Cache-Control: no-store, no-cache, must-revalidate',
      },
      {
        titleKey: 'headers.dns.title',
        contentKey: 'headers.dns.content',
        code: 'X-DNS-Prefetch-Control: off',
      },
    ],
  },
  {
    id: 'sql-defense',
    category: 'SQL',
    titleKey: 'sqlTitle',
    icon: 'Database',
    items: [
      {
        titleKey: 'sql.prepared.title',
        contentKey: 'sql.prepared.content',
        code: 'const user = await db.query(\n  "SELECT * FROM users WHERE email = $1",\n  [email]\n);',
      },
      {
        titleKey: 'sql.orm.title',
        contentKey: 'sql.orm.content',
        code: 'const user = await prisma.user.findUnique({\n  where: { email }\n});',
      },
      {
        titleKey: 'sql.stored.title',
        contentKey: 'sql.stored.content',
        code: 'EXEC GetUserByEmail @email = ?',
      },
      {
        titleKey: 'sql.validation.title',
        contentKey: 'sql.validation.content',
        code: 'if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+$/.test(email)) {\n  throw new Error("Invalid email");\n}',
      },
      {
        titleKey: 'sql.privilege.title',
        contentKey: 'sql.privilege.content',
        code: "GRANT SELECT, INSERT ON app.* TO 'app_user'@'%';\n-- NO GRANT ALL",
      },
      {
        titleKey: 'sql.waf.title',
        contentKey: 'sql.waf.content',
        code: '# ModSecurity rule\nSecRule ARGS "@detectSQLi" \\\n  "id:1001,deny,status:403"',
      },
    ],
  },
  {
    id: 'xss-defense',
    category: 'XSS',
    titleKey: 'xssTitle',
    icon: 'FileText',
    items: [
      {
        titleKey: 'xss.encoding.title',
        contentKey: 'xss.encoding.content',
        code: 'function escapeHtml(str) {\n  return str.replace(/[&<>"\'/]/g, s => ({\n    "&": "&amp;", "<": "&lt;", ">": "&gt;",\n    \'"": "&quot;", "\'": "&#x27;", "/": "&#x2F;"\n  })[s]);\n}',
      },
      {
        titleKey: 'xss.dompurify.title',
        contentKey: 'xss.dompurify.content',
        code: 'import DOMPurify from "dompurify";\nconst clean = DOMPurify.sanitize(userInput);',
      },
      {
        titleKey: 'xss.textcontent.title',
        contentKey: 'xss.textcontent.content',
        code: '// Safe:\nelement.textContent = userInput;\n\n// Dangerous:\nelement.innerHTML = userInput;',
      },
      {
        titleKey: 'xss.csp.title',
        contentKey: 'xss.csp.content',
        code: "Content-Security-Policy: script-src 'self'",
      },
      {
        titleKey: 'xss.httponly.title',
        contentKey: 'xss.httponly.content',
        code: 'res.cookie("session", token, {\n  httpOnly: true,\n  secure: true,\n  sameSite: "strict"\n});',
      },
      {
        titleKey: 'xss.react.title',
        contentKey: 'xss.react.content',
        code: '// Safe:\n<div>{userInput}</div>\n\n// Dangerous:\n<div dangerouslySetInnerHTML={{__html: userInput}} />',
      },
    ],
  },
  {
    id: 'auth-best',
    category: 'Auth',
    titleKey: 'authTitle',
    icon: 'KeyRound',
    items: [
      {
        titleKey: 'auth.hashing.title',
        contentKey: 'auth.hashing.content',
        code: 'const hash = await bcrypt.hash(password, 12);\nconst match = await bcrypt.compare(input, hash);',
      },
      {
        titleKey: 'auth.jwt.title',
        contentKey: 'auth.jwt.content',
        code: 'const token = jwt.sign(payload, secret, {\n  algorithm: "HS256",\n  expiresIn: "1h"\n});',
      },
      {
        titleKey: 'auth.ratelimit.title',
        contentKey: 'auth.ratelimit.content',
        code: 'const loginLimiter = rateLimit({\n  windowMs: 15 * 60 * 1000,\n  max: 5,\n  message: "Too many attempts"\n});',
      },
      {
        titleKey: 'auth.mfa.title',
        contentKey: 'auth.mfa.content',
        code: '// TOTP verification\nconst verified = speakeasy.totp.verify({\n  secret: user.totpSecret,\n  encoding: "base32",\n  token: userInput,\n  window: 1\n});',
      },
      {
        titleKey: 'auth.reset.title',
        contentKey: 'auth.reset.content',
        code: 'const token = crypto.randomBytes(32).toString("hex");\nconst expires = Date.now() + 3600000; // 1 hour',
      },
      {
        titleKey: 'auth.session.title',
        contentKey: 'auth.session.content',
        code: 'req.session.regenerate((err) => {\n  req.session.userId = user.id;\n});',
      },
    ],
  },
  {
    id: 'crypto-ref',
    category: 'Crypto',
    titleKey: 'cryptoTitle',
    icon: 'Lock',
    items: [
      {
        titleKey: 'crypto.hashing.title',
        contentKey: 'crypto.hashing.content',
        code: 'bcrypt.hash(password, 12); // cost 12\nargon2.hash(password, { type: argon2.argon2id });',
      },
      {
        titleKey: 'crypto.symmetric.title',
        contentKey: 'crypto.symmetric.content',
        code: 'const cipher = crypto.createCipheriv(\n  "aes-256-gcm", key, iv\n);',
      },
      {
        titleKey: 'crypto.asymmetric.title',
        contentKey: 'crypto.asymmetric.content',
        code: 'const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");',
      },
      {
        titleKey: 'crypto.signatures.title',
        contentKey: 'crypto.signatures.content',
        code: 'const signature = crypto.sign(\n  "SHA256", data, privateKey\n);',
      },
      {
        titleKey: 'crypto.tls.title',
        contentKey: 'crypto.tls.content',
        code: 'const server = https.createServer({\n  minVersion: "TLSv1.3",\n  key, cert\n}, app);',
      },
      {
        titleKey: 'crypto.random.title',
        contentKey: 'crypto.random.content',
        code: 'const token = crypto.randomBytes(32).toString("hex");\nconst salt = crypto.randomBytes(16);',
      },
    ],
  },
  {
    id: 'network-security',
    category: 'Network',
    titleKey: 'networkTitle',
    icon: 'Globe',
    items: [
      {
        titleKey: 'network.ports.title',
        contentKey: 'network.ports.content',
        code: '# Check open ports\nnmap -sS -O target.com\n# Check SSL\ntestssl.sh https://target.com',
      },
      {
        titleKey: 'network.firewall.title',
        contentKey: 'network.firewall.content',
        code: 'iptables -P INPUT DROP\niptables -P FORWARD DROP\niptables -A INPUT -p tcp --dport 443 -j ACCEPT\niptables -A INPUT -p tcp --dport 22 -j ACCEPT',
      },
      {
        titleKey: 'network.dns.title',
        contentKey: 'network.dns.content',
        code: '# Check DNSSEC\ndig +dnssec example.com\n# DoH endpoint\nhttps://cloudflare-dns.com/dns-query',
      },
      {
        titleKey: 'network.ssh.title',
        contentKey: 'network.ssh.content',
        code: '# /etc/ssh/sshd_config\nPermitRootLogin no\nPasswordAuthentication no\nPubkeyAuthentication yes\nMaxAuthTries 3',
      },
      {
        titleKey: 'network.segmentation.title',
        contentKey: 'network.segmentation.content',
        code: '# VPC Subnets:\n# Public (Web servers) — 10.0.1.0/24\n# Private (App servers) — 10.0.2.0/24\n# Data (Databases) — 10.0.3.0/24',
      },
      {
        titleKey: 'network.ids.title',
        contentKey: 'network.ids.content',
        code: '# Snort rule: detect SQLi\nalert tcp any any -> $HOME_NET 80 \\\n  (msg:"SQL Injection attempt"; \\\n  content:"SELECT"; nocase; \\\n  content:"FROM"; nocase; sid:1001;)',
      },
    ],
  },
  {
    id: 'cli-tools',
    category: 'Tools',
    titleKey: 'toolsTitle',
    icon: 'Terminal',
    items: [
      {
        titleKey: 'tools.pwhash.title',
        contentKey: 'tools.pwhash.content',
        code: "node -e \"console.log(require('bcryptjs').hashSync('password', 12))\"",
      },
      {
        titleKey: 'tools.jwtsecret.title',
        contentKey: 'tools.jwtsecret.content',
        code: "openssl rand -base64 32\n# or\nnode -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
      },
      {
        titleKey: 'tools.sslcheck.title',
        contentKey: 'tools.sslcheck.content',
        code: 'openssl s_client -connect example.com:443 -servername example.com\nopenssl x509 -noout -dates -issuer',
      },
      {
        titleKey: 'tools.jwtdecode.title',
        contentKey: 'tools.jwtdecode.content',
        code: 'echo "eyJzdWIiOiIxMjM0NTY3ODkwIn0" | base64 -d\n# or\nnode -e "console.log(Buffer.from(\'eyJzdWIiOiIxMjM0NTY3ODkwIn0\', \'base64\').toString())"',
      },
      {
        titleKey: 'tools.aes.title',
        contentKey: 'tools.aes.content',
        code: 'openssl enc -aes-256-cbc -salt -in secret.txt -out secret.enc\n# Decrypt:\nopenssl enc -aes-256-cbc -d -in secret.enc -out secret.txt',
      },
      {
        titleKey: 'tools.sshkey.title',
        contentKey: 'tools.sshkey.content',
        code: 'ssh-keygen -t ed25519 -C "user@example.com"\n# Copy to server:\nssh-copy-id user@server',
      },
    ],
  },
];

export const categoryColors: Record<string, string> = {
  OWASP: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Headers: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SQL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  XSS: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Auth: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  Crypto: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Network: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  Tools: 'bg-muted text-foreground/70 dark:bg-slate-900/30 dark:text-slate-400',
};
