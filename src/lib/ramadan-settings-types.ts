export const RAMADAN_NOTES_MAX_LENGTH = 1650;
/** Storage cap for HTML markup wrapping the plain-text limit. */
export const RAMADAN_NOTES_HTML_MAX_LENGTH = 12000;
export const RAMADAN_QR_MAX_SLOTS = 6;

export const DEFAULT_RAMADAN_NOTES_MESSAGE = `ISHA PRAYER TIME IS SPECIFIC TO AL-KHIDMAH, START & END OF RAMADAN SUBJECT TO THE SIGHTING OF THE MOON.

FITRANA €9 PER PERSON, YOU MAY TRANSFER (REF FITRANA 25) TO OUR BANK AC NAME: AL-KHIDMAH COMMUNITY, AC NO-19237086, NSC-933295 IBAN: IE40AIBK93329519237086 SWIFT: AIBKIE2D, IF YOU ARE PAYING YOUR ZAKAH PLEASE WRITE 'ZAKAH 25'.

YOU CAN ALSO PAY YOUR DONATIONS SECURELY USING CONTACTLESS PAYMENT AVAILABLE IN UPSTAIRS ENTRANCE / USE OUR QR CODE OR ASK A VOLUNTEER TO PAY USING YOUR BANK CARD.

"When a person dies, his deeds come to an end, except for three: ongoing charity (Sadaqah Jariyah), knowledge that is benefited from, and a righteous child who prays for him." (Sahih Muslim) May Allah accept our fasting and Ibadah. Please donate generously to the above account.`;

export type RamadanQrSlotCount = 3 | 6;

export interface RamadanSettingsData {
  notesMessage: string;
  qrSlotCount: RamadanQrSlotCount;
}

export interface RamadanDonationCategoryOption {
  id: string;
  name: string;
  donationUrl: string;
}

export interface RamadanPaymentQRItem {
  id?: string;
  category: string;
  url: string;
  qrImage?: string | null;
  order: number;
  enabled: boolean;
}

export const EMPTY_RAMADAN_SETTINGS: RamadanSettingsData = {
  notesMessage: DEFAULT_RAMADAN_NOTES_MESSAGE,
  qrSlotCount: 3,
};

export function normalizeRamadanQrSlotCount(value: unknown): RamadanQrSlotCount {
  return value === 6 ? 6 : 3;
}

export function emptyPaymentQrSlots(count: RamadanQrSlotCount): RamadanPaymentQRItem[] {
  return Array.from({ length: count }, (_, index) => ({
    category: "",
    url: "",
    qrImage: null,
    order: index,
    enabled: false,
  }));
}

export function mergePaymentQrSlots(
  saved: RamadanPaymentQRItem[],
  slotCount: RamadanQrSlotCount
): RamadanPaymentQRItem[] {
  const base = emptyPaymentQrSlots(slotCount);
  for (const item of saved) {
    if (item.order >= 0 && item.order < slotCount) {
      base[item.order] = { ...item, order: item.order };
    }
  }
  return base;
}
