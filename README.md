<div align="center">

# CyberSec Lab — Интерактивный тренажёр по информационной безопасности

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

**CyberSec Lab** — комплексная веб-платформа для интерактивного изучения основ информационной безопасности, веб-безопасности и безопасной разработки. Платформа объединяет **8 обучающих модулей**, систему тестирования с таймером (**110+ вопросов** по 9 категориям), лабораторные работы по SQL-инъекциям, XSS, CSRF, ревью кода, криптографические инструменты, систему достижений (**16 достижений**) и глоссарий из **80+ терминов**.

Полные описания доступны на русском и английском языках:
- [README на русском языке](README_RU.md)
- [README in English](README_EN.md)

### Ключевые возможности

- **8 интерактивных модулей** — от OWASP Top 10 до Security Headers
- **110+ вопросов квиза** по 9 категориям с таймером и фильтрацией по сложности
- **11 лабораторных заданий** по SQL-инъекциям: от обхода аутентификации до WAF Bypass
- **6 типов XSS** с интерактивной демонстрацией атак
- **25 задач по ревью кода**: SQLi, XSS, IDOR, SSRF, XXE, SSTI и др.
- **Криптографические инструменты**: шифры, кодирование, хеши, генератор паролей
- **16 достижений** — мотивирующие бейджи за прогресс
- **Глоссарий из 80+ терминов** с поиском и фильтрацией

### Скриншоты платформы

<div align="center">

| | | |
|-|-|-|
| <img src="img/Регистрация.png" width="300" alt="Регистрация"> | <img src="img/Главная страница.png" width="300" alt="Главная страница"> | <img src="img/Модули обучения.png" width="300" alt="Модули обучения"> |
| <img src="img/OWASP - топ 10.png" width="300" alt="OWASP Top 10"> | <img src="img/SQL Инъекции.png" width="300" alt="SQL Инъекции"> | <img src="img/Лаборатория XSS-атак.png" width="300" alt="XSS-атаки"> |
| <img src="img/CSRF-атаки.png" width="300" alt="CSRF-атаки"> | <img src="img/Безопасное кодирование.png" width="300" alt="Безопасное кодирование"> | <img src="img/Инструменты безопасности.png" width="300" alt="Инструменты безопасности"> |
| <img src="img/Security Headers.png" width="300" alt="Security Headers"> | <img src="img/Квизы.png" width="300" alt="Квизы"> | <img src="img/Достижения.png" width="300" alt="Достижения"> |
| <img src="img/Глосарий.png" width="300" alt="Глоссарий"> | <img src="img/Личный профиль.png" width="300" alt="Личный профиль"> | |

</div>

### Модули платформы

| # | Модуль | Категория |
|---|--------|-----------|
| 1 | **OWASP Top 10** | Веб-безопасность |
| 2 | **SQL-инъекции** | Атака-защита |
| 3 | **XSS-атаки** | Атака-защита |
| 4 | **CSRF-атаки** | Атака-защита |
| 5 | **Аутентификация** | Безопасность |
| 6 | **Безопасное кодирование** | Ревью кода |
| 7 | **Security Headers** | Инфраструктура |
| 8 | **Инструменты безопасности** | Криптография |

### Технологии

| Технология | Назначение |
|------------|------------|
| **Next.js 15** | React-фреймворк с App Router и SSR |
| **TypeScript 5** | Статическая типизация |
| **React 19** | Библиотека пользовательского интерфейса |
| **Tailwind CSS 4** | Утилитарные CSS-стили |
| **shadcn/ui** | Компоненты интерфейса |
| **Zustand 5** | Управление состоянием |
| **Framer Motion 12** | Анимации и переходы |

### Быстрый старт

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

### Дорожная карта

- [x] Модуль OWASP Top 10
- [x] Лаборатория SQL-инъекций
- [x] Лаборатория XSS-атак
- [x] Симуляция CSRF-атак
- [x] Модуль аутентификации
- [x] Безопасное кодирование
- [x] Security Headers
- [x] Криптографические инструменты
- [x] Система тестирования
- [x] Система достижений и глоссарий
- [x] Аутентификация с OTP-верификацией
- [x] PWA-манифест и офлайн-работа
- [x] E2E-тесты (Playwright)
- [ ] Интеграция с LMS (Moodle)

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
