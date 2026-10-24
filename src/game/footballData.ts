export type Position = 'GK' | 'LB' | 'CB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'ST';

export type CardRarity = 'bronze' | 'silver' | 'gold' | 'rare' | 'special' | 'icon';

export interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: Position;
  overall: number;
  clubId: string;
  nation: string;
  cardRarity: CardRarity;
  stats: PlayerStats;
  heightCm: number;
  skinTone: number; // 0 to 4
  hairStyle: 'short' | 'buzz' | 'messy' | 'fade' | 'afro' | 'long';
  hairColor: string;
  bootColor: string;
  priceCoins: number;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  league: string;
  rating: number; // 1 to 5 stars or overall ~85
  primaryColor: string; // Jersey
  secondaryColor: string; // Shorts / Stripes
  sockColor: string;
  numberColor: string;
  stadiumName: string;
}

export const CLUBS: Record<string, Club> = {
  'real-madrid': {
    id: 'real-madrid',
    name: 'Real Madrid',
    shortName: 'RMA',
    league: 'La Liga',
    rating: 88,
    primaryColor: '#ffffff',
    secondaryColor: '#1e1b4b',
    sockColor: '#ffffff',
    numberColor: '#ca8a04',
    stadiumName: 'Santiago Bernabéu',
  },
  'barcelona': {
    id: 'barcelona',
    name: 'FC Barcelona',
    shortName: 'BAR',
    league: 'La Liga',
    rating: 86,
    primaryColor: '#1e3a8a', // Deep blau
    secondaryColor: '#991b1b', // Grana
    sockColor: '#1e3a8a',
    numberColor: '#eab308',
    stadiumName: 'Spotify Camp Nou',
  },
  'man-city': {
    id: 'man-city',
    name: 'Manchester City',
    shortName: 'MCI',
    league: 'Premier League',
    rating: 89,
    primaryColor: '#67e8f9', // Sky blue
    secondaryColor: '#0f172a',
    sockColor: '#ffffff',
    numberColor: '#0f172a',
    stadiumName: 'Etihad Stadium',
  },
  'arsenal': {
    id: 'arsenal',
    name: 'Arsenal',
    shortName: 'ARS',
    league: 'Premier League',
    rating: 86,
    primaryColor: '#dc2626',
    secondaryColor: '#ffffff',
    sockColor: '#dc2626',
    numberColor: '#ffffff',
    stadiumName: 'Emirates Stadium',
  },
  'liverpool': {
    id: 'liverpool',
    name: 'Liverpool',
    shortName: 'LIV',
    league: 'Premier League',
    rating: 87,
    primaryColor: '#b91c1c',
    secondaryColor: '#b91c1c',
    sockColor: '#b91c1c',
    numberColor: '#facc15',
    stadiumName: 'Anfield',
  },
  'bayern': {
    id: 'bayern',
    name: 'Bayern Munich',
    shortName: 'BAY',
    league: 'Bundesliga',
    rating: 87,
    primaryColor: '#e11d48',
    secondaryColor: '#ffffff',
    sockColor: '#e11d48',
    numberColor: '#ffffff',
    stadiumName: 'Allianz Arena',
  },
  'psg': {
    id: 'psg',
    name: 'Paris Saint-Germain',
    shortName: 'PSG',
    league: 'Ligue 1',
    rating: 86,
    primaryColor: '#0f172a',
    secondaryColor: '#dc2626',
    sockColor: '#0f172a',
    numberColor: '#ffffff',
    stadiumName: 'Parc des Princes',
  },
  'inter': {
    id: 'inter',
    name: 'Inter Milan',
    shortName: 'INT',
    league: 'Serie A',
    rating: 85,
    primaryColor: '#1d4ed8',
    secondaryColor: '#09090b',
    sockColor: '#09090b',
    numberColor: '#fbbf24',
    stadiumName: 'San Siro',
  },
};

