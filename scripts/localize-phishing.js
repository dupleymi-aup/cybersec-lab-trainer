const fs = require('fs');
let c = fs.readFileSync('src/components/security-trainer/PhishingAnalyzer.tsx', 'utf8');

// Add t import and usage
c = c.replace(
  "import { useTranslations } from 'next-intl';",
  "import { useTranslations, useLocale } from 'next-intl';"
);

// Add t and locale inside component (after existing tc)
c = c.replace(
  "const tc = useTranslations('common');",
  "const tc = useTranslations('common');\n  const t = useTranslations('phishingAnalyzer');\n  const locale = useLocale();"
);

// Header
c = c.replace(/>Анализатор фишинговых писем</g, ">{t('title')}<");
c = c.replace(/>Научитесь распознавать фишинг по заголовкам, содержимому и ссылкам</g, ">{t('subtitle')}<");
c = c.replace(/>Правильно: \{score\.correct\}\/\{score\.total\}/g, ">{t('correctScore', { correct: score.correct, total: score.total })}<");

// Phase buttons
c = c.replace(/>Теория<\/button>/g, ">{t('theory')}</button>");
c = c.replace(/>Практика \(\{phishingEmails\.length\} писем\)/g, ">{t('practice', { count: phishingEmails.length })}");

// Education section
c = c.replace(/>Типы фишинговых атак</g, ">{t('phishingTypes')}<");
c = c.replace(/>Как распознать фишинг</g, ">{t('howToRecognize')}<");
c = c.replace(/>Что делать, если вы обнаружили фишинг</g, ">{t('whatToDo')}<");
c = c.replace(/>Перейти к практике/g, ">{t('goToPractice')}");

// Difficulty filters
c = c.replace(/\{d === 'all' \? 'Все' : d === 'easy' \? 'Лёгкие' : d === 'medium' \? 'Средние' : 'Сложные'\}/g, "{t(d)}");

// Difficulty badges
c = c.replace(/\{currentEmail\.difficulty === 'easy'\n\s+\? 'Лёгкий'\n\s+: currentEmail\.difficulty === 'medium'\n\s+\? 'Средний'\n\s+: 'Сложный'\}/g, "{t(currentEmail.difficulty)}");

// Email metadata
c = c.replace(/>Письмо \{currentEmailIndex \+ 1\} из \{filteredEmails\.length\}</g, ">{currentEmailIndex + 1} / {filteredEmails.length}<");
c = c.replace(/Тема:/g, "{t('subject')}");
c = c.replace(/>От:/g, ">{t('to')}<");
c = c.replace(/>Кому:/g, ">{t('to')}<");
c = c.replace(/>Дата:/g, ">{t('date')}<");
c = c.replace(/>Тело письма</g, ">{t('body')}<");

// Show/Hide HTML
c = c.replace(/>Скрыть HTML/g, ">{t('hideHtml')}<");
c = c.replace(/>Показать HTML/g, ">{t('showHtml')}<");

// Headers toggle
c = c.replace(/\{showHeaders \? 'Скрыть' : 'Показать'\} заголовки письма/g, "{showHeaders ? tc('hide') : tc('show')} {t('showHeaders').toLowerCase()}");

// Verdict buttons
c = c.replace(/>Это фишинг/g, ">{t('isPhishing')}<");
c = c.replace(/>Легитимное/g, ">{t('legitimate')}<");

// Verdict result
c = c.replace(/\{currentEmail\.isPhishing === \(userVerdict === 'phishing'\) \? 'Правильно!' : 'Неверно\.'\}/g, "{currentEmail.isPhishing === (userVerdict === 'phishing') ? t('correct') : t('incorrect')}");
c = c.replace(/Это письмо <b>\{currentEmail\.isPhishing \? 'фишинговое' : 'легитимное'\}<\/b>\./g, "{t('email')} <b>{currentEmail.isPhishing ? t('phishingWord') : t('legitimateWord')}</b>.");

// Indicators section
c = c.replace(/>Индикаторы фишинга/g, ">{t('phishingIndicators')}");

// Severity badges
c = c.replace(/ind\.severity === 'critical'\n\s+\? 'Критичный'\n\s+: ind\.severity === 'high'\n\s+\? 'Высокий'\n\s+: ind\.severity === 'medium'\n\s+\? 'Средний'\n\s+: 'Низкий'/g, "{t(ind.severity)}");

// Navigation
c = c.replace(/currentEmailIndex < filteredEmails\.length - 1 \? 'Следующее письмо' : 'Начать заново'/g, "currentEmailIndex < filteredEmails.length - 1 ? t('next') : t('reset')");
c = c.replace(/>Сбросить счёт/g, ">{t('resetScore')}<");

// Complete module
c = c.replace(/>Отметить модуль как изученный/g, ">{t('markComplete')}<");
c = c.replace(/>Модуль завершён!/g, ">{t('moduleComplete')}<");

// Empty state
c = c.replace(/>Нет писем с такой сложностью\. Выберите «Все»\./g, ">{t('noEmails')}<");

fs.writeFileSync('src/components/security-trainer/PhishingAnalyzer.tsx', c, 'utf8');
console.log('Localized PhishingAnalyzer.tsx');
