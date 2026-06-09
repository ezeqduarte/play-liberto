import { Rarity } from './rarity.model';

/**
 * A historic manager attached to each Team entry. Has its own rating
 * and rarity tier — picked alongside players in the draft. Currently
 * does not affect simulation; reserved for a future tactical modifier.
 */
export interface Coach {
  name: string;
  rating: number;
  rarity: Rarity;
}
