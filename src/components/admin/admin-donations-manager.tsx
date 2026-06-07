"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminDonationCategoriesTab } from "@/components/admin/admin-donation-categories-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_DONATION_PAGE_SIZE,
  DONATION_PAGE_SIZE_OPTIONS,
  todayDateInputValue,
} from "@/lib/admin-donations-filters";
import type { DonationExportFormat } from "@/lib/admin-donations-export";
import { DONATION_PROVIDERS, DONATION_STATUSES, getCategoryLabel } from "@/lib/donations";
import type { SerializedDonation, SerializedDonationCategory } from "@/lib/donations";

const EXPORT_EXTENSIONS: Record<DonationExportFormat, string> = {
  csv: "csv",
  xlsx: "xlsx",
  pdf: "pdf",
};

interface DonationsListResponse {
  items: SerializedDonation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function AdminDonationsManager() {
  const [donations, setDonations] = useState<SerializedDonation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_DONATION_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<DonationExportFormat | null>(null);
  const [category, setCategory] = useState("all");
  const [provider, setProvider] = useState("all");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState(todayDateInputValue);
  const [to, setTo] = useState(todayDateInputValue);
  const [categoryOptions, setCategoryOptions] = useState<SerializedDonationCategory[]>([]);

  useEffect(() => {
    async function loadCategoryOptions() {
      try {
        const response = await fetch("/api/admin/donation-categories");
        if (response.ok) {
          const data = await response.json();
          setCategoryOptions(Array.isArray(data) ? data : []);
        }
      } catch {
        // filter falls back to empty list
      }
    }

    loadCategoryOptions();
  }, []);

  const filterQueryString = useMemo(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (provider !== "all") params.set("provider", provider);
    if (status !== "all") params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString();
  }, [category, provider, status, from, to]);

  useEffect(() => {
    setPage(1);
  }, [filterQueryString]);

  useEffect(() => {
    async function fetchDonations() {
      setLoading(true);
      try {
        const params = new URLSearchParams(filterQueryString);
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));

        const response = await fetch(`/api/admin/donations?${params.toString()}`);
        if (response.ok) {
          const data = (await response.json()) as DonationsListResponse;
          setDonations(Array.isArray(data.items) ? data.items : []);
          setTotal(typeof data.total === "number" ? data.total : 0);
          setTotalPages(typeof data.totalPages === "number" ? data.totalPages : 0);
        } else {
          setDonations([]);
          setTotal(0);
          setTotalPages(0);
        }
      } catch {
        setDonations([]);
        setTotal(0);
        setTotalPages(0);
        toast.error("Failed to load donations");
      } finally {
        setLoading(false);
      }
    }

    fetchDonations();
  }, [filterQueryString, page, pageSize]);

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * pageSize, total);

  function handlePageSizeChange(value: string | null) {
    if (!value) return;
    setPageSize(Number(value));
    setPage(1);
  }

  async function handleExport(exportFormat: DonationExportFormat) {
    setExporting(exportFormat);
    try {
      const params = new URLSearchParams(filterQueryString);
      params.set("format", exportFormat);

      const response = await fetch(`/api/admin/donations?${params.toString()}`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const range =
        from && to ? `${from}-to-${to}` : format(new Date(), "yyyy-MM-dd");
      link.download = `donations-statement-${range}.${EXPORT_EXTENSIONS[exportFormat]}`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Statement downloaded (${exportFormat.toUpperCase()})`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to export statement"
      );
    } finally {
      setExporting(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold">Donations</h1>
        <p className="mt-2 text-muted-foreground">
          Review donation activity and manage public donation categories.
        </p>
      </div>

      <Tabs defaultValue="transactions" className="admin-prayer-times-tabs">
        <TabsList variant="line" className="admin-prayer-times-tabs-list">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="admin-prayer-times-tab-content">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-end">
        <div className="admin-donations-export-actions">
          <Button
            type="button"
            variant="outline"
            className="border-gold text-gold"
            disabled={Boolean(exporting)}
            onClick={() => handleExport("pdf")}
          >
            {exporting === "pdf" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-gold text-gold"
            disabled={Boolean(exporting)}
            onClick={() => handleExport("xlsx")}
          >
            {exporting === "xlsx" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-gold text-gold"
            disabled={Boolean(exporting)}
            onClick={() => handleExport("csv")}
          >
            {exporting === "csv" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            CSV
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value ?? "all")}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categoryOptions.map((item) => (
                  <SelectItem key={item.id} value={item.slug}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={(value) => setProvider(value ?? "all")}>
              <SelectTrigger>
                <SelectValue placeholder="All providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {DONATION_PROVIDERS.map((item) => (
                  <SelectItem key={item} value={item} className="capitalize">
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {DONATION_STATUSES.map((item) => (
                  <SelectItem key={item} value={item} className="capitalize">
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            Donation Log ({total})
          </CardTitle>
          {from && to && (
            <p className="text-sm text-muted-foreground">
              Showing donations from {format(parseISO(`${from}T12:00:00`), "d MMM yyyy")}{" "}
              to {format(parseISO(`${to}T12:00:00`), "d MMM yyyy")}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : donations.length === 0 ? (
            <p className="text-muted-foreground">
              No donations found for the selected date range and filters.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Gift</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>
                        <p className="font-medium">
                          {donation.donorName || "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {donation.donorEmail || "No email"}
                        </p>
                      </TableCell>
                      <TableCell className="font-medium text-gold">
                        €{donation.amount}
                      </TableCell>
                      <TableCell className="text-sm">
                        {donation.processingFeeCents > 0 ? (
                          <>
                            €{(donation.processingFeeCents / 100).toFixed(2)}
                            <span className="block text-xs text-muted-foreground">
                              {donation.coverFee ? "Covered" : "Deducted"}
                              {donation.feeEstimated ? " · est." : ""}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        €{(donation.netCents / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getCategoryLabel(donation.category, categoryOptions)}
                      </TableCell>
                      <TableCell className="capitalize">{donation.provider}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            donation.status === "succeeded"
                              ? "default"
                              : donation.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                          className="capitalize"
                        >
                          {donation.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(parseISO(donation.createdAt), "d MMM yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {total > 0 && (
                <div className="admin-donations-pagination">
                  <p className="admin-donations-pagination-summary">
                    Showing {rangeStart}–{rangeEnd} of {total}
                  </p>
                  <div className="admin-donations-pagination-controls">
                    <div className="admin-donations-pagination-size">
                      <Label htmlFor="page-size">Rows per page</Label>
                      <Select
                        value={String(pageSize)}
                        onValueChange={handlePageSizeChange}
                      >
                        <SelectTrigger id="page-size" className="admin-donations-page-size-trigger">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DONATION_PAGE_SIZE_OPTIONS.map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {totalPages > 1 && (
                      <div className="admin-donations-pagination-nav">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((current) => Math.max(1, current - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="admin-donations-pagination-page">
                          Page {page} of {totalPages}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() =>
                            setPage((current) => Math.min(totalPages, current + 1))
                          }
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="categories" className="admin-prayer-times-tab-content">
          <AdminDonationCategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
