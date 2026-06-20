"use client";

import { Loader2 } from "lucide-react";
import { AdminMessagePreviewCard } from "@/components/admin/messages/admin-message-preview-card";
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
import { Textarea } from "@/components/ui/textarea";
import type { MessageFormState } from "@/lib/message-client";
import { isMessageOnTv, setMessageOnTv } from "@/lib/message-client";

interface AdminMessageFormModalProps {
  open: boolean;
  form: MessageFormState;
  editingId: string | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (form: MessageFormState) => void;
  onSave: () => void;
}

export function AdminMessageFormModal({
  open,
  form,
  editingId,
  saving,
  onOpenChange,
  onChange,
  onSave,
}: AdminMessageFormModalProps) {
  const isPriority = form.state === "PRIORITY";
  const onTv = isMessageOnTv(form);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-messages-form-dialog admin-display-dialog">
        <DialogHeader>
          <DialogTitle>
            {editingId ? "Edit message" : "Create message"}
          </DialogTitle>
          <DialogDescription>
            Priority messages take over the TV rotation while they are valid.
            Normal messages rotate when no priority messages are active.
          </DialogDescription>
        </DialogHeader>

        <div className="admin-messages-form-fields">
          <div className="admin-messages-field">
            <Label htmlFor="message-title">Title</Label>
            <Input
              id="message-title"
              value={form.title}
              onChange={(event) =>
                onChange({ ...form, title: event.target.value })
              }
            />
          </div>

          <div className="admin-messages-field">
            <Label htmlFor="message-body">Message body</Label>
            <Textarea
              id="message-body"
              value={form.body}
              onChange={(event) =>
                onChange({ ...form, body: event.target.value })
              }
              rows={5}
            />
          </div>

          <div className="admin-messages-field">
            <Label>State</Label>
            <div
              className="admin-messages-segmented"
              role="group"
              aria-label="Message state"
            >
              <button
                type="button"
                className={`admin-messages-segment${isPriority ? " admin-messages-segment-active admin-messages-segment-priority" : ""}`}
                onClick={() => onChange({ ...form, state: "PRIORITY" })}
              >
                Priority
              </button>
              <button
                type="button"
                className={`admin-messages-segment${!isPriority ? " admin-messages-segment-active" : ""}`}
                onClick={() => onChange({ ...form, state: "NON_PRIORITY" })}
              >
                Normal
              </button>
            </div>
          </div>

          <div className="admin-messages-toggle-row">
            <div>
              <Label htmlFor="message-on-tv">On TV</Label>
              <p className="admin-messages-toggle-hint">
                {onTv
                  ? "Message can appear on TV when scheduled and its section is enabled."
                  : "Message is saved but will not appear on TV."}
              </p>
            </div>
            <div className="admin-messages-rotation-control">
              <Switch
                id="message-on-tv"
                checked={onTv}
                disabled={saving}
                onCheckedChange={(checked) =>
                  onChange(setMessageOnTv(form, Boolean(checked)))
                }
                className="admin-messages-rotation-switch"
                aria-label={onTv ? "Remove message from TV" : "Show message on TV"}
              />
              <span
                className={
                  onTv
                    ? "admin-messages-rotation-label admin-messages-rotation-label-on"
                    : "admin-messages-rotation-label"
                }
                aria-hidden="true"
              >
                {onTv ? "On" : "Off"}
              </span>
            </div>
          </div>

          <div className="admin-messages-field">
            <Label htmlFor="message-duration">Duration on screen (seconds)</Label>
            <Input
              id="message-duration"
              type="number"
              min={5}
              max={300}
              value={form.durationSeconds}
              onChange={(event) =>
                onChange({
                  ...form,
                  durationSeconds: Number(event.target.value) || 15,
                })
              }
            />
          </div>

          <fieldset className="admin-messages-fieldset">
            <legend className="admin-messages-legend">Scheduling</legend>
            {isPriority ? (
              <div className="admin-messages-date-grid">
                <div className="admin-messages-field">
                  <Label htmlFor="message-starts-priority">
                    Start date/time
                  </Label>
                  <Input
                    id="message-starts-priority"
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(event) =>
                      onChange({ ...form, startsAt: event.target.value })
                    }
                    required
                  />
                </div>
                <div className="admin-messages-field">
                  <Label htmlFor="message-ends-priority">End date/time</Label>
                  <Input
                    id="message-ends-priority"
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(event) =>
                      onChange({ ...form, endsAt: event.target.value })
                    }
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="admin-messages-schedule-options">
                <label className="admin-messages-radio-row">
                  <input
                    type="radio"
                    name="schedule-mode"
                    checked={form.scheduleMode === "lifetime"}
                    onChange={() =>
                      onChange({ ...form, scheduleMode: "lifetime" })
                    }
                  />
                  <span>Lifetime (no end date)</span>
                </label>
                <label className="admin-messages-radio-row">
                  <input
                    type="radio"
                    name="schedule-mode"
                    checked={form.scheduleMode === "limited"}
                    onChange={() =>
                      onChange({ ...form, scheduleMode: "limited" })
                    }
                  />
                  <span>Limited duration</span>
                </label>
                {form.scheduleMode === "limited" ? (
                  <div className="admin-messages-date-grid">
                    <div className="admin-messages-field">
                      <Label htmlFor="message-starts">Start date/time</Label>
                      <Input
                        id="message-starts"
                        type="datetime-local"
                        value={form.startsAt}
                        onChange={(event) =>
                          onChange({ ...form, startsAt: event.target.value })
                        }
                      />
                    </div>
                    <div className="admin-messages-field">
                      <Label htmlFor="message-ends">End date/time</Label>
                      <Input
                        id="message-ends"
                        type="datetime-local"
                        value={form.endsAt}
                        onChange={(event) =>
                          onChange({ ...form, endsAt: event.target.value })
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </fieldset>

          <div className="admin-messages-field">
            <Label htmlFor="message-order">
              {isPriority ? "Priority order" : "Normal order"}
            </Label>
            <Input
              id="message-order"
              type="number"
              min={0}
              placeholder="Auto"
              value={isPriority ? form.priorityOrder : form.normalOrder}
              onChange={(event) =>
                onChange(
                  isPriority
                    ? { ...form, priorityOrder: event.target.value }
                    : { ...form, normalOrder: event.target.value },
                )
              }
            />
          </div>

          <AdminMessagePreviewCard form={form} />
        </div>

        <DialogFooter className="admin-messages-form-dialog-footer">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {editingId ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
