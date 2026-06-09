// One-shot script to expand teams.json:
//  - Adds bench players to teams that lack coverage for certain slot positions
//  - Appends 5 new historic Libertadores winners (more reroll variety)
//  - Bumps a few iconic player ratings
//
// Run with: node scripts/expand-teams.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const PATH = 'src/app/game/data/teams.json';
const teams = JSON.parse(readFileSync(PATH, 'utf8'));

function find(name, year) {
  const t = teams.find((x) => x.name === name && x.year === year);
  if (!t) throw new Error(`Not found: ${name} ${year}`);
  return t;
}

function addBench(name, year, players) {
  find(name, year).players.push(...players);
}

function bump(name, year, playerName, newRating) {
  const team = find(name, year);
  const p = team.players.find((x) => x.name === playerName);
  if (!p) throw new Error(`Player not found: ${playerName} (${name} ${year})`);
  p.rating = newRating;
}

// ─────────────────────────── Bench players to fix position gaps ───────────────────────────

addBench('River Plate', 1986, [
  { name: 'Oscar Garré', rarity: 'rare', rating: 81, positions: ['LB'] },
  { name: 'Néstor Fabbri', rarity: 'rare', rating: 80, positions: ['CB', 'LB'] },
]);

addBench('São Paulo', 1993, [
  { name: 'Catê', rarity: 'rare', rating: 80, positions: ['LW', 'ST'] },
  { name: 'Doriva', rarity: 'rare', rating: 81, positions: ['CDM', 'CM'] },
]);

addBench('Cruzeiro', 1997, [
  { name: 'Cléber', rarity: 'rare', rating: 81, positions: ['RW', 'ST'] },
  { name: 'Mancini', rarity: 'rare', rating: 81, positions: ['RM', 'RW'] },
]);

addBench('Palmeiras', 1999, [
  { name: 'Tuta', rarity: 'rare', rating: 81, positions: ['RW', 'ST'] },
  { name: 'Rogério', rarity: 'common', rating: 76, positions: ['RM', 'RB'] },
]);

addBench('Boca Juniors', 2001, [
  { name: 'Diego Cagna', rarity: 'rare', rating: 80, positions: ['CM', 'LM'] },
  { name: 'Cristian Traverso', rarity: 'common', rating: 76, positions: ['CB', 'CDM'] },
]);

addBench('Once Caldas', 2004, [
  { name: 'Sergio Galván Rey', rarity: 'epic', rating: 83, positions: ['ST', 'CF'] },
  { name: 'Hernán Pertúz', rarity: 'common', rating: 76, positions: ['CB'] },
]);

addBench('São Paulo', 2005, [
  { name: 'Souza', rarity: 'rare', rating: 81, positions: ['LW', 'CAM'] },
  { name: 'Júnior Felipe', rarity: 'common', rating: 75, positions: ['RM', 'RW'] },
]);

addBench('Estudiantes', 2009, [
  { name: 'Pablo Lugüercio', rarity: 'rare', rating: 80, positions: ['LW', 'LM'] },
  { name: 'Federico Fernández', rarity: 'rare', rating: 79, positions: ['CB'] },
]);

addBench('Corinthians', 2012, [
  { name: 'Romarinho', rarity: 'rare', rating: 80, positions: ['LW', 'LM'] },
  { name: 'Willian Arana', rarity: 'common', rating: 74, positions: ['LB', 'LM'] },
]);

addBench('Atlético Mineiro', 2013, [
  { name: 'Diego Rosa', rarity: 'rare', rating: 80, positions: ['RW', 'RM'] },
  { name: 'Richarlyson', rarity: 'common', rating: 76, positions: ['LM', 'LB'] },
]);

addBench('River Plate', 2015, [
  { name: 'Sebastián Driussi', rarity: 'epic', rating: 83, positions: ['LW', 'ST'] },
  { name: 'Tabaré Viudez', rarity: 'rare', rating: 79, positions: ['LM', 'CAM'] },
]);

addBench('River Plate', 2018, [
  { name: 'Ignacio Fernández', rarity: 'epic', rating: 85, positions: ['RW', 'CAM'] },
  { name: 'Exequiel Palacios', rarity: 'epic', rating: 83, positions: ['CM', 'LW'] },
]);

addBench('Nacional', 1988, [
  { name: 'Diego Aguirre', rarity: 'rare', rating: 81, positions: ['LM', 'CAM'] },
  { name: 'Wilmar Cabrera', rarity: 'common', rating: 76, positions: ['LW'] },
]);

