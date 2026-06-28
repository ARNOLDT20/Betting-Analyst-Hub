import { FDStanding, FDMatch } from "./football-data";

function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function poisson(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

export function poissonMatchProbs(lambdaHome: number, lambdaAway: number, maxGoals = 6) {
  let homeWin = 0, draw = 0, awayWin = 0;
  let btts = 0, over25 = 0;

  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const p = poisson(lambdaHome, h) * poisson(lambdaAway, a);
      if (h > a) homeWin += p;
      else if (h === a) draw += p;
      else awayWin += p;
      if (h > 0 && a > 0) btts += p;
      if (h + a > 2) over25 += p;
    }
  }

  return { homeWin, draw, awayWin, btts, over25 };
}

export interface TeamStats {
  leagueAvgGoals: number;
  attackStrength: number;
  defenceStrength: number;
  form: string;
  recentGoalsScored: number;
  recentGoalsConceded: number;
  homeAwayRecord: string;
  winPct: number;
}

export function buildTeamStats(
  standing: FDStanding | undefined,
  leagueAvgGoalsFor: number,
  leagueAvgGoalsAgainst: number,
  recentMatches: FDMatch[],
  teamId: number,
  isHome: boolean
): TeamStats {
  const DEFAULT_ATTACK = 1.0;
  const DEFAULT_DEFENCE = 1.0;

  let attackStrength = DEFAULT_ATTACK;
  let defenceStrength = DEFAULT_DEFENCE;
  let winPct = 0.33;
  let homeAwayRecord = "N/A";

  if (standing && standing.playedGames > 0) {
    const avgScored = standing.goalsFor / standing.playedGames;
    const avgConceded = standing.goalsAgainst / standing.playedGames;
    attackStrength = leagueAvgGoalsFor > 0 ? avgScored / leagueAvgGoalsFor : DEFAULT_ATTACK;
    defenceStrength = leagueAvgGoalsAgainst > 0 ? avgConceded / leagueAvgGoalsAgainst : DEFAULT_DEFENCE;
    winPct = standing.playedGames > 0 ? standing.won / standing.playedGames : 0.33;
    homeAwayRecord = `W${standing.won} D${standing.draw} L${standing.lost}`;
  }

  let form = "";
  let recentGoalsScored = 0;
  let recentGoalsConceded = 0;

  const relevant = recentMatches
    .filter(m => m.score.fullTime.home !== null)
    .slice(-5);

  for (const m of relevant) {
    const isHomeTeam = m.homeTeam.id === teamId;
    const scored = isHomeTeam ? (m.score.fullTime.home ?? 0) : (m.score.fullTime.away ?? 0);
    const conceded = isHomeTeam ? (m.score.fullTime.away ?? 0) : (m.score.fullTime.home ?? 0);
    recentGoalsScored += scored;
    recentGoalsConceded += conceded;
    if (scored > conceded) form += "W";
    else if (scored === conceded) form += "D";
    else form += "L";
  }

  const count = relevant.length || 1;
  recentGoalsScored = recentGoalsScored / count;
  recentGoalsConceded = recentGoalsConceded / count;
  if (!form) form = "NNNNN";

  return {
    leagueAvgGoals: leagueAvgGoalsFor,
    attackStrength,
    defenceStrength,
    form,
    recentGoalsScored,
    recentGoalsConceded,
    homeAwayRecord,
    winPct,
  };
}

export function calcExpectedGoals(
  homeAttack: number,
  awayDefence: number,
  leagueAvgHome: number,
  awayAttack: number,
  homeDefence: number,
  leagueAvgAway: number
) {
  const HOME_ADVANTAGE = 1.1;
  const lambdaHome = Math.max(0.2, homeAttack * awayDefence * leagueAvgHome * HOME_ADVANTAGE);
  const lambdaAway = Math.max(0.2, awayAttack * homeDefence * leagueAvgAway);
  return { lambdaHome, lambdaAway };
}

export function probToOdds(prob: number): number {
  const margin = 1.08;
  return Math.max(1.01, parseFloat(((1 / prob) * (1 / margin)).toFixed(2)));
}

export function generateOdds(homeWin: number, draw: number, awayWin: number) {
  return {
    homeWinOdds: probToOdds(homeWin),
    drawOdds: probToOdds(draw),
    awayWinOdds: probToOdds(awayWin),
  };
}

export function makePrediction(
  homeWin: number, draw: number, awayWin: number, btts: number, over25: number
): { prediction: string; predictionLabel: string; confidence: number } {
  const probs = [
    { prediction: "home", label: "Home Win", prob: homeWin },
    { prediction: "draw", label: "Draw", prob: draw },
    { prediction: "away", label: "Away Win", prob: awayWin },
    { prediction: "btts", label: "Both Teams to Score", prob: btts },
    { prediction: "over25", label: "Over 2.5 Goals", prob: over25 },
  ];

  const best = probs.reduce((a, b) => (a.prob > b.prob ? a : b));
  return {
    prediction: best.prediction,
    predictionLabel: best.label,
    confidence: best.prob,
  };
}

export function calcValueRating(confidence: number, odds: number): number {
  const impliedProb = 1 / odds;
  const edge = confidence - impliedProb;
  return Math.max(0, Math.min(10, 5 + edge * 30));
}

export function buildAnalysisNotes(
  homeTeam: string,
  awayTeam: string,
  homeStats: TeamStats,
  awayStats: TeamStats,
  probs: { homeWin: number; draw: number; awayWin: number; btts: number; over25: number },
  xG: { lambdaHome: number; lambdaAway: number }
): string[] {
  const notes: string[] = [];

  const formW = (f: string) => (f.split("").filter(c => c === "W").length);
  const hw = formW(homeStats.form), aw = formW(awayStats.form);

  if (hw >= 3) notes.push(`${homeTeam} are in excellent form — ${hw} wins from last 5.`);
  else if (hw <= 1) notes.push(`${homeTeam} struggling — only ${hw} win from last 5.`);

  if (aw >= 3) notes.push(`${awayTeam} are in excellent form — ${aw} wins from last 5.`);
  else if (aw <= 1) notes.push(`${awayTeam} struggling — only ${aw} win from last 5.`);

  if (probs.btts > 0.6) notes.push(`Both teams to score looks likely (${(probs.btts * 100).toFixed(0)}%) — both sides average over 1.2 goals per game.`);
  if (probs.over25 > 0.65) notes.push(`Over 2.5 goals expected (${(probs.over25 * 100).toFixed(0)}%) given combined attacking output.`);
  if (probs.homeWin > 0.55) notes.push(`Strong home advantage: model gives ${homeTeam} a ${(probs.homeWin * 100).toFixed(0)}% win probability.`);
  if (probs.awayWin > 0.45) notes.push(`Upset possible — ${awayTeam} have the firepower to win away (${(probs.awayWin * 100).toFixed(0)}%).`);

  notes.push(`xG model: ${homeTeam} ${xG.lambdaHome.toFixed(2)} – ${xG.lambdaAway.toFixed(2)} ${awayTeam}.`);
  notes.push(`Home attack strength: ${homeStats.attackStrength.toFixed(2)}x league avg. Away defence: ${awayStats.defenceStrength.toFixed(2)}x league avg.`);

  return notes.slice(0, 5);
}
