import { db } from "@workspace/db";
import { matchesTable, leaguesTable } from "@workspace/db";
import { ne, like } from "drizzle-orm";
import { logger } from "../lib/logger";
import {
  fetchMatches,
  fetchStandings,
  getAllLeagues,
  getLeagueMeta,
  normStatus,
  ALL_COMPETITION_CODES,
  FDMatch,
  FDStanding,
} from "./football-data";
import {
  buildTeamStats,
  calcExpectedGoals,
  poissonMatchProbs,
  generateOdds,
  makePrediction,
  calcValueRating,
  buildAnalysisNotes,
} from "./prediction-engine";

let lastSyncAt: Date | null = null;
let syncInProgress = false;

export function getLastSyncAt() { return lastSyncAt; }
export function isSyncInProgress() { return syncInProgress; }

const RATE_DELAY_MS = 7500;

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export async function syncAllCompetitions(): Promise<{ synced: number; errors: string[] }> {
  if (syncInProgress) return { synced: 0, errors: ["Sync already in progress"] };
  syncInProgress = true;
  const errors: string[] = [];
  let totalSynced = 0;

  try {
    await ensureLeagues();

    // Purge any finished matches so only real upcoming/live ones remain
    await db.delete(matchesTable).where(ne(matchesTable.status, "upcoming"));
    // Also purge seeded fake data (non fd- prefixed)
    const allMatches = await db.select({ id: matchesTable.id }).from(matchesTable);
    for (const m of allMatches) {
      if (!m.id.startsWith("fd-")) {
        await db.delete(matchesTable).where(ne(matchesTable.id, "_"));
        break;
      }
    }

    // Date range: today → 45 days out (covers World Cup final July 19 + buffer)
    const today = new Date();
    const dateTo = new Date(today);
    dateTo.setDate(dateTo.getDate() + 45);
    const dateFrom = today.toISOString().slice(0, 10);
    const dateToStr = dateTo.toISOString().slice(0, 10);

    logger.info({ dateFrom, dateTo: dateToStr }, "Sync date range");

    for (const code of ALL_COMPETITION_CODES) {
      try {
        logger.info({ code }, "Fetching matches");
        const matches = await fetchMatches(code, dateFrom, dateToStr);
        await sleep(RATE_DELAY_MS);

        let standings: FDStanding[] = [];
        if (matches.length > 0) {
          logger.info({ code, matches: matches.length }, "Fetching standings");
          standings = await fetchStandings(code);
          await sleep(RATE_DELAY_MS);
        }

        const synced = await processMatches(code, matches, standings);
        totalSynced += synced;
        logger.info({ code, synced, matchesFromApi: matches.length }, "Competition synced");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${code}: ${msg}`);
        logger.warn({ code, err: msg }, "Failed to sync competition — skipping");
        await sleep(RATE_DELAY_MS);
      }
    }

    lastSyncAt = new Date();
    logger.info({ totalSynced, errors: errors.length }, "Sync complete");
  } finally {
    syncInProgress = false;
  }

  return { synced: totalSynced, errors };
}

async function ensureLeagues() {
  const leagues = getAllLeagues();
  for (const l of leagues) {
    await db
      .insert(leaguesTable)
      .values({ id: l.id, name: l.name, country: l.country, countryFlag: l.countryFlag })
      .onConflictDoUpdate({
        target: leaguesTable.id,
        set: { name: l.name, country: l.country, countryFlag: l.countryFlag },
      });
  }
}

async function processMatches(
  code: string,
  matches: FDMatch[],
  standings: FDStanding[]
): Promise<number> {
  const meta = getLeagueMeta(code);
  if (!meta || matches.length === 0) return 0;

  const standingMap = new Map<number, FDStanding>();
  for (const s of standings) standingMap.set(s.team.id, s);

  const leagueAvgGoalsFor =
    avgStat(standings, s => (s.playedGames > 0 ? s.goalsFor / s.playedGames : 0)) || 1.3;
  const leagueAvgGoalsAgainst =
    avgStat(standings, s => (s.playedGames > 0 ? s.goalsAgainst / s.playedGames : 0)) || 1.3;

  let count = 0;
  for (const m of matches) {
    // Skip if either team is TBD / null (should already be filtered, but double-check)
    if (!m.homeTeam?.name || !m.awayTeam?.name) continue;

    try {
      await upsertMatch(m, code, meta, standingMap, leagueAvgGoalsFor, leagueAvgGoalsAgainst);
      count++;
    } catch (err) {
      logger.warn({ matchId: m.id, err }, "Failed to upsert match");
    }
  }
  return count;
}

async function upsertMatch(
  m: FDMatch,
  competitionCode: string,
  meta: NonNullable<ReturnType<typeof getLeagueMeta>>,
  standingMap: Map<number, FDStanding>,
  leagueAvgGoalsFor: number,
  leagueAvgGoalsAgainst: number
) {
  const matchId = `fd-${m.id}`;
  const status = normStatus(m.status);

  // Only store upcoming or live matches
  if (status === "finished") return;

  const dt = new Date(m.utcDate);
  const matchDate = dt.toISOString().slice(0, 10);
  const matchTime = dt.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });

  const homeStanding = standingMap.get(m.homeTeam.id);
  const awayStanding = standingMap.get(m.awayTeam.id);

  // World Cup: use international tournament averages if no standings available
  const isWorldCup = competitionCode === "WC";
  const defaultAvg = isWorldCup ? 1.45 : 1.3;
  const effectiveAvgFor = leagueAvgGoalsFor || defaultAvg;
  const effectiveAvgAgainst = leagueAvgGoalsAgainst || defaultAvg;

  const homeStats = buildTeamStats(
    homeStanding, effectiveAvgFor, effectiveAvgAgainst, [], m.homeTeam.id, true
  );
  const awayStats = buildTeamStats(
    awayStanding, effectiveAvgFor, effectiveAvgAgainst, [], m.awayTeam.id, false
  );

  const { lambdaHome, lambdaAway } = calcExpectedGoals(
    homeStats.attackStrength, awayStats.defenceStrength, effectiveAvgFor,
    awayStats.attackStrength, homeStats.defenceStrength, effectiveAvgAgainst,
  );

  const probs = poissonMatchProbs(lambdaHome, lambdaAway);
  const { homeWinOdds, drawOdds, awayWinOdds } = generateOdds(probs.homeWin, probs.draw, probs.awayWin);
  const { prediction, predictionLabel, confidence } = makePrediction(
    probs.homeWin, probs.draw, probs.awayWin, probs.btts, probs.over25,
  );

  const predOdds =
    prediction === "home" ? homeWinOdds :
    prediction === "away" ? awayWinOdds :
    prediction === "draw" ? drawOdds :
    prediction === "btts" ? Math.max(1.01, 1 / Math.max(0.01, probs.btts) / 1.08) :
    Math.max(1.01, 1 / Math.max(0.01, probs.over25) / 1.08);

  const valueRating = calcValueRating(confidence, predOdds);
  const isHot = valueRating >= 7.5;

  // Add stage/group context for World Cup matches
  const stageNote = isWorldCup && m.stage
    ? `${m.stage.replace(/_/g, " ")}${m.group ? ` · ${m.group.replace("GROUP_", "Group ")}` : ""}`
    : null;

  const analysisNotes = buildAnalysisNotes(
    m.homeTeam.shortName || m.homeTeam.name,
    m.awayTeam.shortName || m.awayTeam.name,
    homeStats, awayStats, probs,
    { lambdaHome, lambdaAway },
    stageNote,
  );

  await db.insert(matchesTable).values({
    id: matchId,
    homeTeam: m.homeTeam.shortName || m.homeTeam.name,
    awayTeam: m.awayTeam.shortName || m.awayTeam.name,
    homeTeamLogo: m.homeTeam.crest || null,
    awayTeamLogo: m.awayTeam.crest || null,
    leagueId: competitionCode,
    league: meta.name,
    country: meta.country,
    countryFlag: meta.flag,
    matchDate,
    matchTime,
    status,
    homeScore: null,
    awayScore: null,
    homeWinOdds,
    drawOdds,
    awayWinOdds,
    confidenceScore: confidence,
    prediction,
    predictionLabel,
    valueRating,
    isHot,
    homeTeamForm: homeStats.form,
    awayTeamForm: awayStats.form,
    homeRecentGoalsScored: homeStats.recentGoalsScored,
    homeRecentGoalsConceded: homeStats.recentGoalsConceded,
    awayRecentGoalsScored: awayStats.recentGoalsScored,
    awayRecentGoalsConceded: awayStats.recentGoalsConceded,
    homeWinProbability: probs.homeWin,
    drawProbability: probs.draw,
    awayWinProbability: probs.awayWin,
    bttsProb: probs.btts,
    over25Prob: probs.over25,
    expectedHomeGoals: lambdaHome,
    expectedAwayGoals: lambdaAway,
    headToHead: [],
    analysisNotes,
    homeAwayRecord: homeStats.homeAwayRecord,
    awayHomeRecord: awayStats.homeAwayRecord,
  }).onConflictDoUpdate({
    target: matchesTable.id,
    set: {
      status,
      homeScore: null,
      awayScore: null,
      homeWinOdds,
      drawOdds,
      awayWinOdds,
      confidenceScore: confidence,
      prediction,
      predictionLabel,
      valueRating,
      isHot,
      homeWinProbability: probs.homeWin,
      drawProbability: probs.draw,
      awayWinProbability: probs.awayWin,
      bttsProb: probs.btts,
      over25Prob: probs.over25,
      expectedHomeGoals: lambdaHome,
      expectedAwayGoals: lambdaAway,
      analysisNotes,
      updatedAt: new Date(),
    },
  });
}

function avgStat(standings: FDStanding[], fn: (s: FDStanding) => number): number {
  const filtered = standings.filter(s => s.playedGames > 0);
  if (!filtered.length) return 0;
  return filtered.reduce((acc, s) => acc + fn(s), 0) / filtered.length;
}
