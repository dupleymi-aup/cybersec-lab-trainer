'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { achievements as achievementDefs } from '@/lib/data';
import { getAchievementStatus, countUnlockedAchievements } from '@/lib/achievement-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Trophy,
  Search,
  Lock as LockIcon,
  BookOpen,
  Flame,
  Star,
  Target,
  Shield,
  Code,
  Database,
  GraduationCap,
  KeyRound,
} from 'lucide-react';

const glossaryTerms: { term: string; definition: string; category: string }[] = [
  { term: 'OWASP', definition: 'Open Worldwide Application Security Project — некоммерческая организация, разрабатывающая стандарты и инструменты безопасности веб-приложений. Наиболее известна по OWASP Top 10.', category: 'Организации' },
  { term: 'SQL-инъекция', definition: 'Тип атаки, при котором злоумышленник вставляет SQL-код в запрос через пользовательский ввод. Позволяет читать, модифицировать и удалять данные в базе данных.', category: 'Уязвимости' },
  { term: 'XSS (Cross-Site Scripting)', definition: 'Внедрение вредоносного скрипта в веб-страницу, который выполняется в браузере жертвы. Бывает отражённым, хранимым и DOM-based.', category: 'Уязвимости' },
  { term: 'CSRF (Cross-Site Request Forgery)', definition: 'Атака, заставляющая браузер аутентифицированного пользователя выполнить нежелательное действие на целевом сайте с помощью подделки запроса.', category: 'Уязвимости' },
  { term: 'SSRF (Server-Side Request Forgery)', definition: 'Атака, заставляющая серверное приложение делать HTTP-запросы к внутренним ресурсам по указанию злоумышленника. Опасна в облачных средах.', category: 'Уязвимости' },
  { term: 'XSSI (Cross-Site Script Inclusion)', definition: 'Атака, при которой злоумышленник включает чувствительные JavaScript-файлы (содержащие данные) со стороннего сайта, обходя Same-Origin Policy.', category: 'Уязвимости' },
  { term: 'Хеширование', definition: 'Однонаправленное преобразование данных произвольной длины в строку фиксированной длины. Используется для хранения паролей и проверки целостности данных.', category: 'Криптография' },
  { term: 'Соль (Salt)', definition: 'Случайные данные, добавляемые к паролю перед хешированием. Предотвращает использование rainbow tables и обеспечивает уникальные хеши для одинаковых паролей.', category: 'Криптография' },
  { term: 'bcrypt', definition: 'Адаптивная хеш-функция на основе Blowfish. Специально разработана для хеширования паролей, включает соль и настраиваемый фактор стоимости.', category: 'Криптография' },
  { term: 'Argon2', definition: 'Победитель конкурса PHC (Password Hashing Competition). Поддерживает настраиваемое использование памяти и времени, устойчив к GPU-атакам.', category: 'Криптография' },
  { term: 'JWT (JSON Web Token)', definition: 'Компактный, URL-безопасный токен из трёх частей (Header.Payload.Signature) для передачи информации между сторонами. Используется для аутентификации.', category: 'Аутентификация' },
  { term: 'OAuth 2.0', definition: 'Протокол авторизации, позволяющий приложениям получать ограниченный доступ к аккаунтам пользователей на других сервисах без передачи пароля.', category: 'Аутентификация' },
  { term: 'MFA (Многофакторная аутентификация)', definition: 'Использование двух и более факторов для подтверждения личности: что-то, что вы знаете (пароль), что-то, что у вас есть (телефон), что-то, что вы есть (биометрия).', category: 'Аутентификация' },
  { term: 'WAF (Web Application Firewall)', definition: 'Межсетевой экран для веб-приложений, фильтрующий HTTP-трафик между приложением и интернетом. Обнаруживает и блокирует атаки.', category: 'Защита' },
  { term: 'CORS (Cross-Origin Resource Sharing)', definition: 'Механизм безопасности браузера, контролирующий запросы к ресурсам с других доменов. Использует заголовки Access-Control-* для разрешения/запрета.', category: 'Защита' },
  { term: 'Same-Origin Policy', definition: 'Фундаментальная политика безопасности браузера, запрещающая веб-странице получать доступ к ресурсам другого домена без явного разрешения.', category: 'Защита' },
  { term: 'HTTPS / TLS', definition: 'Протокол шифрования передачи данных между клиентом и сервером. Обеспечивает конфиденциальность (шифрование), целостность (нет модификаций) и аутентификацию.', category: 'Сеть' },
  { term: 'TLS 1.3', definition: 'Последняя версия протокола TLS. Упрощённое рукопожатие (1-RTT), удалены устаревшие алгоритмы, обязательное шифрование. Рекомендуется для всех новых проектов.', category: 'Сеть' },
  { term: 'Rate Limiting', definition: 'Ограничение количества запросов от одного клиента за определённый период. Защищает от брутфорса, DDoS и перечисления пользователей.', category: 'Защита' },
  { term: 'Brute Force', definition: 'Метод атаки путём полного перебора всех возможных вариантов (паролей, ключей). Эффективен при слабых паролях. Противодействие: Rate Limiting, блокировка аккаунта.', category: 'Атаки' },
  { term: 'Rainbow Table', definition: 'Предварительно вычисленная таблица хешей для быстрого взлома паролей. Соль делает rainbow tables бесполезными.', category: 'Атаки' },
  { term: 'Session Hijacking', definition: 'Перехват сессионного токена злоумышленником для получения доступа к сессии аутентифицированного пользователя. Защита: HttpOnly, Secure, SameSite cookies.', category: 'Атаки' },
  { term: 'Clickjacking', definition: 'Атака, при которой невидимый вредоносный элемент накладывается на легитимную кнопку/ссылку. Защита: X-Frame-Options, CSP frame-ancestors.', category: 'Атаки' },
  { term: 'DOM Clobbering', definition: 'Техника внедрения HTML-элементов с определёнными id/name для перезаписи DOM-свойств документа, что может привести к изменению логики приложения.', category: 'Атаки' },
  { term: 'Prototype Pollution', definition: 'Атака на JavaScript-приложения через модификацию прототипа Object, которая может привести к изменению поведения приложения и выполнению произвольного кода.', category: 'Атаки' },
  { term: 'Prepared Statement', definition: 'Параметризованный SQL-запрос, в котором данные передаются отдельно от SQL-кода. Полностью предотвращает SQL-инъекции.', category: 'Защита' },
  { term: 'Sanitization', definition: 'Процесс очистки входных данных от потенциально опасного содержимого (HTML-теги, скрипты, спецсимволы) перед использованием в приложении.', category: 'Защита' },
  { term: 'XSS Payload', definition: 'Вредоносный код (обычно JavaScript), внедряемый при XSS-атаке. Может варьироваться от простого alert() до сложных фреймворков для кражи данных.', category: 'Уязвимости' },
  { term: 'Penetration Testing', definition: 'Метод тестирования безопасности, при котором авторизованный специалист имитирует атаки на систему для обнаружения уязвимостей до того, как это сделают злоумышленники.', category: 'Методологии' },
  { term: 'Threat Modeling', definition: 'Процесс систематической идентификации угроз и уязвимостей архитектуры приложения на этапе проектирования (STRIDE, DREAD, PASTA).', category: 'Методологии' },
  { term: 'OWASP ZAP', definition: 'Zed Attack Proxy — бесплатный инструмент с открытым исходным кодом для автоматизированного и ручного тестирования безопасности веб-приложений.', category: 'Инструменты' },
  { term: 'Burp Suite', definition: 'Коммерческая платформа для тестирования безопасности веб-приложений. Включает прокси, сканер уязвимостей, инструмент повторного воспроизведения запросов.', category: 'Инструменты' },
  { term: 'Nmap', definition: 'Утилита для сканирования портов и обнаружения служб в сети. Используется для аудита безопасности и обнаружения открытых портов на серверах.', category: 'Инструменты' },
  // --- Additional Terms ---
  { term: 'IDOR', definition: 'Insecure Direct Object Reference — уязвимость, при которой пользователь может получить доступ к данным другого пользователя, изменив идентификатор объекта в запросе (например, /api/users/5 вместо /api/users/3).', category: 'Уязвимости' },
  { term: 'Open Redirect', definition: 'Уязвимость, позволяющая перенаправить пользователя на произвольный внешний URL через параметр приложения. Используется в фишинговых атаках для придания доверия ссылке.', category: 'Уязвимости' },
  { term: 'Path Traversal', definition: 'Атака, при которой злоумышленник получает доступ к файлам за пределами разрешённой директории через манипуляцию путями (например, ../../../etc/passwd).', category: 'Уязвимости' },
  { term: 'XXE (XML External Entity)', definition: 'Инъекция внешних сущностей в XML-парсер. Позволяет читать локальные файлы, выполнять SSRF и DoS-атаки. Возникает при включённой обработке DTD в XML-парсере.', category: 'Уязвимости' },
  { term: 'Deserialization Attack', definition: 'Атака через небезопасную десериализацию объектов. Злоумышленник создаёт вредоносный сериализованный объект, который при десериализации выполняет произвольный код.', category: 'Уязвимости' },
  { term: 'HMAC', definition: 'Hash-based Message Authentication Code — механизм проверки целостности и подлинности сообщения с использованием криптографического хеша и секретного ключа.', category: 'Криптография' },
  { term: 'AES', definition: 'Advanced Encryption Standard — симметричный алгоритм блочного шифрования. Использует ключи 128, 192 или 256 бит. Является стандартом для шифрования данных.', category: 'Криптография' },
  { term: 'RSA', definition: 'Асимметричный алгоритм шифрования, использующий пару ключей (публичный и приватный). Применяется для шифрования, цифровых подписей и обмена ключами.', category: 'Криптография' },
  { term: 'SAML', definition: 'Security Assertion Markup Language — стандарт для обмена данными аутентификации и авторизации между Identity Provider и Service Provider. Используется в SSO.', category: 'Аутентификация' },
  { term: 'SSO (Single Sign-On)', definition: 'Единый вход — механизм, позволяющий пользователю аутентифицироваться один раз и получить доступ к нескольким приложениям без повторного ввода пароля.', category: 'Аутентификация' },
  { term: 'RBAC', definition: 'Role-Based Access Control — модель контроля доступа, в которой права назначаются ролям, а пользователи получают роли. Упрощает управление правами в крупных организациях.', category: 'Защита' },
  { term: 'Input Validation', definition: 'Процесс проверки входных данных на соответствие ожидаемому формату, типу, диапазону и длине. Первый уровень защиты от инъекций и других атак.', category: 'Защита' },
  { term: 'Security Headers', definition: 'Набор HTTP-заголовков для усиления безопасности: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Настраиваются на сервере.', category: 'Защита' },
  { term: 'Metasploit', definition: 'Фреймворк для разработки и выполнения эксплойтов. Используется пентестерами для проверки безопасности систем. Содержит базу данных эксплойтов и payloads.', category: 'Инструменты' },
  { term: 'Wireshark', definition: 'Анализатор сетевого трафика с открытым исходным кодом. Позволяет захватывать и анализировать пакеты, проверять TLS-соединения, обнаруживать аномалии.', category: 'Инструменты' },
  { term: 'STRIDE', definition: 'Модель классификации угроз: Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege. Используется при Threat Modeling для систематической идентификации угроз.', category: 'Методологии' },
  // --- Additional Terms ---
  { term: 'DoS / DDoS', definition: 'Denial of Service / Distributed DoS — атака на доступность, цель которой сделать сервис недоступным для легитимных пользователей. DDoS использует множество источников (ботнет).', category: 'Атаки' },
  { term: 'DNS (Domain Name System)', definition: 'Распределённая система преобразования доменных имён (example.com) в IP-адреса (93.184.216.34). Атаки на DNS включают spoofing, poisoning и hijacking.', category: 'Сеть' },
  { term: 'DNS Spoofing', definition: 'Атака, при которой злоумышленник подменяет DNS-ответ, направляя жертву на поддельный сервер вместо легитимного. Защита: DNSSEC (подписанные DNS-записи).', category: 'Атаки' },
  { term: 'Certificate Pinning', definition: 'Механизм, при котором клиент «привязывается» к конкретному SSL-сертификату или CA. Даже если злоумышленник получит поддельный сертификат, соединение будет отклонено.', category: 'Защита' },
  { term: 'HSTS (HTTP Strict Transport Security)', definition: 'HTTP-заголовок, предписывающий браузеру всегда использовать HTTPS для данного домена. Предотвращает downgrade-атаки и SSL-stripping.', category: 'Защита' },
  { term: '0-day (Zero-Day)', definition: 'Уязвимость, о которой разработчик ещё не знает или для которой нет патча. Злоумышленники могут эксплуатировать её до выпуска исправления.', category: 'Атаки' },
  { term: 'WORM', definition: 'Write Once, Read Many — модель хранения данных, при которой записанные данные нельзя изменить или удалить. Используется для защиты логов безопасности от модификации.', category: 'Защита' },
  { term: 'CIA Triad', definition: 'Confidentiality, Integrity, Availability — фундаментальная модель информационной безопасности: конфиденциальность (данные доступны только авторизованным), целостность (данные не изменены), доступность (данные доступны когда нужны).', category: 'Методологии' },
  { term: 'Non-repudiation', definition: 'Свойство системы, гарантирующее, что сторона не может отрицать участие в транзакции. Обеспечивается цифровыми подписями и журналированием.', category: 'Методологии' },
  { term: 'Security Misconfiguration', definition: 'OWASP A05 — уязвимость, вызванная неправильной настройкой приложения: включённая отладка в продакшене, стандартные пароли, открытые облачные хранилища, отсутствие защитных заголовков.', category: 'Уязвимости' },
  { term: 'Broken Authentication', definition: 'OWASP A07 — ошибки в механизмах аутентификации: слабые пароли, отсутствие MFA, предсказуемые сессионные токены, уязвимые механизмы восстановления пароля.', category: 'Уязвимости' },
  { term: 'Credential Stuffing', definition: 'Автоматизированная попытка входа на множестве сервисов с использованием email/паролей из одной утечки. Люди часто используют одинаковые пароли, что делает атаку эффективной.', category: 'Атаки' },
  { term: 'Token-based Auth', definition: 'Модель аутентификации, при которой после входа сервер выдаёт токен (JWT), который клиент предъявляет при каждом запросе. Stateless — сервер не хранит сессию.', category: 'Аутентификация' },
  { term: 'Session-based Auth', definition: 'Традиционная модель, при которой сервер хранит сессию (в памяти/БД/Redis) и отправляет клиенту session ID в cookie. Stateful — сервер должен хранить данные сессии.', category: 'Аутентификация' },
  { term: 'Refresh Token', definition: 'Долгоживущий токен, используемый для получения новых short-lived access-токенов без повторного ввода пароля. Хранится в HttpOnly cookie для безопасности.', category: 'Аутентификация' },
  { term: 'TOTP', definition: 'Time-based One-Time Password (RFC 6238) — алгоритм генерации одноразовых кодов на основе общего секрета и текущего времени. Используется в Google Authenticator, Authy.', category: 'Аутентификация' },
  { term: 'FIDO2 / WebAuthn', definition: 'Стандарты беспарольной аутентификации с использованием аппаратных ключей (YubiKey) или биометрии. Криптографически подтверждают наличие устройства — защита от фишинга.', category: 'Аутентификация' },
  { term: 'Subresource Integrity (SRI)', definition: 'Механизм проверки целостности внешних ресурсов (CDN-скрипты, стили) по хешу. Атрибут integrity="sha384-..." в теге <script> гарантирует, что файл не был модифицирован.', category: 'Защита' },
  { term: 'CSP (Content Security Policy)', definition: 'HTTP-заголовок, определяющий допустимые источники для скриптов, стилей, изображений и других ресурсов. Директива script-src \'self\' блокирует inline-скрипты — эффективная защита от XSS.', category: 'Защита' },
  { term: 'X-Content-Type-Options', definition: 'HTTP-заголовок со значением nosniff, запрещающий браузеру определять MIME-тип по содержимому. Без него .jpg-файл может быть интерпретирован как JavaScript.', category: 'Защита' },
  { term: 'Referrer-Policy', definition: 'HTTP-заголовок, контролирующий, сколько информации о предыдущей странице передаётся в заголовке Referer. strict-origin-when-cross-origin — рекомендуемое значение.', category: 'Защита' },
  { term: 'Permissions-Policy', definition: 'HTTP-заголовок, ограничивающий использование браузерных API (камера, микрофон, геолокация) для текущего документа и iframe. Замена устаревшего Feature-Policy.', category: 'Защита' },
  { term: 'Helmet.js', definition: 'Библиотека Express.js для настройки защитных HTTP-заголовков: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy и других. Устанавливается одним middleware.', category: 'Инструменты' },
  { term: 'Dependabot', definition: 'Автоматический сервис GitHub, который мониторит зависимости и создаёт PR при обнаружении уязвимостей или доступных обновлений. Поддерживает npm, pip, Maven и другие.', category: 'Инструменты' },
  { term: 'Snyk', definition: 'Платформа безопасности для разработчиков: сканирование зависимостей, контейнеров, IaC-файлов на уязвимости. Интегрируется в CI/CD для автоматической проверки.', category: 'Инструменты' },
  { term: 'SIEM', definition: 'Security Information and Event Management — платформа для сбора, корреляции и анализа логов безопасности в реальном времени. Примеры: Splunk, ELK Stack, IBM QRadar.', category: 'Инструменты' },
  { term: 'Have I Been Pwned', definition: 'Сервис Troy Hunt для проверки, не попали ли email или пароль в известные утечки данных. API позволяет интегрировать проверку в приложения.', category: 'Инструменты' },
  { term: 'OWASP Top 10', definition: 'Список 10 наиболее критических угроз безопасности веб-приложений, обновляемый каждые 3-4 года. Текущая версия — 2021. Является отраслевым стандартом для разработчиков и аудиторов.', category: 'Организации' },
  { term: 'Supply Chain Attack', definition: 'Атака через компрометацию компонентов разработки: библиотек (npm, PyPI), CI/CD-систем, инструментов сборки. Примеры: SolarWinds (2020), event-stream (2018).', category: 'Атаки' },
  { term: 'Race Condition', definition: 'Уязвимость, возникающая при одновременном выполнении операций, когда результат зависит от порядка выполнения. Пример: двойное списание средств при параллельных запросах.', category: 'Уязвимости' },
  { term: 'Avalanche Effect', definition: 'Свойство криптографических хеш-функций: изменение даже одного бита входных данных полностью меняет хеш. Хороший хеш меняет ~50% битов при одном изменённом бите входа.', category: 'Криптография' },
  { term: 'Collision', definition: 'Ситуация, когда два разных входных значения дают одинаковый хеш. MD5 и SHA-1 уязвимы к collision-атакам. SHA-256 и bcrypt считаются устойчивыми.', category: 'Криптография' },
  // --- More terms ---
  { term: 'ECC (Elliptic Curve Cryptography)', definition: 'Асимметричная криптография на основе эллиптических кривых. Обеспечивает эквивалентную стойкость с RSA при меньшем размере ключа (256 бит ECC = 3072 бит RSA). Используется в TLS 1.3, Bitcoin.', category: 'Криптография' },
  { term: 'OAuth 2.1', definition: 'Обновлённая версия OAuth 2.0: обязательный PKCE (Proof Key for Code Exchange), удаление implicit grant и resource owner password credentials. Упрощает спецификацию и повышает безопасность.', category: 'Аутентификация' },
  { term: 'PKCE', definition: 'Proof Key for Code Exchange — расширение OAuth 2.0 для защиты от authorization code interception. Генерирует code verifier и code challenge для каждого запроса. Обязателен для мобильных и SPA-приложений.', category: 'Аутентификация' },
  { term: 'OpenID Connect (OIDC)', definition: 'Протокол аутентификации поверх OAuth 2.0. Возвращает ID Token (JWT) с информацией о пользователе (sub, email, name). Используется для Single Sign-On в Google, Microsoft, GitHub.', category: 'Аутентификация' },
  { term: 'API Security', definition: 'Защита API-эндпоинтов: аутентификация (API keys, JWT, OAuth), авторизация (RBAC, ABAC), rate limiting, валидация входных данных, TLS, CORS-политика, аудит логов.', category: 'Защита' },
  { term: 'GraphQL Security', definition: 'Специфичные угрозы GraphQL: Query Depth Attack (рекурсивные запросы), Introspection (раскрытие схемы), Batch Attack (множество операций). Защита: лимит глубины, отключение introspection, complexity analysis.', category: 'Уязвимости' },
  { term: 'OWASP ASVS', definition: 'Application Security Verification Standard — подробный стандарт для оценки безопасности веб-приложений. Содержит 300+ требований по уровням: L1 (базовый), L2 (стандартный), L3 (высокий).', category: 'Организации' },
  { term: 'Zero Trust', definition: 'Модель безопасности: «никогда не доверяй, всегда проверяй». Каждый запрос аутентифицируется и авторизуется, независимо от источника. Микросегментация, MFA, минимальные привилегии.', category: 'Методологии' },
  { term: 'DevSecOps', definition: 'Интеграция безопасности в CI/CD-процесс: SAST (статический анализ), DAST (динамический анализ), SCA (анализ зависимостей), IaC-сканирование, автоматические проверки перед деплоем.', category: 'Методологии' },
  { term: 'SAST', definition: 'Static Application Security Testing — анализ исходного кода на уязвимости без запуска приложения. Обнаруживает SQLi, XSS, хардкод секреты. Примеры: SonarQube, Semgrep, CodeQL.', category: 'Инструменты' },
  { term: 'DAST', definition: 'Dynamic Application Security Testing — тестирование работающего приложения на уязвимости. Имитирует атаки злоумышленника. Примеры: OWASP ZAP, Burp Suite, Nessus.', category: 'Инструменты' },
  // --- Modern Security Terms ---
  { term: 'Prompt Injection', definition: 'Атака на LLM (большие языковые модели) через внедрение вредоносных инструкций в промпт. Может заставить модель выполнить нежелательные действия, раскрыть секреты или обойти ограничения.', category: 'Уязвимости' },
  { term: 'LLM Security', definition: 'Безопасность больших языковых моделей: защита от prompt injection, data poisoning, model theft, inference attacks. Включает OWASP Top 10 for LLM Applications.', category: 'Методологии' },
  { term: 'RAG Poisoning', definition: 'Атака на Retrieval-Augmented Generation системы через внедрение вредоносных данных в базу знаний. Модель выдаёт скомпрометированные ответы, основываясь на подставленных документах.', category: 'Атаки' },
  { term: 'Model Theft', definition: 'Кража обученной ML-модели через model extraction attacks (запросы к API для восстановления параметров) или прямой доступ к весам модели. Позволяет обойти защиту или использовать модель коммерчески.', category: 'Атаки' },
  { term: 'SBOM', definition: 'Software Bill of Materials — полный перечень компонентов программного обеспечения: библиотеки, зависимости, версии, лицензии. Необходим для управления уязвимостями и compliance (Executive Order 14028).', category: 'Защита' },
  { term: 'Secrets Management', definition: 'Управление секретами (пароли, API-ключи, токены) в приложениях и инфраструктуре. Практики: не хардкодить секреты, использовать HashiCorp Vault, AWS Secrets Manager, GitHub Secrets.', category: 'Защита' },
  { term: 'Cloud-Native Security', definition: 'Безопасность облачных нативных приложений: контейнеры (Docker), оркестрация (Kubernetes), сервис-меши (Istio), serverless. Включает защиту образов контейнеров, secrets, network policies.', category: 'Методологии' },
  { term: 'eBPF Security', definition: 'Использование extended Berkeley Packet Filter для безопасности на уровне ядра Linux: мониторинг системных вызовов, сетевых пакетов, процессов. Позволяет обнаруживать аномалии без модификации приложений.', category: 'Защита' },
];

