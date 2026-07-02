// ============================================================
// Cybersecurity Career Paths Data
// ============================================================

export interface CareerPath {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  salaryRange: string;
  demandLevel: 'high' | 'medium' | 'very-high';
  skills: string[];
  learningPath: string[]; // module IDs in recommended order
  certifications: string[];
  roles: string[];
}

export const careerPaths: CareerPath[] = [
  {
    id: 'web-security',
    title: 'Веб-безопасность',
    icon: 'Shield',
    color: 'from-emerald-500 to-teal-600',
    description: 'Специализация на защите веб-приложений от атак: SQL-инъекции, XSS, CSRF, безопасность API.',
    salaryRange: '120 000 — 250 000 ₽',
    demandLevel: 'very-high',
    skills: ['SQL-инъекции', 'XSS/CSRF', 'Безопасность API', 'Security Headers', 'OWASP Top 10'],
    learningPath: ['owasp', 'sql-injection', 'xss', 'csrf', 'security-headers', 'api-security'],
    certifications: ['OSWP (Offensive Security Web Professional)', 'GWAPT (GIAC Web Application Penetration Tester)', 'eWPT (eLearnSecurity Web Penetration Tester)'],
    roles: ['Web Application Penetration Tester', 'Application Security Engineer', 'Security Code Reviewer'],
  },
  {
    id: 'appsec-engineer',
    title: 'Безопасность приложений',
    icon: 'Code',
    color: 'from-violet-500 to-purple-600',
    description: 'Встраивание безопасности в процесс разработки: безопасное кодирование, ревью кода, SAST/DAST.',
    salaryRange: '150 000 — 300 000 ₽',
    demandLevel: 'very-high',
    skills: ['Безопасное кодирование', 'Ревью кода', 'SAST/DAST', 'Аутентификация', 'OWASP Top 10'],
    learningPath: ['owasp', 'auth', 'secure-coding', 'sql-injection', 'xss', 'api-security'],
    certifications: ['CSSLP (Certified Secure Software Lifecycle Professional)', 'GWEB (GIAC Enterprise Vulnerability Assessor)', 'CASE (Certified Application Security Engineer)'],
    roles: ['Application Security Engineer', 'Secure Development Lead', 'Security Architect'],
  },
  {
    id: 'pentester',
    title: 'Пентестер',
    icon: 'ShieldAlert',
    color: 'from-red-500 to-orange-600',
    description: 'Тестирование на проникновение: поиск уязвимостей, эксплуатация, написание отчётов.',
    salaryRange: '130 000 — 280 000 ₽',
    demandLevel: 'high',
    skills: ['SQL-инъекции', 'XSS/CSRF', 'IDOR', 'SSRF', 'Безопасность API', 'Инструменты'],
    learningPath: ['owasp', 'sql-injection', 'xss', 'csrf', 'idor', 'ssrf', 'api-security', 'tools'],
    certifications: ['OSCP (Offensive Security Certified Professional)', 'CEH (Certified Ethical Hacker)', 'eJPT (eLearnSecurity Junior Penetration Tester)', 'PNPT (Practical Network Penetration Tester)'],
    roles: ['Penetration Tester', 'Red Team Operator', 'Vulnerability Researcher'],
  },
  {
    id: 'security-analyst',
    title: 'Аналитик информационной безопасности',
    icon: 'TrendingUp',
    color: 'from-blue-500 to-indigo-600',
    description: 'Мониторинг, анализ инцидентов, расследование атак, работа с SIEM-системами.',
    salaryRange: '100 000 — 220 000 ₽',
    demandLevel: 'high',
    skills: ['OWASP Top 10', 'Анализ логов', 'Инцидент-респонс', 'Сетевая безопасность', 'Криптография'],
    learningPath: ['owasp', 'auth', 'security-headers', 'tools', 'phishing-analyzer'],
    certifications: ['Security+', 'CySA+ (Cybersecurity Analyst)', 'GCIH (GIAC Certified Incident Handler)', 'CISSP (для senior)'],
    roles: ['Security Operations Center (SOC) Analyst', 'Incident Responder', 'Threat Intelligence Analyst'],
  },
  {
    id: 'security-architect',
    title: 'Архитектор безопасности',
    icon: 'Lock',
    color: 'from-slate-600 to-slate-800',
    description: 'Проектирование безопасных систем: архитектура, стандарты, политики безопасности.',
    salaryRange: '200 000 — 400 000+ ₽',
    demandLevel: 'high',
    skills: ['Все уязвимости OWASP', 'Аутентификация', 'API Security', 'Security Headers', 'Криптография', 'Архитектура'],
    learningPath: ['owasp', 'sql-injection', 'xss', 'csrf', 'auth', 'security-headers', 'api-security', 'secure-coding', 'tools'],
    certifications: ['CISSP (Certified Information Systems Security Professional)', 'CISM (Certified Information Security Manager)', 'SABSA (Sherwood Applied Business Security Architecture)', 'TOGAF + Security'],
    roles: ['Security Architect', 'Chief Information Security Officer (CISO)', 'Security Consultant'],
  },  {
    id: 'cloud-security',
    title: 'Облачная безопасность',
    icon: 'Cloud',
    color: 'from-cyan-500 to-blue-600',
    description: 'Защита облачных инфраструктур: AWS, Azure, GCP. Управление доступом, шифрование, мониторинг конфигураций.',
    salaryRange: '160 000 — 350 000 ₽',
    demandLevel: 'very-high',
    skills: ['Cloud IAM', 'SSRF', 'Security Headers', 'Криптография', 'Сетевая безопасность', 'Конфигурации'],
    learningPath: ['owasp', 'auth', 'ssrf', 'security-headers', 'tools', 'api-security'],
    certifications: ['CCSP (Certified Cloud Security Professional)', 'AWS Security Specialty', 'Azure Security Engineer (AZ-500)', 'GCP Cloud Security', 'CKS (Kubernetes Security)'],
    roles: ['Cloud Security Engineer', 'Cloud Security Architect', 'DevSecOps Engineer (Cloud)'],
  },
  {
    id: 'devsecops',
    title: 'DevSecOps',
    icon: 'Settings',
    color: 'from-amber-500 to-orange-600',
    description: 'Интеграция безопасности в CI/CD: автоматизация SAST/DAST, сканирование зависимостей, security as code.',
    salaryRange: '170 000 — 320 000 ₽',
    demandLevel: 'very-high',
    skills: ['Безопасное кодирование', 'SAST/DAST', 'Инструменты', 'OWASP Top 10', 'CI/CD Security', 'Контейнеры'],
    learningPath: ['owasp', 'secure-coding', 'tools', 'sql-injection', 'xss', 'csrf', 'api-security'],
    certifications: ['DevSecOps Professional (DSOP)', 'Certified DevSecOps Professional (CDP)', 'GWAPT (для DAST)', 'CKS (Kubernetes Security)', 'OSSP+'],
    roles: ['DevSecOps Engineer', 'Security Automation Engineer', 'Platform Security Engineer'],
  },

];

