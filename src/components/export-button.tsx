"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const formats = [
  { value: "xlsx", label: "Excel (.xlsx)", icon: "📊" },
  { value: "docx", label: "Word (.docx)", icon: "📝" },
  { value: "pptx", label: "PowerPoint (.pptx)", icon: "📈" },
  { value: "pdf-summary", label: "PDF Summary", icon: "📄" },
  { value: "pdf-visual", label: "PDF Visual Report", icon: "📊" },
];

interface ExportButtonProps {
  clientId?: number;
  status?: string;
  search?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExportButton({
  clientId,
  status,
  search,
  variant = "outline",
  size = "sm",
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport(format: string) {
    setExporting(true);
    try {
      const params = new URLSearchParams({ format });
      if (clientId) params.set("clientId", String(clientId));
      if (status && status !== "all") params.set("status", status);
      if (search) params.set("search", search);

      const res = await fetch(`/api/leads/export?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Export failed" }));
        throw new Error(err.error || "Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+?)"/);
      a.href = url;
      a.download = match ? match[1] : `leads.${format === "docx" ? "docx" : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={exporting}>
          {exporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.map((fmt) => (
          <DropdownMenuItem
            key={fmt.value}
            onClick={() => handleExport(fmt.value)}
          >
            <span className="mr-2">{fmt.icon}</span>
            {fmt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
