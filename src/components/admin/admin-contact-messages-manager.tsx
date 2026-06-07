"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Download, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { SerializedContactMessage } from "@/lib/contact-messages";

type StatusFilter = "all" | "pending" | "handled";

export function AdminContactMessagesManager() {
  const [messages, setMessages] = useState<SerializedContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [selected, setSelected] = useState<SerializedContactMessage | null>(
    null,
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    if (statusFilter === "all") return "";
    return `?status=${statusFilter}`;
  }, [statusFilter]);

  useEffect(() => {
    async function loadMessages() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/contact-messages${queryString}`,
        );
        if (!response.ok) {
          throw new Error("Failed to load contact messages");
        }
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load messages",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadMessages();
  }, [queryString]);

  async function handleExport() {
    const response = await fetch(
      `/api/admin/contact-messages${queryString}`,
      { method: "POST" },
    );
    if (!response.ok) {
      toast.error("Export failed");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "contact-messages.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  }

  async function updateStatus(
    message: SerializedContactMessage,
    status: "pending" | "handled",
  ) {
    setUpdatingId(message.id);
    try {
      const response = await fetch(`/api/admin/contact-messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Update failed");
      }

      setMessages((current) =>
        current
          .map((item) => (item.id === message.id ? data : item))
          .filter((item) => {
            if (statusFilter === "all") return true;
            return item.status === statusFilter;
          }),
      );

      if (selected?.id === message.id) {
        setSelected(data);
      }

      toast.success(
        status === "handled" ? "Message marked as handled" : "Message reopened",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  const pendingCount = messages.filter((item) => item.status === "pending").length;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Contact Messages</h1>
          <p className="mt-2 text-muted-foreground">
            Read inbound contact form messages, mark them handled, and export records.
          </p>
        </div>
        <Button
          onClick={() => void handleExport()}
          variant="outline"
          className="border-gold text-gold"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 font-heading text-lg">
            <Mail className="h-5 w-5 text-gold" />
            Inbox
            {statusFilter !== "handled" && pendingCount > 0 ? (
              <span className="admin-contact-pending-badge">{pendingCount} pending</span>
            ) : null}
          </CardTitle>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              if (value) setStatusFilter(value as StatusFilter);
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All messages</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="handled">Handled</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No contact messages found for this filter.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div className="font-medium">{message.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {message.email}
                      </div>
                    </TableCell>
                    <TableCell>{message.subject}</TableCell>
                    <TableCell>
                      <span
                        className={
                          message.status === "handled"
                            ? "admin-contact-status-handled"
                            : "admin-contact-status-pending"
                        }
                      >
                        {message.status === "handled" ? "Handled" : "Pending"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(parseISO(message.createdAt), "d MMM yyyy, HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected(message)}
                        >
                          View
                        </Button>
                        {message.status === "pending" ? (
                          <Button
                            type="button"
                            size="sm"
                            className="btn-gold"
                            disabled={updatingId === message.id}
                            onClick={() => void updateStatus(message, "handled")}
                          >
                            {updatingId === message.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                Mark handled
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={updatingId === message.id}
                            onClick={() => void updateStatus(message, "pending")}
                          >
                            Reopen
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={selected != null} onOpenChange={() => setSelected(null)}>
        <DialogContent className="admin-contact-message-dialog">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading">{selected.subject}</DialogTitle>
              </DialogHeader>
              <dl className="admin-contact-message-meta">
                <div>
                  <dt>Name</dt>
                  <dd>{selected.name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{selected.email}</dd>
                </div>
                <div>
                  <dt>Received</dt>
                  <dd>
                    {format(parseISO(selected.createdAt), "d MMMM yyyy 'at' HH:mm")}
                  </dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{selected.status === "handled" ? "Handled" : "Pending"}</dd>
                </div>
              </dl>
              <div className="admin-contact-message-body">{selected.message}</div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
