/**
 * Generates business-proposal.docx — Irish market pricing for Al Khidmah platform.
 * Run: node scripts/generate-business-proposal-docx.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  PageBreak,
  BorderStyle,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "docs", "business-proposal.docx");

const DAY_RATE = 650; // €/day — Irish specialist rate (2026 market)

/** @typedef {{ module: string, description: string, days: number }} LineItem */
/** @type {LineItem[]} */
const PRICING_LINES = [
  {
    module: "1. Discovery & UX/UI Design",
    description:
      "Requirements workshop, sitemap, wireframes, responsive UI design, Islamic brand system (colours, typography, components), mobile-first layouts",
    days: 12,
  },
  {
    module: "2. Public Website",
    description:
      "Home, About, Education, Events, Gallery, Donations, Contact, Eid pages — SEO metadata, JSON-LD, sitemap, PWA manifest, fully responsive",
    days: 18,
  },
  {
    module: "3. Prayer Times & Timetables",
    description:
      "Live AlAdhan integration, admin overrides, Jumu'ah/Eid schedules, Ramadan PDF generator, monthly timetable, homepage banners, offline cache",
    days: 10,
  },
  {
    module: "4. Donations & Payments",
    description:
      "Stripe + PayPal + bank transfer, category management, processing-fee cover, receipt PDF, success/error flows, staff notifications",
    days: 12,
  },
  {
    module: "5. Staff Admin Panel",
    description:
      "Dashboard, events, gallery, education, donations, registrations, contact inbox, about CMS, prayer timetable, TV display, content audit, analytics",
    days: 22,
  },
  {
    module: "6. Super Admin & Security",
    description:
      "Staff/user management, invitations, 16-permission RBAC, site/payment/email settings, encrypted secrets, middleware tier routing",
    days: 14,
  },
  {
    module: "7. Member Portal & Authentication",
    description:
      "Registration, email verification, login, password reset, profile, my donations, my registrations, retroactive email linking",
    days: 10,
  },
  {
    module: "8. TV Display System",
    description:
      "Landscape/portrait auto-detect, live prayer table, countdown, weather, rotating notices/events/ayat, PIN lock, brightness scheduling",
    days: 8,
  },
  {
    module: "9. Email & Document Generation",
    description:
      "SMTP profiles, contact/registration/donation/invitation emails, Ramadan & monthly PDFs, donation receipts, flyer QR generator",
    days: 8,
  },
  {
    module: "10. Backend, Database & DevOps",
    description:
      "PostgreSQL/Prisma schema, 80+ API routes, cron jobs, image uploads, migrations, Vercel deployment, env documentation, unit tests",
    days: 15,
  },
  {
    module: "11. QA, Training & Handover",
    description:
      "Cross-browser/device testing, accessibility review, staff training session, admin user guide, 30-day post-launch support",
    days: 8,
  },
];

const TOTAL_DAYS = PRICING_LINES.reduce((sum, l) => sum + l.days, 0);
const SUBTOTAL = TOTAL_DAYS * DAY_RATE;

function eur(n) {
  return "€" + n.toLocaleString("en-IE");
}

function cell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: String(text),
            bold: opts.bold,
            size: opts.size || 20,
          }),
        ],
      }),
    ],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 120 },
    children: [new TextRun({ text, size: opts.size || 22 })],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 80 },
    bullet: { level: 0 },
    children: [new TextRun({ text, size: 22 })],
  });
}

function sectionHeading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } });
}

function pricingTable() {
  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        cell("Module", { bold: true, width: 22 }),
        cell("Scope", { bold: true, width: 48 }),
        cell("Days", { bold: true, width: 10 }),
        cell("Cost (€)", { bold: true, width: 20 }),
      ],
    }),
    ...PRICING_LINES.map(
      (line) =>
        new TableRow({
          children: [
            cell(line.module),
            cell(line.description),
            cell(String(line.days)),
            cell(eur(line.days * DAY_RATE)),
          ],
        })
    ),
    new TableRow({
      children: [
        cell("TOTAL", { bold: true }),
        cell(`${TOTAL_DAYS} development days @ €${DAY_RATE}/day (Irish market specialist rate)`, { bold: true }),
        cell(String(TOTAL_DAYS), { bold: true }),
        cell(eur(SUBTOTAL), { bold: true }),
      ],
    }),
  ];

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

