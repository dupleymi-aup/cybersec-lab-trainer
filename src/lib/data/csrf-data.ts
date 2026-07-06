// ============================================================
// CSRF Attack Data — Educational Content
// ============================================================

export const attackSteps = [
  {
    id: 1,
    title: 'Вход в банковское приложение',
    description:
      'Пользователь заходит на bank.com и успешно проходит аутентификацию. Сервер устанавливает сессионную куку в браузер.',
    detail: 'Set-Cookie: session_id=abc123; Domain=bank.com; Path=/',
    icon: 'Globe',
    color: 'border-emerald-300 bg-emerald-50',
  },
  {
    id: 2,
    title: 'Посещение вредоносного сайта',
    description:
      'Пользователь переходит на evil.com, который содержит скрытую HTML-форму, автоматически отправляющую запрос к bank.com.',
    detail: 'На evil.com загружается страница с невидимой формой, JavaScript автоматически отправляет POST-запрос.',
    icon: 'AlertTriangle',
    color: 'border-amber-300 bg-amber-50',
  },
  {
    id: 3,
    title: 'Автоматическая отправка запроса',
    description:
      'Скрытая форма на evil.com автоматически отправляет POST-запрос к bank.com/transfer с параметрами перевода.',
    detail: 'POST /transfer HTTP/1.1\nHost: bank.com\nCookie: session_id=abc123\n\namount=10000&to=attacker_account',
    icon: 'Server',
    color: 'border-orange-300 bg-orange-50',
  },
  {
    id: 4,
    title: 'Банк обрабатывает запрос',
    description:
      'Банк получает запрос с корректной сессионной кукой и выполняет перевод. Сервер не может отличить этот запрос от легитимного действия пользователя.',
    detail: 'Сервер проверяет session_id → cookie валиден → выполняет перевод. Деньги переведены злоумышленнику!',
    icon: 'AlertTriangle',
    color: 'border-red-300 bg-red-50',
  },
];

