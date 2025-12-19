"use client";

import { useSupplementSheet } from "./supplement-sheet";

type SupplementData = {
  id: string;
  name: string;
  form: string | null;
  description: string | null;
  mechanism: string | null;
  researchUrl: string | null;
  category: string | null;
  commonGoals: string[] | null;
  defaultUnit: string | null;
};

type SupplementLinkProps = {
  supplement: SupplementData;
  children?: React.ReactNode;
  className?: string;
};

/**
 * Clickable supplement name that opens the info sheet
 * Use this anywhere you display a supplement name
 */
export function SupplementLink({
  supplement,
  children,
  className = "",
}: SupplementLinkProps) {
  const { openSheet } = useSupplementSheet();

  return (
    <button
      type="button"
      onClick={() => openSheet(supplement)}
      className={`cursor-pointer text-left underline-offset-2 hover:underline ${className}`}
    >
      {children ?? supplement.name}
    </button>
  );
}
