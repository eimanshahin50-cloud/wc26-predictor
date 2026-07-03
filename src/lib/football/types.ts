// Provider-agnostic shapes. The rest of the app only ever sees THESE types,
// never the raw provider JSON. Swap providers => only api-football.ts changes.

export interface ProviderTeam {
  id: number;
  name: string;
  shortName?: string;
  flagUrl?: string;
}

export type ProviderStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED";

export interface ProviderFixture {
  id: number;
  round?: string;
  kickoff: string; // ISO
  status: ProviderStatus;
  home: ProviderTeam;
  away: ProviderTeam;
  homeGoals: number | null;
  awayGoals: number | null;
}

export interface ProviderGoal {
  providerEventId: string;
  fixtureId: number;
  teamId: number;
  playerId: number;
  playerName: string;
  minute?: number;
  ownGoal: boolean;
  penalty: boolean;
}

export interface ProviderPlayer {
  id: number;
  name: string;
  teamId: number;
}

export interface FootballProvider {
  getFixtures(): Promise<ProviderFixture[]>;
  getFixtureGoals(fixtureId: number): Promise<ProviderGoal[]>;
  getSquad(teamId: number): Promise<ProviderPlayer[]>;
}