function comparisonTable() {
  const tiers = [
    ["Basic brochure site (5–8 pages)", "€1,500 – €3,500", "Static content, contact form, no admin"],
    ["Professional business site", "€3,500 – €8,000", "CMS, blog, basic SEO — no payments or portals"],
    ["E-commerce / donations site", "€5,000 – €15,000", "Online payments, product/donation catalog"],
    ["Custom portal / web application", "€15,000 – €35,000", "User accounts, admin panel, integrations"],
    ["This platform (full scope)", eur(SUBTOTAL), "Public site + 3-tier admin + payments + TV display + prayer system"],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          cell("Website Type (Irish Market 2026)", { bold: true, width: 28 }),
          cell("Typical Price Range", { bold: true, width: 22 }),
          cell("What You Get", { bold: true, width: 50 }),
        ],
      }),
      ...tiers.map(
        (t) =>
          new TableRow({
            children: [cell(t[0]), cell(t[1], { bold: t[0].includes("This platform") }), cell(t[2])],
          })
      ),
    ],
  });
}

function ongoingTable() {
  const items = [
    ["Hosting (Vercel Pro + Neon PostgreSQL)", "€25 – €60 / month", "Production hosting, SSL, CDN, database"],
    ["Domain & email DNS", "€15 – €25 / year", ".ie domain renewal"],
    ["Stripe / PayPal fees", "2.9% + €0.30 per transaction", "Standard card processing (pass-through)"],
    ["Maintenance & support (optional)", "€150 – €350 / month", "Security updates, bug fixes, minor content help"],
    ["Annual security & dependency audit", "€800 – €1,500 / year", "Recommended for payment-handling sites"],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          cell("Item", { bold: true, width: 35 }),
          cell("Estimated Cost", { bold: true, width: 25 }),
          cell("Notes", { bold: true, width: 40 }),
        ],
      }),
      ...items.map(
        (t) => new TableRow({ children: [cell(t[0]), cell(t[1]), cell(t[2])] })
      ),
    ],
  });
}

