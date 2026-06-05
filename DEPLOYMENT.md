# Deployment Guide — Al Khidmah Community Centre

## Prerequisites

- Node.js 20+
- PostgreSQL (Neon recommended)
- Hosting with Next.js support (Vercel, Railway, etc.)

## 1. Environment variables

Copy `.env.example` to your host and set all values. Required:

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Neon **pooler** host (`-pooler` in hostname), `?sslmode=require&pgbouncer=true` |
| `DIRECT_URL` | Optional. Neon **direct** host override for migrations; auto-derived from `DATABASE_URL` if omitted |
| `JWT_SECRET` | Min 32 random characters |
| `SETTINGS_ENCRYPTION_KEY` | Min 32 random characters |
| `NEXT_PUBLIC_SITE_URL` | Production URL, e.g. `https://alkhidmah.ie` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Initial super-admin (seed only) |
| SMTP vars | Or configure later in Super Admin → Email |

Optional: Stripe / PayPal keys (can be set in Super Admin → Payment).

Local fix for Neon URLs:

```bash
npm run db:fix-pooler
```

## 2. Database setup

On first deploy (or empty database):

```bash
npm run db:push
npm run db:seed
```

Upgrading an old database that used the legacy `Role` enum:

```bash
npm run db:migrate-rbac
npm run db:seed
```

## 3. Build verification

```bash
npm install
npm run build
```

Stop any running `npm run dev` before `prisma generate` on Windows (avoids file lock errors).

## 4. Deploy (Vercel example)

1. Connect the Git repository.
2. Set all environment variables in the Vercel project settings.
3. Build command: `npm run build`
4. Install command: `npm install`
5. After first deploy, run `prisma db push` and `db:seed` against production (Vercel CLI, Neon SQL console, or CI job).

### Stripe webhooks

Point Stripe to:

`https://YOUR_DOMAIN/api/donations/stripe/webhook`

Add `STRIPE_WEBHOOK_SECRET` to env or configure in Super Admin → Payment.

## 5. Post-deploy checklist

- [ ] Log in as super-admin (`ADMIN_EMAIL` / seed password — change immediately)
- [ ] Super Admin → Settings: site name, logo, SMTP, payment
- [ ] Super Admin → Roles: review permissions
- [ ] Test public site, donations (test mode), admin login
- [ ] Confirm `NEXT_PUBLIC_SITE_URL` matches live domain (sitemap, emails, redirects)

## 6. Scripts reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run start` | Run production server locally |
| `npm run db:push` | Sync schema to database |
| `npm run db:seed` | Seed roles, permissions, super-admin, sample content |
| `npm run db:fix-pooler` | Fix Neon pooled `DATABASE_URL` in `.env.local` |

## Troubleshooting

**`prisma:error … kind: Closed`** — Use pooler URL + `pgbouncer=true`; restart the server after env changes.

**Edge / middleware Prisma error** — Middleware must not import `@/lib/db`; use JWT session only (already configured).

**Build fails on Windows with EPERM** — Stop `npm run dev`, run `npm run prisma -- generate`, then `npm run build`.
