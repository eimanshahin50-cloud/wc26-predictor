import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export async function Leaderboard() {
  const users = await prisma.user.findMany({
    include: { predictions: { where: { scored: true }, select: { points: true } } },
  });
  const rows = users
    .map((u) => ({
      name: u.name,
      isExpert: u.isExpert,
      total: u.predictions.reduce((s, p) => s + p.points, 0),
      played: u.predictions.length,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <Card className="p-0 overflow-hidden animate-fade-up">
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="text-sm font-semibold tracking-wide text-white/80">LEADERBOARD</h2>
        <span className="chip">live</span>
      </div>
      <div className="mt-3 divide-y divide-line">
        {rows.map((r, i) => (
          <div key={r.name} className="flex items-center gap-3 px-4 py-3">
            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${i === 0 ? "bg-accent text-white" : "bg-white/5 text-white/70"}`}>
              {i + 1}
            </span>
            <div className="flex-1">
              <div className="font-medium">
                {r.name} {r.isExpert && <span className="chip ml-1">Expert</span>}
              </div>
              <div className="muted text-xs">{r.played} matches scored</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold tabular-nums">{r.total}</div>
              <div className="muted text-[10px] uppercase tracking-wider">pts</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
