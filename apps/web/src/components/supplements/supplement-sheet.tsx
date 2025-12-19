"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { ExternalLink, Syringe, Thermometer, FlaskConical } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "~/components/ui/sheet";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

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
  // Peptide/research chemical fields
  isResearchChemical?: boolean;
  route?: string | null;
  storageInstructions?: string | null;
};

type SupplementSheetContextValue = {
  openSheet: (supplement: SupplementData) => void;
  closeSheet: () => void;
};

const SupplementSheetContext =
  createContext<SupplementSheetContextValue | null>(null);

export function useSupplementSheet() {
  const context = useContext(SupplementSheetContext);
  if (!context) {
    throw new Error(
      "useSupplementSheet must be used within SupplementSheetProvider",
    );
  }
  return context;
}

const categoryColors: Record<string, string> = {
  mineral: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  vitamin: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  "amino-acid": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  adaptogen: "bg-green-500/10 text-green-500 border-green-500/20",
  nootropic: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  antioxidant: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  omega: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  peptide: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  other: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const routeLabels: Record<string, string> = {
  oral: "Oral",
  subq_injection: "Subcutaneous Injection",
  im_injection: "Intramuscular Injection",
  intranasal: "Intranasal",
  transdermal: "Transdermal",
  topical: "Topical",
};

const goalLabels: Record<string, string> = {
  focus: "Focus",
  sleep: "Sleep",
  energy: "Energy",
  stress: "Stress",
  health: "Health",
  longevity: "Longevity",
};

export function SupplementSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [supplement, setSupplement] = useState<SupplementData | null>(null);

  const openSheet = useCallback((data: SupplementData) => {
    setSupplement(data);
    setIsOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <SupplementSheetContext.Provider value={{ openSheet, closeSheet }}>
      {children}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="overflow-y-auto">
          {supplement && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <SheetTitle className="font-mono text-lg">
                      {supplement.name}
                    </SheetTitle>
                    {supplement.form && (
                      <SheetDescription className="mt-1">
                        {supplement.form}
                      </SheetDescription>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {supplement.category && (
                      <Badge
                        variant="outline"
                        className={`shrink-0 ${categoryColors[supplement.category] ?? categoryColors.other}`}
                      >
                        {supplement.category}
                      </Badge>
                    )}
                    {supplement.isResearchChemical && (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-amber-500/20 bg-amber-500/10 text-amber-500"
                      >
                        <FlaskConical className="mr-1 h-3 w-3" />
                        Research Compound
                      </Badge>
                    )}
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Route & Storage Section (for peptides/research chemicals) */}
                {(supplement.route && supplement.route !== "oral") ||
                supplement.storageInstructions ? (
                  <div className="bg-muted/50 space-y-3 rounded-lg p-4">
                    {supplement.route && supplement.route !== "oral" && (
                      <div className="flex items-center gap-2 text-sm">
                        <Syringe className="h-4 w-4 text-violet-400" />
                        <span className="font-medium">Route:</span>
                        <span className="text-muted-foreground">
                          {routeLabels[supplement.route] ?? supplement.route}
                        </span>
                      </div>
                    )}
                    {supplement.storageInstructions && (
                      <div className="flex items-start gap-2 text-sm">
                        <Thermometer className="mt-0.5 h-4 w-4 text-blue-400" />
                        <span className="font-medium">Storage:</span>
                        <span className="text-muted-foreground">
                          {supplement.storageInstructions}
                        </span>
                      </div>
                    )}
                  </div>
                ) : null}
                {/* Mechanism Section */}
                {supplement.mechanism && (
                  <div className="space-y-2">
                    <h3 className="text-muted-foreground text-[10px] font-medium tracking-[0.2em] uppercase">
                      Mechanism
                    </h3>
                    <p className="text-sm leading-relaxed">
                      {supplement.mechanism}
                    </p>
                  </div>
                )}

                {/* Why Take It Section */}
                {supplement.description && (
                  <div className="space-y-2">
                    <h3 className="text-muted-foreground text-[10px] font-medium tracking-[0.2em] uppercase">
                      Why Take It
                    </h3>
                    <p className="text-sm leading-relaxed">
                      {supplement.description}
                    </p>
                  </div>
                )}

                {/* Goals Section */}
                {supplement.commonGoals &&
                  supplement.commonGoals.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-muted-foreground text-[10px] font-medium tracking-[0.2em] uppercase">
                        Common Goals
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {supplement.commonGoals.map((goal) => (
                          <Badge
                            key={goal}
                            variant="secondary"
                            className="text-xs"
                          >
                            {goalLabels[goal] ?? goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Research Link */}
                {supplement.researchUrl && (
                  <div className="border-t pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <a
                        href={supplement.researchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View on Examine.com
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </SupplementSheetContext.Provider>
  );
}
