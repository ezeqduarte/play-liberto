/**
 * Stadium for each club in the pool. Capacities are approximate, in
 * seats. Used by the live-match scoreboard to show where the leg is
 * being played (always the home team's home ground).
 */
export interface Stadium {
  name: string;
  capacity: number;
}

const STADIUMS: Record<string, Stadium> = {
  // Argentina
  'Boca Juniors': { name: 'La Bombonera', capacity: 54000 },
  'River Plate': { name: 'El Monumental', capacity: 84000 },
  'Independiente': { name: 'Libertadores de América', capacity: 48000 },
  'Estudiantes': { name: 'Estadio Jorge Luis Hirschi', capacity: 32000 },
  'Vélez Sarsfield': { name: 'José Amalfitani', capacity: 49000 },
  'San Lorenzo': { name: 'Nuevo Gasómetro', capacity: 47000 },
  'Racing Club': { name: 'El Cilindro', capacity: 51000 },
  'Argentinos Juniors': { name: 'Diego Armando Maradona', capacity: 25000 },
  "Newell's Old Boys": { name: 'Marcelo Bielsa', capacity: 42000 },
  'Lanús': { name: 'La Fortaleza', capacity: 47000 },

  // Brazil
  'Santos': { name: 'Vila Belmiro', capacity: 16000 },
  'Flamengo': { name: 'Maracanã', capacity: 78000 },
  'Grêmio': { name: 'Arena do Grêmio', capacity: 60000 },
  'São Paulo': { name: 'Morumbi', capacity: 67000 },
  'Cruzeiro': { name: 'Mineirão', capacity: 62000 },
  'Palmeiras': { name: 'Allianz Parque', capacity: 43000 },
  'Internacional': { name: 'Beira-Rio', capacity: 50000 },
  'Corinthians': { name: 'Neo Química Arena', capacity: 49000 },
  'Atlético Mineiro': { name: 'Arena MRV', capacity: 47000 },
  'Vasco da Gama': { name: 'São Januário', capacity: 24000 },
  'Fluminense': { name: 'Maracanã', capacity: 78000 },
  'Botafogo': { name: 'Estádio Nilton Santos', capacity: 46000 },
  'Atlético Paranaense': { name: 'Arena da Baixada', capacity: 42000 },

  // Uruguay
  'Peñarol': { name: 'Campeón del Siglo', capacity: 40000 },
  'Nacional': { name: 'Gran Parque Central', capacity: 34000 },

  // Paraguay
  'Olimpia': { name: 'Manuel Ferreira', capacity: 25000 },
  'Cerro Porteño': { name: 'La Olla', capacity: 45000 },

  // Colombia
  'Atlético Nacional': { name: 'Atanasio Girardot', capacity: 45000 },
  'Once Caldas': { name: 'Palogrande', capacity: 32000 },
  'América de Cali': { name: 'Pascual Guerrero', capacity: 35000 },

  // Ecuador
  'LDU Quito': { name: 'Rodrigo Paz Delgado', capacity: 41000 },
  'Independiente del Valle': { name: 'Banco Guayaquil', capacity: 13000 },

  // Chile
  'Colo-Colo': { name: 'Estadio Monumental', capacity: 47000 },
  'Universidad de Chile': { name: 'Estadio Nacional', capacity: 48000 },
  'Universidad Católica': { name: 'San Carlos de Apoquindo', capacity: 14000 },
  'Cobreloa': { name: 'Zorros del Desierto', capacity: 12000 },

  // Peru
  'Sporting Cristal': { name: 'Alberto Gallardo', capacity: 18000 },
  'Universitario': { name: 'Monumental de Lima', capacity: 80000 },

  // Bolivia
  'Bolívar': { name: 'Hernando Siles', capacity: 41000 },

  // Mexico
  'Cruz Azul': { name: 'Estadio Azteca', capacity: 87000 },
};

const USER_STADIUM: Stadium = {
  name: 'MyTeam Stadium',
  capacity: 75000,
};

const FALLBACK: Stadium = {
  name: 'Estadio del club',
  capacity: 30000,
};

/**
 * Resolves the host stadium given a MatchTeam.clubName + isUser flag.
 * Users always play in MyTeam Stadium; unknown clubs get a neutral
 * fallback name.
 */
export function getStadium(clubName: string, isUser: boolean): Stadium {
  if (isUser) return USER_STADIUM;
  return STADIUMS[clubName] ?? FALLBACK;
}
