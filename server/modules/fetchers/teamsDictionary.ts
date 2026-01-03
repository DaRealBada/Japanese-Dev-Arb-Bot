// teams-dictionary.ts - Bidirectional team mappings with city names

export interface TeamMapping {
  abbr: string;
  fullName: string;
  city: string;
  nickname: string;
  sport: 'NBA' | 'NFL';
  aliases: string[];
}

export const NBA_TEAMS: TeamMapping[] = [
  { abbr: 'LAL', fullName: 'Los Angeles Lakers', city: 'Los Angeles', nickname: 'Lakers', sport: 'NBA', aliases: ['lakers', 'la lakers', 'l.a. lakers', 'los angeles'] },
  { abbr: 'LAC', fullName: 'Los Angeles Clippers', city: 'Los Angeles', nickname: 'Clippers', sport: 'NBA', aliases: ['clippers', 'la clippers', 'l.a. clippers'] },
  { abbr: 'BOS', fullName: 'Boston Celtics', city: 'Boston', nickname: 'Celtics', sport: 'NBA', aliases: ['celtics', 'boston'] },
  { abbr: 'MIA', fullName: 'Miami Heat', city: 'Miami', nickname: 'Heat', sport: 'NBA', aliases: ['heat', 'miami'] },
  { abbr: 'GSW', fullName: 'Golden State Warriors', city: 'Golden State', nickname: 'Warriors', sport: 'NBA', aliases: ['warriors', 'golden state', 'gs warriors'] },
  { abbr: 'CHI', fullName: 'Chicago Bulls', city: 'Chicago', nickname: 'Bulls', sport: 'NBA', aliases: ['bulls', 'chicago'] },
  { abbr: 'NYK', fullName: 'New York Knicks', city: 'New York', nickname: 'Knicks', sport: 'NBA', aliases: ['knicks', 'ny knicks', 'new york knicks', 'new york'] },
  { abbr: 'BKN', fullName: 'Brooklyn Nets', city: 'Brooklyn', nickname: 'Nets', sport: 'NBA', aliases: ['nets', 'brooklyn'] },
  { abbr: 'PHI', fullName: 'Philadelphia 76ers', city: 'Philadelphia', nickname: '76ers', sport: 'NBA', aliases: ['76ers', 'sixers', 'philadelphia', 'philly'] },
  { abbr: 'TOR', fullName: 'Toronto Raptors', city: 'Toronto', nickname: 'Raptors', sport: 'NBA', aliases: ['raptors', 'toronto'] },
  { abbr: 'MIL', fullName: 'Milwaukee Bucks', city: 'Milwaukee', nickname: 'Bucks', sport: 'NBA', aliases: ['bucks', 'milwaukee'] },
  { abbr: 'CLE', fullName: 'Cleveland Cavaliers', city: 'Cleveland', nickname: 'Cavaliers', sport: 'NBA', aliases: ['cavaliers', 'cavs', 'cleveland'] },
  { abbr: 'IND', fullName: 'Indiana Pacers', city: 'Indiana', nickname: 'Pacers', sport: 'NBA', aliases: ['pacers', 'indiana'] },
  { abbr: 'DET', fullName: 'Detroit Pistons', city: 'Detroit', nickname: 'Pistons', sport: 'NBA', aliases: ['pistons', 'detroit'] },
  { abbr: 'ATL', fullName: 'Atlanta Hawks', city: 'Atlanta', nickname: 'Hawks', sport: 'NBA', aliases: ['hawks', 'atlanta'] },
  { abbr: 'CHA', fullName: 'Charlotte Hornets', city: 'Charlotte', nickname: 'Hornets', sport: 'NBA', aliases: ['hornets', 'charlotte'] },
  { abbr: 'WAS', fullName: 'Washington Wizards', city: 'Washington', nickname: 'Wizards', sport: 'NBA', aliases: ['wizards', 'washington'] },
  { abbr: 'ORL', fullName: 'Orlando Magic', city: 'Orlando', nickname: 'Magic', sport: 'NBA', aliases: ['magic', 'orlando'] },
  { abbr: 'PHX', fullName: 'Phoenix Suns', city: 'Phoenix', nickname: 'Suns', sport: 'NBA', aliases: ['suns', 'phoenix'] },
  { abbr: 'SAC', fullName: 'Sacramento Kings', city: 'Sacramento', nickname: 'Kings', sport: 'NBA', aliases: ['kings', 'sacramento'] },
  { abbr: 'POR', fullName: 'Portland Trail Blazers', city: 'Portland', nickname: 'Trail Blazers', sport: 'NBA', aliases: ['blazers', 'trail blazers', 'portland'] },
  { abbr: 'UTA', fullName: 'Utah Jazz', city: 'Utah', nickname: 'Jazz', sport: 'NBA', aliases: ['jazz', 'utah'] },
  { abbr: 'DEN', fullName: 'Denver Nuggets', city: 'Denver', nickname: 'Nuggets', sport: 'NBA', aliases: ['nuggets', 'denver'] },
  { abbr: 'MIN', fullName: 'Minnesota Timberwolves', city: 'Minnesota', nickname: 'Timberwolves', sport: 'NBA', aliases: ['timberwolves', 'wolves', 'minnesota'] },
  { abbr: 'OKC', fullName: 'Oklahoma City Thunder', city: 'Oklahoma City', nickname: 'Thunder', sport: 'NBA', aliases: ['thunder', 'okc', 'oklahoma city'] },
  { abbr: 'MEM', fullName: 'Memphis Grizzlies', city: 'Memphis', nickname: 'Grizzlies', sport: 'NBA', aliases: ['grizzlies', 'grizz', 'memphis'] },
  { abbr: 'NOP', fullName: 'New Orleans Pelicans', city: 'New Orleans', nickname: 'Pelicans', sport: 'NBA', aliases: ['pelicans', 'pels', 'new orleans'] },
  { abbr: 'SAS', fullName: 'San Antonio Spurs', city: 'San Antonio', nickname: 'Spurs', sport: 'NBA', aliases: ['spurs', 'san antonio'] },
  { abbr: 'DAL', fullName: 'Dallas Mavericks', city: 'Dallas', nickname: 'Mavericks', sport: 'NBA', aliases: ['mavericks', 'mavs', 'dallas'] },
  { abbr: 'HOU', fullName: 'Houston Rockets', city: 'Houston', nickname: 'Rockets', sport: 'NBA', aliases: ['rockets', 'houston'] }
];

