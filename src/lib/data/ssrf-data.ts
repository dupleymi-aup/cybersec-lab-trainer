export interface SSRFScenario {
  id: number;
  title: string;
  description: string;
  code: string;
  vulnerability: string;
  explanation: string;
  fix: string;
  fixExplanation: string;
  options: { text: string; correct: boolean }[];
}

export const ssrfScenarios: SSRFScenario[] = [
  {
    id: 1,
    title: 'Загрузка изображения по URL',
    description: 'Функция загрузки аватара по ссылке принимает любой URL, включая внутренние адреса.',
    code: `app.post('/api/avatar/load', authenticate, (req, res) => {
  const { url } = req.body;
  // Загружаем изображение по указанному URL
  const response = await fetch(url);
  const image = await response.buffer();
  res.json({ success: true, size: image.length });
});

// Атакующий отправляет:
// {"url": "http://169.254.169.254/latest/meta-data/"}
// {"url": "http://localhost:3306"}
// {"url": "http://internal-api.company.com/secrets"}`,
    vulnerability: 'Сервер выполняет HTTP-запрос по любому URL, включая внутренние ресурсы.',
    explanation: 'SSRF позволяет атакующему заставить сервер обращаться к внутренним сервисам, которые недоступны извне. Метаданные облачных провайдеров (169.254.169.254) содержат чувствительную информацию.',
    fix: `const ALLOWED_HOSTS = ['cdn.example.com', 'avatars.example.com'];

app.post('/api/avatar/load', authenticate, async (req, res) => {
  const { url } = req.body;
  const parsed = new URL(url);
  // Проверяем, что хост разрешён
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return res.status(400).json({ error: 'Домен не разрешён' });
  }
  // Блокируем внутренние IP
  if (isInternalIP(parsed.hostname)) {
    return res.status(400).json({ error: 'Внутренние адреса запрещены' });
  }
  const response = await fetch(url);
  const image = await response.buffer();
  res.json({ success: true, size: image.length });
});`,
    fixExplanation: 'Белый список разрешённых доменов + проверка на внутренние IP-адреса.',
    options: [
      { text: 'Проверять, что URL начинается с http://', correct: false },
      { text: 'Использовать белый список разрешённых доменов и блокировать внутренние IP', correct: true },
      { text: 'Ограничить размер загружаемого файла', correct: false },
      { text: 'Использовать POST вместо GET', correct: false },
    ],
  },
  {
    id: 2,
    title: 'Вебхуки и обратные вызовы',
    description: 'Система уведомлений отправляет POST-запросы на URL, указанный пользователем.',
    code: `app.post('/api/webhooks/register', authenticate, async (req, res) => {
  const { url, events } = req.body;
  // Сохраняем вебхук
  db.saveWebhook({ userId: req.user.id, url, events });
  res.json({ success: true });
});

// При событии:
async function triggerWebhook(webhook) {
  await fetch(webhook.url, {
    method: 'POST',
    body: JSON.stringify({ event: 'order.created' }),
  });
}`,
    vulnerability: 'Пользователь может указать внутренний URL и получить данные из внутренних сервисов.',
    explanation: 'Атакующий регистрирует вебхук на http://localhost:8080/admin и получает содержимое ответа при каждом событии.',
    fix: `async function triggerWebhook(webhook) {
  const parsed = new URL(webhook.url);
  // Проверяем, что URL не внутренний
  if (isInternalIP(parsed.hostname)) {
    logSuspicious(webhook.userId, webhook.url);
    return;
  }
  // Ограничиваем протокол
  if (parsed.protocol !== 'https:') {
    return;
  }
  // Ограничиваем время ожидания
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      body: JSON.stringify({ event: 'order.created' }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}`,
    fixExplanation: 'Проверка IP, требование HTTPS, таймаут запроса.',
    options: [
      { text: 'Разрешить только HTTPS URL', correct: false },
      { text: 'Комбинация: HTTPS + проверка IP + таймаут', correct: true },
      { text: 'Ограничить количество вебхуков на пользователя', correct: false },
      { text: 'Валидировать JSON тела запроса', correct: false },
    ],
  },
  {
    id: 3,
    title: 'Proxy-эндпоинт для PDF-генерации',
    description: 'Сервис генерирует PDF из веб-страницы по заданному URL.',
    code: `app.post('/api/pdf/generate', async (req, res) => {
  const { url } = req.body;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf();
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf);
});`,
    vulnerability: 'Puppeteer загружает страницу с внутреннего сервера, раскрывая её содержимое в PDF.',
    explanation: 'Атакующий передаёт http://internal-admin-panel:3000/dashboard и получает PDF с содержимым внутренней админ-панели.',
    fix: `app.post('/api/pdf/generate', async (req, res) => {
  const { url } = req.body;
  const parsed = new URL(url);
  // Только HTTPS
  if (parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'Только HTTPS URL' });
  }
  // Блокируем внутренние IP
  if (isInternalIP(parsed.hostname)) {
    return res.status(400).json({ error: 'Внутренние адреса запрещены' });
  }
  // Ограничиваем порты
  if (parsed.port && !['80', '443'].includes(parsed.port)) {
    return res.status(400).json({ error: 'Нестандартные порты запрещены' });
  }
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
  const pdf = await page.pdf();
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf);
});`,
    fixExplanation: 'HTTPS + проверка IP + ограничение портов + таймаут.',
    options: [
      { text: 'Запретить Puppeteer', correct: false },
      { text: 'Валидировать URL: HTTPS, не внутренний IP, стандартные порты', correct: true },
      { text: 'Ограничить размер PDF', correct: false },
      { text: 'Добавить CAPTCHA', correct: false },
    ],
  },
  {
    id: 4,
    title: 'DNS Rebinding атака',
    description: 'Обход блокировки по IP через DNS rebinding.',
    code: `// Сервер проверяет IP при валидации:
function validateUrl(url) {
  const parsed = new URL(url);
  const ip = dns.lookupSync(parsed.hostname).address;
  if (isInternalIP(ip)) throw new Error('Internal IP');
  return true;
}

// Но при запросе DNS может вернуть другой IP:
// 1. Валидация: evil.com → 93.184.216.34 (OK)
// 2. Запрос:   evil.com → 127.0.0.1 (SSRF!)`,
    vulnerability: 'Проверка IP и фактический запрос — две разные DNS-резолвинг операции. TTL может истечь.',
    explanation: 'Атакующий контролирует DNS evil.com и меняет ответ между проверкой и запросом. Это называется DNS rebinding.',
    fix: `// 1. Резолвим один раз и используем тот же IP
async function safeFetch(url) {
  const parsed = new URL(url);
  const resolved = await dns.promises.lookup(parsed.hostname);
  if (isInternalIP(resolved.address)) {
    throw new Error('Internal IP detected');
  }
  // Подменяем hostname на IP (фиксируем адрес)
  parsed.hostname = resolved.address;
  // Добавляем оригинальный Host header
  return fetch(parsed.toString(), {
    headers: { Host: url.hostname },
  });
}

// 2. Или используем DNS pinning
const dnsCache = new Map();
function resolveWithPinning(hostname) {
  if (!dnsCache.has(hostname)) {
    dnsCache.set(hostname, dns.lookupSync(hostname));
  }
  return dnsCache.get(hostname);
}`,
    fixExplanation: 'DNS pinning: резолвим один раз, кэшируем результат, используем тот же IP для запроса.',
    options: [
      { text: 'Проверять IP перед каждым запросом', correct: false },
      { text: 'Резолвить DNS один раз, кэшировать и использовать тот же IP', correct: true },
      { text: 'Использовать только IP вместо доменов', correct: false },
      { text: 'Запретить DNS-резолвинг', correct: false },
    ],
  },
  {
    id: 5,
    title: 'SSRF через редиректы',
    description: 'Обход валидации URL через цепочку редиректов.',
    code: `function validateUrl(url) {
  const parsed = new URL(url);
  if (isInternalIP(dns.lookupSync(parsed.hostname).address)) {
    throw new Error('Internal IP');
  }
  return true;
}

// Атакующий:
// 1. Размещает redirect на своём сервере: http://evil.com → http://169.254.169.254
// 2. Проходит валидацию: evil.com → внешний IP ✓
// 3. fetch следует редиректу → метаданные`,
    vulnerability: 'Проверка происходит до редиректа, а fetch автоматически следует редиректам.',
    explanation: 'Даже если URL проходит валидацию, сервер может сделать редирект на внутренний адрес. Библиотеки обычно следуют редиректам автоматически.',
    fix: `async function safeFetch(url) {
  const parsed = new URL(url);
  // Проверяем начальный URL
  if (isInternalIP((await dns.promises.lookup(parsed.hostname)).address)) {
    throw new Error('Internal IP');
  }
  // Отключаем автоматические редиректы
  const response = await fetch(url, { redirect: 'manual' });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get('location');
    if (location) {
      // Проверяем редирект тоже!
      const redirectUrl = new URL(location, url);
      if (isInternalIP((await dns.promises.lookup(redirectUrl.hostname)).address)) {
        throw new Error('Redirect to internal IP blocked');
      }
    }
    // Или просто запрещаем редиректы
    throw new Error('Redirects not allowed');
  }
  return response;
}`,
    fixExplanation: 'Отключаем автоматические редиректы и проверяем каждый redirect URL.',
    options: [
      { text: 'Разрешить только один редирект', correct: false },
      { text: 'Отключить автоматические редиректы или проверять каждый redirect URL', correct: true },
      { text: 'Использовать HEAD запрос для проверки', correct: false },
      { text: 'Добавить User-Agent header', correct: false },
    ],
  },
  {
    id: 6,
    title: 'File/FTP/Gopher протоколы',
    description: 'Использование не-HTTP протоколов для SSRF.',
    code: `// Некоторые библиотеки поддерживают multiple protocols:
// file:///etc/passwd
// ftp://internal-ftp:21
// gopher://internal-service:80
// dict://cache-server:11211/stats

app.post('/api/fetch', async (req, res) => {
  const { url } = req.body;
  // curl-подобная библиотека может обработать file://
  const result = await libcurl.fetch(url);
  res.json({ data: result });
});`,
    vulnerability: 'Библиотеки с поддержкой нескольких протоколов позволяют читать файлы или обращаться к не-HTTP сервисам.',
    explanation: 'file:// позволяет читать локальные файлы, gopher:// и dict:// могут взаимодействовать с Redis, Memcached и другими сервисами.',
    fix: `app.post('/api/fetch', async (req, res) => {
  const { url } = req.body;
  const parsed = new URL(url);
  // Разрешаем только http и https
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({
      error: 'Поддерживаются только HTTP и HTTPS',
    });
  }
  // Проверка IP
  if (isInternalIP((await dns.promises.lookup(parsed.hostname)).address)) {
    return res.status(400).json({ error: 'Внутренние адреса запрещены' });
  }
  const response = await fetch(url);
  res.json({ data: await response.text() });
});`,
    fixExplanation: 'Строгая проверка протокола: только http и https.',
    options: [
      { text: 'Запретить file:// протокол', correct: false },
      { text: 'Разрешить только http: и https: протоколы', correct: true },
      { text: 'Ограничить размер ответа', correct: false },
      { text: 'Использовать sandbox', correct: false },
    ],
  },
  {
    id: 7,
    title: 'Blind SSRF — безответная атака',
    description: 'SSRF без возврата данных, но с побочными эффектами.',
    code: `// Приложение не возвращает ответ, но атакующий
// может определить существование сервиса по:
// - времени ответа (таймаут = сервис не существует)
// - DNS запросам (контролируемый DNS сервер)
// - Out-of-band каналам

app.post('/api/ping', async (req, res) => {
  const { url } = req.body;
  // Фоновая проверка доступности
  fetch(url, { method: 'HEAD' })
    .then(() => console.log('Reachable'))
    .catch(() => console.log('Unreachable'));
  res.json({ status: 'checking' });
});`,
    vulnerability: 'Даже без возврата данных SSRF можно использовать для сканирования сети и обнаружения сервисов.',
    explanation: 'Blind SSRF использует временные стороны-каналы: если сервис существует — запрос быстрый, если нет — таймаут. Также можно использовать DNS-экфильтрацию.',
    fix: `// 1. Валидация URL перед фоновым запросом
// 2. Мониторинг и rate limiting
// 3. Network segmentation
const rateLimit = new Map();

app.post('/api/ping', authenticate, async (req, res) => {
  const { url } = req.body;
  const key = req.user.id;
  // Rate limiting
  if (rateLimit.get(key) > 10) {
    return res.status(429).json({ error: 'Слишком много запросов' });
  }
  rateLimit.set(key, (rateLimit.get(key) || 0) + 1);
  setTimeout(() => rateLimit.set(key, 0), 60000);

  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ error: 'Только HTTP/HTTPS' });
  }
  if (isInternalIP((await dns.promises.lookup(parsed.hostname)).address)) {
    return res.status(400).json({ error: 'Внутренние адреса запрещены' });
  }
  // Логируем запрос для аудита
  auditLog.info({ event: 'ping', userId: key, url });
  res.json({ status: 'checking' });
});`,
    fixExplanation: 'Валидация + rate limiting + логирование для обнаружения blind SSRF.',
    options: [
      { text: 'Blind SSRF не опасен, т.к. нет данных', correct: false },
      { text: 'Blind SSRF позволяет сканировать сеть и обнаруживать сервисы', correct: true },
      { text: 'Нужно отключить все фоновые запросы', correct: false },
      { text: 'Достаточно только логирования', correct: false },
    ],
  },
];

