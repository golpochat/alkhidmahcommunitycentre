# Al Khidmah Community Centre

Next.js 14 website and admin platform for Al Khidmah Mosque — public pages, staff admin, super-admin RBAC, donations, events, education, gallery, and prayer times.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL via Prisma (Neon recommended)
- **Auth:** JWT cookies, dynamic roles & permissions
- **Payments:** Stripe & PayPal (optional)
- **Email:** Nodemailer / SMTP

## Local development

```bash
npm install
cp .env.example .env.local   # then edit credentials
npm run db:fix-pooler        # Neon: ensure pooled DATABASE_URL
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Default super-admin credentials come from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local` (see seed).

## Production deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for environment variables, database setup, Vercel steps, and troubleshooting.

Verify before deploy:

```bash
npm run build
```

## Project structure

| Path                   | Description                          |
| ---------------------- | ------------------------------------ |
| `src/app/(site)/`      | Public website                       |
| `src/app/admin/`       | Staff dashboard                      |
| `src/app/super-admin/` | Super-admin (roles, users, settings) |
| `src/app/api/`         | REST API routes                      |
| `prisma/`              | Schema, migrations, seed             |

## License

Private — Al Khidmah Community Centre.
