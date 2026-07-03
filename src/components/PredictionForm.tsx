"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SCORING_RULES } from "@/lib/scoring";

type Player = { id: number; name: string };
type Existing = { homeGoals: number; awayGoals: number; scorerIds: number[] } | null;

export function PredictionForm({
  fixtureId, homeName, awayName, players, existing,
}: {
  fixtureId: number; homeName: string; awayName: string;
  players: Player[]; existing: Existing;
}) {
  const router = useRouter();
  const [home, setHome] = useState(existing?.homeGoals ?? 0);
  const [away, setAway] = useState(existing?.awayGoals ?? 0);
  const [scorers, setScorers] = useState<number[]>(existing?.scorerIds ?? []);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const cap = SCORING_RULES.maxScorerPredictions;

  function toggleScorer(id: number) {
    setScorers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id)
      : cap > 0 && prev.length >= cap ? prev
      : [...prev, id]
    );
  }

  async function save() {
    setSaving(true); setMsg("");
    const scorerNames = scorers.map((id) => players.find((p) => p.id === id)?.name ?? "");
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fixtureId, homeGoals: home, awayGoals: away, scorerIds: scorers, scorerNames }),
    });
    setSaving(false);
    if (res.ok) { setMsg("Saved ✓"); router.refresh(); }
    else { const j = await res.json().catch(() => ({})); setMsg(j.error ?? "Could not save"); }
  }

  const Stepper = ({ value, set, label }: { value: number; set: (n: number) => void; label: string }) => (
    <div className="flex flex-col items-center gap-2">
      <span className="muted text-xs">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={() => set(Math.max(0, value - 1))} className="h-9 w-9 rounded-full border border-line text-lg">–</button>
        <span className="w-8 text-center text-2xl font-semibold tabular-nums">{value}</span>
        <button onClick={() => set(Math.min(20, value + 1))} className="h-9 w-9 rounded-full border border-line text-lg">+</button>
      </div>
    </div>
  );

  return (
    <div className="card space-y-5 p-5 animate-fade-up">
      <h3 className="text-sm font-semibold text-white/80">YOUR PREDICTION</h3>
      <div className="flex items-center justify-center gap-8">
        <Stepper value={home} set={setHome} label={homeName} />
        <span className="muted text-xl">:</span>
        <Stepper value={away} set={setAway} label={awayName} />
      </div>

      {players.length > 0 && (
        <div>
          <p className="muted mb-2 text-xs">
            Goalscorers {cap > 0 ? `(pick up to ${cap}, +${SCORING_RULES.pointsPerScorer} each)` : ""}
          </p>
          <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
            {players.map((p) => {
              const on = scorers.includes(p.id);
              return (
                <button key={p.id} onClick={() => toggleScorer(p.id)}
                  className={`chip transition ${on ? "bg-accent text-white border-accent" : "hover:bg-white/10"}`}>
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="muted text-xs">{msg}</span>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save prediction"}</Button>
      </div>
    </div>
  );
}
