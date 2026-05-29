// status-dot.tsx — src/components/shared/status-dot.tsx — 2026-05-27
// Componente semáforo: punto circular de color verde/amarillo/rojo

import { cn } from "@/lib/utils";
import type { TrafficLight } from "@/lib/utils";

interface StatusDotProps {
  status: TrafficLight;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const DOT_CLASSES: Record<TrafficLight, string> = {
  green: "bg-green-500 ring-2 ring-green-200",
  yellow: "bg-yellow-500 ring-2 ring-yellow-200",
  red: "bg-red-400 ring-2 ring-red-200",
};

const SIZE_CLASSES = {
  sm: "w-2.5 h-2.5",
  md: "w-3.5 h-3.5",
};

export function StatusDot({ status, label, size = "md", className }: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "rounded-full shrink-0",
          SIZE_CLASSES[size],
          DOT_CLASSES[status]
        )}
      />
      {label && (
        <span className="text-xs text-(--sas-text-muted)">{label}</span>
      )}
    </span>
  );
}
