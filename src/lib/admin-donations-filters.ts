import type { Prisma } from "@prisma/client";

export interface DonationListFilters {
  status?: string | null;
  category?: string | null;
  provider?: string | null;
  from?: string | null;
  to?: string | null;
}

export function buildDonationWhere(
  filters: DonationListFilters
): Prisma.DonationWhereInput {
  const status =
    filters.status && filters.status !== "all" ? filters.status : undefined;
  const category =
    filters.category && filters.category !== "all" ? filters.category : undefined;
  const provider =
    filters.provider && filters.provider !== "all" ? filters.provider : undefined;
  const from = filters.from?.trim() || undefined;
  const to = filters.to?.trim() || undefined;

  return {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(provider ? { provider } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59.999`) } : {}),
          },
        }
      : {}),
  };
}

export function filtersFromSearchParams(
  searchParams: URLSearchParams
): DonationListFilters {
  return {
    status: searchParams.get("status"),
    category: searchParams.get("category"),
    provider: searchParams.get("provider"),
    from: searchParams.get("from"),
    to: searchParams.get("to"),
  };
}

export function todayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const DONATION_PAGE_SIZE_OPTIONS = [10, 15, 25, 50] as const;
export const DEFAULT_DONATION_PAGE_SIZE = 15;

export interface DonationListPagination {
  page: number;
  pageSize: number;
}

export function parseDonationPagination(
  searchParams: URLSearchParams
): DonationListPagination {
  const rawPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const rawPageSize = Number.parseInt(
    searchParams.get("pageSize") ?? String(DEFAULT_DONATION_PAGE_SIZE),
    10
  );

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize = DONATION_PAGE_SIZE_OPTIONS.includes(
    rawPageSize as (typeof DONATION_PAGE_SIZE_OPTIONS)[number]
  )
    ? rawPageSize
    : DEFAULT_DONATION_PAGE_SIZE;

  return { page, pageSize };
}
