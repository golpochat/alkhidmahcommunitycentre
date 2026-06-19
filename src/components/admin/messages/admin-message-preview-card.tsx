import type { MessageFormState } from "@/lib/message-client";
import { formatMessageSchedule } from "@/lib/message-client";
import type { SerializedMessage } from "@/lib/message-types";

interface AdminMessagePreviewCardProps {
  form: MessageFormState;
  message?: SerializedMessage | null;
}

export function AdminMessagePreviewCard({
  form,
  message,
}: AdminMessagePreviewCardProps) {
  const isPriority = form.state === "PRIORITY";
  const previewMessage: SerializedMessage = message ?? {
    id: "preview",
    title: form.title || "Message title",
    body: form.body || "Message body preview…",
    state: form.state,
    status: form.status,
    includeInRotation: form.includeInRotation,
    startsAt:
      form.state === "PRIORITY" || form.scheduleMode === "limited"
        ? form.startsAt
          ? new Date(form.startsAt).toISOString()
          : null
        : null,
    endsAt:
      form.state === "PRIORITY" || form.scheduleMode === "limited"
        ? form.endsAt
          ? new Date(form.endsAt).toISOString()
          : null
        : null,
    durationSeconds: form.durationSeconds,
    priorityOrder: null,
    normalOrder: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <article
      className={`admin-message-preview-card${isPriority ? " admin-message-preview-card-priority" : ""}`}
    >
      <p className="admin-message-preview-kicker">
        {isPriority ? "Priority message" : "Non-priority message"}
      </p>
      <h3 className="admin-message-preview-title">{previewMessage.title}</h3>
      <p className="admin-message-preview-body">{previewMessage.body}</p>
      <dl className="admin-message-preview-meta">
        <div>
          <dt>Duration</dt>
          <dd>{form.durationSeconds}s on screen</dd>
        </div>
        <div>
          <dt>Schedule</dt>
          <dd>{formatMessageSchedule(previewMessage)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{form.status === "ACTIVE" ? "Active" : "Inactive"}</dd>
        </div>
      </dl>
    </article>
  );
}
