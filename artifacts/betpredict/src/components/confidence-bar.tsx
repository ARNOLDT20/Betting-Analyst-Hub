interface ConfidenceBarProps {
  value: number;
  compact?: boolean;
}

export function ConfidenceBar({ value, compact = false }: ConfidenceBarProps) {
  const pct = Math.round(value * 100);
  const color = value >= 0.75 ? "bg-green-500" : value >= 0.5 ? "bg-amber-500" : "bg-red-500";
  const textColor = value >= 0.75 ? "text-green-400" : value >= 0.5 ? "text-amber-400" : "text-red-400";

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
