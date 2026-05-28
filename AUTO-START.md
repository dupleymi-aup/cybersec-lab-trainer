# Auto-Start Documentation

## Overview

The CyberSec Lab Trainer now supports automatic database detection and server startup.

## Quick Start

### Option 1: Manual Start (Original)
```bash
npm run dev
```
Starts Next.js dev server only. You need to ensure the database is running manually.

### Option 2: Auto Start (Recommended)
```bash
npm run dev:auto
```
Automatically:
1. Detects database type from `DATABASE_URL` in `.env`
2. Checks if database is running
3. Starts database in Docker if needed (with user confirmation)
4. Runs Prisma migrations
5. Finds an available port
6. Starts Next.js dev server

## Supported Databases

The auto-start script automatically detects and supports:

### PostgreSQL
- **Detection**: `postgresql://` or `postgres://` in DATABASE_URL
- **Default Port**: 5432
- **Docker Image**: `postgres:16-alpine`

### MySQL
- **Detection**: `mysql://` in DATABASE_URL
- **Default Port**: 3306
- **Docker Image**: `mysql:8.0`

### MSSQL Server
- **Detection**: `mssql://` or `sqlserver://` in DATABASE_URL
- **Default Port**: 1433
- **Docker Image**: `mcr.microsoft.com/mssql/server:2022-latest`

### ClickHouse
- **Detection**: `clickhouse://` in DATABASE_URL
- **Default Port**: 8123 (HTTP interface)
- **Docker Image**: `clickhouse/clickhouse-server:latest`
- **Additional Ports**: 9000 (Native protocol)

### Oracle Database
- **Detection**: `oracle://` or `oracledb://` in DATABASE_URL
- **Default Port**: 1521
- **Docker Image**: `gvenzl/oracle-xe:21-slim` (Oracle Express Edition)
- **Note**: First startup may take 2-3 minutes for database initialization

## How It Works

1. **Environment Loading**: Reads `.env` file from project root
2. **Database Detection**: Parses `DATABASE_URL` to determine type, host, port, and database name
3. **Port Checking**: Tests if database port is available (indicates DB is not running)
4. **Docker Check**: Verifies Docker is running
5. **User Confirmation**: Asks before starting database container
6. **Migrations**: Runs `prisma db push` to sync schema
7. **Server Start**: Starts Next.js on available port

## Requirements

- **Node.js** 18+ 
- **Docker Desktop** (for automatic database startup)
- **Prisma** (already included in dependencies)

## Configuration

### .env File
```env
# PostgreSQL Example
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cybersec_lab"

# MySQL Example
DATABASE_URL="mysql://root:mysql@localhost:3306/cybersec_lab"

# MSSQL Example
DATABASE_URL="mssql://sa:YourStrong@Passw0rd@localhost:1433/cybersec_lab"

# ClickHouse Example
DATABASE_URL="clickhouse://default:@localhost:8123/cybersec_lab"

# Oracle Example
DATABASE_URL="oracle://cybersec:oracle@localhost:1521/cybersec_lab"
```

### Custom Port
```bash
npm run dev:auto -- 3001
```

## Qoder CLI Integration

The project includes `.qoder/project-config.json` which configures:
- Auto-detection settings
- Docker container configurations
- Server startup parameters

## Troubleshooting

### Database won't start
1. Ensure Docker Desktop is running
2. Check if port is already in use: `netstat -ano | findstr :5432`
3. Remove old containers: `docker rm cybersec-postgresql`

### Port already in use
The script automatically finds the next available port. You can also specify a custom port.

### Prisma migration fails
Run manually:
```bash
npx prisma generate
npx prisma db push
```

### ClickHouse connection issues
- ClickHouse uses two ports: 8123 (HTTP) and 9000 (native)
- Ensure both ports are available if using native protocol
- Default user is `default` with no password

### Oracle initialization takes too long
- First startup requires 2-3 minutes for database creation
- Check logs: `docker logs cybersec-oracle -f`
- Wait for "DATABASE IS READY TO USE" message

## Scripts Summary

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js only |
| `npm run dev:auto` | Auto-start database + Next.js |
| `npm run db:push` | Push Prisma schema |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed database |

## Database Quick Reference

| Database | Protocol | Default Port | Docker Image |
|----------|----------|--------------|--------------|
| PostgreSQL | `postgresql://` | 5432 | `postgres:16-alpine` |
| MySQL | `mysql://` | 3306 | `mysql:8.0` |
| MSSQL | `mssql://` | 1433 | `mcr.microsoft.com/mssql/server:2022-latest` |
| ClickHouse | `clickhouse://` | 8123 | `clickhouse/clickhouse-server:latest` |
| Oracle | `oracle://` | 1521 | `gvenzl/oracle-xe:21-slim` |
