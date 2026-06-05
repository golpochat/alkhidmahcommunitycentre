import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { SiteLogo } from "@/components/layout/site-logo";
import { SiteSocialLinks } from "@/components/layout/site-social-links";
import { NAV_ITEMS } from "@/lib/constants";
import {
  buildMailtoHref,
  buildSiteSocialLinks,
  buildTelHref,
  getSiteContactSettings,
} from "@/lib/site-contact-settings";

export async function Footer() {
  const site = await getSiteContactSettings();
  const socialLinks = buildSiteSocialLinks(site);
  const phoneHref = buildTelHref(site.phone);
  const emailHref = buildMailtoHref(site.email);

  return (
    <footer className="footer-islamic">
      <div className="footer-main section-container">
        <div className="footer-main-grid">
          <div className="footer-brand">
            <SiteLogo variant="footer" link={false} className="footer-logo" />
            <p className="footer-brand-text">
              Prayer, education, and community services for Clondalkin and
              surrounding areas.
            </p>
          </div>

          <div>
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-link-list">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="footer-heading">Contact</h3>
            <ul className="footer-contact-list">
              <li className="footer-contact-item">
                <MapPin className="footer-contact-icon" />
                <span>{site.address}</span>
              </li>
              {site.phone && (
                <li className="footer-contact-item">
                  <Phone className="footer-contact-icon" />
                  {phoneHref ? (
                    <a href={phoneHref} className="footer-link">
                      {site.phone}
                    </a>
                  ) : (
                    <span>{site.phone}</span>
                  )}
                </li>
              )}
              {site.email && (
                <li className="footer-contact-item">
                  <Mail className="footer-contact-icon" />
                  {emailHref ? (
                    <a href={emailHref} className="footer-link">
                      {site.email}
                    </a>
                  ) : (
                    <span>{site.email}</span>
                  )}
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="footer-heading">Follow Us</h3>
            <SiteSocialLinks
              links={socialLinks}
              className="footer-social-row"
              linkClassName="footer-social-link"
            />
          </div>
        </div>
      </div>

      <div className="footer-legal">
        <div className="footer-legal-inner section-container">
          <p className="footer-legal-copy">
            &copy; {new Date().getFullYear()} {site.siteName}. All rights
            reserved.
          </p>
          {site.charityNumber && (
            <p className="footer-legal-charity">
              Registered charity: {site.charityNumber}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
