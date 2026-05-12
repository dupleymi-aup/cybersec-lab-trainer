<div align="center">

# CyberSec Lab — Интерактивный тренажёр по информационной безопасности

### Интерактивная платформа для обучения основам информационной безопасности

**CyberSec Lab — Interactive Platform for Information Security Training**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-new--york-black)](https://ui.shadcn.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)

---

**Автор / Author:** Дуплей Максим Игоревич / Dupley Maxim Igorevich

**Интеллектуальная собственность / Intellectual Property:** Дуплей Максим Игоревич / Dupley Maxim Igorevich

</div>

---

## О проекте

**CyberSec Lab** — это комплексная веб-платформа для интерактивного изучения основ информационной безопасности, веб-безопасности и безопасной разработки. Проект разработан как полноценное образовательное приложение, объединяющее 8 обучающих модулей, систему тестирования с таймером (**110+ вопросов** по 9 категориям с фильтрацией по сложности), лабораторные работы по SQL-инъекциям, XSS, CSRF, ревью кода, криптографические инструменты, систему достижений (**16 достижений**) и глоссарий из **80+ терминов**. Платформа предназначена для студентов направления «Программная инженерия» (09.03.04), преподавателей и всех, кто хочет изучить актуальные угрозы и методы защиты на практике.

Все материалы представлены на русском языке и опираются на актуальные стандарты безопасности, включая OWASP Top 10 (2021), NIST Incident Response, CVSS v3.1 и OWASP API Security Top 10.

### Ключевые возможности

- **8 интерактивных модулей** — от OWASP Top 10 до Security Headers, каждый модуль включает теорию, примеры кода и практические задания
- **110+ вопросов квиза** по 9 категориям с таймером, подробными пояснениями и фильтрацией по сложности
- **11 лабораторных заданий** по SQL-инъекциям: от обхода аутентификации до WAF Bypass, Out-of-band и Polyglot-атак
- **6 типов XSS** с интерактивной демонстрацией атак и санитизации
- **25 задач по ревью кода**: найдите уязвимость (SQLi, XSS, IDOR, SSRF, XXE, SSTI, Prototype Pollution, LDAP Injection, Mass Assignment) и выберите правильное решение
- **Криптографические инструменты**: шифры Цезаря, Виженера, XOR; кодирование Base64/URL; хеш-функции; генератор паролей
- **16 достижений** — от первых шагов до мастерства, мотивирующие бейджи за прогресс
- **Система отслеживания прогресса** — сохранение в localStorage, статистика по модулям и квизам
- **Глоссарий из 80+ терминов** с поиском и фильтрацией по 9 категориям
- **Адаптивный интерфейс** — полностью отзывчивый дизайн для мобильных устройств, планшетов и десктопов
- **Анимации и переходы** — плавный интерфейс на базе Framer Motion

### Модули платформы

| # | Модуль | Категория | Описание |
|---|--------|-----------|----------|
| 1 | **OWASP Top 10** | Веб-безопасность | 10 категорий уязвимостей (Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable Components, Auth Failures, Data Integrity, Logging, SSRF) с примерами уязвимого и безопасного кода, реальными кейсами и способами защиты |
| 2 | **SQL-инъекции** | Атака-защита | 11 интерактивных заданий от простого обхода аутентификации до WAF Bypass, Out-of-band и Polyglot-атак с визуализацией SQL-запросов |
| 3 | **XSS-атаки** | Атака-защита | 6 типов XSS: отражённый, хранимый, DOM-based, SVG, Markdown и PDF. Интерактивные демонстрации атак с переключением между уязвимым и безопасным режимом |
| 4 | **CSRF-атаки** | Атака-защита | Визуальная симуляция CSRF-атаки с пошаговой демонстрацией, SameSite cookie и механизмами защиты |
| 5 | **Аутентификация** | Безопасность | Тренажёры: проверка надёжности пароля, визуализация брутфорса, демо bcrypt-хеширования, интерактивный TOTP/2FA, разбор JWT-сессий |
| 6 | **Безопасное кодирование** | Ревью кода | 25 задач по ревью кода: найдите уязвимость и выберите правильное решение. SQLi, XSS, IDOR, SSRF, XXE, SSTI, Prototype Pollution, LDAP Injection, Mass Assignment и др. |
| 7 | **Security Headers** | Инфраструктура | 6 HTTP-заголовков безопасности: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Пошаговое обучение с квизом |
| 8 | **Инструменты безопасности** | Криптография | Шифры (Цезарь, Виженер, XOR), кодирование (Base64, URL), хеш-функции (MD5, SHA-1, SHA-256) и генератор паролей |

### Система тестирования

- **110+ вопросов** по 9 категориям:

| Категория | Кол-во | Темы |
|-----------|--------|------|
| SQL-инъекции | 15 | Parameterized queries, UNION, Blind SQLi, Second-order, WAF Bypass, Stacked queries |
| XSS-атаки | 13 | DOM-based, CSP bypass, mXSS, WebSocket XSS, SVG XSS, Filter evasion |
| CSRF | 12 | SameSite, Double Submit Cookie, JSON endpoints, REST API, Token predictability |
| Аутентификация | 10 | OAuth, Session Fixation, Credential Stuffing, Password reset tokens, MFA Fatigue |
| Общая безопасность | 19 | Zero-day lifecycle, CVSS, Defense in Depth, Incident Response, Pentesting, MITM, Supply Chain |
| OWASP Top 10 | 17 | IDOR, BOLA, SSRF, DNS Rebinding, Serverless, Container/K8s, Mobile (MASVS), AI/ML security |
| Безопасное кодирование | 10 | DOMPurify, Allowlist, Timing Attack, LDAP Injection, SSTI, JWT, Prototype Pollution, Email injection, GraphQL |
| **Сетевые атаки** | 10 | ARP Spoofing, DNS Amplification, Nmap, VLAN Hopping, Evil Twin, ICMP Flood, BGP Hijacking, KRACK, DNS Poisoning |
| **Социальная инженерия** | 10 | Spear Phishing, Pretexting, Tailgating, Vishing, Smishing, Watering Hole, Baiting, Clone Phishing, CEO Fraud |

- Фильтрация по сложности (лёгкий / средний / сложный)
- Таймер на 30 секунд на вопрос
- Система оценки с разбивкой по темам и уровням сложности
- Подробный разбор ответов после завершения

### Система достижений и геймификация

- **16 достижений** с условиями разблокировки — от первых шагов до полного прохождения
- Отслеживание прогресса в реальном времени
- Статистика по каждому модулю и квизу
- Глоссарий из **80+ терминов** с поиском и фильтрацией по 9 категориям

### Технологии

| Технология | Версия | Назначение |
|------------|--------|------------|
| **Next.js** | 15 | React-фреймворк с App Router и SSR |
| **TypeScript** | 5 | Статическая типизация для надёжности кода |
| **React** | 19 | Библиотека пользовательского интерфейса |
| **Tailwind CSS** | 4 | Утилитарные CSS-стили для быстрой разработки UI |
| **shadcn/ui** | — | Компоненты интерфейса в стиле New York |
| **Zustand** | 5 | Лёгкое управление состоянием с персистентностью в localStorage |
| **Framer Motion** | 12 | Плавные анимации и переходы |
| **React Syntax Highlighter** | — | Подсветка синтаксиса в блоках кода |
| **Lucide React** | — | Набор иконок для интерфейса |
| **Radix UI** | — | Примитивы доступных UI-компонентов |

### Установка и запуск

#### Предварительные требования

- **Node.js** версии 18.17 или выше (рекомендуется 20+)
- **npm**, **yarn**, **pnpm** или **bun** в качестве пакетного менеджера

#### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/QuadDarv1ne/cybersec-lab-trainer.git
cd cybersec-lab-trainer

# Установить зависимости
npm install

# Запустить в режиме разработки
npm run dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000)

