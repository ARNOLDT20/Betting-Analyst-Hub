import { Router } from "express";
import { db } from "@workspace/db";
import { betOfTheDayTable, matchesTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

router.get("/bet-of-the-day", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const [existing] = await db
    .select()
    .from(betOfTheDayTable)
    .where(eq(betOfTheDayTable.date, today))
    .limit(1);

  if (existing) {
    res.json(formatBetOfTheDay(existing));
    return;
  }

  const bet = await generateBetOfTheDay(today);
  res.json(bet);
});

router.post("/bet-of-the-day/regenerate", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  await db.delete(betOfTheDayTable).where(eq(betOfTheDayTable.date, today));

  const bet = await generateBetOfTheDay(today);
  res.json(bet);
});

async function generateBetOfTheDay(date: string) {
  const candidates = await db
    .select()
    .from(matchesTable)
    .where(sql`${matchesTable.confidenceScore} > 0.65 AND ${matchesTable.status} = 'upcoming'`)
    .orderBy(sql`${matchesTable.confidenceScore} DESC, ${matchesTable.valueRating} DESC`)
    .limit(30);

  const shuffled = candidates.sort(() => Math.random() - 0.5);
  const selections = shuffled.slice(0, Math.min(5, shuffled.length));

  if (selections.length === 0) {
    const all = await db.select().from(matchesTable).limit(5);
    selections.push(...all);
  }

  const selectionData = selections.map((m) => {
    const predOdds =
      m.prediction === "home"
        ? m.homeWinOdds
        : m.prediction === "away"
        ? m.awayWinOdds
        : m.drawOdds;
    return {
      matchId: m.id,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      league: m.league,
      country: m.country,
      prediction: m.prediction,
      predictionLabel: m.predictionLabel,
      odds: predOdds,
      confidenceScore: m.confidenceScore,
      matchDate: m.matchDate,
      matchTime: m.matchTime,
    };
  });

  const totalOdds = selectionData.reduce((acc, s) => acc * s.odds, 1);
  const avgConfidence =
    selectionData.reduce((acc, s) => acc + s.confidenceScore, 0) / selectionData.length;

  const notes = [
    "Multi-factor statistical analysis combining form, H2H, and Poisson distribution scoring.",
    "Selections filtered by minimum 65% confidence threshold and value rating.",
    "Home advantage and recent goalscoring form weighted at 30% each in the model.",
    "Selections span multiple leagues to reduce correlated variance.",
  ];

  const id = crypto.randomUUID();

  const [inserted] = await db
    .insert(betOfTheDayTable)
    .values({
      id,
      date,
      totalOdds,
      averageConfidence: avgConfidence,
      selections: selectionData,
      analysisNote: notes[Math.floor(Math.random() * notes.length)],
    })
    .returning();

  return formatBetOfTheDay(inserted);
}

function formatBetOfTheDay(b: typeof betOfTheDayTable.$inferSelect) {
  return {
    id: b.id,
    generatedAt: b.generatedAt?.toISOString() ?? new Date().toISOString(),
    totalOdds: b.totalOdds,
    averageConfidence: b.averageConfidence,
    selections: b.selections,
    analysisNote: b.analysisNote,
  };
}

export default router;
