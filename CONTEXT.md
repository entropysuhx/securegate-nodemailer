# SecureGate — Build Context & Architecture Reference

> This file documents the implementation plan, phase-by-phase progression

---

## Part 1 — Implementation Plan (Phase by Phase)

SecureGate was built in 6 deliberate phases. Each phase had to be fully
working before the next one started. This was not arbitrary — it was
the only way to build something stable.

### Phase 1 — Scaffold & Database Schema
**Goal:** Get a working Next.js project connected to a real database before writing a single feature.

What was built:
- Next.js 14 with App Router and TypeScript
- Prisma initialised and connected to Supabase PostgreSQL
- Three database models defined: `User`, `VerificationToken`, `PasswordResetToken`
- Prisma client singleton created at `src/lib/prisma.ts`
- `.env.local` configured with all required environment variable keys
- Initial commit pushed to GitHub

Why this had to come first:
Every feature in SecureGate depends on the database. Without a working
schema and DB connection, none of Phase 2 through 6 can be built or tested.
This phase produced nothing visible to a user — and that was intentional.

---

### Phase 2 — Authentication Core
**Goal:** Sign up, login, and session management working end-to-end.

What was built:
- NextAuth configured with the Credentials provider
- `authorize()` function: queries user by email, compares bcrypt hash
- Sign up API route: Zod validation, bcrypt hashing with 12 salt rounds, user creation
- Protected `/dashboard` route via NextAuth middleware
- `/signup` page with password strength indicator and show/hide toggle
- `/login` page with mapped error messages (no raw NextAuth error codes)
- JWT session strategy chosen for stateless, fast session reads

Why Phase 1 had to be complete first:
The `authorize()` function queries the `User` table. Without Prisma and the
schema from Phase 1, this function cannot run.

---

### Phase 3 — Email Verification Flow
**Goal:** Users prove they own their email before accessing the dashboard.

What was built:
- Token generation using `crypto.randomBytes(32).toString('hex')`
- `VerificationToken` saved to DB with 15-minute expiry on signup
- Resend integration: verification email sent with token URL
- `/api/verify-email` route: validates token, checks expiry, marks `emailVerified`
- Result pages: `/verify-email/success`, `/verify-email/expired`, `/verify-email/invalid`
- Resend verification endpoint for expired tokens
- Login now fully unlocked only after email is verified

Why Phase 2 had to be complete first:
Email verification only makes sense once signup creates a user. The verification
flow updates a `User` row — that row is created in Phase 2.

---

### Phase 4 — Forgot Password Flow
**Goal:** Users who forgot their password can securely reset it via email.

What was built:
- `/forgot-password` page and API route
- `PasswordResetToken` saved with 1-hour expiry
- Password reset email sent via Resend
- `/reset-password/[token]` page: validates token, accepts new password
- New password hashed with bcrypt before saving, used token deleted
- Forgot password always returns success — never confirms if email exists

Why Phase 3 had to be complete first:
The reset flow reuses the same email utility (`src/lib/email.ts`) and token
pattern (`src/lib/tokens.ts`) built in Phase 3. Building Phase 4 before
Phase 3 would mean building the email infrastructure twice.

---

### Phase 5 — Rate Limiting & Security Hardening
**Goal:** Protect endpoints from brute force attacks and lock down the app.

