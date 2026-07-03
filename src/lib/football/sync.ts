// Sync orchestration: pull provider data -> upsert into DB -> score finished matches.
// Idempotent: safe to run repeatedly (cron). Scoring guarded by Fixture.pointsAwarded.
import { prisma } from "@/lib/prisma";
import { provider } from "./api-football";
import { scorePrediction, SCORING_RULES } from "@/lib/scoring";
import type { MatchStatus } from "@prisma/client";

export async function syncFixtures() {
  const fixtures = await provider.getFixtures();
  for (const f of fixtures) {
    // Upsert both teams first (FK targets).
    for (const t of [f.home, f.away]) {
      await prisma.team.upsert({
        where: { id: t.id },
        create: { id: t.id, name: t.name, shortName: t.shortName, flagUrl: t.flagUrl },
        update: { name: t.name, flagUrl: t.flagUrl },
      });
    }
    await prisma.fixture.upsert({
      where: { id: f.id },
      create: {
        id: f.id, round: f.round, kickoff: new Date(f.kickoff),
        status: f.status as MatchStatus,
        homeTeamId: f.home.id, awayTeamId: f.away.id,
        homeGoals: f.homeGoals, awayGoals: f.awayGoals,
      },
      update: {
        round: f.round, kickoff: new Date(f.kickoff), status: f.status as MatchStatus,
        homeGoals: f.homeGoals, awayGoals: f.awayGoals,
      },
    });
  }
  return fixtures.length;
}

// Pull goal events for live/finished fixtures that aren't fully scored yet.
export async function syncGoals() {
  const fixtures = await prisma.fixture.findMany({
    where: { status: { in: ["LIVE", "FINISHED"] } },
    select: { id: true },
  });
  let total = 0;
  for (const { id } of fixtures) {
    const goals = await provider.getFixtureGoals(id);
    for (const g of goals) {
      await prisma.goal.upsert({
        where: { providerEventId: g.providerEventId },
        create: {
          providerEventId: g.providerEventId, fixtureId: g.fixtureId, teamId: g.teamId,
          playerId: g.playerId, playerName: g.playerName, minute: g.minute,
          ownGoal: g.ownGoal, penalty: g.penalty,
        },
        update: {},
      });
      total++;
    }
  }
  return total;
}

// Award points for finished, not-yet-scored matches. Idempotent.
export async function scoreFinishedMatches() {
  const finished = await prisma.fixture.findMany({
    where: { status: "FINISHED", pointsAwarded: false, homeGoals: { not: null }, awayGoals: { not: null } },
    include: { goals: true, predictions: true },
  });

  let scoredMatches = 0;
  for (const fx of finished) {
    const realScorerIds = fx.goals
      .filter((g) => SCORING_RULES.countOwnGoalsForScorers ? true : !g.ownGoal)
      .map((g) => g.playerId);

    const actual = { homeGoals: fx.homeGoals!, awayGoals: fx.awayGoals!, scorerIds: realScorerIds };

    await prisma.$transaction(async (tx) => {
      for (const p of fx.predictions) {
        const { points } = scorePrediction(
          { homeGoals: p.homeGoals, awayGoals: p.awayGoals, scorerIds: p.scorerIds },
          actual
        );
        await tx.prediction.update({
          where: { id: p.id },
          data: { points, scored: true },
        });
      }
      await tx.fixture.update({ where: { id: fx.id }, data: { pointsAwarded: true } });
    });
    scoredMatches++;
  }
  return scoredMatches;
}

export async function runFullSync() {
  const fixtures = await syncFixtures();
  const goals = await syncGoals();
  const scored = await scoreFinishedMatches();
  return { fixtures, goals, scored, at: new Date().toISOString() };
}
