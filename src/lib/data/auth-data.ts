/**
 * Authentication Security Lab data constants.
 * Extracted from AuthSecurityLab.tsx for reuse and testability.
 */

// --- Password Analysis ---

export interface PasswordCheck {
  label: string;
  regex?: RegExp;
  minLength?: number;
  inverted?: boolean;
}

export const PASSWORD_CHECKS: PasswordCheck[] = [
  { label: 'Минимум 8 символов', minLength: 8 },
  { label: 'Строчные буквы (a-z)', regex: /[a-z]/ },
  { label: 'Заглавные буквы (A-Z)', regex: /[A-Z]/ },
  { label: 'Цифры (0-9)', regex: /[0-9]/ },
  { label: 'Спецсимволы (!@#$...)', regex: /[^a-zA-Z0-9]/ },
  { label: 'Минимум 12 символов', minLength: 12 },
  { label: 'Нет повторяющихся символов', regex: /(.)\1{2,}/, inverted: true },
  { label: 'Нет последовательностей (abc, 123)', regex: /(?:abc|bcd|cde|def|efg|012|123|234|345|456|567|678|789)/i, inverted: true },
] as const;

export interface StrengthLevel {
  maxPassed: number;
  score: number;
  label: string;
  color: string;
}

export const PASSWORD_STRENGTH_LEVELS: StrengthLevel[] = [
  { maxPassed: 2, score: 20, label: 'Очень слабый', color: 'bg-red-500' },
  { maxPassed: 3, score: 40, label: 'Слабый', color: 'bg-red-400' },
  { maxPassed: 5, score: 60, label: 'Средний', color: 'bg-yellow-500' },
  { maxPassed: 6, score: 80, label: 'Надёжный', color: 'bg-emerald-500' },
  { maxPassed: Infinity, score: 100, label: 'Отличный', color: 'bg-emerald-600' },
] as const;

// --- Brute Force ---

export interface ComplexityOption {
  value: number;
  charsetSize: number;
  description: string;
}

export const BRUTE_FORCE_COMPLEXITY_LEVELS: ComplexityOption[] = [
  { value: 1, charsetSize: 26, description: '26 (a-z)' },
  { value: 2, charsetSize: 52, description: '52 (a-z, A-Z)' },
  { value: 3, charsetSize: 62, description: '62 (+0-9)' },
  { value: 4, charsetSize: 94, description: '94 (+спецсимволы)' },
] as const;

export const BRUTE_FORCE_ATTEMPTS_PER_SECOND = 1e10; // 10 billion attempts/sec
export const BRUTE_FORCE_MIN_LENGTH = 4;
export const BRUTE_FORCE_MAX_LENGTH = 20;
export const BRUTE_FORCE_DEFAULT_LENGTH = 8;
export const BRUTE_FORCE_DEFAULT_COMPLEXITY = 1;

// --- Hashing ---

export const HASH_SALT = 'a1b2c3d4e5f6';
export const HASH_ALGORITHM_PREFIX = '$2b$12$';
export const HASH_ALGORITHM_DESCRIPTION = 'алгоритм (bcrypt) и стоимость (12 раундов)';
export const HASH_SALT_DESCRIPTION = 'соль (уникальная для каждого пользователя)';
export const HASH_VALUE_DESCRIPTION = 'собственно хеш пароля';

export const BCRYPT_CODE_EXAMPLE = `// Пример использования bcrypt в Node.js
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// Хеширование пароля
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);
  return hash;
  // Результат: $2b$12$N9qo8uLOickgx2ZMRZoMy...
}

// Проверка пароля
async function verify(password, hash) {
  const isMatch = await bcrypt.compare(password, hash);
  return isMatch; // true или false
}`;

export const BCRYPT_BENEFITS = [
  'Автоматически добавляет соль — защита от rainbow tables',
  'Настраиваемая стоимость (cost factor) — замедляет перебор',
  'Устойчив к GPU-атакам (памятекоёмкий алгоритм)',
  'Однонаправленный — невозможно восстановить пароль из хеша',
] as const;

