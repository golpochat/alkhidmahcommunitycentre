"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Switch } from "@/components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SerializedGalleryAlbum } from "@/lib/gallery";

export function AdminGalleryManager() {
  const [albums, setAlbums] = useState<SerializedGalleryAlbum[]>([]);
  const [canDelete, setCanDelete] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<SerializedGalleryAlbum | null>(null);
  const [albumName, setAlbumName] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishedById, setPublishedById] = useState<Record<string, boolean>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setPublishedById(
      Object.fromEntries(albums.map((album) => [album.id, album.published])),
    );
  }, [albums]);

  useEffect(() => {
    loadAlbums();
  }, []);

  async function loadAlbums() {
    setLoading(true);
    try {
      const [albumsResponse, sessionResponse] = await Promise.all([
        fetch("/api/gallery/albums"),
        fetch("/api/auth/session"),
      ]);

      if (albumsResponse.ok) {
        const data = await albumsResponse.json();
        setAlbums(Array.isArray(data) ? data : []);
      }

      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        setCanDelete(Boolean(session.canDeleteGallery));
        setCanManage(Boolean(session.canManageGallery));
      }
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingAlbum(null);
    setAlbumName("");
    setDialogOpen(true);
  }

  function openEditDialog(album: SerializedGalleryAlbum) {
    setEditingAlbum(album);
    setAlbumName(album.name);
    setDialogOpen(true);
  }

  async function handleSaveAlbum(event: React.FormEvent) {
    event.preventDefault();

    const trimmed = albumName.trim();
    if (trimmed.length < 2) {
      toast.error("Album name must be at least 2 characters");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        editingAlbum
          ? `/api/gallery/albums/${editingAlbum.id}`
          : "/api/gallery/albums",
        {
          method: editingAlbum ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save album");
      }

      toast.success(editingAlbum ? "Album updated" : "Album created");
      setDialogOpen(false);
      await loadAlbums();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save album");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishedChange(id: string, published: boolean) {
    const previous = publishedById[id] ?? false;
    setPublishedById((current) => ({ ...current, [id]: published }));
    setUpdatingId(id);

    try {
      const response = await fetch(`/api/gallery/albums/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update album status");
      }

      toast.success(published ? "Album published" : "Album unpublished");
    } catch (error) {
      setPublishedById((current) => ({ ...current, [id]: previous }));
      toast.error(
        error instanceof Error ? error.message : "Failed to update album status",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteAlbum(album: SerializedGalleryAlbum) {
    if (!canDelete) {
      toast.error("You do not have permission to delete albums");
      return;
    }

    const photoLabel =
      album.photoCount === 1 ? "1 photo" : `${album.photoCount} photos`;

    if (
      !confirm(
        `Delete album "${album.name}" and all ${photoLabel}? This cannot be undone.`
      )
    ) {
      return;
    }

    const response = await fetch(`/api/gallery/albums/${album.id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok) {
      toast.success(
        data.message ||
          `Album "${album.name}" deleted along with ${album.photoCount} photo${
            album.photoCount === 1 ? "" : "s"
          }`
      );
      setAlbums((current) => current.filter((item) => item.id !== album.id));
    } else {
      toast.error(data.error || "Failed to delete album");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Manage Gallery</h1>
          <p className="mt-2 text-muted-foreground">
            Organise photos into albums. Upload images inside each album.
          </p>
        </div>
        {canManage && (
          <Button type="button" className="btn-gold" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Album
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Album Name</TableHead>
              <TableHead>Photos</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {albums.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No albums yet. Create your first album to start uploading photos.
                </TableCell>
              </TableRow>
            ) : (
              albums.map((album) => {
                const published = publishedById[album.id] ?? album.published;

                return (
                  <TableRow key={album.id}>
                    <TableCell>
                      <Link
                        href={`/admin/gallery/${album.id}`}
                        className="font-medium transition-colors hover:text-gold"
                      >
                        {album.name}
                      </Link>
                    </TableCell>
                    <TableCell>{album.photoCount}</TableCell>
                    <TableCell>
                      {format(parseISO(album.createdAt), "d MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={published}
                            disabled={updatingId === album.id}
                            className="role-status-switch"
                            onCheckedChange={(checked) =>
                              handlePublishedChange(album.id, Boolean(checked))
                            }
                            aria-label={`${album.name} ${published ? "published" : "unpublished"}`}
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
                      ) : (
                        <span
                          className={
                            published
                              ? "text-sm text-emerald"
                              : "text-sm text-muted-foreground"
                          }
                        >
                          {published ? "Published" : "Unpublished"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ButtonLink
                        href={`/admin/gallery/${album.id}`}
                        variant="ghost"
                        size="icon"
                        aria-label={`View ${album.name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </ButtonLink>
                      {canManage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(album)}
                          aria-label={`Update ${album.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAlbum(album)}
                          aria-label={`Delete ${album.name}`}
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

      <p className="mt-4 text-sm text-muted-foreground">
        <Link href="/gallery" target="_blank" className="text-gold hover:underline">
          View public gallery
        </Link>
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSaveAlbum}>
            <DialogHeader>
              <DialogTitle className="font-heading">
                {editingAlbum ? "Update Album" : "Create Album"}
              </DialogTitle>
              <DialogDescription>
                {editingAlbum
                  ? "Rename this album. The name must be unique."
                  : "Choose a unique name for the new album."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="album-name">Album name</Label>
              <Input
                id="album-name"
                value={albumName}
                onChange={(event) => setAlbumName(event.target.value)}
                placeholder="e.g. Ramadan 2026"
                required
                minLength={2}
                maxLength={80}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="btn-gold" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAlbum ? "Save Changes" : "Create Album"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
