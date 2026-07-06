// ============================================================
// Phishing Email Analyzer Data
// ============================================================

export interface PhishingIndicator {
  id: string;
  type: 'header' | 'content' | 'link' | 'urgency' | 'sender' | 'attachment';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  lineRef?: string;
}

export interface PhishingEmail {
  id: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  from: string;
  to: string;
  date: string;
  headers: string;
  body: string;
  isPhishing: boolean;
  indicators: PhishingIndicator[];
  explanation: string;
}

export const phishingEmails: PhishingEmail[] = [
  {
    id: 1,
    difficulty: 'easy',
    subject: 'Срочно: Ваш аккаунт будет заблокирован!',
    from: 'support@sberbank-security.com',
    to: 'user@gmail.com',
    date: '2024-01-15 09:23:45',
    headers: `From: "Sberbank Security" <support@sberbank-security.com>
To: user@gmail.com
Subject: Срочно: Ваш аккаунт будет заблокирован!
Date: Mon, 15 Jan 2024 09:23:45 +0300
Message-ID: <abc123@sberbank-security.com>
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8
X-Mailer: PHPMailer 5.2.23
Received: from unknown-host-45.234.12.89.dynamic.isp.com (unknown-host-45.234.12.89.dynamic.isp.com [45.234.12.89])
  by mail.sberbank-security.com with ESMTP id abc123
  for <user@gmail.com>; Mon, 15 Jan 2024 09:23:45 +0300
Return-Path: <noreply@phishing-kit.ru>
Reply-To: phishing@evil.com`,
    body: `<html>
<body>
<h2>Уважаемый клиент!</h2>
<p>Ваш аккаунт в Сбербанк Онлайн будет <b style="color:red">ЗАБЛОКИРОВАН</b> в течение 24 часов.</p>
<p>Мы обнаружили подозрительную активность. Для подтверждения личности перейдите по ссылке:</p>
<p><a href="http://sberbank-verify.ru/login?token=abc123">Подтвердить аккаунт</a></p>
<p>Если вы не перейдёте по ссылке, доступ к счету будет ограничен.</p>
<p>С уважением,<br>Служба безопасности Сбербанка</p>
</body>
</html>`,
    isPhishing: true,
    indicators: [
      {
        id: 'urgency-1',
        type: 'urgency',
        severity: 'high',
        title: 'Искусственная срочность',
        description:
          '«Будет заблокирован в течение 24 часов» — классический приём создания паники, чтобы жертва действовала не думая.',
      },
      {
        id: 'sender-1',
        type: 'sender',
        severity: 'critical',
        title: 'Подозрительный домен отправителя',
        description:
          'Домен sberbank-security.com — не официальный домен Сбербанка (sberbank.ru). Злоумышленники регистрируют похожие домены.',
      },
      {
        id: 'link-1',
        type: 'link',
        severity: 'critical',
        title: 'Фишинговая ссылка',
        description:
          'Ссылка ведёт на sberbank-verify.ru — не официальный сайт Сбербанка. Официальный сайт: online.sberbank.ru.',
      },
      {
        id: 'header-1',
        type: 'header',
        severity: 'critical',
        title: 'Подозрительный Return-Path',
        description: 'Return-Path: noreply@phishing-kit.ru — явно указывает на использование фишинг-набора.',
      },
      {
        id: 'header-2',
        type: 'header',
        severity: 'high',
        title: 'Подозрительный X-Mailer',
        description: 'PHPMailer 5.2.23 — массовая рассылка через скрипт, а не через корпоративную почту.',
      },
      {
        id: 'header-3',
        type: 'header',
        severity: 'medium',
        title: 'IP отправителя из динамического диапазона',
        description: 'Received from dynamic.isp.com — легитимные банки отправляют с фиксированных серверов.',
      },
    ],
    explanation:
      'Это классическое фишинговое письмо. Злоумышленник создал домен, похожий на официальный, использует искусственную срочность и отправляет через массовый скрипт. Return-Path явно указывает на фишинг-набор.',
  },
  {
    id: 2,
    difficulty: 'medium',
    subject: 'Обновление политики конфиденциальности Google',
    from: 'noreply@google.com',
    to: 'user@gmail.com',
    date: '2024-03-20 14:00:00',
    headers: `From: "Google" <noreply@google.com>
To: user@gmail.com
Subject: Обновление политики конфиденциальности Google
Date: Wed, 20 Mar 2024 14:00:00 +0000
Message-ID: <0000018e1234abcd@google.com>
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="----=_Part"
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=20230601;
  h=from:to:subject:date:message-id; bh=abc123; b=xyz789
SPF: Pass (google.com: domain of noreply@google.com designates 142.250.80.33 as permitted sender)
Received: from mail-sor-f33.google.com (mail-sor-f33.google.com [142.250.80.33])
  by mx.google.com with ESMTPS id abc123
  for <user@gmail.com>; Wed, 20 Mar 2024 14:00:00 +0000`,
    body: `<html>
<body>
<p>Здравствуйте!</p>
<p>Мы обновили политику конфиденциальности Google. Изменения вступят в силу с 1 апреля 2024 года.</p>
<p><b>Основные изменения:</b></p>
<ul>
  <li>Улучшена прозрачность обработки данных</li>
  <li>Добавлены новые настройки конфиденциальности</li>
  <li>Обновлены условия использования Google Analytics</li>
</ul>
<p><a href="https://policies.google.com/privacy?hl=ru">Посмотреть полную версию</a></p>
<p>С уважением,<br>Команда Google</p>
</body>
</html>`,
    isPhishing: false,
    indicators: [],
    explanation:
      'Это легитимное письмо от Google. DKIM-подпись пройдена, SPF Pass, отправитель с официального IP Google (142.250.80.33), ссылка ведёт на policies.google.com — официальный домен.',
  },
  {
    id: 3,
    difficulty: 'hard',
    subject: 'Re: Invoice #4521 — Payment Confirmation',
    from: 'accounting@micr0soft.com',
    to: 'finance@company.com',
    date: '2024-05-10 11:45:22',
    headers: `From: "Microsoft Billing" <accounting@micr0soft.com>
To: finance@company.com
Subject: Re: Invoice #4521 — Payment Confirmation
Date: Fri, 10 May 2024 11:45:22 +0200
Message-ID: <inv4521@micr0soft.com>
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=micr0soft.com;
  s=default; h=from:to:subject:date; bh=def456; b=uvw012
SPF: Pass (micr0soft.com: domain of accounting@micr0soft.com designates 198.51.100.42 as permitted sender)
Received: from smtp.micr0soft.com (smtp.micr0soft.com [198.51.100.42])
  by mail.company.com with ESMTPS id xyz789
  for <finance@company.com>; Fri, 10 May 2024 11:45:22 +0200
Reply-To: support@micr0soft.com`,
    body: `<html>
<body>
<p>Dear Finance Team,</p>
<p>Thank you for your payment of <b>$2,847.50</b> for Microsoft 365 Business Premium subscription.</p>
<p>Your invoice #4521 is attached for your records.</p>
<p><a href="https://micr0soft.com/invoices/4521.pdf">View Invoice</a></p>
<p>Please note: Your subscription will auto-renew on June 10, 2024.</p>
<p>If you have any questions, contact us at support@micr0soft.com.</p>
<p>Best regards,<br>Microsoft Billing Department</p>
</body>
</html>`,
    isPhishing: true,
    indicators: [
      {
        id: 'sender-3a',
        type: 'sender',
        severity: 'critical',
        title: 'Омографическая атака (typosquatting)',
        description:
          'Домен micr0soft.com — вместо буквы "o" использован ноль "0". Это классическая омографическая атака. Официальный домен: microsoft.com.',
      },
      {
        id: 'link-3a',
        type: 'link',
        severity: 'critical',
        title: 'Ссылка на поддельный домен',
        description:
          'Ссылка ведёт на micr0soft.com (с нулём), а не microsoft.com. Злоумышленник контролирует весь домен.',
      },
      {
        id: 'header-3a',
        type: 'header',
        severity: 'high',
        title: 'DKIM подписан поддельным доменом',
        description:
          'DKIM прошёл, но для домена micr0soft.com — это не значит что домен легитимный. Злоумышленник настроил DKIM для своего домена.',
      },
      {
        id: 'content-3a',
        type: 'content',
        severity: 'medium',
        title: 'Вложение/ссылка на «инвойс»',
        description: 'Ссылка на PDF может вести на вредоносный файл или страницу загрузки малвари.',
      },
    ],
    explanation:
      'Это sophisticated фишинговое письмо с омографической атакой. Все технические проверки (DKIM, SPF) пройдены, но для поддельного домена micr0soft.com (с нулём вместо "o"). Такие атаки особенно опасны, так выглядят технически корректными.',
  },
  {
    id: 4,
    difficulty: 'easy',
    subject: 'Вы выиграли iPhone 15 Pro! Нажмите здесь!',
    from: 'winner@free-iphone-2024.xyz',
    to: 'user@mail.ru',
    date: '2024-02-28 03:15:00',
    headers: `From: "Apple Prizes" <winner@free-iphone-2024.xyz>
To: user@mail.ru
Subject: Вы выиграли iPhone 15 Pro! Нажмите здесь!
Date: Wed, 28 Feb 2024 03:15:00 +0300
Message-ID: <winner001@free-iphone-2024.xyz>
X-Mailer: BulkMailer Pro 3.1
Received: from spam-server-12.hosting.com ([185.234.219.45])
  by mail.free-iphone-2024.xyz with SMTP
  for <user@mail.ru>; Wed, 28 Feb 2024 03:15:00 +0300`,
    body: `<html>
<body style="background:linear-gradient(#ff0,#f80);text-align:center;">
<h1 style="color:red;font-size:36px;">🎉 ПОЗДРАВЛЯЕМ! 🎉</h1>
<h2>Вы стали победителем нашей акции!</h2>
<p>Ваш email выбран случайным образом и получил <b>iPhone 15 Pro Max 256GB</b></p>
<p>Для получения приза заполните форму:</p>
<p><a href="http://free-iphone-2024.xyz/claim?email=user@mail.ru" style="background:red;color:white;padding:20px;font-size:24px;">ПОЛУЧИТЬ IPHONE БЕСПЛАТНО</a></p>
<p><i>* Осталось 2 часа до окончания акции!</i></p>
</body>
</html>`,
    isPhishing: true,
    indicators: [
      {
        id: 'urgency-4a',
        type: 'urgency',
        severity: 'high',
        title: 'Фейковая срочность',
        description: '«Осталось 2 часа» — попытка заставить действовать быстро, без размышлений.',
      },
      {
        id: 'sender-4a',
        type: 'sender',
        severity: 'critical',
        title: 'Подозрительный домен',
        description: 'free-iphone-2024.xyz — явно мошеннический домен. Apple не проводит розыгрыши через email.',
      },
      {
        id: 'content-4a',
        type: 'content',
        severity: 'high',
        title: 'Слишком хорошо, чтобы быть правдой',
        description:
          '«Вы выиграли iPhone» — классическая схема. Если вы не участвовали в розыгрыше, это мошенничество.',
      },
      {
        id: 'header-4a',
        type: 'header',
        severity: 'high',
        title: 'Массовая рассылка',
        description:
          'X-Mailer: BulkMailer Pro 3.1 — софт для спам-рассылок. Apple использует корпоративные почтовые системы.',
      },
      {
        id: 'header-4b',
        type: 'header',
        severity: 'medium',
        title: 'Отправка в 3 часа ночи',
        description: 'Письмо отправлено в 03:15 — массовые рассылки часто запускают ночью.',
      },
    ],
    explanation:
      'Очевидное фишинговое письмо. Розыгрыши Apple через email не проводятся. Домен-однодневка, BulkMailer для рассылки, агрессивный дизайн — всё указывает на мошенничество.',
  },
  {
    id: 5,
    difficulty: 'medium',
    subject: 'Ваш заказ #78234 отправлен',
    from: 'noreply@wildberries.ru',
    to: 'user@gmail.com',
    date: '2024-06-05 16:30:12',
    headers: `From: "Wildberries" <noreply@wildberries.ru>
To: user@gmail.com
Subject: Ваш заказ #78234 отправлен
Date: Wed, 05 Jun 2024 16:30:12 +0300
Message-ID: <order78234@wildberries.ru>
MIME-Version: 1.0
DKIM-Signature: v=1; a=rsa-sha256; d=wildberries.ru; s=wb2024;
  h=from:to:subject:date; bh=ghi789; b=rst345
SPF: Pass (wildberries.ru designates 95.163.52.10 as permitted sender)
DMARC: Pass
Received: from smtp-batch-3.wildberries.ru (smtp-batch-3.wildberries.ru [95.163.52.10])
  by mx.google.com with ESMTPS id def456
  for <user@gmail.com>; Wed, 05 Jun 2024 16:30:12 +0300`,
    body: `<html>
<body>
<p>Здравствуйте!</p>
<p>Ваш заказ #78234 на сумму 3 450 ₽ отправлен.</p>
<p>Ожидаемая дата доставки: 7 июня 2024</p>
<p>Отслеживайте доставку в приложении или на сайте:</p>
<p><a href="https://www.wildberries.ru/orders/78234">Отследить заказ</a></p>
<p>Спасибо за покупку!</p>
</body>
</html>`,
    isPhishing: false,
    indicators: [],
    explanation:
      'Легитимное письмо от Wildberries. DKIM, SPF и DMARC пройдены для официального домена wildberries.ru. Ссылка ведёт на www.wildberries.ru. Нет признаков фишинга.',
  },
  {
    id: 6,
    difficulty: 'hard',
    subject: 'Действия требуются: обновление данных карты',
    from: 'security@netflix.com.ru',
    to: 'user@gmail.com',
    date: '2024-07-12 08:55:33',
    headers: `From: "Netflix Security" <security@netflix.com.ru>
To: user@gmail.com
Subject: Действия требуются: обновление данных карты
Date: Fri, 12 Jul 2024 08:55:33 +0300
Message-ID: <sec-update-001@netflix.com.ru>
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8
X-Mailer: SendGrid
DKIM-Signature: v=1; a=rsa-sha256; d=netflix.com.ru; s=s1;
  h=from:to:subject:date; bh=jkl012; b=mno678
SPF: Pass (netflix.com.ru designates 167.89.45.20 as permitted sender)
Received: from o167890.x.netflix.com.ru (o167890.x.netflix.com.ru [167.89.45.20])
  by mx.google.com with ESMTPS id ghi012
  for <user@gmail.com>; Fri, 12 Jul 2024 08:55:33 +0300`,
    body: `<html>
<body>
<div style="font-family:Netflix Sans,Helvetica,sans-serif;">
<img src="https://netflix.com.ru/assets/logo.png" alt="Netflix" style="width:100px;">
<h3>Проблема с оплатой</h3>
<p>Не удалось обработать платёж для вашего аккаунта.</p>
<p>Пожалуйста, обновите данные вашей платёжной карты, чтобы продолжить просмотр.</p>
<p><a href="https://netflix.com.ru/account/billing/update?ref=urgent" style="background:#e50914;color:white;padding:12px 24px;text-decoration:none;display:inline-block;border-radius:4px;">Обновить платёжные данные</a></p>
<p>Если вы не обновите данные в течение 48 часов, ваш аккаунт будет приостановлен.</p>
<p style="font-size:12px;color:#666;">Netflix, Inc. | 100 Winchester Circle | Los Gatos, CA 95032</p>
</div>
</body>
</html>`,
    isPhishing: true,
    indicators: [
      {
        id: 'sender-6a',
        type: 'sender',
        severity: 'critical',
        title: 'Поддомен-имперсонация',
        description:
          'Домен netflix.com.ru — это НЕ netflix.com. Это российский домен com.ru с поддоменом netflix. Официальный домен Netflix: netflix.com.',
      },
      {
        id: 'link-6a',
        type: 'link',
        severity: 'critical',
        title: 'Ссылка на поддельный сайт',
        description:
          'Ссылка ведёт на netflix.com.ru/account/billing/update — поддельная страница для сбора данных карт.',
      },
      {
        id: 'urgency-6a',
        type: 'urgency',
        severity: 'high',
        title: 'Дедлайн в 48 часов',
        description: '«В течение 48 часов аккаунт будет приостановлен» — искусственная срочность.',
      },
      {
        id: 'header-6a',
        type: 'header',
        severity: 'medium',
        title: 'Использование SendGrid',
        description: 'Netflix использует собственную инфраструктуру, а не SendGrid для security-уведомлений.',
      },
      {
        id: 'content-6a',
        type: 'content',
        severity: 'medium',
        title: 'Логотип с поддельного домена',
        description: 'Изображение загружается с netflix.com.ru — злоумышленник загрузил копию логотипа на свой сервер.',
      },
    ],
    explanation:
      'Sophisticated фишинг с использованием домена-подражателя. netflix.com.ru выглядит похоже на netflix.com, но это完全不同的 домен. DKIM/SPF пройдены, но для поддельного домена. Это один из самых опасных типов фишинга.',
  },
];

