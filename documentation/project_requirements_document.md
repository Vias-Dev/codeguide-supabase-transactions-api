# Project Requirements Document (PRD)

## 1. Project Overview

This project, **codeguide-supabase-transactions-api**, is a lightweight, API-first transactional system built on modern web technologies. It provides a secure, atomic ledger system with four core RESTful endpoints—`balance`, `pay`, `trx`, and `mut`—for querying balances, making transfers, and retrieving transaction history. By leveraging Supabase (PostgreSQL) for data storage and Next.js App Router for API routes, it ensures type safety, performance, and a consistent developer experience.

The system is being built to serve SaaS and subscription-based businesses that need a reliable in-house transaction engine without relying on third-party payment processors like Stripe. Key objectives include: 1) enforcing API key–based authentication so only authorized clients can interact with the endpoints, 2) guaranteeing transactional integrity via Supabase RPC (remote procedure calls) to avoid partial updates, and 3) providing clear, JSON-based responses with appropriate HTTP status codes. Success is measured by delivering a fully functional v1 with stable core APIs, thorough test coverage, and sub-200ms average response times under normal load.

---

## 2. In-Scope vs. Out-of-Scope

**In-Scope (v1):**
- Design and implement a root `middleware.ts` in Next.js App Router that:  - Reads and validates `x-api-key` headers against an `api_keys` table.  - Rejects unauthorized requests with 401 errors.  - Attaches `user_id` to the request context on success.
- Create database schema migrations for these tables:  - `users`  - `api_keys`  - `balances`  - `transactions`  - `mutations`
- Build four REST endpoints under `app/api/`:  - `GET /api/balance` returns the current user’s balance.  - `POST /api/pay` transfers funds: validates inputs, calls Supabase RPC to adjust balances and record entries.  - `GET /api/trx` lists transaction records.  - `GET /api/mut` lists mutation records (debit/credit entries).
- Implement Supabase RPC functions (PL/pgSQL) for atomic debit/credit operations.
- Write unit and integration tests using Vitest or Jest to cover middleware, route handlers, and RPC logic.
- Add structured logging (e.g., with Pino) for request tracing, success/failure events, and errors.

**Out-of-Scope (v1):**
- User-facing UI or admin dashboards.
- Payment gateway integrations (Stripe, PayPal).
- Advanced analytics or reporting features.
- Multi-currency or foreign exchange support.
- Webhook endpoints for external event handling.
- Role-based access control beyond API key validation.

---

## 3. User Flow

A developer or external service begins by registering a user account in the system (outside the scope of v1) and receives a unique `x-api-key`. When they want to check a balance, they issue a `GET /api/balance` request with the `x-api-key` header. The Next.js middleware intercepts the request, looks up the key in `api_keys`, rejects invalid keys with a 401 error, or attaches the associated `user_id` for valid ones. The route handler then queries the `balances` table via a Supabase service_role client and returns the current balance as JSON.

To perform a payment, the client sends a `POST /api/pay` request with `x-api-key` plus a JSON body `{ recipientId, amount }`. The same middleware authenticates the user, then the handler validates the payload (`amount > 0`, `recipientId` exists). It calls a Supabase RPC function to debit the sender’s balance, credit the recipient’s balance, and insert entries into `transactions` and `mutations` tables in a single database transaction. On success, it returns `{ transactionId }`; on failure (insufficient funds, missing recipient), it returns an appropriate error code (402 or 404) and message.

---

## 4. Core Features

- **API Key Authentication**: Middleware to read `x-api-key`, validate against `api_keys`, attach `user_id` or return 401.
- **Balance Endpoint**: `GET /api/balance` retrieves the authenticated user’s balance.
- **Pay Endpoint**: `POST /api/pay` with `{ recipientId, amount }` that invokes an atomic Supabase RPC to adjust balances and record logs.
- **Transactions Endpoint**: `GET /api/trx` lists high-level transactions (sender, recipient, amount, timestamp).
- **Mutations Endpoint**: `GET /api/mut` lists low-level mutation entries (debit/credit records).
- **Database Schema & Migrations**: Versioned SQL migrations for all necessary tables and indexes.
- **Supabase RPC Functions**: PL/pgSQL functions to ensure atomicity and prevent race conditions.
- **Structured Logging**: Record all requests, outcomes, and errors with a consistent JSON format.
- **Testing Suite**: Unit tests for middleware and utilities; integration tests hitting API routes and verifying database state.

---

## 5. Tech Stack & Tools

- **Frontend/Server Framework**: Next.js 14 (App Router) with TypeScript.
- **Database**: Supabase (PostgreSQL) using service_role key for trusted operations.
- **ORM/Client**: @supabase/supabase-js with separate admin and server clients.
- **RPC/Stored Procedures**: PL/pgSQL functions defined in Supabase migrations.
- **Validation**: Zod for request payload schema validation.
- **Testing**: Vitest or Jest for unit and integration tests.
- **Logging**: Pino for structured, JSON-based logs.
- **Environment**: Vercel or similar for deployment; environment variables for Supabase URL and service_role key.

---

## 6. Non-Functional Requirements

- **Performance**: Average API response time ≤ 200ms under normal load (no more than 100 concurrent requests).
- **Reliability & Atomicity**: All money transfers must be atomic; no partial updates under any failure scenario.
- **Security**:  - Enforce HTTPS only.  - Validate and sanitize all inputs.  - Use Supabase Row Level Security and service_role key only in server context.  - Store secrets in secure environment variables.
- **Scalability**: Support horizontal scaling—stateless Next.js functions and centralized database.
- **Usability**: Consistent JSON response structure; clear error codes and messages.
- **Testing & Quality**: ≥ 80% code coverage; no critical lint errors.

---

## 7. Constraints & Assumptions

- Supabase service_role key is available and securely stored in environment variables.
- RPC functions in the database must be created before calling `POST /api/pay`.
- The Next.js App Router is the mechanism for API routes (not the Pages Router).
- Requests originate from trusted networks; DDoS mitigation and rate limiting are expected but not in v1.
- The system assumes single-currency (e.g., USD) for all balances.

---

## 8. Known Issues & Potential Pitfalls

- **API Key Exposure**: Clients must secure their keys. Consider rate limiting or key rotation as future enhancements.
- **Concurrent Transactions**: Without proper RPC locking, simultaneous `pay` calls may cause race conditions—using PL/pgSQL transactions mitigates this.
- **Error Granularity**: Ensure RPC errors (like insufficient funds) map to correct HTTP status codes (402, 404) in route handlers.
- **Database Migration Drift**: Keep migrations versioned and in sync with generated TypeScript types to avoid schema mismatches.
- **Testing Complexity**: Integration tests must reset database state between runs; use a test database or schemas to isolate tests.


---

This PRD outlines a clear, unambiguous blueprint for an AI or developer to implement the **codeguide-supabase-transactions-api** from database schema through API routes, authentication, and testing. It leaves no room for guesswork and sets firm guidelines for non-functional requirements and potential risks.