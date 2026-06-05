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
| Eid | `/eid` | Built — not in main nav (banner component exists but not on homepage) |

### Home sections

- Live prayer times widget (AlAdhan + DB overrides)
- Ramadan / monthly timetable PDF links (when published)
- Donation category highlights (published categories from DB)
- Upcoming events preview (published)
- Education programmes preview (published)
- Gallery preview (published albums)
- About teaser

### Auth (shared login)

- Register (member accounts)
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
| **Donations** | **Transactions** tab — filter, paginate, export CSV/XLSX/PDF; **Categories** tab — edit name/description, **publish/unpublish toggle** |
| **Education** | Create, edit, delete; **publish/unpublish toggle** |
| **Registrations** | View/filter/export class sign-ups |
| **Prayer Timetable** | Daily overrides, Jumu'ah, Eid, Ramadan timetable (PDF, QR, notes, moon sighting), Monthly timetable (PDF + homepage publish) |
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
| My Donations | **Placeholder** — not linked to user account |
| My Registrations | **Placeholder** — not linked to user email |
| Profile | Live |

---

## 5. Backend & Integrations

### Payments

- Stripe (embedded checkout + webhook)
- PayPal (create order + capture)
- Bank transfer (instructions + pending donation record)
- Donation receipt PDF

### Email (SMTP)

- Contact form notification + auto-reply
- Registration confirmation
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
- Dynamic RBAC (12 permissions, 6 system roles)
- Middleware tier routing (super-admin / admin / user)
- Encrypted payment/SMTP secrets

### Database (main entities)

Users, Roles, Permissions, Invitations, Events, Classes, Registrations, Gallery (albums + items), Donations, Donation categories, Contact messages, Prayer overrides, Ramadan/Monthly timetables, Payment gateways, SMTP settings, Site settings

---

## 6. Partially Implemented or Hidden Today

| Item | Notes |
|------|--------|
| **About — Our Values & Committee** | Hidden via `ABOUT_PAGE_VISIBILITY` flags; committee is static seed data, not CMS |
| **Contact inbox** | Messages saved to DB; **no admin UI** to read/reply |
| **Member donation history** | Donations have no `userId` |
| **Member registrations** | Registrations not tied to logged-in user |
| **Eid homepage banner** | Component exists; not mounted on home |
| **Seed content** | Events, classes, albums, categories seed as **unpublished** — must be published in admin |
| **Editor role gap** | Can manage lists but blocked from create/edit/upload without `content.write` |
| **Legacy config** | Some hardcoded values in constants/flyers vs DB settings |
| **Twitter social link** | In constants; not wired to footer/social builder |
| **Email verification on register** | Only used for email *change*, not new sign-ups |

---

## 7. Suggested Future Updates (priority order)

### High priority (operational gaps)

1. **Contact messages admin** — inbox under admin or super-admin (read, mark handled, export)
2. **Publish seed content workflow** — first-run checklist or “Publish all defaults” for new installs
3. **Member portal completion** — link donations/registrations to user email or account
4. **About page CMS** — dynamic Values + Committee (or merge into Site Settings)

### Medium priority (content & UX)

5. **Homepage Eid banner** — enable when Eid overrides are active
6. **Event categories** — align seed/admin filters (e.g. lecture vs community/youth/sisters)
7. **Gallery item-level publish** — optional, if you need photos live before whole album is ready
8. **Donation category create/delete** — today only edit + toggle existing seeded categories
9. **Admin notification emails** — new registration, new donation, contact form digest
10. **SEO** — sitemap already includes education/events; add gallery/donations landing metadata tuning

### Lower priority (polish & scale)

11. **Unified site config** — single source for contact, branding, flyers, PDFs (reduce constants vs DB drift)
12. **Audit trail for content** — who published/unpublished events, categories, etc.
13. **Scheduled publish** — auto-publish events/programmes on a date
14. **Multi-language** — English + Arabic for public pages / PDFs
15. **Analytics dashboard** — donation trends by category, registration funnel
16. **PWA / offline** — prayer times on home screen
17. **Volunteer / newsletter module** — if needed later

---

## 8. Things Easy to Miss (team notes)

- **Unpublished by default** — new events, programmes, albums, and categories do not appear on the public site until toggled on in admin
- **Donations vs Categories** — same sidebar item, two tabs; category “Published” = `isActive` in the database
- **Prayer Timetable** — sidebar label is “Prayer Timetable”; URL is still `/admin/special-prayers`
- **Database commands** — use `npm run db:push`, `npm run db:deploy`, `npm run db:migrate` (not raw `npx prisma`); env loads from `.env.local`
- **Ramadan QR** — uses published donation categories from the Categories tab
- **Flyer generator** — super admin only; uses active donation categories
- **Registrations** — public form only works for **published** programmes

---

## 9. Technical Debt / Housekeeping

- Remove unused `src/lib/storage.ts` (legacy JSON helpers)
- Wire or remove `prayer_override_enabled` setting
- Consolidate super-admin email settings (tab vs duplicate route)
- Document deployment env vars in one place (`DATABASE_URL`, JWT, encryption keys, SMTP, payment keys)

---

## 10. Quick Role Reference

| Role | Typical access |
|------|----------------|
| **Super Admin** | Everything + users, settings, flyers |
| **Admin** | All content except users/settings |
| **Web Admin** | Events, gallery, prayer times + delete + uploads |
| **Account Admin** | Education, donations, registrations + delete + uploads |
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
| registrations | `registrations.manage` |
| content | `content.write` (upload/create/edit pages) |

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
| `npm run db:seed` | Seed database |
| `npm run db:baseline` | Baseline existing DB for migrations (one-time) |
| `npm run db:resolve-applied -- MIGRATION_NAME` | Mark migration as applied |
| `npm run db:studio` | Prisma Studio |

See also: [DEPLOYMENT.md](../DEPLOYMENT.md), [.env.example](../.env.example)
