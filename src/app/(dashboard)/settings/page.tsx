import { CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <>
      <PageHeader title="Settings" subtitle="How this dashboard is configured." />

      <div className="flex flex-col gap-4 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>AI subtask breakdown</CardTitle>
          </CardHeader>
          <div className="flex items-center gap-2.5">
            {hasApiKey ? (
              <>
                <CheckCircle2 className="size-4 text-primary" />
                <span className="text-sm text-foreground">
                  ANTHROPIC_API_KEY is configured.
                </span>
              </>
            ) : (
              <>
                <XCircle className="size-4 text-danger" />
                <span className="text-sm text-foreground">
                  ANTHROPIC_API_KEY is not set.
                </span>
              </>
            )}
          </div>
          {!hasApiKey && (
            <p className="mt-2 text-sm text-muted-foreground">
              Add your key to the <code className="rounded bg-black/[0.05] px-1.5 py-0.5">.env</code> file
              at the project root as <code className="rounded bg-black/[0.05] px-1.5 py-0.5">ANTHROPIC_API_KEY=&quot;sk-ant-...&quot;</code>,
              then restart the dev server. Get a key at{" "}
              <span className="text-foreground">console.anthropic.com/settings/keys</span>.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data</CardTitle>
          </CardHeader>
          <p className="text-sm text-muted-foreground">
            Everything you enter is stored locally in a SQLite database at{" "}
            <code className="rounded bg-black/[0.05] px-1.5 py-0.5">dev.db</code> in the project
            folder. Nothing is sent anywhere except the subtask-breakdown requests you trigger
            explicitly, which go straight to Anthropic&apos;s API.
          </p>
        </Card>
      </div>
    </>
  );
}
