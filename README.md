# Startup Platform

A production-oriented Bun monorepo for a startup community platform: an Expo mobile client and a Bun/Express API backed by PostgreSQL and Prisma.

## Prerequisites

- [Bun](https://bun.sh) 1.2+
- PostgreSQL 16+
- Expo Go or an iOS/Android simulator for mobile development

## Installation

```sh
cd startup-platform
bun install
cp backend/.env.example backend/.env
```

Set `DATABASE_URL`, `JWT_SECRET` (at least 32 characters), and `CORS_ORIGIN` in `backend/.env`. For a physical mobile device, set `CORS_ORIGIN` and `EXPO_PUBLIC_API_URL` to your computer's LAN address, for example `http://192.168.1.10:4000` and `http://192.168.1.10:4000/api`.

## Database

Create the PostgreSQL database, then generate the client and create the first migration:

```sh
bun run --cwd backend prisma:generate
bun run --cwd backend prisma:migrate -- --name init
```

Use `bun run --cwd backend prisma:deploy` in deployment environments.

## Run locally

```sh
# API: http://localhost:4000/api/health
bun run dev:backend

# Expo development server
bun run dev:mobile
```

Useful quality commands:

```sh
bun run typecheck
bun run lint
bun run build
bun run format:check
```

## Environment variables

| Variable              | Required | Description                            |
| --------------------- | -------- | -------------------------------------- |
| `DATABASE_URL`        | Yes      | PostgreSQL connection string           |
| `JWT_SECRET`          | Yes      | JWT signing secret, 32+ characters     |
| `JWT_EXPIRES_IN`      | No       | Token lifetime, default `7d`           |
| `PORT`                | No       | API port, default `4000`               |
| `CORS_ORIGIN`         | No       | Comma-separated trusted client origins |
| `EXPO_PUBLIC_API_URL` | Mobile   | API base URL ending in `/api`          |

## Project structure

```text
startup-platform/
├── backend/     # Express API, Prisma schema, JWT auth
├── mobile/      # Expo Router application with NativeWind
├── docs/        # Architecture notes
├── .vscode/     # Shared editor settings
└── package.json # Bun workspace scripts
```

## API

- `GET /api/health` → `{ "status": "ok" }`
- `POST /api/auth/register` → creates a user, hashes the password with bcrypt, returns a JWT
- `POST /api/auth/login` → returns a JWT for valid credentials

Authentication expects `Authorization: Bearer <token>`. Secrets are intentionally excluded from version control. The API has strict TypeScript, request validation, centralized errors, a prepared in-memory Multer configuration, and graceful Prisma shutdown.
