import type { SerializedMessage } from "@/lib/message-types";
import type { SerializedDisplayNotice } from "@/lib/display-types";

export interface RotationMessage {
  id: string;
  title: string;
  body: string;
  state: SerializedMessage["state"];
  durationSeconds: number;
}

function mapRotationMessage(message: SerializedMessage): RotationMessage {
  return {
    id: message.id,
    title: message.title,
    body: message.body,
    state: message.state,
    durationSeconds: message.durationSeconds,
  };
}

export function priorityRotationToNotices(
  messages: RotationMessage[],
): SerializedDisplayNotice[] {
  return messages
    .filter((message) => message.state === "PRIORITY")
    .map((message) => ({
      id: message.id,
      title: message.title,
      message: message.body,
      priority: "high",
      startDate: null,
      endDate: null,
      createdAt: new Date().toISOString(),
    }));
}

export const rotationClient = {
  async fetchRotationQueue(): Promise<RotationMessage[]> {
    const response = await fetch("/api/rotation", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to fetch rotation queue");
    }

    const data = (await response.json()) as SerializedMessage[];
    return data.map(mapRotationMessage);
  },
};
