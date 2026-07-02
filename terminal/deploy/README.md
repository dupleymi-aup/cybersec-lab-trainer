# CyberSec Lab — Production Deployment

Этот каталог содержит конфигурации для развертывания на различных платформах.

## 📦 Быстрый старт

### Docker (локально или на VPS)

```bash
# С PostgreSQL
docker-compose -f docker-compose.yml --profile postgres up -d

# Остановить
docker-compose down
```

### Vercel (рекомендовано)

```bash
# Установить Vercel CLI
npm i -g vercel

# Деплой
vercel --prod
```

### Railway

1. Подключите GitHub репозиторий
2. Добавьте PostgreSQL базу данных
3. Добавьте переменные окружения
4. Деплой автоматический

### VPS + Nginx

```bash
# См. deploy/systemd.md для подробной инструкции
```

## 🌐 Платформы

- **Vercel** — самый простой, бесплатный, automatic deploys
- **Railway** — встроенная PostgreSQL, easy setup
- **Render** — бесплатный tier (cold start)
- **Fly.io** — global edge, free tier available
- **VPS** — полный контроль, требуется nginx/systemd
- **Docker** — универсально, работает везде

## 📚 Документация

- `nginx.conf` — конфигурация для reverse proxy
- `systemd/` — service файл для Linux
- `vercel.json` — настройки для Vercel
- `docker-compose.yml` — локальная разработка
