"use client";

import { useCallback } from "react";
import { LearnSection } from "~/components/learn";
import {
  askSupplementQuestion,
  type SupplementKnowledgeResult,
  type AskQuestionResult,
} from "~/server/actions/supplement-learn";

type LearnPageClientProps = {
  supplementId: string;
  initialKnowledge: SupplementKnowledgeResult;
};

export function LearnPageClient({
  supplementId,
  initialKnowledge,
}: LearnPageClientProps) {
  const handleAskQuestion = useCallback(
    async (question: string): Promise<AskQuestionResult> => {
      return askSupplementQuestion(supplementId, question);
    },
    [supplementId],
  );

  return (
    <LearnSection knowledge={initialKnowledge} onAskQuestion={handleAskQuestion} />
  );
}