// --- OTP / TOTP ---

export const OTP_TIME_WINDOW = 30; // seconds
export const OTP_CODE_LENGTH = 6;

export interface TOTPStep {
  step: string;
  title: string;
  desc: string;
}

export const TOTP_STEPS: TOTPStep[] = [
  {
    step: '1',
    title: 'Секретный ключ',
    desc: 'Сервер генерирует случайный секрет (обычно 16-32 символа Base32) и передаёт его пользователю (QR-код).',
  },
  {
    step: '2',
    title: 'Вычисление HMAC',
    desc: 'Клиент и сервер вычисляют HMAC-SHA1 от секрета и текущего временного шага (timestamp / 30).',
  },
  {
    step: '3',
    title: 'Динамическое усечение',
    desc: 'Из HMAC извлекаются 4 байта, преобразуются в 31-битное число, затем берётся по модулю 10^6 = 6-значный код.',
  },
  {
    step: '4',
    title: 'Сверка',
    desc: 'Сервер сравнивает код клиента с собственным вычислением. Допускается ±1 шаг (30 сек) для компенсации задержки.',
  },
] as const;

export const TOTP_CODE_EXAMPLE = `// TOTP на сервере (Node.js)
import { authenticator } from 'otplib';

// 1. Генерация секрета при включении 2FA
const secret = authenticator.generateSecret();
// Сохранить secret в БД пользователя

// 2. Генерация QR-кода для Google Authenticator
const otpauth = authenticator.keyuri(user.email, 'MyApp', secret);
// otpauth://totp/MyApp:user@email?secret=ABCD...

// 3. Проверка кода при входе
const isValid = authenticator.check(token, user.secret);
// Возвращает true, если код совпадает (±1 шаг)

// Без 2FA — только пароль
// С 2FA — пароль + TOTP-код из телефона
// Даже при утечке пароля — аккаунт защищён`;

export const WITHOUT_2FA_RISKS = [
  'Только пароль — одна точка отказа',
  'Утечка из БД = мгновенный доступ',
  'Фишинг = полный компромисс',
  'Брутфорс = eventual access',
] as const;

export const WITH_2FA_BENEFITS = [
  'Нужен пароль + устройство с TOTP',
  'Код действует только 30 секунд',
  'Секрет не передаётся по сети',
  'Защита от фишинга и брутфорса',
] as const;

// --- Session Security / JWT ---

export const JWT_CODE_EXAMPLE = `// Генерация JWT
const jwt = require('jsonwebtoken');

function login(user) {
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }  // Токен истекает через час
  );
  return token;
}

// Проверка JWT (middleware)
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Нет токена' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[auth-data.ts] authenticate failed:", e);
    return res.status(401).json({ error: 'Невалидный токен' });
  }
}`;

export const JWT_INSECURE_PRACTICES = [
  'Хранение JWT в localStorage (доступен через XSS)',
  'Срок действия больше 24 часов',
  'Отсутствие refresh-токенов',
  'Секрет в клиентском коде',
] as const;

export const JWT_SECURE_PRACTICES = [
  'Хранение в HttpOnly + Secure куках',
  'Короткий срок (15-30 мин) + refresh-токен',
  'Проверка подписи на каждом запросе',
  'Чёрный список compromised токенов',
] as const;

// --- Time Formatting ---

export const TIME_LABELS = {
  instant: 'Мгновенно',
  seconds: 'сек',
  minutes: 'мин',
  hours: 'ч',
  days: 'дн',
  years: 'лет',
  thousandsOfYears: 'тыс. лет',
  millionsOfYears: 'млн лет',
  infinite: 'Бесконечно',
} as const;

export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3600;
export const SECONDS_PER_DAY = 86400;
export const SECONDS_PER_YEAR = 31536000;
