# Al Khidmah Community Centre — Client Content Requirements

**Generated:** 19 June 2026  
**Purpose:** Lists all content and information needed from the client to launch and operate the website and admin platform.

Fill in the **Your text / correct details** column (or update directly in the admin panel where indicated) and return this document to the development team.

---

## Priority key

| Label | Meaning |
|-------|---------|
| **Required** | Must be confirmed before launch |
| **Recommended** | Improves the site; placeholder text is acceptable initially |
| **If applicable** | Only needed if you use that feature |
| **As needed** | Add or update when relevant |

---

## Before launch — minimum checklist

- [ ] Official site name, charity number, and live domain URL
- [ ] Correct address, phone, email, WhatsApp, and staff notification email
- [ ] Social media links (or confirm removal if not used)
- [ ] Opening hours
- [ ] Home page headline, tagline, and explore-section card text (or approve placeholders)
- [ ] About page mission and history (your real story)
- [ ] Committee members — real names and roles
- [ ] Our Values — four cards reflecting your mosque
- [ ] Donation categories — descriptions and which to publish
- [ ] Payment gateway credentials (Stripe / PayPal / bank transfer as applicable)
- [ ] SMTP email configured and test email sent
- [ ] Jumu'ah and Eid prayer times confirmed
- [ ] Staff list for invitations
- [ ] Logo uploaded in Super Admin settings
- [ ] Favicon confirmed (default gold minaret on emerald green, or upload your own)
- [ ] **Legal policies reviewed by your solicitor and published** (Privacy, Cookie, Terms)

---

## What is NOT in this document

The following are managed ongoing in the admin panel after launch — no need to fill in here upfront:

- Events — create and publish in **Admin → Events**
- Education programmes — **Admin → Education**
- Gallery photos — **Admin → Gallery**
- Prayer times & timetables — **Admin → Prayer Timetable**
- TV display announcements — **Admin → Screen & Announcements**
- Donation transaction history — **Admin → Donations → Transactions**
- Contact form submissions — **Admin → Contact Messages**
- Class registrations — **Admin → Registrations**
- Member accounts — self-registration on the public site
- UI labels, buttons, and login pages — standard; no client input needed

---

## 1. Organisation identity

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| Official organisation / site name | Required | Al Khidmah Community Centre | | Super Admin → Settings → Site |
| Registered charity number | Required | CHY 22345 | | Super Admin → Settings → Site |
| Live website URL (domain) | Required | https://alkhidmah.ie | | Super Admin → Settings → Site |
| Logo file (PNG/SVG, transparent background preferred) | Required | Placeholder logo in `/public/logo/` | | Super Admin → Settings → Site → Branding → Upload Logo |
| Favicon / app icon | Recommended | Gold minaret on emerald green background (`/favicon.png`) | | Super Admin → Settings → Site → Branding → Upload Favicon — or ask developer to regenerate from artwork (`npm run favicon:generate`) |
| SEO description (Google search snippet) | Recommended | Serving the Muslim community of Clondalkin with prayer, education, and community support. | | Ask developer (`constants.ts` / metadata) |

---

## 2. Contact details

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| Full postal address | Required | Unit 4, Monastery Road, Clondalkin, Dublin 22, D22 YX82 | | Super Admin → Settings → Site |
| Phone number | Required | +353 1 457 8900 | | Super Admin → Settings → Site |
| Public email address | Required | info@alkhidmahmosque.ie | | Super Admin → Settings → Site |
| Staff notification email (donations, registrations, contact form) | Required | info@alkhidmahmosque.ie | | Super Admin → Settings → Site |
| WhatsApp number | Recommended | +353851234567 | | Super Admin → Settings → Site |
| Facebook URL | If applicable | https://facebook.com/alkhidmahmosque | | Super Admin → Settings → Site |
| Instagram URL | If applicable | https://instagram.com/alkhidmahmosque | | Super Admin → Settings → Site |
| YouTube URL | If applicable | https://youtube.com/@alkhidmahmosque | | Super Admin → Settings → Site |
| X (Twitter) URL | If applicable | https://twitter.com/alkhidmahmosque | | Super Admin → Settings → Site |
| Opening hours — weekdays | Required | Monday – Friday: 9:00 AM – 9:00 PM | | Ask developer (`contact.ts`) or provide text |
| Opening hours — weekends | Required | Saturday – Sunday: 9:00 AM – 9:00 PM | | Ask developer (`contact.ts`) or provide text |
| Opening hours — prayer access note | Recommended | Prayer Times: Open for all daily prayers | | Ask developer (`contact.ts`) or provide text |

