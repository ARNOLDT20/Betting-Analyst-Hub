import { useGetStatsSummary, useGetBetOfTheDay, useGetHotGames, useListMatches } from "@workspace/api-client-react";
import { Activity, Flame, Target, Trophy, ArrowRight, TrendingUp, Globe, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { MatchCard } from "@/components/match-card";
import { ConfidenceBar } from "@/components/confidence-bar";
import { PredictionBadge } from "@/components/prediction-badge";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStatsSummary();
  const { data: botd, isLoading: botdLoading } = useGetBetOfTheDay();
  const { data: hotGames, isLoading: hotLoading } = useGetHotGames({ limit: 4 });
  const { data: matchData, isLoading: matchesLoading } = useListMatches({ limit: 6, status: "upcoming" });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-white tracking-tight">Mission Control</h1>
        <p className="text-muted-foreground text-sm">Real-time betting intelligence and platform statistics.</p>
      </div>

      {/* Hero Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Matches" value={stats?.todayMatches} icon={Activity} isLoading={statsLoading} />
        <StatCard title="Hot Games" value={stats?.hotGames} icon={Flame} iconColor="text-accent" isLoading={statsLoading} />
        <StatCard title="Avg Confidence" value={stats ? `${(stats.avgConfidence * 100).toFixed(1)}%` : undefined} icon={Target} iconColor="text-primary" isLoading={statsLoading} />
        <StatCard title="Success Rate" value={stats ? `${(stats.successRate * 100).toFixed(1)}%` : undefined} icon={Trophy} iconColor="text-yellow-400" isLoading={statsLoading} />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Matches" value={stats?.totalMatches} icon={TrendingUp} isLoading={statsLoading} />
        <StatCard title="Leagues Covered" value={stats?.totalLeagues} icon={Shield} isLoading={statsLoading} />
        <StatCard title="Countries" value={stats?.totalCountries} icon={Globe} isLoading={statsLoading} />
        <StatCard title="Live Tracking" value="24/7" icon={Activity} iconColor="text-green-400" isLoading={false} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bet of the Day Widget */}
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Bet of the Day
              </CardTitle>
              <Link href="/bet-of-the-day">
                <Button variant="ghost" size="sm" className="text-primary gap-1 text-xs hover:text-primary">
                  Full Analysis <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {botdLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full bg-muted" />)}
              </div>
            ) : botd ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div>
                    <p className="text-xs text-muted-foreground">Combined Odds</p>
                    <p className="text-2xl font-bold text-primary">{botd.totalOdds.toFixed(2)}x</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Avg Confidence</p>
                    <p className="text-2xl font-bold text-white">{(botd.averageConfidence * 100).toFixed(0)}%</p>
                  </div>
                </div>
                {botd.selections.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-background/50 border border-border">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{s.homeTeam} vs {s.awayTeam}</p>
                      <p className="text-xs text-muted-foreground">{s.league}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <PredictionBadge prediction={s.prediction} label={s.predictionLabel} />
                      <span className="text-sm font-bold text-accent">{s.odds.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                {botd.selections.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">+{botd.selections.length - 3} more selections</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No bet of the day yet</p>
            )}
          </CardContent>
        </Card>

        {/* Hot Games Widget */}
        <Card className="bg-card border-card-border relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-5 pointer-events-none">
            <Flame className="w-28 h-28 text-accent" />
          </div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="w-4 h-4 text-accent" />
                Hot Games
              </CardTitle>
              <Link href="/hot">
                <Button variant="ghost" size="sm" className="text-accent gap-1 text-xs hover:text-accent">
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {hotLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full bg-muted" />)}
              </div>
            ) : hotGames && hotGames.length > 0 ? (
              <div className="space-y-2">
                {hotGames.map((m) => (
                  <Link key={m.id} href={`/matches/${m.id}`}>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-accent/5 border border-accent/20 hover:border-accent/40 cursor-pointer transition-colors" data-testid={`hot-game-${m.id}`}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-accent text-xs">{m.countryFlag}</span>
                          <span className="text-xs text-muted-foreground truncate">{m.league}</span>
                        </div>
                        <p className="text-sm font-medium text-white truncate">{m.homeTeam} vs {m.awayTeam}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <PredictionBadge prediction={m.prediction} label={m.predictionLabel} small />
                        <ConfidenceBar value={m.confidenceScore} compact />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No hot games available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Matches */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Upcoming Matches</h2>
          <Link href="/matches">
            <Button variant="ghost" size="sm" className="text-primary gap-1 text-xs hover:text-primary">
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
        {matchesLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full bg-muted rounded-xl" />)}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {matchData?.matches.map(m => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, iconColor = "text-muted-foreground", isLoading }: { title: string; value?: string | number; icon: React.ElementType; iconColor?: string; isLoading: boolean }) {
  return (
    <Card className="bg-card border-card-border hover:border-primary/30 transition-colors" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </CardHeader>
      <CardContent className="pb-4 px-4">
        {isLoading ? (
          <Skeleton className="h-7 w-16 bg-muted" />
        ) : (
          <div className="text-2xl font-bold text-white">{value ?? "-"}</div>
        )}
      </CardContent>
    </Card>
  );
}
