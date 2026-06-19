import { NextResponse } from "next/server";
import { getRotationQueue } from "@/lib/message-rotation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const queue = await getRotationQueue();
    return NextResponse.json(queue);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