const categoryColors: Record<string, string> = {
  'Уязвимости': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'Криптография': 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'Аутентификация': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Защита': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Сеть': 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  'Атаки': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'Организации': 'bg-muted text-muted-foreground',
  'Методологии': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'Инструменты': 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
};

const achievementIcons: Record<string, React.ReactNode> = {
  'first-steps': <BookOpen size={24} />,
  'sql-master': <Database size={24} />,
  'xss-hunter': <Code size={24} />,
  'security-guard': <Shield size={24} />,
  'auth-expert': <Target size={24} />,
  'code-reviewer': <Code size={24} />,
  'quiz-master': <Trophy size={24} />,
  'quiz-perfect': <Star size={24} />,
  'crypto-ninja': <LockIcon size={24} />,
  'full-completion': <GraduationCap size={24} />,
  'csrf-shield': <Shield size={24} />,
  'owasp-half': <Shield size={24} />,
  'quiz-all': <Trophy size={24} />,
  'crypto-explorer': <KeyRound size={24} />,
  'coding-pro': <Code size={24} />,
  'headers-guard': <Shield size={24} />,
  'coding-master': <Code size={24} />,
  'network-ninja': <Shield size={24} />,
  'social-engineer': <Target size={24} />,
  'all-headers-correct': <Shield size={24} />,
};