export const defenseMechanisms = [
  {
    title: 'CSRF-токены (Anti-CSRF Tokens)',
    description:
      'Сервер генерирует уникальный случайный токен для каждой формы и сохраняет его в сессии. При отправке формы токен проверяется на сервере. Злоумышленник не может получить токен из-за Same-Origin Policy.',
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
    description:
      'Атрибут SameSite контролирует, когда куки отправляются с кросс-сайтовыми запросами. SameSite=Strict полностью блокирует, SameSite=Lax разрешает только навигационные GET-запросы.',
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
    description:
      'Сервер проверяет заголовок Referer или Origin входящего запроса. Если запрос приходит не с собственного домена — он отклоняется.',
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
    description:
      'CSRF-токен дублируется в куки и в теле запроса. Сервер сравнивает их — если они совпадают, запрос легитимный. Злоумышленник не может прочитать куки с другого домена.',
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
    description:
      'Использование кастомных заголовков (например, X-Requested-With) вызывает CORS preflight-запрос. Браузер блокирует кросс-доменные запросы с кастомными заголовками без явного разрешения сервера.',
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

// ============================================================
// Interactive Challenge Scenarios
// ============================================================

export const csrfChallenges = [
  {
    id: 1,
    title: 'Найди уязвимость: Форма перевода денег',
    description: 'Перед вами код формы банковского перевода. Найдите проблему и выберите правильное решение.',
    code: `<form action="/transfer" method="POST">
  <label>Сумма:</label>
  <input type="number" name="amount">
  <label>Получатель:</label>
  <input type="text" name="to">
  <button type="submit">Перевести</button>
</form>

// Server route
app.post('/transfer', (req, res) => {
  const session = req.session;
  if (!session.userId) return res.redirect('/login');
  db.execute(
    'UPDATE accounts SET balance = balance - ? WHERE id = ?',
    [req.body.amount, session.userId]
  );
});`,
    question: 'Какая уязвимость присутствует в этом коде?',
    options: [
      'SQL-инъекция в запросе UPDATE',
      'Отсутствует CSRF-токен — любой сайт может отправить запрос от имени пользователя',
      'XSS через поле "amount"',
      'Уязвимость отсутствует — есть проверка сессии',
    ],
    correctIndex: 1,
    explanation:
      'Хотя сервер проверяет session.userId, нет защиты от CSRF. Злоумышленник может создать форму на своём сайте, и при посещении её пользователем (у которого уже есть сессия bank.com) перевод будет выполнен. Браузер автоматически отправит куки bank.com с запросом.',
  },
  {
    id: 2,
    title: 'Выбери защиту: Email с кнопкой',
    description:
      'Пользователь получил email от «банка» с кнопкой «Подтвердить вход». При нажатии она автоматически отправляет POST-запрос к bank.com/login-confirm.',
    question: 'Какой механизм защиты лучше всего предотвратит эту атаку?',
    options: [
      'Проверка длины пароля на сервере',
      'CSRF-токен в форме + SameSite=Strict для кук',
      'Rate limiting на /login-confirm',
      'HTTPS-сертификат для bank.com',
    ],
    correctIndex: 1,
    explanation:
      'CSRF-токен не позволит злоумышленнику создать рабочую форму (он не знает токен), а SameSite=Strict заблокирует отправку кук с кросс-сайтового запроса из email клиента.',
  },
  {
    id: 3,
    title: 'Code Review: API изменение профиля',
    description: 'Проанализируйте код API-эндпоинта изменения профиля.',
    code: `// PUT /api/profile
app.put('/api/profile', authenticate, (req, res) => {
  // authenticate проверяет JWT из Authorization header
  const user = req.user;
  db.users.update(user.id, {
    email: req.body.email,
    phone: req.body.phone
  });
  res.json({ ok: true });
});`,
    question: 'Защищён ли этот эндпоинт от CSRF?',
    options: [
      'Нет, нужен CSRF-токен',
      'Да, потому что используется кастомный заголовок Authorization, браузер не может отправить его кросс-доменно без CORS preflight',
      'Нет, нужна проверка Referer',
      'Да, потому что есть middleware authenticate',
    ],
    correctIndex: 1,
    explanation:
      'Эндпоинт использует кастомный заголовок Authorization (через JWT). Браузер не может автоматически добавить этот заголовок в кросс-доменный запрос без CORS preflight. Это один из способов защиты от CSRF — использование кастомных заголовков вместо кук.',
  },
  {
    id: 4,
    title: 'Реальный сценарий: Изменение пароля',
    description:
      'Злоумышленник разместил на evil.com страницу с изображением: <img src="https://bank.com/change-password?new=Hacked123">. Что произойдёт?',
    question: 'Сработает ли эта атака в типичном веб-приложении?',
    options: [
      'Да, потому что <img> тег автоматически делает GET-запрос с куками',
      'Да, но только если банк использует GET для смены пароля (что неправильно)',
      'Нет, потому что <img> не может отправлять POST-запросы',
      'Да, но только если у злоумышленника есть CSRF-токен',
    ],
    correctIndex: 1,
    explanation:
      'Атака сработает ТОЛЬКО если банк использует GET-запрос для смены пароля — это нарушение HTTP-спецификации (GET должен быть идемпотентным). Правильно реализованный банк использует POST/PUT с CSRF-токеном. Тег <img> делает GET-запрос, но не POST.',
  },
  {
    id: 5,
    title: 'Практика: Исправь код',
    description: 'Выберите правильный вариант добавления CSRF-защиты.',
    code: `// Было (уязвимо):
app.post('/delete-account', (req, res) => {
  if (!req.session.userId) return res.status(401);
  db.users.delete(req.session.userId);
  res.json({ ok: true });
});`,
    question: 'Какой вариант исправления правильный?',
    options: [
      'Добавить app.use(csrfProtection()) и скрытое поле _csrf в форму',
      'Добавить проверку req.body.password',
      'Использовать DELETE вместо POST метода',
      'Добавить заголовок X-Frame-Options',
    ],
    correctIndex: 0,
    explanation:
      'CSRF middleware (например, csurf) генерирует уникальный токен для каждой сессии. Форма должна содержать скрытое поле <input type="hidden" name="_csrf" value="{{csrfToken}}">. Сервер проверяет токен из формы против токена в сессии — злоумышленник не может получить токен из-за Same-Origin Policy.',
  },
];

// ============================================================
// Real-World CSRF Examples
// ============================================================

export const realWorldExamples = [
  {
    year: '2019',
    company: 'TikTok',
    description:
      'Исследователи обнаружили CSRF-уязвимость в TikTok, которая позволяла изменить email аккаунта, подписаться на пользователя и поставить лайк через вредоносный сайт. Уязвимость была в API-эндпоинтах, не проверяющих CSRF-токены.',
    impact: 'Изменение аккаунта, подписки, лайки',
    fix: 'Добавлены CSRF-токены ко всем POST-запросам',
  },
  {
    year: '2014',
    company: 'Gmail (старые версии)',
    description:
      'В ранних версиях Gmail CSRF-токены передавались в URL-параметрах. При клике на внешнюю ссылку токен попадал в Referer-заголовок и мог быть прочитан сторонним сервером.',
    impact: 'Утечка CSRF-токенов через Referer',
    fix: 'Переход на CSRF-токены в POST-body и заголовках',
  },
  {
    year: '2021',
    company: 'Tesla Model S',
    description:
      'Исследователь обнаружил CSRF-уязвимость в веб-интерфейсе Tesla, которая позволяла удалённо открыть дверь автомобиля. Атакующий мог создать вредоносную страницу, которая отправляла запрос к API Tesla.',
    impact: 'Удалённое открытие двери автомобиля',
    fix: 'Tesla добавила CSRF-токены и отозвала вознаграждение за баг',
  },
];
