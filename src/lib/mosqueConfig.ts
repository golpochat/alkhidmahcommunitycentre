/** Central mosque contact details for flyers, receipts, and print collateral. */
export const MOSQUE_INFO = {
  name: "Al Khidmah Mosque",
  address: "Unit 4, Monastery Road, Clondalkin, Dublin 22",
  phone: "+353 1 457 8900",
  email: "info@alkhidmah.ie",
  website: "https://www.alkhidmah.ie",
  tagline: "Powered by Al Khidmah Digital Donation System",
} as const;

export interface MosqueInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  tagline: string;
}
