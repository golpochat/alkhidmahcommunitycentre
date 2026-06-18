export type EventCategory =
  | "community"
  | "youth"
  | "sisters"
  | "ramadan";

export interface MosqueEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: EventCategory | string | null;
  startAt: string;
  endAt: string | null;
  location: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryImage {
  id: string;
  title: string | null;
  category: string | null;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface DonationRecord {
  id: string;
  donorName: string | null;
  donorEmail: string | null;
  amount: number;
  currency: string;
  category: string;
  provider: "stripe" | "paypal";
  status: "pending" | "succeeded" | "failed";
  providerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DonationCategory =
  | "zakah"
  | "sadaqah"
  | "fitrah"
  | "mosque-development"
  | "ramadan"
  | "dawah";

import type { DailyIqamaConfig } from "@/lib/prayer-iqama";
import type { DailyAdhanConfig } from "@/lib/prayer-adhan";

export interface MosquePrayerConfigRecord {
  id: string;
  adhanConfig: DailyAdhanConfig;
  iqamaConfig: DailyIqamaConfig;
  eidType: "FITR" | "ADHA" | null;
  eidDate: string | null;
  eidPrayers: Array<{ index: number; time: string }>;
  jumuah: Array<{
    id?: string;
    index: number;
    adhan: string | null;
    iqama: string | null;
  }>;
}

/** @deprecated Use MosquePrayerConfigRecord */
export type PrayerTimesOverrideRecord = MosquePrayerConfigRecord;

export type {
  PrayerSlot,
  JumuahSlot,
  EidSlot,
  EidInfo,
  NextPrayer,
  PrayerTimesResponse,
  EidType,
} from "@/lib/prayer-times-pure";

export interface ClassRegistration {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
  classId: string;
  classTitle?: string;
  createdAt: string;
}

export interface MosqueClass {
  id: string;
  title: string;
  slug: string;
  description: string;
  ageGroup: string | null;
  schedule: string | null;
  fee: number | null;
  teacher: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  published: boolean;
}

export type EducationTeacher = CommitteeMember;

export interface AdminUser {
  email: string;
  passwordHash: string;
}

export interface AlAdhanTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface AlAdhanResponse {
  data: {
    timings: AlAdhanTimings;
    date: {
      readable: string;
      gregorian: {
        date: string;
        format: string;
        day: string;
        weekday: { en: string };
        month: { number: number; en: string };
        year: string;
      };
      hijri: {
        date: string;
        day: string;
        month: { en: string; ar: string };
        year: string;
      };
    };
  };
}
