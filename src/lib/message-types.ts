import type { MessageState, MessageStatus } from "@prisma/client";

export interface SerializedMessage {
  id: string;
  title: string;
  body: string;
  state: MessageState;
  status: MessageStatus;
  includeInRotation: boolean;
  startsAt: string | null;
  endsAt: string | null;
  durationSeconds: number;
  priorityOrder: number | null;
  normalOrder: number | null;
  createdAt: string;
  updatedAt: string;
}