export const skillLevels = [
  {
    level: 'Junior (0-1 год)',
    modules: 3,
    description: 'Базовое понимание уязвимостей, способность распознавать простые атаки',
    color: 'text-emerald-600',
  },
  {
    level: 'Middle (1-3 года)',
    modules: 5,
    description: 'Уверенное обнаружение уязвимостей, понимание механизмов защиты',
    color: 'text-blue-600',
  },
  {
    level: 'Senior (3-5 лет)',
    modules: 7,
    description: 'Глубокое понимание всех векторов атак, способность проектировать защиту',
    color: 'text-violet-600',
  },
  {
    level: 'Expert (5+ лет)',
    modules: 9,
    description: 'Полное покрытие всех модулей, сертификации, менторство',
    color: 'text-amber-600',
  },
];

export const industryDemand = [
  { sector: 'Финансы и банки', demand: 'Очень высокий', growth: '+25% в год', key: 'Веб-безопасность, пентестинг' },
  { sector: 'IT и SaaS', demand: 'Очень высокий', growth: '+30% в год', key: 'AppSec, API Security' },
  { sector: 'Госсектор', demand: 'Высокий', growth: '+20% в год', key: 'Аналитика ИБ, SOC' },
  { sector: 'E-commerce', demand: 'Высокий', growth: '+22% в год', key: 'Веб-безопасность, пентестинг' },
  { sector: 'Здравоохранение', demand: 'Растущий', growth: '+18% в год', key: 'Защита данных, compliance' },
];
