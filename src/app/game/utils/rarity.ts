import { Rarity } from '../models';

/**
 * Rating thresholds for rarity tiers. Keep these in sync with the
 * design tokens in styles.scss (.rarity-* colors).
 */
const THRESHOLDS: Array<{ min: number; rarity: Rarity }> = [
  { min: 88, rarity: 'legendary' },
  { min: 83, rarity: 'epic' },
  { min: 78, rarity: 'rare' },
  { min: 0, rarity: 'common' },
];

/**
 * Maps a numeric overall rating to its visual rarity tier. The
 * dataset's hand-coded rarity is ignored at load time so the rarity
 * stays consistent with whatever rating tweaks we apply.
 */
export function rarityFromRating(rating: number): Rarity {
  return THRESHOLDS.find((t) => rating >= t.min)!.rarity;
}
