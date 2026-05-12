<div align="center">

# CyberSec Lab — Interactive Information Security Trainer

### Interactive Platform for Information Security Training

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-new--york-black)](https://ui.shadcn.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)

---

**Author:** Dupley Maxim Igorevich

**Intellectual Property:** Dupley Maxim Igorevich

</div>

---

## About the Project

**CyberSec Lab** is a comprehensive web platform for interactive study of information security fundamentals, web security, and secure development. The project is designed as a full-featured educational application that combines 8 learning modules, a timed testing system (**110+ questions** across 9 categories with difficulty filtering), hands-on labs for SQL injection, XSS, CSRF, code review, cryptographic tools, an achievement system (**16 achievements**), and a glossary of **80+ terms**. The platform is intended for Software Engineering students (09.03.04), educators, and anyone who wants to learn current threats and protection methods through practice.

All content is in Russian and based on current security standards including OWASP Top 10 (2021), NIST Incident Response, CVSS v3.1, and OWASP API Security Top 10.

## Key Features

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

## Platform Screenshots

<div align="center">

| | | |
|-|-|-|
| <img src="img/Регистрация.png" width="300" alt="Registration"> | <img src="img/Главная страница.png" width="300" alt="Dashboard"> | <img src="img/Модули обучения.png" width="300" alt="Learning Modules"> |
| <img src="img/OWASP - топ 10.png" width="300" alt="OWASP Top 10"> | <img src="img/SQL Инъекции.png" width="300" alt="SQL Injection"> | <img src="img/Лаборатория XSS-атак.png" width="300" alt="XSS Attacks"> |
| <img src="img/CSRF-атаки.png" width="300" alt="CSRF Attacks"> | <img src="img/Безопасное кодирование.png" width="300" alt="Secure Coding"> | <img src="img/Инструменты безопасности.png" width="300" alt="Security Tools"> |
| <img src="img/Security Headers.png" width="300" alt="Security Headers"> | <img src="img/Квизы.png" width="300" alt="Quizzes"> | <img src="img/Достижения.png" width="300" alt="Achievements"> |
| <img src="img/Глосарий.png" width="300" alt="Glossary"> | <img src="img/Личный профиль.png" width="300" alt="User Profile"> | |

</div>

## Platform Modules

| # | Module | Category | Description |
|---|--------|----------|-------------|
| 1 | **OWASP Top 10** | Web Security | 10 vulnerability categories (Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable Components, Auth Failures, Data Integrity, Logging, SSRF) with vulnerable/secure code examples, real-world cases, and mitigations |
| 2 | **SQL Injection** | Attack-Defense | 11 interactive exercises from basic authentication bypass to WAF Bypass, Out-of-band, and Polyglot attacks with SQL query visualization |
| 3 | **XSS Attacks** | Attack-Defense | 6 XSS types: reflected, stored, DOM-based, SVG, Markdown, and PDF. Interactive attack demonstrations with toggle between vulnerable and secure modes |
| 4 | **CSRF Attacks** | Attack-Defense | Visual CSRF simulation with step-by-step demo, SameSite cookies, and protection mechanisms |
| 5 | **Authentication** | Security | Trainers: password strength checker, brute-force visualizer, bcrypt hashing demo, interactive TOTP/2FA, JWT session analysis |
| 6 | **Secure Coding** | Code Review | 25 code review challenges: find the vulnerability and select the correct fix. SQLi, XSS, IDOR, SSRF, XXE, SSTI, Prototype Pollution, LDAP Injection, Mass Assignment, and more |
| 7 | **Security Headers** | Infrastructure | 6 HTTP security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Step-by-step learning with quiz |
| 8 | **Security Tools** | Cryptography | Ciphers (Caesar, Vigenere, XOR), encoding (Base64, URL), hash functions (MD5, SHA-1, SHA-256), and password generator |

## Testing System

- **110+ questions** across 9 categories:

| Category | Count | Topics |
|----------|-------|--------|
| SQL Injection | 15 | Parameterized queries, UNION, Blind SQLi, Second-order, WAF Bypass, Stacked queries |
| XSS Attacks | 13 | DOM-based, CSP bypass, mXSS, WebSocket XSS, SVG XSS, Filter evasion |
| CSRF | 12 | SameSite, Double Submit Cookie, JSON endpoints, REST API, Token predictability |
| Authentication | 10 | OAuth, Session Fixation, Credential Stuffing, Password reset tokens, MFA Fatigue |
| General Security | 19 | Zero-day lifecycle, CVSS, Defense in Depth, Incident Response, Pentesting, MITM, Supply Chain |
| OWASP Top 10 | 17 | IDOR, BOLA, SSRF, DNS Rebinding, Serverless, Container/K8s, Mobile (MASVS), AI/ML security |
| Secure Coding | 10 | DOMPurify, Allowlist, Timing Attack, LDAP Injection, SSTI, JWT, Prototype Pollution, Email injection, GraphQL |
| **Network Attacks** | 10 | ARP Spoofing, DNS Amplification, Nmap, VLAN Hopping, Evil Twin, ICMP Flood, BGP Hijacking, KRACK, DNS Poisoning |
| **Social Engineering** | 10 | Spear Phishing, Pretexting, Tailgating, Vishing, Smishing, Watering Hole, Baiting, Clone Phishing, CEO Fraud |

- Difficulty filtering (easy / medium / hard)
- 30-second timer per question
- Scoring system with breakdown by topic and difficulty level
- Detailed answer review after completion

## Achievement System and Gamification

- **16 achievements** with unlock conditions — from first steps to full completion
- Real-time progress tracking
- Statistics for each module and quiz
- Glossary of **80+ terms** with search and filtering across 9 categories

## Technologies

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

## Installation and Setup

### Prerequisites

- **Node.js** version 18.17 or higher (20+ recommended)
- **npm**, **yarn**, **pnpm**, or **bun** as package manager

### Installation

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

### Production Build

```bash
# Build the project
npm run build

# Run the built application
npm start
```

## Project Structure

```
cybersec-lab-trainer/
├── public/                         # Static files
│   ├── security-logo.png           # Project logo
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Main page (SPA)
│   │   ├── globals.css             # Global styles
│   │   └── api/
│   │       └── route.ts            # API routes
│   ├── components/
│   │   ├── security-trainer/       # Trainer modules
│   │   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   │   ├── Dashboard.tsx       # Main dashboard with module overview
│   │   │   ├── OWASPTop10.tsx      # OWASP Top 10 module
│   │   │   ├── SQLInjectionLab.tsx # SQL Injection lab
│   │   │   ├── XSSLab.tsx          # XSS lab
│   │   │   ├── CSRFLab.tsx         # CSRF lab
│   │   │   ├── SecurityHeadersLab.tsx # Security Headers lab
│   │   │   ├── AuthSecurityLab.tsx # Authentication security
│   │   │   ├── SecureCodingLab.tsx # Secure coding challenges
│   │   │   ├── ToolsLab.tsx        # Cryptographic tools
│   │   │   ├── AchievementsGlossary.tsx # Achievements and glossary
│   │   │   ├── QuizSystem.tsx      # Timed quiz system
│   │   │   ├── AuthPages.tsx       # Registration/login pages
│   │   │   ├── ProfilePage.tsx     # User profile page
│   │   │   ├── OTPModal.tsx        # OTP verification modal
│   │   │   └── CodeBlock.tsx       # Code highlighting component
│   │   └── ui/                     # shadcn/ui components
│   ├── lib/
│   │   ├── security-data.ts        # Training data (OWASP, SQL, XSS, quizzes, challenges)
│   │   ├── store.ts                # Zustand store with localStorage
│   │   ├── auth-store.ts           # Authentication store
│   │   ├── auth-utils.ts           # Authentication utilities
│   │   └── utils.ts                # Common utilities
│   └── hooks/                      # Custom hooks
├── prisma/
│   └── schema.prisma               # Database schema
├── package.json                    # Dependencies and scripts
├── next.config.ts                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── README.md                       # Brief documentation (RU)
├── README_RU.md                    # Full documentation in Russian
├── README_EN.md                    # Full documentation in English
├── LICENSE                         # License
└── .gitignore                      # Git exclusions
```

## Roadmap

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
- [ ] PWA manifest and offline support
- [ ] E2E tests (Playwright)
- [ ] LMS integration (Moodle)

---

## Author

**Dupley Maxim Igorevich**

This project is the intellectual property of Dupley Maxim Igorevich. All rights to the source code, design, content, and educational materials belong to the author.

---

## License

This project is the intellectual property of Dupley Maxim Igorevich. Terms of use are described in the [LICENSE](./LICENSE) file.

---

<div align="center">

**CyberSec Lab** — © 2025-2026 Dupley Maxim Igorevich

</div>
