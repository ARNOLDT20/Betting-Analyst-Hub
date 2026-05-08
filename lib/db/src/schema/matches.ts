import { pgTable, text, serial, real, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leaguesTable = pgTable("leagues", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  countryFlag: text("country_flag"),
  logo: text("logo"),
});

export const matchesTable = pgTable("matches", {
  id: text("id").primaryKey(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  homeTeamLogo: text("home_team_logo"),
  awayTeamLogo: text("away_team_logo"),
  leagueId: text("league_id").notNull().references(() => leaguesTable.id),
  league: text("league").notNull(),
  country: text("country").notNull(),
  countryFlag: text("country_flag"),
  matchDate: text("match_date").notNull(),
  matchTime: text("match_time").notNull(),
  status: text("status").notNull().default("upcoming"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  homeWinOdds: real("home_win_odds").notNull(),
  drawOdds: real("draw_odds").notNull(),
  awayWinOdds: real("away_win_odds").notNull(),
  confidenceScore: real("confidence_score").notNull(),
  prediction: text("prediction").notNull(),
  predictionLabel: text("prediction_label").notNull(),
  valueRating: real("value_rating").notNull(),
  isHot: boolean("is_hot").notNull().default(false),
  homeTeamForm: text("home_team_form"),
  awayTeamForm: text("away_team_form"),
  homeRecentGoalsScored: real("home_recent_goals_scored"),
  homeRecentGoalsConceded: real("home_recent_goals_conceded"),
  awayRecentGoalsScored: real("away_recent_goals_scored"),
  awayRecentGoalsConceded: real("away_recent_goals_conceded"),
  homeWinProbability: real("home_win_probability"),
  drawProbability: real("draw_probability"),
  awayWinProbability: real("away_win_probability"),
  bttsProb: real("btts_prob"),
  over25Prob: real("over25_prob"),
  expectedHomeGoals: real("expected_home_goals"),
  expectedAwayGoals: real("expected_away_goals"),
  headToHead: jsonb("head_to_head"),
  analysisNotes: jsonb("analysis_notes"),
  homeAwayRecord: text("home_away_record"),
  awayHomeRecord: text("away_home_record"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const betOfTheDayTable = pgTable("bet_of_the_day", {
  id: text("id").primaryKey(),
  generatedAt: timestamp("generated_at").defaultNow(),
  totalOdds: real("total_odds").notNull(),
  averageConfidence: real("average_confidence").notNull(),
  selections: jsonb("selections").notNull(),
  analysisNote: text("analysis_note").notNull(),
  date: text("date").notNull(),
});

export const insertMatchSchema = createInsertSchema(matchesTable);
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;

export const insertLeagueSchema = createInsertSchema(leaguesTable);
export type InsertLeague = z.infer<typeof insertLeagueSchema>;
export type League = typeof leaguesTable.$inferSelect;

export const insertBetOfTheDaySchema = createInsertSchema(betOfTheDayTable);
export type InsertBetOfTheDay = z.infer<typeof insertBetOfTheDaySchema>;
export type BetOfTheDay = typeof betOfTheDayTable.$inferSelect;
