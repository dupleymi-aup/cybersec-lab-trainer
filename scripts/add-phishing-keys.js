const fs = require('fs');
const en = JSON.parse(fs.readFileSync('src/messages/en.json', 'utf8'));
const ru = JSON.parse(fs.readFileSync('src/messages/ru.json', 'utf8'));
const zh = JSON.parse(fs.readFileSync('src/messages/zh.json', 'utf8'));

en.phishingAnalyzer.next = 'Next email';
en.phishingAnalyzer.reset = 'Start over';
en.phishingAnalyzer.resetScore = 'Reset score';
en.phishingAnalyzer.markComplete = 'Mark module as completed';
en.phishingAnalyzer.moduleComplete = 'Module completed!';
en.phishingAnalyzer.noEmails = 'No emails with this difficulty. Select All.';

ru.phishingAnalyzer.next = 'Следующее письмо';
ru.phishingAnalyzer.reset = 'Начать заново';
ru.phishingAnalyzer.resetScore = 'Сбросить счёт';
ru.phishingAnalyzer.markComplete = 'Отметить модуль как изученный';
ru.phishingAnalyzer.moduleComplete = 'Модуль завершён!';
ru.phishingAnalyzer.noEmails = 'Нет писем с такой сложностью. Выберите Все.';

zh.phishingAnalyzer.next = '下一封邮件';
zh.phishingAnalyzer.reset = '重新开始';
zh.phishingAnalyzer.resetScore = '重置分数';
zh.phishingAnalyzer.markComplete = '标记模块为已完成';
zh.phishingAnalyzer.moduleComplete = '模块已完成！';
zh.phishingAnalyzer.noEmails = '没有此难度的邮件。请选择全部。';

fs.writeFileSync('src/messages/en.json', JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync('src/messages/ru.json', JSON.stringify(ru, null, 2) + '\n', 'utf8');
fs.writeFileSync('src/messages/zh.json', JSON.stringify(zh, null, 2) + '\n', 'utf8');
console.log('Added missing phishing keys');
