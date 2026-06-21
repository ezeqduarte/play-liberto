// One-shot rating recalibration after user feedback:
//   - Some champion squads lacked legendary tier players (River 2015,
//     Newell's 1992, etc.)
//   - "Beto Alonso" appears twice in River 1986 — the famous one is
//     Norberto Alonso (already rated 86), the duplicate is removed.
//   - Sub-tier clubs (Cobreloa, Sporting Cristal, Bolivar) get a
//     small dip so their gap with iconic squads opens up.
//
// Run: node scripts/rating-pass-v2.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const PATH = 'src/app/game/data/teams.json';
const teams = JSON.parse(readFileSync(PATH, 'utf8'));

function find(name, year) {
  const t = teams.find((x) => x.name === name && x.year === year);
  if (!t) throw new Error(`Not found: ${name} ${year}`);
  return t;
}

function bump(name, year, playerName, newRating) {
  const team = find(name, year);
  const p = team.players.find((x) => x.name === playerName);
  if (!p) throw new Error(`Player not found: ${playerName} (${name} ${year})`);
  p.rating = newRating;
}

function removePlayer(name, year, playerName) {
  const team = find(name, year);
  const i = team.players.findIndex((x) => x.name === playerName);
  if (i < 0) throw new Error(`Player not found: ${playerName} (${name} ${year})`);
  team.players.splice(i, 1);
}

// ─────────────────────────── River 1986 ───────────────────────────
// Norberto "Beto" Alonso is the famous one. The duplicate 80-rated
// "Beto Alonso" entry is just a typo'd second row, drop it. Bump the
// real Norberto Alonso since he is the team idol.
removePlayer('River Plate', 1986, 'Beto Alonso');
bump('River Plate', 1986, 'Norberto Alonso', 88);

// ─────────────────────────── River 2015 ───────────────────────────
// Liberta champion squad. The user pointed out it has zero gold-tier
// players. Bump the three figures of that title:
bump('River Plate', 2015, 'Marcelo Barovero', 88); // tournament hero
bump('River Plate', 2015, 'Gonzalo Martínez', 87); // Pity, midfield engine
bump('River Plate', 2015, 'Leonardo Pisculichi', 86); // final-winning goal
bump('River Plate', 2015, 'Ramiro Funes Mori', 85);
bump('River Plate', 2015, 'Carlos Sánchez', 85);
bump('River Plate', 2015, 'Lucas Alario', 85);
bump('River Plate', 2015, 'Rodrigo Mora', 84);

// ─────────────────────────── River 2018 ───────────────────────────
bump('River Plate', 2018, 'Gonzalo Martínez', 88); // Pity at his peak
bump('River Plate', 2018, 'Enzo Pérez', 86);
bump('River Plate', 2018, 'Franco Armani', 87);

// ─────────────────────────── Other champion squads ───────────────────────────
// Estudiantes 2009 (Liberta champion):
bump('Estudiantes', 2009, 'Juan Sebastián Verón', 90);
bump('Estudiantes', 2009, 'Mauro Boselli', 86);
bump('Estudiantes', 2009, 'José Sosa', 85);

// Internacional 2010 (Liberta champion):
bump('Internacional', 2010, "Andrés D'Alessandro", 89);
bump('Internacional', 2010, 'Bolívar', 84);

// Santos 2011 (Liberta champion):
bump('Santos', 2011, 'Neymar', 92);
bump('Santos', 2011, 'Paulo Henrique Ganso', 88);

// Atlético Mineiro 2013 (Liberta champion):
bump('Atlético Mineiro', 2013, 'Ronaldinho', 90);
bump('Atlético Mineiro', 2013, 'Diego Tardelli', 85);
bump('Atlético Mineiro', 2013, 'Jô', 85);

// San Lorenzo 2014 (Liberta champion):
bump('San Lorenzo', 2014, 'Néstor Ortigoza', 87);
bump('San Lorenzo', 2014, 'Ángel Correa', 85);

// Atlético Nacional 2016 (Liberta champion):
bump('Atlético Nacional', 2016, 'Miguel Borja', 87);
bump('Atlético Nacional', 2016, 'Franco Armani', 87);
bump('Atlético Nacional', 2016, 'Macnelly Torres', 85);

// Flamengo 2019 (Liberta champion):
bump('Flamengo', 2019, 'Gabriel Barbosa', 90); // already 89
bump('Flamengo', 2019, 'Giorgian de Arrascaeta', 88);
bump('Flamengo', 2019, 'Éverton Ribeiro', 86);
bump('Flamengo', 2019, 'Bruno Henrique', 86);

// Palmeiras 2020 + 2021:
bump('Palmeiras', 2020, 'Raphael Veiga', 86);
bump('Palmeiras', 2021, 'Raphael Veiga', 87);
bump('Palmeiras', 2021, 'Dudu', 86);

// Botafogo 2024 (Liberta champion):
bump('Botafogo', 2024, 'Thiago Almada', 89);
bump('Botafogo', 2024, 'Luiz Henrique', 87);

// Fluminense 2023 (Liberta champion):
bump('Fluminense', 2023, 'Germán Cano', 87);
bump('Fluminense', 2023, 'André', 87);

// Boca 2000/01/03/07 (already strong, but Riquelme 2001 should be top):
bump('Boca Juniors', 2001, 'Juan Román Riquelme', 93);
bump('Boca Juniors', 2003, 'Carlos Tevez', 92);

// ─────────────────────────── Sub-tier clubs dip ───────────────────────────
// These clubs didn't make the same impact in the Libertadores. Trim
// 1-2 points off their epic-tier players so the gap with iconic
// squads opens up. Star players keep their rating.
const SUB_TIER_DIP = [
  ['Cobreloa', 1981], ['Cobreloa', 1982], ['Cobreloa', 1986],
  ['Sporting Cristal', 1994], ['Sporting Cristal', 2003],
  ['Bolívar', 1986], ['Bolívar', 1997],
  ['Cerro Porteño', 1999], ['Cerro Porteño', 2017],
  ['Universidad de Chile', 1996],
];
for (const [name, year] of SUB_TIER_DIP) {
  const team = find(name, year);
  for (const p of team.players) {
    if (p.rating >= 84 && p.rating <= 86) p.rating -= 2;
    else if (p.rating === 83) p.rating -= 1;
  }
}

writeFileSync(PATH, JSON.stringify(teams, null, 2) + '\n', 'utf8');
console.log(`Updated ratings across ${teams.length} teams.`);
