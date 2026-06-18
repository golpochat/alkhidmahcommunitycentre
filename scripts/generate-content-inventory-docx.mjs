/**
 * Generates website-content-inventory.docx — all static & dynamic copy for review/replacement.
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
  BorderStyle,
  AlignmentType,
  PageBreak,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "docs", "website-content-inventory.docx");

/** @typedef {{ location: string, type: string, element: string, currentText: string, notes?: string }} ContentRow */

/** @type {ContentRow[]} */
const STATIC_CONTENT = [
  // ── GLOBAL ──
  { location: "Global / constants.ts", type: "STATIC", element: "Site Name (fallback)", currentText: "Al Khidmah Community Centre" },
  { location: "Global / constants.ts", type: "STATIC", element: "Site Description (SEO)", currentText: "Serving the Muslim community of Clondalkin with prayer, education, and community support." },
  { location: "Global / manifest.ts", type: "STATIC", element: "PWA Short Name", currentText: "Al Khidmah" },
  { location: "Global / manifest.ts", type: "STATIC", element: "PWA Description", currentText: "Prayer times, education, and community services for Clondalkin and surrounding areas." },
  { location: "Global / site-logo.tsx", type: "STATIC", element: "Logo Alt Text", currentText: "Al Khidmah Community Centre" },

  // Navigation
  { location: "Global / navbar", type: "STATIC", element: "Nav: Home", currentText: "Home" },
  { location: "Global / navbar", type: "STATIC", element: "Nav: About", currentText: "About" },
  { location: "Global / navbar", type: "STATIC", element: "Nav: Education", currentText: "Education" },
  { location: "Global / navbar", type: "STATIC", element: "Nav: Events", currentText: "Events" },
  { location: "Global / navbar", type: "STATIC", element: "Nav: Gallery", currentText: "Gallery" },
  { location: "Global / navbar", type: "STATIC", element: "Nav: Donations", currentText: "Donations" },
  { location: "Global / navbar", type: "STATIC", element: "Nav: Contact", currentText: "Contact" },
  { location: "Global / navbar", type: "STATIC", element: "CTA Button", currentText: "Donate" },
  { location: "Global / navbar", type: "STATIC", element: "Auth: Sign In", currentText: "Sign In" },
  { location: "Global / navbar", type: "STATIC", element: "Auth: Sign Up", currentText: "Sign Up" },
  { location: "Global / navbar", type: "STATIC", element: "Auth: Dashboard", currentText: "Dashboard" },

  // Footer
  { location: "Global / footer", type: "STATIC", element: "Brand Tagline", currentText: "Prayer, education, and community services for Clondalkin and surrounding areas." },
  { location: "Global / footer", type: "STATIC", element: "Heading: Quick Links", currentText: "Quick Links" },
  { location: "Global / footer", type: "STATIC", element: "Heading: Contact", currentText: "Contact" },
  { location: "Global / footer", type: "STATIC", element: "Heading: Follow Us", currentText: "Follow Us" },
  { location: "Global / footer", type: "STATIC", element: "Copyright (template)", currentText: "© {year} {siteName}. All rights reserved." },
  { location: "Global / footer", type: "STATIC", element: "Charity Line (template)", currentText: "Registered charity: {charityNumber}" },

  // ── HOME ──
  { location: "Home / hero-section", type: "STATIC", element: "H1", currentText: "Serving the Muslim Community of Clondalkin" },
  { location: "Home / hero-section", type: "STATIC", element: "Hero Paragraph", currentText: "A centre for worship, learning, and community — welcoming all to prayer, education, events, and charitable giving." },
  { location: "Home / hero-section", type: "STATIC", element: "Button: Prayer Times", currentText: "Prayer Times" },
  { location: "Home / hero-section", type: "STATIC", element: "Button: Donate Now", currentText: "Donate Now" },

  { location: "Home / prayer-times-widget", type: "STATIC", element: "Badge", currentText: "Live Prayer Times" },
  { location: "Home / prayer-times-widget", type: "STATIC", element: "H2", currentText: "Today's Salah Times" },
  { location: "Home / prayer-times-widget", type: "STATIC", element: "Card Title", currentText: "Al Khidmah Community Centre Prayer Timetable" },
  { location: "Home / prayer-times-widget", type: "STATIC", element: "Error Message", currentText: "Unable to load prayer times right now. Please refresh the page or visit the centre for today's schedule." },
  { location: "Home / prayer-times-widget", type: "STATIC", element: "Offline Message", currentText: "Showing cached prayer times from {date}. Connect to refresh live times." },

  { location: "Home / timetable-banner", type: "STATIC", element: "H2", currentText: "Prayer timetables" },
  { location: "Home / timetable-banner", type: "STATIC", element: "Description", currentText: "Download the latest Ramadan and monthly prayer schedules for Al Khidmah." },

  { location: "Home / donation-highlights", type: "STATIC", element: "Badge", currentText: "Give Generously" },
  { location: "Home / donation-highlights", type: "STATIC", element: "H2", currentText: "Support Your Community" },
  { location: "Home / donation-highlights", type: "STATIC", element: "Paragraph", currentText: "Your donations help maintain prayer facilities, fund education, and serve those in need." },
  { location: "Home / donation-highlights", type: "STATIC", element: "Button", currentText: "View All Donation Options" },

  { location: "Home / events-preview", type: "STATIC", element: "Badge", currentText: "Upcoming Events" },
  { location: "Home / events-preview", type: "STATIC", element: "H2", currentText: "Community Events" },
  { location: "Home / events-preview", type: "STATIC", element: "Paragraph", currentText: "Join community gatherings, youth programmes, and special programmes at the centre." },
  { location: "Home / events-preview", type: "STATIC", element: "Button", currentText: "View All Events" },

  { location: "Home / classes-preview", type: "STATIC", element: "Badge", currentText: "Education" },
  { location: "Home / classes-preview", type: "STATIC", element: "H2", currentText: "Qur'an & Islamic Classes" },
  { location: "Home / classes-preview", type: "STATIC", element: "Paragraph", currentText: "Structured learning for children, youth, and adults at every level." },
  { location: "Home / classes-preview", type: "STATIC", element: "Button", currentText: "View All Programmes" },

  { location: "Home / gallery-preview", type: "STATIC", element: "Badge", currentText: "Gallery" },
  { location: "Home / gallery-preview", type: "STATIC", element: "H2 (template)", currentText: "Moments at {SITE_NAME}" },
  { location: "Home / gallery-preview", type: "STATIC", element: "Paragraph", currentText: "Glimpses of prayer, community, and celebration at our centre." },
  { location: "Home / gallery-preview", type: "STATIC", element: "Button", currentText: "View Full Gallery" },

  { location: "Home / about-teaser", type: "STATIC", element: "Badge", currentText: "About Us" },
  { location: "Home / about-teaser", type: "STATIC", element: "H2 (template)", currentText: "Welcome to {siteName}" },
  { location: "Home / about-teaser", type: "STATIC", element: "Paragraph 1", currentText: "A cornerstone of the Muslim community in Clondalkin since 2010, providing a spiritual home for worship, learning, and charitable service." },
  { location: "Home / about-teaser", type: "STATIC", element: "Paragraph 2", currentText: "We strive to nurture faith, knowledge, and compassion — from the youngest child learning their first surah to elders sharing wisdom and experience." },
  { location: "Home / about-teaser", type: "STATIC", element: "Charity Badge (template)", currentText: "Registered Charity: {charityNumber}" },
  { location: "Home / about-teaser", type: "STATIC", element: "Button", currentText: "Learn More About Us" },
  { location: "Home / about-teaser", type: "STATIC", element: "H3: Our Mission", currentText: "Our Mission" },
  { location: "Home / about-teaser", type: "STATIC", element: "Mission Paragraph", currentText: "To serve the Muslim community of Clondalkin by providing a centre for the five daily prayers, Jumuah, Islamic education, and charitable outreach — while fostering understanding and good relations with our neighbours." },

  // ── ABOUT ──
  { location: "About / page meta", type: "STATIC", element: "Page Title", currentText: "About Us" },
  { location: "About / page meta", type: "STATIC", element: "Meta Description (template)", currentText: "Learn about {siteName}'s mission, history, and committee serving the Muslim community of Clondalkin." },
  { location: "About / page hero", type: "STATIC", element: "Badge", currentText: "About Us" },
  { location: "About / page hero", type: "STATIC", element: "Title (template)", currentText: "About {siteName}" },
  { location: "About / page hero", type: "STATIC", element: "Description (template)", currentText: "{siteName} has been a cornerstone of the Muslim community in Clondalkin since 2010, providing a spiritual home for worship, learning, and charitable service." },
  { location: "About / mission", type: "STATIC", element: "H2", currentText: "Our Mission" },
  { location: "About / mission", type: "STATIC", element: "Paragraph 1", currentText: "To serve the Muslim community of Clondalkin by providing a centre for the five daily prayers, Jumuah, Islamic education, and charitable outreach — while fostering understanding and good relations with our neighbours." },
  { location: "About / mission", type: "STATIC", element: "Paragraph 2", currentText: "We strive to nurture faith, knowledge, and compassion in every member of our community, from the youngest child learning their first surah to elders sharing wisdom and experience." },
  { location: "About / history", type: "STATIC", element: "H2", currentText: "Our History" },
  { location: "About / history", type: "STATIC", element: "Paragraph 1", currentText: "Founded in 2010 by a group of dedicated community members, Al Khidmah Mosque began as a small prayer space serving a handful of families in Clondalkin. Through the generosity of donors and volunteers, we expanded into a full community centre." },
  { location: "About / history", type: "STATIC", element: "Paragraph 2", currentText: "Today, we serve hundreds of families with daily prayers, weekend Quran classes, youth programmes, Ramadan iftars, and charitable initiatives. Our registered charity status ensures transparency and accountability in all our financial operations." },
  { location: "About / charity card", type: "STATIC", element: "Title", currentText: "Verified Charity" },
  { location: "About / charity card", type: "STATIC", element: "Label (template)", currentText: "Registered Charity Number: {charityNumber}" },
  { location: "About / charity card", type: "STATIC", element: "Subtitle", currentText: "Revenue Commissioners Approved" },
  { location: "About / values section", type: "STATIC", element: "H2", currentText: "Our Values" },
  { location: "About / committee section", type: "STATIC", element: "H2", currentText: "Mosque Committee" },

  // Default values (CMS fallback)
  { location: "About / default values", type: "STATIC", element: "Value: Education — Title", currentText: "Education" },
  { location: "About / default values", type: "STATIC", element: "Value: Education — Description", currentText: "Providing Quran and Islamic education for children and adults of all backgrounds." },
  { location: "About / default values", type: "STATIC", element: "Value: Charity — Title", currentText: "Charity" },
  { location: "About / default values", type: "STATIC", element: "Value: Charity — Description", currentText: "Supporting the needy through zakah, sadaqah, and community welfare programmes." },
  { location: "About / default values", type: "STATIC", element: "Value: Community — Title", currentText: "Community" },
  { location: "About / default values", type: "STATIC", element: "Value: Community — Description", currentText: "Building a welcoming space for worship, fellowship, and cultural connection." },
  { location: "About / default values", type: "STATIC", element: "Value: Excellence — Title", currentText: "Excellence" },
  { location: "About / default values", type: "STATIC", element: "Value: Excellence — Description", currentText: "Upholding the highest standards as a registered and verified charity." },

  // Default committee (CMS fallback)
  { location: "About / default committee", type: "STATIC", element: "Member 1 — Name", currentText: "Dr. Ibrahim Hassan" },
  { location: "About / default committee", type: "STATIC", element: "Member 1 — Role", currentText: "Chairperson" },
  { location: "About / default committee", type: "STATIC", element: "Member 1 — Bio", currentText: "Leading the mosque committee with over 15 years of community service in Clondalkin." },
  { location: "About / default committee", type: "STATIC", element: "Member 2 — Name", currentText: "Fatima Al-Rashid" },
  { location: "About / default committee", type: "STATIC", element: "Member 2 — Role", currentText: "Secretary" },
  { location: "About / default committee", type: "STATIC", element: "Member 2 — Bio", currentText: "Coordinating mosque operations and community communications with dedication and care." },
  { location: "About / default committee", type: "STATIC", element: "Member 3 — Name", currentText: "Yusuf Mahmoud" },
  { location: "About / default committee", type: "STATIC", element: "Member 3 — Role", currentText: "Treasurer" },
  { location: "About / default committee", type: "STATIC", element: "Member 3 — Bio", currentText: "Managing charitable funds with transparency and accountability as a registered charity." },
  { location: "About / default committee", type: "STATIC", element: "Member 4 — Name", currentText: "Aisha O'Brien" },
  { location: "About / default committee", type: "STATIC", element: "Member 4 — Role", currentText: "Education Coordinator" },
  { location: "About / default committee", type: "STATIC", element: "Member 4 — Bio", currentText: "Overseeing Quran classes and Islamic education programmes for all ages." },

  // ── CONTACT ──
  { location: "Contact / page hero", type: "STATIC", element: "Badge", currentText: "Contact" },
  { location: "Contact / page hero", type: "STATIC", element: "H1", currentText: "Get in Touch" },
  { location: "Contact / page hero", type: "STATIC", element: "Description", currentText: "We welcome your questions, feedback, and enquiries. Reach out by form, phone, email, or WhatsApp." },
  { location: "Contact / form", type: "STATIC", element: "Card Title", currentText: "Send a Message" },
  { location: "Contact / form", type: "STATIC", element: "Label: Name", currentText: "Name" },
  { location: "Contact / form", type: "STATIC", element: "Placeholder: Name", currentText: "Your name" },
  { location: "Contact / form", type: "STATIC", element: "Label: Email", currentText: "Email" },
  { location: "Contact / form", type: "STATIC", element: "Placeholder: Email", currentText: "you@example.com" },
  { location: "Contact / form", type: "STATIC", element: "Label: Subject", currentText: "Subject" },
  { location: "Contact / form", type: "STATIC", element: "Placeholder: Subject", currentText: "How can we help?" },
  { location: "Contact / form", type: "STATIC", element: "Label: Message", currentText: "Message" },
  { location: "Contact / form", type: "STATIC", element: "Placeholder: Message", currentText: "Your message..." },
  { location: "Contact / form", type: "STATIC", element: "Button", currentText: "Send Message" },
  { location: "Contact / form", type: "STATIC", element: "Success Title", currentText: "Message sent" },
  { location: "Contact / form", type: "STATIC", element: "Success Message", currentText: "Thank you for contacting us. We will reply as soon as possible." },
  { location: "Contact / details", type: "STATIC", element: "Card Title", currentText: "Contact Details" },
  { location: "Contact / details", type: "STATIC", element: "Label: Address", currentText: "Address" },
  { location: "Contact / details", type: "STATIC", element: "Label: Phone", currentText: "Phone" },
  { location: "Contact / details", type: "STATIC", element: "Label: Email", currentText: "Email" },
  { location: "Contact / details", type: "STATIC", element: "Label: Opening Hours", currentText: "Opening Hours" },
  { location: "Contact / details", type: "STATIC", element: "Hours: Mon–Fri", currentText: "Monday – Friday: 9:00 AM – 9:00 PM" },
  { location: "Contact / details", type: "STATIC", element: "Hours: Sat–Sun", currentText: "Saturday – Sunday: 9:00 AM – 9:00 PM" },
  { location: "Contact / details", type: "STATIC", element: "Hours: Prayer Times", currentText: "Prayer Times: Open for all daily prayers" },
  { location: "Contact / details", type: "STATIC", element: "Label: Follow Us", currentText: "Follow Us" },
  { location: "Contact / whatsapp", type: "STATIC", element: "Button", currentText: "Chat on WhatsApp" },
  { location: "Contact / constants", type: "STATIC", element: "Default Address", currentText: "Unit 4, Monastery Road, Clondalkin, Dublin 22, D22 YX82" },
  { location: "Contact / constants", type: "STATIC", element: "Default Phone", currentText: "+353 1 457 8900" },
  { location: "Contact / constants", type: "STATIC", element: "Default Email", currentText: "info@alkhidmahmosque.ie" },
  { location: "Contact / constants", type: "STATIC", element: "Default Charity Number", currentText: "CHY 22345" },

  // ── DONATIONS ──
  { location: "Donations / page hero", type: "STATIC", element: "Badge", currentText: "Donate" },
  { location: "Donations / page hero", type: "STATIC", element: "H1", currentText: "Support Your Mosque" },
  { location: "Donations / page hero", type: "STATIC", element: "Description", currentText: "Choose a donation category and give securely online or by bank transfer. All contributions support prayer, education, and community services." },
  { location: "Donations / page", type: "STATIC", element: "Empty State", currentText: "No donation categories are available at the moment. Please check back later." },
  { location: "Donations / form card", type: "STATIC", element: "Card Title", currentText: "Complete Your Donation" },
  { location: "Donations / form card", type: "STATIC", element: "Description (template)", currentText: "Donating to {categoryName}" },

  // Default donation categories
  { location: "Donations / default categories", type: "STATIC", element: "Sadaqah — Title", currentText: "Sadaqah" },
  { location: "Donations / default categories", type: "STATIC", element: "Sadaqah — Description", currentText: "Voluntary charity that brings barakah and supports ongoing mosque services." },
  { location: "Donations / default categories", type: "STATIC", element: "Fitrah — Title", currentText: "Fitrah" },
  { location: "Donations / default categories", type: "STATIC", element: "Fitrah — Description", currentText: "Eid al-Fitr charity due before Eid prayer to support the less fortunate." },
  { location: "Donations / default categories", type: "STATIC", element: "Mosque Development — Title", currentText: "Mosque Development" },
  { location: "Donations / default categories", type: "STATIC", element: "Mosque Development — Description", currentText: "Help maintain and expand our facilities to serve the growing community." },
  { location: "Donations / default categories", type: "STATIC", element: "Ramadan — Title", currentText: "Ramadan" },
  { location: "Donations / default categories", type: "STATIC", element: "Ramadan — Description", currentText: "Support iftar programmes, taraweeh, and Ramadan community initiatives." },
  { location: "Donations / default categories", type: "STATIC", element: "Dawah — Title", currentText: "Dawah" },
  { location: "Donations / default categories", type: "STATIC", element: "Dawah — Description", currentText: "Fund outreach, literature, and educational programmes for new Muslims." },
  { location: "Donations / default categories", type: "STATIC", element: "Zakah — Title", currentText: "Zakah" },
  { location: "Donations / default categories", type: "STATIC", element: "Zakah — Description", currentText: "Fulfill your obligatory charity and support those in need within our community." },

  // Donation success
  { location: "Donations / success", type: "STATIC", element: "H1", currentText: "Thank You" },
  { location: "Donations / success", type: "STATIC", element: "Success Message (template)", currentText: "Your {provider} donation was processed successfully." },
  { location: "Donations / success", type: "STATIC", element: "Receipt Email (template)", currentText: "A PDF receipt has been sent to {email}." },
  { location: "Donations / success", type: "STATIC", element: "Label: Category", currentText: "Category" },
  { location: "Donations / success", type: "STATIC", element: "Label: Amount", currentText: "Amount" },
  { location: "Donations / success", type: "STATIC", element: "Label: Reference", currentText: "Reference" },
  { location: "Donations / success", type: "STATIC", element: "Label: Payment", currentText: "Payment" },
  { location: "Donations / success", type: "STATIC", element: "Label: Date", currentText: "Date" },
  { location: "Donations / success", type: "STATIC", element: "Button: Download Receipt", currentText: "Download PDF Receipt" },
  { location: "Donations / success", type: "STATIC", element: "Button: Return Home", currentText: "Return Home" },
  { location: "Donations / success", type: "STATIC", element: "Button: Make Another", currentText: "Make Another Donation" },
  { location: "Donations / success", type: "STATIC", element: "Footer", currentText: "JazakAllah khair for supporting our community." },

  // Donation error
  { location: "Donations / error", type: "STATIC", element: "H1", currentText: "Payment Failed" },
  { location: "Donations / error", type: "STATIC", element: "Button", currentText: "Try Again" },

  // ── EVENTS ──
  { location: "Events / page hero", type: "STATIC", element: "Badge", currentText: "Events" },
  { location: "Events / page hero", type: "STATIC", element: "H1", currentText: "Community Events" },
  { location: "Events / page hero", type: "STATIC", element: "Description (template)", currentText: "Community gatherings, youth programmes, sisters' circles, and Ramadan activities at {SITE_NAME}." },
  { location: "Events / filters", type: "STATIC", element: "Filter: All", currentText: "All" },
  { location: "Events / filters", type: "STATIC", element: "Filter: Community", currentText: "Community" },
  { location: "Events / filters", type: "STATIC", element: "Filter: Youth", currentText: "Youth" },
  { location: "Events / filters", type: "STATIC", element: "Filter: Sisters", currentText: "Sisters" },
  { location: "Events / filters", type: "STATIC", element: "Filter: Ramadan", currentText: "Ramadan" },
  { location: "Events / list", type: "STATIC", element: "Empty State", currentText: "No events found for this category. Check back soon or browse all events." },
  { location: "Events / detail", type: "STATIC", element: "H2", currentText: "About This Event" },
  { location: "Events / detail", type: "STATIC", element: "H2: Gallery", currentText: "Gallery" },

  // ── EDUCATION ──
  { location: "Education / page hero", type: "STATIC", element: "Badge", currentText: "Education" },
  { location: "Education / page hero", type: "STATIC", element: "H1", currentText: "Qur'an & Islamic Classes" },
  { location: "Education / page hero", type: "STATIC", element: "Description (template)", currentText: "Structured learning programmes for children, youth, and adults at {SITE_NAME}." },
  { location: "Education / registration dialog", type: "STATIC", element: "Title (template)", currentText: "Register for {classTitle}" },
  { location: "Education / registration dialog", type: "STATIC", element: "Description", currentText: "Complete the form below and we will contact you with enrolment details." },
  { location: "Education / list", type: "STATIC", element: "Empty State", currentText: "No education programmes are available at the moment. Please check back later." },
  { location: "Education / detail", type: "STATIC", element: "Button", currentText: "Register for this class" },

  // ── GALLERY ──
  { location: "Gallery / page hero", type: "STATIC", element: "Badge", currentText: "Gallery" },
  { location: "Gallery / page hero", type: "STATIC", element: "H1", currentText: "Photo Gallery" },
  { location: "Gallery / page hero", type: "STATIC", element: "Description (template)", currentText: "Moments of worship, community, and celebration at {SITE_NAME}." },

  // ── EID ──
  { location: "Eid / page", type: "STATIC", element: "H1", currentText: "Eid Prayer Times" },
  { location: "Eid / page", type: "STATIC", element: "Subtitle", currentText: "Salah times and guidance for Eid-ul-Fitr and Eid-ul-Adha at Al Khidmah" },
  { location: "Eid / page", type: "STATIC", element: "No Eid Title", currentText: "No Eid Prayer Today" },
  { location: "Eid / page", type: "STATIC", element: "No Eid Message", currentText: "There is no Eid prayer scheduled for today. Please check back on Eid day or contact the masjid for the latest announcements." },
  { location: "Eid / page", type: "STATIC", element: "H2: Last Recorded", currentText: "Last Recorded Eid Times" },
  { location: "Eid / page", type: "STATIC", element: "H3: Default Fitr", currentText: "Default Eid-ul-Fitr Times" },
  { location: "Eid / page", type: "STATIC", element: "H3: Default Adha", currentText: "Default Eid-ul-Adha Times" },
  { location: "Eid / notes", type: "STATIC", element: "Sunnah Reminders — Title", currentText: "Sunnah Reminders" },
  { location: "Eid / notes", type: "STATIC", element: "Sunnah Reminders — Body", currentText: "Perform ghusl, wear your best clothes, eat an odd number of dates before leaving for Eid-ul-Fitr, and walk to the masjid if possible." },
  { location: "Eid / notes", type: "STATIC", element: "Parking — Title", currentText: "Parking" },
  { location: "Eid / notes", type: "STATIC", element: "Parking — Body", currentText: "Please use nearby street parking respectfully and allow extra time to arrive. Carpool where possible to reduce congestion." },
  { location: "Eid / notes", type: "STATIC", element: "Women's Area — Title", currentText: "Women's Area" },
  { location: "Eid / notes", type: "STATIC", element: "Women's Area — Body", currentText: "A dedicated sisters' prayer area is available. Sisters are encouraged to arrive early for seating and facilities access." },
  { location: "Eid / notes", type: "STATIC", element: "Takbeer — Title", currentText: "Takbeer" },
  { location: "Eid / notes", type: "STATIC", element: "Takbeer — Body", currentText: "Recite the takbeer after Fajr on the day of Eid until the imam begins the Eid prayer." },

  // ── AUTH ──
  { location: "Auth / login", type: "STATIC", element: "H1", currentText: "Sign In" },
  { location: "Auth / login", type: "STATIC", element: "Subtitle", currentText: "Sign in to your mosque account" },
  { location: "Auth / login", type: "STATIC", element: "Link", currentText: "Forgot password?" },
  { location: "Auth / login", type: "STATIC", element: "Link", currentText: "Register here" },
  { location: "Auth / register", type: "STATIC", element: "H1", currentText: "Create Account" },
  { location: "Auth / register", type: "STATIC", element: "Subtitle", currentText: "Register as a community member" },
  { location: "Auth / check-email", type: "STATIC", element: "H1", currentText: "Check Your Email" },
  { location: "Auth / verify-email", type: "STATIC", element: "H1", currentText: "Email Verification" },
  { location: "Auth / forgot-password", type: "STATIC", element: "H1", currentText: "Forgot Password" },
  { location: "Auth / reset-password", type: "STATIC", element: "H1", currentText: "Reset Password" },
  { location: "Auth / unauthorized", type: "STATIC", element: "H1", currentText: "Access denied" },
  { location: "Auth / unauthorized", type: "STATIC", element: "Message", currentText: "You do not have permission to view this page." },
  { location: "Auth / unauthorized", type: "STATIC", element: "Button", currentText: "Back to admin" },
  { location: "Auth / unauthorized", type: "STATIC", element: "Button", currentText: "Go to homepage" },

  // ── USER PORTAL ──
  { location: "User / sidebar", type: "STATIC", element: "Section", currentText: "My Account" },
  { location: "User / sidebar", type: "STATIC", element: "Nav: Dashboard", currentText: "Dashboard" },
  { location: "User / sidebar", type: "STATIC", element: "Nav: My Donations", currentText: "My Donations" },
  { location: "User / sidebar", type: "STATIC", element: "Nav: My Registrations", currentText: "My Registrations" },
  { location: "User / dashboard", type: "STATIC", element: "Welcome", currentText: "Welcome to your account" },

  // ── VALIDATION MESSAGES ──
  { location: "Forms / validations", type: "STATIC", element: "Name min length", currentText: "Name must be at least 2 characters" },
  { location: "Forms / validations", type: "STATIC", element: "Email invalid", currentText: "Please enter a valid email address" },
  { location: "Forms / validations", type: "STATIC", element: "Password min length", currentText: "Password must be at least 6 characters" },
  { location: "Forms / validations", type: "STATIC", element: "Passwords mismatch", currentText: "Passwords do not match" },
  { location: "Forms / validations", type: "STATIC", element: "Min donation", currentText: "Minimum donation is €1" },
  { location: "Forms / validations", type: "STATIC", element: "Category required", currentText: "Category is required" },
  { location: "Forms / validations", type: "STATIC", element: "Subject min length", currentText: "Subject must be at least 3 characters" },
  { location: "Forms / validations", type: "STATIC", element: "Message min length", currentText: "Message must be at least 10 characters" },
];

