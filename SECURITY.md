# Security — AI Recruitment Platform

This document summarises the security hardening implemented in **Phase 8**.

---

## 1. Transport & Headers

| Control        | Detail                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Helmet**     | All default headers enabled. CSP is relaxed (`contentSecurityPolicy: false`) in development to allow Vite HMR / inline scripts. Enabled in production. |
| **CORS**       | Origin allow-list via `CORS_ORIGIN` env var (comma-separated). Credentials enabled.                                                                    |
| **Body limit** | `express.json({ limit: "1mb" })` to prevent large-payload DoS.                                                                                         |

## 2. Rate Limiting

Three tiers powered by `express-rate-limit`:

| Tier                | Window | Max | Applied to                                                                        |
| ------------------- | ------ | --- | --------------------------------------------------------------------------------- |
| **Auth limiter**    | 15 min | 20  | `/api/auth/register`, `/api/auth/login`                                           |
| **Write limiter**   | 15 min | 60  | POST/PATCH mutation routes (job create, apply, resume upload, interviews, offers) |
| **General limiter** | 15 min | 200 | All routes (fallback)                                                             |

## 3. Input Validation

- **Zod body validation** — every mutation route validates `req.body` with a strict Zod schema (`validate()` middleware).
- **Zod query validation** — list endpoints validate query-string params via `validateQuery()`.
- **Zod param validation** — every route with `:id`, `:jobId`, `:applicationId`, or `:offerId` params validates them as 24-character hex ObjectIds via `validateParams()`.

## 4. NoSQL Injection Protection

Custom `mongoSanitize` middleware strips any object keys starting with `$` or containing `.` from `req.body`, `req.query`, and `req.params` recursively. This prevents operators like `{ "$gt": "" }` from reaching Mongoose.

## 5. Authentication & Authorisation

| Layer          | Middleware                                                                         | Notes                                                          |
| -------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Auth**       | `requireAuth`                                                                      | Verifies JWT access token in `Authorization: Bearer` header.   |
| **Role check** | `requireAdmin`, `requireCandidate`, `requireRecruiterWithCompany`                  | Enforces role-based access.                                    |
| **Ownership**  | `requireJobOwnerCompany`, `recruiterCanAccessJob`, `recruiterCanAccessApplication` | Ensures recruiter belongs to the same company as the resource. |

Admin can access all resources. Recruiters can only access their company's data. Candidates can only access their own applications.

## 6. Error Handling

- **Production mode** (`NODE_ENV=production`): API returns only `{ error: { code, message } }`.  
  Stack traces, internal messages, and Mongoose/Zod details are suppressed.
- **Development mode**: Adds a `debug` field with the raw error message for convenience.
- The `errorHandler` middleware logs all 5xx errors via pino logger.

## 7. Audit Logging

All security-relevant mutations are recorded in the `AuditLog` MongoDB collection:

| Action                    | Trigger                                                |
| ------------------------- | ------------------------------------------------------ |
| `admin.updateUser`        | Admin updates a user's role or status                  |
| `job.create`              | Recruiter creates a job posting                        |
| `job.update`              | Recruiter updates a job                                |
| `job.delete`              | Recruiter deletes a job                                |
| `application.stageChange` | Recruiter moves an application to a new stage          |
| `interview.create`        | Recruiter creates an interview                         |
| `offer.create`            | Recruiter creates an offer                             |
| `offer.statusChange`      | Offer status changes (sent, draft, accepted, declined) |

Each log entry stores: `actorUserId`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`.

Audit writes are fire-and-forget — failures are logged but never propagate errors to the request.

## 8. CI Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push / PR to `main`:

1. **Client lint** — `npm run lint` in `client/`
2. **Server type check** — `npx tsc --noEmit` in `server/`
3. **Server tests** — `npm test` with a MongoDB 7 service container

## 9. Environment Variables

| Variable             | Required | Default       | Purpose                         |
| -------------------- | -------- | ------------- | ------------------------------- |
| `JWT_SECRET`         | Yes      | —             | Signs access tokens             |
| `JWT_REFRESH_SECRET` | Yes      | —             | Signs refresh tokens            |
| `MONGODB_URI`        | Yes      | —             | MongoDB connection string       |
| `CORS_ORIGIN`        | No       | `*` (dev)     | Comma-separated allowed origins |
| `NODE_ENV`           | No       | `development` | Controls error verbosity, CSP   |
| `PORT`               | No       | `4000`        | Server listen port              |
