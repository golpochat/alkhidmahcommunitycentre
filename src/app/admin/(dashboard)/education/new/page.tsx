import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassForm } from "@/components/admin/class-form";
import { EDUCATION_NAV_LABEL } from "@/lib/constants";

export default function AdminNewEducationPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="mb-8 font-heading text-3xl font-semibold">
        Create {EDUCATION_NAV_LABEL} Programme
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Programme Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
