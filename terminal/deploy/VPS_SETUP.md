# Развертывание на VPS (Ubuntu/Debian)

Полное руководство по развертыванию CyberSec Lab на собственном сервере.

## 📋 Предварительные требования

- VPS с Ubuntu 22.04+ или Debian 11+
- Root доступ или пользователь с sudo правами
- Доменное имя, указывающее на IP сервера
- Открытые порты: 80 (HTTP), 443 (HTTPS)

## 🚀 Шаг 1: Подготовка сервера

```bash
# Подключиться к серверу
ssh root@your-server-ip

# Обновить систему
apt update && apt upgrade -y

# Установить необходимые пакеты
apt install -y curl git wget nano vim unzip

# Установить Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверить установку
node --version  # Должно быть v20+
npm --version   # Должно быть 10+

# Установить PM2 (опционально, альтернатива systemd)
npm install -g pm2
```

## 🔧 Шаг 2: Установка Nginx и SSL

```bash
# Установить Nginx
apt install -y nginx

# Установить Certbot для SSL
apt install -y certbot python3-certbot-nginx

# Проверить Nginx
nginx -v
systemctl status nginx
```

## 👤 Шаг 3: Создание пользователя

```bash
# Создать системного пользователя nextjs
adduser --system --group --no-create-home nextjs

# Создать директорию приложения
mkdir -p /opt/cybersec-lab-trainer
chown -R nextjs:nextjs /opt/cybersec-lab-trainer
```

## 📦 Шаг 4: Клонирование репозитория

```bash
# Переключиться на пользователя nextjs
su - nextjs

# Перейти в директорию приложения
cd /opt/cybersec-lab-trainer

# Клонировать репозиторий
git clone https://github.com/dupleymi-aup/cybersec-lab-trainer.git .

# Вернуться к root
exit
```

## ⚙️ Шаг 5: Настройка окружения

```bash
# Переключиться на nextjs
su - nextjs

# Создать .env файл
cp /opt/cybersec-lab-trainer/.env.example /opt/cybersec-lab-trainer/.env

# Отредактировать .env
nano /opt/cybersec-lab-trainer/.env
```

**Обновите в `.env`:**

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

DATABASE_URL=postgresql://user:password@localhost:5432/cybersec_lab

# Сгенерировать секреты:
# openssl rand -base64 32
TOKEN_SECRET="your-generated-token-secret-here"
OTP_SECRET="your-generated-otp-secret-here"

# Email (если используется)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@cyberseclab.com
```

```bash
# Выход из nextjs
exit
```

## 🏗️ Шаг 6: Установка зависимостей и сборка

```bash
# Переключиться на nextjs
su - nextjs
cd /opt/cybersec-lab-trainer

# Установить зависимости
npm ci --production

# Сгенерировать Prisma client
npx prisma generate

# Собрать приложение
npm run build

# Выход
exit
```

## 🗄️ Шаг 7: Настройка базы данных

### Вариант A: Локальный PostgreSQL

```bash
# Установить PostgreSQL
apt install -y postgresql postgresql-contrib

# Создать пользователя БД
sudo -u postgres psql

# В PostgreSQL:
CREATE USER cybersec WITH PASSWORD 'your-strong-password';
CREATE DATABASE cybersec_lab OWNER cybersec;
GRANT ALL PRIVILEGES ON DATABASE cybersec_lab TO cybersec;
\q

# Обновить .env
su - nextjs
nano /opt/cybersec-lab-trainer/.env
# DATABASE_URL=postgresql://cybersec:your-strong-password@localhost:5432/cybersec_lab
exit

# Применить миграции
su - nextjs
cd /opt/cybersec-lab-trainer
npx prisma migrate deploy
npx prisma db push
exit
```

### Вариант B: Внешний PostgreSQL (Neon, Supabase)

Просто обновите `DATABASE_URL` в `.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

## 🔧 Шаг 8: Настройка systemd

```bash
# Скопировать service файл
cp /opt/cybersec-lab-trainer/deploy/cybersec-lab-trainer.service /etc/systemd/system/

# Отредактировать (если нужно)
nano /etc/systemd/system/cybersec-lab-trainer.service
# Убедитесь, что Environment переменные соответствуют .env

# Перезагрузить systemd
systemctl daemon-reload

# Включить автозапуск
systemctl enable cybersec-lab-trainer

# Запустить сервис
systemctl start cybersec-lab-trainer

# Проверить статус
systemctl status cybersec-lab-trainer
journalctl -u cybersec-lab-trainer -f
```

## 🌐 Шаг 9: Настройка Nginx

