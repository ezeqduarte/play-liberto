import { Position } from './position.model';
import { Rarity } from './rarity.model';

export interface Player {
  name: string;
  rarity: Rarity;
  rating: number;
  positions: Position[];
}