---

## 3. Home page

The home page now uses a compact **Explore** section (links to Donations, Events, Education, and Gallery) instead of full content previews. Prayer times, timetable banners, hero, and about teaser remain.

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| Main headline (H1) | Required | Serving the Muslim Community of Clondalkin | | Ask developer (`hero-section.tsx`) |
| Hero tagline / sub-text | Required | A centre for worship, learning, and community — welcoming all to prayer, education, events, and charitable giving. | | Ask developer (`hero-section.tsx`) |
| Hero background photo (mosque exterior/interior) | Recommended | Stock placeholder image | | Provide high-res photo to developer |
| Explore section — heading | Recommended | More at the Centre | | Ask developer (`home-explore-section.tsx`) |
| Explore section — intro line | Recommended | Donations, events, classes, and photos each have their own page. | | Ask developer (`home-explore-section.tsx`) |
| Explore — Donate card description | Recommended | Support prayer, education, and community outreach. | | Ask developer (`home-explore-section.tsx`) |
| Explore — Events card description | Recommended | Community gatherings, programmes, and special occasions. | | Ask developer (`home-explore-section.tsx`) |
| Explore — Education card description | Recommended | Qur'an, Arabic, and Islamic classes for all ages. | | Ask developer (`home-explore-section.tsx`) |
| Explore — Gallery card description | Recommended | Photos from prayer, education, and community life. | | Ask developer (`home-explore-section.tsx`) |
| Footer & brand tagline | Recommended | Prayer, education, and community services for Clondalkin and surrounding areas. | | Ask developer (`footer.tsx`) |
| About teaser — intro paragraph | Recommended | A cornerstone of the Muslim community in Clondalkin since 2010… | | Ask developer (`about-teaser.tsx`) |
| About teaser — mission summary | Recommended | To serve the Muslim community of Clondalkin by providing a centre for the five daily prayers… | | Ask developer (`about-teaser.tsx`) |

---

## 4. About page

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| Page intro (hero description) | Required | {Site name} has been a cornerstone of the Muslim community in Clondalkin since 2010… | | Ask developer (about page) |
| Our Mission — paragraph 1 | Required | To serve the Muslim community of Clondalkin by providing a centre for the five daily prayers… | | Ask developer (about page) |
| Our Mission — paragraph 2 | Recommended | We strive to nurture faith, knowledge, and compassion… | | Ask developer (about page) |
| Our History — paragraph 1 | Required | Founded in 2010 by a group of dedicated community members… | | Ask developer (about page) |
| Our History — paragraph 2 | Required | Today, we serve hundreds of families with daily prayers… | | Ask developer (about page) |
| Year founded | Required | 2010 | | Include in history text above |
| About page hero photo | Recommended | Stock placeholder | | Provide photo to developer |
| Community gathering photo (mission section) | Recommended | Stock placeholder | | Provide photo to developer |

---

## 5. Our values

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| Value 1 — title | Required | Education | | Admin → About Page → Our Values |
| Value 1 — description | Required | Providing Quran and Islamic education for children and adults of all backgrounds. | | Admin → About Page → Our Values |
| Value 2 — title | Required | Charity | | Admin → About Page → Our Values |
| Value 2 — description | Required | Supporting the needy through zakah, sadaqah, and community welfare programmes. | | Admin → About Page → Our Values |
| Value 3 — title | Required | Community | | Admin → About Page → Our Values |
| Value 3 — description | Required | Building a welcoming space for worship, fellowship, and cultural connection. | | Admin → About Page → Our Values |
| Value 4 — title | Required | Excellence | | Admin → About Page → Our Values |
| Value 4 — description | Required | Upholding the highest standards as a registered and verified charity. | | Admin → About Page → Our Values |

---

