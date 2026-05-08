import { Badge } from "@/components/ui/badge";

const predictionConfig: Record<string, { bg: string; text: string; short: string }> = {
  home: { bg: "bg-blue-500/20 border-blue-500/40", text: "text-blue-300", short: "HOME" },
  away: { bg: "bg-purple-500/20 border-purple-500/40", text: "text-purple-300", short: "AWAY" },
  draw: { bg: "bg-gray-500/20 border-gray-500/40", text: "text-gray-300", short: "DRAW" },
  btts: { bg: "bg-green-500/20 border-green-500/40", text: "text-green-300", short: "BTTS" },
  over25: { bg: "bg-orange-500/20 border-orange-500/40", text: "text-orange-300", short: "O2.5" },
  home_or_draw: { bg: "bg-cyan-500/20 border-cyan-500/40", text: "text-cyan-300", short: "1X" },
  away_or_draw: { bg: "bg-pink-500/20 border-pink-500/40", text: "text-pink-300", short: "X2" },
};

interface PredictionBadgeProps {
  prediction: string;
  label: string;
  small?: boolean;
}

export function PredictionBadge({ prediction, label, small = false }: PredictionBadgeProps) {
  const cfg = predictionConfig[prediction] ?? predictionConfig.draw;
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded border text-xs font-bold tracking-wide ${cfg.bg} ${cfg.text}`}
      data-testid={`prediction-badge-${prediction}`}
    >
      {small ? cfg.short : label}
    </span>
  );
}
