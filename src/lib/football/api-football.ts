// ============================================================================
//  API-Football (api-sports.io) provider implementation.
//  >>> THIS IS THE ONLY FILE THAT KNOWS YOUR API KEY <<<
//  Set FOOTBALL_API_KEY in your environment (.env / Vercel project settings).
//
//  Why API-Football: free tier covers fixtures + live scores + goal EVENTS
//  (goalscorers). Free tier = 100 requests/day — fine for a 2-person game
//  syncing a few times an hour, NOT fine for 30s live polling. See README.
//
//  WC 2026 season id = 2026. League id for "World Cup" on API-Football = 1.
//  Verify both against your account's /leagues response before trusting them.
// ============================================================================
import type {
  FootballProvider, ProviderFixture, ProviderGoal, ProviderPlayer, ProviderStatus,
} from "./types";

const BASE = "https://v3.football.api-sports.io";
const LEAGUE_ID = Number(process.env.FOOTBALL_LEAGUE_ID ?? 1);
const SEASON = Number(process.env.FOOTBALL_SEASON ?? 2026);

function key(): string {
  const k = process.env.FOOTBALL_API_KEY;
  if (!k) throw new Error("FOOTBALL_API_KEY is not set. Add it to your env.");
  return k;
}

async function call(path: string, params: Record<string, string | number>) {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url, {
    headers: { "x-apisports-key": key() },
    // Cache at the edge so live matchdays don't burn your quota. Tune in README.
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`API-Football ${path} -> ${res.status} ${await res.text()}`);
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length) {
    throw new Error(`API-Football ${path} errors: ${JSON.stringify(json.errors)}`);
  }
  return json.response as any[];
}

function mapStatus(short: string): ProviderStatus {
  // https://www.api-football.com/documentation-v3#tag/Fixtures
  if (["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"].includes(short)) return "LIVE";
  if (["FT", "AET", "PEN"].includes(short)) return "FINISHED";
  if (["PST", "CANC", "ABD", "SUSP", "TBD"].includes(short)) return "POSTPONED";
  return "SCHEDULED"; // NS, etc.
}

export const apiFootball: FootballProvider = {
  async getFixtures() {
    const rows = await call("/fixtures", { league: LEAGUE_ID, season: SEASON });
    return rows.map((r): ProviderFixture => ({
      id: r.fixture.id,
      round: r.league?.round,
      kickoff: r.fixture.date,
      status: mapStatus(r.fixture.status.short),
      home: { id: r.teams.home.id, name: r.teams.home.name, flagUrl: r.teams.home.logo },
      away: { id: r.teams.away.id, name: r.teams.away.name, flagUrl: r.teams.away.logo },
      homeGoals: r.goals.home,
      awayGoals: r.goals.away,
    }));
  },

  async getFixtureGoals(fixtureId) {
    const events = await call("/fixtures/events", { fixture: fixtureId });
    return events
      .filter((e) => e.type === "Goal" && e.detail !== "Missed Penalty")
      .map((e, i): ProviderGoal => ({
        providerEventId: `${fixtureId}:${e.time?.elapsed ?? 0}:${e.player?.id ?? i}:${e.detail}`,
        fixtureId,
        teamId: e.team.id,
        playerId: e.player?.id ?? -1,
        playerName: e.player?.name ?? "Unknown",
        minute: e.time?.elapsed ?? undefined,
        ownGoal: e.detail === "Own Goal",
        penalty: e.detail === "Penalty",
      }));
  },

  async getSquad(teamId) {
    const rows = await call("/players/squads", { team: teamId });
    const players = rows?.[0]?.players ?? [];
    return players.map((p: any): ProviderPlayer => ({ id: p.id, name: p.name, teamId }));
  },
};

export const provider: FootballProvider = apiFootball;
