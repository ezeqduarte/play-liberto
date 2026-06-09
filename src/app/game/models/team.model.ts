import { Coach } from './coach.model';
import { Player } from './player.model';

export interface Team {
  name: string;
  year: number;
  players: Player[];
  coach: Coach;
}
