const BASE = "https://api.football-data.org/v4";

const LEAGUE_MAP: Record<string, { id: number; name: string; country: string; flag: string }> = {
  WC:  { id: 2000, name: "FIFA World Cup",         country: "World",       flag: "🌍" },
  PL:  { id: 2021, name: "Premier League",         country: "England",     flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  PD:  { id: 2014, name: "La Liga",                country: "Spain",       flag: "🇪🇸" },
  BL1: { id: 2002, name: "Bundesliga",             country: "Germany",     flag: "🇩🇪" },
  SA:  { id: 2019, name: "Serie A",                country: "Italy",       flag: "🇮🇹" },
  FL1: { id: 2015, name: "Ligue 1",               country: "France",      flag: "🇫🇷" },
  CL:  { id: 2001, name: "UEFA Champions League", country: "Europe",      flag: "🇪🇺" },
  PPL: { id: 2017, name: "Primeira Liga",          country: "Portugal",    flag: "🇵🇹" },
  DED: { id: 2003, name: "Eredivisie",             country: "Netherlands", flag: "🇳🇱" },
  BSA: { id: 2013, name: "Brasileirão",            country: "Brazil",      flag: "🇧🇷" },
};

export const ALL_COMPETITION_CODES = Object.keys(LEAGUE_MAP);

export function getLeagueMeta(code: string) {
  const m = LEAGUE_MAP[code];
  if (!m) return null;
  return { ...m, flag: m.flag };
}

export function getAllLeagues() {
  return Object.entries(LEAGUE_MAP).map(([code, meta]) => ({
    id: code,
    name: meta.name,
    country: meta.country,
    countryFlag: meta.flag,
  }));
}

async function fdFetch(path: string) {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) throw new Error("FOOTBALL_DATA_API_KEY is not set");

  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { "X-Auth-Token": key },
    signal: AbortSignal.timeout(15_000),
  });

  if (res.status === 429) {
    throw new Error("Rate limit hit on football-data.org — try again in a minute");
  }
  if (res.status === 403) {
    throw new Error(`Competition not available on free tier (403)`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`football-data.org ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json() as Promise<Record<string, unknown>>;
}

export interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string;
  group: string | null;
  homeTeam: { id: number; name: string; shortName: string; crest: string };
  awayTeam: { id: number; name: string; shortName: string; crest: string };
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
  };
  competition: { id: number; code: string; name: string };
  season: { id: number };
}

export interface FDStanding {
  position: number;
  team: { id: number; name: string; crest: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: string | null;
}

export async function fetchMatches(
  competitionCode: string,
  dateFrom: string,
  dateTo: string
): Promise<FDMatch[]> {
  const data = await fdFetch(
    `/competitions/${competitionCode}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&status=SCHEDULED,TIMED,IN_PLAY,PAUSED`
  );
  const raw = (data.matches as FDMatch[]) ?? [];

  // Filter out TBD knockout stage matches (null or placeholder team names)
  return raw.filter(
    (m) =>
      m.homeTeam?.name &&
      m.awayTeam?.name &&
      m.homeTeam.name !== "TBD" &&
      m.awayTeam.name !== "TBD" &&
      m.homeTeam.id !== 0 &&
      m.awayTeam.id !== 0
  );
}

export async function fetchStandings(competitionCode: string): Promise<FDStanding[]> {
  try {
    const data = await fdFetch(`/competitions/${competitionCode}/standings`);
    const standings = data.standings as { type: string; group?: string; table: FDStanding[] }[];

    // For cup/group-stage competitions (WC, CL), each group has its own TOTAL entry.
    // Merge all TOTAL tables into one flat list so every team gets standings-based stats.
    const totalGroups = standings?.filter((s) => s.type === "TOTAL");
    if (!totalGroups?.length) return [];

    const merged: FDStanding[] = [];
    for (const g of totalGroups) {
      for (const row of g.table ?? []) {
        merged.push(row);
      }
    }
    return merged;
  } catch {
    return [];
  }
}

export async function fetchTeamMatches(teamId: number, limit = 5): Promise<FDMatch[]> {
  try {
    const data = await fdFetch(`/teams/${teamId}/matches?status=FINISHED&limit=${limit}`);
    return (data.matches as FDMatch[]) ?? [];
  } catch {
    return [];
  }
}

export function normStatus(fdStatus: string): "upcoming" | "live" | "finished" {
  if (["SCHEDULED", "TIMED", "POSTPONED", "SUSPENDED", "CANCELLED"].includes(fdStatus))
    return "upcoming";
  if (["IN_PLAY", "PAUSED", "HALFTIME", "EXTRA_TIME", "PENALTY", "LIVE"].includes(fdStatus))
    return "live";
  return "finished";
}
