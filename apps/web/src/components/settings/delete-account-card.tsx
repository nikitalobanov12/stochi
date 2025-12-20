"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { authClient } from "~/server/better-auth/client";

type DeleteAccountCardProps = {
  logCount: number;
  stackCount: number;
};

export function DeleteAccountCard({
  logCount,
  stackCount,
}: DeleteAccountCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const canDelete = confirmText.toLowerCase() === "delete my account";

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await authClient.deleteUser({
        callbackURL: "/?deleted=true",
      });

      if (result.error) {
        setError(result.error.message ?? "Failed to delete account");
        return;
      }

      // Redirect happens via callbackURL, but just in case:
      router.push("/?deleted=true");
    });
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2 font-mono">
          <Trash2 className="h-4 w-4" />
          Delete Account
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="text-destructive h-5 w-5" />
                Delete your account?
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 pt-2">
                  <p>
                    This action is <strong>permanent and cannot be undone</strong>.
                    All your data will be deleted immediately.
                  </p>

                  <div className="bg-destructive/10 rounded-md p-3 text-sm">
                    <p className="text-destructive font-medium">
                      The following will be permanently deleted:
                    </p>
                    <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1">
                      <li>Your profile and account settings</li>
                      <li>
                        {logCount} supplement log{logCount !== 1 ? "s" : ""}
                      </li>
                      <li>
                        {stackCount} stack{stackCount !== 1 ? "s" : ""}
                      </li>
                      <li>Your goals and preferences</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="confirm-delete"
                      className="text-foreground text-sm font-medium"
                    >
                      Type{" "}
                      <span className="bg-muted rounded px-1 font-mono text-xs">
                        delete my account
                      </span>{" "}
                      to confirm:
                    </label>
                    <input
                      id="confirm-delete"
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                      placeholder="delete my account"
                      disabled={isPending}
                    />
                  </div>

                  {error && (
                    <p className="text-destructive text-sm">{error}</p>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  setConfirmText("");
                  setError(null);
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!canDelete || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Account"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
