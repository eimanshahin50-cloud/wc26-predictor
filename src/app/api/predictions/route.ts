import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { outcomeOf, SCORING_RULES } from "@/lib/scoring";
import { z } from "zod";

const schema = z.object({
  fixtureId: z.number().int(),
  homeGoals: z.number().int().min(0).max(30),
  awayGoals: z.number().int().min(0).max(30),
  scorerIds: z.array(z.number().int()).max(20),
  scorerNames: z.array(z.string()).max(20),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { fixtureId, homeGoals, awayGoals, scorerIds, scorerNames } = parsed.data;

  const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
  if (!fixture) return NextResponse.json({ error: "Fixture not found" }, { status: 404 });

  // SERVER-SIDE LOCK. Never trust the browser clock.
  if (new Date(fixture.kickoff).getTime() <= Date.now() || fixture.status !== "SCHEDULED") {
    return NextResponse.json({ error: "Predictions are locked for this match" }, { status: 403 });
  }

  // Enforce the scorer cap server-side too.
  const cappedIds =
    SCORING_RULES.maxScorerPredictions > 0
      ? scorerIds.slice(0, SCORING_RULES.maxScorerPredictions)
      : scorerIds;
  const cappedNames = scorerNames.slice(0, cappedIds.length);

  const outcome = outcomeOf(homeGoals, awayGoals);

  const prediction = await prisma.prediction.upsert({
    where: { userId_fixtureId: { userId, fixtureId } },
    create: { userId, fixtureId, homeGoals, awayGoals, outcome, scorerIds: cappedIds, scorerNames: cappedNames },
    update: { homeGoals, awayGoals, outcome, scorerIds: cappedIds, scorerNames: cappedNames },
  });

  return NextResponse.json({ ok: true, prediction });
}
