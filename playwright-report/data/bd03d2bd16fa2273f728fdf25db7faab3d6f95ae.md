# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> should display login page when not authenticated
- Location: e2e\auth.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /CyberSec Lab/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /CyberSec Lab/i })

```

```yaml
- link "Перейти к основному содержимому":
  - /url: "#main-content"
- main:
  - link "CyberSec Lab Cybersecurity Training":
    - /url: /
    - text: CyberSec Lab
    - paragraph: Cybersecurity Training
  - navigation:
    - link "How It Works":
      - /url: "#how-it-works"
    - link "Features":
      - /url: "#features"
    - link "Reviews":
      - /url: "#reviews"
    - link "FAQ":
      - /url: "#faq"
    - link "About":
      - /url: /about
  - button "Выбрать язык": EN
  - button "Сменить тему"
  - link "Log In":
    - /url: /login
    - button "Log In"
  - link "Register":
    - /url: /register
    - button "Register"
  - text: Program 09.03.04 Software Engineering
  - heading "Cybersecurity Training Platform" [level=1]
  - paragraph: Learn web application vulnerabilities, complete interactive quizzes, and earn certificates. Practical cybersecurity education for students and developers.
  - link "Start Learning":
    - /url: /register
    - button "Start Learning"
  - link "Learn More":
    - /url: "#how-it-works"
    - button "Learn More"
  - text: 8 модулей 136 квизов 16 лабораторных
  - img "Animated code terminal":
    - text: "vulnerability.js 1 // Vulnerable code - find the bug! 2 3 app.post('/login', (req, res) => { 4 const { username, password } = req.body; 5 6 const query = ` 7 SELECT * FROM users 8 WHERE username = '${username}' 9 AND password = '${password}'` 10 11 // ⚠️ SQL Injection vulnerability! 12 db.query(query, (err, result) => { 13 if (result.length > 0) { 14 req.session.user = result[0]; 15 res.redirect('/dashboard'); 16 } 17 }); 18 });"
    - button "Replay"
  - paragraph: Модулей
  - paragraph: "8"
  - text: Актуально 2026
  - paragraph: Квизов
  - paragraph: "136"
  - text: С проверкой
  - paragraph: Лабораторных
  - paragraph: "16"
  - text: Практика
  - paragraph: Достижений
  - paragraph: 20+
  - text: Геймификация
  - region "Statistics":
    - text: Статистика платформы
    - heading "Масштабное обучение" [level=2]
    - paragraph: Комплексная программа по кибербезопасности с практическими заданиями
    - text: 0 Modules 0+ Quiz Questions 0 Achievements 0 Career Paths
  - region "Key Cybersecurity Topics":
    - text: Learning Topics
    - heading "Key Cybersecurity Topics" [level=2]
    - paragraph: Comprehensive learning program covering all aspects of web application security
    - heading "OWASP Top 10" [level=3]
    - paragraph: Изучите 10 наиболее критических уязвимостей веб-приложений
    - list:
      - listitem: Инъекции
      - listitem: XSS атаки
      - listitem: Небезопасная аутентификация
      - listitem: XXE уязвимости
    - heading "Криптография" [level=3]
    - paragraph: Основы шифрования и защиты данных
    - list:
      - listitem: Хеширование
      - listitem: Симметричное шифрование
      - listitem: Асимметричное шифрование
      - listitem: Цифровые подписи
    - heading "Secure Coding" [level=3]
    - paragraph: Принципы безопасного программирования
    - list:
      - listitem: Валидация входных данных
      - listitem: Санитизация вывода
      - listitem: Обработка ошибок
      - listitem: Логирование
    - heading "Защита данных" [level=3]
    - paragraph: Безопасное хранение и обработка информации
    - list:
      - listitem: SQL инъекции
      - listitem: NoSQL инъекции
      - listitem: Защита PII
      - listitem: GDPR compliance
    - heading "Сетевая безопасность" [level=3]
    - paragraph: Защита сетевых протоколов и коммуникаций
    - list:
      - listitem: HTTPS/TLS
      - listitem: CORS политики
      - listitem: Content Security Policy
      - listitem: Защита от DDoS
    - heading "Пентестинг" [level=3]
    - paragraph: Методологии тестирования на проникновение
    - list:
      - listitem: Разведка
      - listitem: Сканирование
      - listitem: Эксплуатация
      - listitem: Постэксплуатация
    - heading "Bug Bounty" [level=3]
    - paragraph: Поиск и описание уязвимостей для программ вознаграждений
    - list:
      - listitem: Поиск уязвимостей
      - listitem: Написание отчётов
      - listitem: Triaging
      - listitem: Responsible disclosure
    - heading "Аутентификация" [level=3]
    - paragraph: Системы управления доступом и идентификации
    - list:
      - listitem: OAuth 2.0
      - listitem: JWT токены
      - listitem: MFA/2FA
      - listitem: Session management
  - region "How It Works":
    - text: Simple Process
    - heading "How It Works" [level=2]
    - paragraph: Four simple steps from registration to certification
    - text: "1"
    - heading "Sign Up" [level=3]
    - paragraph: Create an account in 30 seconds
    - text: Начать сейчас 2
    - heading "Choose a Module" [level=3]
    - paragraph: OWASP Top 10, SQL Injection, XSS, CSRF, and more
    - text: Начать сейчас 3
    - heading "Solve Quizzes" [level=3]
    - paragraph: 136+ hands-on exercises with instant feedback
    - text: Начать сейчас 4
    - heading "Get Certified" [level=3]
    - paragraph: Complete a module and earn a certificate
    - text: Начать сейчас
  - region "Everything for Cybersecurity Learning":
    - text: Возможности платформы
    - heading "Everything for Cybersecurity Learning" [level=2]
    - paragraph: Theory, practice, and analytics in one system
    - heading "8 Interactive Modules" [level=3]
    - paragraph: OWASP Top 10, SQL Injection, XSS, CSRF, and more with hands-on exercises
    - text: Включено в программу
    - heading "136+ Quiz Questions" [level=3]
    - paragraph: Test knowledge across 9 categories
    - text: Включено в программу
    - heading "Achievement System" [level=3]
    - paragraph: Earn rewards and stay motivated
    - text: Включено в программу
    - heading "Progress Analytics" [level=3]
    - paragraph: Track progress with charts and reports
    - text: Включено в программу
    - heading "LTI Integration" [level=3]
    - paragraph: Integration with Moodle, Canvas via LTI 1.3
    - text: Включено в программу
    - heading "Teacher and Admin Roles" [level=3]
    - paragraph: Manage students, groups, and courses
    - text: Включено в программу
  - text: Technologies & Standards
  - heading "Learn Key Technologies" [level=2]
  - paragraph: The course program covers all major aspects of web application cybersecurity
  - heading "OWASP Top 10" [level=3]
  - paragraph: Learn the 10 most critical web application vulnerabilities
  - text: Injection XSS CSRF SSRF
  - heading "Security Headers" [level=3]
  - paragraph: Configure security headers to protect your application
  - text: CSP HSTS X-Frame-Options CORS
  - heading "Secure Coding" [level=3]
  - paragraph: Master the principles of secure code development
  - text: Валидация Санитизация Шифрование Хеширование
  - heading "Penetration Testing" [level=3]
  - paragraph: Learn to test applications for vulnerabilities
  - text: Reconnaissance Scanning Exploitation Reporting
  - heading "SQL Security" [level=3]
  - paragraph: Protect databases from attacks and leaks
  - text: Prepared Statements ORM Security Access Control Audit
  - heading "Network Security" [level=3]
  - paragraph: Ensure network-level security
  - text: TLS/SSL Firewall DDoS Protection VPN 100% OWASP Top 10 Coverage 16 Laboratory Works 8 Certificates 1000+ Students Программа обучения
  - heading "Путь от новичка до профи" [level=2]
  - paragraph: 8 модулей, которые проведут вас через все аспекты кибербезопасности веб-приложений
  - text: 01 Модуль 01 2 недели
  - heading "OWASP Top 10" [level=3]
  - paragraph: Изучите 10 наиболее критических уязвимостей веб-приложений
  - text: Injection Broken Authentication XSS Insecure Deserialization 12 уроков 18 квизов 02 Модуль 02 1 неделя
  - heading "Security Headers" [level=3]
  - paragraph: Настройте заголовки HTTP для защиты от атак
  - text: CSP HSTS X-Frame-Options CORS 8 уроков 14 квизов 03 Модуль 03 2 недели
  - heading "Secure Coding" [level=3]
  - paragraph: Принципы написания безопасного кода
  - text: Input Validation Output Encoding Error Handling Logging 15 уроков 20 квизов 04 Модуль 04 1.5 недели
  - heading "SQL Security" [level=3]
  - paragraph: Защита баз данных от атак и утечек
  - text: SQL Injection Prepared Statements Access Control Encryption 10 уроков 16 квизов 05 Модуль 05 1.5 недели
  - heading "XSS & CSRF" [level=3]
  - paragraph: Защита от межсайтовых атак
  - text: Reflected XSS Stored XSS DOM XSS CSRF Tokens 11 уроков 15 квизов 06 Модуль 06 2 недели
  - heading "Network Security" [level=3]
  - paragraph: Безопасность сетевого уровня
  - text: TLS/SSL Firewall DDoS Protection VPN 14 уроков 18 квизов 07 Модуль 07 1.5 недели
  - heading "Security Tools" [level=3]
  - paragraph: Инструменты для тестирования безопасности
  - text: Burp Suite OWASP ZAP Nmap Wireshark 12 уроков 16 квизов 08 Модуль 08 3 недели
  - heading "Final Project" [level=3]
  - paragraph: Комплексный проект по аудиту безопасности
  - text: Security Audit Penetration Test Report Writing Remediation 5 уроков 19 квизов
  - link "Начать обучение бесплатно":
    - /url: /register
    - button "Начать обучение бесплатно"
  - region "Start in 4 Simple Steps":
    - text: Getting Started
    - heading "Start in 4 Simple Steps" [level=2]
    - paragraph: From registration to certification — just a few steps away
    - text: "01"
    - heading "Выберите модуль" [level=3]
    - paragraph: Начните с базового модуля или выберите тему по интересам
    - list:
      - listitem: OWASP Top 10
      - listitem: Криптография
      - listitem: Secure Coding
      - listitem: Пентестинг
    - text: "02"
    - heading "Изучайте теорию" [level=3]
    - paragraph: Пройдите интерактивные уроки с примерами кода
    - list:
      - listitem: Видеолекции
      - listitem: Статьи
      - listitem: Примеры кода
      - listitem: Диаграммы
    - text: "03"
    - heading "Практикуйтесь" [level=3]
    - paragraph: Решайте практические задания в безопасной среде
    - list:
      - listitem: Песочницы
      - listitem: CTF задачи
      - listitem: Реальные кейсы
      - listitem: Автотесты
    - text: "04"
    - heading "Получите сертификат" [level=3]
    - paragraph: Сдайте финальный тест и получите сертификат
    - list:
      - listitem: Онлайн экзамен
      - listitem: Сертификат с ID
      - listitem: Верификация
      - listitem: LinkedIn
    - link "Start Learning Now":
      - /url: /register
  - text: Who This Course Is For
  - heading "Perfect for Everyone" [level=2]
  - paragraph: Regardless of your skill level, you'll find the right learning format
  - heading "For Students" [level=3]
  - paragraph: Practical skills to start a career in cybersecurity
  - list:
    - listitem: Interactive laboratory works
    - listitem: 136 quizzes for self-assessment
    - listitem: Certificates upon module completion
    - listitem: Gamified learning
    - listitem: Interview preparation
  - link "Start Learning":
    - /url: /register
    - button "Start Learning"
  - heading "For Teachers" [level=3]
  - paragraph: Ready-made materials for teaching security
  - list:
    - listitem: 8 ready-to-use learning modules
    - listitem: Automatic assignment grading
    - listitem: Student progress tracking
    - listitem: Teaching materials
    - listitem: LMS integration
  - link "For Teachers":
    - /url: /register
    - button "For Teachers"
  - heading "For Companies" [level=3]
  - paragraph: Employee upskilling in cybersecurity
  - list:
    - listitem: Corporate pricing
    - listitem: Employee analytics
    - listitem: Custom programs
    - listitem: Team certification
    - listitem: Reduced leak risks
  - link "For Business":
    - /url: /register
    - button "For Business"
  - text: 24/7 Online Access Secure Environment Quick Start Certificates Progress Analytics Mentor Support
  - region "Recognition of Your Achievements":
    - text: Certification
    - heading "Recognition of Your Achievements" [level=2]
    - paragraph: Get official certificates and unlock new career opportunities
    - heading "Официальные сертификаты" [level=3]
    - paragraph: Получите сертификаты с уникальным ID для проверки работодателем
    - heading "Верификация навыков" [level=3]
    - paragraph: Подтвердите свои знания перед потенциальными работодателями
    - heading "Геймификация" [level=3]
    - paragraph: Зарабатывайте баллы, достижения и поднимайтесь в рейтинге
    - heading "Карьерный рост" [level=3]
    - paragraph: Наши выпускники работают в ведущих IT-компаниях
    - heading "Сообщество" [level=3]
    - paragraph: Присоединяйтесь к сообществу из 10000+ студентов и экспертов
    - heading "Международное признание" [level=3]
    - paragraph: Сертификаты признаются работодателями по всему миру
    - heading "Быстрый старт" [level=3]
    - paragraph: Начните обучение бесплатно и получите первые навыки за 1 день
    - text: 85%
    - paragraph: Выпускников находят работу в течение 3 месяцев
    - text: "8"
    - paragraph: Интерактивных модулей
    - text: 10000+
    - paragraph: Успешных выпускников
    - text: 95%
    - paragraph: Рекомендуют платформу друзьям
  - region "Try for Free":
    - text: Популярные модули
    - heading "Try for Free" [level=2]
    - paragraph: Start with these modules
    - text: Beginner OWASP Top 10 Learn the 10 most critical web security risks 10 lessons ~150 мин A M D +120 прошли
    - link "Try Now":
      - /url: /register
      - button "Try Now"
    - text: Beginner Authentication Build reliable authentication systems 5 lessons ~75 мин A M D +120 прошли
    - link "Try Now":
      - /url: /register
      - button "Try Now"
    - text: Beginner Security Tools Master security analysis tools 4 lessons ~60 мин A M D +120 прошли
    - link "Try Now":
      - /url: /register
      - button "Try Now"
    - text: Medium Phishing Analyzer Identify phishing and social engineering 6 lessons ~90 мин A M D +120 прошли
    - link "Try Now":
      - /url: /register
      - button "Try Now"
    - link "Register and access all modules":
      - /url: /register
      - button "Register and access all modules"
  - region "What Our Students Say":
    - text: Student Reviews
    - heading "What Our Students Say" [level=2]
    - paragraph: Reviews from AUP University students
    - text: АК
    - heading "Andrey Kuznetsov" [level=4]
    - paragraph: 3rd year student, AUP University
    - 'img "Rating: 5 out of 5"'
    - paragraph: The platform helped me understand SQL injection in practice. Theory in textbooks is one thing, but when you write queries yourself and see the result — that's a completely different experience.
    - text: SQL Injection module Проверенный отзыв ДМ
    - heading "Daria Morozova" [level=4]
    - paragraph: 2nd year student, AUP University
    - 'img "Rating: 5 out of 5"'
    - paragraph: The XSS module opened my eyes to how vulnerable real websites are. Now I notice potential issues immediately when reviewing code.
    - text: 100% in XSS Module Проверенный отзыв МВ
    - heading "Maxim Volkov" [level=4]
    - paragraph: 4th year student, AUP University
    - 'img "Rating: 5 out of 5"'
    - paragraph: Completed all modules before graduation. At a job interview in an IT company, they asked cybersecurity questions — everything came in handy.
    - text: All modules done Проверенный отзыв ЕЛ
    - heading "Ekaterina Lebedeva" [level=4]
    - paragraph: 1st year student, AUP University
    - 'img "Rating: 5 out of 5"'
    - paragraph: Started from scratch, was afraid it would be difficult. But the platform explains everything in simple language with examples. Highly recommend for beginners.
    - text: Beginning Analyst Проверенный отзыв ПС
    - heading "Pavel Sidorov" [level=4]
    - paragraph: 3rd year student, AUP University
    - 'img "Rating: 5 out of 5"'
    - paragraph: Interactive lab sessions are much better than just reading about vulnerabilities. You see the attack firsthand and understand how to defend against it.
    - text: CSRF module Проверенный отзыв АП
    - heading "Anastasia Popova" [level=4]
    - paragraph: 2nd year student, AUP University
    - 'img "Rating: 5 out of 5"'
    - paragraph: Thanks to the platform, I successfully completed an internship in the information security department. The supervisor praised my practical skills.
    - text: Internship completed Проверенный отзыв АК ДМ МВ ЕЛ Студенты ЧОУ ВО АУП 98% рекомендуют
  - heading "Screenshot Gallery" [level=2]
  - paragraph: See what the platform looks like from the inside
  - button "All"
  - button "Interface"
  - button "Modules"
  - button "Labs"
  - button "Tools"
  - button "Quiz"
  - button "Achievements"
  - img "Main Page"
  - paragraph: Main Page
  - text: interface
  - img "Registration"
  - paragraph: Registration
  - text: interface
  - img "Profile"
  - paragraph: Profile
  - text: interface
  - img "Learning Modules"
  - paragraph: Learning Modules
  - text: modules
  - img "OWASP Top 10"
  - paragraph: OWASP Top 10
  - text: modules
  - img "SQL Injection"
  - paragraph: SQL Injection
  - text: modules
  - img "CSRF Attacks"
  - paragraph: CSRF Attacks
  - text: modules
  - img "XSS Attack Lab"
  - paragraph: XSS Attack Lab
  - text: labs
  - img "Secure Coding"
  - paragraph: Secure Coding
  - text: modules
  - img "Security Headers"
  - paragraph: Security Headers
  - text: tools
  - img "Security Tools"
  - paragraph: Security Tools
  - text: tools
  - img "Quizzes"
  - paragraph: Quizzes
  - text: quiz
  - img "Achievements"
  - paragraph: Achievements
  - text: achievements
  - img "Glossary"
  - paragraph: Glossary
  - text: interface
  - region "Call to action":
    - heading "Ready to Start Learning?" [level=2]
    - paragraph: Join thousands of students learning cybersecurity
    - text: 1000+ Студентов обучается 500+ Сертификатов 30 сек На регистрацию
    - link "Start for Free":
      - /url: /register
      - button "Start for Free"
    - text: Бесплатный доступ Без кредитной карты Мгновенный старт
    - paragraph: No credit card · Free modules · Instant access
  - region "Frequently Asked Questions":
    - text: FAQ
    - heading "Frequently Asked Questions" [level=2]
    - paragraph: Popular questions about the platform
    - heading "Is the platform free?" [level=3]:
      - button "Is the platform free?"
    - heading "Do I need programming knowledge?" [level=3]:
      - button "Do I need programming knowledge?"
    - heading "How does LTI integration work?" [level=3]:
      - button "How does LTI integration work?"
    - heading "Can I track student progress?" [level=3]:
      - button "Can I track student progress?"
    - heading "Are there certificates?" [level=3]:
      - button "Are there certificates?"
    - heading "What topics are covered?" [level=3]:
      - button "What topics are covered?"
    - heading "How to register a teacher account?" [level=3]:
      - button "How to register a teacher account?"
    - paragraph: Не нашли ответ на свой вопрос?
    - text: Напишите нам в поддержку
  - link "CyberSec Lab":
    - /url: /
  - paragraph: Interactive cybersecurity education platform.
  - link "GitHub":
    - /url: https://github.com
  - link "Email":
    - /url: mailto:contact@cyberseclab.ru
  - text: Сделано с для образования
  - navigation "Footer navigation":
    - heading "Platform" [level=4]
    - list:
      - listitem:
        - link "Modules":
          - /url: /#demo
      - listitem:
        - link "Features":
          - /url: /#features
      - listitem:
        - link "Pricing":
          - /url: /pricing
      - listitem:
        - link "LTI Integration":
          - /url: /#features
    - heading "Resources" [level=4]
    - list:
      - listitem:
        - link "Documentation":
          - /url: "#"
      - listitem:
        - link "Guide":
          - /url: "#"
      - listitem:
        - link "Blog":
          - /url: "#"
      - listitem:
        - link "OWASP Top 10":
          - /url: "#"
    - heading "Company" [level=4]
    - list:
      - listitem:
        - link "About":
          - /url: /about
      - listitem:
        - link "Contact":
          - /url: /contact
      - listitem:
        - link "Careers":
          - /url: /about
    - heading "Legal" [level=4]
    - list:
      - listitem:
        - link "Privacy":
          - /url: "#"
      - listitem:
        - link "Terms":
          - /url: "#"
      - listitem:
        - link "Cookies":
          - /url: "#"
  - paragraph: © CyberSec Lab. All rights reserved. 2026
  - text: 8 modules 1000+ students 136+ quizzes
