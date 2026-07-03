// Standalone, dependency-free test of the exact scoring algorithm.
// This same algorithm is ported (with TS types) into src/lib/scoring.ts.

const RULES = {
  pointsOutcome: 3,
  pointsExact: 5,
  pointsPerScorer: 2,
  stackOutcomeAndExact: false, // false => exact (5) supersedes outcome (3), not 8
  countOwnGoalsForScorers: false,
  maxScorerPredictions: 3, // anti "predict everyone" cap; 0 = unlimited
};

function outcome(h, a) { return h > a ? "HOME" : h < a ? "AWAY" : "DRAW"; }

// prediction: { homeGoals, awayGoals, scorerIds: number[] }
// actual:     { homeGoals, awayGoals, scorerIds: number[] (real scorers, own goals excluded by caller) }
function scorePrediction(prediction, actual, rules = RULES) {
  let pts = 0;
  const breakdown = {};

  const exact = prediction.homeGoals === actual.homeGoals && prediction.awayGoals === actual.awayGoals;
  const outcomeRight = outcome(prediction.homeGoals, prediction.awayGoals) === outcome(actual.homeGoals, actual.awayGoals);

  if (exact) {
    pts += rules.pointsExact;
    breakdown.exact = rules.pointsExact;
    if (rules.stackOutcomeAndExact && outcomeRight) {
      pts += rules.pointsOutcome;
      breakdown.outcome = rules.pointsOutcome;
    }
  } else if (outcomeRight) {
    pts += rules.pointsOutcome;
    breakdown.outcome = rules.pointsOutcome;
  }

  // Goalscorers: distinct predicted players who actually scored. Capped.
  const actualSet = new Set(actual.scorerIds);
  let predicted = [...new Set(prediction.scorerIds)];
  if (rules.maxScorerPredictions > 0) predicted = predicted.slice(0, rules.maxScorerPredictions);
  const hits = predicted.filter((id) => actualSet.has(id));
  if (hits.length) {
    breakdown.scorers = hits.length * rules.pointsPerScorer;
    pts += breakdown.scorers;
  }

  return { points: pts, breakdown, hitScorers: hits };
}

// ---- tests ----
let pass = 0, fail = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "✓" : "✗"} ${name}` + (ok ? "" : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
}

// Actual: Argentina(home,10,11) 2-1 Brazil. Scorers: players 10, 11 (Argentina), 20 (Brazil)
const actual = { homeGoals: 2, awayGoals: 1, scorerIds: [10, 11, 20] };

eq("exact + outcome (no stack) = 5", scorePrediction({homeGoals:2,awayGoals:1,scorerIds:[]}, actual).points, 5);
eq("correct outcome only = 3", scorePrediction({homeGoals:3,awayGoals:0,scorerIds:[]}, actual).points, 3);
eq("wrong outcome = 0", scorePrediction({homeGoals:0,awayGoals:2,scorerIds:[]}, actual).points, 0);
eq("exact + 2 correct scorers = 5+4=9", scorePrediction({homeGoals:2,awayGoals:1,scorerIds:[10,11]}, actual).points, 9);
eq("outcome + 1 scorer = 3+2=5", scorePrediction({homeGoals:5,awayGoals:1,scorerIds:[20]}, actual).points, 5);
eq("scorer farming capped at 3", scorePrediction({homeGoals:9,awayGoals:9,scorerIds:[10,11,20,99,98]}, actual).points, 6); // 3 hits *2, no outcome
eq("duplicate predicted scorer counts once", scorePrediction({homeGoals:9,awayGoals:9,scorerIds:[10,10,10]}, actual).points, 2);
eq("predicted scorer who didn't score = 0 scorer pts", scorePrediction({homeGoals:9,awayGoals:9,scorerIds:[55]}, actual).points, 0);
eq("draw exact", scorePrediction({homeGoals:1,awayGoals:1,scorerIds:[]}, {homeGoals:1,awayGoals:1,scorerIds:[]}).points, 5);

// stacking variant
const stack = {...RULES, stackOutcomeAndExact:true};
eq("with stacking, exact = 8", scorePrediction({homeGoals:2,awayGoals:1,scorerIds:[]}, actual, stack).points, 8);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
