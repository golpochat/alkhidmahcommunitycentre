/**
 * Generates website-content-inventory.docx — essential client copy only.
 * Run: node scripts/generate-content-inventory-docx.mjs
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
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "docs", "website-content-inventory.docx");

/** @typedef {{ section: string, field: string, currentText: string, whereToEdit: string, priority?: string }} ContentRow */

/**
 * Only content the client must verify or supply — real facts, identity, and core messaging.
 * UI labels, buttons, auth text, validation messages, and admin-managed listings are excluded.
 */
/** @type {ContentRow[]} */
const ESSENTIAL_CONTENT = [
  // ── 1. ORGANISATION IDENTITY (must be legally accurate) ──
  {
    section: "1. Organisation Identity",
    field: "Official organisation / site name",
    currentText: "Al Khidmah Community Centre",
    whereToEdit: "Super Admin → Settings → Site",
    priority: "Required",
  },
  {
    section: "1. Organisation Identity",
    field: "Registered charity number",
    currentText: "CHY 22345",
    whereToEdit: "Super Admin → Settings → Site",
    priority: "Required",
  },
  {
    section: "1. Organisation Identity",
    field: "Short name (browser tab / app icon label)",
    currentText: "Al Khidmah",
    whereToEdit: "Developer / manifest.ts (or ask developer)",
    priority: "Optional",
  },
  {
    section: "1. Organisation Identity",
    field: "SEO description (Google search snippet)",
    currentText:
      "Serving the Muslim community of Clondalkin with prayer, education, and community support.",
    whereToEdit: "Developer / constants.ts (or ask developer)",
    priority: "Recommended",
  },

  // ── 2. CONTACT DETAILS (must be correct) ──
  {
    section: "2. Contact Details",
    field: "Full postal address",
    currentText: "Unit 4, Monastery Road, Clondalkin, Dublin 22, D22 YX82",
    whereToEdit: "Super Admin → Settings → Contact",
    priority: "Required",
  },
  {
    section: "2. Contact Details",
    field: "Phone number",
    currentText: "+353 1 457 8900",
    whereToEdit: "Super Admin → Settings → Contact",
    priority: "Required",
  },
  {
    section: "2. Contact Details",
    field: "Email address",
    currentText: "info@alkhidmahmosque.ie",
    whereToEdit: "Super Admin → Settings → Contact",
    priority: "Required",
  },
  {
    section: "2. Contact Details",
    field: "WhatsApp number",
    currentText: "+353851234567",
    whereToEdit: "Super Admin → Settings → Contact",
    priority: "Recommended",
  },
  {
    section: "2. Contact Details",
    field: "Facebook URL",
    currentText: "https://facebook.com/alkhidmahmosque",
    whereToEdit: "Super Admin → Settings → Contact",
    priority: "If applicable",
  },
  {
    section: "2. Contact Details",
    field: "Instagram URL",
    currentText: "https://instagram.com/alkhidmahmosque",
    whereToEdit: "Super Admin → Settings → Contact",
    priority: "If applicable",
  },
  {
    section: "2. Contact Details",
    field: "YouTube URL",
    currentText: "https://youtube.com/@alkhidmahmosque",
    whereToEdit: "Super Admin → Settings → Contact",
    priority: "If applicable",
  },
  {
    section: "2. Contact Details",
    field: "Opening hours — weekdays",
    currentText: "Monday – Friday: 9:00 AM – 9:00 PM",
    whereToEdit: "Developer / contact.ts (or ask developer)",
    priority: "Required",
  },
  {
    section: "2. Contact Details",
    field: "Opening hours — weekends",
    currentText: "Saturday – Sunday: 9:00 AM – 9:00 PM",
    whereToEdit: "Developer / contact.ts (or ask developer)",
    priority: "Required",
  },
  {
    section: "2. Contact Details",
    field: "Opening hours — prayer access note",
    currentText: "Prayer Times: Open for all daily prayers",
    whereToEdit: "Developer / contact.ts (or ask developer)",
    priority: "Recommended",
  },

  // ── 3. HOME PAGE — core first impression ──
  {
    section: "3. Home Page",
    field: "Main headline (H1)",
    currentText: "Serving the Muslim Community of Clondalkin",
    whereToEdit: "Developer / hero-section.tsx (or ask developer)",
    priority: "Required",
  },
  {
    section: "3. Home Page",
    field: "Hero tagline / sub-text",
    currentText:
      "A centre for worship, learning, and community — welcoming all to prayer, education, events, and charitable giving.",
    whereToEdit: "Developer / hero-section.tsx (or ask developer)",
    priority: "Required",
  },
  {
    section: "3. Home Page",
    field: "Footer & brand tagline",
    currentText:
      "Prayer, education, and community services for Clondalkin and surrounding areas.",
    whereToEdit: "Developer / footer.tsx (or ask developer)",
    priority: "Recommended",
  },
  {
    section: "3. Home Page",
    field: "About teaser — intro paragraph",
    currentText:
      "A cornerstone of the Muslim community in Clondalkin since 2010, providing a spiritual home for worship, learning, and charitable service.",
    whereToEdit: "Developer / about-teaser.tsx (or ask developer)",
    priority: "Recommended",
  },
  {
    section: "3. Home Page",
    field: "About teaser — mission summary",
    currentText:
      "To serve the Muslim community of Clondalkin by providing a centre for the five daily prayers, Jumuah, Islamic education, and charitable outreach — while fostering understanding and good relations with our neighbours.",
    whereToEdit: "Developer / about-teaser.tsx (or ask developer)",
    priority: "Recommended",
  },

  // ── 4. ABOUT PAGE — your story ──
  {
    section: "4. About Page",
    field: "Page intro (hero description)",
    currentText:
      "{Site name} has been a cornerstone of the Muslim community in Clondalkin since 2010, providing a spiritual home for worship, learning, and charitable service.",
    whereToEdit: "Developer / about page (or ask developer)",
    priority: "Required",
  },
  {
    section: "4. About Page",
    field: "Our Mission — paragraph 1",
    currentText:
      "To serve the Muslim community of Clondalkin by providing a centre for the five daily prayers, Jumuah, Islamic education, and charitable outreach — while fostering understanding and good relations with our neighbours.",
    whereToEdit: "Developer / about page (or ask developer)",
    priority: "Required",
  },
  {
    section: "4. About Page",
    field: "Our Mission — paragraph 2",
    currentText:
      "We strive to nurture faith, knowledge, and compassion in every member of our community, from the youngest child learning their first surah to elders sharing wisdom and experience.",
    whereToEdit: "Developer / about page (or ask developer)",
    priority: "Recommended",
  },
  {
    section: "4. About Page",
    field: "Our History — paragraph 1",
    currentText:
      "Founded in 2010 by a group of dedicated community members, Al Khidmah Mosque began as a small prayer space serving a handful of families in Clondalkin. Through the generosity of donors and volunteers, we expanded into a full community centre.",
    whereToEdit: "Developer / about page (or ask developer)",
    priority: "Required",
  },
  {
    section: "4. About Page",
    field: "Our History — paragraph 2",
    currentText:
      "Today, we serve hundreds of families with daily prayers, weekend Quran classes, youth programmes, Ramadan iftars, and charitable initiatives. Our registered charity status ensures transparency and accountability in all our financial operations.",
    whereToEdit: "Developer / about page (or ask developer)",
    priority: "Required",
  },
  {
    section: "4. About Page",
    field: "Year founded (if different from 2010)",
    currentText: "2010",
    whereToEdit: "Mention in history paragraphs above",
    priority: "Required",
  },

  // ── 5. OUR VALUES (4 cards) ──
  {
    section: "5. Our Values",
    field: "Value 1 — title",
    currentText: "Education",
    whereToEdit: "Admin → About Page → Our Values",
    priority: "Required",
  },
  {
    section: "5. Our Values",
    field: "Value 1 — description",
    currentText:
      "Providing Quran and Islamic education for children and adults of all backgrounds.",
    whereToEdit: "Admin → About Page → Our Values",
    priority: "Required",
  },
  {
    section: "5. Our Values",
    field: "Value 2 — title",
    currentText: "Charity",
    whereToEdit: "Admin → About Page → Our Values",
    priority: "Required",
  },
  {
    section: "5. Our Values",
    field: "Value 2 — description",
    currentText:
      "Supporting the needy through zakah, sadaqah, and community welfare programmes.",
    whereToEdit: "Admin → About Page → Our Values",
    priority: "Required",
  },
  {
    section: "5. Our Values",
    field: "Value 3 — title",
    currentText: "Community",
    whereToEdit: "Admin → About Page → Our Values",
    priority: "Required",
  },
  {
    section: "5. Our Values",
    field: "Value 3 — description",
    currentText:
      "Building a welcoming space for worship, fellowship, and cultural connection.",
    whereToEdit: "Admin → About Page → Our Values",
    priority: "Required",
  },
  {
    section: "5. Our Values",
    field: "Value 4 — title",
    currentText: "Excellence",
    whereToEdit: "Admin → About Page → Our Values",
    priority: "Required",
  },
  {
    section: "5. Our Values",
    field: "Value 4 — description",
    currentText:
      "Upholding the highest standards as a registered and verified charity.",
    whereToEdit: "Admin → About Page → Our Values",
    priority: "Required",
  },

  // ── 6. MOSQUE COMMITTEE (real people) ──
  {
    section: "6. Mosque Committee",
    field: "Member 1 — full name",
    currentText: "Dr. Ibrahim Hassan",
    whereToEdit: "Admin → About Page → Committee",
    priority: "Required",
  },
  {
    section: "6. Mosque Committee",
    field: "Member 1 — role",
    currentText: "Chairperson",
    whereToEdit: "Admin → About Page → Committee",
    priority: "Required",
  },
  {
    section: "6. Mosque Committee",
    field: "Member 1 — short bio",
    currentText:
      "Leading the mosque committee with over 15 years of community service in Clondalkin.",
    whereToEdit: "Admin → About Page → Committee",
    priority: "Recommended",
  },
  {
    section: "6. Mosque Committee",
    field: "Member 2 — full name",
    currentText: "Fatima Al-Rashid",
    whereToEdit: "Admin → About Page → Committee",
    priority: "Required",
  },
  {
    section: "6. Mosque Committee",
    field: "Member 2 — role",
    currentText: "Secretary",
    whereToEdit: "Admin → About Page → Committee",
    priority: "Required",
  },
  {
    section: "6. Mosque Committee",
    field: "Member 2 — short bio",
    currentText:
      "Coordinating mosque operations and community communications with dedication and care.",
    whereToEdit: "Admin → About Page → Committee",
    priority: "Recommended",
  },
  {
    section: "6. Mosque Committee",
    field: "Member 3 — full name",
    currentText: "Yusuf Mahmoud",
    whereToEdit: "Admin → About Page → Committee",
    priority: "Required",
  },
  {
    section: "6. Mosque Committee",
    field: "Member 3 — role",
    currentText: "Treasurer",
    whereToEdit: "Admin → About Page → Committee",
    priority: "Required",
  },
  {
    section: "6. Mosque Committee",
    field: "Member 3 — short bio",
    currentText:
      "Managing charitable funds with transparency and accountability as a registered charity.",
    whereToEdit: "Admin → About Page → Committee",
    priority: "Recommended",
  },
  {
    section: "6. Mosque Committee",
    field: "Member 4 — full name",
    currentText: "Aisha O'Brien",
    whereToEdit: "Admin → About Page → Committee",
    priority: "Required",
  },
  {
    section: "6. Mosque Committee",
    field: "Member 4 — role",
    currentText: "Education Coordinator",
    whereToEdit: "Admin → About Page → Committee",
    priority: "Required",
  },
  {
    section: "6. Mosque Committee",
    field: "Member 4 — short bio",
    currentText:
      "Overseeing Quran classes and Islamic education programmes for all ages.",
    whereToEdit: "Admin → About Page → Committee",
    priority: "Recommended",
  },
  {
    section: "6. Mosque Committee",
    field: "Additional members (add/remove as needed)",
    currentText: "(Add more in admin if your committee has more than 4 members)",
    whereToEdit: "Admin → About Page → Committee",
    priority: "As needed",
  },

  // ── 7. DONATION CATEGORIES (what you collect for) ──
  {
    section: "7. Donation Categories",
    field: "Sadaqah — description",
    currentText:
      "Voluntary charity that brings barakah and supports ongoing mosque services.",
    whereToEdit: "Admin → Donations → Categories",
    priority: "Required",
  },
  {
    section: "7. Donation Categories",
    field: "Fitrah — description",
    currentText:
      "Eid al-Fitr charity due before Eid prayer to support the less fortunate.",
    whereToEdit: "Admin → Donations → Categories",
    priority: "Required",
  },
  {
    section: "7. Donation Categories",
    field: "Mosque Development — description",
    currentText:
      "Help maintain and expand our facilities to serve the growing community.",
    whereToEdit: "Admin → Donations → Categories",
    priority: "Required",
  },
  {
    section: "7. Donation Categories",
    field: "Ramadan — description",
    currentText:
      "Support iftar programmes, taraweeh, and Ramadan community initiatives.",
    whereToEdit: "Admin → Donations → Categories",
    priority: "Required",
  },
  {
    section: "7. Donation Categories",
    field: "Dawah — description",
    currentText:
      "Fund outreach, literature, and educational programmes for new Muslims.",
    whereToEdit: "Admin → Donations → Categories",
    priority: "Required",
  },
  {
    section: "7. Donation Categories",
    field: "Zakah — description",
    currentText:
      "Fulfill your obligatory charity and support those in need within our community.",
    whereToEdit: "Admin → Donations → Categories",
    priority: "Required",
  },
  {
    section: "7. Donation Categories",
    field: "Bank account details (for bank transfer donations)",
    currentText: "(Set in Super Admin → Settings → Payment → Bank Transfer)",
    whereToEdit: "Super Admin → Settings → Payment",
    priority: "Required if accepting bank transfers",
  },

  // ── 8. CONTACT PAGE MESSAGE ──
  {
    section: "8. Contact Page",
    field: "Welcome message",
    currentText:
      "We welcome your questions, feedback, and enquiries. Reach out by form, phone, email, or WhatsApp.",
    whereToEdit: "Developer / contact page (or ask developer)",
    priority: "Recommended",
  },

  // ── 9. EID GUIDANCE (site-specific practical info) ──
  {
    section: "9. Eid Page",
    field: "Sunnah reminders",
    currentText:
      "Perform ghusl, wear your best clothes, eat an odd number of dates before leaving for Eid-ul-Fitr, and walk to the masjid if possible.",
    whereToEdit: "Developer / eid page (or ask developer)",
    priority: "Recommended",
  },
  {
    section: "9. Eid Page",
    field: "Parking guidance",
    currentText:
      "Please use nearby street parking respectfully and allow extra time to arrive. Carpool where possible to reduce congestion.",
    whereToEdit: "Developer / eid page (or ask developer)",
    priority: "Recommended",
  },
  {
    section: "9. Eid Page",
    field: "Women's prayer area",
    currentText:
      "A dedicated sisters' prayer area is available. Sisters are encouraged to arrive early for seating and facilities access.",
    whereToEdit: "Developer / eid page (or ask developer)",
    priority: "Recommended",
  },
  {
    section: "9. Eid Page",
    field: "Takbeer reminder",
    currentText:
      "Recite the takbeer after Fajr on the day of Eid until the imam begins the Eid prayer.",
    whereToEdit: "Developer / eid page (or ask developer)",
    priority: "Recommended",
  },
];

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