/** @type {ContentRow[]} */
const DYNAMIC_CONTENT = [
  // Branding & settings
  { location: "Settings / Super Admin", type: "DYNAMIC", element: "Site Name", currentText: "(from database — site branding settings)", notes: "Used in hero eyebrow, footer, page titles, meta tags" },
  { location: "Settings / Super Admin", type: "DYNAMIC", element: "Charity Number", currentText: "(from database — e.g. CHY 22345)", notes: "About page, footer, home teaser" },
  { location: "Settings / Super Admin", type: "DYNAMIC", element: "Logo Path", currentText: "(from database)", notes: "Navbar, footer, PWA icons" },
  { location: "Settings / Super Admin", type: "DYNAMIC", element: "Address", currentText: "(from database — fallback: Unit 4, Monastery Road, Clondalkin, Dublin 22, D22 YX82)", notes: "Footer, contact page, maps" },
  { location: "Settings / Super Admin", type: "DYNAMIC", element: "Phone", currentText: "(from database — fallback: +353 1 457 8900)", notes: "Footer, contact page" },
  { location: "Settings / Super Admin", type: "DYNAMIC", element: "Email", currentText: "(from database — fallback: info@alkhidmahmosque.ie)", notes: "Footer, contact page" },
  { location: "Settings / Super Admin", type: "DYNAMIC", element: "WhatsApp Number", currentText: "(from database)", notes: "WhatsApp button on contact page" },
  { location: "Settings / Super Admin", type: "DYNAMIC", element: "Social Links", currentText: "(Facebook, Instagram, YouTube URLs from database)", notes: "Footer, contact page" },

  // Prayer times
  { location: "Prayer Times / API", type: "DYNAMIC", element: "Prayer Names", currentText: "Fajr, Dhuhr, Asr, Maghrib, Isha", notes: "Labels are static; times are calculated/fetched" },
  { location: "Prayer Times / API", type: "DYNAMIC", element: "Adhan & Iqama Times", currentText: "(calculated daily from Aladhan API + admin overrides)", notes: "Home widget, /eid, TV display" },
  { location: "Prayer Times / API", type: "DYNAMIC", element: "Hijri Date", currentText: "(from prayer times API)", notes: "Displayed in prayer widget" },
  { location: "Prayer Times / API", type: "DYNAMIC", element: "English Date", currentText: "(today's date)", notes: "Displayed in prayer widget" },
  { location: "Prayer Times / API", type: "DYNAMIC", element: "Next Prayer Countdown", currentText: "(live countdown)", notes: "Prayer widget footer" },
  { location: "Prayer Times / API", type: "DYNAMIC", element: "Jumuah Times", currentText: "(from admin configuration)", notes: "Friday prayer schedule" },
  { location: "Prayer Times / API", type: "DYNAMIC", element: "Eid Prayer Times", currentText: "(from admin configuration on Eid days)", notes: "/eid page, home Eid banner" },
  { location: "Prayer Times / API", type: "DYNAMIC", element: "Eid Title", currentText: "Eid-ul-Fitr / Eid-ul-Adha (based on type)", notes: "Eid banner and page" },

  // Timetables
  { location: "Timetables", type: "DYNAMIC", element: "Ramadan PDF Link Label", currentText: "(e.g. Ramadan 1446 AH · 1 Mar – 30 Mar 2026)", notes: "Home banner — only shown when Ramadan timetable exists" },
  { location: "Timetables", type: "DYNAMIC", element: "Monthly PDF Link Label", currentText: "(e.g. June 2026 prayer timetable)", notes: "Home banner — only shown when monthly timetable published" },

  // Donations
  { location: "Donations / Database", type: "DYNAMIC", element: "Category Names", currentText: "(from donation_categories table — fallback: constants.ts defaults)", notes: "Donations page, home highlights" },
  { location: "Donations / Database", type: "DYNAMIC", element: "Category Descriptions", currentText: "(from donation_categories table — fallback: constants.ts defaults)", notes: "Donation category cards" },
  { location: "Donations / Settings", type: "DYNAMIC", element: "Bank Transfer Details", currentText: "(Account name, Bank, IBAN, BIC from payment gateway settings)", notes: "Shown when bank transfer selected" },
  { location: "Donations / Session", type: "DYNAMIC", element: "Donor Name Prefill", currentText: "(logged-in user's name)", notes: "Donation form" },
  { location: "Donations / Session", type: "DYNAMIC", element: "Donor Email Prefill", currentText: "(logged-in user's email)", notes: "Donation form" },
  { location: "Donations / Transaction", type: "DYNAMIC", element: "Donation Amount", currentText: "(user-entered amount)", notes: "Success page, receipts" },
  { location: "Donations / Transaction", type: "DYNAMIC", element: "Reference ID", currentText: "(generated donation ID)", notes: "Success page, receipts" },

  // Events
  { location: "Events / Database", type: "DYNAMIC", element: "Event Title", currentText: "(from events table)", notes: "Events list, detail page, home preview" },
  { location: "Events / Database", type: "DYNAMIC", element: "Event Description", currentText: "(from events table)", notes: "Event cards and detail page" },
  { location: "Events / Database", type: "DYNAMIC", element: "Event Date & Time", currentText: "(from events table)", notes: "Event cards" },
  { location: "Events / Database", type: "DYNAMIC", element: "Event Location", currentText: "(from events table)", notes: "Event detail page" },
  { location: "Events / Database", type: "DYNAMIC", element: "Event Category", currentText: "(community, youth, sisters, ramadan)", notes: "Event filters and badges" },
  { location: "Events / Database", type: "DYNAMIC", element: "Event Images", currentText: "(uploaded image URLs)", notes: "Event cards and gallery" },

  // Education
  { location: "Education / Database", type: "DYNAMIC", element: "Programme Title", currentText: "(from classes table)", notes: "Education list, detail, home preview" },
  { location: "Education / Database", type: "DYNAMIC", element: "Programme Description", currentText: "(from classes table)", notes: "Class cards and detail" },
  { location: "Education / Database", type: "DYNAMIC", element: "Schedule", currentText: "(from classes table — e.g. Saturdays 10:00–12:00)", notes: "Class cards" },
  { location: "Education / Database", type: "DYNAMIC", element: "Teacher Name", currentText: "(from classes table)", notes: "Class cards" },
  { location: "Education / Database", type: "DYNAMIC", element: "Fee", currentText: "(from classes table — e.g. Free, €50/term)", notes: "Class cards" },
  { location: "Education / Database", type: "DYNAMIC", element: "Age Group", currentText: "(from classes table)", notes: "Class cards" },

  // Gallery
  { location: "Gallery / Database", type: "DYNAMIC", element: "Image Titles", currentText: "(from gallery table)", notes: "Gallery grid, lightbox, home preview" },
  { location: "Gallery / Database", type: "DYNAMIC", element: "Album Names", currentText: "(from gallery_albums table)", notes: "Album filter buttons" },
  { location: "Gallery / Database", type: "DYNAMIC", element: "Image Categories", currentText: "(ramadan, eid, classes, youth, community)", notes: "Gallery item labels" },

  // About CMS
  { location: "About / CMS", type: "DYNAMIC", element: "Our Values — Titles & Descriptions", currentText: "(editable in Admin → About Page — defaults in about-content.ts)", notes: "4 value cards" },
  { location: "About / CMS", type: "DYNAMIC", element: "Committee Members", currentText: "(editable in Admin → About Page — defaults in seed-data.ts)", notes: "Name, role, bio, photo per member" },

  // User portal
  { location: "User / Session", type: "DYNAMIC", element: "User Display Name", currentText: "(from user account)", notes: "Profile, navbar" },
  { location: "User / Session", type: "DYNAMIC", element: "User Email", currentText: "(from user account)", notes: "Profile" },
  { location: "User / Database", type: "DYNAMIC", element: "Donation History", currentText: "(user's past donations)", notes: "My Donations page" },
  { location: "User / Database", type: "DYNAMIC", element: "Class Registrations", currentText: "(user's programme registrations)", notes: "My Registrations page" },

  // TV Display
  { location: "Display / Settings", type: "DYNAMIC", element: "Announcements / Notices", currentText: "(from display_notices table)", notes: "TV display rotation panels" },
  { location: "Display / Settings", type: "DYNAMIC", element: "Rotating Ayat", currentText: "(Arabic + English + source from display settings)", notes: "TV display ayat panel" },
  { location: "Display / API", type: "DYNAMIC", element: "Weather", currentText: "(fetched from weather API)", notes: "TV display weather panel" },
  { location: "Display / Database", type: "DYNAMIC", element: "Upcoming Events", currentText: "(from events table)", notes: "TV display events panel" },

  // Emails
  { location: "Emails / Templates", type: "DYNAMIC", element: "Contact Auto-Reply", currentText: "Thank you for contacting {siteName}. We received your message about \"{subject}\"…", notes: "Sent after contact form submission" },
  { location: "Emails / Templates", type: "DYNAMIC", element: "Donation Receipt", currentText: "Thank you for your donation of {amount} to {category}…", notes: "PDF + email receipt" },
  { location: "Emails / Templates", type: "DYNAMIC", element: "Registration Confirmation", currentText: "Your registration for {classTitle} has been confirmed…", notes: "Class registration email" },
  { location: "Emails / Templates", type: "DYNAMIC", element: "Password Reset", currentText: "Click the link to reset your password…", notes: "Auth email" },
  { location: "Emails / Templates", type: "DYNAMIC", element: "Email Verification", currentText: "Welcome to {siteName}. Please verify your email…", notes: "Registration email" },
  { location: "Emails / Templates", type: "DYNAMIC", element: "Staff Invitation", currentText: "Hello {name}, you have been invited as {role}…", notes: "Staff invitation email" },

  // Admin dashboard stats
  { location: "Admin / Dashboard", type: "DYNAMIC", element: "Donation Totals", currentText: "(calculated from donations table)", notes: "Dashboard stat cards" },
  { location: "Admin / Dashboard", type: "DYNAMIC", element: "Upcoming Events Count", currentText: "(from events table)", notes: "Dashboard stat cards" },
  { location: "Admin / Dashboard", type: "DYNAMIC", element: "New Registrations Count", currentText: "(from registrations table)", notes: "Dashboard stat cards" },
  { location: "Admin / Dashboard", type: "DYNAMIC", element: "Gallery Image Count", currentText: "(from gallery table)", notes: "Dashboard stat cards" },
];

