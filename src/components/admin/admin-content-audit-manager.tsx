"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SerializedContentAuditLog } from "@/lib/content-audit-log";

function formatEntityType(value: string) {
  return value.replace(/_/g, " ");
}

export function AdminContentAuditManager() {
  const [logs, setLogs] = useState<SerializedContentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/content-audit");
        if (!response.ok) {
          throw new Error("Failed to load audit log");
        }
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load audit log");
      } finally {
        setLoading(false);
      }
    }

    void loadLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 font-heading text-3xl font-semibold">Content Audit Log</h1>
      <p className="mb-6 text-muted-foreground">
        Publish and unpublish actions across events, programmes, gallery, and donation
        categories.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No publish actions recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(parseISO(log.createdAt), "d MMM yyyy HH:mm")}</TableCell>
                  <TableCell>{log.action === "PUBLISH" ? "Published" : "Unpublished"}</TableCell>
                  <TableCell className="capitalize">{formatEntityType(log.entityType)}</TableCell>
                  <TableCell>{log.entityTitle}</TableCell>
                  <TableCell>{log.actorEmail || "System"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
