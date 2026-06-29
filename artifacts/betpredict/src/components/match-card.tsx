import { Link } from "wouter";
import { Flame, Clock } from "lucide-react";
import { ConfidenceBar } from "./confidence-bar";
import { PredictionBadge } from "./prediction-badge";
import { formatNumber } from "@/lib/utils";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  country: string;
  countryFlag?: string | null;
  matchDate: string;
  matchTime: string;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeWinOdds: number;
  drawOdds: number;
  awayWinOdds: number;
  confidenceScore: number;
  prediction: string;
  predictionLabel: string;
  valueRating: number;
  isHot: boolean;
}

function formatMatchDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function MatchCard({ match: m }: { match: Match }) {
  return (
    <Link href={`/matches/${m.id}`}>
      <div
        className={`group rounded-xl border p-3 bg-card cursor-pointer transition-all hover:border-primary/40 hover:bg-card/80 ${m.isHot ? "border-accent/30 hover:border-accent/50" : "border-card-border"}`}
        data-testid={`match-card-${m.id}`}
      >
        {/* League header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{m.countryFlag}</span>
            <span className="text-xs text-muted-foreground">{m.league}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {m.isHot && <Flame className="w-3 h-3 text-accent" />}
            {m.status === "live" && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">LIVE</span>
              </div>
            )}
            {m.status === "upcoming" && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{formatMatchDate(m.matchDate)} · {m.matchTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Teams and Score */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{m.homeTeam}</p>
            <p className="text-sm text-muted-foreground truncate">{m.awayTeam}</p>
          </div>
          {m.status === "finished" || m.status === "live" ? (
            <div className="text-center mx-3">
              <span className="text-xl font-bold text-white">{m.homeScore ?? 0} - {m.awayScore ?? 0}</span>
            </div>
          ) : (
            <div className="flex gap-1 mx-2 shrink-0">
              <OddsChip label="1" value={m.homeWinOdds} active={m.prediction === "home"} />
              <OddsChip label="X" value={m.drawOdds} active={m.prediction === "draw"} />
              <OddsChip label="2" value={m.awayWinOdds} active={m.prediction === "away"} />
            </div>
          )}
        </div>

        {/* Prediction and Confidence */}
        <div className="flex items-center gap-2">
          <PredictionBadge prediction={m.prediction} label={m.predictionLabel} />
          <div className="flex-1">
            <ConfidenceBar value={m.confidenceScore} compact />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">Val: <span className="text-white font-medium">{formatNumber(m.valueRating, 1)}</span></span>
        </div>
      </div>
    </Link>
  );
}

function OddsChip({ label, value, active }: { label: string; value: number; active: boolean }) {
  return (
    <div className={`flex flex-col items-center px-1.5 py-1 rounded text-center min-w-[32px] ${active ? "bg-primary/20 border border-primary/40" : "bg-background/60 border border-border"}`}>
      <span className={`text-xs ${active ? "text-primary font-bold" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-xs font-bold ${active ? "text-primary" : "text-white"}`}>{formatNumber(value, 2)}</span>
    </div>
  );
}
