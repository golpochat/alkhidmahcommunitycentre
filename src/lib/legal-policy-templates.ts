import {
  LEGAL_POLICY_SLUGS,
  type LegalPolicySlug,
} from "@/lib/legal-policy-types";

const DRAFT_NOTICE = `> **DRAFT — REQUIRES LEGAL REVIEW**  
> This template is provided for convenience only and does not constitute legal advice.  
> Please have your solicitor review and approve before publishing.

`;

export interface LegalPolicySeedTemplate {
  slug: LegalPolicySlug;
  title: string;
  summary: string;
  sortOrder: number;
  content: string;
}

export const LEGAL_POLICY_SEED_TEMPLATES: LegalPolicySeedTemplate[] = [
  {
    slug: LEGAL_POLICY_SLUGS.privacy,
    title: "Privacy Policy",
    summary:
      "How {{siteName}} collects, uses, and protects personal information.",
    sortOrder: 1,
    content: `${DRAFT_NOTICE}# Privacy Policy

**Version:** 1.0 (draft)  
**Data controller:** {{siteName}}  
**Registered charity:** {{charityNumber}}  
**Contact:** {{email}} · {{address}}

## 1. Introduction

{{siteName}} ("we", "us", "our") is a registered charity operating a community centre and website at {{website}}. We respect your privacy and are committed to protecting personal data in accordance with the General Data Protection Regulation (GDPR) and Irish data protection law.

This policy explains what personal data we collect, why we collect it, how we use it, and your rights.

## 2. Personal data we collect

We may collect:

- **Identity and contact data** — name, email address, phone number, postal address
- **Account data** — login credentials (stored securely hashed), membership preferences
- **Donation data** — donation amount, category, payment reference, donor name and email where provided
- **Programme registration data** — class or event sign-up details
- **Communications** — messages sent via our contact form
- **Technical data** — IP address, browser type, device information, and cookies (see our Cookie Policy)

We do not knowingly collect data from children under 16 without parental consent.

## 3. How we use your data

We use personal data to:

- Provide prayer times, community information, and website services
- Process donations and issue receipts
- Manage class and event registrations
- Respond to enquiries and contact form messages
- Operate member accounts and staff administration
- Meet legal, regulatory, and charity governance obligations
- Improve our website and services

**Lawful bases:** consent, contractual necessity, legitimate interests (charitable purposes), and legal obligation.

## 4. Sharing your data

We may share data with:

- **Payment processors** (e.g. Stripe, PayPal) to process donations
- **Email service providers** to send receipts and notifications
- **Hosting and IT providers** who process data on our behalf under contract
- **Regulators or authorities** where required by law

We do not sell personal data.

## 5. Retention

We retain personal data only as long as necessary for the purposes above, including statutory retention for charity and tax records. Contact and registration records are typically retained for up to 7 years unless a shorter period applies.

## 6. Security

We implement appropriate technical and organisational measures to protect personal data, including access controls, encrypted connections (HTTPS), and secure password storage.

## 7. Your rights

Under GDPR you may have the right to:

- Access your personal data
- Rectify inaccurate data
- Erase data (where applicable)
- Restrict or object to processing
- Data portability
- Withdraw consent at any time (where processing is based on consent)
- Lodge a complaint with the Data Protection Commission (Ireland): [dataprotection.ie](https://www.dataprotection.ie)

To exercise your rights, contact us at **{{email}}**.

## 8. International transfers

Where data is processed outside the EEA, we ensure appropriate safeguards (such as Standard Contractual Clauses) are in place.

## 9. Changes to this policy

We may update this policy from time to time. The effective date and version will be shown on this page. Significant changes may be communicated via our website or email where appropriate.

## 10. Contact

**{{siteName}}**  
{{address}}  
Tel: {{phone}}  
Email: {{email}}
`,
  },
  {
    slug: LEGAL_POLICY_SLUGS.cookies,
    title: "Cookie Policy",
    summary: "How this website uses cookies and similar technologies.",
    sortOrder: 2,
    content: `${DRAFT_NOTICE}# Cookie Policy

**Version:** 1.0 (draft)  
**Operator:** {{siteName}} ({{charityNumber}})

## 1. What are cookies?

Cookies are small text files stored on your device when you visit a website. They help the site function, remember preferences, or understand how the site is used.

## 2. How we use cookies

### Strictly necessary cookies

These cookies are essential for the website to work. They include:

| Cookie | Purpose | Duration |
|--------|---------|----------|
| Session / authentication | Keeps you signed in to member or staff areas | Session or as configured |
| Security | Protects forms and admin access | Session |

These cookies do not require consent under ePrivacy rules because they are strictly necessary.

### Functional cookies

We may use cookies to remember preferences (for example, dismissing the cookie notice). These are optional and can be controlled via your browser.

### Analytics cookies

We do **not** currently use third-party analytics cookies. If this changes, we will update this policy and request consent where required.

## 3. Managing cookies

You can control cookies through your browser settings. Blocking strictly necessary cookies may affect login and site functionality.

## 4. Third-party cookies

Payment providers (Stripe, PayPal) may set cookies when you complete a donation. Please refer to their privacy policies for details.

## 5. Contact

Questions about cookies: **{{email}}**

See also our [Privacy Policy](/legal/privacy-policy).
`,
  },
  {
    slug: LEGAL_POLICY_SLUGS.terms,
    title: "Terms of Use",
    summary: "Rules for using the {{siteName}} website and online services.",
    sortOrder: 3,
    content: `${DRAFT_NOTICE}# Website Terms of Use

**Version:** 1.0 (draft)  
**Operator:** {{siteName}}  
**Registered charity:** {{charityNumber}}  
**Contact:** {{email}}

## 1. Acceptance

By accessing {{website}} you agree to these Terms of Use. If you do not agree, please do not use this website.

## 2. About us

{{siteName}} is a registered charity ({{charityNumber}}) based at {{address}}. Our website provides information about prayer times, community programmes, events, education, donations, and contact facilities.

## 3. Use of the website

You agree to use this website lawfully and respectfully. You must not:

- Attempt unauthorised access to admin, member, or staff areas
- Upload malicious code or interfere with site operation
- Use the site for unlawful, harmful, or misleading purposes
- Impersonate others or misrepresent your affiliation with the centre

## 4. Donations

Donations made through this website are voluntary gifts to support the charitable work of {{siteName}}. Unless otherwise stated:

- Donations are generally non-refundable once processed
- Payment processing is handled by third-party providers subject to their terms
- We will issue receipts by email where an address is provided
- Bank transfer instructions, where offered, must be followed carefully

Nothing on this website constitutes tax or financial advice. Consult a qualified adviser regarding charitable giving and tax treatment.

## 5. Programmes and events

Class registrations and event information are provided in good faith. We reserve the right to amend schedules, cancel programmes, or update published information. Where practicable we will notify registered participants.

## 6. Intellectual property

Content on this website (text, images, logos, timetables) is owned by or licensed to {{siteName}} unless otherwise credited. You may view and print pages for personal, non-commercial use. Reproduction for other purposes requires our written permission.

## 7. Disclaimer

Prayer times are provided for convenience. Users should verify times with the centre where accuracy is critical. Website content is provided "as is" without warranties; to the fullest extent permitted by law we exclude liability for loss arising from use of the site except where liability cannot be excluded.

## 8. Links

Our site may link to third-party websites. We are not responsible for their content or privacy practices.

## 9. Privacy

Our [Privacy Policy](/legal/privacy-policy) explains how we handle personal data.

## 10. Changes

We may update these terms. Continued use after changes are posted constitutes acceptance of the updated terms.

## 11. Governing law

These terms are governed by the laws of Ireland. Irish courts shall have exclusive jurisdiction, subject to mandatory consumer rights.

## 12. Contact

**{{siteName}}**  
{{address}}  
Tel: {{phone}}  
Email: {{email}}
`,
  },
];

export function getLegalPolicySeedTemplate(slug: LegalPolicySlug) {
  return LEGAL_POLICY_SEED_TEMPLATES.find((template) => template.slug === slug);
}