export default function AchievementsAndGlossary() {
  const setCurrentPage = useAppStore(s => s.setCurrentPage);
  const completedModules = useAppStore(s => s.completedModules);
  const quizScores = useAppStore(s => s.quizScores);
  const owaspChallengeScores = useAppStore(s => s.owaspChallengeScores);
  const authChallengeScores = useAppStore(s => s.authChallengeScores);
  const [activeTab, setActiveTab] = useState<'achievements' | 'glossary'>('achievements');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');

  const challengeStats = {
    owaspCorrect: owaspChallengeScores.correct,
    authCorrect: authChallengeScores.correct,
  };

  // Calculate achievements — use centralized achievement-utils
  const getAchievement = (id: string) =>
    getAchievementStatus(id, completedModules, quizScores, challengeStats);

  const unlockedCount = countUnlockedAchievements(completedModules, quizScores, challengeStats);

  const filteredTerms = glossaryTerms.filter(
    (t) =>
      (activeCategory === '' || t.category === activeCategory) &&
      (searchTerm === '' ||
        t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.definition.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')}>
          <ChevronLeft size={20} />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Trophy size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Достижения и глоссарий</h1>
          <p className="text-xs text-muted-foreground">Отслеживайте прогресс и изучайте термины</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'achievements' | 'glossary')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="achievements" className="text-xs">
            <Trophy size={14} className="mr-1" /> Достижения ({unlockedCount}/{achievementDefs.length})
          </TabsTrigger>
          <TabsTrigger value="glossary" className="text-xs">
            <BookOpen size={14} className="mr-1" /> Глоссарий ({glossaryTerms.length})
          </TabsTrigger>
        </TabsList>

        {/* ===== ACHIEVEMENTS ===== */}
        <TabsContent value="achievements" className="mt-4 space-y-4">
          <Card className="border-none shadow-sm bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm">Ваш уровень безопасности</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {unlockedCount === 0
                      ? 'Начните обучение, чтобы получить первые достижения!'
                      : unlockedCount < 5
                        ? 'Вы на правильном пути! Продолжайте изучать модули.'
                        : unlockedCount < achievementDefs.length
                          ? 'Впечатляющий прогресс! Ещё немного до полного прохождения.'
                          : 'Великолепно! Все достижения разблокированы!'}
                  </p>
                </div>
                <div className="text-3xl font-bold text-amber-600">{unlockedCount}/{achievementDefs.length}</div>
              </div>
              <div className="h-2 bg-amber-200 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${(unlockedCount / achievementDefs.length) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {achievementDefs.map((ach, i) => {
              const unlocked = getAchievement(ach.id);
              return (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`transition-all ${unlocked ? 'border-amber-300 bg-amber-50/50' : 'border-border opacity-70'}`}>
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                        unlocked ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md' : 'bg-muted text-slate-400'
                      }`}>
                        {achievementIcons[ach.id]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-semibold ${unlocked ? 'text-amber-900' : 'text-muted-foreground'}`}>
                            {ach.title}
                          </h3>
                          {unlocked && (
                            <Badge className="bg-amber-500 text-white border-0 text-[10px]">
                              <Flame size={10} className="mr-0.5" /> Получено
                            </Badge>
                          )}
                        </div>
                        <p className={`text-xs mt-1 ${unlocked ? 'text-amber-800' : 'text-slate-400'}`}>
                          {ach.description}
                        </p>
                        {!unlocked && (
                          <p className="text-[10px] text-slate-400 mt-1 italic">
                            {ach.condition}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* ===== GLOSSARY ===== */}
        <TabsContent value="glossary" className="mt-4 space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по терминам..."
              className="pl-10"
            />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={activeCategory === '' ? 'default' : 'secondary'}
              className={`text-[10px] cursor-pointer hover:opacity-80 ${
                activeCategory === '' ? '' : 'bg-muted text-foreground/70'
              }`}
              onClick={() => setActiveCategory('')}
            >
              Все ({glossaryTerms.length})
            </Badge>
            {Object.keys(categoryColors).map((cat) => {
              const count = glossaryTerms.filter(t => t.category === cat).length;
              return (
                <Badge
                  key={cat}
                  variant="secondary"
                  className={`text-[10px] cursor-pointer hover:opacity-80 ${
                    activeCategory === cat ? 'ring-2 ring-slate-400' : ''
                  } ${categoryColors[cat]}`}
                  onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)}
                >
                  {cat} ({count})
                </Badge>
              );
            })}
          </div>
          {activeCategory && (
            <p className="text-xs text-muted-foreground">
              Показано: <strong>{activeCategory}</strong> — {filteredTerms.length} терминов
              <button className="text-emerald-600 ml-1 underline" onClick={() => setActiveCategory('')}>Сбросить</button>
            </p>
          )}

          <div className="space-y-2">
            {filteredTerms.map((term, i) => (
              <motion.div
                key={term.term}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card className="border-border hover:border-emerald-200 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold font-mono">{term.term}</h3>
                      <Badge variant="secondary" className={`text-[10px] ${categoryColors[term.category] || 'bg-muted text-foreground/70'}`}>
                        {term.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{term.definition}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {filteredTerms.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-400">
                Ничего не найдено по запросу &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