#### Сборка для продакшена

```bash
# Сборка проекта
npm run build

# Запуск собранного приложения
npm start
```

### Структура проекта

```
cybersec-lab-trainer/
├── public/                         # Статические файлы
│   ├── security-logo.png           # Логотип проекта
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Корневой layout
│   │   ├── page.tsx                # Главная страница (SPA)
│   │   ├── globals.css             # Глобальные стили
│   │   └── api/
│   │       └── route.ts            # API-маршруты
│   ├── components/
│   │   ├── security-trainer/       # Модули тренажёра
│   │   │   ├── Sidebar.tsx         # Навигационная боковая панель
│   │   │   ├── Dashboard.tsx       # Главная панель с обзором модулей
│   │   │   ├── OWASPTop10.tsx      # Модуль OWASP Top 10
│   │   │   ├── SQLInjectionLab.tsx # Лаборатория SQL-инъекций
│   │   │   ├── XSSLab.tsx          # Лаборатория XSS-атак
│   │   │   ├── CSRFLab.tsx         # Лаборатория CSRF
│   │   │   ├── SecurityHeadersLab.tsx # Лаборатория Security Headers
│   │   │   ├── AuthSecurityLab.tsx # Безопасность аутентификации
│   │   │   ├── SecureCodingLab.tsx # Задачи на безопасное кодирование
│   │   │   ├── ToolsLab.tsx        # Криптографические инструменты
│   │   │   ├── AchievementsGlossary.tsx # Достижения и глоссарий
│   │   │   ├── QuizSystem.tsx      # Система тестирования с таймером
│   │   │   ├── AuthPages.tsx       # Страницы регистрации/входа
│   │   │   ├── ProfilePage.tsx     # Страница профиля пользователя
│   │   │   ├── OTPModal.tsx        # Модальное окно OTP-верификации
│   │   │   └── CodeBlock.tsx       # Компонент подсветки кода
│   │   └── ui/                     # shadcn/ui компоненты
│   ├── lib/
│   │   ├── security-data.ts        # Учебные данные (OWASP, SQL, XSS, квизы, задачи)
│   │   ├── store.ts                # Zustand store с localStorage
│   │   ├── auth-store.ts           # Store аутентификации
│   │   ├── auth-utils.ts           # Утилиты аутентификации
│   │   └── utils.ts                # Общие утилиты
│   └── hooks/                      # Пользовательские хуки
├── prisma/
│   └── schema.prisma               # Схема базы данных
├── package.json                    # Зависимости и скрипты
├── next.config.ts                  # Конфигурация Next.js
├── tsconfig.json                   # Конфигурация TypeScript
├── tailwind.config.ts              # Конфигурация Tailwind CSS
├── README.md                       # Документация проекта (двуязычная)
├── LICENSE                         # Лицензия (двуязычная)
└── .gitignore                      # Исключения Git
```

