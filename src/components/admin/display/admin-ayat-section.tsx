"use client";

import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminDisplaySectionSwitch } from "@/components/admin/display/admin-display-section-switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AyahItem {
  id: string;
  arabic: string;
  english: string;
  source: string;
  includeInRotation: boolean;
  createdAt: string;
}

export const emptyAyahForm = {
  arabic: "",
  english: "",
  source: "",
};

const AYAT_PAGE_SIZES = [10, 25, 50] as const;

interface AdminAyatSectionProps {
  ayat: AyahItem[];
  sectionEnabled: boolean;
  savingSection?: boolean;
  onToggleSection: (enabled: boolean) => void;
  onCreate: () => void;
  onEdit: (item: AyahItem) => void;
  onDelete: (id: string) => void;
  onToggleRotation: (item: AyahItem, includeInRotation: boolean) => void;
}

export function AdminAyatSection({
  ayat,
  sectionEnabled,
  savingSection,
  onToggleSection,
  onCreate,
  onEdit,
  onDelete,
  onToggleRotation,
}: AdminAyatSectionProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(AYAT_PAGE_SIZES[0]);

  const total = ayat.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const paginatedAyat = useMemo(() => {
    const start = (page - 1) * pageSize;
    return ayat.slice(start, start + pageSize);
  }, [ayat, page, pageSize]);

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * pageSize, total);

  function handlePageSizeChange(value: string | null) {
    if (!value) {
      return;
    }
    setPageSize(Number(value));
    setPage(1);
  }

  return (
    <section className="admin-messages-panel admin-display-ayat-section">
      <header className="admin-messages-panel-header admin-messages-panel-header-row">
        <div>
          <h2 className="admin-messages-panel-title">Ayat &amp; Hadith</h2>
          <p className="admin-messages-panel-description">
            General rotation content. Shown with announcements when no priority
            messages are active.
          </p>
        </div>
        <div className="admin-display-ayat-section-actions">
          <AdminDisplaySectionSwitch
            label="Ayat section"
            checked={sectionEnabled}
            disabled={savingSection}
            onCheckedChange={onToggleSection}
          />
          <Button className="btn-gold" onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Ayat / Hadith
          </Button>
        </div>
      </header>

      <div className="admin-messages-table-wrap">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Arabic</TableHead>
              <TableHead className="admin-table-col-hide-md">English</TableHead>
              <TableHead className="admin-table-col-hide-lg">Source</TableHead>
              <TableHead>On TV</TableHead>
              <TableHead className="admin-table-col-actions">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {total === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="admin-table-empty">
                  No entries yet. Click &quot;Add Ayat / Hadith&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              paginatedAyat.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="admin-table-title-cell admin-ayat-arabic-cell" dir="rtl">
                    <span className="admin-ayat-preview-text" title={item.arabic}>
                      {item.arabic}
                    </span>
                  </TableCell>
                  <TableCell className="admin-table-col-hide-md admin-ayat-english-cell">
                    <span className="admin-ayat-preview-text" title={item.english}>
                      {item.english}
                    </span>
                  </TableCell>
                  <TableCell className="admin-table-col-hide-lg text-muted-foreground">
                    {item.source}
                  </TableCell>
                  <TableCell className="admin-messages-table-rotation">
                    <div className="admin-messages-rotation-control">
                      <Switch
                        className="admin-messages-rotation-switch"
                        checked={item.includeInRotation}
                        onCheckedChange={(checked) =>
                          onToggleRotation(item, Boolean(checked))
                        }
                        aria-label={`Show ${item.source} on TV`}
                      />
                      <span
                        className={
                          item.includeInRotation
                            ? "admin-messages-rotation-label admin-messages-rotation-label-on"
                            : "admin-messages-rotation-label"
                        }
                      >
                        {item.includeInRotation ? "On" : "Off"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="admin-table-col-actions">
                    <div className="admin-table-action-group">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => onDelete(item.id)}
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 ? (
        <div className="admin-donations-pagination">
          <p className="admin-donations-pagination-summary">
            Showing {rangeStart}–{rangeEnd} of {total}
          </p>
          <div className="admin-donations-pagination-controls">
            <div className="admin-donations-pagination-size">
              <Label htmlFor="ayat-page-size">Rows per page</Label>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger
                  id="ayat-page-size"
                  className="admin-donations-page-size-trigger"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AYAT_PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {totalPages > 1 ? (
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
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
