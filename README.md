## C2C Camera Platform

[![Tech Stack](https://img.shields.io/badge/Stack-NestJS_%2B_Next.js-5A2475?style=for-the-badge&logo=nestjs&logoColor=white)](https://)
[![Database](https://img.shields.io/badge/PostgreSQL-DB-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://)
[![Language](https://img.shields.io/badge/TypeScript-Primary-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://)

Modern C2C (consumer‑to‑consumer) camera marketplace built with **NestJS** (backend) and **Next.js App Router** (frontend).  
It supports user accounts, product listings, chat between buyers and sellers, wallet top‑ups, orders/payments, notifications, and an **admin dashboard** for moderation and platform fee management.

---

## 1. Project Structure 🗂️

```text
F:\my_web
├─ backend/        # NestJS API (PostgreSQL, TypeORM, JWT auth, chat, wallet, admin)
├─ frontend/       # Next.js 16 (App Router) SPA for users & admin
├─ _legacy/        # Legacy React/Next code (not used in new stack)
├─ docker-compose.yml (optional, if present) # Postgres container
├─ package.json    # Root scripts to run backend + frontend together
└─ README.md       # This file
```

---

## 2. Tech Stack ⚙️

- **Frontend**
  - Next.js 16 (App Router), React 19
  - Tailwind CSS v4
  - Axios, `socket.io-client`, `lucide-react` icons
- **Backend**
  - NestJS 11
  - TypeORM + PostgreSQL
  - JWT authentication (access/refresh)
  - WebSockets (`@nestjs/websockets`, Socket.IO) for chat
  - Throttler, notifications, wallet, orders, admin moderation

---

## 3. Features Overview ✨

- **Marketplace**
  - Create / edit / delete camera product listings
  - Categories, conditions, images, location, views, rating, promotions
  - Product status workflow: `draft → pending_approval → approved / rejected / suspended / sold`

- **User & Auth**
  - Email‑based accounts
  - Role‑based access: `user`, `admin`
  - JWT access tokens and refresh handling on the backend

- **Chat**
  - Real‑time chat rooms between buyer and seller per product
  - Unread count badge in header
  - “Products contacted” metric in admin stats

- **Wallet & Payments**
  - User wallet balance
  - Top‑up via VNPay (`/wallet/topup`)
  - Orders, order items, transactions & payment entities

- **Admin Dashboard**
  - Statistics:
    - Total products, total users
    - Products on sale
    - Products that have been **contacted** (have at least one chat room)
    - Pending approval count
    - Total chat rooms
  - Moderation queue:
    - Filter by `pending_approval`, `approved`, `rejected`
    - Approve / reject listings with reasons
  - **Per‑product custom fee**:
    - For each pending product, admin can set a custom platform fee (e.g. product price: 10,000; fee: 2,000; seller receives: 8,000).
    - Fee is stored per product (`adminFee`) instead of using a global fixed fee.

---

## 4. Getting Started (Development) 🚀

### 4.1. Prerequisites

- **Node.js** ≥ 18.x (LTS recommended)
- **npm** (bundled with Node)
- **PostgreSQL** (local install or Docker)

### 4.2. Install dependencies

From project root:

```bash
cd F:\my_web
npm install           # installs root deps (concurrently, pg)
cd backend && npm install
cd ../frontend && npm install
```

### 4.3. Configure environment variables (backend)

Create/update `backend/.env`:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5440        # or your actual Postgres port (e.g. 5432)
DATABASE_USER=postgres
DATABASE_PASSWORD=12343
DATABASE_NAME=camera_web

# Server Configuration
PORT=3002

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d
```

Make sure the database exists:

```bash
# psql or your GUI client
CREATE DATABASE camera_web;
```

If you use Docker and have `docker-compose.yml`, you can start Postgres:

```bash
npm run docker:up
```

### 4.4. Running the app

#### Option A – Run both backend & frontend together

From project root:

```bash
cd F:\my_web
npm run dev
```

This uses `concurrently` to run:

- `backend`: NestJS dev server (default on port `3002`)
- `frontend`: Next.js dev server (default on port `3000`)

#### Option B – Run separately

```bash
cd F:\my_web\backend
npm run start:dev   # NestJS API

cd F:\my_web\frontend
npm run dev         # Next.js frontend
```

Open the browser at:

- Frontend: `http://localhost:3000`
- Backend:  `http://localhost:3002` (API)

---

## 5. Frontend: Key Flows 💻

- **Auth Context**
  - `AuthContext` stores the current user (including `role`, `walletBalance`).
  - Header (`AppHeader`) shows:
    - Login/Register buttons when logged out
    - “Đăng” (create listing), messages, notifications, user menu when logged in
    - **Admin Dashboard button** in header when `user.role === 'admin'`.

- **Admin Dashboard UI (`/admin`)**
  - Protected route: only visible and accessible if `user.role === 'admin'`.
  - Sections:
    - Summary cards (total products/users, on sale, contacted, pending, total chat rooms).
    - Moderation table with filters and actions.
  - Per‑product fee:
    - Each row in “Chờ duyệt” shows:
      - Price
      - Existing platform fee (`adminFee`) if any
      - Input field for custom fee
      - Live “Thu về” (net amount to seller = price − fee)
    - Clicking “Duyệt” sends `adminFee` to backend.

---

## 6. Backend: Key Modules 🧩

- `AuthModule`
  - JWT strategy, guards, roles decorator (`UserRole.ADMIN`, etc.).
- `ProductsModule`
  - Product entity: price, condition, status, seller, category, images, views, promotions, etc.
  - `adminFee` column for per‑product platform fee.
- `ChatModule`
  - `ChatRoom` and `ChatMessage` entities
  - REST + WebSocket APIs for real‑time messaging
  - Unread count query.
- `OrdersModule`, `WalletModule`
  - Orders, order items, payments, transactions
  - Wallet top‑up and balance tracking.
- `AdminModule`
  - `AdminService.getDashboardStats()` – summary metrics.
  - `AdminService.getContactedProducts()` – list of products that have chat rooms.
  - `AdminService.approveProduct(id, adminUserId, adminFee?)` – approve listing and optionally persist `adminFee`.
  - `AdminService.rejectProduct()` – reject listing with required reason.

---

## 7. Scripts Reference 📜

From **root `package.json`**:

```json
{
  "scripts": {
    "start": "node start.js",
    "dev": "concurrently \"cd backend && npm run start:dev\" \"cd frontend && npm run dev\"",
    "setup": "cd backend && node setup-database.js",
    "health": "node check-health.js",
    "docker:up": "docker-compose up -d postgres",
    "docker:down": "docker-compose down",
    "docker:logs": "docker logs camera_store_db",
    "backend": "cd backend && npm run start:dev",
    "frontend": "cd frontend && npm run dev"
  }
}
```

Useful commands:

- `npm run dev` – start full stack in dev mode.
- `npm run backend` – backend dev only.
- `npm run frontend` – frontend dev only.
- `npm run docker:up` / `docker:down` – start/stop Postgres (if Docker is used).

Backend (`backend/package.json`) also provides:

- `npm run build` – compile NestJS.
- `npm run lint` – run ESLint.
- `npm test` / `npm run test:*` – run Jest test suite.

---

## 8. Production Notes 🏭

- Set `NODE_ENV=production` in the backend environment.
  - TypeORM `synchronize` is automatically disabled in production (to protect schema).
- Use strong secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- Use a managed PostgreSQL instance or secure Docker setup.
- Build and serve frontend with `npm run build && npm start` inside `frontend`.
- Consider reverse proxy (Nginx/Caddy) in front of frontend + backend.

---

## 9. Contributing / Branching 🌱

- Preferred Git flow:
  - Create feature branches: `feat/...`, `fix/...`, `chore/...`
  - Example: `feat/admin/manage/dashboard`
- Before opening a PR:
  - Run backend tests: `cd backend && npm test`
  - Lint and build frontend: `cd frontend && npm run lint && npm run build`

---

## 10. Contact & Support 🤝

For questions about this codebase, architecture decisions, or extending the platform (e.g. additional payment gateways, analytics, more admin tools), add notes to this README or open an issue in your Git repository for future collaborators. 

This document is designed to be a **single point of truth** for onboarding new developers quickly and professionally.

