import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, Layers, ChevronRight } from "lucide-react";

import { db } from "~/server/db";
import { stack } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { createStack } from "~/server/actions/stacks";
import { createStackFromTemplate } from "~/server/actions/onboarding";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { CreateStackDialog } from "~/components/stacks/create-stack-dialog";

export default async function StacksPage() {
  const session = await getSession();
  if (!session) return null;

  const userStacks = await db.query.stack.findMany({
    where: eq(stack.userId, session.user.id),
    with: {
      items: {
        with: {
          supplement: true,
        },
      },
    },
    orderBy: [desc(stack.updatedAt)],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-medium tracking-tight">
            Protocols
          </h1>
          <p className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
            {userStacks.length === 0
              ? "NO PROTOCOLS"
              : `${userStacks.length} PROTOCOL${userStacks.length !== 1 ? "S" : ""}`}
          </p>
        </div>
        <CreateStackDialog
          createStack={createStack}
          createStackFromTemplate={createStackFromTemplate}
        />
      </div>

      {/* Stacks List */}
      {userStacks.length === 0 ? (
        <div className="glass-card border-dashed py-16 text-center">
          <Layers className="text-muted-foreground/30 mx-auto mb-4 h-10 w-10" />
          <p className="text-muted-foreground font-mono text-sm">
            No protocols yet
          </p>
          <p className="text-muted-foreground/60 mt-1 font-mono text-[10px]">
            Create your first protocol to batch-log supplements
          </p>
          <CreateStackDialog
            createStack={createStack}
            createStackFromTemplate={createStackFromTemplate}
          >
            <Button
              variant="outline"
              size="sm"
              className="border-border/40 mt-6 font-mono text-xs"
            >
              <Plus className="mr-2 h-3 w-3" />
              Create Protocol
            </Button>
          </CreateStackDialog>
        </div>
      ) : (
        <div className="space-y-2">
          {userStacks.map((s) => (
            <Link key={s.id} href={`/dashboard/stacks/${s.id}`}>
              <div className="group glass-card flex items-center justify-between px-4 py-3 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium">
                      {s.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-muted/50 font-mono text-[10px] tabular-nums"
                    >
                      {s.items.length}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground/60 mt-0.5 truncate font-mono text-[10px]">
                    {s.items.length === 0
                      ? "Empty protocol"
                      : s.items
                          .slice(0, 3)
                          .map((item) => item.supplement.name)
                          .join(" • ") + (s.items.length > 3 ? " ..." : "")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-muted-foreground/40 font-mono text-[10px]">
                    {new Date(s.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <ChevronRight className="text-muted-foreground/40 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
