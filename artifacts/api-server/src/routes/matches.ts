import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, leaguesTable } from "@workspace/db";
import { sql, eq, ilike, and, or } from "drizzle-orm";
import {
  ListMatchesQueryParams,
  GetMatchParams,
  GetHotGamesQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/matches", async (req, res) => {
  const parsed = ListMatchesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { search, leagueId, country, status, page = 1, limit = 20 } = parsed.data;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(matchesTable.homeTeam, `%${search}%`),
        ilike(matchesTable.awayTeam, `%${search}%`),
        ilike(matchesTable.league, `%${search}%`)
      )
    );
  }
  if (leagueId) conditions.push(eq(matchesTable.leagueId, leagueId));
  if (country) conditions.push(ilike(matchesTable.country, `%${country}%`));
  if (status) conditions.push(eq(matchesTable.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const offset = (page - 1) * limit;

  const [matches, [{ count }]] = await Promise.all([
    db.select().from(matchesTable).where(whereClause).limit(limit).offset(offset).orderBy(matchesTable.matchDate, matchesTable.matchTime),
    db.select({ count: sql<number>`count(*)` }).from(matchesTable).where(whereClause),
  ]);

  const total = Number(count);
  res.json({
    matches: matches.map(formatMatch),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/matches/:id", async (req, res) => {
  const parsed = GetMatchParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  const { id } = parsed.data;
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, id));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  res.json(formatMatchDetail(match));
});

router.get("/hot-games", async (req, res) => {
  const parsed = GetHotGamesQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

  const matches = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.isHot, true))
    .orderBy(sql`${matchesTable.valueRating} DESC`)
    .limit(limit);

  res.json(matches.map(formatMatch));
});

function formatMatch(m: typeof matchesTable.$inferSelect) {
  return {
    id: m.id,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeTeamLogo: m.homeTeamLogo,
    awayTeamLogo: m.awayTeamLogo,
    league: m.league,
    leagueId: m.leagueId,
    country: m.country,
    countryFlag: m.countryFlag,
    matchDate: m.matchDate,
    matchTime: m.matchTime,
    status: m.status,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homeWinOdds: m.homeWinOdds,
    drawOdds: m.drawOdds,
    awayWinOdds: m.awayWinOdds,
    confidenceScore: m.confidenceScore,
    prediction: m.prediction,
    predictionLabel: m.predictionLabel,
    valueRating: m.valueRating,
    isHot: m.isHot,
  };
}

function formatMatchDetail(m: typeof matchesTable.$inferSelect) {
  return {
    ...formatMatch(m),
    homeTeamPrediction: {
      winProbability: m.homeWinProbability ?? 0.33,
      form: m.homeTeamForm ?? "WWDLW",
      recentGoalsScored: m.homeRecentGoalsScored ?? 1.5,
      recentGoalsConceded: m.homeRecentGoalsConceded ?? 1.2,
      homeAwayRecord: m.homeAwayRecord ?? "W5 D2 L3",
    },
    awayTeamPrediction: {
      winProbability: m.awayWinProbability ?? 0.33,
      form: m.awayTeamForm ?? "WDLWL",
      recentGoalsScored: m.awayRecentGoalsScored ?? 1.2,
      recentGoalsConceded: m.awayRecentGoalsConceded ?? 1.4,
      homeAwayRecord: m.awayHomeRecord ?? "W3 D3 L4",
    },
    headToHead: (m.headToHead as object[]) ?? [],
    analysisNotes: (m.analysisNotes as string[]) ?? [],
    bttsProb: m.bttsProb ?? 0.5,
    over25Prob: m.over25Prob ?? 0.55,
    expectedHomeGoals: m.expectedHomeGoals ?? 1.3,
    expectedAwayGoals: m.expectedAwayGoals ?? 1.1,
  };
}

export default router;