## 6. Mosque committee

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| Member 1 — full name | Required | Dr. Ibrahim Hassan | | Admin → About Page → Committee |
| Member 1 — role | Required | Chairperson | | Admin → About Page → Committee |
| Member 1 — short bio | Recommended | Leading the mosque committee with over 15 years of community service in Clondalkin. | | Admin → About Page → Committee |
| Member 1 — photo | Optional | (none) | | Admin → About Page → Committee |
| Member 2 — full name | Required | Fatima Al-Rashid | | Admin → About Page → Committee |
| Member 2 — role | Required | Secretary | | Admin → About Page → Committee |
| Member 2 — short bio | Recommended | Coordinating mosque operations and community communications… | | Admin → About Page → Committee |
| Member 3 — full name | Required | Yusuf Mahmoud | | Admin → About Page → Committee |
| Member 3 — role | Required | Treasurer | | Admin → About Page → Committee |
| Member 3 — short bio | Recommended | Managing charitable funds with transparency and accountability… | | Admin → About Page → Committee |
| Member 4 — full name | Required | Aisha O'Brien | | Admin → About Page → Committee |
| Member 4 — role | Required | Education Coordinator | | Admin → About Page → Committee |
| Member 4 — short bio | Recommended | Overseeing Quran classes and Islamic education programmes… | | Admin → About Page → Committee |
| Additional members | As needed | (Add/remove in admin as required) | | Admin → About Page → Committee |

---

## 7. Donation categories

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| Sadaqah — title & description | Required | Voluntary charity that brings barakah and supports ongoing mosque services. | | Admin → Donations → Categories |
| Fitrah — title & description | Required | Eid al-Fitr charity due before Eid prayer… | | Admin → Donations → Categories |
| Mosque Development — title & description | Required | Help maintain and expand our facilities… | | Admin → Donations → Categories |
| Ramadan — title & description | Required | Support iftar programmes, taraweeh, and Ramadan initiatives. | | Admin → Donations → Categories |
| Dawah — title & description | Required | Fund outreach, literature, and educational programmes. | | Admin → Donations → Categories |
| Zakah — title & description | Required | Fulfill your obligatory charity and support those in need. | | Admin → Donations → Categories |
| Additional categories (if needed) | As needed | (Create in admin — starts unpublished) | | Admin → Donations → Categories |
| Confirm which categories to publish at launch | Required | (All start unpublished after seed) | | Admin → Donations → Categories → Publish toggle |

---

## 8. Payment setup

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| Stripe account — publishable key, secret key, webhook secret | If using Stripe | (Not configured) | | Super Admin → Settings → Payment → Stripe |
| PayPal account — client ID, secret, live/sandbox mode | If using PayPal | (Not configured) | | Super Admin → Settings → Payment → PayPal |
| Bank transfer — account name, bank name, IBAN, BIC, reference note | If using bank transfer | (Not configured) | | Super Admin → Settings → Payment → Bank Transfer |
| Donation currency | Required | EUR | | Super Admin → Settings → Payment |
| Allow donor to cover processing fees? | Recommended | Configurable per gateway | | Super Admin → Settings → Payment |

---

## 9. Email (SMTP)

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| SMTP host, port, username, password | Required | (Not configured) | | Super Admin → Settings → Email |
| From email address (must be authorised on SMTP account) | Required | (Not configured) | | Super Admin → Settings → Email |
| Test email after setup | Required | Send test from admin to confirm delivery | | Super Admin → Settings → Email → Test Send |

---

## 10. Prayer times & location

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| Mosque GPS coordinates (latitude / longitude) | Required | 53.3217, -6.4064 (Clondalkin default) | | Ask developer (`constants.ts`) if location differs |
| Calculation method preference | Recommended | AlAdhan API default for Ireland | | Admin → Prayer Timetable |
| Jumu'ah prayer time(s) | Required | (Set in admin) | | Admin → Prayer Timetable → Jumu'ah |
| Eid prayer times (Fitr & Adha) | Required | (Set before each Eid) | | Admin → Prayer Timetable → Eid |
| Daily prayer overrides (if different from calculated times) | As needed | (Optional) | | Admin → Prayer Timetable |
| Ramadan timetable — start date, moon sighting notes, PDF | Before Ramadan | (Configure each year) | | Admin → Prayer Timetable → Ramadan |
| Monthly timetable PDF (optional homepage banner) | As needed | (Configure each month) | | Admin → Prayer Timetable → Monthly |

---

## 11. Eid page

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| Sunnah reminders text | Recommended | Perform ghusl, wear your best clothes, eat dates… | | Ask developer (eid page) or provide text |
| Parking guidance | Recommended | Please use nearby street parking respectfully… | | Ask developer (eid page) or provide text |
| Women's prayer area guidance | Recommended | A dedicated sisters' prayer area is available… | | Ask developer (eid page) or provide text |
| Takbeer reminder | Recommended | Recite the takbeer after Fajr on the day of Eid… | | Ask developer (eid page) or provide text |

