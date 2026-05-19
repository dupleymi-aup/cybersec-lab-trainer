export const apiSecurityTopics = [
  {
    id: 'api-01-bola',
    title: 'API1:2023 — Broken Object Level Authorization (BOLA)',
    icon: 'Unlock',
    description: 'Самая распространённая уязвимость API. Когда API не проверяет, что пользователь имеет права на доступ к запрошенному объекту.',
    risk: 'КРИТИЧЕСКИЙ',
    riskColor: 'text-red-600 dark:text-red-400',
    riskBg: 'bg-red-100 dark:bg-red-900/30',
    content: `API1:2023 Broken Object Level Authorization (BOLA), ранее известный как IDOR для API, занимает первое место в OWASP API Security Top 10.

Уязвимость возникает, когда API-эндпоинт принимает идентификатор объекта (ID), но не проверяет, имеет ли текущий пользователь права на доступ к этому конкретному объекту.

**Пример уязвимого кода (Node.js/Express):**
\`\`\`javascript
// Уязвимый эндпоинт — нет проверки ownership
app.get('/api/orders/:orderId', async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  // Любой аутентифицированный пользователь может получить любой заказ!
  res.json(order);
});
\`\`\`

**Пример атаки:**
1. Пользователь A заходит на /api/orders/100 (свой заказ)
2. Пользователь A меняет URL на /api/orders/101
3. Сервер возвращает заказ пользователя B без проверки прав

**Правильная реализация:**
\`\`\`javascript
// Безопасный эндпоинт — проверка ownership
app.get('/api/orders/:orderId', authenticate, async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Not found' });
  
  // Проверяем, что заказ принадлежит текущему пользователю
  if (order.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.json(order);
});
\`\`\`

**Меры защиты:**
• Всегда проверяйте ownership объекта перед возвратом данных
• Используйте middleware авторизации для каждого эндпоинта
• Применяйте GUID/UUID вместо sequential ID для усложнения угадывания
• Реализуйте принцип «deny by default» — запрещать всё, явно разрешать необходимое
• Автоматизированные тесты на BOLA для каждого нового эндпоинта`,
    codeExample: `// Middleware для проверки BOLA
function checkOwnership(model) {
  return async (req, res, next) => {
    const resource = await model.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Not found' });
    if (resource.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.resource = resource;
    next();
  };
}

// Использование
app.get('/api/orders/:id', authenticate, checkOwnership(Order), (req, res) => {
  res.json(req.resource);
});`,
  },
  {
    id: 'api-02-bfla',
    title: 'API2:2023 — Broken Function Level Authorization (BFLA)',
    icon: 'ShieldOff',
    description: 'Когда API позволяет пользователям выполнять функции, которые им не разрешены — например, обычные пользователи получают доступ к административным функциям.',
    risk: 'ВЫСОКИЙ',
    riskColor: 'text-orange-600 dark:text-orange-400',
    riskBg: 'bg-orange-100 dark:bg-orange-900/30',
    content: `API2:2023 Broken Function Level Authorization возникает, когда API не корректно проверяет права пользователя на выполнение конкретных операций.

**Типичные сценарии:**
• Обычный пользователь вызывает DELETE /api/users/5 (административная функция)
• Пользователь меняет HTTP-метод с GET на DELETE
• Пользователь обращается к скрытому эндпоинту /api/admin/export

**Пример уязвимости:**
\`\`\`javascript
// Эндпоинт удаления пользователя — нет проверки роли
app.delete('/api/users/:id', authenticate, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
});
\`\`\`

**Правильная реализация:**
\`\`\`javascript
app.delete('/api/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  await user.deleteOne();
  res.json({ message: 'User deleted' });
});

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient privileges' });
    }
    next();
  };
}
\`\`\`

**Меры защиты:**
• Не полагайтесь на скрытие эндпоинтов из UI (security through obscurity)
• Реализуйте RBAC/ABAC middleware для каждого эндпоинта
• Запретите доступ по умолчанию, явно разрешайте для ролей
• Регистрируйте все попытки доступа к административным функциям
• Регулярно аудиторите API-маршруты на наличие BFLA`,
    codeExample: `// RBAC middleware
const ROLES = {
  admin: ['read', 'write', 'delete', 'manage'],
  editor: ['read', 'write'],
  viewer: ['read'],
};

function requirePermission(permission) {
  return (req, res, next) => {
    const userPerms = ROLES[req.user.role] || [];
    if (!userPerms.includes(permission)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    next();
  };
}

app.delete('/api/posts/:id', authenticate, requirePermission('delete'), handler);`,
  },
  {
    id: 'api-03-bola-params',
    title: 'API3:2023 — Broken Object Property Level Authorization',
    icon: 'EyeOff',
    description: 'Уязвимость, при которой пользователь может прочитать или изменить свойства объекта, к которым не должен иметь доступа.',
    risk: 'ВЫСОКИЙ',
    riskColor: 'text-orange-600 dark:text-orange-400',
    riskBg: 'bg-orange-100 dark:bg-orange-900/30',
    content: `API3:2023 — новая категория в OWASP API Security Top 10 2023 года. Это более тонкая версия BOLA, когда пользователь имеет доступ к объекту, но может читать или изменять отдельные поля, которые ему не принадлежат.

**Пример:** Пользователь может обновлять свой профиль, но через API также изменяет свою роль, баланс или email другого пользователя.

**Mass Assignment уязвимость:**
\`\`\`javascript
// Уязвимость: пользователь может изменить любую роль
app.put('/api/users/:id/profile', authenticate, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  // req.body может содержать { role: "admin", balance: 999999 }!
  res.json(user);
});
\`\`\`

**Правильная реализация:**
\`\`\`javascript
app.put('/api/users/:id/profile', authenticate, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  
  // Разрешаем обновлять только определённые поля
  const allowedFields = ['name', 'bio', 'avatar', 'phone'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  
  Object.assign(user, updates);
  await user.save();
  res.json(user);
});
\`\`\`

**Меры защиты:**
• Определяйте явные allowlist-поля для каждого эндпоинта
• Никогда не передавайте req.body напрямую в ORM/DB
• Используйте DTO (Data Transfer Objects) для сериализации ответов
• Скрывайте чувствительные поля (role, balance, isAdmin) из API-ответов
• Реализуйте разные схемы для read/write операций`,
    codeExample: `// DTO для сериализации ответа
function sanitizeUser(user) {
  const { password, salt, __v, ...safe } = user.toObject();
  return safe; // Без пароля, соли и внутренних полей
}

// Схема для разных ролей
function getUserResponse(user, requester) {
  const base = sanitizeUser(user);
  if (requester.role !== 'admin') {
    delete base.email;
    delete base.phone;
    delete base.lastLogin;
  }
  return base;
}`,
  },
  {
    id: 'api-04-unrestricted',
    title: 'API4:2023 — Unrestricted Resource Consumption',
    icon: 'Gauge',
    description: 'Отсутствие ограничений на количество, частоту или объём запросов к API, что приводит к DoS, брутфорсу и excessive data exposure.',
    risk: 'ВЫСОКИЙ',
    riskColor: 'text-orange-600 dark:text-orange-400',
    riskBg: 'bg-orange-100 dark:bg-orange-900/30',
    content: `API4:2023 — уязвимость, при которой API не ограничивает потребление ресурсов: количество запросов, объём данных, сложность операций.

**Типы ограничений, которые должны быть:**

**1. Rate Limiting (ограничение частоты):**
\`\`\`javascript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // 5 попыток
  message: { error: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/auth/login', loginLimiter, handleLogin);
\`\`\`

**2. Payload Limiting:**
\`\`\`javascript
app.use(express.json({ limit: '1mb' })); // Ограничение размера body
\`\`\`

**3. Pagination Limiting:**
\`\`\`javascript
// Уязвимость: пользователь запрашивает ?limit=1000000
app.get('/api/users', async (req, res) => {
  const users = await User.find().limit(req.query.limit);
  // Может вернуть ВСЕХ пользователей!
});

// Безопасная реализация:
app.get('/api/users', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const skip = (page - 1) * limit;
  const users = await User.find().skip(skip).limit(limit);
  res.json(users);
});
\`\`\`

**Меры защиты:**
• Rate limiting для всех эндпоинтов (особенно auth, registration, password reset)
• Ограничение размера запросов (body size limit)
• Максимальный лимит пагинации (max 100 записей)
• Timeout на длительные операции
• Quota management для API-ключей`,
    codeExample: `// Комплексная защита от unrestricted consumption
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?.id || req.ip,
});

// GraphQL depth limiting
import depthLimit from 'graphql-depth-limit';
const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(10)], // Максимальная глубина запроса
});

// File upload limits
app.post('/api/upload',
  authenticate,
  multer({
    limits: { fileSize: 5 * 1024 * 1024, files: 3 },
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
      cb(null, allowed.includes(file.mimetype));
    }
  }).single('file'),
  handleUpload
);`,
  },
  {
    id: 'api-05-bfla-auth',
    title: 'API5:2023 — Broken Access Control',
    icon: 'TriangleAlert',
    description: 'Обобщённая категория, включающая проблемы CORS, отсутствие авторизации, неверная конфигурация JWT и небезопасные прямые ссылки.',
    risk: 'КРИТИЧЕСКИЙ',
    riskColor: 'text-red-600 dark:text-red-400',
    riskBg: 'bg-red-100 dark:bg-red-900/30',
    content: `API5:2023 — объединяет различные проблемы контроля доступа, которые не вошли в другие категории.

**1. Небезопасная CORS конфигурация:**
\`\`\`javascript
// ОПАСНО: разрешает запросы от любого домена
app.use(cors({
  origin: '*',
  credentials: true,
}));

// Безопасно: конкретные разрешённые домены
app.use(cors({
  origin: ['https://myapp.com', 'https://admin.myapp.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
\`\`\`

**2. JWT без верификации алгоритма:**
\`\`\`javascript
// ОПАСНО: accepting algorithm: none
const token = jwt.verify(payload, secret);

// Безопасно: явно указываем алгоритм
const token = jwt.verify(payload, secret, { algorithms: ['HS256'] });
\`\`\`

**3. Отсутствующая авторизация на новых эндпоинтах:**
• Новые эндпоинты по умолчанию должны требовать аутентификацию
• Используйте middleware, которые применяются глобально
• Тестируйте каждый эндпоинт без токена — должен быть 401

**Меры защиты:**
• Глобальный auth middleware для всех API-маршрутов
• Явная whitelist разрешённых CORS origin
• JWT: always verify signature, check exp, reject algorithm: none
• Регулярный аудит новых эндпоинтов на наличие авторизации
• API-шлюз для централизованного контроля доступа`,
    codeExample: `// Глобальная защита API
app.use('/api', (req, res, next) => {
  // CORS для всех API
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  next();
});

// Глобальный auth middleware (кроме public-эндпоинтов)
const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/health'];
app.use('/api', (req, res, next) => {
  if (publicRoutes.includes(req.path)) return next();
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});`,
  },
  {
    id: 'api-06-mass-assignment',
    title: 'API6:2023 — Unrestricted Access to Sensitive Business Flows',
    icon: 'ShoppingCart',
    description: 'API позволяет автоматизировать бизнес-процессы, которые должны выполняться вручную — например, массовая покупка, скрапинг цен, бот-регистрация.',
    risk: 'СРЕДНИЙ',
    riskColor: 'text-yellow-600 dark:text-yellow-400',
    riskBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    content: `API6:2023 — уязвимость, при которой API позволяет автоматизировать и злоупотреблять бизнес-процессами, которые были предназначены для ручного использования.

**Примеры злоупотреблений:**

**1. Scalping / Bot Purchase:**
Бот автоматически покупает лимитированные товары быстрее людей.

**2. Price Scraping:**
Автоматический сбор конкурентных данных через API.

**3. Fake Registration:**
Массовая регистрация фейковых аккаунтов для spam/review manipulation.

**4. Coupon Abuse:**
Автоматическое применение промокодов множественными способами.

**Защита:**
\`\`\`javascript
// Rate limiting для бизнес-процессов
const purchaseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 3, // 3 покупки в час
  message: { error: 'Purchase limit exceeded' },
});

// CAPTCHA для критических операций
app.post('/api/purchase', authenticate, purchaseLimiter, async (req, res) => {
  const { captchaToken, ...orderData } = req.body;
  const verified = await verifyCaptcha(captchaToken);
  if (!verified) return res.status(400).json({ error: 'CAPTCHA failed' });
  // ... обработка заказа
});
\`\`\`

**Меры защиты:**
• CAPTCHA / reCAPTCHA для критических бизнес-операций
• Rate limiting на пользовательском уровне
• Anti-bot detection (fingerprinting, behavior analysis)
• Device fingerprinting для обнаружения множественных аккаунтов
• Мониторинг аномальных паттернов использования`,
    codeExample: `// Anti-automation middleware
async function antiBotCheck(req, res, next) {
  const { ip, headers } = req;
  
  // Проверка fingerprint
  const fingerprint = generateFingerprint(headers);
  const recentRequests = await getRecentRequests(fingerprint, '1h');
  
  if (recentRequests > 50) {
    return res.status(429).json({
      error: 'Too many requests. Please complete CAPTCHA.',
      captchaRequired: true,
    });
  }
  
  // Проверка поведенческих паттернов
  const isBot = await analyzeBehavior(req);
  if (isBot) {
    await logSuspiciousActivity(ip, fingerprint);
    return res.status(403).json({ error: 'Request blocked' });
  }
  
  next();
}`,
  },
  {
    id: 'api-07-ssrf',
    title: 'API7:2023 — Server Side Request Forgery (SSRF)',
    icon: 'Globe',
    description: 'Когда API принимает URL от пользователя и делает запрос к нему без должной валидации, что позволяет получить доступ к внутренним ресурсам.',
    risk: 'КРИТИЧЕСКИЙ',
    riskColor: 'text-red-600 dark:text-red-400',
    riskBg: 'bg-red-100 dark:bg-red-900/30',
    content: `API7:2023 SSRF — одна из самых опасных уязвимостей API, особенно в облачных средах.

**Типичный сценарий:**
API принимает URL для загрузки изображения, преобразования PDF или webhook callback.

**Уязвимый код:**
\`\`\`javascript
app.post('/api/fetch-url', authenticate, async (req, res) => {
  const { url } = req.body;
  // Злоумышленник отправляет: http://169.254.169.254/latest/meta-data/iam/security-credentials/
  const response = await fetch(url);
  const data = await response.text();
  res.json({ content: data });
});
\`\`\`

**Обход простой чёрной списка:**
\`\`\`javascript
// Чёрный список — легко обойти
const blocked = ['localhost', '127.0.0.1', '169.254.169.254'];
if (blocked.some(b => url.includes(b))) return res.status(400).json({ error: 'Blocked' });

// Обход через:
// - http://0.0.0.0 → 127.0.0.1
// - http://2130706433 → 127.0.0.1 (decimal IP)
// - http://127.0.0.1.nip.io → DNS rebinding
// - http://[::1] → IPv6 localhost
\`\`\`

**Безопасная реализация:**
\`\`\`javascript
import { URL } from 'url';
import dns from 'dns';

app.post('/api/fetch-url', authenticate, async (req, res) => {
  const { url } = req.body;
  
  // 1. Парсим URL
  const parsed = new URL(url);
  
  // 2. Разрешаем только HTTP/HTTPS
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ error: 'Invalid protocol' });
  }
  
  // 3. Разрешаем только конкретный домен (allowlist)
  if (parsed.hostname !== 'api.trusted-service.com') {
    return res.status(400).json({ error: 'Domain not allowed' });
  }
  
  // 4. Для внешних URL: DNS resolution + IP check
  const addresses = await dns.promises.lookup(parsed.hostname);
  if (isPrivateIP(addresses.address)) {
    return res.status(400).json({ error: 'Private IP not allowed' });
  }
  
  const response = await fetch(url, { timeout: 5000 });
  res.json({ content: await response.text() });
});
\`\`\`

**Меры защиты:**
• Allowlist доменов вместо blacklist IP
• DNS resolution + проверка IP после resolution
• Блокировка всех приватных IP диапазонов (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
• Отключение редиректов или валидация URL после каждого редиректа
• Сетевая сегментация: API-серверы не должны иметь доступ к internal network`,
    codeExample: `// Проверка приватного IP
function isPrivateIP(ip) {
  const parts = ip.split('.').map(Number);
  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 127.0.0.0/8 (loopback)
  if (parts[0] === 127) return true;
  // 169.254.0.0/16 (link-local, cloud metadata)
  if (parts[0] === 169 && parts[1] === 254) return true;
  // 0.0.0.0
  if (ip === '0.0.0.0') return true;
  return false;
}

// Safe URL fetcher with redirect handling
async function safeFetch(url, maxRedirects = 0) {
  const response = await fetch(url, { redirect: 'manual' });
  if ([301, 302, 303, 307, 308].includes(response.status) && maxRedirects > 0) {
    const location = response.headers.get('location');
    if (!location) throw new Error('Redirect without location');
    // Validate redirect URL
    const parsed = new URL(location, url);
    if (isPrivateIP(await dns.promises.lookup(parsed.hostname))) {
      throw new Error('Redirect to private IP blocked');
    }
    return safeFetch(location, maxRedirects - 1);
  }
  return response;
}`,
  },
  {
    id: 'api-08-security-misconfig',
    title: 'API8:2023 — Security Misconfiguration',
    icon: 'Settings',
    description: 'Небезопасные конфигурации API: отсутствие HTTPS, verbose error messages, включённый debug mode, открытые S3 buckets, отсутствие security headers.',
    risk: 'ВЫСОКИЙ',
    riskColor: 'text-orange-600 dark:text-orange-400',
    riskBg: 'bg-orange-100 dark:bg-orange-900/30',
    content: `API8:2023 — небезопасные конфигурации, которые делают API уязвимым даже при корректном коде.

**Частые проблемы:**

**1. Verbose Error Messages:**
\`\`\`javascript
// ОПАСНО: раскрывает стек-трейс и внутреннюю информацию
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack,
    query: req.query,
    db: process.env.DB_CONNECTION_STRING, // Секрет в ошибке!
  });
});

// Безопасно:
app.use((err, req, res, next) => {
  console.error('Internal error:', err); // Логируем для разработчиков
  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.id, // Для поддержки
  });
});
\`\`\`

**2. Отсутствие Security Headers:**
\`\`\`javascript
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.removeHeader('X-Powered-By'); // Скрываем технологию
  next();
});
\`\`\`

**3. Debug Mode в Production:**
\`\`\`javascript
// Убедитесь, что DEBUG=false в production
if (process.env.DEBUG === 'true') {
  app.use(morgan('dev')); // Detailed logging
  app.use(expressDebugger());
}
\`\`\`

**Чеклист безопасной конфигурации:**
• ✅ HTTPS/TLS для всех эндпоинтов
• ✅ Отключение verbose error messages в production
• ✅ Удаление X-Powered-By заголовка
• ✅ Security headers (HSTS, CSP, X-Frame-Options)
• ✅ Отключение неиспользуемых HTTP-методов (TRACE, OPTIONS)
• ✅ Регулярное обновление зависимостей
• ✅ Безопасная конфигурация CORS
• ✅ Secrets management (не в коде!)`,
    codeExample: `// Production-ready error handler
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = 'Internal Server Error';
  
  // Known operational errors
  if (err.isOperational) {
    message = err.message;
  } else {
    // Log unexpected errors for investigation
    console.error('Unexpected error:', err);
    if (process.env.NODE_ENV === 'production') {
      message = 'Internal Server Error';
    } else {
      message = err.message;
    }
  }
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});`,
  },
  {
    id: 'api-09-inventory',
    title: 'API9:2023 — Improper Inventory Management',
    icon: 'ClipboardList',
    description: 'Неучтённые API-эндпоинты: старые версии API, забытые debug-эндпоинты, документированные но незащищённые эндпоинты, shadow API.',
    risk: 'СРЕДНИЙ',
    riskColor: 'text-yellow-600 dark:text-yellow-400',
    riskBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    content: `API9:2023 — проблемы, связанные с отсутствием полного учёта всех API-эндпоинтов и их версий.

**Типичные проблемы:**

**1. Zombie API (забытые эндпоинты):**
\`\`\`
/api/v1/users      — старая версия, без MFA, без rate limiting
/api/v2/users      — текущая версия
/api/v3/users      — новая версия в beta
/debug/dump        — забытый debug-эндпоинт
/api/test          — тестовый эндпоинт в production
\`\`\`

**2. Shadow API (недокументированные эндпоинты):**
• Эндпоинты, созданные разработчиками без ведома security-команды
• Отсутствуют в документации и OpenAPI спецификации
• Не проходят security review

**3. Deprecated API без отключения:**
\`\`\`javascript
// Старая версия с известными уязвимостями
app.use('/api/v1', oldRouter); // Должно быть отключено!

// Правильный подход: sunset header
app.use('/api/v1', (req, res, next) => {
  res.setHeader('Sunset', '2024-01-01T00:00:00Z');
  res.setHeader('Deprecation', 'true');
  res.setHeader('Link', '</api/v2>; rel="successor-version"');
  next();
});
\`\`\`

**Меры защиты:**
• Ведите полный реестр всех API-эндпоинтов
• Используйте OpenAPI/Swagger спецификацию как единственный источник истины
• Автоматически обнаруживайте эндпоинты через сканирование
• Отключайте старые версии API после миграции
• Регулярно аудиторите все эндпоинты на безопасность
• Мониторьте трафик к неизвестным эндпоинтам
• Используйте API Gateway для централизованного управления`,
    codeExample: `// API Discovery & Inventory Script
const express = require('express');

// Автоматическая документация всех зарегистрированных маршрутов
function generateAPIInventory(app) {
  const routes = [];
  
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        method: middleware.route.method.toUpperCase(),
        path: middleware.route.path,
      });
    }
    if (middleware.name === 'router') {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push({
            method: handler.route.method.toUpperCase(),
            path: middleware.regexp.source + handler.route.path,
          });
        }
      });
    }
  });
  
  return routes;
}

// Сравнение с OpenAPI спецификацией
async function auditAPI(spec, actualRoutes) {
  const specPaths = extractPaths(spec);
  const undocumented = actualRoutes.filter(r => !specPaths.includes(r.path));
  const missing = specPaths.filter(p => !actualRoutes.find(r => r.path.includes(p)));
  
  return {
    undocumented, // Shadow API
    missing,      // Задокументированы, но не реализованы
    total: actualRoutes.length,
  };
}`,
  },
  {
    id: 'api-10-logging',
    title: 'API10:2023 — Unsafe API Consumption',
    icon: 'FileWarning',
    description: 'Небезопасное использование API клиентами: хранение секретов на клиенте, отсутствие TLS pinning, excessive permissions в OAuth, логи с секретами.',
    risk: 'СРЕДНИЙ',
    riskColor: 'text-yellow-600 dark:text-yellow-400',
    riskBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    content: `API10:2023 — проблемы, возникающие когда клиенты (frontend, мобильные приложения, сторонние интеграции) небезопасно используют API.

**Частые проблемы:**

**1. Хардкод API-ключей на клиенте:**
\`\`\`javascript
// ОПАСНО: API-ключ виден в исходном коде
const API_KEY = 'sk-1234567890abcdef';
const response = await fetch('/api/data', {
  headers: { 'X-API-Key': API_KEY },
});

// Безопасно: серверный прокси
// Клиент → Ваш сервер → Внешний API
app.get('/api/proxy/external', authenticate, async (req, res) => {
  const response = await fetch('https://external-api.com/data', {
    headers: { 'Authorization': \`Bearer \${process.env.EXTERNAL_API_KEY}\` },
  });
  res.json(await response.json());
});
\`\`\`

**2. Отсутствие TLS Pinning (мобильные приложения):**
\`\`\`swift
// iOS: Certificate Pinning
let pinningValidator = SSLPinningValidator(
  certificates: [loadCertificate("api.myapp.com")]
)
session.delegate = pinningValidator
\`\`\`

**3. Excessive OAuth Permissions:**
\`\`\`javascript
// ОПАСНО: запрос всех разрешений
const authUrl = \`https://provider.com/oauth/authorize?\` +
  \`client_id=\${clientId}&\` +
  \`scope=read:users write:users delete:users admin&\` +  // Слишком много!
  \`response_type=code\`;

// Безопасно: minimum necessary scope
const authUrl = \`https://provider.com/oauth/authorize?\` +
  \`client_id=\${clientId}&\` +
  \`scope=read:profile write:profile&\` +  // Только необходимое
  \`response_type=code\`;
\`\`\`

**4. Секреты в логах:**
\`\`\`javascript
// ОПАСНО: логирование токенов
console.log('API call:', { url, headers: { Authorization: token }, body });

// Безопасно: masking
function maskSecrets(obj) {
  const sensitive = ['authorization', 'api-key', 'token', 'password'];
  const masked = { ...obj };
  for (const key of sensitive) {
    if (masked[key]) masked[key] = '***REDACTED***';
  }
  return masked;
}
\`\`\`

**Меры защиты:**
• Никогда не храните секреты в клиентском коде
• Используйте серверные прокси для внешних API
• TLS certificate pinning для мобильных приложений
• Минимальные OAuth scope
• Маскируйте секреты в логах
• Используйте короткоживущие токены с refresh`,
    codeExample: `// Безопасный API-клиент (frontend)
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = null; // Token from httpOnly cookie, not localStorage
  }

  async request(endpoint, options = {}) {
    const response = await fetch(\`\${this.baseURL}\${endpoint}\`, {
      ...options,
      credentials: 'include', // Sends httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired — redirect to login
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    return response.json();
  }
}

// Rate limiting on client side to prevent abuse
class RateLimitedClient extends APIClient {
  constructor(baseURL, maxRequests = 10, windowMs = 60000) {
    super(baseURL);
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async request(endpoint, options) {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);
    if (this.requests.length >= this.maxRequests) {
      throw new Error('Rate limit exceeded. Please wait.');
    }
    this.requests.push(now);
    return super.request(endpoint, options);
  }
}`,
  },
];
