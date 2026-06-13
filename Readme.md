<div align="center">
  
# 🥧 FairShare

**Track shared expenses without the spreadsheets.**
A modern, AI-collaborated full-stack application built to simplify group expenses.

[![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-informational.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

<img src="https://github.com/user-attachments/assets/4863bbac-809c-46ce-9f07-3192bd18a4b0" alt="Landing Page" width="100%" style="border-radius: 12px; margin-top: 20px;" />

</div>

---

## 📖 1. Project Overview
FairShare is a complete, production-grade expense-sharing application inspired by tools like Splitwise. It allows users to create groups, log shared expenses, split costs using various algorithms, discuss details in real-time chat, and efficiently settle up debts using an optimized balance-tracking engine.

This project was built from scratch as part of an intensive software engineering assignment, demonstrating full-stack proficiency, rigorous testing, and advanced AI-assisted development techniques.

## ✨ 2. Features
- 🔒 **Authentication**: Secure JWT-based authentication via HTTP-only cookies.
- 👥 **Group Management**: Create groups, invite members via email, and assign Admin/Member roles.
- 🧮 **Smart Expense Splitting**: Supports Equal, Exact Amount, Percentage, and Fractional Share splitting algorithms, with perfect cent-level precision.
- ⚖️ **Optimized Balances**: Automatically calculates "Who owes whom" to simplify complex group debts.
- 💬 **Real-Time Chat**: Live, room-based websocket chat for discussing individual expenses.
- 💳 **Settlements**: Record partial or full payments to instantly update group balances.
- 🎨 **Polished UI/UX**: A dark-mode ready, fully responsive interface inspired by modern SaaS platforms (Vercel, Linear, Stripe).

## 🔑 3. Demo Credentials

If you want to test the application quickly without registering, use the following pre-seeded demo accounts:

| User | Email | Password |
| :--- | :--- | :--- |
| **Alice Smith** | `alice@demo.com` | `password123` |
| **Bob Johnson** | `bob@demo.com` | `password123` |
| **Charlie Davis** | `charlie@demo.com` | `password123` |

## 📸 4. Screenshots

| Dashboard | Group Details | Expense Splitting |
| :---: | :---: | :---: |
| <img src="https://github.com/user-attachments/assets/79692ed7-d3ac-4be5-b480-23d262859b21" alt="Dashboard" style="border-radius: 8px;" /> | <img src="https://github.com/user-attachments/assets/e4535c95-abc4-495a-b2dd-0ae2069ba0c7" alt="Group Details" style="border-radius: 8px;" /> | <img src="https://github.com/user-attachments/assets/ca834469-2cf3-420f-8140-daf8bd822bd9" alt="Expense Splitting" style="border-radius: 8px;" /> |

## 🛠️ 4. Tech Stack

### Frontend
- **Framework**: React 18, React Router DOM
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons & Components**: Lucide React, Radix UI Primitives
- **State Management**: Context API

### Backend
- **Server**: Node.js, Express
- **Real-time Events**: Socket.io
- **ORM**: Prisma
- **Validation**: Zod
- **Security**: JSON Web Tokens (JWT), bcrypt

### Database & DevOps
- **Database**: PostgreSQL (via Neon)
- **Testing**: Vitest (Unit & Integration Testing)
- **Linting**: ESLint, Prettier

## 🏗️ 5. Architecture
FairShare is structured as a monolithic repository using npm workspaces.
- **Frontend Layer**: A Single Page Application (SPA) communicating via RESTful API calls and Socket.io events.
- **Backend Layer**: A modular Express application following the Controller-Service-Route pattern.
- **Data Layer**: Prisma ORM manages PostgreSQL, ensuring strict foreign key constraints and type safety.

## 🗄️ 6. Database Schema Summary
The application is backed by a robust relational schema:
- `User`: Authentication and profile details.
- `Group` & `GroupMember`: Many-to-many relationship managing access control and roles.
- `Expense`: Represents a logged cost.
- `ExpenseParticipant`: Tracks who is involved in the expense.
- `ExpenseSplit`: An immutable ledger of exact amounts owed.
- `Message`: Real-time chat history linked to an Expense.
- `Settlement`: Tracks payments made between users to reduce debt.

## 🔌 7. API Overview
All API endpoints are versioned (`/api/v1`) and secured using JWT middleware:
- `/auth`: Registration, login, logout, and session validation.
- `/users`: Fetch user profiles and global balance summaries.
- `/groups`: CRUD operations for groups and member management.
- `/expenses`: Creating expenses and calculating splits transactionally.
- `/messages`: Fetching and soft-deleting chat history.
- `/settlements`: Recording payments and verifying against over-settlement.
- `/balances`: Dynamically aggregating debts from Expenses and Settlements.

## 🚀 8. Local Setup
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

## ⚙️ 9. Environment Variables
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

## 🌐 10. Deployment Steps
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

## 🤖 11. AI Collaboration Process
This project was built entirely using an advanced Agentic AI coding assistant (Google DeepMind's Antigravity). The development process adhered to strict planning workflows, continuous unit testing, and sequential execution. The AI acted as the lead engineer, while the user provided architectural direction, design inspiration, and PR approvals.

## 🔮 12. Future Improvements
- **Push Notifications**: Integrate web push notifications for new expenses and chat messages.
- **Activity Feed**: Add a global audit log showing recent group activities.
- **Multiple Currencies**: Support conversion and splitting across international currencies.
- **Receipt Parsing**: Utilize OCR to automatically itemize and split physical receipts.
