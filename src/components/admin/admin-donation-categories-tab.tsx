"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { SerializedDonationCategory } from "@/lib/donations";

export function AdminDonationCategoriesTab() {
  const [categories, setCategories] = useState<SerializedDonationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishedById, setPublishedById] = useState<Record<string, boolean>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SerializedDonationCategory | null>(
    null
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setPublishedById(
      Object.fromEntries(categories.map((category) => [category.id, category.isActive])),
    );
  }, [categories]);

  async function loadCategories() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/donation-categories");
      if (!response.ok) {
        throw new Error("Failed to load donation categories");
      }

      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load donation categories",
      );
    } finally {
      setLoading(false);
    }
  }

  function openEditDialog(category: SerializedDonationCategory) {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description ?? "");
    setDialogOpen(true);
  }

  async function handleSaveCategory(event: React.FormEvent) {
    event.preventDefault();

    if (!editingCategory) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/donation-categories/${editingCategory.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update category");
      }

      toast.success("Category updated");
      setDialogOpen(false);
      await loadCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update category");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishedChange(id: string, published: boolean) {
    const previous = publishedById[id] ?? false;
    setPublishedById((current) => ({ ...current, [id]: published }));
    setUpdatingId(id);

    try {
      const response = await fetch(`/api/admin/donation-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update category status");
      }

      toast.success(published ? "Category published" : "Category unpublished");
      setCategories((current) =>
        current.map((category) =>
          category.id === id ? { ...category, isActive: published } : category
        )
      );
    } catch (error) {
      setPublishedById((current) => ({ ...current, [id]: previous }));
      toast.error(
        error instanceof Error ? error.message : "Failed to update category status",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-xl font-semibold">Donation Categories</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage the donation cards shown on the public donations page. Unpublished
          categories are hidden from visitors but remain available in donation history.
        </p>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                  No donation categories found.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => {
                const published = publishedById[category.id] ?? category.isActive;

                return (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={published}
                          disabled={updatingId === category.id}
                          className="role-status-switch"
                          onCheckedChange={(checked) =>
                            handlePublishedChange(category.id, Boolean(checked))
                          }
                          aria-label={`${category.name} ${published ? "published" : "unpublished"}`}
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(category)}
                        aria-label={`Edit ${category.name}`}
                      >
                        <Pencil className="h-4 w-4 text-gold" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSaveCategory}>
            <DialogHeader>
              <DialogTitle className="font-heading">Edit Category</DialogTitle>
              <DialogDescription>
                Update the title and description shown on the donations page.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Name</Label>
                <Input
                  id="category-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-description">Description</Label>
                <Textarea
                  id="category-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  minLength={10}
                  maxLength={500}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="btn-gold" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
