import { useGetPredictionAccuracy, useGetStatsSummary } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Award, Target, BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatPercent, toArray, toSafeNumber } from "@/lib/utils";

export default function PredictionsPage() {
  const { data: accuracy, isLoading: accLoading } = useGetPredictionAccuracy();
  const { data: stats, isLoading: statsLoading } = useGetStatsSummary();

  const accuracyData = toArray(accuracy);
  const chartData = accuracyData.map(a => {
    const leagueName = a.league ?? "Unknown League";
    return {
      name: leagueName.length > 16 ? leagueName.slice(0, 16) + "…" : leagueName,
      accuracy: Math.round(toSafeNumber(a.accuracy) * 100),
      total: a.totalPredictions,
    };
  }) ?? [];

  const getBarColor = (val: number) => val >= 70 ? "#22c55e" : val >= 55 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Prediction Accuracy</h1>
        <p className="text-muted-foreground text-sm mt-1">Historical performance breakdown by league and market type.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 bg-muted rounded-xl" />)
        ) : stats ? (
          <>
            <SummaryCard icon={TrendingUp} title="Overall Success Rate" value={formatPercent(stats.successRate, 1)} color="text-green-400" />
            <SummaryCard icon={Target} title="Avg Confidence" value={formatPercent(stats.avgConfidence, 1)} color="text-primary" />
            <SummaryCard icon={BarChart2} title="Total Predictions" value={`${(stats.totalMatches * 8).toLocaleString()}`} color="text-blue-400" />
            <SummaryCard icon={Award} title="Leagues Tracked" value={stats.totalLeagues.toString()} color="text-amber-400" />
          </>
        ) : null}
      </div>

      {/* Bar Chart */}
      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Accuracy by League
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accLoading ? (
            <Skeleton className="h-64 w-full bg-muted" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224 46% 15%)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(215 16% 60%)", fontSize: 11 }}
                  angle={-40}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fill: "hsl(215 16% 60%)", fontSize: 11 }}
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ background: "hsl(224 46% 11%)", border: "1px solid hsl(224 46% 15%)", borderRadius: 8 }}
                  labelStyle={{ color: "white", fontWeight: 600 }}
                  itemStyle={{ color: "hsl(215 16% 80%)" }}
                  formatter={(value) => [`${value}%`, "Accuracy"]}
                />
                <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={getBarColor(entry.accuracy)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* League Table */}
      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="text-base">League Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {accLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full bg-muted" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="accuracy-table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-muted-foreground font-medium py-2 pr-4">League</th>
                    <th className="text-left text-muted-foreground font-medium py-2 pr-4">Country</th>
                    <th className="text-right text-muted-foreground font-medium py-2 pr-4">Predictions</th>
                    <th className="text-right text-muted-foreground font-medium py-2 pr-4">Correct</th>
                    <th className="text-right text-muted-foreground font-medium py-2">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {accuracyData.sort((a, b) => toSafeNumber(b.accuracy) - toSafeNumber(a.accuracy)).map((a, i) => {
                    const pct = Math.round(toSafeNumber(a.accuracy) * 100);
                    const color = pct >= 70 ? "text-green-400" : pct >= 55 ? "text-amber-400" : "text-red-400";
                    return (
                      <tr key={i} className="border-b border-border/50 hover:bg-background/50 transition-colors" data-testid={`accuracy-row-${i}`}>
                        <td className="py-2.5 pr-4 text-white font-medium">{a.league}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{a.country}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground text-right">{a.totalPredictions.toLocaleString()}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground text-right">{a.correct.toLocaleString()}</td>
                        <td className="py-2.5 text-right">
                          <span className={`font-bold ${color}`}>{pct}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500" /><span>70%+ — Excellent</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-500" /><span>55-70% — Good</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500" /><span>&lt;55% — Below Average</span></div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value, color }: { icon: React.ElementType; title: string; value: string; color: string }) {
  return (
    <Card className="bg-card border-card-border">
      <CardContent className="pt-4 pb-4 px-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">{title}</p>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
