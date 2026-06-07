# Al Khidmah Community Centre — Feature Inventory

> Last updated: June 2026  
> Stack: Next.js 14, PostgreSQL/Prisma, JWT auth, Stripe/PayPal/bank transfer, SMTP email

---

## 1. Public Website

### Pages & navigation

| Area | Route | Status |
|------|--------|--------|
| Home | `/` | Live — hero, prayer widget, timetable banner, previews |
| About | `/about` | Live — mission, history, charity badge |
| Education | `/education`, `/education/[slug]` | Live — published programmes only |
| Events | `/events`, `/events/[slug]` | Live — published events only |
| Gallery | `/gallery` | Live — photos from published albums |
| Donations | `/donations` | Live — Stripe, PayPal, bank transfer |
| Contact | `/contact` | Live — form + site contact info |
| Eid | `/eid` | Live — homepage banner when Eid overrides active |

### Home sections

- Live prayer times widget (AlAdhan + DB overrides)
- Ramadan / monthly timetable PDF links (when published)
- Donation category highlights (published categories from DB)
- Upcoming events preview (published)
- Education programmes preview (published)
- Gallery preview (published albums)
- About teaser

### Auth (shared login)

- Register (member accounts) — email verification required before first login
- Login / logout
- Forgot / reset password
- Email change verification
- Staff invitation accept flow

---

## 2. Staff Admin Panel (`/admin`)

| Module | What it does |
|--------|----------------|
| **Dashboard** | Donation stats, charts, recent activity |
| **Events** | Create, edit, delete; **publish/unpublish toggle** |
| **Gallery** | Albums, upload photos, rename; **album publish toggle** |
| **Donations** | **Transactions** tab — filter, paginate, export CSV/XLSX/PDF; **Categories** tab — create, edit, delete (guarded), **publish/unpublish toggle** |
| **Education** | Create, edit, delete; **publish/unpublish toggle** |
| **Registrations** | View/filter/export class sign-ups |
| **Contact Messages** | Inbox — read, mark handled, export CSV |
| **About Page** | CMS for Values + Committee sections |
| **Prayer Timetable** | Daily overrides, Jumu'ah, Eid, Ramadan timetable (PDF, QR, notes, moon sighting), Monthly timetable (PDF + homepage publish) |
| **TV Display** | Notices, ayat rotation, display settings, orientation — public screen at `/display/prayer` |
| **Content Audit** | Publish/unpublish history log |
| **Profile** | Name, password, email |

### Publish / unpublish model (consistent pattern)

| Content | DB field | Default |
|---------|----------|---------|
| Events | `published` | `false` |
| Education programmes | `published` | `false` |
| Gallery albums | `published` | `false` |
| Donation categories | `isActive` (shown as Published/Unpublished) | `false` on seed |

---

## 3. Super Admin (`/super-admin`)

| Module | What it does |
|--------|----------------|
| **Staff & Users** | Manage staff/members, roles, activate/deactivate, audit log |
| **Invitations** | Invite staff with roles |
| **Flyer Generator** | Donation QR flyers from active categories |
| **Roles & Permissions** | Custom roles, permission toggles |
| **Settings — Site** | Site name, contact, social links, logo/favicon |
| **Settings — Payment** | Stripe / PayPal / bank transfer gateways |
| **Settings — Email** | SMTP profiles, test send |
| **Profile** | Same as other tiers |

---

## 4. Member Portal (`/user`)

| Module | Status |
|--------|--------|
| Dashboard | Live — links to other sections |
| My Donations | Live — email-linked history with retroactive linking |
| My Registrations | Live — class sign-ups matched by account email |
| Profile | Live |

---

## 5. Backend & Integrations

### Payments

- Stripe (embedded checkout + webhook)
- PayPal (create order + capture)
- Bank transfer (instructions + pending donation record)
- Optional donor processing-fee cover (Stripe / PayPal — configurable per gateway)
- Donation receipt PDF

### Scheduled tasks

- Vercel cron (`vercel.json`) — hourly `GET /api/system/cron` (requires `CRON_SECRET`)
- Expires display notices, refreshes ayat cache, maintains prayer cache

### TV Display (public)

- Route: `/display/prayer` (landscape + portrait auto-detect)
- Live prayer table, countdown ring, weather (Open-Meteo), rotating announcements/events/ayat
- Priority notices pinned while valid; admin managed at `/admin/display`

