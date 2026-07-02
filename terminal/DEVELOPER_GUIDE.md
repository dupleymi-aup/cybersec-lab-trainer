# CyberSec Lab Trainer — Developer Guide

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed

# Start development server
npm run dev
```

### Development

The development server starts on `http://localhost:3000`.

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── admin/         # Admin endpoints
│   │   ├── analytics/     # Analytics endpoints
│   │   ├── assignments/   # Assignments API
│   │   ├── auth/          # Authentication endpoints
│   │   ├── ctf-labs/      # CTF challenges API
│   │   ├── notes/         # Notes API
│   │   ├── study-sessions/ # Study tracking API
│   │   └── users/         # User management API
│   └── [pages]/           # Application pages
├── components/            # React components
│   ├── ui/               # UI components (Button, Input, etc.)
│   └── security-trainer/ # Domain-specific components
├── lib/                   # Utilities and helpers
│   ├── auth-server.ts     # JWT authentication
│   ├── auth-store.ts      # Zustand auth state
│   ├── api-middleware.ts  # API middleware
│   ├── admin-actions-utils.ts  # Admin action logging
│   ├── ctf-labs-utils.ts # CTF utilities
│   └── db.ts             # Prisma client
└── prisma/
    ├── schema.prisma      # Database schema
    └── seed-ctf-labs.ts   # CTF labs seed data
```

---

## Database

### Schema Management

```bash
# Generate Prisma Client
npm run db:generate

# Create new migration
npx prisma migrate dev --name description_of_changes

# Apply migrations to production DB
npx prisma migrate deploy

# Push schema to DB (development only)
npm run db:push

# Reset database (WARNING: destroys all data)
npm run db:reset

# Open Prisma Studio
npx prisma studio
```

### Seed Data

```bash
# Seed CTF labs
node prisma/seed-ctf-labs.js

# Seed other data
npm run db:seed
```

---

## Authentication

The app uses JWT-based authentication with httpOnly cookies.

### Available Roles
- `student` — Can access learning materials, take quizzes, complete CTF labs
- `teacher` — Can manage assignments, view student progress, create deadlines
- `admin` — Full access including user management and system settings

### Protected Endpoints

All `/api/*` endpoints (except `/api/auth/*`) require authentication via:
- httpOnly cookie (`auth-token`)
- Or Bearer token in `Authorization` header

```typescript
const response = await fetch('/api/protected', {
  headers: {
    'Content-Type': 'application/json',
    // Cookie is sent automatically
  },
});
```

---

## Admin Action Logging

All admin actions are logged to the `AdminAction` table for audit purposes.

### Logging an Action

```typescript
import { logAdminAction } from '@/lib/admin-actions-utils';

await logAdminAction({
  adminId: auth.id,
  adminName: auth.fullName || auth.email,
  actionType: 'user_create',  // See ADMIN_ACTION_TYPES
  targetType: 'user',         // See TARGET_TYPES
  targetId: userId,
  targetName: userName,
  details: 'Created new student account',
  metadata: { email: 'user@example.com', role: 'student' },
  ip: getClientIp(request),
  userAgent: request.headers.get('user-agent'),
});
```

### Viewing Admin Actions

- API: `GET /api/admin-actions`
- UI: `AdminActionsPanel` component
- Stats: `GET /api/admin-actions?stats=true`

---

## CTF Labs

### Adding a New CTF Challenge

1. Add to database via admin panel or seed script
2. Fields required:
   - `title`, `description`
   - `moduleId` — e.g., 'owasp', 'xss', 'sql-injection'
   - `difficulty` — 'easy', 'medium', 'hard', 'expert'
   - `type` — 'web', 'crypto', 'reverse', 'forensics', 'pwn', 'misc'
   - `points` — XP awarded on completion
   - `instructions` — Challenge instructions
   - `flag` — The flag students must submit

### Seed Script

Edit `prisma/seed-ctf-labs.ts` and run:

```bash
tsx prisma/seed-ctf-labs.ts
```

---

## Testing

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode
npm run test:unit:watch

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

---

## API Documentation

See [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) for complete API reference.

---

## Environment Variables

Required variables in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cybersec_lab"
NEXTAUTH_SECRET="your-secret-key"
TOKEN_SECRET="jwt-secret-key"
NODE_ENV="development"
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test:unit`
5. Commit with descriptive messages
6. Submit a pull request

---

## License

Proprietary — Contact the team for access.
