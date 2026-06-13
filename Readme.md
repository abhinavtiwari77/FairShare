# FairShare

> Track shared expenses without the spreadsheets. A modern, AI-collaborated full-stack application built to simplify group expenses.

![Landing Page](/path/to/landing-placeholder.png)

## 1. Project Overview
FairShare is a complete, production-grade expense-sharing application inspired by tools like Splitwise. It allows users to create groups, log shared expenses, split costs using various algorithms, discuss details in real-time chat, and efficiently settle up debts using an optimized balance-tracking engine.

This project was built from scratch as part of an intensive software engineering assignment, demonstrating full-stack proficiency, rigorous testing, and advanced AI-assisted development techniques.

## 2. Features
- **Authentication**: Secure JWT-based authentication via HTTP-only cookies.
- **Group Management**: Create groups, invite members via email, and assign Admin/Member roles.
- **Smart Expense Splitting**: Supports Equal, Exact Amount, Percentage, and Fractional Share splitting algorithms, with perfect cent-level precision.
- **Optimized Balances**: Automatically calculates "Who owes whom" to simplify complex group debts.
- **Real-Time Chat**: Live, room-based websocket chat for discussing individual expenses.
- **Settlements**: Record partial or full payments to instantly update group balances.
- **Polished UI/UX**: A dark-mode ready, fully responsive interface inspired by modern SaaS platforms (Vercel, Linear, Stripe).

## 3. Screenshots

| Dashboard | Group Details | Expense Splitting |
| :---: | :---: | :---: |
| ![Dashboard Placeholder](/path/to/dashboard.png) | ![Group Placeholder](/path/to/group.png) | ![Expense Placeholder](/path/to/expense.png) |

## 4. Tech Stack
**Frontend:**
- React 18, React Router DOM
- Vite, Tailwind CSS v4
- Lucide React (Icons), Radix UI Primitives
- Context API (State Management)

**Backend:**
- Node.js, Express
- Socket.io (Real-time events)
- Prisma ORM
- Zod (Request validation)
- JSON Web Tokens (JWT), bcrypt

**Database & DevOps:**
- PostgreSQL (via Neon)
- Vitest (Unit & Integration Testing)
- ESLint, Prettier

## 5. Architecture
FairShare is structured as a monolithic repository using npm workspaces.
- **Frontend Layer**: A Single Page Application (SPA) communicating via RESTful API calls and Socket.io events.
- **Backend Layer**: A modular Express application following the Controller-Service-Route pattern.
- **Data Layer**: Prisma ORM manages PostgreSQL, ensuring strict foreign key constraints and type safety.

## 6. Database Schema Summary
The application is backed by a robust relational schema:
- `User`: Authentication and profile details.
- `Group` & `GroupMember`: Many-to-many relationship managing access control and roles.
- `Expense`: Represents a logged cost.
- `ExpenseParticipant`: Tracks who is involved in the expense.
- `ExpenseSplit`: An immutable ledger of exact amounts owed.
- `Message`: Real-time chat history linked to an Expense.
- `Settlement`: Tracks payments made between users to reduce debt.

## 7. API Overview
All API endpoints are versioned (`/api/v1`) and secured using JWT middleware:
- `/auth`: Registration, login, logout, and session validation.
- `/users`: Fetch user profiles and global balance summaries.
- `/groups`: CRUD operations for groups and member management.
- `/expenses`: Creating expenses and calculating splits transactionally.
- `/messages`: Fetching and soft-deleting chat history.
- `/settlements`: Recording payments and verifying against over-settlement.
- `/balances`: Dynamically aggregating debts from Expenses and Settlements.

## 8. Local Setup
Ensure you have Node.js (v18+) and PostgreSQL installed.

```bash
# Clone the repository
git clone https://github.com/abhinavtiwari77/Splitwise.git
cd Splitwise

# Install dependencies
npm install

# Setup Database
cd backend
npx prisma migrate dev
```

## 9. Environment Variables
Create a `.env` file in the `backend` directory:
```env
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/fairshare"
JWT_SECRET="your_super_secret_jwt_key"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL="http://localhost:3001"
```

Start the application:
```bash
# In the root directory
npm run dev
```

## 10. Deployment Steps
1. **Database**: Provision a PostgreSQL database (e.g., Neon, Supabase) and obtain the connection string.
2. **Backend (Render)**:
   - Connect the repository to a Render Web Service.
   - Set Build Command: `cd backend && npm install && npx prisma generate`
   - Set Start Command: `cd backend && npm start`
   - Add all backend Environment Variables (ensure `NODE_ENV=production`).
3. **Frontend (Vercel)**:
   - Connect the repository to Vercel.
   - Set Root Directory to `frontend`.
   - Add the `VITE_API_URL` environment variable pointing to the deployed backend URL.

## 11. AI Collaboration Process
This project was built entirely using an advanced Agentic AI coding assistant (Google DeepMind's Antigravity). The development process adhered to strict planning workflows, continuous unit testing, and sequential execution. The AI acted as the lead engineer, while the user provided architectural direction, design inspiration, and PR approvals.

## 12. BUILD_PLAN.md Reference
The entire project trajectory was meticulously mapped out in `BUILD_PLAN.md`. This living document tracked the status of 9 distinct phases, ensuring logical progression from database scaffolding to final UI polish.

## 13. AI_CONTEXT.md Reference
`AI_CONTEXT.md` served as the ultimate source of truth for the AI agent. It contained the strict business rules, schema constraints, and technical boundary definitions required to maintain consistency across the entire codebase during development.

## 14. Future Improvements
- **Push Notifications**: Integrate web push notifications for new expenses and chat messages.
- **Activity Feed**: Add a global audit log showing recent group activities.
- **Multiple Currencies**: Support conversion and splitting across international currencies.
- **Receipt Parsing**: Utilize OCR to automatically itemize and split physical receipts.
