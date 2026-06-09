// Adds two more historic squads with reroll-year options for single-year clubs.
import { readFileSync, writeFileSync } from 'node:fs';

const PATH = 'src/app/game/data/teams.json';
const teams = JSON.parse(readFileSync(PATH, 'utf8'));

teams.push(
  {
    name: 'Nacional',
    year: 1980,
    players: [
      { name: 'Rodolfo Rodríguez', rarity: 'epic', rating: 83, positions: ['GK'] },
      { name: 'Víctor Espárrago', rarity: 'rare', rating: 81, positions: ['RB'] },
      { name: 'Eduardo De La Peña', rarity: 'rare', rating: 80, positions: ['CB'] },
      { name: 'Rubén Paz', rarity: 'epic', rating: 86, positions: ['CAM', 'CM'] },
      { name: 'Ariel Krasouski', rarity: 'rare', rating: 80, positions: ['CB'] },
      { name: 'Hugo De León', rarity: 'epic', rating: 84, positions: ['CB'] },
      { name: 'Juan Ramón Carrasco', rarity: 'epic', rating: 84, positions: ['LM', 'LW'] },
      { name: 'Walter Olivera', rarity: 'rare', rating: 80, positions: ['LB'] },
      { name: 'Eduardo Bica', rarity: 'rare', rating: 79, positions: ['RM', 'RW'] },
      { name: 'Waldemar Victorino', rarity: 'epic', rating: 84, positions: ['ST', 'CF'] },
      { name: 'Julio Morales', rarity: 'rare', rating: 81, positions: ['ST'] },
      { name: 'Eduardo Acevedo', rarity: 'rare', rating: 80, positions: ['CDM', 'CM'] },
    ],
  },
  {
    name: 'Vélez Sarsfield',
    year: 1996,
    players: [
      { name: 'José Luis Chilavert', rarity: 'legendary', rating: 89, positions: ['GK'] },
      { name: 'Roberto Trotta', rarity: 'epic', rating: 84, positions: ['CB'] },
      { name: 'Víctor Sotomayor', rarity: 'rare', rating: 81, positions: ['CB'] },
      { name: 'Christian Bassedas', rarity: 'epic', rating: 84, positions: ['CDM'] },
      { name: 'Marcelo Gómez', rarity: 'rare', rating: 81, positions: ['RB'] },
      { name: 'Flavio Zandoná', rarity: 'rare', rating: 80, positions: ['LB'] },
      { name: 'Omar Asad', rarity: 'epic', rating: 84, positions: ['CAM', 'ST'] },
      { name: 'José Oscar Flores', rarity: 'rare', rating: 81, positions: ['RW', 'RM'] },
      { name: 'Christian Bouzo', rarity: 'rare', rating: 80, positions: ['LW', 'LM'] },
      { name: 'Patricio Camps', rarity: 'rare', rating: 80, positions: ['CM'] },
      { name: 'Carlos Compagnucci', rarity: 'rare', rating: 80, positions: ['CM', 'CDM'] },
      { name: 'Martín Posse', rarity: 'rare', rating: 81, positions: ['ST', 'CF'] },
    ],
  },
);

writeFileSync(PATH, JSON.stringify(teams, null, 2) + '\n', 'utf8');
console.log(`Wrote ${teams.length} teams.`);