const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        // Cover
        new Paragraph({ spacing: { before: 1200 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "BUSINESS PROPOSAL", bold: true, size: 56 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: "Custom Digital Platform for Al Khidmah Community Centre",
              size: 32,
              italics: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Prepared for: Al Khidmah Mosque Committee", size: 24 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Market: Republic of Ireland", size: 24 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Date: " + new Date().toLocaleDateString("en-IE", { dateStyle: "long" }),
              size: 24,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 },
          children: [
            new TextRun({ text: "Confidential", size: 22, italics: true, color: "666666" }),
          ],
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // 1. Executive Summary
        sectionHeading("1. Executive Summary"),
        body(
          "This proposal outlines the scope, technical standards, and investment required to deliver a professional, fully responsive digital platform for Al Khidmah Community Centre — comparable to what a mid-tier Irish digital agency would charge for a custom web application, not a standard brochure website."
        ),
        body(
          `The delivered solution is a modern Next.js 14 platform with PostgreSQL database, three-tier access (public, staff admin, super admin), online donations via Stripe and PayPal, live prayer times, TV display for the masjid, member self-service portal, and comprehensive content management — built to Irish charity-sector standards for security, accessibility, and mobile responsiveness.`
        ),
        body(`Total project investment: ${eur(SUBTOTAL)} (excl. VAT)`, { size: 26 }),
        body(
          "This pricing is based on 2026 Irish market day rates of €600–€1,000 for professional web development (source: Ireland Website Design, Everblue Digital, Magnitude Digital) applied to the actual scope delivered — approximately 137 specialist development days."
        ),

        // 2. Project Understanding
        sectionHeading("2. Project Understanding"),
        body(
          "Al Khidmah requires more than a marketing website. The centre needs a single digital hub that serves worshippers, donors, students, staff, and committee members — with prayer times that update daily, secure online giving, event and education listings staff can manage without technical knowledge, and a TV display for the prayer hall."
        ),
        body("Key business drivers:"),
        bullet("Increase donations through secure, multi-channel online giving"),
        bullet("Reduce admin workload with self-service content management"),
        bullet("Build community trust with verified charity information and transparency"),
        bullet("Serve mobile users — majority of mosque visitors browse on phones"),
        bullet("Display live prayer times reliably in the masjid and on the website"),

        // 3. Scope
        sectionHeading("3. Scope of Work & Deliverables"),
        body("The platform comprises four interconnected systems:"),

        sectionHeading("3.1 Public Website", HeadingLevel.HEADING_2),
        bullet("8 public pages: Home, About, Education, Events, Gallery, Donations, Contact, Eid"),
        bullet("Live prayer times widget with offline cache (PWA-ready)"),
        bullet("Ramadan and monthly timetable PDF downloads"),
        bullet("Donation category highlights with secure checkout"),
        bullet("Event, education, and gallery previews from live database"),
        bullet("Contact form with email notification and auto-reply"),
        bullet("Fully responsive — mobile, tablet, desktop, large screens"),
        bullet("SEO: metadata, sitemap, robots.txt, structured data (JSON-LD)"),

        sectionHeading("3.2 Staff Admin Panel", HeadingLevel.HEADING_2),
        bullet("Dashboard with donation analytics, publish checklist, activity charts"),
        bullet("Events, Education, Gallery — create, edit, publish/unpublish, scheduled publish"),
        bullet("Donations — transaction history, CSV/XLSX/PDF export, category management"),
        bullet("Registrations — class sign-up inbox with filters and export"),
        bullet("Contact Messages — read, mark handled, export"),
        bullet("About Page CMS — values and committee sections"),
        bullet("Prayer Timetable — daily overrides, Jumu'ah, Eid, Ramadan & monthly PDFs"),
        bullet("TV Display — notices, ayat rotation, settings, orientation control"),
        bullet("Content Audit — publish/unpublish history log"),

        sectionHeading("3.3 Super Admin", HeadingLevel.HEADING_2),
        bullet("Staff and user management with role-based access control (16 permissions)"),
        bullet("Staff invitation workflow with email onboarding"),
        bullet("Site settings — branding, contact, social links, logo/favicon"),
        bullet("Payment gateway configuration — Stripe, PayPal, bank transfer"),
        bullet("SMTP email profiles with test send"),
        bullet("Donation flyer generator with QR codes"),

        sectionHeading("3.4 Member Portal", HeadingLevel.HEADING_2),
        bullet("Account registration with email verification"),
        bullet("My Donations — history linked to account email"),
        bullet("My Registrations — class enrolments"),
        bullet("Profile management — name, password, email change"),

        new Paragraph({ children: [new PageBreak()] }),

        // 4. Technical Standards
        sectionHeading("4. Technical Standards & Quality"),
        body("This project is built to professional Irish/EU standards, not a template or page-builder shortcut:"),

        sectionHeading("4.1 Technology Stack", HeadingLevel.HEADING_2),
        bullet("Next.js 14 (React) — server-side rendering for SEO and performance"),
        bullet("PostgreSQL with Prisma ORM — reliable, scalable database"),
        bullet("TypeScript — type-safe codebase, fewer production bugs"),
        bullet("Tailwind CSS — consistent, maintainable responsive design"),
        bullet("JWT authentication with encrypted session cookies"),
        bullet("Vercel hosting with CDN — fast delivery across Ireland"),

        sectionHeading("4.2 Security", HeadingLevel.HEADING_2),
        bullet("Role-based access control with 6 system roles and 16 granular permissions"),
        bullet("Encrypted storage of payment gateway and SMTP credentials"),
        bullet("Stripe webhook signature verification"),
        bullet("Email verification required before member login"),
        bullet("Middleware-enforced route protection (super-admin / admin / user tiers)"),
        bullet("HTTPS enforced, secure cookie configuration"),

        sectionHeading("4.3 Responsiveness & Performance", HeadingLevel.HEADING_2),
        bullet("Mobile-first design — tested on phones, tablets, and desktops"),
        bullet("TV display with automatic landscape/portrait detection"),
        bullet("Image optimisation via Next.js Image component"),
        bullet("Prayer times cached locally for offline access (PWA)"),
        bullet("Target: sub-3-second page load on Irish mobile networks"),

        sectionHeading("4.4 Accessibility", HeadingLevel.HEADING_2),
        bullet("Semantic HTML structure with proper heading hierarchy"),
        bullet("Form labels, aria attributes, and keyboard navigation"),
        bullet("Sufficient colour contrast for readability"),
        bullet("Screen-reader compatible navigation and interactive elements"),

        // 5. Design
        sectionHeading("5. Design Approach"),
        body(
          "The visual design reflects the identity of a registered Irish charity and place of worship — dignified, welcoming, and culturally appropriate. Key design elements include:"
        ),
        bullet("Custom Islamic-inspired colour palette (gold, emerald, deep navy)"),
        bullet("Consistent component library — cards, badges, buttons, forms"),
        bullet("Hero imagery with overlay typography for impact"),
        bullet("Dark/light theme support"),
        bullet("Print-ready PDF layouts for Ramadan timetables and donation receipts"),
        bullet("Dedicated TV display UI optimised for viewing distance"),

        // 6. Market Comparison
        sectionHeading("6. Irish Market Price Comparison (2026)"),
        body(
          "The table below places this project against typical Irish website pricing tiers. This platform exceeds a standard business or e-commerce site in scope — it is a custom web application with multiple user roles, payment processing, and real-time data."
        ),
        comparisonTable(),
        body(
          "Sources: Ireland Website Design, Everblue Digital, Magnitude Digital, Web Wizard — Irish agency pricing guides, 2026.",
          { after: 240 }
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // 7. Investment Breakdown
        sectionHeading("7. Investment Breakdown"),
        body(
          `Pricing is calculated at €${DAY_RATE} per specialist development day — within the Irish market range of €600–€1,000/day for experienced developers and below typical Dublin agency rates of €800–€1,250/day.`
        ),
        pricingTable(),

        sectionHeading("7.1 What the Investment Covers", HeadingLevel.HEADING_2),
        bullet("All modules listed in Section 3"),
        bullet("Source code ownership transferred to the client"),
        bullet("Database schema, migrations, and seed data"),
        bullet("Deployment to production (Vercel + Neon)"),
        bullet("Environment configuration documentation"),
        bullet("One staff training session (2 hours, remote or on-site)"),
        bullet("30 days post-launch bug-fix support"),

        sectionHeading("7.2 Not Included", HeadingLevel.HEADING_2),
        bullet("Ongoing hosting and third-party service fees (see Section 8)"),
        bullet("Professional photography or videography"),
        bullet("Copywriting and content population (client provides text)"),
        bullet("Arabic/English multi-language (quoted separately — see Section 10)"),
        bullet("VAT (23%) where applicable"),

        // 8. Ongoing Costs
        sectionHeading("8. Estimated Ongoing Costs"),
        body(
          "After launch, the following running costs apply. Payment processor fees are pass-through; hosting and maintenance are optional but recommended."
        ),
        ongoingTable(),

        // 9. Timeline
        sectionHeading("9. Estimated Timeline"),
        body("For a project of this scope, a realistic delivery schedule is:"),
        bullet("Phase 1 — Discovery & Design: 2–3 weeks"),
        bullet("Phase 2 — Core platform (public site + admin): 6–8 weeks"),
        bullet("Phase 3 — Payments, portal, TV display: 3–4 weeks"),
        bullet("Phase 4 — Prayer system, PDFs, email: 2–3 weeks"),
        bullet("Phase 5 — Testing, training, launch: 1–2 weeks"),
        bullet("Total: approximately 14–20 weeks from signed agreement"),

        // 10. Optional Add-ons
        sectionHeading("10. Optional Future Enhancements"),
        body("The following can be quoted separately if required:"),
        bullet("Arabic / English multi-language with RTL layout — from €8,000"),
        bullet("Volunteer management module — from €4,500"),
        bullet("Newsletter / bulk email module (GDPR-compliant) — from €3,500"),
        bullet("Mobile app (iOS/Android wrapper) — from €6,000"),
        bullet("Additional staff training sessions — €350 per session"),

        // 11. Funding
        sectionHeading("11. Grant & Funding Opportunities"),
        body(
          "Irish organisations may be eligible for partial funding. Note: registered charities with purely religious objects may have limited eligibility — confirm with your Local Enterprise Office (LEO)."
        ),
        bullet("LEO Trading Online Voucher — up to 50% reimbursement (max €2,500) for eligible micro-enterprises"),
        bullet("LEO Business Expansion Grant — case-by-case; digital infrastructure may qualify"),
        bullet("Community Foundation for Ireland — occasional technology grants for registered charities"),

        // 12. Payment Terms
        sectionHeading("12. Proposed Payment Terms"),
        bullet(`30% on agreement — ${eur(Math.round(SUBTOTAL * 0.3))}`),
        bullet(`40% on admin panel completion — ${eur(Math.round(SUBTOTAL * 0.4))}`),
        bullet(`30% on launch and handover — ${eur(Math.round(SUBTOTAL * 0.3))}`),

        // 13. Why This Investment
        sectionHeading("13. Value Summary"),
        body(
          `At ${eur(SUBTOTAL)}, this platform replaces what would otherwise require multiple separate tools: a website builder, a donation platform (e.g. Donorbox), a prayer times service, an event management tool, and manual PDF creation. Consolidating into one custom platform reduces long-term subscription costs and gives the committee full control.`
        ),
        body(
          "Compared to engaging a Dublin city-centre agency for equivalent scope (typically €100,000–€150,000+ for enterprise portal builds), this represents strong value for a charity-grade, production-ready system with payment processing, RBAC, and TV display included."
        ),

        sectionHeading("14. Acceptance"),
        body("To proceed, please sign below and return a copy with the initial deposit."),
        body(" "),
        body("Authorised on behalf of Al Khidmah Community Centre:"),
        body(" "),
        body("Name: _________________________________"),
        body("Role:  _________________________________"),
        body("Date:  _________________________________"),
        body("Signature: _____________________________"),
      ],
    },
  ],
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buffer);
console.log(`Written: ${OUT}`);
console.log(`Total days: ${TOTAL_DAYS}`);
console.log(`Total investment: ${eur(SUBTOTAL)}`);
