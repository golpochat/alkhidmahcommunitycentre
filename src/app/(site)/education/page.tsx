import { ClassesPageContent } from "@/components/classes/classes-page-content";
import {
  getEducationPageContent,
  getPublishedEducationTeachers,
} from "@/lib/education-content";
import { getAllClasses } from "@/lib/queries";
import { createPageMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata(
  "Education",
  `Qur'an and Islamic education programmes for all ages at ${SITE_NAME}.`
);

export default async function EducationPage() {
  const [classes, educationContent] = await Promise.all([
    getAllClasses(),
    getEducationPageContent(),
  ]);
  const publishedTeachers = getPublishedEducationTeachers(educationContent.teachers);

  return (
    <ClassesPageContent
      classes={classes}
      teachers={publishedTeachers}
      teachersVisible={educationContent.teachersVisible}
    />
  );
}
