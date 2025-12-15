import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, Layers } from "lucide-react";

import { db } from "~/server/db";
import { stack } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { createStack } from "~/server/actions/stacks";
import { createStackFromTemplate } from "~/server/actions/onboarding";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold">Stacks</h1>
          <p className="text-muted-foreground text-sm">
            Create and manage your supplement bundles, easily log your entire
            stack at once
          </p>
        </div>
        <CreateStackDialog
          createStack={createStack}
          createStackFromTemplate={createStackFromTemplate}
        />
      </div>

      {userStacks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Layers className="text-muted-foreground/50 mb-4 h-16 w-16" />
            <h3 className="mb-2 font-mono text-lg font-semibold">
              No stacks yet
            </h3>
            <p className="text-muted-foreground mb-6 text-center text-sm">
              Create your first stack to quickly log multiple supplements at
              once
            </p>
            <CreateStackDialog
              createStack={createStack}
              createStackFromTemplate={createStackFromTemplate}
            >
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create your first stack
              </Button>
            </CreateStackDialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userStacks.map((s) => (
            <Link key={s.id} href={`/dashboard/stacks/${s.id}`}>
              <Card className="hover:border-primary/50 h-full transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-mono">{s.name}</CardTitle>
                    <Badge variant="secondary" className="font-mono">
                      {s.items.length} items
                    </Badge>
                  </div>
                  <CardDescription>
                    {s.items.length === 0
                      ? "No supplements added yet"
                      : s.items
                          .slice(0, 3)
                          .map((item) => item.supplement.name)
                          .join(", ") + (s.items.length > 3 ? "..." : "")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground text-xs">
                    Updated{" "}
                    {new Date(s.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
