import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, canManageDonations } from "@/lib/auth";
import { serializeDonation } from "@/lib/donations";
import {
  buildDonationWhere,
  filtersFromSearchParams,
  parseDonationPagination,
} from "@/lib/admin-donations-filters";
import {
  donationsToCsv,
  donationsToPdfBuffer,
  donationsToXlsxBuffer,
  exportContentType,
  exportFilename,
  mapDonationsToExportRows,
  type DonationExportFormat,
} from "@/lib/admin-donations-export";
import {
  getDonationStatementBranding,
  loadStatementLogoPng,
} from "@/lib/donation-statement-branding";
import { loadDonationProviderFeeConfigs } from "@/lib/donation-accounting-server";

export const runtime = "nodejs";

function parseExportFormat(value: string | null): DonationExportFormat | null {
  if (value === "csv" || value === "xlsx" || value === "pdf") {
    return value;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!canManageDonations(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters = filtersFromSearchParams(searchParams);
    const { page, pageSize } = parseDonationPagination(searchParams);
    const where = buildDonationWhere(filters);

    const feeConfigs = await loadDonationProviderFeeConfigs();

    const [total, donations] = await Promise.all([
      db.donation.count({ where }),
      db.donation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return NextResponse.json({
      items: donations.map((donation) => serializeDonation(donation, feeConfigs)),
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!canManageDonations(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = parseExportFormat(searchParams.get("format")) ?? "csv";
    const filters = filtersFromSearchParams(searchParams);

    const [feeConfigs, categories, donations] = await Promise.all([
      loadDonationProviderFeeConfigs(),
      db.donationCategory.findMany({
        select: { slug: true, name: true },
        orderBy: { sortOrder: "asc" },
      }),
      db.donation.findMany({
        where: buildDonationWhere(filters),
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const rows = mapDonationsToExportRows(donations, feeConfigs, categories);
    const filename = exportFilename(format, filters.from, filters.to);

    if (format === "xlsx") {
      const buffer = donationsToXlsxBuffer(rows);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": exportContentType(format),
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (format === "pdf") {
      const branding = await getDonationStatementBranding();
      const logoPng = await loadStatementLogoPng(branding.logoPath);
      const buffer = await donationsToPdfBuffer(rows, {
        from: filters.from,
        to: filters.to,
        branding,
        logoPng,
        donations,
        feeConfigs,
      });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": exportContentType(format),
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const csv = donationsToCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": exportContentType("csv"),
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Donation export failed:", error);
    const message =
      error instanceof Error ? error.message : "Export failed";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

