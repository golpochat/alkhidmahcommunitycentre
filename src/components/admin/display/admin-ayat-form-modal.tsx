"use client";

import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { emptyAyahForm } from "@/components/admin/display/admin-ayat-section";

export type AyahFormState = typeof emptyAyahForm;

interface AdminAyatFormModalProps {
  open: boolean;
  form: AyahFormState;
  editingId: string | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (form: AyahFormState) => void;
  onSave: () => void;
}

export function AdminAyatFormModal({
  open,
  form,
  editingId,
  saving,
  onOpenChange,
  onChange,
  onSave,
}: AdminAyatFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-messages-form-dialog admin-display-dialog">
        <DialogHeader>
          <DialogTitle>
            {editingId ? "Edit Ayat / Hadith" : "Add Ayat / Hadith"}
          </DialogTitle>
          <DialogDescription>
            These entries rotate on the TV with normal announcements when no
            priority messages are active.
          </DialogDescription>
        </DialogHeader>

        <div className="admin-messages-form-fields">
          <div className="admin-messages-field">
            <Label htmlFor="ayah-modal-arabic">Arabic</Label>
            <Textarea
              id="ayah-modal-arabic"
              value={form.arabic}
              onChange={(event) =>
                onChange({ ...form, arabic: event.target.value })
              }
              rows={4}
              dir="rtl"
            />
          </div>

          <div className="admin-messages-field">
            <Label htmlFor="ayah-modal-english">English</Label>
            <Textarea
              id="ayah-modal-english"
              value={form.english}
              onChange={(event) =>
                onChange({ ...form, english: event.target.value })
              }
              rows={4}
            />
          </div>

          <div className="admin-messages-field">
            <Label htmlFor="ayah-modal-source">Source</Label>
            <Input
              id="ayah-modal-source"
              value={form.source}
              onChange={(event) =>
                onChange({ ...form, source: event.target.value })
              }
              placeholder="e.g. Qur'an 2:255"
            />
          </div>
        </div>

        <DialogFooter className="admin-messages-form-dialog-footer">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingId ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
