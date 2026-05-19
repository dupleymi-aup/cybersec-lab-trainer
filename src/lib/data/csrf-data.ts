// ============================================================
// CSRF Attack Data — Educational Content
// ============================================================

export const attackSteps = [
  {
    id: 1,
    title: 'Вход в банковское приложение',
    description: 'Пользователь заходит на bank.com и успешно проходит аутентификацию. Сервер устанавливает сессионную куку в браузер.',
    detail: 'Set-Cookie: session_id=abc123; Domain=bank.com; Path=/',
    icon: 'Globe',
    color: 'border-emerald-300 bg-emerald-50',
  },
  {
    id: 2,
    title: 'Посещение вредоносного сайта',
    description: 'Пользователь переходит на evil.com, который содержит скрытую HTML-форму, автоматически отправляющую запрос к bank.com.',
    detail: 'На evil.com загружается страница с невидимой формой, JavaScript автоматически отправляет POST-запрос.',
    icon: 'AlertTriangle',
    color: 'border-amber-300 bg-amber-50',
  },
  {
    id: 3,
    title: 'Автоматическая отправка запроса',
    description: 'Скрытая форма на evil.com автоматически отправляет POST-запрос к bank.com/transfer с параметрами перевода.',
    detail: 'POST /transfer HTTP/1.1\nHost: bank.com\nCookie: session_id=abc123\n\namount=10000&to=attacker_account',
    icon: 'Server',
    color: 'border-orange-300 bg-orange-50',
  },
  {
    id: 4,
    title: 'Банк обрабатывает запрос',
    description: 'Банк получает запрос с корректной сессионной кукой и выполняет перевод. Сервер не может отличить этот запрос от легитимного действия пользователя.',
    detail: 'Сервер проверяет session_id → cookie валиден → выполняет перевод. Деньги переведены злоумышленнику!',
    icon: 'AlertTriangle',
    color: 'border-red-300 bg-red-50',
  },
];

export const defenseMechanisms = [
  {
    title: 'CSRF-токены (Anti-CSRF Tokens)',
    description: 'Сервер генерирует уникальный случайный токен для каждой формы и сохраняет его в сессии. При отправке формы токен проверяется на сервере. Злоумышленник не может получить токен из-за Same-Origin Policy.',
    code: `// Генерация CSRF-токена
app.use(csrf({ cookie: true }));

// В форме
<form action="/transfer" method="POST">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  <input name="amount" type="number">
  <button type="submit">Перевести</button>
</form>`,
  },
  {
    title: 'SameSite Cookie Attribute',
    description: 'Атрибут SameSite контролирует, когда куки отправляются с кросс-сайтовыми запросами. SameSite=Strict полностью блокирует, SameSite=Lax разрешает только навигационные GET-запросы.',
    code: `// Настройка куки с SameSite
Set-Cookie: session_id=abc123;
  SameSite=Strict;
  Secure;
  HttpOnly

// Express.js
app.use(session({
  cookie: {
    sameSite: 'strict',
    secure: true,
    httpOnly: true
  }
}));`,
  },
  {
    title: 'Проверка Referer / Origin',
    description: 'Сервер проверяет заголовок Referer или Origin входящего запроса. Если запрос приходит не с собственного домена — он отклоняется.',
    code: `// Проверка Origin заголовка
app.post('/transfer', (req, res) => {
  const origin = req.headers.origin;
  if (origin !== 'https://bank.com') {
    return res.status(403).json({
      error: 'CSRF: неверный Origin'
    });
  }
  // Обработка перевода...
});`,
  },
  {
    title: 'Double-Submit Cookie Pattern',
    description: 'CSRF-токен дублируется в куки и в теле запроса. Сервер сравнивает их — если они совпадают, запрос легитимный. Злоумышленник не может прочитать куки с другого домена.',
    code: `// Сервер генерирует CSRF-токен в куки
res.cookie('csrf_token', randomToken, {
  httpOnly: false, // JavaScript должен читать
  sameSite: 'strict',
  secure: true
});

// Клиент читает токен из куки и отправляет в заголовке
fetch('/api/transfer', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': getCookie('csrf_token'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ amount: 1000, to: 'account123' })
});

// Сервер сравнивает
app.post('/api/transfer', (req, res) => {
  const cookieToken = req.cookies.csrf_token;
  const headerToken = req.headers['x-csrf-token'];
  if (cookieToken !== headerToken) {
    return res.status(403).json({ error: 'CSRF mismatch' });
  }
});`,
  },
  {
    title: 'Custom Headers с CORS preflight',
    description: 'Использование кастомных заголовков (например, X-Requested-With) вызывает CORS preflight-запрос. Браузер блокирует кросс-доменные запросы с кастомными заголовками без явного разрешения сервера.',
    code: `// Клиент: кастомный заголовок
fetch('/api/transfer', {
  method: 'POST',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ amount: 1000 })
});

// Браузер отправляет OPTIONS preflight:
// OPTIONS /api/transfer
// Origin: https://evil.com
// Access-Control-Request-Method: POST
// Access-Control-Request-Headers: X-Requested-With

// Сервер отвечает (если evil.com не в whitelist):
// HTTP/1.1 403 Forbidden
// Нет CORS заголовков → браузер блокирует запрос

// Express CORS:
app.use(cors({
  origin: ['https://bank.com'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Requested-With']
}));`,
  },
];
