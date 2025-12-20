import { eq, desc, count } from "drizzle-orm";
import { User, Download } from "lucide-react";

import { db } from "~/server/db";
import { log, stack } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { getUserGoals } from "~/server/actions/goals";
import { ExportButton } from "~/components/settings/export-button";
import { GoalsCard } from "~/components/settings/goals-card";
import { DeleteAccountCard } from "~/components/settings/delete-account-card";

// Limit export to last 10,000 entries to prevent memory issues
const EXPORT_LIMIT = 10000;

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) return null;

  const user = session.user;

  // Get counts for stats (efficient, doesn't load all data)
  const [logCountResult, stackCountResult, userGoals] = await Promise.all([
    db.select({ count: count() }).from(log).where(eq(log.userId, user.id)),
    db.select({ count: count() }).from(stack).where(eq(stack.userId, user.id)),
    getUserGoals(),
  ]);

  const logCount = logCountResult[0]?.count ?? 0;
  const stackCount = stackCountResult[0]?.count ?? 0;

  // Only fetch full data for export (with reasonable limit)
  const [userLogs, userStacks] = await Promise.all([
    db.query.log.findMany({
      where: eq(log.userId, user.id),
      with: { supplement: true },
      orderBy: [desc(log.loggedAt)],
      limit: EXPORT_LIMIT,
    }),
    db.query.stack.findMany({
      where: eq(stack.userId, user.id),
      with: {
        items: {
          with: { supplement: true },
        },
      },
    }),
  ]);

  // Serialize dates for client component
  const serializedData = {
    logs: userLogs.map((l) => ({
      id: l.id,
      dosage: l.dosage,
      unit: l.unit,
      loggedAt: l.loggedAt.toISOString(),
      supplement: { name: l.supplement.name, form: l.supplement.form },
    })),
    stacks: userStacks.map((s) => ({
      id: s.id,
      name: s.name,
      items: s.items.map((i) => ({
        dosage: i.dosage,
        unit: i.unit,
        supplement: { name: i.supplement.name, form: i.supplement.form },
      })),
    })),
  };

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
          Settings
        </p>
        <h1 className="font-mono text-lg font-medium">Account & Data</h1>
      </div>

      {/* Profile Section */}
      <section className="space-y-3">
        <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
          Profile
        </p>
        <div className="border-border/40 bg-card/30 rounded-lg border p-4">
          <div className="flex items-start gap-4">
            <div className="border-border/40 bg-muted/30 flex h-10 w-10 items-center justify-center rounded-full border">
              <User className="text-muted-foreground h-4 w-4" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="font-mono text-sm font-medium">{user.name}</p>
                <p className="text-muted-foreground font-mono text-xs">
                  {user.email}
                </p>
              </div>
              <p className="text-muted-foreground/60 text-[10px] tracking-wider uppercase">
                Member since {memberSince}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Goals Section */}
      <section className="space-y-3">
        <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
          Goals
        </p>
        <GoalsCard initialGoals={userGoals.map((g) => g.goal)} />
      </section>

      {/* Data Stats */}
      <section className="space-y-3">
        <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
          Data Overview
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="border-border/40 bg-card/30 rounded-lg border p-3">
            <p className="font-mono text-2xl font-medium tabular-nums">
              {logCount.toLocaleString()}
            </p>
            <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
              Log Entries
            </p>
          </div>
          <div className="border-border/40 bg-card/30 rounded-lg border p-3">
            <p className="font-mono text-2xl font-medium tabular-nums">
              {stackCount}
            </p>
            <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
              Protocols
            </p>
          </div>
        </div>
      </section>

      {/* Data Export */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
            Data Export
          </p>
          <Download className="text-muted-foreground/50 h-3 w-3" />
        </div>
        <div className="border-border/40 bg-card/30 rounded-lg border p-4">
          <div className="space-y-3">
            <p className="text-muted-foreground font-mono text-xs">
              Your data belongs to you. Export supplement logs and protocol
              configurations in standard formats.
            </p>
            {logCount > EXPORT_LIMIT && (
              <p className="font-mono text-[10px] text-amber-500">
                Limited to {EXPORT_LIMIT.toLocaleString()} most recent entries
              </p>
            )}
            <div className="flex gap-2">
              <ExportButton data={serializedData} format="json" />
              <ExportButton data={serializedData} format="csv" />
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-3">
        <p className="text-destructive/80 text-[10px] tracking-wider uppercase">
          Danger Zone
        </p>
        <DeleteAccountCard logCount={logCount} stackCount={stackCount} />
      </section>
    </div>
  );
}
