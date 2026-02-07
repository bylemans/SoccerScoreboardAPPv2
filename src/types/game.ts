export interface GameFormat {
  id: string;
  ageGroup: string;
  format: string;
  periodCount: number;
  periodDuration: number; // in minutes
  periodName: string; // "period", "quarter", or "half"
}

export const GAME_FORMATS: GameFormat[] = [
  {
    id: 'u7',
    ageGroup: 'U7',
    format: '3v3',
    periodCount: 4,
    periodDuration: 10,
    periodName: 'quarter',
  },
  {
    id: 'u8-9',
    ageGroup: 'U8-9',
    format: '5v5',
    periodCount: 4,
    periodDuration: 15,
    periodName: 'quarter',
  },
  {
    id: 'u10-13',
    ageGroup: 'U10-13',
    format: '8v8',
    periodCount: 4,
    periodDuration: 15,
    periodName: 'quarter',
  },
  {
    id: 'u14-17',
    ageGroup: 'U14-17',
    format: '11v11',
    periodCount: 4,
    periodDuration: 20,
    periodName: 'quarter',
  },
  {
    id: 'u19-21',
    ageGroup: 'U19-21',
    format: '11v11',
    periodCount: 2,
    periodDuration: 45,
    periodName: 'half',
  },
];
