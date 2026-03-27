# MicroLearning Coach - Self-Hosting Guide

This guide explains how to export and deploy the MicroLearning Coach platform on your own server infrastructure.

## Architecture Overview

The application is a full-stack TypeScript project with the following components:

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React 19 + Tailwind CSS 4 | Single-page application with PWA support |
| Backend | Express 4 + tRPC 11 | API server with type-safe RPC procedures |
| Database | MySQL 8+ / TiDB | Relational data store for all platform data |
| File Storage | S3-compatible | Lesson media, certificates, and uploads |
| AI Integration | OpenAI-compatible API | Lesson generation and content personalization |

## Prerequisites

Before deploying, ensure your server has the following installed:

- **Node.js 20+** (LTS recommended)
- **pnpm 9+** (package manager)
- **MySQL 8.0+** or **TiDB** (database)
- **S3-compatible storage** (AWS S3, MinIO, Cloudflare R2, etc.)

## Step 1: Export the Project

Download the project files from the Manus dashboard (Code panel) or clone from the exported GitHub repository.

```bash
# If exported to GitHub
git clone https://github.com/your-org/microlearning-coach.git
cd microlearning-coach
```

## Step 2: Install Dependencies

```bash
pnpm install
```

## Step 3: Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/microlearning_coach

# Authentication (replace with your OAuth provider)
JWT_SECRET=your-secure-random-secret-at-least-32-chars
OAUTH_SERVER_URL=https://your-oauth-provider.com
VITE_OAUTH_PORTAL_URL=https://your-oauth-provider.com/login
VITE_APP_ID=your-oauth-app-id

# Owner info
OWNER_OPEN_ID=your-admin-open-id
OWNER_NAME=Admin

# S3 Storage (for file uploads)
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key

# AI/LLM Integration (OpenAI-compatible)
BUILT_IN_FORGE_API_URL=https://api.openai.com/v1
BUILT_IN_FORGE_API_KEY=sk-your-openai-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.openai.com/v1
VITE_FRONTEND_FORGE_API_KEY=sk-your-frontend-key

# App Configuration
VITE_APP_TITLE=MicroLearning Coach
VITE_APP_LOGO=https://your-cdn.com/logo.svg
```

### Authentication Options

The built-in authentication uses Manus OAuth. For self-hosting, you have several options:

**Option A: Replace with your own OAuth provider** (recommended for production)
- Modify `server/_core/oauth.ts` to integrate with your OAuth provider (Auth0, Okta, Keycloak, etc.)
- Update the callback handler to match your provider's token exchange flow

**Option B: Add local username/password auth**
- Add a password hash column to the users table
- Create login/register tRPC procedures
- Use bcrypt for password hashing

**Option C: Use an authentication service**
- Integrate with Clerk, Supabase Auth, or Firebase Auth
- Replace the session middleware in `server/_core/context.ts`

## Step 4: Initialize the Database

Run the database migration to create all tables:

```bash
pnpm db:push
```

This will generate and apply all migrations from the Drizzle schema.

## Step 5: Build for Production

```bash
pnpm build
```

This creates:
- `dist/` - Compiled server bundle
- `dist/client/` - Built frontend assets (via Vite)

## Step 6: Run in Production

```bash
NODE_ENV=production node dist/index.js
```

The server will start on the port defined by the `PORT` environment variable (defaults to 3000).

### Using PM2 (Recommended)

```bash
npm install -g pm2
pm2 start dist/index.js --name microlearning-coach
pm2 save
pm2 startup
```

### Using Docker

Create a `Dockerfile`:

```dockerfile
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t microlearning-coach .
docker run -d -p 3000:3000 --env-file .env microlearning-coach
```

### Using Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: microlearning_coach
      MYSQL_USER: mlcoach
      MYSQL_PASSWORD: securepassword
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

volumes:
  mysql_data:
```

## Step 7: Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name learn.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name learn.yourdomain.com;

    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Webhook Integration

The platform supports webhook integration with external workforce management systems.

### Endpoint

```
POST /api/webhooks/:orgSlug/:type
Headers: x-webhook-secret: <your-secret>
```

### Supported Types

| Type | Description | Payload |
|------|-------------|---------|
| `shift_sync` | Sync shift schedules | `{ shifts: [{ userId, startTime, endTime, shiftType, location }] }` |
| `roster_update` | Update team roster | `{ actions: [{ type: "add", userId }] }` |
| `assignment_trigger` | Trigger lesson assignments | `{ lessonId, userIds: [], priority, dueDate }` |

## PWA & Mobile

The application is a Progressive Web App (PWA) and can be installed on mobile devices:

- **iOS**: Open in Safari, tap Share, then "Add to Home Screen"
- **Android**: Open in Chrome, tap the install banner or menu "Install app"
- **Desktop**: Click the install icon in the browser address bar

The PWA includes:
- Offline caching via service worker
- Background sync for lesson progress
- Push notifications for new assignments
- IndexedDB for offline lesson storage

## Mobile App (Expo/React Native)

For native iOS and Android apps, the web application can be wrapped using Capacitor or a WebView-based approach. The PWA already provides native-like experience on mobile devices.

To create a native wrapper:

```bash
npx cap init "MicroLearning Coach" com.yourorg.microlearn
npx cap add ios
npx cap add android
pnpm build
npx cap sync
npx cap open ios  # Opens in Xcode
npx cap open android  # Opens in Android Studio
```

## Database Schema

The platform uses the following core tables:

| Table | Purpose |
|-------|---------|
| `users` | User accounts with roles and org membership |
| `organizations` | Multi-tenant organizations |
| `shifts` | Worker shift schedules |
| `lessons` | Micro-learning content |
| `assignments` | Lesson-to-user assignments |
| `lessonAttempts` | Progress tracking per attempt |
| `certificates` | Completion certificates |
| `notifications` | In-app notifications |
| `auditLogs` | Compliance audit trail |
| `webhookConfigs` | External system integrations |

## Troubleshooting

**Database connection fails**: Ensure your MySQL server is running and the `DATABASE_URL` is correct. Check that the database exists and the user has proper permissions.

**Build fails**: Run `pnpm install` again and ensure Node.js 20+ is installed. Check for TypeScript errors with `npx tsc --noEmit`.

**Auth not working**: Verify all OAuth environment variables are set correctly. For self-hosted auth, ensure the callback URL matches your domain.

**S3 uploads fail**: Verify S3 credentials and bucket permissions. The bucket should allow public read access for lesson media.

## Support

For issues with the self-hosted deployment, check the server logs:

```bash
# PM2 logs
pm2 logs microlearning-coach

# Docker logs
docker logs microlearning-coach
```
