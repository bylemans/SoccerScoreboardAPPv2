export interface GameRules {
  format: string;
  playTime: string;
  field: string;
  goals: string;
  ball: string;
  ranking: string;
  substitutions: string;
  offside: string;
  penalty: string;
  goalKick: string;
  freeKick: string;
  cornerKick: string;
  throwIn: string;
  cards: string;
  fairplay: string;
  shoes: string;
}

export const GAME_RULES: Record<string, GameRules> = {
  '2v2': {
    format: '2v2',
    playTime: 'Max 6 wedstrijdjes x 6 min',
    field: '12,5m x 18m',
    goals: 'Verdedigd (max keeper)',
    ball: 'Maat 3',
    ranking: 'Geen rangschikking',
    substitutions: 'Iedereen speelt',
    offside: 'Geen buitenspel',
    penalty: 'Geen strafschop',
    goalKick: 'Indribbelen',
    freeKick: 'Altijd onrechtstreeks',
    cornerKick: 'Geen hoekschop',
    throwIn: 'Indribbelen',
    cards: 'Geen gele/rode kaarten',
    fairplay: 'High 5 voor en na de wedstrijd',
    shoes: 'Geen aluminium noppen toegelaten',
  },
  '3v3': {
    format: '3v3',
    playTime: 'Max 4 wedstrijdjes x 10 min',
    field: '20m x 30m',
    goals: 'Verdedigd (max keeper)',
    ball: 'Maat 3',
    ranking: 'Geen rangschikking',
    substitutions: 'Iedereen speelt',
    offside: 'Geen buitenspel',
    penalty: 'Geen strafschop',
    goalKick: 'Intrappen of indribbelen',
    freeKick: 'Altijd onrechtstreeks',
    cornerKick: 'Geen hoekschop',
    throwIn: 'Intrappen of indribbelen',
    cards: 'Geen gele/rode kaarten',
    fairplay: 'High 5 voor en na de wedstrijd',
    shoes: 'Geen aluminium noppen toegelaten',
  },
  '5v5': {
    format: '5v5',
    playTime: '4 x 15 min',
    field: '25m x 35m',
    goals: '2m x 5m',
    ball: 'Maat 4',
    ranking: 'Geen rangschikking',
    substitutions: 'Doorlopende wissels',
    offside: 'Geen buitenspel',
    penalty: 'Geen strafschop binnen doelzone',
    goalKick: 'Intrappen of indribbelen',
    freeKick: 'Altijd onrechtstreeks - 8m afstand',
    cornerKick: 'Van toepassing - 8m afstand',
    throwIn: 'Intrappen of indribbelen - 3m afstand',
    cards: 'Gele kaarten niet geboekt',
    fairplay: 'High 5 voor en na de wedstrijd',
    shoes: 'Geen aluminium noppen toegelaten',
  },
  '8v8': {
    format: '8v8',
    playTime: '4 x 15 min',
    field: 'U10-U11: 30/35m x 40/50m, U12-U13: 40/45m x 50/60m',
    goals: '2m x 5m',
    ball: 'Maat 4',
    ranking: 'Geen rangschikking',
    substitutions: 'Doorlopende wissels',
    offside: 'Geen buitenspel',
    penalty: 'Geen strafschop',
    goalKick: 'Intrappen',
    freeKick: 'Altijd onrechtstreeks',
    cornerKick: 'Van toepassing',
    throwIn: 'Inworp',
    cards: 'Gele kaarten niet geboekt',
    fairplay: 'High 5 voor en na de wedstrijd',
    shoes: 'Geen aluminium noppen toegelaten',
  },
  '11v11': {
    format: '11v11',
    playTime: 'U14-U17: 4 x 20 min, U19-U21: 2 x 45 min',
    field: 'Volledig terrein',
    goals: '2,44m x 7,32m',
    ball: 'Maat 5 (U14-U16: Maat 4)',
    ranking: 'Van toepassing',
    substitutions: 'Van toepassing',
    offside: 'Van toepassing',
    penalty: 'Van toepassing',
    goalKick: 'Intrappen',
    freeKick: '(On)rechtstreeks',
    cornerKick: 'Van toepassing',
    throwIn: 'Inworp',
    cards: 'Van toepassing',
    fairplay: 'High 5 voor en na de wedstrijd',
    shoes: 'Aluminium noppen toegelaten',
  },
};

export const getRulesForFormat = (format: string): GameRules | null => {
  // Extract the format type (e.g., "3v3" from "3v3")
  const formatKey = format.toLowerCase();
  return GAME_RULES[formatKey] || null;
};
