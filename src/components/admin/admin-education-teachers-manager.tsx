"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/image-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { EducationPageContent } from "@/lib/education-content-types";
import type { EducationTeacher } from "@/types";

function createTeacher(): EducationTeacher {
  return {
    id: `teacher-${Date.now()}`,
    name: "",
    role: "",
    bio: "",
    imageUrl: "",
    published: false,
  };
}

export function AdminEducationTeachersManager() {
  const [content, setContent] = useState<EducationPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/education/teachers");
        if (!response.ok) {
          throw new Error("Failed to load teachers");
        }
        const data = await response.json();
        setContent(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load teachers");
      } finally {
        setLoading(false);
      }
    }

    void loadContent();
  }, []);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!content) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/education/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save teachers");
      }
      setContent(data);
      toast.success("Teachers section updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function updateTeacher(index: number, patch: Partial<EducationTeacher>) {
    if (!content) return;
    const teachers = content.teachers.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    );
    setContent({ ...content, teachers });
  }

  if (loading || !content) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  const publishedTeacherCount = content.teachers.filter((teacher) => teacher.published).length;

  return (
    <form onSubmit={handleSave} className="admin-about-manager">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Our Teachers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Publish the teachers section on `/education`
            </p>
            <Switch
              checked={content.teachersVisible}
              onCheckedChange={(checked) =>
                setContent({ ...content, teachersVisible: Boolean(checked) })
              }
              aria-label="Publish teachers section"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={
                content.teachersVisible
                  ? "border-emerald text-emerald"
                  : "border-muted-foreground text-muted-foreground"
              }
            >
              Section {content.teachersVisible ? "Published" : "Unpublished"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {publishedTeacherCount} of {content.teachers.length} teachers visible
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-heading text-lg">Teachers</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              New teachers start hidden until you publish them individually.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setContent({
                ...content,
                teachers: [...content.teachers, createTeacher()],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add teacher
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {content.teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No teachers yet. Add profiles for instructors and publish the ones that
              should appear on the public education page.
            </p>
          ) : (
            content.teachers.map((teacher, index) => (
              <div
                key={teacher.id}
                className={
                  teacher.published
                    ? "admin-about-item"
                    : "admin-about-item admin-about-item-unpublished"
                }
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {teacher.name.trim() || `Teacher ${index + 1}`}
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        teacher.published
                          ? "border-emerald text-emerald"
                          : "border-muted-foreground text-muted-foreground"
                      }
                    >
                      {teacher.published ? "Published" : "Hidden"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label
                      htmlFor={`teacher-published-${teacher.id}`}
                      className="text-sm text-muted-foreground"
                    >
                      Show on site
                    </Label>
                    <Switch
                      id={`teacher-published-${teacher.id}`}
                      checked={teacher.published}
                      onCheckedChange={(checked) =>
                        updateTeacher(index, { published: Boolean(checked) })
                      }
                      aria-label={`${teacher.published ? "Hide" : "Show"} ${teacher.name || "teacher"}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setContent({
                          ...content,
                          teachers: content.teachers.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        })
                      }
                      aria-label={`Remove teacher ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
                  <ImageUpload
                    value={teacher.imageUrl}
                    onChange={(imageUrl) => updateTeacher(index, { imageUrl })}
                    folder="education"
                    label="Photo"
                    previewAlt={teacher.name || "Teacher"}
                    variant="square"
                  />
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`teacher-name-${teacher.id}`}>Name</Label>
                        <Input
                          id={`teacher-name-${teacher.id}`}
                          value={teacher.name}
                          onChange={(event) =>
                            updateTeacher(index, { name: event.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`teacher-role-${teacher.id}`}>Role</Label>
                        <Input
                          id={`teacher-role-${teacher.id}`}
                          value={teacher.role}
                          onChange={(event) =>
                            updateTeacher(index, { role: event.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`teacher-bio-${teacher.id}`}>Bio</Label>
                      <Textarea
                        id={`teacher-bio-${teacher.id}`}
                        value={teacher.bio}
                        onChange={(event) =>
                          updateTeacher(index, { bio: event.target.value })
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Button type="submit" className="btn-gold" disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Teachers
      </Button>
    </form>
  );
}
