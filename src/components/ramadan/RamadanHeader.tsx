"use client";

import Image from "next/image";
import {
  formatRamadanArabicSubtitle,
  formatRamadanTimetableTitle,
} from "@/lib/ramadan-format";
import { CONTACT, LOGO_PATH, SITE_URL } from "@/lib/constants";

interface RamadanHeaderProps {
  year: number;
  startDate: string;
  endDate: string;
  hijriYear?: number | null;
  logoUrl?: string;
}

export function RamadanHeader({
  year,
  hijriYear,
  logoUrl = LOGO_PATH,
}: RamadanHeaderProps) {
  return (
    <header className="ramadan-header">
      <div className="ramadan-header-logo-wrap">
        <Image
          src={logoUrl}
          alt="Al Khidmah logo"
          width={40}
          height={40}
          className="ramadan-header-logo"
        />
      </div>
      <div className="ramadan-header-contact">
        <p>{CONTACT.address}</p>
        <p>
          {CONTACT.phone} · {CONTACT.email}
        </p>
        <p>{SITE_URL.replace(/^https?:\/\//, "")}</p>
      </div>
      <div className="ramadan-header-copy">
        <h2 className="ramadan-header-title">{formatRamadanTimetableTitle(year)}</h2>
        <p className="ramadan-header-arabic">{formatRamadanArabicSubtitle(hijriYear)}</p>
      </div>
      <div className="ramadan-header-divider" />
    </header>
  );
}

export { RamadanHeader as RamadanTimetableHeader };