export const ssrfDefenseMechanisms = [
  {
    title: 'Белый список доменов',
    description: 'Разрешайте только конкретные домены или IP-адреса.',
    code: `const ALLOWED_HOSTS = new Set(['api.example.com', 'cdn.example.com']);
if (!ALLOWED_HOSTS.has(parsed.hostname)) {
  throw new Error('Host not allowed');
}`,
  },
  {
    title: 'Блокировка внутренних IP',
    description: 'Проверяйте, что целевой IP не является внутренним.',
    code: `function isInternalIP(ip) {
  return ip.startsWith('10.')
    || ip.startsWith('192.168.')
    || ip.startsWith('172.16.')
    || ip.startsWith('127.')
    || ip === '0.0.0.0'
    || ip.startsWith('169.254.'); // metadata
}`,
  },
  {
    title: 'DNS Pinning',
    description: 'Резолвите DNS один раз и используйте тот же IP для запроса.',
    code: `const ip = await dns.promises.lookup(hostname);
// Фиксируем IP, подменяя hostname
urlObj.hostname = ip.address;
// Добавляем оригинальный Host header
fetch(urlObj, { headers: { Host: hostname } });`,
  },
  {
    title: 'Отключение редиректов',
    description: 'Не следуйте редиректам автоматически или проверяйте каждый.',
    code: `const response = await fetch(url, { redirect: 'manual' });
if ([301, 302, 307].includes(response.status)) {
  throw new Error('Redirects not allowed');
}`,
  },
  {
    title: 'Network сегментация',
    description: 'Изолируйте внутренние сервисы на уровне сети.',
    code: `# Docker network segmentation
services:
  web:
    networks: [frontend]
  internal-api:
    networks: [backend]
networks:
  frontend:
  backend:`,
  },
];