### Email (SMTP)

- Contact form notification + auto-reply
- Registration confirmation + staff notification
- Donation receipt (donor) + staff notification on successful payment
- Staff invitation emails

### PDF generation

- Ramadan timetable (portrait, QR footer, notes)
- Monthly timetable (landscape)
- Donation receipts / statements
- Flyer generator (super admin)

### Prayer times

- AlAdhan API + manual overrides
- Daily, Jumu'ah, Eid overrides
- Ramadan season (29/30 days, moon sighting, payment QR slots)
- Monthly timetable with homepage publish

### Auth & security

- JWT session cookies
- Dynamic RBAC (16 permissions, 6 system roles)
- Middleware tier routing (super-admin / admin / user)
- Encrypted payment/SMTP secrets

### Database (main entities)

Users, Roles, Permissions, Invitations, Events, Classes, Registrations, Gallery (albums + items), Donations, Donation categories, Contact messages, Prayer overrides, Ramadan/Monthly timetables, Payment gateways, SMTP settings, Site settings

---

## 6. Partially Implemented or Hidden Today

| Item | Notes |
|------|--------|
| **Editor role gap** | Can manage lists but blocked from create/edit/upload without `content.write` |
| **Legacy config** | A few public/display strings still fall back to `constants.ts` when branding context is unavailable |

---

## 6a. Recently completed hardening (June 2026)

| Item | Notes |
|------|--------|
| **Member email verification** | Register sends verify link; login blocked until verified |
| **Dedicated permissions** | `contact.manage`, `content.audit` |
| **Prisma migration** | `20260609120000_phase3_hardening` for Phase 3 schema |
| **SEO detail pages** | Event/Course JSON-LD on detail routes |
| **Site branding** | DB-driven name in layouts, emails, and public site context |
| **Registrations filters** | Defaults to today with **All dates** toggle |
| **Super-admin email route** | `/super-admin/settings/email` redirects to settings tab |
| **Unit tests** | `npm run test` — cron auth, fee calc, permission keys |

---

## 7. Product Roadmap (3 phases)

> Phase 1 items below were implemented June 2026 unless marked otherwise.

### Phase 1 — Operational Essentials (Foundation) ✓

**Goal:** Fix gaps that block day-to-day mosque operations and reduce confusion for staff after deploy.

1. **Contact messages admin** — inbox to read, mark handled, export. ✓
2. **First-run publish checklist** — seed content unpublished by default. ✓
3. **Update FEATURES.md** — document TV Display, fee cover, cron job. ✓
4. **Technical housekeeping** — remove unused `storage.ts`; fix dead settings. ✓
5. **Align donation category seeding** — consistent `isActive` defaults. ✓
6. **Env/deployment doc consolidation** — one clear list of required env vars. ✓
7. **Publish Status Overview (NEW)** — dashboard showing published/unpublished items. ✓

**Outcome:** Staff can manage inbound contact, new deployments aren't blank, and documentation matches the product.

---

### Phase 2 — Member Experience & Staff Workflows ✓

**Goal:** Complete self-service for members and tighten admin notifications and content control.

1. **Member portal — My Donations** — email-linked + retroactive linking. ✓
2. **Member portal — My Registrations**. ✓
3. **About page CMS** — Dynamic Values + Committee. ✓
4. **Homepage Eid banner** — mount when Eid overrides active. ✓
5. **Admin donation notifications** — email staff on successful donations. ✓
6. **Donation category CRUD** — create/delete; prevent deletion if category has donations. ✓
7. **Unify site config** — single source for contact, branding, social links, PDFs. ✓
8. **Twitter/X in site settings** — wired into footer. ✓

**Outcome:** Members see their own history; staff get timely alerts; public site content is easier to manage.

---

### Phase 3 — Scale, Polish & Long-Term Growth ✓

**Goal:** Improve reach, automation, analytics, and reduce manual work.

