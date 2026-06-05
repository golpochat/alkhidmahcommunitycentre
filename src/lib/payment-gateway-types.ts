export interface BankTransferDetails {
  id: string;
  currency: string;
  accountName: string;
  bankName: string;
  iban: string;
  bic: string;
  referenceNote: string;
}