function cell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text: String(text), bold: opts.bold, size: opts.size || 20 })],
      }),
    ],
  });
}

function headerRow() {
  return new TableRow({
    tableHeader: true,
    children: [
      cell("Location / Page", { bold: true, width: 18 }),
      cell("Element", { bold: true, width: 15 }),
      cell("Current Text (in website)", { bold: true, width: 35 }),
      cell("Your Replacement Text", { bold: true, width: 32 }),
    ],
  });
}

function dataRow(row) {
  return new TableRow({
    children: [
      cell(row.location),
      cell(row.element),
      cell(row.notes ? `${row.currentText}\n\nNote: ${row.notes}` : row.currentText),
      cell(""),
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

function contentTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow(), ...rows.map(dataRow)],
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
            new TextRun({ text: "Content Inventory — Static & Dynamic Copy", size: 28, italics: true }),
          ],
        }),
        body("Generated: " + new Date().toLocaleDateString("en-IE", { dateStyle: "long" })),
        body(
          "This document lists all headings, sub-headings, paragraphs, descriptions, button labels, and other user-facing text across the website. Use the \"Your Replacement Text\" column to write your own copy where needed."
        ),
        body(
          "STATIC content is hardcoded in the website source code (or default fallbacks). To change it permanently, update the code or ask your developer."
        ),
        body(
          "DYNAMIC content is managed through the admin panel or database (events, classes, gallery, donation categories, committee, site settings, prayer times, etc.). Edit these in the Admin or Super Admin areas — no code changes needed."
        ),
        new Paragraph({ children: [new PageBreak()] }),

        sectionHeading("PART 1 — STATIC CONTENT"),
        body(
          `Total items: ${STATIC_CONTENT.length}. These texts are embedded in the website code. Review each entry and fill in your preferred replacement text in the right-hand column.`
        ),
        contentTable(STATIC_CONTENT),

        new Paragraph({ children: [new PageBreak()] }),

        sectionHeading("PART 2 — DYNAMIC CONTENT"),
        body(
          `Total items: ${DYNAMIC_CONTENT.length}. These texts come from the database or admin settings. The \"Current Text\" column describes the source; edit the actual content in the Admin panel (not in code).`
        ),
        contentTable(DYNAMIC_CONTENT),

        new Paragraph({ children: [new PageBreak()] }),

        sectionHeading("PART 3 — WHERE TO EDIT DYNAMIC CONTENT"),
        body("Use this quick reference to find where each type of dynamic content is managed:"),
        body("• Site name, charity number, logo, contact details, social links → Super Admin → Settings"),
        body("• About page values & committee → Admin → About Page"),
        body("• Donation categories → Admin → Donations"),
        body("• Events → Admin → Events"),
        body("• Education programmes → Admin → Education"),
        body("• Gallery images & albums → Admin → Gallery"),
        body("• Prayer times & Eid overrides → Admin → Prayer Timetable"),
        body("• Ramadan & monthly PDF timetables → Admin → Prayer Timetable"),
        body("• TV display notices, ayat, settings → Admin → TV Display"),
        body("• Payment / bank details → Super Admin → Settings → Payment"),
        body("• Email templates (SMTP) → Super Admin → Settings → Email"),
        body("• Staff & roles → Super Admin → Staff & Users / Roles & Permissions"),

        sectionHeading("PART 4 — ADMIN & PORTAL UI (NOT LISTED ABOVE)", HeadingLevel.HEADING_2),
        body(
          "The Admin panel, Super Admin panel, Member portal, and Auth pages contain hundreds of additional UI labels (Save, Cancel, Delete, table headers, form field labels). These are functional interface text, not marketing copy. If you need those translated or reworded, request a separate admin UI content document."
        ),
      ],
    },
  ],
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buffer);
console.log(`Written: ${OUT}`);
console.log(`Static items: ${STATIC_CONTENT.length}`);
console.log(`Dynamic items: ${DYNAMIC_CONTENT.length}`);
