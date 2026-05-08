import { useGetBetOfTheDay, useRegenerateBetOfTheDay, getGetBetOfTheDayQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Target, RefreshCw, CheckCircle2, TrendingUp, Clock, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PredictionBadge } from "@/components/prediction-badge";
import { ConfidenceBar } from "@/components/confidence-bar";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function BetOfTheDayPage() {
  const { data: botd, isLoading } = useGetBetOfTheDay();
  const regenerate = useRegenerateBetOfTheDay();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  function handleRegenerate() {
    regenerate.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBetOfTheDayQueryKey() });
        toast({ title: "Bet of the Day regenerated", description: "New selections have been computed." });
      },
    });
  }

  const totalOdds = botd?.totalOdds ?? 0;
  const avgConf = botd?.averageConfidence ?? 0;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-white tracking-tight">Bet of the Day</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            AI-generated multi-bet combining the highest-confidence picks of the day.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          disabled={regenerate.isPending}
          className="border-border text-white hover:text-primary gap-2"
          data-testid="button-regenerate-botd"
        >
          <RefreshCw className={`w-4 h-4 ${regenerate.isPending ? "animate-spin" : ""}`} />
          Regenerate
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full bg-muted rounded-2xl" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full bg-muted rounded-xl" />)}
        </div>
      ) : botd ? (
        <div className="space-y-5">
          {/* Summary Card */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Combined Odds</p>
                <p className="text-4xl font-black text-primary">{totalOdds.toFixed(2)}x</p>
              </div>
              <div className="text-center border-x border-border">
                <p className="text-xs text-muted-foreground mb-1">Avg Confidence</p>
                <p className="text-4xl font-black text-white">{(avgConf * 100).toFixed(0)}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Selections</p>
                <p className="text-4xl font-black text-white">{botd.selections.length}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-background/40 border border-border">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{botd.analysisNote}</p>
            </div>

            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Generated: {new Date(botd.generatedAt).toLocaleString()}
            </p>
          </div>

          {/* Selections */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Selected Matches
            </h2>
            <div className="space-y-3">
              {botd.selections.map((s, i) => (
                <Link key={s.matchId} href={`/matches/${s.matchId}`}>
                  <Card className="bg-card border-card-border hover:border-primary/40 cursor-pointer transition-all" data-testid={`selection-card-${i}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs text-muted-foreground">{s.league}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{s.country}</span>
                          </div>
                          <p className="text-base font-semibold text-white">{s.homeTeam} vs {s.awayTeam}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{s.matchDate} {s.matchTime}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <PredictionBadge prediction={s.prediction} label={s.predictionLabel} />
                          <p className="text-2xl font-bold text-primary mt-1">{s.odds.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <ConfidenceBar value={s.confidenceScore} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-white">Disclaimer:</span> Predictions are based on statistical models. Betting involves risk. Past performance does not guarantee future results. Please bet responsibly.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl">
          <Target className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-white font-medium">No bet of the day yet</p>
          <Button variant="outline" size="sm" onClick={handleRegenerate} className="mt-4" data-testid="button-generate-botd">
            Generate Now
          </Button>
        </div>
      )}
    </div>
  );
}