export const ALL_PLAYERS: Player[] = [
  // Superstars & Icons
  {
    id: 'mbappe',
    name: 'Kylian Mbappé',
    number: 9,
    position: 'ST',
    overall: 91,
    clubId: 'real-madrid',
    nation: 'France',
    cardRarity: 'rare',
    stats: { pace: 97, shooting: 90, passing: 80, dribbling: 92, defending: 36, physical: 78 },
    heightCm: 178,
    skinTone: 2,
    hairStyle: 'buzz',
    hairColor: '#111827',
    bootColor: '#06b6d4',
    priceCoins: 120000,
  },
  {
    id: 'haaland',
    name: 'Erling Haaland',
    number: 9,
    position: 'ST',
    overall: 91,
    clubId: 'man-city',
    nation: 'Norway',
    cardRarity: 'rare',
    stats: { pace: 89, shooting: 93, passing: 66, dribbling: 81, defending: 45, physical: 88 },
    heightCm: 194,
    skinTone: 0,
    hairStyle: 'long',
    hairColor: '#fde047',
    bootColor: '#e11d48',
    priceCoins: 115000,
  },
  {
    id: 'vinicius',
    name: 'Vinícius Jr.',
    number: 7,
    position: 'LW',
    overall: 90,
    clubId: 'real-madrid',
    nation: 'Brazil',
    cardRarity: 'rare',
    stats: { pace: 95, shooting: 84, passing: 81, dribbling: 91, defending: 29, physical: 69 },
    heightCm: 176,
    skinTone: 3,
    hairStyle: 'fade',
    hairColor: '#111827',
    bootColor: '#84cc16',
    priceCoins: 98000,
  },
  {
    id: 'bellingham',
    name: 'Jude Bellingham',
    number: 5,
    position: 'CAM',
    overall: 90,
    clubId: 'real-madrid',
    nation: 'England',
    cardRarity: 'rare',
    stats: { pace: 80, shooting: 87, passing: 83, dribbling: 88, defending: 78, physical: 83 },
    heightCm: 186,
    skinTone: 2,
    hairStyle: 'fade',
    hairColor: '#111827',
    bootColor: '#f97316',
    priceCoins: 95000,
  },
  {
    id: 'debruyne',
    name: 'Kevin De Bruyne',
    number: 17,
    position: 'CM',
    overall: 90,
    clubId: 'man-city',
    nation: 'Belgium',
    cardRarity: 'rare',
    stats: { pace: 67, shooting: 87, passing: 94, dribbling: 87, defending: 65, physical: 75 },
    heightCm: 181,
    skinTone: 0,
    hairStyle: 'short',
    hairColor: '#f59e0b',
    bootColor: '#3b82f6',
    priceCoins: 85000,
  },
  {
    id: 'yamal',
    name: 'Lamine Yamal',
    number: 19,
    position: 'RW',
    overall: 85,
    clubId: 'barcelona',
    nation: 'Spain',
    cardRarity: 'special',
    stats: { pace: 90, shooting: 78, passing: 82, dribbling: 89, defending: 35, physical: 56 },
    heightCm: 180,
    skinTone: 2,
    hairStyle: 'messy',
    hairColor: '#111827',
    bootColor: '#a855f7',
    priceCoins: 65000,
  },
  {
    id: 'lewandowski',
    name: 'Robert Lewandowski',
    number: 9,
    position: 'ST',
    overall: 88,
    clubId: 'barcelona',
    nation: 'Poland',
    cardRarity: 'rare',
    stats: { pace: 75, shooting: 88, passing: 79, dribbling: 84, defending: 44, physical: 80 },
    heightCm: 185,
    skinTone: 0,
    hairStyle: 'short',
    hairColor: '#1f2937',
    bootColor: '#eab308',
    priceCoins: 55000,
  },
  {
    id: 'salah',
    name: 'Mohamed Salah',
    number: 11,
    position: 'RW',
    overall: 89,
    clubId: 'liverpool',
    nation: 'Egypt',
    cardRarity: 'rare',
    stats: { pace: 89, shooting: 87, passing: 82, dribbling: 88, defending: 45, physical: 76 },
    heightCm: 175,
    skinTone: 2,
    hairStyle: 'afro',
    hairColor: '#111827',
    bootColor: '#10b981',
    priceCoins: 78000,
  },
  {
    id: 'vandijk',
    name: 'Virgil van Dijk',
    number: 4,
    position: 'CB',
    overall: 89,
    clubId: 'liverpool',
    nation: 'Netherlands',
    cardRarity: 'rare',
    stats: { pace: 78, shooting: 60, passing: 71, dribbling: 72, defending: 89, physical: 86 },
    heightCm: 193,
    skinTone: 2,
    hairStyle: 'long',
    hairColor: '#111827',
    bootColor: '#6366f1',
    priceCoins: 75000,
  },
  {
    id: 'saka',
    name: 'Bukayo Saka',
    number: 7,
    position: 'RW',
    overall: 87,
    clubId: 'arsenal',
    nation: 'England',
    cardRarity: 'rare',
    stats: { pace: 87, shooting: 83, passing: 81, dribbling: 87, defending: 65, physical: 76 },
    heightCm: 178,
    skinTone: 3,
    hairStyle: 'fade',
    hairColor: '#111827',
    bootColor: '#ec4899',
    priceCoins: 62000,
  },
  {
    id: 'messi',
    name: 'Lionel Messi',
    number: 10,
    position: 'RW',
    overall: 92,
    clubId: 'barcelona',
    nation: 'Argentina',
    cardRarity: 'special',
    stats: { pace: 80, shooting: 89, passing: 92, dribbling: 94, defending: 33, physical: 64 },
    heightCm: 170,
    skinTone: 0,
    hairStyle: 'short',
    hairColor: '#451a03',
    bootColor: '#00f0ff',
    priceCoins: 160000,
  },
  {
    id: 'ronaldo',
    name: 'Cristiano Ronaldo',
    number: 7,
    position: 'ST',
    overall: 89,
    clubId: 'real-madrid',
    nation: 'Portugal',
    cardRarity: 'special',
    stats: { pace: 81, shooting: 91, passing: 75, dribbling: 82, defending: 34, physical: 78 },
    heightCm: 187,
    skinTone: 1,
    hairStyle: 'short',
    hairColor: '#111827',
    bootColor: '#ef4444',
    priceCoins: 140000,
  },
  {
    id: 'zidane',
    name: 'Zinedine Zidane',
    number: 5,
    position: 'CAM',
    overall: 94,
    clubId: 'real-madrid',
    nation: 'France',
    cardRarity: 'icon',
    stats: { pace: 83, shooting: 88, passing: 96, dribbling: 95, defending: 75, physical: 86 },
    heightCm: 185,
    skinTone: 0,
    hairStyle: 'buzz',
    hairColor: '#1f2937',
    bootColor: '#facc15',
    priceCoins: 350000,
  },
  {
    id: 'pele',
    name: 'Pelé',
    number: 10,
    position: 'ST',
    overall: 96,
    clubId: 'real-madrid',
    nation: 'Brazil',
    cardRarity: 'icon',
    stats: { pace: 95, shooting: 96, passing: 93, dribbling: 96, defending: 60, physical: 76 },
    heightCm: 173,
    skinTone: 3,
    hairStyle: 'short',
    hairColor: '#111827',
    bootColor: '#eab308',
    priceCoins: 500000,
  },
  // Goalkeepers
  {
    id: 'courtois',
    name: 'Thibaut Courtois',
    number: 1,
    position: 'GK',
    overall: 89,
    clubId: 'real-madrid',
    nation: 'Belgium',
    cardRarity: 'rare',
    stats: { pace: 46, shooting: 20, passing: 68, dribbling: 48, defending: 89, physical: 85 },
    heightCm: 200,
    skinTone: 0,
    hairStyle: 'short',
    hairColor: '#111827',
    bootColor: '#38bdf8',
    priceCoins: 48000,
  },
  {
    id: 'terstegen',
    name: 'Marc-André ter Stegen',
    number: 1,
    position: 'GK',
    overall: 89,
    clubId: 'barcelona',
    nation: 'Germany',
    cardRarity: 'rare',
    stats: { pace: 47, shooting: 18, passing: 88, dribbling: 50, defending: 89, physical: 82 },
    heightCm: 187,
    skinTone: 0,
    hairStyle: 'short',
    hairColor: '#d97706',
    bootColor: '#22c55e',
    priceCoins: 45000,
  },
  // Defenders & Midfielders
  {
    id: 'rudiger',
    name: 'Antonio Rüdiger',
    number: 22,
    position: 'CB',
    overall: 88,
    clubId: 'real-madrid',
    nation: 'Germany',
    cardRarity: 'rare',
    stats: { pace: 82, shooting: 53, passing: 71, dribbling: 68, defending: 86, physical: 86 },
    heightCm: 190,
    skinTone: 3,
    hairStyle: 'buzz',
    hairColor: '#111827',
    bootColor: '#f97316',
    priceCoins: 38000,
  },
  {
    id: 'pedri',
    name: 'Pedri',
    number: 8,
    position: 'CM',
    overall: 86,
    clubId: 'barcelona',
    nation: 'Spain',
    cardRarity: 'gold',
    stats: { pace: 78, shooting: 70, passing: 88, dribbling: 89, defending: 68, physical: 65 },
    heightCm: 174,
    skinTone: 0,
    hairStyle: 'fade',
    hairColor: '#111827',
    bootColor: '#3b82f6',
    priceCoins: 32000,
  },
  {
    id: 'rodri',
    name: 'Rodri',
    number: 16,
    position: 'CDM',
    overall: 91,
    clubId: 'man-city',
    nation: 'Spain',
    cardRarity: 'rare',
    stats: { pace: 66, shooting: 80, passing: 86, dribbling: 84, defending: 87, physical: 85 },
    heightCm: 191,
    skinTone: 0,
    hairStyle: 'short',
    hairColor: '#374151',
    bootColor: '#ffffff',
    priceCoins: 92000,
  },
  {
    id: 'saliba',
    name: 'William Saliba',
    number: 2,
    position: 'CB',
    overall: 87,
    clubId: 'arsenal',
    nation: 'France',
    cardRarity: 'rare',
    stats: { pace: 82, shooting: 40, passing: 72, dribbling: 74, defending: 87, physical: 83 },
    heightCm: 192,
    skinTone: 3,
    hairStyle: 'buzz',
    hairColor: '#111827',
    bootColor: '#eab308',
    priceCoins: 42000,
  },
];