### Дорожная карта

- [x] Модуль OWASP Top 10 — 10 категорий с примерами кода
- [x] Лаборатория SQL-инъекций — 11 заданий от новичка до эксперта
- [x] Лаборатория XSS-атак — 6 типов XSS
- [x] Симуляция CSRF-атак
- [x] Модуль аутентификации — пароли, брутфорс, bcrypt, TOTP/2FA, JWT
- [x] Безопасное кодирование — 25 задач по ревью кода
- [x] Security Headers — 6 заголовков безопасности
- [x] Криптографические инструменты
- [x] Система тестирования — 110+ вопросов, таймер, фильтрация
- [x] Система достижений и глоссарий
- [x] Аутентификация с OTP-верификацией и профилями пользователей
- [ ] Мультиязычность (полная поддержка EN/RU)
- [ ] PWA-манифест и офлайн-работа
- [ ] E2E-тесты (Playwright)
- [ ] Интеграция с LMS (Moodle)

---

## English Description

### About the Project

**CyberSec Lab** is a comprehensive web platform for interactive study of information security fundamentals, web security, and secure development. The project is designed as a full-featured educational application that combines 8 learning modules, a timed testing system (**110+ questions** across 9 categories with difficulty filtering), hands-on labs for SQL injection, XSS, CSRF, code review, cryptographic tools, an achievement system (**16 achievements**), and a glossary of **80+ terms**. The platform is intended for Software Engineering students (09.03.04), educators, and anyone who wants to learn current threats and protection methods through practice.

All content is in Russian and based on current security standards including OWASP Top 10 (2021), NIST Incident Response, CVSS v3.1, and OWASP API Security Top 10.

### Key Features

- **8 interactive modules** — from OWASP Top 10 to Security Headers, each with theory, code examples, and practical exercises
- **110+ quiz questions** across 9 categories with a timer, detailed explanations, and difficulty filtering
- **11 SQL injection lab exercises** — from authentication bypass to WAF Bypass, Out-of-band, and Polyglot attacks
- **6 XSS types** with interactive attack and sanitization demonstrations
- **25 code review challenges**: identify vulnerabilities (SQLi, XSS, IDOR, SSRF, XXE, SSTI, Prototype Pollution, LDAP Injection, Mass Assignment) and choose the correct fix
- **Cryptographic tools**: Caesar, Vigenere, XOR ciphers; Base64/URL encoding; hash functions; password generator
- **16 achievements** — from first steps to full completion, motivational badges for progress
- **Progress tracking system** — localStorage persistence, per-module and per-quiz statistics
- **Glossary of 80+ terms** with search and filtering across 9 categories
- **Adaptive interface** — fully responsive design for mobile, tablet, and desktop
- **Animations and transitions** — smooth UI powered by Framer Motion

