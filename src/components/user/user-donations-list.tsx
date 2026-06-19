"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDonationCents } from "@/lib/donation-processing-fee";
import type { SerializedDonation } from "@/lib/donations";

interface UserDonationRow extends SerializedDonation {
  categoryLabel: string;
}

function statusBadgeClass(status: UserDonationRow["status"]) {
  if (status === "succeeded") return "border-emerald text-emerald";
  if (status === "failed") return "border-destructive text-destructive";
  return "border-gold text-gold";
}

export function UserDonationsList() {
  const [donations, setDonations] = useState<UserDonationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDonations() {
      setLoading(true);
      try {
        const response = await fetch("/api/user/donations");
        if (!response.ok) {
          throw new Error("Failed to load donations");
        }
        const data = await response.json();
        setDonations(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load donations",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDonations();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="user-portal-empty">
        <p className="mb-6 text-muted-foreground">
          No donations are linked to your account yet. Donations made with your
          login email will appear here automatically.
        </p>
        <ButtonLink href="/donations" className="btn-gold">
          Make a donation
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="user-portal-table-wrap">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Receipt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {donations.map((donation) => (
            <TableRow key={donation.id}>
              <TableCell>
                {format(parseISO(donation.createdAt), "d MMM yyyy")}
              </TableCell>
              <TableCell>{donation.categoryLabel}</TableCell>
              <TableCell>
                {formatDonationCents(donation.totalCents, donation.currency)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={statusBadgeClass(donation.status)}>
                  {donation.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {donation.status === "succeeded" ? (
                  <a
                    href={`/api/donations/${donation.id}/receipt`}
                    className="user-portal-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-1 inline h-4 w-4" />
                    PDF
                    <ExternalLink className="ml-1 inline h-3 w-3 opacity-60" />
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
