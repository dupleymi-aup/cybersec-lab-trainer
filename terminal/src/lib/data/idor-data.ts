export interface IDORScenario {
  id: number;
  title: string;
  description: string;
  code: string;
  vulnerableLine: number;
  explanation: string;
  fix: string;
  fixExplanation: string;
  options: { text: string; correct: boolean }[];
}

export const idorScenarios: IDORScenario[] = [
  {
    id: 1,
    title: 'Прямая ссылка на ресурс',
    description: 'Пользователь может изменить URL-параметр и получить доступ к чужим данным.',
    code: `// API endpoint: /api/users/{id}/profile
app.get('/api/users/:id/profile', (req, res) => {
  const userId = req.params.id;
  const profile = db.getUser(userId);
  res.json(profile);
});

// Клиентский запрос:
// GET /api/users/123/profile
// Атакующий меняет на:
// GET /api/users/124/profile`,
    vulnerableLine: 4,
    explanation: 'Сервер возвращает профиль любого пользователя без проверки, что текущий аутентифицированный пользователь имеет право просматривать эти данные.',
    fix: `app.get('/api/users/:id/profile', authenticate, (req, res) => {
  const requestedId = req.params.id;
  // Проверяем, что пользователь запрашивает свой профиль
  if (req.user.id !== requestedId && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  const profile = db.getUser(requestedId);
  res.json(profile);
});`,
    fixExplanation: 'Добавлена проверка: пользователь может просматривать только свой профиль (или администратор — любой).',
    options: [
      { text: 'Использовать GUID вместо числового ID', correct: false },
      { text: 'Проверять соответствие ID пользователя в сессии с запрошенным ID', correct: true },
      { text: 'Скрыть URL из адресной строки', correct: false },
      { text: 'Использовать POST вместо GET', correct: false },
    ],
  },
  {
    id: 2,
    title: 'Изменение чужого заказа',
    description: 'Атакующий может изменить заказ другого пользователя, подобрав orderId.',
    code: `// Изменение статуса заказа
app.put('/api/orders/:orderId/status', (req, res) => {
  const order = db.getOrder(req.params.orderId);
  order.status = req.body.status;
  db.saveOrder(order);
  res.json({ success: true });
});

// Атакующий отправляет:
// PUT /api/orders/5001/status
// {"status": "cancelled"}`,
    vulnerableLine: 3,
    explanation: 'Нет проверки принадлежности заказа текущему пользователю. Любой аутентифицированный пользователь может отменить любой заказ.',
    fix: `app.put('/api/orders/:orderId/status', authenticate, (req, res) => {
  const order = db.getOrder(req.params.orderId);
  // Проверяем принадлежность заказа
  if (order.userId !== req.user.id) {
    return res.status(403).json({ error: 'Это не ваш заказ' });
  }
  order.status = req.body.status;
  db.saveOrder(order);
  res.json({ success: true });
});`,
    fixExplanation: 'Добавлена проверка ownership — пользователь может менять только свои заказы.',
    options: [
      { text: 'Зашифровать orderId', correct: false },
      { text: 'Проверять принадлежность заказа текущему пользователю', correct: true },
      { text: 'Использовать случайные номера заказов', correct: false },
      { text: 'Добавить CAPTCHA', correct: false },
    ],
  },
  {
    id: 3,
    title: 'Просмотр чужих документов',
    description: 'Функция загрузки документов позволяет получить любой файл, зная его ID.',
    code: `app.get('/api/documents/:docId/download', (req, res) => {
  const doc = db.getDocument(req.params.docId);
  res.download(doc.filePath);
});

// Перебор ID:
// GET /api/documents/1/download
// GET /api/documents/2/download
// GET /api/documents/3/download`,
    vulnerableLine: 2,
    explanation: 'Документ отдаётся без проверки прав доступа. Атакующий может перебрать ID и скачать любые документы.',
    fix: `app.get('/api/documents/:docId/download', authenticate, (req, res) => {
  const doc = db.getDocument(req.params.docId);
  // Проверяем права: владелец, соавтор или админ
  const hasAccess = doc.ownerId === req.user.id
    || doc.collaborators.includes(req.user.id)
    || req.user.role === 'admin';
  if (!hasAccess) {
    return res.status(403).json({ error: 'Нет доступа' });
  }
  res.download(doc.filePath);
});`,
    fixExplanation: 'Реализована проверка прав доступа: владелец, соавторы и администраторы.',
    options: [
      { text: 'Использовать непрямые ссылки (UUID)', correct: false },
      { text: 'Проверять права доступа к документу для текущего пользователя', correct: true },
      { text: 'Запретить прямой доступ к файлам', correct: false },
      { text: 'Добавить логирование скачиваний', correct: false },
    ],
  },
  {
    id: 4,
    title: 'Редактирование чужого профиля',
    description: 'API обновления профиля не проверяет авторизацию.',
    code: `app.put('/api/profile/:userId', (req, res) => {
  db.updateUser(req.params.userId, req.body);
  res.json({ success: true });
});

// Атакующий отправляет:
// PUT /api/profile/42
// {"email": "hacker@evil.com", "role": "admin"}`,
    vulnerableLine: 2,
    explanation: 'Отсутствует middleware аутентификации и проверка прав. Атакующий может изменить любой профиль, включая повышение привилегий.',
    fix: `app.put('/api/profile/:userId', authenticate, (req, res) => {
  // Пользователь может редактировать только свой профиль
  if (req.user.id !== req.params.userId) {
    return res.status(403).json({ error: 'Можно менять только свой профиль' });
  }
  // Запрещаем менять роль через этот endpoint
  const { role, ...safeData } = req.body;
  db.updateUser(req.params.userId, safeData);
  res.json({ success: true });
});`,
    fixExplanation: 'Добавлена аутентификация, проверка ownership и защита от изменения роли.',
    options: [
      { text: 'Убрать параметр userId из URL', correct: false },
      { text: 'Добавить аутентификацию и проверять совпадение ID, запретить смену роли', correct: true },
      { text: 'Валидировать email на клиенте', correct: false },
      { text: 'Ограничить длину имени', correct: false },
    ],
  },
  {
    id: 5,
    title: 'Непрямая ссылка — обход через API',
    description: 'Даже с UUID можно столкнуться с IDOR, если UUID предсказуем или泄露.',
    code: `// "Безопасный" вариант с UUID
app.get('/api/reports/:reportUuid', authenticate, (req, res) => {
  const report = db.getReportByUuid(req.params.reportUuid);
  res.json(report);
});

// Проблема: UUID генерируется последовательно:
// 550e8400-e29b-41d4-a716-000000000001
// 550e8400-e29b-41d4-a716-000000000002
// Атакующий инкрементирует последнюю часть.`,
    vulnerableLine: 3,
    explanation: 'UUID-v1 или последовательные UUID предсказуемы. Кроме того, UUID могут быть раскрыты в логах, referer-заголовках или через другие API.',
    fix: `app.get('/api/reports/:reportUuid', authenticate, (req, res) => {
  const report = db.getReportByUuid(req.params.reportUuid);
  // Всегда проверяем принадлежность, даже с UUID
  if (!report || report.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Нет доступа' });
  }
  // Используем crypto.randomUUID() для непредсказуемости
  res.json(report);
});`,
    fixExplanation: 'Независимо от типа идентификатора всегда проверяем права доступа. Используем crypto.randomUUID().',
    options: [
      { text: 'UUID полностью защищает от IDOR', correct: false },
      { text: 'UUID снижает риск, но проверка прав всё равно необходима', correct: true },
      { text: 'Нужно использовать только числовые ID', correct: false },
      { text: 'Нужно шифровать UUID на клиенте', correct: false },
    ],
  },
  {
    id: 6,
    title: 'Массовый перебор через API',
    description: 'Отсутствие rate limiting позволяет автоматизированный перебор ресурсов.',
    code: `// Атакующий пишет скрипт:
for (let id = 1; id <= 10000; id++) {
  fetch(\`/api/users/\${id}/invoice\`, {
    headers: { 'Authorization': 'Bearer <token>' }
  });
}

// Сервер обрабатывает каждый запрос без ограничений.
// Результат: тысячи чужих счетов скачаны.`,
    vulnerableLine: 2,
    explanation: 'Даже с аутентификацией, отсутствие rate limiting и мониторинга позволяет автоматизированный перебор IDOR.',
    fix: `// 1. Rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов
});

// 2. Мониторинг аномалий
app.get('/api/users/:id/invoice', authenticate, rateLimiter, (req, res) => {
  if (req.user.id !== req.params.id) {
    logSuspiciousActivity(req.user.id, req.params.id);
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  const invoice = db.getInvoice(req.params.id);
  res.json(invoice);
});`,
    fixExplanation: 'Комбинированная защита: rate limiting + проверка прав + мониторинг аномалий.',
    options: [
      { text: 'Достаточно только rate limiting', correct: false },
      { text: 'Комбинация rate limiting, проверки прав и мониторинга', correct: true },
      { text: 'Нужно заблокировать IP после 5 запросов', correct: false },
      { text: 'Нужно отключить API для инвойсов', correct: false },
    ],
  },
  {
    id: 7,
    title: 'IDOR в GraphQL',
    description: 'GraphQL API с глубокой вложенностью и отсутствующими проверками.',
    code: `type Query {
  user(id: ID!): User
}

type User {
  id: ID!
  name: String
  email: String
  invoices: [Invoice]
  friends: [User]  # Можно перебирать друзей друзей
}

// Запрос атакующего:
query {
  user(id: "123") {
    invoices { amount, status }
    friends { name, email }
  }
}`,
    vulnerableLine: 13,
    explanation: 'GraphQL позволяет получать связанные данные без явных проверок на каждом уровне. Отсутствие authorization resolvers — типичная причина IDOR.',
    fix: `const resolvers = {
  Query: {
    user: (parent, { id }, context) => {
      // Разрешаем: свой профиль или админ
      if (context.userId !== id && !context.isAdmin) {
        throw new ForbiddenError('Нет доступа');
      }
      return db.getUser(id);
    },
  },
  User: {
    invoices: (parent, args, context) => {
      if (parent.id !== context.userId) {
        throw new ForbiddenError('Нет доступа к счетам');
      }
      return db.getInvoices(parent.id);
    },
  },
};`,
    fixExplanation: 'Каждый resolver должен проверять права доступа. Используем context для передачи информации о текущем пользователе.',
    options: [
      { text: 'GraphQL автоматически защищает от IDOR', correct: false },
      { text: 'Нужно добавить проверки в каждый resolver', correct: true },
      { text: 'Нужно ограничить глубину запроса', correct: false },
      { text: 'Нужно отключить introspection', correct: false },
    ],
  },
];

