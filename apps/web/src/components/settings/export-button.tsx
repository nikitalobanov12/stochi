"use client";

import { Download } from "lucide-react";
import { Button } from "~/components/ui/button";

type ExportData = {
  logs: Array<{
    id: string;
    dosage: number;
    unit: string;
    loggedAt: string;
    supplement: { name: string; form: string | null };
  }>;
  stacks: Array<{
    id: string;
    name: string;
    items: Array<{
      dosage: number;
      unit: string;
      supplement: { name: string; form: string | null };
    }>;
  }>;
};

export function ExportButton({
  data,
  format,
}: {
  data: ExportData;
  format: "json" | "csv";
}) {
  function handleExport() {
    let content: string;
    let mimeType: string;

    if (format === "json") {
      content = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          logs: data.logs.map((l) => ({
            supplement: l.supplement.name,
            form: l.supplement.form,
            dosage: l.dosage,
            unit: l.unit,
            loggedAt: l.loggedAt,
          })),
          stacks: data.stacks.map((s) => ({
            name: s.name,
            items: s.items.map((i) => ({
              supplement: i.supplement.name,
              form: i.supplement.form,
              dosage: i.dosage,
              unit: i.unit,
            })),
          })),
        },
        null,
        2,
      );
      mimeType = "application/json";
    } else {
      // CSV format
      const logLines = [
        "type,name,form,dosage,unit,logged_at",
        ...data.logs.map(
          (l) =>
            `log,"${l.supplement.name}","${l.supplement.form ?? ""}",${l.dosage},${l.unit},${l.loggedAt}`,
        ),
      ];

      const stackLines = data.stacks.flatMap((s) =>
        s.items.map(
          (i) =>
            `stack_item,"${i.supplement.name}","${i.supplement.form ?? ""}",${i.dosage},${i.unit},"${s.name}"`,
        ),
      );

      content = [...logLines, ...stackLines].join("\n");
      mimeType = "text/csv";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const filename = `stochi-export-${new Date().toISOString().split("T")[0]}.${format}`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" className="font-mono" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Export {format.toUpperCase()}
    </Button>
  );
}