1. **Content audit trail** — log publish/unpublish actions. ✓
2. **Scheduled publish** — auto-publish events/programmes. ✓
3. **Gallery item-level publish** — optional. ✓
4. **SEO expansion** — metadata/sitemap tuning. ✓
5. **Analytics dashboard** — donation trends, registration funnel, display usage. ✓
6. **PWA / offline prayer times** — home-screen install, cached widget. ✓
7. **Automated Ramadan Timetable (NEW)** — auto-generate timetable + daily Suhoor/Iftar auto-publish. ✓
8. **Display enhancements** — PIN lock, ticker, brightness scheduling. ✓

**Outcome:** Less manual work, better visibility into usage, and long-term scalability.

---

### Future updates (not in current phases)

Items kept for later — **not** part of Phase 1–3 implementation until explicitly prioritised.

| # | Item | Benefit | Effort / notes |
|---|------|---------|----------------|
| 6 | **EN / AR (multi-language)** | Reach Arabic-speaking community | Large, ongoing translations + RTL |
| 8 | **Volunteer / newsletter** | Organise helpers + bulk communication | New modules + GDPR/consent |

---

## 8. Things Easy to Miss (team notes)

- **Unpublished by default** — new events, programmes, albums, and categories do not appear on the public site until toggled on in admin
- **Donations vs Categories** — same sidebar item, two tabs; category “Published” = `isActive` in the database
- **Prayer Timetable** — sidebar label is “Prayer Timetable”; URL is still `/admin/special-prayers`
- **Contact Messages** — uses `contact.manage` permission; route `/admin/contact`
- **Content Audit** — uses `content.audit` permission; route `/admin/audit`
- **TV Display** — uses `display.manage` permission; admin at `/admin/display`, public screen at `/display/prayer`
- **About Page CMS** — `/admin/about` (requires `about.manage`); toggles Values/Committee visibility
- **Member portal** — `/user/donations` and `/user/registrations` match by account email
- **Publish checklist** — admin dashboard shows unpublished content after seed/deploy
- **Database commands** — use `npm run db:push`, `npm run db:deploy`, `npm run db:migrate` (not raw `npx prisma`); env loads from `.env.local`
- **Ramadan QR** — uses published donation categories from the Categories tab
- **Flyer generator** — super admin only; uses active donation categories
- **Registrations** — public form only works for **published** programmes

---

## 9. Technical Debt / Housekeeping

- ~~Remove unused `src/lib/storage.ts` (legacy JSON helpers)~~ — removed
- ~~Remove unused `prayer_override_enabled` setting~~ — removed from defaults/seed
- Consolidate super-admin email settings (tab vs duplicate route) — duplicate route now redirects to settings tab
- See [DEPLOYMENT.md](../DEPLOYMENT.md) for the full environment variable list

---

## 10. Quick Role Reference

| Role | Typical access |
|------|----------------|
| **Super Admin** | Everything + users, settings, flyers |
| **Admin** | All content except users/settings |
| **Web Admin** | Events, gallery, prayer times, TV display + delete + uploads |
| **Account Admin** | Education, donations, registrations, about page + delete + uploads |
| **Editor** | Events, education, registrations, prayer times (no delete, no upload pages) |
| **Member** | Public site + `/user` portal only |

---

## 11. Permissions (RBAC)

**Three tiers:** Super Admin → `/super-admin` | Staff → `/admin` | Member → `/user`

| Group | Permission keys |
|-------|-----------------|
| users | `users.manage` |
| settings | `settings.manage` |
| events | `events.manage`, `events.delete` |
| gallery | `gallery.manage`, `gallery.delete` |
| education | `education.manage`, `education.delete` |
| donations | `donations.manage` |
| prayer_times | `prayer_times.manage` |
| display | `display.manage` |
| about | `about.manage` |
| registrations | `registrations.manage` |
| contact | `contact.manage` |
| content | `content.write`, `content.audit` |

**Seeded system roles:** super-admin, admin, editor, web-admin, account-admin, member

---

## 12. Useful npm Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:push` | Sync schema to database |
| `npm run db:deploy` | Apply pending migrations |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run test` | Run unit tests (Vitest) |
| `npm run db:seed` | Seed database (also syncs RBAC permissions on existing DB) |
| `npm run db:baseline` | Baseline existing DB for migrations (one-time) |
| `npm run db:resolve-applied -- MIGRATION_NAME` | Mark migration as applied |
| `npm run db:studio` | Prisma Studio |

See also: [DEPLOYMENT.md](../DEPLOYMENT.md), [.env.example](../.env.example)
