export type Point = [number, number]; // [x, y]

export interface BoxObstacle {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ArrowDef {
  id: string;
  waypoints: Point[];
}

export interface LevelDef {
  id: number;
  cols: number;
  rows: number;
  difficulty: 'Normal' | 'Hard' | 'Expert' | 'Master' | 'Infinite';
  isHardLevel: boolean;
  boxes: BoxObstacle[];
  praiseText: string;
  praiseEmoji: string;
  arrows: ArrowDef[];
}

export function expandWaypoints(waypoints: Point[]): Point[] {
  if (waypoints.length === 0) return [];
  const cells: Point[] = [[waypoints[0][0], waypoints[0][1]]];
  for (let i = 1; i < waypoints.length; i++) {
    const [x0, y0] = cells[cells.length - 1];
    const [x1, y1] = waypoints[i];
    const dx = Math.sign(x1 - x0);
    const dy = Math.sign(y1 - y0);
    let cx = x0;
    let cy = y0;
    while (cx !== x1 || cy !== y1) {
      cx += dx;
      cy += dy;
      cells.push([cx, cy]);
    }
  }
  return cells;
}

export function getArrowDirection(cells: Point[]): Point {
  if (cells.length < 2) return [0, -1];
  const head = cells[cells.length - 1];
  const prev = cells[cells.length - 2];
  return [Math.sign(head[0] - prev[0]), Math.sign(head[1] - prev[1])];
}

export function isPointInsideBoxes(x: number, y: number, boxes: BoxObstacle[]): string | null {
  for (const box of boxes) {
    if (x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h) {
      return box.id;
    }
  }
  return null;
}

export function getBlockingArrowId(
  targetArrow: ArrowDef,
  remainingArrows: ArrowDef[],
  cols: number,
  rows: number,
  boxes: BoxObstacle[] = []
): string | null {
  const targetCells = expandWaypoints(targetArrow.waypoints);
  if (targetCells.length < 2) return null;

  const head = targetCells[targetCells.length - 1];
  const [dx, dy] = getArrowDirection(targetCells);

  const occupiedBy = new Map<string, string>();
  for (const arrow of remainingArrows) {
    if (arrow.id === targetArrow.id) continue;
    const cells = expandWaypoints(arrow.waypoints);
    for (const [x, y] of cells) {
      occupiedBy.set(`${x},${y}`, arrow.id);
    }
  }

  const selfBody = new Set<string>();
  for (let i = 0; i < targetCells.length - 1; i++) {
    selfBody.add(`${targetCells[i][0]},${targetCells[i][1]}`);
  }

  let cx = head[0] + dx;
  let cy = head[1] + dy;
  const maxCoord = Math.max(cols, rows) + 3;
  let steps = 0;
  while (cx >= 0 && cx < cols && cy >= 0 && cy < rows && steps < maxCoord) {
    const boxHitId = isPointInsideBoxes(cx, cy, boxes);
    if (boxHitId) {
      return `box_${boxHitId}`;
    }

    const key = `${cx},${cy}`;
    if (occupiedBy.has(key)) {
      return occupiedBy.get(key)!;
    }
    if (selfBody.has(key)) {
      return targetArrow.id;
    }
    cx += dx;
    cy += dy;
    steps++;
  }

  return null;
}

const CURATED_LEVELS: Record<number, LevelDef> = {
  1: {
    id: 1,
    cols: 3,
    rows: 5,
    difficulty: 'Normal',
    isHardLevel: false,
    boxes: [],
    praiseText: 'Awesome!',
    praiseEmoji: '🌟',
    arrows: [
      { id: 'l1_a1', waypoints: [[0, 4], [0, 0]] },
      { id: 'l1_a2', waypoints: [[1, 4], [1, 0]] },
      { id: 'l1_a3', waypoints: [[2, 0], [2, 4]] },
    ],
  },
  2: {
    id: 2,
    cols: 6,
    rows: 6,
    difficulty: 'Normal',
    isHardLevel: false,
    boxes: [],
    praiseText: 'Genius!',
    praiseEmoji: '🥳',
    arrows: [
      { id: 'l2_a1', waypoints: [[5, 0], [5, 5]] },
      { id: 'l2_a2', waypoints: [[4, 5], [0, 5], [0, 0], [4, 0]] },
      { id: 'l2_a3', waypoints: [[4, 4], [4, 1], [1, 1]] },
      { id: 'l2_a4', waypoints: [[1, 4], [1, 2]] },
      { id: 'l2_a5', waypoints: [[2, 4], [3, 4]] },
      { id: 'l2_a6', waypoints: [[2, 3], [2, 2], [3, 2], [3, 3]] },
    ],
  },
  3: {
    id: 3,
    cols: 6,
    rows: 6,
    difficulty: 'Normal',
    isHardLevel: false,
    boxes: [],
    praiseText: 'Way to Go!',
    praiseEmoji: '👏',
    arrows: [
      { id: 'l3_a1', waypoints: [[3, 0], [5, 0]] },
      { id: 'l3_a2', waypoints: [[2, 0], [2, 1], [5, 1]] },
      { id: 'l3_a3', waypoints: [[5, 5], [5, 2]] },
      { id: 'l3_a4', waypoints: [[1, 0], [0, 0], [0, 3]] },
      { id: 'l3_a5', waypoints: [[0, 4], [0, 5], [3, 5]] },
      { id: 'l3_a6', waypoints: [[2, 4], [1, 4], [1, 1]] },
      { id: 'l3_a7', waypoints: [[4, 3], [4, 2], [2, 2], [2, 3]] },
      { id: 'l3_a8', waypoints: [[4, 4], [3, 4]] },
    ],
  },
};

const PRAISE_OPTIONS = [
  { text: 'Genius!', emoji: '🥳' },
  { text: 'Way to Go!', emoji: '👏' },
  { text: 'Brilliant!', emoji: '🔥' },
  { text: 'Spectacular!', emoji: '🌟' },
  { text: 'Sharp Mind!', emoji: '🧠' },
  { text: 'Unstoppable!', emoji: '🚀' },
  { text: 'Mastermind!', emoji: '👑' },
  { text: 'Flawless!', emoji: '✨' },
];

function createRng(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates an infinite sequence of solvable levels.
 * RULES REQUESTED BY USER:
 * 1. Dot box ratio expands as levels progress (4x4, 5x5, 6x6, 7x7, 8x8, 9x9, 10x10, 11x11...).
 * 2. After every game, the network increases by 3 to 4 arrows (targetArrows = 3 + (levelId - 1) * 3.5),
 *    making EVERY single level progressively harder!
 * 3. Every 5th level (5, 10, 15, 20...), one or more obstacle boxes are built on the grid ("box Banna chahie"),
 *    with marked 'Hard' difficulty and boss bonuses.
 */
export function generateSolvableLevel(levelId: number, seedOffset: number = 0): LevelDef {
  if (seedOffset === 0 && CURATED_LEVELS[levelId]) {
    return CURATED_LEVELS[levelId];
  }

  const rng = createRng((levelId % 1000000) * 98765 + seedOffset * 12345 + 777);
  const isHardLevel = levelId % 5 === 0;

  // 1. DYNAMIC DOT BOX RATIO SCALING:
  // Starts at 5x5/6x6 and expands up to 10x10 / 11x11 as levels progress
  let gridDim = 6;
  if (levelId === 1) {
    gridDim = 5;
  } else if (levelId === 2 || levelId === 3) {
    gridDim = 6;
  } else if (levelId <= 5) {
    gridDim = 6;
  } else if (levelId <= 8) {
    gridDim = 7;
  } else if (levelId <= 12) {
    gridDim = 8;
  } else if (levelId <= 18) {
    gridDim = 9;
  } else if (levelId <= 25) {
    gridDim = 10;
  } else {
    gridDim = 11;
  }

  const cols = gridDim;
  const rows = gridDim;

  // 2. INCREASE NETWORK BY 3 TO 4 ARROWS ON EVERY LEVEL:
  // Level 1: 3
  // Level 2: 6 (+3)
  // Level 3: 8 (+2)
  // Level 4: 11 (+3)
  // Level 5: 15 (+4)
  // Level 6: 18 (+3)
  // Level 7: 22 (+4)
  // Level 8: 25 (+3)
  // Level 9: 29 (+4)
  // Level 10: 33 (+4)...
  const baseRate = 3.4; // Average 3.4 arrows added per level (alternates +3 and +4)
  let targetArrows = Math.round(3 + (levelId - 1) * baseRate);
  // Cap target arrows according to grid area so it never overflows physical dot capacity
  const maxCapacity = Math.floor((cols * rows) / 2.3);
  targetArrows = Math.min(targetArrows, maxCapacity);

  let difficulty: 'Normal' | 'Hard' | 'Expert' | 'Master' | 'Infinite' = 'Normal';
  if (isHardLevel) {
    difficulty = levelId <= 15 ? 'Hard' : levelId <= 40 ? 'Expert' : 'Master';
  } else {
    difficulty =
      levelId <= 4
        ? 'Normal'
        : levelId <= 10
        ? 'Hard'
        : levelId <= 25
        ? 'Expert'
        : levelId <= 60
        ? 'Master'
        : 'Infinite';
  }

  // 3. OBSTACLE BOXES ON EVERY 5TH LEVEL ("Har panch level ke bad box Banna chahie"):
  const boxes: BoxObstacle[] = [];
  const occupied = new Set<string>();

  if (isHardLevel) {
    // Number of boxes scales with the 5th milestone: Level 5 has 1 box, Level 10+ has 2 boxes, Level 20+ has 3 boxes!
    const numBoxes = Math.min(3, 1 + Math.floor((levelId - 5) / 10));

    // Center primary box
    const centerBoxSize = cols >= 8 && rng() < 0.6 ? 2 : 1;
    const midX = Math.floor(cols / 2) - Math.floor(centerBoxSize / 2);
    const midY = Math.floor(rows / 2) - Math.floor(centerBoxSize / 2);

    boxes.push({
      id: `box_center_${levelId}`,
      x: midX,
      y: midY,
      w: centerBoxSize,
      h: centerBoxSize,
    });

    for (let bx = midX; bx < midX + centerBoxSize; bx++) {
      for (let by = midY; by < midY + centerBoxSize; by++) {
        occupied.add(`${bx},${by}`);
      }
    }

    // Additional boxes on higher 5th levels
    if (numBoxes >= 2) {
      const b2x = midX >= 4 ? midX - 2 : midX + 2;
      const b2y = midY >= 4 ? midY - 2 : midY + 2;
      if (b2x >= 1 && b2x < cols - 1 && b2y >= 1 && b2y < rows - 1) {
        boxes.push({
          id: `box_sub1_${levelId}`,
          x: b2x,
          y: b2y,
          w: 1,
          h: 1,
        });
        occupied.add(`${b2x},${b2y}`);
      }
    }

    if (numBoxes >= 3) {
      const b3x = 1;
      const b3y = rows - 2;
      if (!occupied.has(`${b3x},${b3y}`)) {
        boxes.push({
          id: `box_sub2_${levelId}`,
          x: b3x,
          y: b3y,
          w: 1,
          h: 1,
        });
        occupied.add(`${b3x},${b3y}`);
      }
    }
  }

  const placedArrows: ArrowDef[] = [];
  const exitRayCells = new Set<string>();

  const dirs: Point[] = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];

  const isInside = (x: number, y: number) => x >= 0 && x < cols && y >= 0 && y < rows;

  const isRayClear = (head: Point, dir: Point, selfCells: Set<string>): boolean => {
    let cx = head[0] + dir[0];
    let cy = head[1] + dir[1];
    while (isInside(cx, cy)) {
      if (isPointInsideBoxes(cx, cy, boxes)) return false;
      const key = `${cx},${cy}`;
      if (occupied.has(key) || selfCells.has(key)) return false;
      cx += dir[0];
      cy += dir[1];
    }
    return true;
  };

  const addExitRayToSet = (head: Point, dir: Point) => {
    let cx = head[0] + dir[0];
    let cy = head[1] + dir[1];
    while (isInside(cx, cy)) {
      if (isPointInsideBoxes(cx, cy, boxes)) break;
      exitRayCells.add(`${cx},${cy}`);
      cx += dir[0];
      cy += dir[1];
    }
  };

  const compressToWaypoints = (cells: Point[]): Point[] => {
    if (cells.length <= 2) return cells;
    const wp: Point[] = [cells[0]];
    for (let i = 1; i < cells.length - 1; i++) {
      const prev = cells[i - 1];
      const curr = cells[i];
      const next = cells[i + 1];
      const dx1 = curr[0] - prev[0];
      const dy1 = curr[1] - prev[1];
      const dx2 = next[0] - curr[0];
      const dy2 = next[1] - curr[1];
      if (dx1 !== dx2 || dy1 !== dy2) {
        wp.push(curr);
      }
    }
    wp.push(cells[cells.length - 1]);
    return wp;
  };

  // Place arrows in reverse solvable order
  for (let aIdx = 0; aIdx < targetArrows; aIdx++) {
    let bestCandidate: { cells: Point[]; score: number } | null = null;

    for (let attempt = 0; attempt < 110; attempt++) {
      const startX = Math.floor(rng() * cols);
      const startY = Math.floor(rng() * rows);
      if (occupied.has(`${startX},${startY}`)) continue;

      // Allow 2 to 5 unit segments so density fits tightly on the expanded dot grid
      const desiredLen = 2 + Math.floor(rng() * 4);
      const cells: Point[] = [[startX, startY]];
      const selfSet = new Set<string>([`${startX},${startY}`]);
      let currentDir = dirs[Math.floor(rng() * 4)];
      let turns = 0;

      for (let step = 1; step < desiredLen; step++) {
        const shouldTurn = step > 1 && turns < 2 && rng() < 0.5;
        const candidateDirs: Point[] = shouldTurn
          ? dirs.filter((d) => d[0] !== -currentDir[0] && d[1] !== -currentDir[1] && (d[0] !== currentDir[0] || d[1] !== currentDir[1]))
          : [currentDir, ...dirs.filter((d) => d[0] !== -currentDir[0] && d[1] !== -currentDir[1])];

        let moved = false;
        const [cx, cy] = cells[cells.length - 1];
        for (const d of candidateDirs) {
          const nx = cx + d[0];
          const ny = cy + d[1];
          const nKey = `${nx},${ny}`;
          if (
            isInside(nx, ny) &&
            !occupied.has(nKey) &&
            !selfSet.has(nKey) &&
            !isPointInsideBoxes(nx, ny, boxes)
          ) {
            if (d[0] !== currentDir[0] || d[1] !== currentDir[1]) {
              turns++;
            }
            currentDir = d;
            cells.push([nx, ny]);
            selfSet.add(nKey);
            moved = true;
            break;
          }
        }
        if (!moved) break;
      }

      if (cells.length < 2) continue;

      const head = cells[cells.length - 1];
      const headDir = getArrowDirection(cells);

      if (!isRayClear(head, headDir, selfSet)) continue;

      let blocksCount = 0;
      for (const [x, y] of cells) {
        if (exitRayCells.has(`${x},${y}`)) blocksCount++;
      }
      const score = blocksCount * 14 + turns * 4 + cells.length * 1.5 + rng() * 2;

      if (!bestCandidate || score > bestCandidate.score) {
        bestCandidate = { cells, score };
      }
    }

    if (bestCandidate) {
      const { cells } = bestCandidate;
      for (const [x, y] of cells) {
        occupied.add(`${x},${y}`);
      }
      const head = cells[cells.length - 1];
      const headDir = getArrowDirection(cells);
      addExitRayToSet(head, headDir);

      placedArrows.push({
        id: `l${levelId}_a${aIdx + 1}`,
        waypoints: compressToWaypoints(cells),
      });
    }
  }

  // Safety fallback for empty edges
  if (placedArrows.length < 3) {
    for (let r = 0; r < rows; r++) {
      if (
        !occupied.has(`0,${r}`) &&
        !occupied.has(`1,${r}`) &&
        !occupied.has(`2,${r}`) &&
        !isPointInsideBoxes(0, r, boxes) &&
        !isPointInsideBoxes(1, r, boxes) &&
        !isPointInsideBoxes(2, r, boxes)
      ) {
        occupied.add(`0,${r}`);
        occupied.add(`1,${r}`);
        occupied.add(`2,${r}`);
        placedArrows.push({
          id: `l${levelId}_fb_${r}`,
          waypoints: [[0, r], [2, r]],
        });
        if (placedArrows.length >= 4) break;
      }
    }
  }

  const praise = isHardLevel
    ? { text: 'Boss Defeated!', emoji: '👑' }
    : PRAISE_OPTIONS[(levelId - 1) % PRAISE_OPTIONS.length];

  return {
    id: levelId,
    cols,
    rows,
    difficulty,
    isHardLevel,
    boxes,
    praiseText: praise.text,
    praiseEmoji: praise.emoji,
    arrows: placedArrows.reverse(),
  };
}