```bash
# Скопировать nginx конфиг
cp /opt/cybersec-lab-trainer/deploy/nginx.conf /etc/nginx/sites-available/cybersec-lab

# Отредактировать (заменить your-domain.com)
nano /etc/nginx/sites-available/cybersec-lab
# Измените: server_name your-domain.com www.your-domain.com

# Создать symlink
ln -sf /etc/nginx/sites-available/cybersec-lab /etc/nginx/sites-enabled/

# Проверить конфигурацию
nginx -t

# Перезагрузить Nginx
systemctl restart nginx
systemctl status nginx
```

## 🔒 Шаг 10: Настройка SSL (Let's Encrypt)

```bash
# Получить SSL сертификат
certbot --nginx -d your-domain.com -d www.your-domain.com \
  --non-interactive --agree-tos \
  -m your-email@example.com \
  --redirect

# Проверить автообновление
systemctl status certbot.timer

# Тестирование обновления
certbot renew --dry-run
```

## ✅ Шаг 11: Проверка

```bash
# Проверить статус сервиса
systemctl status cybersec-lab-trainer

# Проверить логи
journalctl -u cybersec-lab-trainer -f

# Проверить доступность
curl -I https://your-domain.com

# Проверить API
curl -I https://your-domain.com/api/health
```

## 🔍 Мониторинг и управление

### Управление сервисом

```bash
# Запустить
systemctl start cybersec-lab-trainer

# Остановить
systemctl stop cybersec-lab-trainer

# Перезапустить
systemctl restart cybersec-lab-trainer

# Перезагрузить конфигурацию
systemctl reload cybersec-lab-trainer

# Проверить статус
systemctl status cybersec-lab-trainer

# Просмотр логов
journalctl -u cybersec-lab-trainer -f
journalctl -u cybersec-lab-trainer --since "1 hour ago"
```

### Автоматическое обновление

```bash
# Переключиться на nextjs
su - nextjs
cd /opt/cybersec-lab-trainer

# Обновить код
git pull origin main

# Установить зависимости
npm ci --production

# Сгенерировать Prisma client
npx prisma generate

# Собрать
npm run build

# Применить миграции
npx prisma migrate deploy

# Перезапустить сервис
exit
systemctl restart cybersec-lab-trainer

# Проверить
systemctl status cybersec-lab-trainer
```

## 🐛 Отладка

### Проверка логов

```bash
# Systemd логи
journalctl -u cybersec-lab-trainer -f

# Nginx логи
tail -f /var/log/nginx/cybersec-lab-access.log
tail -f /var/log/nginx/cybersec-lab-error.log

# Node.js ошибки
journalctl -u cybersec-lab-trainer -e
```

### Проверка портов

```bash
# Проверить, что приложение слушает порт 3000
ss -tlnp | grep 3000

# Проверить Nginx
ss -tlnp | grep :80
ss -tlnp | grep :443
```

### Проверка БД

```bash
# Подключиться к PostgreSQL
sudo -u postgres psql

# Проверить подключение
\c cybersec_lab

# Показать таблицы
\dt
```

## 🔐 Безопасность

### Firewall (UFW)

```bash
# Установить UFW
apt install -y ufw

# Разрешить SSH
ufw allow OpenSSH

# Разрешить HTTP/HTTPS
ufw allow 'Nginx Full'

# Включить firewall
ufw enable

# Проверить
ufw status
```

### Fail2Ban (защита от brute force)

```bash
# Установить Fail2Ban
apt install -y fail2ban

# Скопировать конфиг
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Отредактировать
nano /etc/fail2ban/jail.local
# [sshd]
# enabled = true

# Перезапустить
systemctl enable fail2ban
systemctl start fail2ban
```

## 📊 Мониторинг ресурсов

```bash
# Установить htop
apt install -y htop

# Мониторинг в реальном времени
htop

# Дисковое пространство
df -h

# Использование памяти
free -h
```

## 🆘 Troubleshooting

### Приложение не запускается

```bash
# Проверить логи
journalctl -u cybersec-lab-trainer -n 100

# Проверить переменные окружения
sudo -u nextjs env | grep -E "NODE_|DATABASE|TOKEN"

# Проверить права доступа
ls -la /opt/cybersec-lab-trainer
```

### Nginx не проксирует

```bash
# Проверить конфигурацию
nginx -t

# Проверить логи ошибок
tail -f /var/log/nginx/cybersec-lab-error.log

# Проверить, что приложение работает
curl http://localhost:3000
```

### SSL не работает

```bash
# Проверить сертификат
openssl s_client -connect your-domain.com:443

# Перегенерировать
certbot renew --force-renewal

# Проверить confiг
nginx -t
systemctl reload nginx
```

## 🎯 Следующие шаги

1. **Настроить мониторинг**: Uptime Kuma, Prometheus + Grafana
2. **Настроить бэкапы**: автоматический бэкап БД и файлов
3. **Настроить alerting**: Telegram/Discord уведомления об ошибках
4. **Оптимизировать**: Redis кэширование, CDN для статики

---

*Последнее обновление: 2026-06-08*
