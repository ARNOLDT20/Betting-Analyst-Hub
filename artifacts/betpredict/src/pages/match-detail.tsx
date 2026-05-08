import { useParams } from "wouter";
import { useGetMatch, getGetMatchQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Flame, Clock, BarChart2, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ConfidenceBar } from "@/components/confidence-bar";
import { PredictionBadge } from "@/components/prediction-badge";

export default function MatchDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";

  const { data: match, isLoading, isError } = useGetMatch(id, {
    query: { enabled: !!id, queryKey: getGetMatchQueryKey(id) },
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-xl font-semibold text-white">Match not found</p>
        <Link href="/matches">
          <Button variant="outline" size="sm" className="mt-4">Back to matches</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/matches">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          {isLoading ? <Skeleton className="h-6 w-40 bg-muted" /> : (
            <p className="text-sm text-muted-foreground">{match?.countryFlag} {match?.league}</p>
          )}
        </div>
      </div>

      {/* Match Hero */}
      <Card className={`bg-card border-card-border overflow-hidden ${match?.isHot ? "border-accent/40" : ""}`}>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full bg-muted" />
              <Skeleton className="h-8 w-3/4 bg-muted" />
            </div>
          ) : match ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {match.isHot && <Flame className="w-4 h-4 text-accent" />}
                  <span className="text-xs text-muted-foreground">{match.countryFlag} {match.league}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {match.status === "live" ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs text-green-400 font-medium">LIVE</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{match.matchDate} • {match.matchTime}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between my-4">
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-black text-white">{match.homeTeam}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Home</p>
                </div>
                <div className="text-center px-4">
                  {match.status === "finished" || match.status === "live" ? (
                    <div className="text-4xl font-black text-white">{match.homeScore} - {match.awayScore}</div>
                  ) : (
                    <div className="text-2xl font-bold text-muted-foreground">vs</div>
                  )}
                </div>
                <div className="flex-1 text-right">
                  <h2 className="text-2xl md:text-3xl font-black text-white">{match.awayTeam}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Away</p>
                </div>
              </div>

              {/* Odds */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: `${match.homeTeam} Win`, sublabel: "1", value: match.homeWinOdds, active: match.prediction === "home" },
                  { label: "Draw", sublabel: "X", value: match.drawOdds, active: match.prediction === "draw" },
                  { label: `${match.awayTeam} Win`, sublabel: "2", value: match.awayWinOdds, active: match.prediction === "away" },
                ].map(o => (
                  <div key={o.sublabel} className={`rounded-lg border p-3 text-center ${o.active ? "border-primary/50 bg-primary/10" : "border-border bg-background/50"}`}>
                    <p className="text-xs text-muted-foreground truncate">{o.label}</p>
                    <p className={`text-xl font-bold mt-1 ${o.active ? "text-primary" : "text-white"}`}>{o.value.toFixed(2)}</p>
                    <p className={`text-xs ${o.active ? "text-primary/70" : "text-muted-foreground"}`}>{o.sublabel}</p>
                  </div>
                ))}
              </div>

              {/* Main Prediction */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/5">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Model Prediction</p>
                  <PredictionBadge prediction={match.prediction} label={match.predictionLabel} />
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Value Rating</p>
                  <p className="text-2xl font-bold text-white">{match.valueRating.toFixed(1)}<span className="text-sm text-muted-foreground">/10</span></p>
                </div>
                <div className="w-36">
                  <ConfidenceBar value={match.confidenceScore} />
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full bg-muted rounded-xl" />)}
        </div>
      ) : match ? (
        <div className="space-y-6">
          {/* Team Analysis */}
          <div className="grid gap-4 md:grid-cols-2">
            <TeamAnalysisCard
              teamName={match.homeTeam}
              prediction={match.homeTeamPrediction}
              isHome={true}
            />
            <TeamAnalysisCard
              teamName={match.awayTeam}
              prediction={match.awayTeamPrediction}
              isHome={false}
            />
          </div>

          {/* Goal Probabilities */}
          <Card className="bg-card border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                Goal Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <ProbBar label="Both Teams to Score" value={match.bttsProb} />
                <ProbBar label="Over 2.5 Goals" value={match.over25Prob} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-background/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Expected Goals — {match.homeTeam}</p>
                  <p className="text-2xl font-bold text-white mt-1">{match.expectedHomeGoals.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-border bg-background/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Expected Goals — {match.awayTeam}</p>
                  <p className="text-2xl font-bold text-white mt-1">{match.expectedAwayGoals.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Win Probability */}
          <Card className="bg-card border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Win Probability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <WinProbBar label={`${match.homeTeam} Win`} value={match.homeTeamPrediction.winProbability} color="bg-blue-500" />
                <WinProbBar label="Draw" value={1 - match.homeTeamPrediction.winProbability - match.awayTeamPrediction.winProbability} color="bg-gray-500" />
                <WinProbBar label={`${match.awayTeam} Win`} value={match.awayTeamPrediction.winProbability} color="bg-purple-500" />
              </div>
            </CardContent>
          </Card>

          {/* Analysis Notes */}
          {match.analysisNotes.length > 0 && (
            <Card className="bg-card border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Analysis Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {match.analysisNotes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">{note}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Head to Head */}
          {match.headToHead.length > 0 && (
            <Card className="bg-card border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Head to Head</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {match.headToHead.map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border" data-testid={`h2h-${i}`}>
                      <span className="text-xs text-muted-foreground">{h.date}</span>
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <span className="text-right min-w-[100px]">{h.homeTeam}</span>
                        <span className="px-3 py-0.5 rounded bg-card border border-border font-bold">{h.homeScore} - {h.awayScore}</span>
                        <span className="min-w-[100px]">{h.awayTeam}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}

function TeamAnalysisCard({ teamName, prediction, isHome }: { teamName: string; prediction: { winProbability: number; form: string; recentGoalsScored: number; recentGoalsConceded: number; homeAwayRecord: string }; isHome: boolean }) {
  const formChars = prediction.form.split("").slice(0, 5);
  return (
    <Card className="bg-card border-card-border" data-testid={`team-analysis-${isHome ? "home" : "away"}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{isHome ? "Home" : "Away"} — {teamName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Recent Form</p>
          <div className="flex gap-1">
            {formChars.map((c, i) => (
              <span key={i} className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${c === "W" ? "bg-green-500/20 text-green-400" : c === "D" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>{c}</span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded bg-background/50 border border-border p-2">
            <p className="text-xs text-muted-foreground">Goals Scored</p>
            <p className="text-base font-bold text-green-400 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" />{prediction.recentGoalsScored.toFixed(1)}</p>
          </div>
          <div className="rounded bg-background/50 border border-border p-2">
            <p className="text-xs text-muted-foreground">Goals Conceded</p>
            <p className="text-base font-bold text-red-400 flex items-center justify-center gap-1"><TrendingDown className="w-3 h-3" />{prediction.recentGoalsConceded.toFixed(1)}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">{isHome ? "Home" : "Away"} Record</p>
          <p className="text-sm text-white font-medium">{prediction.homeAwayRecord}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Win Probability</p>
          <p className="text-xl font-bold text-white">{(prediction.winProbability * 100).toFixed(1)}%</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProbBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 60 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  const text = pct >= 60 ? "text-green-400" : pct >= 40 ? "text-amber-400" : "text-red-400";
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-xs font-bold ${text}`}>{pct}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function WinProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-32 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-white w-10 text-right shrink-0">{pct}%</span>
    </div>
  );
}
