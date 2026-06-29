import { toSafeNumber } from "@/lib/utils";

interface ConfidenceBarProps {
  value: number | null | undefined;
  compact?: boolean;
}

export function ConfidenceBar({ value, compact = false }: ConfidenceBarProps) {
  const normalizedValue = toSafeNumber(value);
  const pct = Math.round(normalizedValue * 100);
  const color = normalizedValue >= 0.75 ? "bg-green-500" : normalizedValue >= 0.5 ? "bg-amber-500" : "bg-red-500";
  const textColor = normalizedValue >= 0.75 ? "text-green-400" : normalizedValue >= 0.5 ? "text-amber-400" : "text-red-400";

  if (compact) {
    return (
      <div className="flex items-center gap-1" data-testid="confidence-bar-compact">
        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-xs font-semibold ${textColor}`}>{pct}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-1" data-testid="confidence-bar">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Confidence</span>
        <span className={`text-xs font-bold ${textColor}`}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
