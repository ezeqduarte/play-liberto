import { Rarity } from './rarity.model';

/**
 * A historic manager attached to each Team entry. Has its own rating
 * and rarity tier — picked alongside players in the draft. The rating
 * contributes to team strength in MatchService (see COACH_BASELINE /
 * COACH_SLOPE), applied symmetrically to user and historic AI rivals.
 */
export interface Coach {
  name: string;
  rating: number;
  rarity: Rarity;
}