export const NFL_TEAMS: TeamMapping[] = [
  { abbr: 'KC', fullName: 'Kansas City Chiefs', city: 'Kansas City', nickname: 'Chiefs', sport: 'NFL', aliases: ['chiefs', 'kansas city', 'kc chiefs'] },
  { abbr: 'BUF', fullName: 'Buffalo Bills', city: 'Buffalo', nickname: 'Bills', sport: 'NFL', aliases: ['bills', 'buffalo'] },
  { abbr: 'SF', fullName: 'San Francisco 49ers', city: 'San Francisco', nickname: '49ers', sport: 'NFL', aliases: ['49ers', 'niners', 'san francisco', 'sf 49ers'] },
  { abbr: 'PHI', fullName: 'Philadelphia Eagles', city: 'Philadelphia', nickname: 'Eagles', sport: 'NFL', aliases: ['eagles', 'philadelphia', 'philly eagles'] },
  { abbr: 'DAL', fullName: 'Dallas Cowboys', city: 'Dallas', nickname: 'Cowboys', sport: 'NFL', aliases: ['cowboys', 'dallas'] },
  { abbr: 'DET', fullName: 'Detroit Lions', city: 'Detroit', nickname: 'Lions', sport: 'NFL', aliases: ['lions', 'detroit'] },
  { abbr: 'BAL', fullName: 'Baltimore Ravens', city: 'Baltimore', nickname: 'Ravens', sport: 'NFL', aliases: ['ravens', 'baltimore'] },
  { abbr: 'MIA', fullName: 'Miami Dolphins', city: 'Miami', nickname: 'Dolphins', sport: 'NFL', aliases: ['dolphins', 'miami'] },
  { abbr: 'CLE', fullName: 'Cleveland Browns', city: 'Cleveland', nickname: 'Browns', sport: 'NFL', aliases: ['browns', 'cleveland'] },
  { abbr: 'JAX', fullName: 'Jacksonville Jaguars', city: 'Jacksonville', nickname: 'Jaguars', sport: 'NFL', aliases: ['jaguars', 'jags', 'jacksonville'] },
  { abbr: 'CIN', fullName: 'Cincinnati Bengals', city: 'Cincinnati', nickname: 'Bengals', sport: 'NFL', aliases: ['bengals', 'cincinnati'] },
  { abbr: 'PIT', fullName: 'Pittsburgh Steelers', city: 'Pittsburgh', nickname: 'Steelers', sport: 'NFL', aliases: ['steelers', 'pittsburgh'] },
  { abbr: 'GB', fullName: 'Green Bay Packers', city: 'Green Bay', nickname: 'Packers', sport: 'NFL', aliases: ['packers', 'green bay'] },
  { abbr: 'LAR', fullName: 'Los Angeles Rams', city: 'Los Angeles', nickname: 'Rams', sport: 'NFL', aliases: ['rams', 'la rams', 'l.a. rams'] },
  { abbr: 'LAC', fullName: 'Los Angeles Chargers', city: 'Los Angeles', nickname: 'Chargers', sport: 'NFL', aliases: ['chargers', 'la chargers', 'l.a. chargers'] },
  { abbr: 'SEA', fullName: 'Seattle Seahawks', city: 'Seattle', nickname: 'Seahawks', sport: 'NFL', aliases: ['seahawks', 'seattle'] },
  { abbr: 'TB', fullName: 'Tampa Bay Buccaneers', city: 'Tampa Bay', nickname: 'Buccaneers', sport: 'NFL', aliases: ['buccaneers', 'bucs', 'tampa bay', 'tampa'] },
  { abbr: 'MIN', fullName: 'Minnesota Vikings', city: 'Minnesota', nickname: 'Vikings', sport: 'NFL', aliases: ['vikings', 'minnesota'] },
  { abbr: 'ARI', fullName: 'Arizona Cardinals', city: 'Arizona', nickname: 'Cardinals', sport: 'NFL', aliases: ['cardinals', 'arizona'] },
  { abbr: 'ATL', fullName: 'Atlanta Falcons', city: 'Atlanta', nickname: 'Falcons', sport: 'NFL', aliases: ['falcons', 'atlanta'] },
  { abbr: 'CAR', fullName: 'Carolina Panthers', city: 'Carolina', nickname: 'Panthers', sport: 'NFL', aliases: ['panthers', 'carolina'] },
  { abbr: 'DEN', fullName: 'Denver Broncos', city: 'Denver', nickname: 'Broncos', sport: 'NFL', aliases: ['broncos', 'denver'] },
  { abbr: 'HOU', fullName: 'Houston Texans', city: 'Houston', nickname: 'Texans', sport: 'NFL', aliases: ['texans', 'houston'] },
  { abbr: 'IND', fullName: 'Indianapolis Colts', city: 'Indianapolis', nickname: 'Colts', sport: 'NFL', aliases: ['colts', 'indianapolis', 'indy'] },
  { abbr: 'LV', fullName: 'Las Vegas Raiders', city: 'Las Vegas', nickname: 'Raiders', sport: 'NFL', aliases: ['raiders', 'las vegas', 'lv raiders'] },
  { abbr: 'NE', fullName: 'New England Patriots', city: 'New England', nickname: 'Patriots', sport: 'NFL', aliases: ['patriots', 'new england', 'pats'] },
  { abbr: 'NO', fullName: 'New Orleans Saints', city: 'New Orleans', nickname: 'Saints', sport: 'NFL', aliases: ['saints', 'new orleans'] },
  { abbr: 'NYG', fullName: 'New York Giants', city: 'New York', nickname: 'Giants', sport: 'NFL', aliases: ['giants', 'ny giants', 'new york giants'] },
  { abbr: 'NYJ', fullName: 'New York Jets', city: 'New York', nickname: 'Jets', sport: 'NFL', aliases: ['jets', 'ny jets', 'new york jets'] },
  { abbr: 'TEN', fullName: 'Tennessee Titans', city: 'Tennessee', nickname: 'Titans', sport: 'NFL', aliases: ['titans', 'tennessee'] },
  { abbr: 'WAS', fullName: 'Washington Commanders', city: 'Washington', nickname: 'Commanders', sport: 'NFL', aliases: ['commanders', 'washington'] }
];

