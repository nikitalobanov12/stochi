import { redirect } from "next/navigation";
import { Settings2 } from "lucide-react";

import { getSession } from "~/server/better-auth/server";
import { getOrCreateProtocol } from "~/server/actions/protocol";
import { db } from "~/server/db";
import { ProtocolBuilder } from "~/components/protocol/protocol-builder";
import { ProtocolSettingsDialog } from "~/components/protocol/protocol-settings-dialog";
import { Button } from "~/components/ui/button";

export default async function ProtocolPage() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  // Get or create the user's protocol
  const protocol = await getOrCreateProtocol();

  // Fetch all supplements for the search
  const supplements = await db.query.supplement.findMany({
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
    },
    orderBy: (s, { asc }) => [asc(s.name)],
  });

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

      {/* Protocol Builder */}
      <ProtocolBuilder protocol={protocol} supplements={supplements} />
    </div>
  );
}
