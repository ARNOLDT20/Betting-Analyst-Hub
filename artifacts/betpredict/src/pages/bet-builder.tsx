import { useState, useMemo } from "react";
import { useListMatches, useListLeagues } from "@workspace/api-client-react";
import {
  Hammer, Plus, X, Trash2, Calculator, ChevronRight, Clock,
  Search, Flame, TrendingUp, DollarSign, Zap, CheckCircle2, Info
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PredictionBadge } from "@/components/prediction-badge";
import { ConfidenceBar } from "@/components/confidence-bar";
import { Link } from "wouter";
import { useDebounce } from "@/hooks/use-debounce";
import { formatNumber, formatPercentValue, toSafeNumber } from "@/lib/utils";

type Prediction = "home" | "draw" | "away" | "btts" | "over25";

interface SlipSelection {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  country: string;
  countryFlag: string;
  matchDate: string;
  matchTime: string;
  prediction: Prediction;
  odds: number;
  confidenceScore: number;
  homeWinOdds: number;
  drawOdds: number;
  awayWinOdds: number;
  predictionLabel: string;
  isHot: boolean;
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function getOddsForPrediction(
  pred: Prediction,
  homeWinOdds: number,
  drawOdds: number,
  awayWinOdds: number
): number {
  switch (pred) {
    case "home": return homeWinOdds;
    case "draw": return drawOdds;
    case "away": return awayWinOdds;
    case "btts": return 1.75;
    case "over25": return 1.85;
  }
}

const PRED_LABELS: Record<Prediction, string> = {
  home: "Home Win",
  draw: "Draw",
  away: "Away Win",
  btts: "BTTS",
  over25: "Over 2.5",
};

function confidenceColor(v: number | null | undefined) {
  const value = toSafeNumber(v, 0);
  if (value >= 0.75) return "text-green-400";
  if (value >= 0.5) return "text-amber-400";
  return "text-red-400";
}

export default function BetBuilderPage() {
  const [slip, setSlip] = useState<SlipSelection[]>([]);
  const [stake, setStake] = useState("10");
  const [search, setSearch] = useState("");
  const [leagueId, setLeagueId] = useState("all");
  const [activeTab, setActiveTab] = useState<"browse" | "slip">("browse");

  const debouncedSearch = useDebounce(search, 300);
  const { data: matchData, isLoading } = useListMatches({
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(leagueId !== "all" ? { leagueId } : {}),
    status: "upcoming",
    limit: 30,
  });
  const { data: leagues } = useListLeagues();
  const matches = matchData?.matches ?? [];

  const inSlip = useMemo(() => new Set(slip.map(s => s.matchId)), [slip]);
  const combinedOdds = slip.reduce((acc, s) => acc * toSafeNumber(s.odds, 1), 1);
  const stakeNum = parseFloat(stake) || 0;
  const potentialReturn = stakeNum * combinedOdds;
  const profit = potentialReturn - stakeNum;

  function addToSlip(m: typeof matches[0]) {
    if (inSlip.has(m.id)) return;
    const sel: SlipSelection = {
      matchId: m.id,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      league: m.league,
      country: m.country,
      countryFlag: m.countryFlag ?? "",
      matchDate: m.matchDate,
      matchTime: m.matchTime,
      prediction: m.prediction as Prediction,
      odds: m.prediction === "home" ? m.homeWinOdds : m.prediction === "away" ? m.awayWinOdds : m.drawOdds,
      confidenceScore: m.confidenceScore,
      homeWinOdds: m.homeWinOdds,
      drawOdds: m.drawOdds,
      awayWinOdds: m.awayWinOdds,
      predictionLabel: m.predictionLabel,
      isHot: m.isHot,
    };
    setSlip(prev => [...prev, sel]);
  }

  function removeFromSlip(matchId: string) {
    setSlip(prev => prev.filter(s => s.matchId !== matchId));
  }

  function changePrediction(matchId: string, pred: Prediction) {
    setSlip(prev => prev.map(s => {
      if (s.matchId !== matchId) return s;
      return {
        ...s,
        prediction: pred,
        predictionLabel: PRED_LABELS[pred],
        odds: getOddsForPrediction(pred, s.homeWinOdds, s.drawOdds, s.awayWinOdds),
      };
    }));
  }

  function clearSlip() {
    setSlip([]);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Hammer className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-white tracking-tight">Bet Builder</h1>
          </div>
          <p className="text-muted-foreground text-sm">Pick matches, choose your predictions, and build a custom multi-bet.</p>
        </div>
        {slip.length > 0 && (
          <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">
            {slip.length} {slip.length === 1 ? "leg" : "legs"} · {formatNumber(combinedOdds, 2)}x
          </Badge>
        )}
      </div>

      {/* Mobile Tabs */}
      <div className="flex gap-2 md:hidden">
        <Button
          variant={activeTab === "browse" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("browse")}
          className="flex-1 gap-1"
        >
          <Search className="w-4 h-4" /> Browse Matches
        </Button>
        <Button
          variant={activeTab === "slip" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("slip")}
          className="flex-1 gap-1 relative"
        >
          <Calculator className="w-4 h-4" /> My Slip
          {slip.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-[10px] font-bold text-white flex items-center justify-center">{slip.length}</span>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

        {/* Left: Match Browser */}
        <div className={`space-y-4 ${activeTab === "slip" ? "hidden md:block" : ""}`}>
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search teams, leagues…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-card border-card-border text-white placeholder:text-muted-foreground h-9"
              />
            </div>
            <Select value={leagueId} onValueChange={setLeagueId}>
              <SelectTrigger className="w-44 bg-card border-card-border text-white h-9">
                <SelectValue placeholder="All Leagues" />
              </SelectTrigger>
              <SelectContent className="bg-card border-card-border">
                <SelectItem value="all">All Leagues</SelectItem>
                {leagues?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Matches */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full bg-muted rounded-xl" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl">
              <Search className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-white font-medium">No matches found</p>
              <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map(m => {
                const added = inSlip.has(m.id);
                return (
                  <div
                    key={m.id}
                    className={`group rounded-xl border bg-card transition-all ${added ? "border-primary/50 bg-primary/5" : "border-card-border hover:border-primary/30"}`}
                  >
                    <div className="flex items-stretch">
                      {/* Match info */}
                      <Link href={`/matches/${m.id}`} className="flex-1 min-w-0 p-3">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-xs">{m.countryFlag}</span>
                          <span className="text-xs text-muted-foreground truncate">{m.league}</span>
                          <span className="text-muted-foreground/40 text-xs">·</span>
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{fmtDate(m.matchDate)} {m.matchTime}</span>
                          {m.isHot && <Flame className="w-3 h-3 text-accent" />}
                        </div>
                        <p className="text-sm font-semibold text-white">{m.homeTeam} <span className="text-muted-foreground font-normal">vs</span> {m.awayTeam}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <PredictionBadge prediction={m.prediction} label={m.predictionLabel} small />
                          <span className={`text-xs font-medium ${confidenceColor(m.confidenceScore)}`}>{formatPercentValue(m.confidenceScore, 0)} conf</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="font-medium text-white/70">1</span>
                            <span className="text-primary font-bold">{formatNumber(m.homeWinOdds, 2)}</span>
                            <span className="font-medium text-white/70">X</span>
                            <span className="text-primary font-bold">{formatNumber(m.drawOdds, 2)}</span>
                            <span className="font-medium text-white/70">2</span>
                            <span className="text-primary font-bold">{formatNumber(m.awayWinOdds, 2)}</span>
                          </div>
                        </div>
                      </Link>

                      {/* Add/Remove button */}
                      <div className="flex items-center pr-3 pl-2 border-l border-border/50">
                        {added ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromSlip(m.id)}
                            className="w-8 h-8 p-0 text-primary hover:text-red-400 hover:bg-red-400/10"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addToSlip(m)}
                            className="w-8 h-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Plus className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Bet Slip */}
        <div className={`${activeTab === "browse" ? "hidden md:block" : ""}`}>
          <div className="sticky top-4 space-y-3">
            {/* Slip header */}
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden">
              <div className="absolute-inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary to-accent opacity-60" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary" />
                    <span className="text-base font-bold text-white">My Bet Slip</span>
                    {slip.length > 0 && (
                      <Badge variant="outline" className="border-primary/40 text-primary text-xs px-1.5 py-0">{slip.length}</Badge>
                    )}
                  </div>
                  {slip.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearSlip} className="text-muted-foreground hover:text-red-400 gap-1 text-xs h-7 px-2">
                      <Trash2 className="w-3 h-3" /> Clear
                    </Button>
                  )}
                </div>

                {slip.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-background/60 border border-border flex items-center justify-center mx-auto mb-3">
                      <Plus className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-white font-medium text-sm">Slip is empty</p>
                    <p className="text-xs text-muted-foreground mt-1">Click + on any match to add it</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slip.map((s, i) => (
                      <div key={s.matchId} className="rounded-xl border border-border bg-background/50 overflow-hidden">
                        {/* Leg header */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-card/60 border-b border-border">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[140px]">{s.countryFlag} {s.league}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeFromSlip(s.matchId)} className="h-5 w-5 p-0 text-muted-foreground hover:text-red-400">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="p-2.5">
                          {/* Teams */}
                          <p className="text-xs font-semibold text-white mb-1.5 truncate">{s.homeTeam} vs {s.awayTeam}</p>
                          <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> {fmtDate(s.matchDate)} {s.matchTime}
                          </p>

                          {/* Prediction selector */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {(["home", "draw", "away", "btts", "over25"] as Prediction[]).map(pred => {
                              const odds = getOddsForPrediction(pred, s.homeWinOdds, s.drawOdds, s.awayWinOdds);
                              const active = s.prediction === pred;
                              return (
                                <button
                                  key={pred}
                                  onClick={() => changePrediction(s.matchId, pred)}
                                  className={`flex flex-col items-center px-1.5 py-1 rounded border text-[10px] transition-all ${active ? "bg-primary/20 border-primary/50 text-primary" : "bg-background/60 border-border text-muted-foreground hover:border-primary/30 hover:text-white"}`}
                                >
                                  <span className="font-medium leading-none">{PRED_LABELS[pred]}</span>
                                  <span className={`font-bold mt-0.5 ${active ? "text-primary" : "text-white"}`}>{formatNumber(odds, 2)}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Confidence */}
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <ConfidenceBar value={s.confidenceScore} />
                            </div>
                            <span className={`text-[10px] font-semibold ml-2 ${confidenceColor(s.confidenceScore)}`}>
                              {formatPercentValue(s.confidenceScore, 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Slip footer — payout */}
              {slip.length > 0 && (
                <div className="border-t border-border/60 p-4 space-y-3">
                  {/* Odds summary */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Combined Odds</span>
                    <span className="text-lg font-black text-primary">{formatNumber(combinedOdds, 2)}x</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Zap className="w-3 h-3" /> Legs</span>
                    <span className="text-sm font-semibold text-white">{slip.length} selections</span>
                  </div>

                  {/* Stake input */}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Stake
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={stake}
                      onChange={e => setStake(e.target.value)}
                      className="bg-background/60 border-border text-white h-8 text-sm"
                    />
                  </div>

                  {/* Returns */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-background/60 border border-border p-2.5 text-center">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Total Return</p>
                      <p className="text-base font-bold text-white">${formatNumber(potentialReturn, 2)}</p>
                    </div>
                    <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-2.5 text-center">
                      <p className="text-[10px] text-green-400 mb-0.5">Profit</p>
                      <p className="text-base font-bold text-green-400">+${formatNumber(profit, 2)}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card/50 p-2.5">
                    <p className="text-[10px] text-muted-foreground flex items-start gap-1">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" />
                      Bet responsibly. Odds reflect statistical model output, not bookmaker prices.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick picks suggestion */}
            {slip.length === 0 && matches.filter(m => m.isHot).length > 0 && (
              <Card className="bg-card border-card-border">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-accent" /> Quick-add hot picks
                  </p>
                  <div className="space-y-1">
                    {matches.filter(m => m.isHot).slice(0, 3).map(m => (
                      <button
                        key={m.id}
                        onClick={() => addToSlip(m)}
                        className="w-full flex items-center justify-between p-2 rounded-lg bg-accent/5 border border-accent/20 hover:border-accent/40 transition-colors"
                      >
                        <span className="text-xs text-white truncate">{m.homeTeam} vs {m.awayTeam}</span>
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <span className="text-xs text-accent font-bold">{m.prediction === "home" ? m.homeWinOdds : m.prediction === "away" ? m.awayWinOdds : m.drawOdds}x</span>
                          <Plus className="w-3.5 h-3.5 text-accent" />
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
