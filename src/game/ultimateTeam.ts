import { Player, ALL_PLAYERS, CardRarity } from './footballData';
import { footballAudio } from './footballAudio';

export interface CardPack {
  id: string;
  name: string;
  priceCoins: number;
  description: string;
  guaranteedMinRating: number;
  rarityChance: CardRarity[];
  accentColor: string;
}

export const CARD_PACKS: CardPack[] = [
  {
    id: 'pack_gold',
    name: 'Gold Booster Pack',
    priceCoins: 7500,
    description: 'Contains 3 Gold players with at least one 80+ rated player.',
    guaranteedMinRating: 80,
    rarityChance: ['gold', 'rare'],
    accentColor: '#eab308',
  },
  {
    id: 'pack_rare',
    name: 'Prime Players Pack',
    priceCoins: 35000,
    description: 'All rare players with at least one 86+ superstar guaranteed!',
    guaranteedMinRating: 86,
    rarityChance: ['rare', 'special'],
    accentColor: '#06b6d4',
  },
  {
    id: 'pack_icon',
    name: 'Ultimate Icon Pack',
    priceCoins: 95000,
    description: 'The pinnacle of football: legendary Icon or 90+ elite TOTW card!',
    guaranteedMinRating: 90,
    rarityChance: ['icon', 'special', 'rare'],
    accentColor: '#a855f7',
  },
];

export function openPack(pack: CardPack): Player[] {
  footballAudio.playPackReveal();

  // Filter pool based on pack rating
  const eligible = ALL_PLAYERS.filter((p) => pack.rarityChance.includes(p.cardRarity) || p.overall >= pack.guaranteedMinRating);
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);

  // Return top 3 cards with first card being the highest rated "walkout"
  const selected = shuffled.slice(0, 3).sort((a, b) => b.overall - a.overall);
  return selected.length > 0 ? selected : [ALL_PLAYERS[0]];
}

export function calculateSquadChemistry(squad: Player[]): number {
  if (squad.length === 0) return 0;
  let chemistry = 0;

  // Club links
  const clubCounts: Record<string, number> = {};
  const nationCounts: Record<string, number> = {};

  squad.forEach((p) => {
    clubCounts[p.clubId] = (clubCounts[p.clubId] || 0) + 1;
    nationCounts[p.nation] = (nationCounts[p.nation] || 0) + 1;
  });

  squad.forEach((p) => {
    let playerChem = 1;
    if ((clubCounts[p.clubId] || 0) >= 2) playerChem += 1;
    if ((nationCounts[p.nation] || 0) >= 2) playerChem += 1;
    chemistry += Math.min(3, playerChem);
  });

  return Math.min(33, chemistry);
}
