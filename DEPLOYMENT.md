# Deployment Guide — Al Khidmah Community Centre

## Prerequisites

- Node.js 20+
- PostgreSQL (Neon recommended)
- Hosting with Next.js support (Vercel, Railway, etc.)

## 1. Environment variables

Copy `.env.example` to `.env.local` (local) or your host’s env settings (production).

### Required

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string. Neon: use **pooler** host with `?sslmode=require&pgbouncer=true&connect_timeout=15` |
| `JWT_SECRET` | Session signing secret — min 32 random characters |
| `SETTINGS_ENCRYPTION_KEY` | Encrypts payment gateway & SMTP secrets in DB — min 32 random characters |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (emails, sitemap, donation redirects), e.g. `https://alkhidmah.ie` |

### Required for first seed only

| Variable | Purpose |
|----------|---------|
| `ADMIN_EMAIL` | Initial super-admin login email |
| `ADMIN_PASSWORD` | Initial super-admin password (`npm run db:seed`) |

### Email (contact form, receipts, invitations)

Configure via env **or** Super Admin → Settings → Email after deploy.

| Variable | Purpose |
|----------|---------|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | Usually `587` |
| `SMTP_SECURE` | `true` for SSL (465), else `false` |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password / app password |
| `SMTP_FROM` | From address on outbound mail |
| `CONTACT_EMAIL` | Staff inbox for contact form notifications |

### Payments (optional — prefer Super Admin → Payment)

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret (legacy; use Payment Gateway in admin) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `PAYPAL_CLIENT_SECRET` | PayPal secret (legacy) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal client ID |
| `PAYPAL_MODE` | `sandbox` or `live` |

### Cron (Vercel scheduled tasks)

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Bearer token for `GET /api/system/cron` — min 32 random characters |

Configured in `vercel.json` (hourly). Required on Vercel; optional locally.

### Optional

| Variable | Purpose |
|----------|---------|
| `DIRECT_URL` | Neon direct host for migrations; auto-derived if omitted |
| `NEXT_PUBLIC_CHARITY_NUMBER` | Displayed on public site where configured |

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
- [ ] Admin → Dashboard: review **Publish status overview** and publish seed content
- [ ] Admin → Contact Messages: confirm inbox access for staff with registrations permission
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