### Platform Modules

| # | Module | Category | Description |
|---|--------|----------|-------------|
| 1 | **OWASP Top 10** | Web Security | 10 vulnerability categories with vulnerable/secure code examples, real-world cases, and mitigations |
| 2 | **SQL Injection** | Attack-Defense | 11 interactive exercises from basic auth bypass to WAF Bypass, OOB, and Polyglot attacks |
| 3 | **XSS Attacks** | Attack-Defense | 6 XSS types: reflected, stored, DOM-based, SVG, Markdown, PDF with interactive demos |
| 4 | **CSRF Attacks** | Attack-Defense | Visual CSRF simulation with step-by-step demo, SameSite cookies, and protection mechanisms |
| 5 | **Authentication** | Security | Password strength checker, brute-force visualizer, bcrypt hashing demo, interactive TOTP/2FA, JWT analysis |
| 6 | **Secure Coding** | Code Review | 25 code review challenges: find the vulnerability and select the correct fix |
| 7 | **Security Headers** | Infrastructure | 6 HTTP security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| 8 | **Security Tools** | Cryptography | Ciphers (Caesar, Vigenere, XOR), encoding (Base64, URL), hash functions, password generator |

### XP System and Gamification

The platform uses a progress tracking system. Each module completion and quiz score is tracked, achievements unlock based on milestones, and users can monitor their progress across all modules.

### Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15 | React framework with App Router and SSR |
| **TypeScript** | 5 | Static typing for code reliability |
| **React** | 19 | User interface library |
| **Tailwind CSS** | 4 | Utility-first CSS for rapid UI development |
| **shadcn/ui** | — | UI components in New York style |
| **Zustand** | 5 | Lightweight state management with localStorage persistence |
| **Framer Motion** | 12 | Smooth animations and transitions |
| **React Syntax Highlighter** | — | Code syntax highlighting |
| **Lucide React** | — | Icon set for the interface |
| **Radix UI** | — | Accessible UI component primitives |

### Installation and Setup

#### Prerequisites

- **Node.js** version 18.17 or higher (20+ recommended)
- **npm**, **yarn**, **pnpm**, or **bun** as package manager

#### Installation

```bash
# Clone the repository
git clone https://github.com/QuadDarv1ne/cybersec-lab-trainer.git
cd cybersec-lab-trainer

# Install dependencies
npm install

# Run in development mode
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

#### Production Build

```bash
# Build the project
npm run build

# Run the built application
npm start
```

### Roadmap

- [x] OWASP Top 10 module — 10 categories with code examples
- [x] SQL Injection Lab — 11 exercises from beginner to expert
- [x] XSS Attacks Lab — 6 XSS types
- [x] CSRF Attack Simulation
- [x] Authentication module — passwords, brute-force, bcrypt, TOTP/2FA, JWT
- [x] Secure Coding — 25 code review challenges
- [x] Security Headers — 6 security headers
- [x] Cryptographic tools
- [x] Testing system — 110+ questions, timer, difficulty filtering
- [x] Achievement system and glossary
- [x] Authentication with OTP verification and user profiles
- [ ] Full multilingual support (EN/RU)
- [ ] PWA manifest and offline support
- [ ] E2E tests (Playwright)
- [ ] LMS integration (Moodle)

---

## Автор / Author

**Дуплей Максим Игоревич / Dupley Maxim Igorevich**

Данный проект является интеллектуальной собственностью Дуплей Максима Игоревича. Все права на программный код, дизайн, контент и учебные материалы принадлежат автору.

This project is the intellectual property of Dupley Maxim Igorevich. All rights to the source code, design, content, and educational materials belong to the author.

---

## Лицензия / License

Данный проект является интеллектуальной собственностью Дуплей Максима Игоревича (Dupley Maxim Igorevich). Условия использования описаны в файле [LICENSE](./LICENSE).

This project is the intellectual property of Dupley Maxim Igorevich. Terms of use are described in the [LICENSE](./LICENSE) file.

---

<div align="center">

**CyberSec Lab** — © 2025-2026 Дуплей Максим Игоревич / Dupley Maxim Igorevich

</div>
