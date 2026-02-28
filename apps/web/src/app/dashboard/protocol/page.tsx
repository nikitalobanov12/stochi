import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Settings2 } from "lucide-react";

import { getSession } from "~/server/better-auth/server";
import { getOrCreateProtocol } from "~/server/actions/protocol";
import { db } from "~/server/db";
import { stack } from "~/server/db/schema";
import { ProtocolBuilder } from "~/components/protocol/protocol-builder";
import { ProtocolSettingsDialog } from "~/components/protocol/protocol-settings-dialog";
import { ProtocolHealthScore } from "~/components/protocol/protocol-health-score";
import { Button } from "~/components/ui/button";
import { analyzeProtocol } from "~/server/services/protocol-analysis";
import { isProtocolHealthScoreEnabled } from "~/lib/feature-flags";

export default async function ProtocolPage() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  // Get or create the user's protocol
  const protocol = await getOrCreateProtocol();

  // Fetch supplements and user stacks in parallel
  const [supplements, userStacks] = await Promise.all([
    db.query.supplement.findMany({
      columns: {
        id: true,
        name: true,
        form: true,
        defaultUnit: true,
        optimalTimeOfDay: true,
        isResearchChemical: true,
        route: true,
        suggestedFrequency: true,
        frequencyNotes: true,
        safetyCategory: true,
        elementalWeight: true,
      },
      orderBy: (s, { asc }) => [asc(s.name)],
    }),
    db.query.stack.findMany({
      where: eq(stack.userId, session.user.id),
      with: {
        items: {
          with: {
            supplement: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: (s, { asc }) => [asc(s.name)],
    }),
  ]);

  // Build protocol data with full supplement info for analysis
  const protocolForAnalysis = {
    id: protocol.id,
    name: protocol.name,
    items: protocol.items.map((item) => {
      // Find the full supplement data
      const fullSupplement = supplements.find(
        (s) => s.id === item.supplementId,
      );
      return {
        ...item,
        supplement: {
          id: item.supplement.id,
          name: item.supplement.name,
          form: item.supplement.form,
          optimalTimeOfDay: item.supplement.optimalTimeOfDay,
          safetyCategory: fullSupplement?.safetyCategory ?? null,
          elementalWeight: fullSupplement?.elementalWeight ?? null,
        },
      };
    }),
  };

  // Analyze the protocol for issues
  const protocolHealthScoreEnabled = isProtocolHealthScoreEnabled();
  const analysis = protocolHealthScoreEnabled
    ? await analyzeProtocol(protocolForAnalysis)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-xl font-medium tracking-tight">
            {protocol.name}
          </h1>
          <p className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
            {protocol.items.length === 0
              ? "NO SUPPLEMENTS"
              : `${protocol.items.length} SUPPLEMENT${protocol.items.length !== 1 ? "S" : ""}`}
          </p>
        </div>
        <ProtocolSettingsDialog protocol={protocol}>
          <Button variant="outline" size="sm" className="font-mono text-xs">
            <Settings2 className="mr-2 h-3.5 w-3.5" />
            Settings
          </Button>
        </ProtocolSettingsDialog>
      </div>

      {/* Protocol Health Score */}
      {analysis ? <ProtocolHealthScore analysis={analysis} /> : null}

      {/* Protocol Builder */}
      <ProtocolBuilder
        protocol={protocol}
        supplements={supplements}
        stacks={userStacks}
      />
    </div>
  );
}