What was built:
- Upstash Redis connected for distributed rate limiting
- Rate limiter on login: 5 attempts per IP per 10 minutes
- Rate limiter on forgot-password: 3 attempts per IP per 10 minutes
- Rate limiter on signup: 3 attempts per IP per 10 minutes
- HTTP security headers added in `next.config.js`:
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-XSS-Protection: 1; mode=block`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- All API routes wrapped in try/catch — no stack traces exposed to client
- All error messages audited to avoid leaking email existence

Why Phase 4 had to be complete first:
Rate limiting protects the endpoints that were built in Phases 2, 3, and 4.
You cannot harden what does not yet exist. Adding rate limiting in Phase 2
would have been premature — the full attack surface was not yet known.

---

### Phase 6 — UI Polish & Deployment
**Goal:** Ship a clean, usable, production-ready app to Vercel.

What was built:
- Consistent dark theme across all auth pages
- Loading states on every form submit button
- Real inline validation error messages (no generic "something went wrong")
- Password strength indicator with live requirement checklist
- Show/hide password toggle on all password fields
- Generate password button with clipboard copy
- Delete account with confirmation modal in dashboard
- Deployed to Vercel with all environment variables set in dashboard
- `.env.local` confirmed absent from GitHub repo

Why Phase 5 had to be complete first:
Deploying before security hardening would mean shipping an insecure app.
The UI polish only makes sense once the underlying system is trustworthy.

---

## Part 2 — What Would Have Happened Without Phases (Gall's Law)

Gall's Law states: a complex system that works evolved from a simple system
that worked. A complex system built from scratch never works.

If all six phases had been attempted at the same time, here is what would
have broken:

**1. No stable foundation to test against.**
In Phase 2, we confirmed passwords were being hashed correctly by checking
Supabase directly. If Phase 3 email sending was already in the code at that
point, a bug in the email configuration could have masked a bug in the hashing
logic. Bugs would have compounded.

**2. Circular dependencies.**
Phase 3 reuses `src/lib/email.ts` for Phase 4. Building both at the same time
means designing a shared utility before knowing exactly what both consumers
need. The result would have been either duplication or a poorly designed
abstraction built too early.

**3. Undebuggable error surfaces.**
If all six phases were written at once, a login failure could have been caused
by any of: wrong password, unverified email, expired token, rate limit hit,
missing environment variable, or a Prisma connection error. With phases,
each new failure mode was introduced one at a time, making diagnosis straightforward.

**4. Deployment before security.**
A natural risk of building everything at once is shipping before rate limiting
and security headers are in place. The phased approach forced security hardening
(Phase 5) to happen before deployment (Phase 6).

---

## Part 3 — Folder Structure & Why It Is Organised This Way

```
d:\SecureGate\securegate
├── prisma/                         # Database layer
│   └── schema.prisma               # Single source of truth for all DB models
│
└── src/
    ├── app/                        # Route & Page layer (organised by user flow)
    │   │
    │   ├── (auth)/                 # Authentication flow — route group (no URL segment)
    │   │   ├── login/              # /login
    │   │   ├── signup/             # /signup
    │   │   ├── forgot-password/    # /forgot-password
    │   │   └── reset-password/     # /reset-password/[token]
    │   │
    │   ├── api/                    # Backend API endpoints
    │   │   └── auth/
    │   │       ├── [...nextauth]/  # NextAuth handler (login, session, signout)
    │   │       ├── signup/         # POST: create user + send verification email
    │   │       ├── forgot-password/# POST: generate + send reset token
    │   │       ├── reset-password/ # POST: validate token + update password
    │   │       ├── resend-verification/ # POST: resend email verification
    │   │       └── delete-account/ # DELETE: remove user from database
    │   │
    │   ├── verify-email/           # Email verification result pages
    │   │   ├── success/            # /verify-email/success
    │   │   ├── expired/            # /verify-email/expired
    │   │   └── invalid/            # /verify-email/invalid
    │   │
    │   └── dashboard/              # Post-auth user experience
    │       └── page.tsx            # Protected — redirects to /login if no session
    │
    ├── lib/                        # Core utilities & shared logic
    │   ├── prisma.ts               # Prisma client singleton
    │   ├── auth.ts                 # NextAuth authOptions (shared across app)
    │   ├── email.ts                # Resend email functions
    │   ├── tokens.ts               # Secure token generation
    │   ├── ratelimit.ts            # Upstash Redis rate limiters
    │   └── validations/
    │       └── auth.ts             # Zod schemas for all auth inputs
    │
    └── middleware.ts               # Gatekeeper — runs before every request
                                    # Protects /dashboard, enforces session check
```

### Why the folders are shaped this way

**`(auth)/` route group:**
Parentheses in Next.js App Router create a route group — the folder name
does not appear in the URL. All authentication pages share a layout
(centered card, dark background, SecureGate wordmark) without affecting
the URL structure. Grouping them also makes it immediately obvious to any
reader that these pages belong to the same user flow.

**`api/auth/` structure:**
All authentication-related API routes live under one namespace. This mirrors
the mental model of the feature: everything under `auth` is about identity.
When debugging a login issue, a developer knows exactly where to look.

**`lib/` as the utility layer:**
`lib/` contains no routes and no UI — only logic that is shared across
multiple routes. `prisma.ts` is imported by every API route. `auth.ts` is
imported by the dashboard and the NextAuth handler. `email.ts` is imported
by signup, forgot-password, and resend-verification. Keeping these in `lib/`
prevents duplication and makes each utility independently testable.

**`middleware.ts` at the root of `src/`:**
Next.js requires middleware at a specific location to intercept requests
before they reach any route handler or page. It runs on the edge — before
the database, before the session, before any component renders. This is
the first and most important security checkpoint in the entire app.

---

## Part 4 — Key Engineering Decisions & Their Reasons

| Decision | Why |
|---|---|
| JWT session strategy (not database sessions) | No extra DB read on every request. Stateless and fast. Acceptable for this scope. |
| bcrypt with 12 salt rounds | OWASP recommendation. Slow enough to resist brute force, fast enough for normal use. |
| Token expiry: 15 min (verification), 1 hour (reset) | Verification is a one-time action, short window is fine. Reset needs more time as user may need to check email on another device. |
| Always return success on forgot-password | Prevents email enumeration. An attacker cannot use the response to build a list of valid accounts. |
| Upstash Redis for rate limiting | Works on Vercel's serverless/edge runtime. In-memory rate limiting does not persist across serverless function instances. |
| Prisma over Supabase JS client | Full TypeScript type safety, schema-as-code, works with any PostgreSQL host. Not tied to Supabase-specific APIs. |
| `directUrl` in Prisma schema | Supabase uses PgBouncer connection pooling on port 6543. Migrations require a direct connection on port 5432. Both URLs are needed. |

---