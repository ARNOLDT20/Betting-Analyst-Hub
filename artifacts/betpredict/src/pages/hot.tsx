import { useGetHotGames } from "@workspace/api-client-react";
import { Flame, Zap, TrendingUp, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MatchCard } from "@/components/match-card";
import { ConfidenceBar } from "@/components/confidence-bar";
import { PredictionBadge } from "@/components/prediction-badge";
import { Link } from "wouter";
import { formatNumber } from "@/lib/utils";

export default function HotPage() {
  const { data: hotGames, isLoading } = useGetHotGames({ limit: 20 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-accent/5 p-6">
        <div className="absolute -top-4 -right-4 opacity-10 pointer-events-none">
          <Flame className="w-40 h-40 text-accent" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-6 h-6 text-accent" />
            <h1 className="text-3xl font-bold text-white tracking-tight">Hot Games</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-lg">
            High-value fixtures with the strongest statistical edge. Filtered by value rating, confidence score, and market inefficiency.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">Value Rating 7+</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400 font-medium">High Confidence</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hot Games count */}
      {!isLoading && hotGames && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-accent/40 text-accent text-xs">
            <Flame className="w-3 h-3 mr-1" />
            {hotGames.length} Hot Picks Today
          </Badge>
        </div>
      )}

      {/* Featured Hot Game */}
      {!isLoading && hotGames && hotGames.length > 0 && (
        <Link href={`/matches/${hotGames[0].id}`}>
          <div className="rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/10 to-card p-5 cursor-pointer hover:border-accent/60 transition-all" data-testid={`featured-hot-${hotGames[0].id}`}>
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-accent" />
              <span className="text-xs text-accent font-bold tracking-wider uppercase">Featured Pick</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{hotGames[0].countryFlag} {hotGames[0].league}</p>
                <h2 className="text-2xl font-bold text-white">{hotGames[0].homeTeam}</h2>
                <p className="text-lg text-muted-foreground">vs {hotGames[0].awayTeam}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Value Rating</p>
                <p className="text-4xl font-black text-accent">{formatNumber(hotGames[0].valueRating, 1)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-3 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span className="text-xs">{fmtDate(hotGames[0].matchDate)} · {hotGames[0].matchTime} UTC</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <PredictionBadge prediction={hotGames[0].prediction} label={hotGames[0].predictionLabel} />
              <div className="flex gap-2">
                <OddsPill label="1" value={hotGames[0].homeWinOdds} active={hotGames[0].prediction === "home"} />
                <OddsPill label="X" value={hotGames[0].drawOdds} active={hotGames[0].prediction === "draw"} />
                <OddsPill label="2" value={hotGames[0].awayWinOdds} active={hotGames[0].prediction === "away"} />
              </div>
              <div className="flex-1 min-w-[120px]">
                <ConfidenceBar value={hotGames[0].confidenceScore} compact />
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* All Hot Games Grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">All Hot Picks</h2>
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full bg-muted rounded-xl" />
            ))}
          </div>
        ) : hotGames && hotGames.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {hotGames.slice(1).map(m => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl">
            <Flame className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-white font-medium">No hot games right now</p>
            <p className="text-muted-foreground text-sm mt-1">Check back soon — we update picks continuously</p>
          </div>
        )}
      </div>
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function OddsPill({ label, value, active }: { label: string; value: number; active: boolean }) {
  return (
    <div className={`px-3 py-1.5 rounded-lg border text-center ${active ? "bg-accent/20 border-accent/50" : "bg-background/50 border-border"}`}>
      <p className={`text-xs ${active ? "text-accent" : "text-muted-foreground"}`}>{label}</p>
      <p className={`text-base font-bold ${active ? "text-accent" : "text-white"}`}>{formatNumber(value, 2)}</p>
    </div>
  );
}
