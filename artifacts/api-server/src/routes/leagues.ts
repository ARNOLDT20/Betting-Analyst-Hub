import { Router } from "express";
import { db } from "@workspace/db";
import { leaguesTable, matchesTable } from "@workspace/db";
import { sql, eq, ilike } from "drizzle-orm";
import { ListLeaguesQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/leagues", async (req, res) => {
  const parsed = ListLeaguesQueryParams.safeParse(req.query);
  const country = parsed.success ? parsed.data.country : undefined;

  const leagues = await db
    .select({
      id: leaguesTable.id,
      name: leaguesTable.name,
      country: leaguesTable.country,
      countryFlag: leaguesTable.countryFlag,
      logo: leaguesTable.logo,
      matchCount: sql<number>`count(${matchesTable.id})`,
    })
    .from(leaguesTable)
    .leftJoin(matchesTable, eq(matchesTable.leagueId, leaguesTable.id))
    .where(country ? ilike(leaguesTable.country, `%${country}%`) : undefined)
    .groupBy(leaguesTable.id)
    .orderBy(leaguesTable.country, leaguesTable.name);

  res.json(
    leagues.map((l) => ({
      id: l.id,
      name: l.name,
      country: l.country,
      countryFlag: l.countryFlag,
      logo: l.logo,
      matchCount: Number(l.matchCount),
    }))
  );
});

router.get("/countries", async (req, res) => {
  const rows = await db
    .select({
      country: matchesTable.country,
      countryFlag: matchesTable.countryFlag,
      matchCount: sql<number>`count(*)`,
      leagueCount: sql<number>`count(distinct ${matchesTable.leagueId})`,
    })
    .from(matchesTable)
    .groupBy(matchesTable.country, matchesTable.countryFlag)
    .orderBy(matchesTable.country);

  res.json(
    rows.map((r) => ({
      name: r.country,
      flag: r.countryFlag,
      matchCount: Number(r.matchCount),
      leagueCount: Number(r.leagueCount),
    }))
  );
});

export default router;
