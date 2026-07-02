/**
 * Seed script for CTF Labs initial data
 * Run: npx prisma db seed
 * Or manually: node prisma/seed-ctf-labs.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ctflabs = [
  // OWASP Module Labs
  {
    title: 'SQL Injection - Authentication Bypass',
    description: 'Obtain admin access by bypassing the login form authentication',
    moduleId: 'owasp',
    difficulty: 'medium',
    type: 'web',
    points: 150,
    instructions: 'Найди SQL injection уязвимость в форме входа. Попробуй различные payload для обхода аутентификации. Флаг имеет формат CTF{admin_access_granted}',
    hint: 'Попробуй классический payload: \' OR \'1\'=\'1',
    flag: 'CTF{sql_injection_auth_bypass}',
    tags: ['injection', 'authentication', 'database'],
  },
  {
    title: 'XSS - Stored Payload',
    description: 'Execute JavaScript code that steals session cookie',
    moduleId: 'xss',
    difficulty: 'easy',
    type: 'web',
    points: 100,
    instructions: 'Вставь XSS payload в поле комментария. Флаг будет выведен в консоль браузера после сохранения.',
    hint: 'Используй <script> tags или event handlers',
    flag: 'CTF{xss_stored_cookie_theft}',
    tags: ['xss', 'javascript', 'session'],
  },
  {
    title: 'XSS - DOM Based',
    description: 'Exploit DOM-based XSS vulnerability in search functionality',
    moduleId: 'xss',
    difficulty: 'medium',
    type: 'web',
    points: 150,
    instructions: 'Найди способ выполнить JavaScript через параметр URL в search功能.',
    hint: 'Проверь как обрабатывается hash fragment (#)',
    flag: 'CTF{dom_xss_search_payload}',
    tags: ['xss', 'dom', 'client-side'],
  },
  
  // SQL Injection Module Labs
  {
    title: ' UNION-Based Extraction',
    description: 'Extract database schema using UNION injection',
    moduleId: 'sql-injection',
    difficulty: 'hard',
    type: 'web',
    points: 200,
    instructions: 'Используй UNION-based SQL injection для извлечения информации о таблицах базы данных.',
    hint: 'Сначала узнай количество колонок через ORDER BY',
    flag: 'CTF{union_based_extraction_complete}',
    tags: ['injection', 'union', 'enumeration'],
  },
  {
    title: 'Blind SQL Injection - Time Based',
    description: 'Extract data using time-based blind injection',
    moduleId: 'sql-injection',
    difficulty: 'hard',
    type: 'web',
    points: 200,
    instructions: 'Определи содержимое базы данных через задержки времени (SLEEP, WAITFOR).',
    hint: 'Используй бинарный поиск для извлечения символов',
    flag: 'CTF{blind_time_based_success}',
    tags: ['injection', 'blind', 'time-based'],
  },
  
  // XSS Module Labs
  {
    title: 'XSS Filter Bypass',
    description: 'Bypass XSS filters using encoding and obfuscation',
    moduleId: 'xss',
    difficulty: 'medium',
    type: 'web',
    points: 150,
    instructions: 'Обойди фильтры безопасности используя различные методы кодирования.',
    hint: 'HTML entities, URL encoding, mixed case',
    flag: 'CTF{xss_filter_bypass_master}',
    tags: ['xss', 'filters', 'bypass'],
  },
  
  // CSRF Module Labs
  {
    title: 'CSRF Token Bypass',
    description: 'Execute unauthorized actions by bypassing CSRF protection',
    moduleId: 'csrf',
    difficulty: 'medium',
    type: 'web',
    points: 150,
    instructions: 'Найди способ обойти CSRF защиту и выполнить действие от имени другого пользователя.',
    hint: 'Проверь как валидируется CSRF токен',
    flag: 'CTF{csrf_token_bypassed}',
    tags: ['csrf', 'authentication', 'session'],
  },
  {
    title: 'SameSite Bypass',
    description: 'Exploit misconfigured SameSite cookie attribute',
    moduleId: 'csrf',
    difficulty: 'hard',
    type: 'web',
    points: 200,
    instructions: 'Используй неправильную конфигурацию SameSite для выполнения CSRF атаки.',
    hint: 'SameSite=None без Secure флаг',
    flag: 'CTF{samesite_bypass_complete}',
    tags: ['csrf', 'cookies', 'samesite'],
  },
  
  // Authentication Module Labs
  {
    title: 'Password Reset Poisoning',
    description: 'Hijack password reset functionality',
    moduleId: 'auth',
    difficulty: 'medium',
    type: 'web',
    points: 150,
    instructions: 'Перехвати процесс сброса пароля используя манипуляцию с заголовками.',
    hint: 'Проверь как генерируется ссылка для сброса',
    flag: 'CTF{password_reset_hijack}',
    tags: ['authentication', 'password', 'reset'],
  },
  {
    title: 'JWT Algorithm Confusion',
    description: 'Exploit JWT algorithm confusion vulnerability',
    moduleId: 'auth',
    difficulty: 'hard',
    type: 'crypto',
    points: 250,
    instructions: 'Используй уязвимость confusion of algorithm для получения admin токена.',
    hint: 'Попробуй изменить alg на "none" или "HS256" с публичным ключом',
    flag: 'CTF{jwt_algorithm_confusion}',
    tags: ['jwt', 'crypto', 'authentication'],
  },
  
  // Crypto Module Labs
  {
    title: 'Base64 Encoding Challenge',
    description: 'Decode multiple layers of Base64 encoding',
    moduleId: 'crypto',
    difficulty: 'easy',
    type: 'crypto',
    points: 50,
    instructions: 'Раскодируй несколько слоев Base64 для получения флага.',
    hint: 'Иногда требуется decode 3-4 раза подряд',
    flag: 'CTF{base64_multi_layer_decoded}',
    tags: ['encoding', 'base64', 'crypto'],
  },
  {
    title: 'XOR Encryption Break',
    description: 'Crack simple XOR encryption with known plaintext attack',
    moduleId: 'crypto',
    difficulty: 'medium',
    type: 'crypto',
    points: 150,
    instructions: 'Восстанови XOR ключ используя known plaintext attack.',
    hint: 'Флаг начинается с CTF{',
    flag: 'CTF{xor_encryption_cracked}',
    tags: ['xor', 'crypto', 'encryption'],
  },
  
  // Forensics Module Labs
  {
    title: 'Network Traffic Analysis',
    description: 'Extract sensitive data from PCAP file',
    moduleId: 'forensics',
    difficulty: 'medium',
    type: 'forensics',
    points: 150,
    instructions: 'Проанализируй сетевой трафик и найди украденные данные.',
    hint: 'Используй Wireshark для фильтрации HTTP трафика',
    flag: 'CTF{pcap_analysis_complete}',
    tags: ['forensics', 'network', 'pcap'],
  },
  {
    title: 'Hidden Data in Image',
    description: 'Extract steganographic content from image',
    moduleId: 'forensics',
    difficulty: 'easy',
    type: 'forensics',
    points: 100,
    instructions: 'Найди скрытое сообщение в изображении.',
    hint: 'Проверь EXIF данные и строки в файле',
    flag: 'CTF{steganography_discovered}',
    tags: ['forensics', 'steganography', 'image'],
  },
  
  // Misc Module Labs
  {
    title: 'Linux Privilege Escalation',
    description: 'Escalate from user to root via SUID binary',
    moduleId: 'misc',
    difficulty: 'hard',
    type: 'misc',
    points: 250,
    instructions: 'Найди уязвимый SUID бинарник и получи root доступ.',
    hint: 'Проверь все файлы с SUID битом',
    flag: 'CTF{linux_priv_esc_root}',
    tags: ['linux', 'privilege-escalation', 'suid'],
  },
  {
    title: 'Environment Variable Leak',
    description: 'Extract sensitive data from environment variables',
    moduleId: 'misc',
    difficulty: 'easy',
    type: 'misc',
    points: 75,
    instructions: 'Найди утечку чувствительных данных через переменные окружения.',
    hint: 'Проверь вывод команд и логи приложения',
    flag: 'CTF{env_variable_leak}',
    tags: ['info-disclosure', 'environment', 'leak'],
  },
];

async function main() {
  console.warn('🌱 Seeding CTF Labs...');

  for (const lab of ctflabs) {
    const { tags, ...labData } = lab;
    
    const createdLab = await prisma.ctfLab.create({
      data: {
        ...labData,
        isActive: true,
        order: ctflabs.indexOf(lab),
        tags: {
          create: tags.map((name: string) => ({ name })),
        },
      },
      include: { tags: true },
    });

    console.warn(`✅ Created: ${createdLab.title} (${createdLab.difficulty} - ${createdLab.type})`);
  }

  console.warn(`\n🎉 Successfully created ${ctflabs.length} CTF labs!`);
}

main()
  .catch(e => {
    console.error('❌ Error seeding CTF labs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
