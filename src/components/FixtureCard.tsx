import Link from "next/link";
import { Flag } from "@/components/Flag";
import { formatKickoff, isLocked } from "@/lib/utils";

type FixtureLite = {
  id: number; kickoff: Date; status: string; round: string | null;
  homeGoals: number | null; awayGoals: number | null;
  homeTeam: { name: string; flagUrl: string | null };
  awayTeam: { name: string; flagUrl: string | null };
  _hasPrediction?: boolean;
};

export function FixtureCard({ fx }: { fx: FixtureLite }) {
  const live = fx.status === "LIVE";
  const finished = fx.status === "FINISHED";
  const locked = isLocked(fx.kickoff) || fx.status !== "SCHEDULED";

  return (
    <Link href={`/match/${fx.id}`} className="block animate-fade-up">
      <div className="card p-4 transition hover:border-white/20 hover:shadow-glow">
        <div className="mb-3 flex items-center justify-between">
          <span className="muted text-xs">{fx.round ?? "Fixture"}</span>
          {live ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-live">
              <span className="h-1.5 w-1.5 rounded-full bg-live animate-live" /> LIVE
            </span>
          ) : finished ? (
            <span className="chip">FT</span>
          ) : (
            <span className="muted text-xs">{formatKickoff(fx.kickoff)}</span>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center gap-2 justify-self-start">
            <Flag src={fx.homeTeam.flagUrl} name={fx.homeTeam.name} />
            <span className="font-medium">{fx.homeTeam.name}</span>
          </div>
          <div className="text-center font-semibold tabular-nums">
            {fx.homeGoals ?? "–"} <span className="muted">:</span> {fx.awayGoals ?? "–"}
          </div>
          <div className="flex items-center gap-2 justify-self-end">
            <span className="font-medium">{fx.awayTeam.name}</span>
            <Flag src={fx.awayTeam.flagUrl} name={fx.awayTeam.name} />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          {!locked ? (
            <span className="chip text-accent-soft border-accent/30">
              {fx._hasPrediction ? "Edit prediction" : "Make prediction"}
            </span>
          ) : (
            <span className="muted text-xs">{fx._hasPrediction ? "Prediction locked" : "Locked"}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