function headerRow() {
  return new TableRow({
    tableHeader: true,
    children: [
      cell("Section", { bold: true, width: 14 }),
      cell("Field", { bold: true, width: 18 }),
      cell("Priority", { bold: true, width: 10 }),
      cell("Current Text (placeholder)", { bold: true, width: 28 }),
      cell("Your Text / Correct Details", { bold: true, width: 22 }),
      cell("Where to Update", { bold: true, width: 18 }),
    ],
  });
}

function dataRow(row) {
  return new TableRow({
    children: [
      cell(row.section),
      cell(row.field),
      cell(row.priority || ""),
      cell(row.currentText),
      cell(""),
      cell(row.whereToEdit),
    ],
  });
}

function sectionHeading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } });
}

function body(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22 })],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 80 },
    bullet: { level: 0 },
    children: [new TextRun({ text, size: 22 })],
  });
}

const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Al Khidmah Mosque Website", bold: true, size: 48 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [
            new TextRun({
              text: "Essential Content — Client Input Checklist",
              size: 28,
              italics: true,
            }),
          ],
        }),
        body("Generated: " + new Date().toLocaleDateString("en-IE", { dateStyle: "long" })),
        body(
          "This document lists only the content that needs your real information — organisation details, your story, committee members, donation purposes, and site-specific guidance. Fill in the \"Your Text / Correct Details\" column and return this document, or update directly in the admin panel where indicated."
        ),
        body(
          "Items marked Required must be verified before launch. Recommended items improve the site but can use the placeholder text initially."
        ),

        sectionHeading("What is NOT in this document", HeadingLevel.HEADING_2),
        body("The following are managed ongoing in the admin panel — no need to fill in here:"),
        bullet("Events — Admin → Events"),
        bullet("Education programmes — Admin → Education"),
        bullet("Gallery photos — Admin → Gallery"),
        bullet("Prayer times & timetables — Admin → Prayer Timetable"),
        bullet("TV display announcements — Admin → TV Display"),
        bullet("Button labels, form labels, and login pages — standard UI, no client input needed"),

        new Paragraph({ children: [new PageBreak()] }),

        sectionHeading("Essential Content Checklist"),
        body(`Total fields: ${ESSENTIAL_CONTENT.length}`),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow(), ...ESSENTIAL_CONTENT.map(dataRow)],
        }),

        new Paragraph({ children: [new PageBreak()] }),

        sectionHeading("Quick Priority Summary", HeadingLevel.HEADING_2),
        body("Before launch, at minimum confirm:"),
        bullet("Official site name and charity number"),
        bullet("Correct address, phone, email, and WhatsApp"),
        bullet("Social media links (or remove if not used)"),
        bullet("Opening hours"),
        bullet("Home page headline and tagline"),
        bullet("About page mission and history (your real story)"),
        bullet("Committee members — real names and roles"),
        bullet("Donation category descriptions and bank details"),
        bullet("Our Values — four cards reflecting your mosque"),
      ],
    },
  ],
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buffer);
console.log(`Written: ${OUT}`);
console.log(`Essential fields: ${ESSENTIAL_CONTENT.length}`);
