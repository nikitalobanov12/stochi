import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  getSupplementBySlug,
  getSupplementKnowledge,
} from "~/server/actions/supplement-learn";
import { LearnPageClient } from "./client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LearnPage({ params }: PageProps) {
  const { slug } = await params;

  // Get supplement by slug
  const supplement = await getSupplementBySlug(slug);

  if (!supplement) {
    notFound();
  }

  // Prefetch knowledge data
  const knowledge = await getSupplementKnowledge(supplement.id);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Learn Content */}
      <LearnPageClient
        supplementId={supplement.id}
        initialKnowledge={knowledge}
      />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supplement = await getSupplementBySlug(slug);

  if (!supplement) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: `Learn: ${supplement.name} | Stochi`,
    description: `Research-backed information about ${supplement.name}`,
  };
}
