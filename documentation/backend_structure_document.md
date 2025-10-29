# Backend Structure Document

## Overview
This document outlines the backend architecture, hosting, and infrastructure for the `codeguide-supabase-transactions-api` project. It is written in everyday language so that anyone can understand how the backend is set up and how its pieces fit together.

## 1. Backend Architecture

### 1.1 Overall Design
- We use **Next.js 14 (App Router)** as our server framework. It handles API routes as special files under `app/api/`.
- Our code follows a **file-based routing pattern**: each folder or file under `app/api` becomes an endpoint.
- We separate concerns with a **middleware layer** (`middleware.ts`) that runs before any API route. This is where we check API keys and attach user info to requests.
- Business logic sits in a **utils** folder, so our route handlers stay clean and only coordinate input, output, and calls to utilities.

### 1.2 Scalability, Maintainability, Performance
- **Scalability:** Next.js on Vercel scales automatically with serverless functions. Supabase (PostgreSQL) scales vertically and horizontally on demand.
- **Maintainability:** Clear folder structure (`app/api`, `utils/supabase`, `supabase/migrations`) ensures new features are easy to slot in.
- **Performance:** We offload heavy work to the database via **RPC functions** (stored procedures) to keep transactions atomic and reduce round trips.

## 2. Database Management

### 2.1 Database Technologies
- We rely on **Supabase**, which uses **PostgreSQL** under the hood.
- It’s a **SQL database** with built-in support for:
  - Row Level Security (RLS)
  - Stored functions (RPC)
  - Migrations and version control

### 2.2 Data Handling Practices
- **Migrations:** All table definitions live in `supabase/migrations/` as SQL files. This keeps schema changes trackable.
- **Type Generation:** After each migration, we run `supabase gen types typescript` to update `types/database.types.ts`. This ensures our TypeScript code matches the database schema.
- **Separate Clients:** We use two Supabase clients:
  1. **Admin client** (with `service_role` key) for privileged operations.
  2. **Server client** (without service role) for standard queries and reads.

## 3. Database Schema

Below is our core schema in PostgreSQL format. It defines tables for users, API keys, balances, transactions, and mutations.

```sql
-- 1. Users
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. API Keys
CREATE TABLE api_keys (
  key text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Balances
CREATE TABLE balances (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(20, 2) NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. Transactions
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES users(id),
  recipient_id uuid NOT NULL REFERENCES users(id),
  amount numeric(20, 2) NOT NULL,
  status text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Mutations (Ledger Entries)
CREATE TABLE mutations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  type text NOT NULL CHECK(type IN ('debit','credit')),
  amount numeric(20, 2) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
```

## 4. API Design and Endpoints

### 4.1 API Style
- We follow a **RESTful** approach using Next.js route handlers.
- Every endpoint lives in `app/api/<name>/route.ts`.
- Input and output use JSON.

### 4.2 Key Endpoints
- **POST /api/balance**
  - Purpose: Retrieve the current balance for the authenticated user.
  - Input: none (API key in header).
  - Output: `{ balance: number }`

- **POST /api/pay**
  - Purpose: Send an amount from the sender to a recipient.
  - Input: `{ recipientId: string, amount: number }`
  - Output: `{ transactionId: string }` or error codes:
    - 401 Unauthorized (invalid API key)
    - 402 Payment Required (insufficient funds)
    - 404 Not Found (invalid recipient)

- **GET /api/trx**
  - Purpose: List past transactions for the user.
  - Input: query params for pagination (optional).
  - Output: `[{ id, senderId, recipientId, amount, status, createdAt }]`

- **GET /api/mut**
  - Purpose: List ledger entries (mutations) for the user.
  - Input: query params for pagination (optional).
  - Output: `[{ id, transactionId, type, amount, createdAt }]`

### 4.3 Middleware Work
- **middleware.ts** intercepts all `/api/*` requests.
- It reads the `x-api-key` header and looks it up in `api_keys` table using the Admin client.
- On success, it appends `userId` to the request context. On failure, returns 401.

## 5. Hosting Solutions

- **Frontend & API:** Hosted on **Vercel** using serverless functions.
- **Database:** Hosted by **Supabase** (fully managed PostgreSQL).

Benefits:
- **High Availability:** Vercel and Supabase offer SLA-backed uptime.
- **Scalability:** Serverless functions scale automatically under load.
- **Cost-Effective:** Pay-as-you-go pricing aligns with usage.

## 6. Infrastructure Components

- **Load Balancer:** Managed by Vercel, distributing incoming API calls across serverless instances.
- **CDN:** Vercel’s global edge network caches static assets and routes API traffic to nearest region.
- **Caching:** We rely on:
  - HTTP caching headers on read endpoints.
  - Client-side caching (optional) via React Query/TanStack Query if a UI is used.

## 7. Security Measures

- **API Key Authentication:** Custom middleware validates each request’s `x-api-key`.
- **HTTPS Everywhere:** Vercel and Supabase enforce TLS for all inbound/outbound traffic.
- **Database RLS:** Row Level Security in Supabase ensures only authorized queries succeed (supplemented by service role bypass on server).
- **Least Privilege:** Admin client (service role key) is only used in server code, never sent to the browser.
- **Data Encryption:** Supabase encrypts data at rest and in transit.
- **Input Validation:** We use Zod (or built-in checks) in route handlers to guard against bad data.

## 8. Monitoring and Maintenance

- **Logging:** Structured logs via **Pino** (or similar) in serverless functions. Logs pushed to Vercel’s logging dashboard.
- **Error Tracking:** Integrate **Sentry** or Vercel’s built-in error monitoring for uncaught exceptions.
- **Health Metrics:** Rely on Supabase Studio for database metrics (CPU, connections, slow queries) and Vercel’s analytics for function metrics (cold starts, error rates).
- **Backups & Migrations:** Supabase handles nightly backups. We apply schema changes via tracked SQL migrations.

## 9. Conclusion and Overall Backend Summary

This backend is built on modern, scalable technologies:
- **Next.js 14** for API routes and serverless functions
- **Supabase (PostgreSQL)** for data storage, security, and migrations
- **Vercel** for hosting with global edge and auto-scaling

Key strengths:
- **Atomic transactions** via RPCs prevent inconsistent balances.
- **Clear separation** of concerns with middleware, route handlers, and utilities.
- **Type safety** from database to API with automated type generation.
- **Robust security** using API keys, RLS, and encrypted channels.

With this setup, the project can reliably handle user authentication, balance queries, payments, and ledger tracking in a maintainable, scalable, and secure manner.