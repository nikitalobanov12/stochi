import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Trash2, AlertTriangle, Zap, CheckCircle2 } from "lucide-react";

import { db } from "~/server/db";
import { stack } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import {
  updateStack,
  deleteStack,
  addStackItems,
  removeStackItem,
  logStack,
} from "~/server/actions/stacks";
import { checkInteractions, checkRatioWarnings, type InteractionWarning, type RatioWarning } from "~/server/actions/interactions";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { AddSupplementsDialog } from "~/components/stacks/add-supplements-dialog";
import {
  SeverityBadge,
  getWarningBackgroundClass,
  getWarningTextClass,
  getWarningBorderClass,
} from "~/components/interactions/severity-badge";

export default async function StackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const userStack = await db.query.stack.findFirst({
    where: and(eq(stack.id, id), eq(stack.userId, session.user.id)),
    with: {
      items: {
        with: {
          supplement: true,
        },
      },
    },
  });

  if (!userStack) {
    notFound();
  }

  const allSupplements = await db.query.supplement.findMany({
    orderBy: (s, { asc }) => [asc(s.name)],
  });

  // Check for interactions in this stack
  const supplementIds = userStack.items.map((item) => item.supplementId);
  const interactions = await checkInteractions(supplementIds);
  const warnings = interactions.filter((i) => i.type !== "synergy");
  const synergies = interactions.filter((i) => i.type === "synergy");

  // Check for ratio warnings (e.g., Zn:Cu ratio)
  const supplementsWithDosage = userStack.items.map((item) => ({
    id: item.supplementId,
    dosage: item.dosage,
    unit: item.unit,
  }));
  const ratioWarnings = await checkRatioWarnings(supplementsWithDosage);

  const logStackWithId = logStack.bind(null, userStack.id);
  const deleteStackWithId = deleteStack.bind(null, userStack.id);
  const updateStackWithId = updateStack.bind(null, userStack.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/stacks">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-mono text-2xl font-bold">{userStack.name}</h1>
          <p className="text-sm text-muted-foreground">
            {userStack.items.length} supplements in this stack
          </p>
        </div>
        <form action={logStackWithId}>
          <Button
            type="submit"
            disabled={userStack.items.length === 0}
            className="font-mono"
          >
            <Play className="mr-2 h-4 w-4" />
            Log Stack
          </Button>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-mono">Supplements</CardTitle>
                <AddSupplementsDialog
                  stackId={userStack.id}
                  supplements={allSupplements}
                  addStackItems={addStackItems}
                />
              </div>
            </CardHeader>
            <CardContent>
              {userStack.items.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No supplements added yet</p>
                  <p className="mt-1 text-sm">
                    Add supplements to this stack to get started
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplement</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userStack.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {item.supplement.name}
                            </div>
                            {item.supplement.form && (
                              <div className="text-xs text-muted-foreground">
                                {item.supplement.form}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {item.dosage}
                          {item.unit}
                        </TableCell>
                        <TableCell>
                          <form action={removeStackItem.bind(null, item.id)}>
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Interactions Card */}
          <InteractionsCard warnings={warnings} synergies={synergies} ratioWarnings={ratioWarnings} />

          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-base">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={updateStackWithId} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stack-name">Stack Name</Label>
                  <Input
                    id="stack-name"
                    name="name"
                    defaultValue={userStack.name}
                    className="font-mono"
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full">
                  Update Name
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="font-mono text-base text-destructive">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={deleteStackWithId}>
                <Button
                  type="submit"
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Stack
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InteractionsCard({
  warnings,
  synergies,
  ratioWarnings,
}: {
  warnings: InteractionWarning[];
  synergies: InteractionWarning[];
  ratioWarnings: RatioWarning[];
}) {
  const hasInteractions = warnings.length > 0 || synergies.length > 0 || ratioWarnings.length > 0;
  const criticalCount = warnings.filter((w) => w.severity === "critical").length + 
    ratioWarnings.filter((w) => w.severity === "critical").length;
  const mediumCount = warnings.filter((w) => w.severity === "medium").length +
    ratioWarnings.filter((w) => w.severity === "medium").length;

  if (!hasInteractions) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-mono text-base">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Interactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No interactions detected in this stack.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={getWarningBorderClass(criticalCount, mediumCount)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-mono text-base">
          {(warnings.length > 0 || ratioWarnings.length > 0) ? (
            <AlertTriangle className={`h-4 w-4 ${
              criticalCount > 0 ? "text-destructive" : "text-yellow-500"
            }`} />
          ) : (
            <Zap className="h-4 w-4 text-green-500" />
          )}
          Interactions
        </CardTitle>
        <CardDescription>
          {(warnings.length + ratioWarnings.length) > 0 && `${warnings.length + ratioWarnings.length} warning${(warnings.length + ratioWarnings.length) > 1 ? "s" : ""}`}
          {(warnings.length + ratioWarnings.length) > 0 && synergies.length > 0 && ", "}
          {synergies.length > 0 && `${synergies.length} synerg${synergies.length > 1 ? "ies" : "y"}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Ratio Warnings */}
        {ratioWarnings.map((warning) => (
          <div
            key={warning.id}
            className={`rounded-md p-2 text-xs ${getWarningBackgroundClass(warning.severity)}`}
          >
            <div className="flex items-center gap-2 font-medium">
              <SeverityBadge severity={warning.severity} />
              <span className={getWarningTextClass(warning.severity)}>
                Ratio Imbalance
              </span>
            </div>
            <p className="mt-1 text-muted-foreground">
              <span className="font-medium text-foreground">{warning.source.name}</span>
              {" : "}
              <span className="font-medium text-foreground">{warning.target.name}</span>
              <span className="ml-2 font-mono">
                ({warning.currentRatio}:1 vs {warning.minRatio}-{warning.maxRatio}:1)
              </span>
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {warning.message}
            </p>
          </div>
        ))}

        {warnings.map((warning) => (
          <div
            key={warning.id}
            className={`rounded-md p-2 text-xs ${getWarningBackgroundClass(warning.severity)}`}
          >
            <div className="flex items-center gap-2 font-medium">
              <SeverityBadge severity={warning.severity} />
              <span className={getWarningTextClass(warning.severity)}>
                {warning.type === "competition" ? "Competition" : "Inhibition"}
              </span>
            </div>
            <p className="mt-1 text-muted-foreground">
              <span className="font-medium text-foreground">{warning.source.name}</span>
              {" → "}
              <span className="font-medium text-foreground">{warning.target.name}</span>
            </p>
            {warning.mechanism && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                {warning.mechanism}
              </p>
            )}
          </div>
        ))}

        {synergies.map((synergy) => (
          <div
            key={synergy.id}
            className="rounded-md bg-green-500/10 p-2 text-xs"
          >
            <div className="flex items-center gap-2 font-medium">
              <Badge className="bg-green-500/20 text-green-600 text-[10px]">
                synergy
              </Badge>
              <Zap className="h-3 w-3 text-green-500" />
            </div>
            <p className="mt-1 text-muted-foreground">
              <span className="font-medium text-foreground">{synergy.source.name}</span>
              {" + "}
              <span className="font-medium text-foreground">{synergy.target.name}</span>
            </p>
            {synergy.mechanism && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                {synergy.mechanism}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