- region "Notifications alt+T"
- button "Open Tanstack query devtools":
  - img
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication Flow', () => {
  4  |   test('should display login page when not authenticated', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await expect(page).toHaveTitle(/CyberSec Lab/);
  7  |     // Should show login form
> 8  |     await expect(page.getByRole('heading', { name: /CyberSec Lab/i })).toBeVisible();
     |                                                                        ^ Error: expect(locator).toBeVisible() failed
  9  |   });
  10 | 
  11 |   test('should login with default admin credentials', async ({ page }) => {
  12 |     await page.goto('/');
  13 |     // Fill login form
  14 |     await page
  15 |       .getByLabel(/почта|телефон|email/i)
  16 |       .first()
  17 |       .fill('admin@cybersec.lab');
  18 |     await page
  19 |       .getByLabel(/пароль/i)
  20 |       .first()
  21 |       .fill('Admin@123');
  22 |     await page.getByRole('button', { name: /войти/i }).click();
  23 | 
  24 |     // Should navigate to dashboard
  25 |     await expect(page.getByRole('heading', { name: /панель/i })).toBeVisible({ timeout: 10000 });
  26 |   });
  27 | 
  28 |   test('should show error for invalid credentials', async ({ page }) => {
  29 |     await page.goto('/');
  30 |     await page
  31 |       .getByLabel(/почта|телефон|email/i)
  32 |       .first()
  33 |       .fill('wrong@test.com');
  34 |     await page
  35 |       .getByLabel(/пароль/i)
  36 |       .first()
  37 |       .fill('wrongpassword');
  38 |     await page.getByRole('button', { name: /войти/i }).click();
  39 | 
  40 |     // Should show error toast
  41 |     await expect(page.getByText(/неверный/i)).toBeVisible({ timeout: 5000 });
  42 |   });
  43 | });
  44 | 
```