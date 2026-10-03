export interface Competitor {
  id: string;
  name: string;
  score: number;
  isMe?: boolean;
}

export const INITIAL_TOURNAMENT_COMPETITORS: Competitor[] = [
  { id: 'c1', name: 'Bewildered Swiftlet', score: 1029 },
  { id: 'c2', name: 'Tender Toad', score: 662 },
  { id: 'c3', name: 'Quaint Curlew', score: 431 },
  { id: 'c4', name: 'Funny Quelea', score: 412 },
  { id: 'c5', name: 'Determined Emu', score: 319 },
  { id: 'c6', name: 'Concerned Manatee', score: 305 },
  { id: 'c7', name: 'Thankful Markhor', score: 272 },
  { id: 'c8', name: 'Innocent Ape', score: 263 },
  { id: 'c9', name: 'Super Rhinoceros', score: 190 },
  { id: 'c10', name: 'Adventurous Turkey', score: 177 },
  { id: 'c11', name: 'Cheerful Capybara', score: 148 },
  { id: 'c12', name: 'Brave Pangolin', score: 131 },
  { id: 'c13', name: 'Inquisitive Weasel', score: 119 },
  { id: 'c14', name: 'Graceful Platypus', score: 116 },
  { id: 'c15', name: 'Wild Dunlin', score: 112 },
  { id: 'c16', name: 'Hungry Eland', score: 109 },
  { id: 'c17', name: 'Talented Chimpanzee', score: 87 },
  { id: 'c18', name: 'Fancy Kangaroo', score: 27 },
  { id: 'c19', name: 'Adaptive Flamingo', score: 15 },
  { id: 'c20', name: 'Curious Meerkat', score: 12 },
  { id: 'c21', name: 'Jolly Hedgehog', score: 9 },
  { id: 'c22', name: 'Swift Falcon', score: 6 },
  { id: 'c23', name: 'Clever Otter', score: 4 },
  { id: 'c24', name: 'Noble Albatross', score: 2 },
  { id: 'c25', name: 'Calm Wallaby', score: 1 },
  { id: 'c26', name: 'Excited Piranha', score: 0 },
  { id: 'c27', name: 'Wandering Gentoo', score: 0 },
  { id: 'c28', name: 'Tough Cheetah', score: 0 },
  { id: 'c29', name: 'Sparkling Wren', score: 0 },
];

export function getSortedLeaderboard(playerScore: number): {
  list: (Competitor & { rank: number })[];
  myRank: number;
} {
  const combined: Competitor[] = [
    ...INITIAL_TOURNAMENT_COMPETITORS,
    { id: 'me', name: 'Me', score: playerScore, isMe: true },
  ];

  combined.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.isMe) return -1;
    if (b.isMe) return 1;
    return 0;
  });

  let myRank = 1;
  const list = combined.map((item, idx) => {
    const rank = idx + 1;
    if (item.isMe) myRank = rank;
    return { ...item, rank };
  });

  return { list, myRank };
}

export interface MonthConfig {
  key: string;
  name: string;
  year: number;
  monthIndex: number;
  daysInMonth: number;
  firstDayOfWeek: number;
}

export const DAILY_MONTHS: MonthConfig[] = [
  {
    key: '2026-08',
    name: 'August',
    year: 2026,
    monthIndex: 7,
    daysInMonth: 31,
    firstDayOfWeek: 6,
  },
  {
    key: '2026-09',
    name: 'September',
    year: 2026,
    monthIndex: 8,
    daysInMonth: 30,
    firstDayOfWeek: 2,
  },
  {
    key: '2026-10',
    name: 'October',
    year: 2026,
    monthIndex: 9,
    daysInMonth: 31,
    firstDayOfWeek: 4,
  },
];
