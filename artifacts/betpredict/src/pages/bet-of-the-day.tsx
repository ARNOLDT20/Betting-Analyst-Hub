import { useState } from "react";
import { useGetBetOfTheDay, useRegenerateBetOfTheDay, getGetBetOfTheDayQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Target, RefreshCw, CheckCircle2, Clock, Info, Zap, TrendingUp,
  Calendar, DollarSign, ChevronRight, Flame, Shield
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { PredictionBadge } from "@/components/prediction-badge";
import { ConfidenceBar } from "@/components/confidence-bar";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { formatNumber, formatPercentValue, toArray } from "@/lib/utils";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function confidenceColor(v: number | null | undefined) {
  const value = typeof v === "number" && Number.isFinite(v) ? v : 0;
  if (value >= 0.75) return "text-green-400";
  if (value >= 0.5) return "text-amber-400";
  return "text-red-400";
}

function OddsChain({ selections }: { selections: Array<{ odds: number; homeTeam: string; awayTeam: string }> }) {
  let running = 1;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {selections.map((s, i) => {
        running *= s.odds;
        return (
          <div key={i} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground leading-none mb-0.5 truncate max-w-[60px]">{s.homeTeam.split(" ").slice(-1)[0]}</span>
              <span className="text-sm font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">{formatNumber(s.odds, 2)}</span>
            </div>
            {i < selections.length - 1 && <span className="text-muted-foreground text-xs font-bold">×</span>}
          </div>
        );
      })}
      <div className="flex items-center gap-1 ml-1">
        <span className="text-muted-foreground text-xs font-bold">=</span>
        <span className="text-lg font-black text-accent">{formatNumber(running, 2)}x</span>
      </div>
    </div>
  );
}

export default function BetOfTheDayPage() {
  const { data: botd, isLoading } = useGetBetOfTheDay();
  const regenerate = useRegenerateBetOfTheDay();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [stake, setStake] = useState("10");

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
  const stakeNum = parseFloat(stake) || 0;
  const potentialReturn = stakeNum * totalOdds;
  const profit = potentialReturn - stakeNum;

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const selections = toArray(botd?.selections);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-white tracking-tight">Bet of the Day</h1>
          </div>
          <p className="text-muted-foreground text-sm flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> {today}
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
          <Skeleton className="h-56 w-full bg-muted rounded-2xl" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full bg-muted rounded-xl" />)}
        </div>
      ) : botd ? (
        <div className="space-y-5">

          {/* Bet Slip Ticket */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card">
            {/* Ticket top band */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-60" />

            {/* Watermark */}
            <div className="absolute -right-6 -top-6 opacity-5 pointer-events-none">
              <Target className="w-40 h-40 text-primary" />
            </div>

            <div className="p-5 relative">
              {/* Ticket header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 border border-primary/30">
                  <Zap className="w-3 h-3 text-primary" />
                  <span className="text-xs font-bold text-primary tracking-wider uppercase">AI Multi-Bet</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/40 border border-border">
                  <Shield className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{selections.length} Legs</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl bg-background/60 border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Combined Odds</p>
                  <p className="text-3xl font-black text-primary">{formatNumber(totalOdds, 2)}<span className="text-lg">x</span></p>
                </div>
                <div className="rounded-xl bg-background/60 border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Avg Confidence</p>
                  <p className={`text-3xl font-black ${confidenceColor(avgConf)}`}>{formatPercentValue(avgConf, 0)}<span className="text-lg">%</span></p>
                </div>
                <div className="rounded-xl bg-background/60 border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Value Score</p>
                  <p className="text-3xl font-black text-accent">{formatNumber(avgConf * totalOdds, 1)}</p>
                </div>
              </div>

              {/* Odds chain */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Odds Multiplier Chain</p>
                <OddsChain selections={selections} />
              </div>

              {/* Dotted separator (ticket perforation style) */}
              <div className="flex items-center gap-1 my-4 -mx-5">
                <div className="w-4 h-4 rounded-full bg-background border-r-0 border border-border" />
                <div className="flex-1 border-t border-dashed border-border" />
                <div className="w-4 h-4 rounded-full bg-background border-l-0 border border-border" />
              </div>

              {/* Payout Calculator */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Payout Calculator</p>
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Stake ($)</label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={stake}
                      onChange={e => setStake(e.target.value)}
                      className="bg-background/60 border-border text-white h-9 text-sm"
                    />
                  </div>
                  <div className="rounded-lg bg-background/60 border border-border p-2 text-center">
                    <p className="text-xs text-muted-foreground leading-none mb-1">Return</p>
                    <p className="text-lg font-bold text-white">${formatNumber(potentialReturn, 2)}</p>
                  </div>
                  <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-2 text-center">
                    <p className="text-xs text-green-400 leading-none mb-1">Profit</p>
                    <p className="text-lg font-bold text-green-400">+${formatNumber(profit, 2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis note */}
            <div className="border-t border-border/60 px-5 py-3 bg-background/30 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{botd.analysisNote}</p>
            </div>
          </div>

          {/* Selections */}
          <div>
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Selections ({selections.length} legs)
            </h2>
            <div className="space-y-2">
              {selections.map((s, i) => (
                <Link key={s.matchId} href={`/matches/${s.matchId}`}>
                  <div
                    className="group flex items-stretch gap-0 rounded-xl border border-card-border hover:border-primary/40 bg-card cursor-pointer transition-all overflow-hidden"
                    data-testid={`selection-card-${i}`}
                  >
                    {/* Leg number strip */}
                    <div className="flex items-center justify-center w-8 bg-primary/10 border-r border-primary/20 shrink-0">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>

                    <div className="flex-1 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* League + date */}
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="text-xs text-muted-foreground">{s.country}</span>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="text-xs text-muted-foreground truncate">{s.league}</span>
                            <span className="text-muted-foreground/40">·</span>
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{fmtDate(s.matchDate)} {s.matchTime}</span>
                          </div>
                          {/* Teams */}
                          <p className="text-sm font-semibold text-white">{s.homeTeam} <span className="text-muted-foreground font-normal">vs</span> {s.awayTeam}</p>
                          {/* Confidence bar */}
                          <div className="mt-2">
                            <ConfidenceBar value={s.confidenceScore} />
                          </div>
                        </div>

                        {/* Right: prediction + odds */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <PredictionBadge prediction={s.prediction} label={s.predictionLabel} />
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Odds</span>
                            <span className="text-xl font-black text-primary">{formatNumber(s.odds, 2)}</span>
                          </div>
                          <span className={`text-xs font-semibold ${confidenceColor(s.confidenceScore)}`}>
                            {formatPercentValue(s.confidenceScore, 0)} conf
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center pr-2 text-muted-foreground group-hover:text-primary transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Generated at + Disclaimer */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Generated: {new Date(botd.generatedAt).toLocaleString()}
            </p>
            <div className="rounded-lg border border-border bg-card/50 p-4">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-white">Disclaimer:</span> Predictions are based on statistical models using Poisson distribution analysis. Betting involves risk. Past performance does not guarantee future results. Please bet responsibly.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl">
          <Target className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-white font-medium">No bet of the day yet</p>
          <p className="text-sm text-muted-foreground mb-4">Click generate to compute AI selections from today's fixtures</p>
          <Button variant="outline" size="sm" onClick={handleRegenerate} className="gap-2" data-testid="button-generate-botd">
            <Flame className="w-4 h-4 text-accent" /> Generate Now
          </Button>
        </div>
      )}
    </div>
  );
}