addBench('River Plate', 1996, [
  { name: 'Marcelo Escudero', rarity: 'rare', rating: 80, positions: ['LB', 'LM'] },
  { name: 'Sergio Berti', rarity: 'rare', rating: 81, positions: ['LW', 'LM'] },
]);

addBench('Boca Juniors', 2000, [
  { name: 'Cristian Traverso', rarity: 'rare', rating: 80, positions: ['CB', 'CDM'] },
  { name: 'Walter Pico', rarity: 'common', rating: 75, positions: ['LM', 'LW'] },
]);

addBench('Grêmio', 2017, [
  { name: 'Pedro Rocha', rarity: 'rare', rating: 81, positions: ['LW', 'ST'] },
  { name: 'Edílson', rarity: 'rare', rating: 80, positions: ['RB', 'RM'] },
]);

addBench('Palmeiras', 2020, [
  { name: 'Wesley', rarity: 'rare', rating: 80, positions: ['LW', 'LM'] },
  { name: 'Willian', rarity: 'rare', rating: 81, positions: ['ST', 'RW'] },
]);

// ─────────────────────────── Iconic player rating bumps ───────────────────────────

bump('Peñarol', 1966, 'Pedro Virgilio Rocha', 90);
bump('Peñarol', 1960, 'Luis Cubilla', 86);
bump('Peñarol', 1966, 'Luis Cubilla', 86);
bump('São Paulo', 2005, 'Rogério Ceni', 89);
bump('Grêmio', 1983, 'Renato Gaúcho', 90);
bump('São Paulo', 1992, 'Toninho Cerezo', 85);
bump('São Paulo', 1993, 'Toninho Cerezo', 84);

// ─────────────────────────── New historic teams ───────────────────────────

