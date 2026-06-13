# AI_CONTEXT.md — FairShare MVP (Source of Truth)

> **Status:** Phase 0 complete — ready for Phase 1 (Auth)  
> **Last updated:** 2026-06-13  
> **App name:** FairShare  
> **Tagline:** Track shared expenses and settle up easily.

---

## 1. Project overview

| Field | Value |
|-------|-------|
| **Assignment** | Reverse engineer Splitwise, scope a realistic MVP, build and deploy an application |
| **Reference product** | [Splitwise](https://www.splitwise.com/) |
| **Product name** | **FairShare** |
| **Current phase** | Phase 0 complete → Phase 1 (Auth) |
| **Implementation** | Phase 0 scaffold deployed locally |
| **Team** | Solo developer |
| **Budget** | Free-tier services only |
| **Timeline** | Not specified by stakeholder |

### 1.1 Tech stack (locked)

| Layer | Technology | Hosting |
|-------|------------|---------|
| Frontend | React (**JavaScript**), Vite, Tailwind CSS **v4**, React Router DOM, Axios, TanStack Query, shadcn/ui (prep), Socket.io Client | Vercel |
| Backend | Node.js, Express (**JavaScript**), Prisma ORM, Zod, JWT, bcrypt, Socket.io | Render |
| Database | PostgreSQL | Neon |
| Testing | Vitest (backend) | Local |
| Repo | npm workspaces monorepo: `/frontend`, `/backend` | — |
| Tooling | ESLint (flat config), Prettier, concurrently | — |

### 1.2 Deployment stack

| Service | Role |
|---------|------|
| Neon | PostgreSQL database |
| Render | Express + Socket.io backend |
| Vercel | React frontend |

Default URLs (no custom domain).

### 1.3 Evaluation criteria (priority order)

1. Feature completeness against assignment requirements
2. Code quality and maintainable architecture
3. Correct database design and balance calculations
4. Deployment and working demo
5. Documentation (`AI_CONTEXT.md`, `BUILD_PLAN.md`, `README.md`)
6. Product understanding and explainable decisions
7. Responsive user experience (mobile-first)

---

## 2. Decision log

| ID | Date | Decision | Rationale | Status |
|----|------|----------|-----------|--------|
| D-001 | 2026-06-13 | Responsive web app only | Assignment scope | Locked |
| D-002 | 2026-06-13 | Free-tier: Neon + Render + Vercel | Budget | Locked |
| D-003 | 2026-06-13 | No debt simplification | Out of scope | Locked |
| D-004 | 2026-06-13 | No email invitations | Email search only | Locked |
| D-005 | 2026-06-13 | Settlements recorded only | No payment gateway | Locked |
| D-006 | 2026-06-13 | Single currency: **INR (₹)**, 2 decimals, Indian locale | Out of scope for multi-currency | Locked |
| D-007 | 2026-06-13 | Four split methods required | Success criteria | Locked |
| D-008 | 2026-06-13 | Real-time expense chat via Socket.io | Success criteria | Locked |
| D-009 | 2026-06-13 | Demo scale: ~50–100 users, 50+ groups | No production scale | Locked |
| D-010 | 2026-06-13 | Email + password auth only | MVP scope | Locked |
| D-011 | 2026-06-13 | No email verification, no password reset | MVP scope | Locked |
| D-012 | 2026-06-13 | JWT in HTTP-only cookie | Security | Locked |
| D-013 | 2026-06-13 | Add members by email search | No invite links | Locked |
| D-014 | 2026-06-13 | Roles: Admin, Member | Permission model | Locked |
| D-015 | 2026-06-13 | Group archive = soft delete | Preserve data | Locked |
| D-016 | 2026-06-13 | Expense edit/delete: creator or admin | Standard behavior | Locked |
| D-017 | 2026-06-13 | Rounding remainder to **last participant in UI selection order** | Consistent logic | Locked |
| D-018 | 2026-06-13 | Payer can be included or excluded | Match Splitwise | Locked |
| D-019 | 2026-06-13 | Net balance + all non-zero pairwise debts; hide zeros | UX | Locked |
| D-020 | 2026-06-13 | Partial settlements; no over-settlement; admin-only delete | Financial accuracy | Locked |
| D-021 | 2026-06-13 | Chat moderation: sender + admin delete | Moderation | Locked |
| D-022 | 2026-06-13 | Vitest unit tests for balance logic | Testing | Locked |
| D-023 | 2026-06-13 | Mobile-first responsive design | UX | Locked |
| D-024 | 2026-06-13 | **ExpenseSplit** table stores computed owed amounts | Auditability | Locked |
| D-025 | 2026-06-13 | **ExpenseParticipant** stores input split values + order | Rounding order | Locked |
| D-026 | 2026-06-13 | Balances computed on read (ledger); nothing stored | Always accurate | Locked |
| D-027 | 2026-06-13 | Soft delete expenses and messages (`deletedAt`) | Data preservation | Locked |
| D-028 | 2026-06-13 | Sole admin must transfer admin before leaving | Group continuity | Locked |
| D-029 | 2026-06-13 | Archived groups in separate view | UX | Locked |
| D-030 | 2026-06-13 | Category as predefined enum dropdown | Consistency | Locked |
| D-031 | 2026-06-13 | Optional custom expense date; default now | Flexibility | Locked |
| D-032 | 2026-06-13 | Pagination for expenses and messages | Scalability | Locked |
| D-033 | 2026-06-13 | Zod validation on backend | Type-safe validation | Locked |
| D-034 | 2026-06-13 | JWT expiry 7 days; no refresh token | MVP simplicity | Locked |
| D-035 | 2026-06-13 | Cookie: httpOnly, secure (prod), sameSite none | Cross-origin Vercel↔Render | Locked |
| D-036 | 2026-06-13 | Password min 8 chars, no complexity rules | MVP simplicity | Locked |
| D-037 | 2026-06-13 | TanStack Query + React Context (auth) | Server state | Locked |
| D-038 | 2026-06-13 | Sidebar (desktop) + bottom nav (mobile) | Layout | Locked |
| D-039 | 2026-06-13 | Socket.io JWT auth on connect | Security | Locked |
| D-040 | 2026-06-13 | Prisma seed with demo data + README credentials | Evaluator demo | Locked |
| D-041 | 2026-06-13 | **Dark mode** included in MVP | Final scope | Locked |
| D-042 | 2026-06-13 | **JavaScript only** — no TypeScript (`.js` / `.jsx`) | Stakeholder preference | Locked |
| D-043 | 2026-06-13 | Tailwind CSS **v4** via `@tailwindcss/vite` plugin | Stakeholder preference | Locked |
| D-044 | 2026-06-13 | No `tailwind.config.js` or `postcss.config.js` | Tailwind v4 Vite plugin | Locked |
| D-045 | 2026-06-13 | npm **workspaces** monorepo with root `npm run dev` | Phase 0 scaffold | Locked |

---

## 3. Requirements

### 3.1 Functional requirements (summary)

| Area | Key requirements |
|------|------------------|
| **Auth** | Register, login, logout, JWT cookie, protected routes, user search by email |
| **Groups** | CRUD (archive), add/remove members, leave, admin transfer, roles |
| **Expenses** | CRUD (soft delete), 4 split methods, subset participants, optional date & category |
| **Balances** | Net per member, all pairwise debts, group + dashboard summary |
| **Settlements** | Record partial/full, validate cap, history, admin delete |
| **Chat** | Per-expense thread, Socket.io real-time, soft delete, paginated history |
| **UI** | Responsive mobile-first, dark mode, INR formatting |

### 3.2 Non-functional requirements

| ID | Requirement |
|----|-------------|
| NFR-001 | Deployed on Vercel + Render + Neon |
| NFR-002 | ~50–100 users, 50+ groups, hundreds of expenses |
| NFR-003 | Balance accuracy to 2 decimals; Vitest coverage |
| NFR-004 | Maintainable monorepo architecture |
| NFR-005 | Full documentation suite |
| NFR-006 | JWT httpOnly cookie, bcrypt, CORS + credentials |

### 3.3 Explicitly out of scope

OAuth, email verification, password reset, email invitations, join links, payment gateway, multi-currency, OCR receipts, push notifications, native mobile apps, Splitwise Pro, debt simplification, typing indicators, E2E tests (optional only), custom domain, refresh tokens.

### 3.4 Final MVP feature checklist

- [x] Authentication
- [x] Group management
- [x] Member management
- [x] Expense management
- [x] Equal / Unequal / Percentage / Share splits
- [x] Balance summaries (net + pairwise)
- [x] Settlements
- [x] Expense chat (real-time)
- [x] Responsive UI
- [x] Dark mode
- [x] Deployment

---

## 4. Assumptions

| ID | Assumption | Status |
|----|------------|--------|
| A-001 | Responsive web app | Confirmed |
| A-002 | MVP = Splitwise subset | Confirmed |
| A-003 | Must be deployed | Confirmed |
| A-004 | Recreatable from this doc | Confirmed |
| A-005 | Email search for adding members | Confirmed |
| A-006 | INR (₹) only, Indian locale formatting | Confirmed |
| A-007 | Settlement = record only | Confirmed |
| A-008 | Expense-level chat | Confirmed |
| A-009 | Group creator = initial Admin | Confirmed |
| A-010 | React/Vite + Express/Prisma stack | Confirmed |
| A-011 | Ledger compute-on-read | Confirmed |
| A-012 | Archived groups in separate view | Confirmed |
| A-013 | No refresh token; 7-day JWT | Confirmed |
| A-014 | Socket.io on same Render instance as Express | Confirmed |

---

## 5. Data model (Prisma schema spec)

### 5.1 Enums

```prisma
enum GroupRole {
  ADMIN
  MEMBER
}

enum SplitType {
  EQUAL
  UNEQUAL
  PERCENTAGE
  SHARE
}

enum ExpenseCategory {
  FOOD
  TRANSPORT
  ACCOMMODATION
  ENTERTAINMENT
  UTILITIES
  SHOPPING
  OTHER
}
```

### 5.2 Entities

#### User
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| fullName | String | |
| email | String | Unique |
| passwordHash | String | bcrypt |
| avatarUrl | String? | Optional |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### Group
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | String | Required |
| description | String? | Optional |
| createdById | UUID | FK → User |
| archived | Boolean | Default false |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### GroupMember
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| groupId | UUID | FK → Group |
| userId | UUID | FK → User |
| role | GroupRole | ADMIN or MEMBER |
| joinedAt | DateTime | |
| | | Unique (groupId, userId) |

#### Expense
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| groupId | UUID | FK → Group |
| title | String | Required |
| amount | Decimal(12,2) | Total expense |
| paidById | UUID | FK → User (single payer) |
| splitType | SplitType | |
| category | ExpenseCategory? | Optional enum |
| notes | String? | Optional |
| expenseDate | DateTime | Default now; user can override |
| createdById | UUID | FK → User |
| deletedAt | DateTime? | Soft delete |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### ExpenseParticipant
Stores **input** for split calculation and **UI selection order** for rounding.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| expenseId | UUID | FK → Expense |
| userId | UUID | FK → User |
| splitValue | Decimal(12,4)? | Meaning by splitType (see below) |
| sortOrder | Int | UI selection order; last gets remainder |
| | | Unique (expenseId, userId) |

**splitValue meaning:**
| SplitType | splitValue |
|-----------|------------|
| EQUAL | null (ignored) |
| UNEQUAL | Exact amount owed |
| PERCENTAGE | Percentage (e.g. 33.33) |
| SHARE | Share count (e.g. 2) |

#### ExpenseSplit
Stores **computed** final amount each participant owes the payer.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| expenseId | UUID | FK → Expense |
| userId | UUID | FK → User (participant) |
| amountOwed | Decimal(12,2) | Final calculated share |
| | | Unique (expenseId, userId) |

Created/updated whenever expense is created or edited. Used as ledger input for balance computation.

#### Settlement
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| groupId | UUID | FK → Group |
| payerId | UUID | FK → User (who paid) |
| receiverId | UUID | FK → User (who received) |
| amount | Decimal(12,2) | |
| note | String? | |
| createdById | UUID | FK → User |
| createdAt | DateTime | No edit after creation |

#### Message
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| expenseId | UUID | FK → Expense |
| senderId | UUID | FK → User |
| message | String | |
| deletedAt | DateTime? | Soft delete |
| createdAt | DateTime | |

### 5.3 Entity relationships

```
User ──┬── GroupMember ── Group
       ├── Expense (paidBy, createdBy)
       ├── ExpenseParticipant
       ├── ExpenseSplit
       ├── Settlement (payer, receiver, createdBy)
       └── Message (sender)

Group ──┬── GroupMember
        ├── Expense
        └── Settlement

Expense ──┬── ExpenseParticipant (input + order)
          ├── ExpenseSplit (computed ledger)
          └── Message
```

---

## 6. Business logic

### 6.1 Split calculation

On expense create/update:

1. Validate participants are group members
2. Validate split inputs per type:
   - **EQUAL:** no input needed
   - **UNEQUAL:** sum of splitValues === expense.amount
   - **PERCENTAGE:** sum of splitValues === 100
   - **SHARE:** positive integer shares
3. Compute `amountOwed` per participant (respecting payer included/excluded flag)
4. Apply rounding: last participant by `sortOrder` receives remainder
5. Persist `ExpenseParticipant` (input) + `ExpenseSplit` (computed)

**Payer excluded:** payer not in participants → payer paid full amount, participants owe their splits to payer.

**Payer included:** payer is in participants → payer's own share reduces net debt (standard Splitwise).

### 6.2 Balance computation (on read)

**Pairwise debt** from A to B in group G:

```
debt(A→B) =
  Σ ExpenseSplit.amountOwed where expense.paidBy=B AND split.userId=A AND expense.deletedAt IS NULL
  − Σ ExpenseSplit.amountOwed where expense.paidBy=A AND split.userId=B AND expense.deletedAt IS NULL
  − Σ Settlement.amount where payer=A AND receiver=B
  + Σ Settlement.amount where payer=B AND receiver=A
```

Only show pairs where `debt > 0` (hide zero balances).

**Net balance** for user U in group G:

```
net(U) = Σ debt(X→U) for all X − Σ debt(U→X) for all X
```

Positive net = U is owed money. Negative net = U owes money.

**Dashboard summary** (across all non-archived groups for user U):

```
totalOwed = Σ max(0, −net(U) in group)   // amounts U owes
totalOwedToUser = Σ max(0, net(U) in group)  // amounts owed to U
netBalance = totalOwedToUser − totalOwed
```

### 6.3 Settlement validation

Before creating settlement (payer P, receiver R, amount A):

```
currentDebt = debt(P→R)  // computed on read
Reject if A > currentDebt (over-settlement)
Reject if A <= 0
```

### 6.4 Admin leave rule

If user is sole ADMIN in group:
- Block leave action
- Require promoting another member to ADMIN first

### 6.5 Permissions matrix

| Action | Admin | Member |
|--------|-------|--------|
| View group | ✓ | ✓ |
| Add expense | ✓ | ✓ |
| Edit/delete own expense | ✓ | ✓ |
| Edit/delete any expense | ✓ | — |
| Record settlement | ✓ | ✓ |
| Delete settlement | ✓ | — |
| Chat (send/view) | ✓ | ✓ |
| Delete own message | ✓ | ✓ |
| Delete any message | ✓ | — |
| Add member | ✓ | — |
| Remove member | ✓ | — |
| Edit group details | ✓ | — |
| Archive group | ✓ | — |
| Leave group | ✓* | ✓ |
| Promote to admin | ✓ | — |

*Blocked if sole admin without transfer.

---

## 7. API specification

**Base path:** `/api/v1`

**Error format:**
```json
{ "error": "Validation failed", "code": "VALIDATION_ERROR" }
```

**Pagination query params:** `page` (default 1), `limit` (default 20)

**Auth:** JWT in HTTP-only cookie; all routes except register/login require auth.

### 7.1 Routes

```
POST   /api/v1/auth/register          { fullName, email, password }
POST   /api/v1/auth/login             { email, password }
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

GET    /api/v1/users/search?email=

GET    /api/v1/groups                 ?archived=false
POST   /api/v1/groups                 { name, description? }
GET    /api/v1/groups/:id
PATCH  /api/v1/groups/:id             { name?, description? }
DELETE /api/v1/groups/:id             (sets archived=true)

POST   /api/v1/groups/:id/members     { email }
DELETE /api/v1/groups/:id/members/:userId
POST   /api/v1/groups/:id/leave
PATCH  /api/v1/groups/:id/members/:userId/role  { role: ADMIN | MEMBER }

GET    /api/v1/groups/:id/expenses    ?page=&limit=
POST   /api/v1/groups/:id/expenses    { title, amount, paidById, splitType, category?, notes?, expenseDate?, participants[], payerIncluded }
GET    /api/v1/expenses/:id
PATCH  /api/v1/expenses/:id
DELETE /api/v1/expenses/:id           (soft delete)

GET    /api/v1/groups/:id/balances
GET    /api/v1/users/me/balances      (dashboard summary)

GET    /api/v1/groups/:id/settlements
POST   /api/v1/groups/:id/settlements { payerId, receiverId, amount, note? }
DELETE /api/v1/groups/:id/settlements/:id

GET    /api/v1/expenses/:id/messages  ?page=&limit=
DELETE /api/v1/expenses/:id/messages/:id  (soft delete)
```

### 7.2 Socket.io events

**Connection:** JWT validated from cookie on handshake.

**Room:** `expense:{expenseId}` — join only if user is group member.

| Direction | Event | Payload |
|-----------|-------|---------|
| C→S | `message:send` | `{ expenseId, message }` |
| C→S | `message:delete` | `{ messageId }` |
| S→C | `message:new` | `{ id, expenseId, senderId, sender, message, createdAt }` |
| S→C | `message:deleted` | `{ messageId }` |

---

## 8. Frontend specification

### 8.1 Routes

| Path | Page | Auth |
|------|------|------|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/dashboard` | Groups list + overall balance summary | Protected |
| `/groups/new` | Create group | Protected |
| `/groups/:id` | Group detail (expenses, balances, members, settlements) | Protected |
| `/groups/:id/expenses/new` | Create expense | Protected |
| `/groups/:id/expenses/:expenseId` | Expense detail + chat | Protected |

Unauthenticated → redirect to `/login`.

### 8.2 State management

| Concern | Tool |
|---------|------|
| Auth (user session) | React Context |
| Server data (groups, expenses, balances) | TanStack Query |
| HTTP | Axios (`withCredentials: true`) |
| Real-time | socket.io-client |
| Theme (dark mode) | React Context or localStorage + Tailwind dark class |

### 8.3 Layout

| Breakpoint | Navigation |
|------------|------------|
| Mobile | Bottom navigation bar |
| Tablet | Adaptive (sidebar collapsible or bottom nav) |
| Desktop | Sidebar navigation |

### 8.4 UI requirements

- Mobile-first Tailwind + shadcn/ui components
- Dark mode toggle (persist preference in localStorage)
- Currency: INR formatted as `₹1,000.00` (Indian locale `en-IN`)
- Hide zero balances by default
- Archived groups accessible via toggle/link on dashboard

---

## 9. Auth specification

| Setting | Value |
|---------|-------|
| Password hash | bcrypt |
| Password rules | Min 8 characters |
| Token | JWT, 7-day expiry |
| Refresh token | None |
| Cookie | `httpOnly: true`, `secure: true` (production), `sameSite: 'none'` |
| CORS | `credentials: true`, origin = `FRONTEND_URL` |

---

## 10. Testing specification

**Runner:** Vitest

**Required unit test cases:**

1. Equal split with remainder (e.g. ₹10.00 / 3)
2. Unequal split validation (sum mismatch → reject)
3. Percentage split validation (≠ 100% → reject)
4. Percentage rounding remainder to last participant
5. Share split (2:1:1 on ₹400)
6. Payer included in participants
7. Payer excluded from participants
8. Partial settlement reduces debt correctly
9. Over-settlement rejected
10. Multiple expenses aggregate correctly
11. Multiple settlements aggregate correctly
12. Group balance calculation (net + pairwise)
13. User dashboard balance summary across groups

---

## 11. Deployment specification

### 11.1 Environment variables

**Backend (Render):**
```
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

**Frontend (Vercel):**
```
VITE_API_URL=https://your-api.onrender.com
```

### 11.2 Render build

```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
npm start
```

### 11.3 Seed data

`prisma/seed.ts` creates demo users, groups, expenses, settlements.

**Demo credentials (document in README):**
- alice@demo.com / password123
- bob@demo.com / password123

---

## 12. Risks & tradeoffs

| Risk | Mitigation |
|------|------------|
| Balance bugs | Vitest suite; ExpenseSplit as auditable ledger |
| Render cold starts | Document; Socket.io reconnect |
| Cross-origin cookies | sameSite none + secure + CORS credentials |
| Dark mode scope | shadcn/ui built-in dark support |
| ExpenseSplit sync on edit | Recompute and replace splits in transaction |

---

## 13. Build plan

See **[BUILD_PLAN.md](./BUILD_PLAN.md)** for phased implementation.

---

## 14. Implementation notes (Phase 0)

### 14.1 Language & file conventions

- **JavaScript only** — all source files use `.js` or `.jsx`
- No TypeScript (`.ts`, `.tsx`) in frontend or backend
- Frontend path alias: `@/` → `frontend/src/`

### 14.2 Frontend setup (Phase 0)

**Tailwind CSS v4** — no config files:

```js
// frontend/vite.config.js
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```css
/* frontend/src/index.css */
@import 'tailwindcss';
```

**Not generated:** `tailwind.config.js`, `postcss.config.js`

**shadcn/ui prep:** `jsconfig.json` path alias, `src/lib/utils.js` (`cn` helper with `clsx` + `tailwind-merge`). Components added in Phase 7.

**Env:** `VITE_API_URL` (default `http://localhost:3001`)

### 14.3 Backend setup (Phase 0)

- Express app factory: `src/app.js` (testable without listening)
- Entry point: `src/index.js` (HTTP server + Socket.io stub)
- Health route: `GET /api/v1/health`
- Prisma schema: datasource only (models in Phase 1)
- Vitest + supertest for health endpoint test

**Env:** `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`

### 14.4 Root scripts

| Command | Action |
|---------|--------|
| `npm run dev` | Start frontend (5173) + backend (3001) concurrently |
| `npm run lint` | ESLint both workspaces |
| `npm run test` | Vitest (backend) |
| `npm run build` | Vite production build (frontend) |
| `npm run format` | Prettier write |

### 14.5 Phase 0 folder structure

```
/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/ui/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── lib/          # api.js, utils.js
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── eslint.config.js
│   ├── jsconfig.json
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/       # health.js, index.js
│   │   ├── services/
│   │   ├── socket/
│   │   ├── app.js
│   │   └── index.js
│   ├── tests/health.test.js
│   ├── .env.example
│   ├── eslint.config.js
│   ├── vitest.config.js
│   └── package.json
├── package.json          # workspaces root
├── .prettierrc
├── .gitignore
├── AI_CONTEXT.md
├── BUILD_PLAN.md
└── README.md
```

### 14.6 Phase 0 verification

- `GET http://localhost:3001/api/v1/health` → `{ status: "ok", message: "FairShare API is running" }`
- Frontend loads at `http://localhost:5173` and displays health status
- `npm run test` passes
- `npm run lint` passes
- `npm run build` succeeds
