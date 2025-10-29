# Security Guidelines for codeguide-supabase-transactions-api

This document provides comprehensive security best practices and recommendations tailored to the `codeguide-supabase-transactions-api` starter template. Follow these guidelines to ensure a secure, resilient, and maintainable transactional API system.

## 1. Security by Design

- Embed security considerations at every phase: design, implementation, testing, and deployment.  
- Define clear threat models for API key misuse, transaction tampering, and data leakage.  
- Use the principle of **least privilege** for both application code and database roles.  

## 2. Authentication & Access Control

### 2.1 API Key Authentication

- Implement a **root `middleware.ts`** in `app/middleware.ts` that intercepts all `/api/*` requests.  
- Extract and validate the `x-api-key` header against the `api_keys` table using the privileged Supabase client (`utils/supabase/admin.ts`).  
- On success, attach `user_id` to the request context; on failure, return HTTP 401 Unauthorized with a generic error message.  

### 2.2 Role-Based Access Control (RBAC)

- Define database roles and grant each only the minimum permissions required.  
- Use Supabase Row Level Security (RLS) for end-user queries; bypass RLS only in server-side RPC functions via the service role key.  

### 2.3 Session & Token Security

- If you expand to JWT authentication for UI or external clients, ensure proper algorithm selection (e.g., HS256 or RS256) and validate `exp`, `iss`, and `aud` claims.  
- Securely rotate and revoke API keys; store their hashes rather than plaintext keys.  

## 3. Input Validation & Output Encoding

- Always perform **server-side validation** in your route handlers using a schema validation library (e.g., Zod).  
- Enforce strict type checks on all request bodies:  
  - `recipientId`: valid UUID or integer.  
  - `amount`: positive number greater than zero.  
- Reject unexpected properties or overly large payloads.  
- Sanitize any string inputs to prevent injection into logs or emails.  

## 4. API & Service Security

### 4.1 Enforce HTTPS and CORS

- Require TLS 1.2+ for all clients—disable plain HTTP in production.  
- Configure CORS in `next.config.js` or via a proxy, allowing only trusted origins.  

### 4.2 Rate Limiting & Throttling

- Implement rate limiting at the edge (e.g., Vercel Edge Functions, nginx) or within middleware.  
- Throttle repeated attempts to call `/api/pay` or `/api/trx` from the same API key to mitigate brute-force attacks.  

### 4.3 HTTP Methods & Status Codes

- Use appropriate HTTP verbs:  
  - `GET /api/balance` for retrieving balances.  
  - `POST /api/pay` for creating new transactions.  
- Return clear status codes:  
  - 200 OK on success.  
  - 400 Bad Request for schema violations.  
  - 401 Unauthorized for invalid API keys.  
  - 402 Payment Required for insufficient funds.  
  - 404 Not Found for missing recipient.  

## 5. Atomic Transaction Processing

- Encapsulate the debit/credit logic in a **Supabase RPC (PostgreSQL Stored Function)**.  
- Ensure the RPC function:  
  - Validates sender balance.  
  - Updates `balances` table (debit and credit).  
  - Inserts records into `transactions` and `mutations` tables.  
  - Executes atomically: either all steps commit or none do.  

## 6. Data Protection & Privacy

- Encrypt sensitive data at rest and in transit.  
- Never log full API keys or PII.  
- Mask or truncate user identifiers in logs.  
- Store configuration (Supabase URL, service role key) in environment variables or a secrets manager—never in source control.  

## 7. Error Handling & Logging

- Use structured logging (e.g., Pino) for all API routes.  
- Log:  
  - Incoming request metadata (method, path, user_id).  
  - Validation failures and error stack traces (avoid revealing sensitive data).  
  - Transaction attempts, successes, and failures, including reasons (e.g., "insufficient funds").  
- Return generic error messages to clients; avoid exposing internal details.  

## 8. Web Application Security Hygiene

- If adding a frontend or dashboard later:  
  - Apply Content Security Policy (CSP), `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy`.  
  - Secure cookies with `HttpOnly`, `Secure`, `SameSite` attributes.  
  - Protect state-changing endpoints with CSRF tokens.  

## 9. Infrastructure & Configuration Management

- Harden the hosting environment:  
  - Disable unnecessary services and ports.  
  - Enforce least-privilege IAM roles.  
- Disable debug endpoints and stack traces in production.  
- Regularly apply OS, framework, and dependency updates.  

## 10. Dependency Management

- Use lockfiles (`package-lock.json`) to ensure deterministic builds.  
- Scan for vulnerabilities with a Software Composition Analysis (SCA) tool.  
- Keep core libraries (Next.js, Supabase client, Zod) up to date.  
- Limit third-party dependencies to only those necessary.  

## 11. Testing & Continuous Integration

- Write **unit tests** for utility functions (e.g., input validators).  
- Implement **integration tests** for API endpoints using a test Supabase instance:  
  - Simulate valid/invalid API keys.  
  - Test atomic transaction behavior under concurrent loads.  
- Automate security checks and linting (ESLint, Prettier) in CI pipelines.  

---

By following these security guidelines, you will build a robust, maintainable, and secure transactional API system on top of the `codeguide-supabase-transactions-api` template. Ensure continuous review and improvement as new threats and best practices emerge.