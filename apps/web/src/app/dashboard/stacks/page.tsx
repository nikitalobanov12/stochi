import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, Layers } from "lucide-react";

import { db } from "~/server/db";
import { stack } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { createStack } from "~/server/actions/stacks";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

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
          <p className="text-sm text-muted-foreground">
            Create and manage your supplement bundles
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Stack
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-mono">Create Stack</DialogTitle>
              <DialogDescription>
                Create a new supplement bundle for quick logging
              </DialogDescription>
            </DialogHeader>
            <form action={createStack} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Stack Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Morning Protocol"
                  required
                  className="font-mono"
                />
              </div>
              <Button type="submit" className="w-full">
                Create Stack
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {userStacks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Layers className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="mb-2 font-mono text-lg font-semibold">
              No stacks yet
            </h3>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Create your first stack to quickly log multiple supplements at
              once
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first stack
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-mono">Create Stack</DialogTitle>
                  <DialogDescription>
                    Create a new supplement bundle for quick logging
                  </DialogDescription>
                </DialogHeader>
                <form action={createStack} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name-empty">Stack Name</Label>
                    <Input
                      id="name-empty"
                      name="name"
                      placeholder="e.g., Morning Protocol"
                      required
                      className="font-mono"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Stack
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userStacks.map((s) => (
            <Link key={s.id} href={`/dashboard/stacks/${s.id}`}>
              <Card className="h-full transition-colors hover:border-primary/50">
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
                  <div className="text-xs text-muted-foreground">
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
