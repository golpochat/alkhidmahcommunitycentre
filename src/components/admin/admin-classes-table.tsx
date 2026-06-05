"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SerializedClass } from "@/lib/classes";
import { ADMIN_EDUCATION_PATH, EDUCATION_API_PATH, EDUCATION_NAV_LABEL } from "@/lib/constants";

interface AdminClassesTableProps {
  classes: SerializedClass[];
  canDelete: boolean;
}

export function AdminClassesTable({ classes, canDelete }: AdminClassesTableProps) {
  const [publishedById, setPublishedById] = useState<Record<string, boolean>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setPublishedById(
      Object.fromEntries(classes.map((classItem) => [classItem.id, classItem.published])),
    );
  }, [classes]);

  async function handleDelete(id: string, title: string) {
    if (!canDelete) {
      toast.error(`You do not have permission to delete ${EDUCATION_NAV_LABEL.toLowerCase()} programmes`);
      return;
    }

    if (!confirm(`Delete "${title}"? This will also remove all registrations.`)) return;

    const response = await fetch(`${EDUCATION_API_PATH}/${id}`, { method: "DELETE" });

    if (response.ok) {
      toast.success("Programme deleted");
      window.location.reload();
    } else {
      const data = await response.json();
      toast.error(data.error || "Failed to delete programme");
    }
  }

  async function handlePublishedChange(id: string, published: boolean) {
    const previous = publishedById[id] ?? false;
    setPublishedById((current) => ({ ...current, [id]: published }));
    setUpdatingId(id);

    try {
      const response = await fetch(`${EDUCATION_API_PATH}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update programme status");
      }

      toast.success(published ? "Programme published" : "Programme unpublished");
    } catch (error) {
      setPublishedById((current) => ({ ...current, [id]: previous }));
      toast.error(
        error instanceof Error ? error.message : "Failed to update programme status",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Manage {EDUCATION_NAV_LABEL}</h1>
          <p className="mt-2 text-muted-foreground">
            Create, edit, and manage Qur&apos;an and Islamic education programmes.
          </p>
        </div>
        <ButtonLink href={`${ADMIN_EDUCATION_PATH}/new`} className="btn-gold">
          <Plus className="mr-2 h-4 w-4" />
          New Programme
        </ButtonLink>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No programmes yet. Create your first programme.
                </TableCell>
              </TableRow>
            ) : (
              classes.map((classItem) => {
                const published = publishedById[classItem.id] ?? classItem.published;

                return (
                  <TableRow key={classItem.id}>
                    <TableCell className="font-medium">{classItem.title}</TableCell>
                    <TableCell>{classItem.teacher || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={published}
                          disabled={updatingId === classItem.id}
                          className="role-status-switch"
                          onCheckedChange={(checked) =>
                            handlePublishedChange(classItem.id, Boolean(checked))
                          }
                          aria-label={`${classItem.title} ${published ? "published" : "unpublished"}`}
                        />
                        <span
                          className={
                            published
                              ? "text-sm text-emerald"
                              : "text-sm text-muted-foreground"
                          }
                        >
                          {published ? "Published" : "Unpublished"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`${ADMIN_EDUCATION_PATH}/${classItem.id}/edit`}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-gold transition-colors hover:bg-muted"
                          aria-label={`Edit ${classItem.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(classItem.id, classItem.title)}
                            aria-label={`Delete ${classItem.title}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