---

## 12. Contact page

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| Welcome message | Recommended | We welcome your questions, feedback, and enquiries… | | Ask developer (contact page) or provide text |
| Contact page hero photo | Optional | Stock placeholder | | Provide photo to developer |

---

## 13. Staff & access

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| Super admin email (primary account owner) | Required | (Set at deployment) | | Deployment env: `ADMIN_EMAIL` |
| List of staff to invite (name, email, role) | Required | (Provide spreadsheet or list) | | Super Admin → Invitations |
| Role assignments (Admin, Web Admin, Account Admin, Editor) | Required | (See role guide in `FEATURES.md`) | | Super Admin → Invitations / Users |
| Who can manage legal policies | Recommended | Admin and Super Admin (`legal.manage` permission) | | Super Admin → Roles & Permissions |

---

## 14. Initial content (admin)

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| Events — titles, dates, descriptions, photos | Required | Sample seed events (unpublished) | | Admin → Events → Publish when ready |
| Education programmes — title, schedule, teacher, fees | Required | Sample seed programmes (unpublished) | | Admin → Education → Publish when ready |
| Gallery — album names and real mosque photos | Recommended | Sample stock photos (unpublished) | | Admin → Gallery → Publish albums when ready |
| TV display — welcome notice, rotating announcements | Recommended | (Not configured) | | Admin → Screen & Announcements |
| TV display — PIN lock code (if used) | Optional | (Not configured) | | Admin → Screen & Announcements → Settings |

---

## 15. Photography & media

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| Home hero image (landscape, min 1920×1080) | Recommended | Stock placeholder | | Send to developer or upload via gallery/events |
| Page hero images (About, Events, Education, Gallery, Donations, Contact) | Optional | Stock placeholders | | Send to developer |
| Event cover photos (one per event) | Recommended | Stock placeholders | | Admin → Events (when creating) |
| Real gallery photos (community, Ramadan, Eid, classes, youth) | Recommended | Stock placeholders | | Admin → Gallery |

---

## 16. Legal policies *(new — June 2026)*

Draft templates are pre-loaded in the admin panel. **They are not legal advice** — your solicitor must review and approve before publishing.

Published policies appear at `/legal` and in the site footer. Placeholders such as `{{siteName}}`, `{{charityNumber}}`, `{{email}}`, `{{address}}`, and `{{website}}` are filled automatically from site settings when saved.

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| Privacy Policy — full legal text | Required | GDPR draft template (unpublished) | | Admin → Legal Policies → Privacy Policy |
| Cookie Policy — full legal text | Required | Cookie draft template (unpublished) | | Admin → Legal Policies → Cookie Policy |
| Terms of Use — full legal text | Required | Terms draft template (unpublished) | | Admin → Legal Policies → Terms of Use |
| Policy version numbers | Recommended | 1.0 (draft) | | Admin → Legal Policies (per policy) |
| Effective date & last reviewed date | Recommended | Auto-filled to today when editing; confirm before publish | | Admin → Legal Policies (per policy) |
| Publish each policy after solicitor sign-off | Required | All start as unpublished drafts | | Admin → Legal Policies → Published toggle → Save |
| Confirm consent checkboxes match published policies | Required | Contact, registration, and member register forms link to Privacy Policy; donations show terms notice; cookie banner links to Cookie Policy | | Review after publishing — no extra config needed if policies are published |

---

## 17. Domain & launch

| Field | Priority | Current placeholder | Your text / correct details | Where to update |
|-------|----------|---------------------|----------------------------|-----------------|
| Domain name registered and DNS pointed to hosting | Required | (Client responsibility) | | Client / hosting provider |
| SSL certificate active on live domain | Required | (Automatic on Vercel) | | Hosting provider |
| Hard-refresh browser after favicon or branding changes | Recommended | Cache-busted via `?v=8` on default favicon | | Client browsers after go-live |

---

## After returning this document

The development team will update any developer-managed fields (home page copy, opening hours, hardcoded page text, coordinates). All admin-managed items can be entered directly by staff once accounts are created.

**Related docs:** [FEATURES.md](./FEATURES.md) · [DEPLOYMENT.md](../DEPLOYMENT.md)

**Regenerate Word version:** `python scripts/generate-client-content-docx.py`
