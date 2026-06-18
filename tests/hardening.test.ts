import { describe, expect, it } from "vitest";
import { isValidCronRequest } from "@/lib/cron-auth";
import { calculateDonationFeeBreakdown, getDonationNetCents } from "@/lib/donation-processing-fee";
import { resolveDonationAccounting } from "@/lib/donation-accounting";
import { ALL_PERMISSION_KEYS } from "@/lib/permission-keys";
import {
  permissionsEqual,
  sessionAuthorizationChanged,
} from "@/lib/session-sync";
import { AccountTier } from "@/lib/account-tier";
import {
  hasDailyPrayerConfigData,
} from "@/lib/prayer-times-pure";

describe("isValidCronRequest", () => {
  it("accepts a matching bearer token", () => {
    expect(isValidCronRequest("Bearer secret-token", "secret-token")).toBe(true);
  });

  it("rejects missing or invalid tokens", () => {
    expect(isValidCronRequest("Bearer wrong", "secret-token")).toBe(false);
    expect(isValidCronRequest(null, "secret-token")).toBe(false);
    expect(isValidCronRequest("Bearer secret", undefined)).toBe(false);
  });
});

describe("calculateDonationFeeBreakdown", () => {
  it("grosses up the charge when the donor covers fees", () => {
    const result = calculateDonationFeeBreakdown(
      100,
      { feePercent: 1.4, feeFixedCents: 25, allowCoverFee: true },
      true,
    );

    expect(result.baseAmountCents).toBe(10000);
    expect(result.coverFee).toBe(true);
    expect(result.totalCents).toBeGreaterThan(10000);
    expect(result.processingFeeCents).toBe(result.totalCents - 10000);
  });

  it("calculates the gateway fee when the donor does not cover fees", () => {
    const result = calculateDonationFeeBreakdown(
      50,
      { feePercent: 2.9, feeFixedCents: 35, allowCoverFee: true },
      false,
    );

    expect(result.totalCents).toBe(5000);
    expect(result.processingFeeCents).toBe(180);
    expect(result.coverFee).toBe(false);
  });
});

describe("resolveDonationAccounting", () => {
  it("estimates fees for legacy donations without stored fee amounts", () => {
    const accounting = resolveDonationAccounting(
      {
        amount: 50,
        processingFeeCents: 0,
        coverFee: false,
        provider: "stripe",
        status: "succeeded",
      },
      {
        stripe: { feePercent: 1.4, feeFixedCents: 25, allowCoverFee: true },
      },
    );

    expect(accounting.processingFeeCents).toBe(95);
    expect(accounting.netReceivedCents).toBe(4905);
    expect(accounting.feeEstimated).toBe(true);
  });

  it("treats covered fees as paid on top of the gift", () => {
    const accounting = resolveDonationAccounting(
      {
        amount: 100,
        processingFeeCents: 167,
        coverFee: true,
        provider: "stripe",
        status: "succeeded",
      },
      {},
    );

    expect(accounting.totalChargedCents).toBe(10167);
    expect(accounting.netReceivedCents).toBe(10000);
    expect(accounting.feeEstimated).toBe(false);
  });
});

describe("formatExportTransactionId", () => {
  it("masks sample PayPal IDs and empty provider IDs", async () => {
    const { formatExportTransactionId } = await import(
      "@/lib/donation-statement-format"
    );

    expect(
      formatExportTransactionId("paypal", "sample-export-test-038"),
    ).toBe("not recorded");
    expect(formatExportTransactionId("paypal", null)).toBe("not recorded");
    expect(formatExportTransactionId("stripe", "pi_abc123")).toBe("pi_abc123");
    expect(formatExportTransactionId("stripe", null)).toBe("—");
  });
});

describe("getDonationNetCents", () => {
  it("deducts fees when the donor does not cover them", () => {
    expect(
      getDonationNetCents({
        amount: 50,
        processingFeeCents: 180,
        coverFee: false,
      }),
    ).toBe(4820);
  });
});

describe("session authorization sync", () => {
  const baseSession = {
    roleId: "role-1",
    roleSlug: "editor",
    tier: AccountTier.STAFF,
    permissions: ["events.manage", "content.write"],
  };

  it("detects permission changes", () => {
    expect(
      sessionAuthorizationChanged(baseSession, {
        ...baseSession,
        permissions: ["events.manage", "display.manage"],
      }),
    ).toBe(true);
  });

  it("ignores permission order differences", () => {
    expect(
      permissionsEqual(["b.perm", "a.perm"], ["a.perm", "b.perm"]),
    ).toBe(true);
    expect(sessionAuthorizationChanged(baseSession, baseSession)).toBe(false);
  });

  it("detects role and tier changes", () => {
    expect(
      sessionAuthorizationChanged(baseSession, {
        ...baseSession,
        roleSlug: "web-admin",
      }),
    ).toBe(true);
  });
});

describe("permission keys", () => {
  it("includes dedicated permissions for standalone admin features", () => {
    expect(ALL_PERMISSION_KEYS).toContain("contact.manage");
    expect(ALL_PERMISSION_KEYS).toContain("content.audit");
    expect(ALL_PERMISSION_KEYS).toContain("display.manage");
    expect(ALL_PERMISSION_KEYS).toContain("about.manage");
    expect(ALL_PERMISSION_KEYS.length).toBe(16);
  });
});

describe("daily prayer config", () => {
  it("detects saved mosque prayer rules in JSON config", () => {
    expect(
      hasDailyPrayerConfigData({
        dailyIqamaConfig: {
          dhuhr: { mode: "interval", intervalText: "20" },
          isha: { mode: "follows_magrib" },
        },
      }),
    ).toBe(true);
  });

  it("ignores jumuah-only rows for daily prayer config", () => {
    expect(
      hasDailyPrayerConfigData({
        jumuah: [{ index: 1, adhan: "13:00", iqama: "13:30" }],
      } as Parameters<typeof hasDailyPrayerConfigData>[0]),
    ).toBe(false);
  });
});