export class TeamDictionary {
  private teamMap: Map<string, TeamMapping> = new Map();

  constructor() {
    this.loadTeams();
  }

  private loadTeams() {
    [...NBA_TEAMS, ...NFL_TEAMS].forEach(team => {
      this.teamMap.set(team.abbr.toLowerCase(), team);
      this.teamMap.set(team.fullName.toLowerCase(), team);
      this.teamMap.set(team.city.toLowerCase(), team);
      this.teamMap.set(team.nickname.toLowerCase(), team);
      team.aliases.forEach(alias => {
        this.teamMap.set(alias.toLowerCase(), team);
      });
    });
  }
  extractTeams(title: string, platform?: 'Poly' | 'Kalshi'): { abbrs: string[], sport: 'NBA' | 'NFL' | null } {
    const lower = title.toLowerCase();
    const foundTeams = new Map<string, TeamMapping>();

    for (const [key, team] of this.teamMap.entries()) {
      if (key.length <= 2) continue;
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      if (regex.test(lower)) {
        foundTeams.set(team.abbr, team);
      }
    }

    const abbrs = Array.from(foundTeams.keys());
    
    if (abbrs.length !== 2) {
      return { abbrs: [], sport: null };
    }

    const teams = Array.from(foundTeams.values());
    const sport = teams[0].sport === teams[1].sport ? teams[0].sport : null;

    if (!sport) {
      return { abbrs: [], sport: null };
    }

    if (abbrs.length === 2) {
      console.log(`   [EXTRACT ${platform}] "${title}" → [${abbrs.join(', ')}] (${sport})`);

    }

    return { abbrs, sport };
  }

  teamsMatch(team1: string, team2: string): boolean {
    return team1.toUpperCase() === team2.toUpperCase();
  }
}