// ============================================================
// Educational content about phishing
// ============================================================

export const phishingEducationContent = {
  whatIsPhishing: {
    title: 'Что такое фишинг?',
    description:
      'Фишинг — это вид интернет-мошенничества, целью которого является получение доступа к конфиденциальным данным пользователей: логинам, паролям, номерам банковских карт и другой личной информации.',
  },
  commonTypes: [
    {
      type: 'Email-фишинг',
      description: 'Массовая рассылка писем от имени известных компаний с просьбой перейти по ссылке и ввести данные.',
      icon: 'Mail',
    },
    {
      type: 'Spear phishing',
      description:
        'Целевая атака на конкретного человека или организацию. Письмо персонализировано и содержит информацию о жертве.',
      icon: 'Target',
    },
    {
      type: 'Whaling',
      description:
        'Атака на топ-менеджеров и руководителей. Особенно тщательно подготовленные письма с большими суммами.',
      icon: 'Crown',
    },
    {
      type: 'Clone phishing',
      description:
        'Копирование легитимного письма с заменой ссылки на фишинговую. Отправляется как «обновлённая версия».',
      icon: 'Copy',
    },
  ],
  howToSpot: [
    'Проверяйте адрес отправителя — обратите внимание на омографические атаки (micr0soft vs microsoft)',
    'Наводите на ссылки перед кликом — смотрите, куда ведёт ссылка на самом деле',
    'Обращайте внимание на срочность и угрозы — «срочно», «немедленно», «аккаунт будет заблокирован»',
    'Проверяйте email-заголовки — SPF, DKIM, DMARC, Return-Path, IP отправителя',
    'Если предложение слишком привлекательное — скорее всего, это мошенничество',
    'Не открывайте вложения от неизвестных отправителей',
    'Легитимные компании не просят пароли и полные данные карт по email',
  ],
  whatToDo: [
    'Не переходите по ссылкам и не открывайте вложения',
    'Не отвечайте на письмо',
    'Перешлите письмо в службу безопасности компании (если письмо от её имени)',
    'Удалите письмо',
    'Если вы уже перешли по ссылке и ввели данные — немедленно смените пароль и обратитесь в банк',
    'Сообщите о фишинге: в России — в Центробанк (cbr.ru) и Роскомнадзор',
  ],
};
