"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ABOUT_VALUE_ICON_KEYS,
  type AboutPageContent,
  type AboutValue,
  type AboutValueIconKey,
} from "@/lib/about-content-types";
import type { CommitteeMember } from "@/types";

function createValue(): AboutValue {
  return {
    id: `value-${Date.now()}`,
    icon: "book",
    title: "",
    description: "",
  };
}

function createMember(): CommitteeMember {
  return {
    id: `member-${Date.now()}`,
    name: "",
    role: "",
    bio: "",
    imageUrl: "",
  };
}

export function AdminAboutManager() {
  const [content, setContent] = useState<AboutPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/about");
        if (!response.ok) {
          throw new Error("Failed to load about page content");
        }
        const data = await response.json();
        setContent(data);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load about content",
        );
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
      const response = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save about content");
      }
      setContent(data);
      toast.success("About page updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function updateValue(index: number, patch: Partial<AboutValue>) {
    if (!content) return;
    const values = content.values.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    );
    setContent({ ...content, values });
  }

  function updateMember(index: number, patch: Partial<CommitteeMember>) {
    if (!content) return;
    const committee = content.committee.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    );
    setContent({ ...content, committee });
  }

  if (loading || !content) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="admin-about-manager">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-semibold">About Page</h1>
        <p className="mt-2 text-muted-foreground">
          Manage the Values and Committee sections shown on the public about page.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Our Values</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Show the values grid on `/about`
            </p>
            <Switch
              checked={content.valuesVisible}
              onCheckedChange={(checked) =>
                setContent({ ...content, valuesVisible: Boolean(checked) })
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Mosque Committee</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Show committee members on `/about`
            </p>
            <Switch
              checked={content.committeeVisible}
              onCheckedChange={(checked) =>
                setContent({ ...content, committeeVisible: Boolean(checked) })
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-lg">Values</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setContent({ ...content, values: [...content.values, createValue()] })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add value
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {content.values.map((value, index) => (
            <div key={value.id} className="admin-about-item">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-medium">Value {index + 1}</p>
                {content.values.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setContent({
                        ...content,
                        values: content.values.filter((_, itemIndex) => itemIndex !== index),
                      })
                    }
                    aria-label={`Remove value ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`value-title-${value.id}`}>Title</Label>
                  <Input
                    id={`value-title-${value.id}`}
                    value={value.title}
                    onChange={(event) => updateValue(index, { title: event.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`value-icon-${value.id}`}>Icon</Label>
                  <Select
                    value={value.icon}
                    onValueChange={(icon) =>
                      updateValue(index, { icon: icon as AboutValueIconKey })
                    }
                  >
                    <SelectTrigger id={`value-icon-${value.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ABOUT_VALUE_ICON_KEYS.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor={`value-description-${value.id}`}>Description</Label>
                <Textarea
                  id={`value-description-${value.id}`}
                  value={value.description}
                  onChange={(event) =>
                    updateValue(index, { description: event.target.value })
                  }
                  rows={3}
                  required
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-lg">Committee Members</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setContent({
                ...content,
                committee: [...content.committee, createMember()],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add member
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {content.committee.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No committee members yet. Add members to display them when the section is
              published.
            </p>
          ) : (
            content.committee.map((member, index) => (
              <div key={member.id} className="admin-about-item">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-medium">Member {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setContent({
                        ...content,
                        committee: content.committee.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      })
                    }
                    aria-label={`Remove member ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`member-name-${member.id}`}>Name</Label>
                    <Input
                      id={`member-name-${member.id}`}
                      value={member.name}
                      onChange={(event) =>
                        updateMember(index, { name: event.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`member-role-${member.id}`}>Role</Label>
                    <Input
                      id={`member-role-${member.id}`}
                      value={member.role}
                      onChange={(event) =>
                        updateMember(index, { role: event.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor={`member-bio-${member.id}`}>Bio</Label>
                  <Textarea
                    id={`member-bio-${member.id}`}
                    value={member.bio}
                    onChange={(event) => updateMember(index, { bio: event.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Button type="submit" className="btn-gold" disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save About Page
      </Button>
    </form>
  );
}
