// Backfills the historical coach for every team-year entry that
// doesn't already have one. Ratings reflect the manager's stature
// at the time. Run with: node scripts/backfill-coaches.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const PATH = 'src/app/game/data/teams.json';
const teams = JSON.parse(readFileSync(PATH, 'utf8'));

// Lookup keyed by `${name}|${year}` → { name, rating }
const COACHES = {
  'Peñarol|1960': ['Roberto Scarone', 84],
  'Peñarol|1966': ['Roque Máspoli', 85],
  'Peñarol|1987': ['Óscar Tabárez', 87],
  'Santos|1962': ['Lula', 86],
  'Santos|1963': ['Lula', 86],
  'Santos|2011': ['Muricy Ramalho', 85],
  'Independiente|1964': ['Manuel Giúdice', 83],
  'Independiente|1965': ['Manuel Giúdice', 83],
  'Independiente|1972': ['Pedro Dellacha', 83],
  'Independiente|1973': ['Roberto Ferreiro', 84],
  'Independiente|1974': ['Roberto Ferreiro', 84],
  'Independiente|1984': ['José Omar Pastoriza', 86],
  'Estudiantes|1968': ['Osvaldo Zubeldía', 90],
  'Estudiantes|2009': ['Alejandro Sabella', 88],
  'Olimpia|1979': ['Luis Cubilla', 86],
  'Olimpia|2002': ['Nery Pumpido', 81],
  'Flamengo|1981': ['Paulo César Carpegiani', 86],
  'Flamengo|2019': ['Jorge Jesus', 89],
  'Grêmio|1983': ['Valdir Espinosa', 84],
  'Grêmio|2017': ['Renato Portaluppi', 86],
  'River Plate|1986': ['Héctor Veira', 85],
  'River Plate|1996': ['Ramón Díaz', 86],
  'River Plate|2015': ['Marcelo Gallardo', 90],
  'River Plate|2018': ['Marcelo Gallardo', 91],
  'Atlético Nacional|1989': ['Francisco Maturana', 88],
  'Atlético Nacional|2016': ['Reinaldo Rueda', 84],
  'São Paulo|1992': ['Telê Santana', 91],
  'São Paulo|1993': ['Telê Santana', 91],
  'São Paulo|2005': ['Paulo Autuori', 86],
  'Vélez Sarsfield|1994': ['Carlos Bianchi', 89],
  'Vélez Sarsfield|1996': ['Osvaldo Piñero', 80],
  'Cruzeiro|1997': ['Paulo Autuori', 85],
  'Palmeiras|1999': ['Luiz Felipe Scolari', 88],
  'Palmeiras|2020': ['Abel Ferreira', 87],
  'Palmeiras|2021': ['Abel Ferreira', 88],
  'Boca Juniors|2000': ['Carlos Bianchi', 90],
  'Boca Juniors|2001': ['Carlos Bianchi', 90],
  'Boca Juniors|2003': ['Carlos Bianchi', 91],
  'Boca Juniors|2007': ['Miguel Ángel Russo', 86],
  'Once Caldas|2004': ['Luis Fernando Montoya', 85],
  'Internacional|2006': ['Abel Braga', 84],
  'Internacional|2010': ['Jorge Fossati', 83],
  'Corinthians|2012': ['Tite', 88],
  'Atlético Mineiro|2013': ['Cuca', 85],
  'LDU Quito|2008': ['Edgardo Bauza', 86],
  'Nacional|1980': ['Juan Martín Mujica', 82],
  'Nacional|1988': ['Roberto Fleitas', 82],
  'Cruzeiro|1976': ['Zé Duarte', 82],
  'Argentinos Juniors|1985': ['José Yudica', 84],
  'Vasco da Gama|1998': ['Antônio Lopes', 84],
  'Olimpia|1990': ['Luis Cubilla', 86],
};

let added = 0;
for (const team of teams) {
  if (team.coach) continue; // already has coach (the 30 added in M19)
  const key = `${team.name}|${team.year}`;
  const entry = COACHES[key];
  if (!entry) {
    console.warn(`Missing coach mapping for ${key}`);
    team.coach = { name: 'DT desconocido', rating: 75, rarity: 'common' };
  } else {
    team.coach = { name: entry[0], rating: entry[1], rarity: 'common' };
  }
  added++;
}

writeFileSync(PATH, JSON.stringify(teams, null, 2) + '\n', 'utf8');
console.log(`Added ${added} coaches across ${teams.length} teams.`);
