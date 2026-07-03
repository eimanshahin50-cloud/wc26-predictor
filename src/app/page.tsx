import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Leaderboard } from "@/components/Leaderboard";
import { FixtureCard } from "@/components/FixtureCard";
import Link from "next/link";

export const dynamic = "force-dynamic"; // always fresh leaderboard

export default async function Home() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  const fixtures = await prisma.fixture.findMany({
    orderBy: { kickoff: "asc" },
    include: {
      homeTeam: true, awayTeam: true,
      predictions: userId ? { where: { userId }, select: { id: true } } : false,
    },
  });

  const now = Date.now();
  const upcoming = fixtures.filter((f) => f.status === "SCHEDULED" && new Date(f.kickoff).getTime() > now);
  const liveOrDone = fixtures.filter((f) => !(f.status === "SCHEDULED" && new Date(f.kickoff).getTime() > now));

  const decorate = (f: any) => ({ ...f, _hasPrediction: Array.isArray(f.predictions) && f.predictions.length > 0 });

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">World Cup 2026</h1>
          <p className="muted text-sm">Amateur vs nxtmv</p>
        </div>
        {session ? (
          <Link href="/api/auth/signout" className="chip">Sign out</Link>
        ) : (
          <Link href="/login" className="chip">Sign in</Link>
        )}
      </header>

      <Leaderboard />

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/80">UPCOMING</h2>
          {upcoming.slice(0, 12).map((f) => <FixtureCard key={f.id} fx={decorate(f)} />)}
        </section>
      )}

      {liveOrDone.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/80">LIVE &amp; RESULTS</h2>
          {liveOrDone.slice().reverse().slice(0, 20).map((f) => <FixtureCard key={f.id} fx={decorate(f)} />)}
        </section>
      )}

      {fixtures.length === 0 && (
        <div className="card p-6 text-center muted">
          No fixtures yet. Run <code className="text-accent-soft">npm run sync</code> (or wait for the cron) to pull them.
        </div>
      )}
    </main>
  );
}
