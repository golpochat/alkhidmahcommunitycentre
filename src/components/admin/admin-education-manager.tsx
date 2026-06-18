"use client";

import { AdminClassesManager } from "@/components/admin/admin-classes-manager";
import { AdminEducationTeachersManager } from "@/components/admin/admin-education-teachers-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EDUCATION_NAV_LABEL } from "@/lib/constants";

export function AdminEducationManager() {
  return (
    <div className="admin-education-manager">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-semibold">{EDUCATION_NAV_LABEL}</h1>
        <p className="mt-2 text-muted-foreground">
          Manage programmes, registrations, and teacher profiles for the public education
          page.
        </p>
      </div>

      <Tabs defaultValue="programmes">
        <TabsList>
          <TabsTrigger value="programmes">Programmes</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>
        <TabsContent value="programmes" className="mt-6">
          <AdminClassesManager embedded />
        </TabsContent>
        <TabsContent value="teachers" className="mt-6">
          <AdminEducationTeachersManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
