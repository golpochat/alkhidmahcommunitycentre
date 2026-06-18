import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import type { PublishStatusOverview } from "@/lib/admin-publish-status";

interface AdminPublishChecklistProps {
  overview: PublishStatusOverview;
}

export function AdminPublishChecklist({ overview }: AdminPublishChecklistProps) {
  if (!overview.hasUnpublishedContent) {
    return null;
  }

  const unpublishedRows = overview.rows.filter((row) => row.unpublished > 0);

  return (
    <Card className="admin-publish-checklist mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-lg">
          <AlertCircle className="h-5 w-5 text-gold" />
          First-run publish checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Seed content starts unpublished. Review each area below and publish what
          should appear on the public website.
        </p>
        <ul className="admin-publish-checklist-list">
          {unpublishedRows.map((row) => (
            <li key={row.key} className="admin-publish-checklist-item">
              <div>
                <p className="font-medium">{row.label}</p>
                <p className="text-sm text-muted-foreground">
                  {row.unpublished} unpublished
                  {row.detail ? ` · ${row.detail}` : ""}
                </p>
              </div>
              <ButtonLink href={row.adminHref} size="sm" variant="outline">
                Review
              </ButtonLink>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface AdminPublishStatusOverviewProps {
  overview: PublishStatusOverview;
}

export function AdminPublishStatusOverview({
  overview,
}: AdminPublishStatusOverviewProps) {
  if (overview.rows.length === 0) {
    return null;
  }

  return (
    <Card className="admin-publish-status-overview">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Publish status overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="admin-publish-status-summary">
          <div>
            <p className="admin-publish-status-summary-value text-emerald">
              {overview.totalPublished}
            </p>
            <p className="admin-publish-status-summary-label">Published items</p>
          </div>
          <div>
            <p className="admin-publish-status-summary-value text-gold">
              {overview.totalUnpublished}
            </p>
            <p className="admin-publish-status-summary-label">Unpublished items</p>
          </div>
        </div>
        <div className="admin-publish-status-table-wrap">
          <table className="admin-publish-status-table">
            <thead>
              <tr>
                <th>Content</th>
                <th>Published</th>
                <th>Unpublished</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {overview.rows.map((row) => (
                <tr key={row.key}>
                  <td>
                    <div className="font-medium">{row.label}</div>
                    {row.detail ? (
                      <div className="text-xs text-muted-foreground">{row.detail}</div>
                    ) : null}
                  </td>
                  <td>{row.published}</td>
                  <td>{row.unpublished}</td>
                  <td className="text-right">
                    <Link href={row.adminHref} className="admin-publish-status-link">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
