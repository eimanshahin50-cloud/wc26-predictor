// Scoring engine — pure & unit-tested. See scoring.test.mjs for the proof.
// CHANGE YOUR RULES HERE. Every decision your spec left ambiguous is an explicit flag.

export const SCORING_RULES = {
  pointsOutcome: 3,            // correct winner or draw
  pointsExact: 5,             // exact final scoreline
  pointsPerScorer: 2,         // per distinct correctly-predicted goalscorer
  stackOutcomeAndExact: false, // false: exact = 5 (it already implies the outcome). true: exact = 8.
  countOwnGoalsForScorers: false, // own-goal scorers don't count as "goalscorer" hits
  maxScorerPredictions: 3,    // anti "predict every player" cap. 0 = unlimited.
} as const;

export type Outcome = "HOME" | "AWAY" | "DRAW";

export function outcomeOf(home: number, away: number): Outcome {
  return home > away ? "HOME" : home < away ? "AWAY" : "DRAW";
}

export interface PredictionInput {
  homeGoals: number;
  awayGoals: number;
  scorerIds: number[];
}

export interface ActualResult {
  homeGoals: number;
  awayGoals: number;
  scorerIds: number[]; // real goalscorer player ids (own goals already excluded by caller per rules)
}

export interface ScoreResult {
  points: number;
  breakdown: { exact?: number; outcome?: number; scorers?: number };
  hitScorers: number[];
}

export function scorePrediction(
  prediction: PredictionInput,
  actual: ActualResult,
  rules: typeof SCORING_RULES = SCORING_RULES
): ScoreResult {
  let points = 0;
  const breakdown: ScoreResult["breakdown"] = {};

  const exact =
    prediction.homeGoals === actual.homeGoals &&
    prediction.awayGoals === actual.awayGoals;
  const outcomeRight =
    outcomeOf(prediction.homeGoals, prediction.awayGoals) ===
    outcomeOf(actual.homeGoals, actual.awayGoals);

  if (exact) {
    points += rules.pointsExact;
    breakdown.exact = rules.pointsExact;
    if (rules.stackOutcomeAndExact && outcomeRight) {
      points += rules.pointsOutcome;
      breakdown.outcome = rules.pointsOutcome;
    }
  } else if (outcomeRight) {
    points += rules.pointsOutcome;
    breakdown.outcome = rules.pointsOutcome;
  }

  const actualSet = new Set(actual.scorerIds);
  let predicted = [...new Set(prediction.scorerIds)];
  if (rules.maxScorerPredictions > 0) {
    predicted = predicted.slice(0, rules.maxScorerPredictions);
  }
  const hits = predicted.filter((id) => actualSet.has(id));
  if (hits.length) {
    breakdown.scorers = hits.length * rules.pointsPerScorer;
    points += breakdown.scorers;
  }

  return { points, breakdown, hitScorers: hits };
}
