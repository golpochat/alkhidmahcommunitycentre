import { ClassesPageContent } from "@/components/classes/classes-page-content";
import { getAllClasses } from "@/lib/queries";
import { createPageMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata(
  "Education",
  `Qur'an and Islamic education programmes for all ages at ${SITE_NAME}.`
);

export default async function EducationPage() {
  const classes = await getAllClasses();
  return <ClassesPageContent classes={classes} />;
}
