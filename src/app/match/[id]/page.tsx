import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { provider } from "@/lib/football/api-football";
import { Flag } from "@/components/Flag";
import { PredictionForm } from "@/components/PredictionForm";
import { formatKickoff, isLocked } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) notFound();

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  const fx = await prisma.fixture.findUnique({
    where: { id },
    include: {
      homeTeam: true, awayTeam: true,
      goals: { orderBy: { minute: "asc" } },
      predictions: { include: { user: true } },
    },
  });
  if (!fx) notFound();

  const locked = isLocked(fx.kickoff) || fx.status !== "SCHEDULED";
  const myPrediction = fx.predictions.find((p) => p.userId === userId) ?? null;

  // Squad list for the goalscorer picker — only needed before lock.
  let players: { id: number; name: string }[] = [];
  if (!locked && userId) {
    try {
      const [h, a] = await Promise.all([provider.getSquad(fx.homeTeamId), provider.getSquad(fx.awayTeamId)]);
      players = [...h, ...a].map((p) => ({ id: p.id, name: p.name }));
    } catch { players = []; } // squad endpoint flaky/quota — form still works without it
  }

  return (
    <main className="space-y-6">
      <Link href="/" className="chip">← Back</Link>

      <section className="card p-6 text-center animate-fade-up">
        <p className="muted text-xs">{fx.round}</p>
        <div className="my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <Flag src={fx.homeTeam.flagUrl} name={fx.homeTeam.name} size={44} />
            <span className="font-medium">{fx.homeTeam.name}</span>
          </div>
          <div className="text-3xl font-semibold tabular-nums">
            {fx.homeGoals ?? "–"}<span className="muted px-1">:</span>{fx.awayGoals ?? "–"}
          </div>
          <div className="flex flex-col items-center gap-2">
            <Flag src={fx.awayTeam.flagUrl} name={fx.awayTeam.name} size={44} />
            <span className="font-medium">{fx.awayTeam.name}</span>
          </div>
        </div>
        <p className="muted text-sm">
          {fx.status === "LIVE" ? "● LIVE" : fx.status === "FINISHED" ? "Full time" : formatKickoff(fx.kickoff)}
        </p>
        {fx.goals.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {fx.goals.map((g) => (
              <span key={g.id} className="chip">
                ⚽ {g.playerName} {g.minute ? `${g.minute}'` : ""}{g.ownGoal ? " (OG)" : ""}{g.penalty ? " (P)" : ""}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Before kickoff: prediction form. After: locked summary. */}
      {!locked && userId && (
        <PredictionForm
          fixtureId={fx.id} homeName={fx.homeTeam.name} awayName={fx.awayTeam.name}
          players={players}
          existing={myPrediction ? { homeGoals: myPrediction.homeGoals, awayGoals: myPrediction.awayGoals, scorerIds: myPrediction.scorerIds } : null}
        />
      )}

      {!userId && (
        <div className="card p-5 text-center">
          <Link href="/login" className="text-accent-soft">Sign in</Link> to make a prediction.
        </div>
      )}

      {locked && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-white/80">PREDICTIONS</h3>
          {fx.predictions.length === 0 && <div className="card p-4 muted text-sm">No predictions were made.</div>}
          {fx.predictions.map((p) => (
            <div key={p.id} className="card flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{p.user.name}</div>
                <div className="muted text-sm">
                  {p.homeGoals}–{p.awayGoals}
                  {p.scorerNames.length > 0 && <> · {p.scorerNames.join(", ")}</>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold tabular-nums">{p.scored ? p.points : "—"}</div>
                <div className="muted text-[10px] uppercase tracking-wider">pts</div>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
