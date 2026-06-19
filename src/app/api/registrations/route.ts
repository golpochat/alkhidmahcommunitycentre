import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  sendRegistrationAdminNotification,
  sendRegistrationConfirmation,
} from "@/lib/email";
import { serializeRegistration } from "@/lib/classes";
import { registrationSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registrationSchema.parse(body);

    const cls = await db.class.findUnique({ where: { id: validated.classId } });
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (!cls.published) {
      return NextResponse.json({ error: "Programme not available" }, { status: 404 });
    }

    const registration = await db.registration.create({
      data: {
        classId: validated.classId,
        name: validated.name,
        email: validated.email,
        phone: validated.phone ?? null,
        notes: validated.notes ?? null,
        privacyConsentAt: new Date(),
      },
      include: {
        class: { select: { title: true, slug: true } },
      },
    });

    try {
      await Promise.all([
        sendRegistrationConfirmation({
          name: validated.name,
          email: validated.email,
          classTitle: cls.title,
          classSchedule: cls.schedule,
        }),
        sendRegistrationAdminNotification({
          name: validated.name,
          email: validated.email,
          phone: validated.phone,
          notes: validated.notes,
          classTitle: cls.title,
        }),
      ]);
    } catch {
      console.warn("Registration saved but email notification failed.");
    }

    return NextResponse.json(serializeRegistration(registration), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid data" },
      { status: 400 }
    );
  }
}
