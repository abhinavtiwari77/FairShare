# FairShare

Track shared expenses and settle up easily.

Splitwise-style expense sharing MVP built as an internship assignment.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React (JavaScript), Vite, Tailwind CSS v4, React Router, Axios, TanStack Query, Socket.io Client, shadcn/ui |
| Backend | Node.js, Express, Prisma, PostgreSQL, Zod, JWT, Socket.io |
| Hosting | Vercel (frontend), Render (backend), Neon (database) |

## Project structure

```
/
├── frontend/     # React + Vite app
├── backend/      # Express API + Socket.io
├── prompts/      # Discovery prompts
├── AI_CONTEXT.md # Source of truth
└── BUILD_PLAN.md # Phased implementation plan
```

## Local setup

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL (optional for Phase 0; required from Phase 1)

### Install

```bash
npm install
```

### Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Run (Phase 0)

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health check: http://localhost:3001/api/v1/health

### Other commands

```bash
npm run lint        # ESLint (frontend + backend)
npm run test        # Vitest (backend)
npm run format      # Prettier
npm run build       # Frontend production build
```

## Documentation

- [AI_CONTEXT.md](./AI_CONTEXT.md) — requirements, decisions, and specifications
- [BUILD_PLAN.md](./BUILD_PLAN.md) — phased build plan

## Status

**Phase 0 complete** — monorepo scaffold, health check, tooling configured.
