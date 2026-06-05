import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassForm } from "@/components/admin/class-form";
import { getClassRecordById } from "@/lib/queries";

interface EditEducationPageProps {
  params: { id: string };
}

export default async function EditEducationPage({ params }: EditEducationPageProps) {
  const classItem = await getClassRecordById(params.id);

  if (!classItem) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-8 font-heading text-3xl font-semibold">Edit Programme</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{classItem.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassForm classItem={classItem} mode="edit" />
        </CardContent>
      </Card>
    </div>
  );
}
