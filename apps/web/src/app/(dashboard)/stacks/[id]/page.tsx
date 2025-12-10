import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Trash2, Plus } from "lucide-react";

import { db } from "~/server/db";
import { stack } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import {
  updateStack,
  deleteStack,
  addStackItem,
  removeStackItem,
  logStack,
} from "~/server/actions/stacks";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

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

  const logStackWithId = logStack.bind(null, userStack.id);
  const deleteStackWithId = deleteStack.bind(null, userStack.id);
  const updateStackWithId = updateStack.bind(null, userStack.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/stacks">
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Supplement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-mono">
                        Add Supplement
                      </DialogTitle>
                      <DialogDescription>
                        Add a supplement to this stack
                      </DialogDescription>
                    </DialogHeader>
                    <AddSupplementForm
                      stackId={userStack.id}
                      supplements={allSupplements}
                    />
                  </DialogContent>
                </Dialog>
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

function AddSupplementForm({
  stackId,
  supplements,
}: {
  stackId: string;
  supplements: Array<{ id: string; name: string; form: string | null }>;
}) {
  async function handleSubmit(formData: FormData) {
    "use server";
    const supplementId = formData.get("supplementId") as string;
    const dosage = parseFloat(formData.get("dosage") as string);
    const unit = formData.get("unit") as "mg" | "mcg" | "g" | "IU" | "ml";

    if (!supplementId || isNaN(dosage) || !unit) {
      throw new Error("Invalid form data");
    }

    await addStackItem(stackId, supplementId, dosage, unit);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="supplementId">Supplement</Label>
        <Select name="supplementId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a supplement" />
          </SelectTrigger>
          <SelectContent>
            {supplements.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {s.form && (
                  <span className="ml-2 text-muted-foreground">({s.form})</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dosage">Dosage</Label>
          <Input
            id="dosage"
            name="dosage"
            type="number"
            step="0.01"
            min="0"
            placeholder="200"
            required
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Select name="unit" defaultValue="mg">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mg">mg</SelectItem>
              <SelectItem value="mcg">mcg</SelectItem>
              <SelectItem value="g">g</SelectItem>
              <SelectItem value="IU">IU</SelectItem>
              <SelectItem value="ml">ml</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full">
        Add to Stack
      </Button>
    </form>
  );
}