teams.push(
  {
    name: 'Independiente',
    year: 1965,
    players: [
      { name: 'Luis Gatti', rarity: 'rare', rating: 80, positions: ['GK'] },
      { name: 'Roberto Ferreiro', rarity: 'rare', rating: 80, positions: ['RB', 'CB'] },
      { name: 'Mario Mesiano', rarity: 'rare', rating: 79, positions: ['CB'] },
      { name: 'José Omar Pastoriza', rarity: 'epic', rating: 83, positions: ['CB', 'CDM'] },
      { name: 'Norberto Mura', rarity: 'rare', rating: 81, positions: ['LB'] },
      { name: 'Antonio Rojas', rarity: 'rare', rating: 80, positions: ['CM'] },
      { name: 'Raúl Bernao', rarity: 'rare', rating: 81, positions: ['CM', 'CAM'] },
      { name: 'Mario Rodríguez', rarity: 'rare', rating: 80, positions: ['RW', 'RM'] },
      { name: 'Roberto Ávalos', rarity: 'rare', rating: 79, positions: ['LM', 'LW'] },
      { name: 'Eduardo Maglioni', rarity: 'rare', rating: 81, positions: ['ST'] },
      { name: 'Miguel Ángel Brindisi', rarity: 'rare', rating: 79, positions: ['CAM', 'CM'] },
      { name: 'Luis Suárez Miramontes', rarity: 'epic', rating: 84, positions: ['CAM', 'CM'] },
    ],
  },
  {
    name: 'Argentinos Juniors',
    year: 1985,
    players: [
      { name: 'Enrique Vidallé', rarity: 'rare', rating: 82, positions: ['GK'] },
      { name: 'Jorge Olguín', rarity: 'rare', rating: 80, positions: ['LB'] },
      { name: 'José Luis Pavoni', rarity: 'rare', rating: 81, positions: ['RB'] },
      { name: 'Néstor Lorenzo', rarity: 'rare', rating: 81, positions: ['CB'] },
      { name: 'Carlos Ereros', rarity: 'rare', rating: 80, positions: ['CB'] },
      { name: 'Sergio Batista', rarity: 'epic', rating: 85, positions: ['CDM'] },
      { name: 'Daniel Sperandio', rarity: 'rare', rating: 80, positions: ['CM', 'CDM'] },
      { name: 'Claudio Borghi', rarity: 'epic', rating: 86, positions: ['CAM', 'RW'] },
      { name: 'Sergio Castro', rarity: 'epic', rating: 84, positions: ['ST', 'CF'] },
      { name: 'Juan Domingo Cabrera', rarity: 'rare', rating: 80, positions: ['LM', 'LW'] },
      { name: 'Emilio Comisso', rarity: 'rare', rating: 79, positions: ['RM'] },
      { name: 'José Videla', rarity: 'common', rating: 76, positions: ['ST'] },
    ],
  },
  {
    name: 'Cruzeiro',
    year: 1976,
    players: [
      { name: 'Raul Plassmann', rarity: 'epic', rating: 84, positions: ['GK'] },
      { name: 'Nelinho', rarity: 'epic', rating: 86, positions: ['RB'] },
      { name: 'Vanderlei Luxemburgo', rarity: 'rare', rating: 80, positions: ['CB', 'CDM'] },
      { name: 'Darci Menezes', rarity: 'rare', rating: 80, positions: ['CB'] },
      { name: 'Vladimir', rarity: 'rare', rating: 80, positions: ['LB'] },
      { name: 'Wilson Piazza', rarity: 'epic', rating: 85, positions: ['CDM', 'CM'] },
      { name: 'Eduardo Costa', rarity: 'rare', rating: 81, positions: ['CM'] },
      { name: 'Zé Carlos', rarity: 'rare', rating: 80, positions: ['RM', 'RW'] },
      { name: 'Joãozinho', rarity: 'epic', rating: 83, positions: ['CAM', 'CM'] },
      { name: 'Palhinha', rarity: 'epic', rating: 84, positions: ['ST', 'CF'] },
      { name: 'Roberto Batata', rarity: 'rare', rating: 81, positions: ['LW', 'ST'] },
      { name: 'Joaquim', rarity: 'rare', rating: 79, positions: ['CF'] },
    ],
  },
  {
    name: 'Vasco da Gama',
    year: 1998,
    players: [
      { name: 'Carlos Germano', rarity: 'epic', rating: 84, positions: ['GK'] },
      { name: 'Mauro Galvão', rarity: 'epic', rating: 83, positions: ['CB'] },
      { name: 'Odvan', rarity: 'rare', rating: 81, positions: ['CB'] },
      { name: 'Jorginho', rarity: 'epic', rating: 84, positions: ['RB'] },
      { name: 'Mazinho Loyola', rarity: 'rare', rating: 80, positions: ['LB', 'LM'] },
      { name: 'Felipe', rarity: 'epic', rating: 84, positions: ['CDM', 'CM'] },
      { name: 'Juninho Pernambucano', rarity: 'legendary', rating: 88, positions: ['CAM', 'CM'] },
      { name: 'Pedrinho', rarity: 'epic', rating: 83, positions: ['LM', 'LW'] },
      { name: 'Donizete', rarity: 'epic', rating: 83, positions: ['RW', 'ST'] },
      { name: 'Edmundo', rarity: 'legendary', rating: 88, positions: ['ST', 'CAM'] },
      { name: 'Luizão', rarity: 'epic', rating: 85, positions: ['ST', 'CF'] },
      { name: 'Ramón', rarity: 'rare', rating: 80, positions: ['CM'] },
    ],
  },
  {
    name: 'Olimpia',
    year: 1990,
    players: [
      { name: 'Ever Hugo Almeida', rarity: 'epic', rating: 84, positions: ['GK'] },
      { name: 'Pedro Sarabia', rarity: 'rare', rating: 81, positions: ['RB'] },
      { name: 'Vidal Sanabria', rarity: 'rare', rating: 80, positions: ['LB'] },
      { name: 'Catalino Rivarola', rarity: 'rare', rating: 80, positions: ['CB'] },
      { name: 'Tato Acosta', rarity: 'rare', rating: 80, positions: ['CB'] },
      { name: 'Carlos Kiese', rarity: 'rare', rating: 81, positions: ['CDM', 'CM'] },
      { name: 'Adolfino Cañete', rarity: 'epic', rating: 83, positions: ['CM', 'CAM'] },
      { name: 'Juan Carlos Acuña', rarity: 'epic', rating: 83, positions: ['CM'] },
      { name: 'Adriano Samaniego', rarity: 'rare', rating: 82, positions: ['LW', 'LM'] },
      { name: 'Gabriel Gómez', rarity: 'rare', rating: 81, positions: ['RW', 'RM'] },
      { name: 'Raúl Vicente Amarilla', rarity: 'epic', rating: 85, positions: ['ST', 'CAM'] },
      { name: 'Adriano Suárez', rarity: 'rare', rating: 80, positions: ['CM'] },
    ],
  },
);

// ─────────────────────────── Write back ───────────────────────────

writeFileSync(PATH, JSON.stringify(teams, null, 2) + '\n', 'utf8');
console.log(`Wrote ${teams.length} teams.`);
