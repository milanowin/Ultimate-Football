import { Position, PlayerStats } from './footballData';

export interface CustomPlayerProfile {
  name: string;
  nationality: string;
  position: Position;
  number: number;
  heightCm: number;
  skinTone: number;
  hairStyle: 'short' | 'buzz' | 'messy' | 'fade' | 'afro' | 'long';
  hairColor: string;
  bootColor: string;
  currentClubId: string;
  wagePerWeek: number;
  marketValue: number;
  overall: number;
  skillPoints: number;
  stats: PlayerStats;
  careerStats: {
    matchesPlayed: number;
    goals: number;
    assists: number;
    trophies: number;
    averageRating: number;
  };
}

export const DEFAULT_CAREER_PLAYER: CustomPlayerProfile = {
  name: 'Alex Hunter',
  nationality: 'England',
  position: 'ST',
  number: 10,
  heightCm: 182,
  skinTone: 1,
  hairStyle: 'fade',
  hairColor: '#111827',
  bootColor: '#00f0ff',
  currentClubId: 'arsenal',
  wagePerWeek: 12000,
  marketValue: 18000000,
  overall: 76,
  skillPoints: 5,
  stats: {
    pace: 82,
    shooting: 76,
    passing: 72,
    dribbling: 78,
    defending: 40,
    physical: 70,
  },
  careerStats: {
    matchesPlayed: 8,
    goals: 6,
    assists: 3,
    trophies: 1,
    averageRating: 8.2,
  },
};
