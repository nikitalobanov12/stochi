import { eq, desc } from "drizzle-orm";
import { User, Shield, Database } from "lucide-react";

import { db } from "~/server/db";
import { log, stack } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ExportButton } from "~/components/settings/export-button";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) return null;

  const user = session.user;

  // Get stats for the data section
  const [userLogs, userStacks] = await Promise.all([
    db.query.log.findMany({
      where: eq(log.userId, user.id),
      with: { supplement: true },
      orderBy: [desc(log.loggedAt)],
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and data
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono">
              <User className="h-4 w-4" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Name</label>
              <p className="font-medium">{user.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Email</label>
              <p className="font-mono text-sm">{user.email}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Member since</label>
              <p className="font-mono text-sm">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono">
              <Database className="h-4 w-4" />
              Your Data
            </CardTitle>
            <CardDescription>Overview of your stored data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md bg-muted/50 p-3">
                <p className="font-mono text-2xl font-bold">{userLogs.length}</p>
                <p className="text-xs text-muted-foreground">Total logs</p>
              </div>
              <div className="rounded-md bg-muted/50 p-3">
                <p className="font-mono text-2xl font-bold">{userStacks.length}</p>
                <p className="text-xs text-muted-foreground">Stacks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Export Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono">
              <Shield className="h-4 w-4" />
              Data Sovereignty
            </CardTitle>
            <CardDescription>
              Your data belongs to you. Export it anytime in standard formats.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your complete supplement history and stack configurations.
              All exports include timestamps and are compatible with spreadsheet
              applications.
            </p>
            <div className="flex flex-wrap gap-2">
              <ExportButton data={serializedData} format="json" />
              <ExportButton data={serializedData} format="csv" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
