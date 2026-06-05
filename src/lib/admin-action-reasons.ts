export const ADMIN_ACTION_REASONS = [
  "Violation of Terms of Service",
  "Suspicious Activity Detected",
  "Account Security Concerns",
  "Requested by User",
  "Temporary Suspension",
  "Account Verification Required",
  "Other (Custom)",
] as const;

export type AdminActionReason = (typeof ADMIN_ACTION_REASONS)[number];

export const CREATE_MODULE_VALUE = "__create_module__";