export const idorDefenseMechanisms = [
  {
    title: 'Проверка прав доступа',
    description: 'Каждый запрос должен проверять, имеет ли текущий пользователь право доступа к запрошенному ресурсу.',
    code: `if (resource.ownerId !== req.user.id && !req.user.isAdmin) {
  return res.status(403).json({ error: 'Доступ запрещён' });
}`,
  },
  {
    title: 'Непрямые ссылки',
    description: 'Используйте UUID или временные токены вместо предсказуемых числовых ID.',
    code: `const crypto = require('crypto');
const uuid = crypto.randomUUID();
// 550e8400-e29b-41d4-a716-446655440000`,
  },
  {
    title: 'Rate Limiting',
    description: 'Ограничьте количество запросов к API для предотвращения автоматизированного перебора.',
    code: `const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});`,
  },
  {
    title: 'Мониторинг и логирование',
    description: 'Отслеживайте подозрительные паттерны: множественные запросы к разным ресурсам от одного пользователя.',
    code: `function logSuspiciousActivity(userId, targetId) {
  auditLog.warn({
    event: 'idor_attempt',
    userId, targetId,
    timestamp: new Date().toISOString(),
  });
}`,
  },
  {
    title: 'Минимальные привилегии',
    description: 'API должен возвращать только те данные, которые необходимы для текущей операции.',
    code: `// Вместо полного объекта пользователя:
res.json({ id: user.id, name: user.name });
// Не возвращаем email, role, password_hash и т.д.`,
  },
];
