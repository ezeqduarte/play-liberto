import { Player, Team } from '../models';
import { rarityFromRating } from '../utils/rarity';
import teamsJson from './teams.json';

/**
 * Loads the team pool with rarity recomputed from each player's and
 * coach's rating so the visual tier always matches the numeric overall
 * — no matter what the JSON originally tagged.
 */
function loadTeams(): Team[] {
  return (teamsJson as Team[]).map((team) => ({
    ...team,
    players: team.players.map((p: Player) => ({
      ...p,
      rarity: rarityFromRating(p.rating),
    })),
    coach: {
      ...team.coach,
      rarity: rarityFromRating(team.coach.rating),
    },
  }));
}

export const TEAMS: Team[] = loadTeams();