// Helper to get full 11-player squad for any club
export function getClubSquad(clubId: string): Player[] {
  const clubPlayers = ALL_PLAYERS.filter((p) => p.clubId === clubId);
  // Ensure we have a complete 11 player squad by filling in generic players if needed
  const positionsNeeded: Position[] = ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'ST', 'RW'];
  const squad: Player[] = [];

  positionsNeeded.forEach((pos, idx) => {
    const existing = clubPlayers.find((p) => p.position === pos && !squad.includes(p));
    if (existing) {
      squad.push(existing);
    } else {
      // Procedural squad filler
      squad.push({
        id: `${clubId}_gen_${idx}`,
        name: `${CLUBS[clubId]?.shortName || 'FC'} Player ${idx + 1}`,
        number: idx + 1,
        position: pos,
        overall: 80 + (idx % 5),
        clubId,
        nation: 'International',
        cardRarity: 'gold',
        stats: { pace: 78, shooting: 74, passing: 77, dribbling: 76, defending: 72, physical: 75 },
        heightCm: 180 + (idx % 12),
        skinTone: idx % 4,
        hairStyle: 'short',
        hairColor: '#1f2937',
        bootColor: idx % 2 === 0 ? '#38bdf8' : '#eab308',
        priceCoins: 15000,
      });
    }
  });

  return squad;
}
