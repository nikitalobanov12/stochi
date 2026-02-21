"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";

import { useDemoContext } from "~/components/demo/demo-provider";

type DemoSupplement = {
  id: string;
  name: string;
  form: string | null;
  defaultUnit: string | null;
};

type DemoCommandBarProps = {
  supplements: DemoSupplement[];
};

export function DemoCommandBar({ supplements }: DemoCommandBarProps) {
  const demo = useDemoContext();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLogging, setIsLogging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter supplements based on query
  const filteredSupplements = query.trim()
    ? supplements.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  // Parse dosage from query (e.g., "mag 400" or "vitamin d 5000")
  function parseDosage(q: string): { name: string; dosage: number | null } {
    const parts = q.trim().split(/\s+/);
    const lastPart = parts[parts.length - 1];
    const dosageMatch = lastPart?.match(/^(\d+)(mg|mcg|iu|g|ml)?$/i);

    if (dosageMatch) {
      return {
        name: parts.slice(0, -1).join(" "),
        dosage: parseInt(dosageMatch[1]!, 10),
      };
    }

    return { name: q, dosage: null };
  }

  // Handle keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || filteredSupplements.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredSupplements.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSupplements.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredSupplements[selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  // Handle supplement selection
  function handleSelect(supplement: DemoSupplement) {
    const { dosage } = parseDosage(query);
    const finalDosage = dosage ?? 100; // Default dosage
    const unit = supplement.defaultUnit ?? "mg";

    setIsLogging(true);
    demo.addLog(supplement.id, finalDosage, unit, {
      name: supplement.name,
      category: null,
    });

    // Reset state
    setTimeout(() => {
      setQuery("");
      setIsOpen(false);
      setIsLogging(false);
      setSelectedIndex(0);
    }, 200);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open dropdown is handled inline in onChange and onFocus

  return (
    <div ref={containerRef} className="relative">
      <div className="bg-card border-border focus-within:ring-ring/40 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-[var(--elevation-1)] transition-shadow focus-within:ring-2">
        {isLogging ? (
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
        ) : (
          <Search className="text-muted-foreground h-4 w-4" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const newQuery = e.target.value;
            setQuery(newQuery);
            if (newQuery.trim()) {
              setIsOpen(true);
              setSelectedIndex(0);
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Log supplement... (e.g., 'mag 400mg')"
          className="text-foreground placeholder:text-muted-foreground/70 flex-1 bg-transparent text-sm outline-none"
          disabled={isLogging}
        />
        {query && (
          <span className="text-muted-foreground hidden text-xs sm:inline">
            Press Enter to log
          </span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && filteredSupplements.length > 0 && (
        <div className="bg-popover border-border absolute top-full right-0 left-0 z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border shadow-[var(--elevation-2)]">
          {filteredSupplements.slice(0, 8).map((supplement, index) => (
            <button
              key={supplement.id}
              type="button"
              onClick={() => handleSelect(supplement)}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors ${
                index === selectedIndex
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <div>
                <span className="text-sm">{supplement.name}</span>
                {supplement.form && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    ({supplement.form})
                  </span>
                )}
              </div>
              <span className="text-muted-foreground font-mono text-xs">
                {supplement.defaultUnit ?? "mg"}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && query.trim() && filteredSupplements.length === 0 && (
        <div className="bg-popover text-muted-foreground border-border absolute top-full right-0 left-0 z-50 mt-2 rounded-xl border px-4 py-3 text-center text-sm">
          No supplements found
        </div>
      )}
    </div>
  );
}
