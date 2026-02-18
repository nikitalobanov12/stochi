import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "~/server/db";
import { stack } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { checkInteractions } from "~/server/actions/interactions";
import { parseStackIntentParam } from "~/lib/ai/coach-deeplinks";
import {
  StackItemsProvider,
  type StackItemEntry,
} from "~/components/stacks/stack-items-context";
import { StackDetailClient } from "~/components/stacks/stack-detail-client";

export default async function StackDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ intent?: string | string[] }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const initialIntent = parseStackIntentParam(resolvedSearchParams.intent);
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

  // Check for interactions in this stack (with dosages for ratio checking)
  const supplementIds = userStack.items.map((item) => item.supplementId);
  const supplementsWithDosage = userStack.items.map((item) => ({
    id: item.supplementId,
    dosage: item.dosage,
    unit: item.unit,
  }));
  const { interactions, ratioWarnings } = await checkInteractions(
    supplementIds,
    supplementsWithDosage,
  );

  // Transform items to match StackItemEntry type
  const formattedItems: StackItemEntry[] = userStack.items.map((item) => ({
    id: item.id,
    stackId: userStack.id,
    supplementId: item.supplementId,
    dosage: item.dosage,
    unit: item.unit,
    supplement: {
      id: item.supplement.id,
      name: item.supplement.name,
      form: item.supplement.form,
      isResearchChemical: item.supplement.isResearchChemical,
      route: item.supplement.route,
    },
  }));

  return (
    <StackItemsProvider initialItems={formattedItems}>
      <StackDetailClient
        stack={{
          id: userStack.id,
          name: userStack.name,
        }}
        supplements={allSupplements}
        interactions={interactions}
        ratioWarnings={ratioWarnings}
        initialIntent={initialIntent}
      />
    </StackItemsProvider>
  );
}
