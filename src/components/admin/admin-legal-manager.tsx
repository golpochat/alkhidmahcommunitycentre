"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Eye, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { LegalPolicyMarkdown } from "@/components/legal/legal-policy-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  LEGAL_POLICY_SLUGS,
  type LegalPolicySlug,
  type SerializedLegalPolicy,
} from "@/lib/legal-policy-types";
import { cn } from "@/lib/utils";

type AdminLegalPolicy = SerializedLegalPolicy & {
  renderedContent?: string;
};

const POLICY_TABS: Array<{ slug: LegalPolicySlug; label: string }> = [
  { slug: LEGAL_POLICY_SLUGS.privacy, label: "Privacy Policy" },
  { slug: LEGAL_POLICY_SLUGS.cookies, label: "Cookie Policy" },
  { slug: LEGAL_POLICY_SLUGS.terms, label: "Terms of Use" },
];

function todayUtcIsoDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString();
}

function withDefaultDates(policy: AdminLegalPolicy): AdminLegalPolicy {
  const today = todayUtcIsoDate();
  return {
    ...policy,
    effectiveDate: policy.effectiveDate ?? today,
    lastReviewedAt: policy.lastReviewedAt ?? today,
  };
}

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return format(new Date(value), "yyyy-MM-dd");
}

export function AdminLegalManager() {
  const [policies, setPolicies] = useState<AdminLegalPolicy[]>([]);
  const [activeSlug, setActiveSlug] = useState<LegalPolicySlug>(LEGAL_POLICY_SLUGS.privacy);
  const [draft, setDraft] = useState<AdminLegalPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadPolicy = useCallback(async (slug: LegalPolicySlug) => {
    const response = await fetch(`/api/admin/legal/${slug}`);
    if (!response.ok) {
      throw new Error("Failed to load policy");
    }

    const policy = (await response.json()) as AdminLegalPolicy;
    return withDefaultDates(policy);
  }, []);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const listResponse = await fetch("/api/admin/legal");
        if (!listResponse.ok) {
          throw new Error("Failed to load policies");
        }

        const list = (await listResponse.json()) as SerializedLegalPolicy[];
        setPolicies(list);

        const initial = await loadPolicy(LEGAL_POLICY_SLUGS.privacy);
        setDraft(initial);
        setActiveSlug(LEGAL_POLICY_SLUGS.privacy);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load legal policies",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadAll();
  }, [loadPolicy]);

  async function handleSelectSlug(slug: LegalPolicySlug) {
    setActiveSlug(slug);
    setPreviewOpen(false);
    setLoading(true);

    try {
      const policy = await loadPolicy(slug);
      setDraft(policy);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load policy");
    } finally {
      setLoading(false);
    }
  }

  async function openPreview() {
    if (!draft) {
      return;
    }

    setPreviewOpen(true);
    setPreviewLoading(true);

    try {
      const response = await fetch(`/api/admin/legal/${draft.slug}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft.content }),
      });

      if (!response.ok) {
        throw new Error("Failed to load preview");
      }

      const result = (await response.json()) as { renderedContent: string };
      setPreviewContent(result.renderedContent);
    } catch (error) {
      setPreviewContent(draft.renderedContent ?? draft.content);
      toast.error(
        error instanceof Error ? error.message : "Could not refresh preview",
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) {
      return;
    }

    const payload = withDefaultDates(draft);

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/legal/${draft.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          summary: payload.summary,
          content: payload.content,
          published: payload.published,
          version: payload.version,
          effectiveDate: payload.effectiveDate,
          lastReviewedAt: payload.lastReviewedAt,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save policy");
      }

      setDraft(withDefaultDates(result as AdminLegalPolicy));
      setPolicies((current) =>
        current.map((policy) =>
          policy.slug === result.slug
            ? {
                ...policy,
                title: result.title,
                summary: result.summary,
                published: result.published,
                version: result.version,
                updatedAt: result.updatedAt,
              }
            : policy,
        ),
      );
      toast.success("Policy saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save policy");
    } finally {
      setSaving(false);
    }
  }

  function handlePublishedChange(checked: boolean) {
    const published = Boolean(checked);
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const today = todayUtcIsoDate();
      return withDefaultDates({
        ...current,
        published,
        effectiveDate: published && !current.effectiveDate ? today : current.effectiveDate,
      });
    });
  }

  if (loading && !draft) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!draft) {
    return null;
  }

  return (
    <div className="admin-legal-manager space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Legal Policies</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Manage privacy, cookie, and terms documents shown on the public site.
          Draft templates include placeholders such as {"{{siteName}}"} and {"{{charityNumber}}"} —
          have your solicitor review before publishing.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {POLICY_TABS.map((tab) => {
          const policy = policies.find((item) => item.slug === tab.slug);
          return (
            <Button
              key={tab.slug}
              type="button"
              variant={activeSlug === tab.slug ? "default" : "outline"}
              className={cn(activeSlug === tab.slug && "btn-gold")}
              onClick={() => void handleSelectSlug(tab.slug)}
            >
              {tab.label}
              {policy?.published ? (
                <Badge className="ml-2 bg-emerald/15 text-emerald">Live</Badge>
              ) : (
                <Badge variant="secondary" className="ml-2">
                  Draft
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      <section className="rounded-lg border border-gold/25 bg-secondary/30 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-heading text-base font-semibold">Publication status</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              When published, this policy appears on the public site and in the footer links.
            </p>
          </div>

          <div className="admin-homepage-publish-control">
            <p className="admin-homepage-publish-control-label">Published</p>
            <div className="admin-messages-rotation-control">
              <Switch
                checked={draft.published}
                disabled={saving}
                onCheckedChange={handlePublishedChange}
                className="admin-homepage-publish-switch"
                aria-label={draft.published ? "Unpublish policy" : "Publish policy"}
              />
              <span
                className={
                  draft.published
                    ? "admin-homepage-publish-state admin-homepage-publish-state-on"
                    : "admin-homepage-publish-state"
                }
                aria-hidden="true"
              >
                {draft.published ? "Live" : "Draft"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Edit policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, title: event.target.value } : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={draft.version}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, version: event.target.value } : current,
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Input
                id="summary"
                value={draft.summary ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, summary: event.target.value } : current,
                  )
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective date</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={toDateInputValue(draft.effectiveDate)}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            effectiveDate: event.target.value
                              ? new Date(`${event.target.value}T00:00:00.000Z`).toISOString()
                              : null,
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastReviewedAt">Last reviewed</Label>
                <Input
                  id="lastReviewedAt"
                  type="date"
                  value={toDateInputValue(draft.lastReviewedAt)}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            lastReviewedAt: event.target.value
                              ? new Date(`${event.target.value}T00:00:00.000Z`).toISOString()
                              : null,
                          }
                        : current,
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                value={draft.content}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, content: event.target.value } : current,
                  )
                }
                rows={28}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving} className="btn-gold">
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save policy
              </Button>
              <Button type="button" variant="outline" onClick={() => void openPreview()}>
                <Eye className="mr-2 h-4 w-4" />
                Show preview
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="admin-legal-preview-dialog max-h-[85vh] max-w-4xl overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview — {draft.title}</DialogTitle>
            <DialogDescription>
              {draft.published
                ? "This is how the published policy appears on the public site."
                : "Draft preview — have your solicitor review before publishing."}
            </DialogDescription>
          </DialogHeader>

          {!draft.published ? (
            <div className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm text-gold">
              DRAFT — REQUIRES LEGAL REVIEW before publishing on the public site.
            </div>
          ) : null}

          {previewLoading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : (
            <LegalPolicyMarkdown content={previewContent} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
