import React, { useEffect, useState, useRef } from 'react';
import { ArrowDef, BoxObstacle, Point, expandWaypoints, getArrowDirection } from '../data/levels';

interface ArrowBoardProps {
  levelId: number;
  cols: number;
  rows: number;
  arrows: ArrowDef[];
  boxes?: BoxObstacle[];
  removedIds: Set<string>;
  redArrowIds: Set<string>;
  allFlashRed: boolean;
  hintArrowId: string | null;
  showRulerGuides: boolean;
  isPreviewCard?: boolean;
  onTapArrow?: (arrow: ArrowDef) => 'clear' | 'blocked' | 'ignored';
}

interface ExitingAnim {
  arrow: ArrowDef;
  cells: Point[];
  dir: Point;
  startTime: number;
  tapPoint: Point;
}

interface BlockedAnim {
  arrowId: string;
  startTime: number;
}

function getSubTrackPoints(
  extendedCells: Point[],
  startDist: number,
  endDist: number,
  toPx: (x: number, y: number) => Point
): { pts: Point[]; headPx: Point; angleDeg: number } {
  const maxIdx = extendedCells.length - 1;
  const clampedStart = Math.max(0, Math.min(startDist, maxIdx));
  const clampedEnd = Math.max(clampedStart + 0.05, Math.min(endDist, maxIdx));

  const sampleAt = (d: number): Point => {
    const i = Math.floor(d);
    const frac = d - i;
    if (i >= maxIdx) return toPx(extendedCells[maxIdx][0], extendedCells[maxIdx][1]);
    const p0 = extendedCells[i];
    const p1 = extendedCells[i + 1];
    const x = p0[0] + (p1[0] - p0[0]) * frac;
    const y = p0[1] + (p1[1] - p0[1]) * frac;
    return toPx(x, y);
  };

  const pts: Point[] = [sampleAt(clampedStart)];
  const firstInt = Math.ceil(clampedStart + 0.001);
  const lastInt = Math.floor(clampedEnd - 0.001);

  for (let i = firstInt; i <= lastInt; i++) {
    if (i >= 0 && i <= maxIdx) {
      pts.push(toPx(extendedCells[i][0], extendedCells[i][1]));
    }
  }
  const headPx = sampleAt(clampedEnd);
  pts.push(headPx);

  const behindHead = sampleAt(Math.max(0, clampedEnd - 0.25));
  const dx = headPx[0] - behindHead[0];
  const dy = headPx[1] - behindHead[1];
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

  return { pts, headPx, angleDeg };
}

function buildRoundedPath(pts: Point[], cornerRadius: number = 6): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`;

  const clean: Point[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const prev = clean[clean.length - 1];
    const dist = Math.hypot(pts[i][0] - prev[0], pts[i][1] - prev[1]);
    if (dist > 0.5) {
      clean.push(pts[i]);
    }
  }
  if (clean.length === 1) return `M ${clean[0][0]} ${clean[0][1]}`;

  const corners: Point[] = [clean[0]];
  for (let i = 1; i < clean.length - 1; i++) {
    const p0 = corners[corners.length - 1];
    const p1 = clean[i];
    const p2 = clean[i + 1];
    const v1x = p1[0] - p0[0];
    const v1y = p1[1] - p0[1];
    const v2x = p2[0] - p1[0];
    const v2y = p2[1] - p1[1];
    const cross = Math.abs(v1x * v2y - v1y * v2x);
    if (cross > 1.0) {
      corners.push(p1);
    }
  }
  corners.push(clean[clean.length - 1]);

  if (corners.length === 2) {
    return `M ${corners[0][0]} ${corners[0][1]} L ${corners[1][0]} ${corners[1][1]}`;
  }

  let d = `M ${corners[0][0]} ${corners[0][1]}`;
  for (let i = 1; i < corners.length - 1; i++) {
    const prev = corners[i - 1];
    const curr = corners[i];
    const next = corners[i + 1];

    const v1x = curr[0] - prev[0];
    const v1y = curr[1] - prev[1];
    const len1 = Math.hypot(v1x, v1y);

    const v2x = next[0] - curr[0];
    const v2y = next[1] - curr[1];
    const len2 = Math.hypot(v2x, v2y);

    const r = Math.min(cornerRadius, len1 * 0.45, len2 * 0.45);
    const startCornerX = curr[0] - (v1x / len1) * r;
    const startCornerY = curr[1] - (v1y / len1) * r;
    const endCornerX = curr[0] + (v2x / len2) * r;
    const endCornerY = curr[1] + (v2y / len2) * r;

    d += ` L ${startCornerX.toFixed(2)} ${startCornerY.toFixed(2)} Q ${curr[0].toFixed(2)} ${curr[1].toFixed(2)} ${endCornerX.toFixed(2)} ${endCornerY.toFixed(2)}`;
  }

  const last = corners[corners.length - 1];
  d += ` L ${last[0].toFixed(2)} ${last[1].toFixed(2)}`;
  return d;
}

export const ArrowBoard: React.FC<ArrowBoardProps> = ({
  levelId,
  cols,
  rows,
  arrows,
  boxes = [],
  removedIds,
  redArrowIds,
  allFlashRed,
  hintArrowId,
  showRulerGuides,
  isPreviewCard = false,
  onTapArrow,
}) => {
  const [exitingAnims, setExitingAnims] = useState<ExitingAnim[]>([]);
  const [blockedAnims, setBlockedAnims] = useState<BlockedAnim[]>([]);
  const [introProgress, setIntroProgress] = useState<number>(isPreviewCard ? 0 : 1);
  const [, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setExitingAnims([]);
    setBlockedAnims([]);
    const start = performance.now();
    const duration = isPreviewCard ? 380 : levelId === 1 ? 0 : 240;
    if (duration === 0) {
      setIntroProgress(1);
      return;
    }
    setIntroProgress(0);
    let frame: number;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setIntroProgress(p);
      if (p < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [levelId, arrows, isPreviewCard]);

  useEffect(() => {
    if (exitingAnims.length === 0 && blockedAnims.length === 0) return;

    const animate = (now: number) => {
      setExitingAnims((prev) => prev.filter((a) => now - a.startTime < 340));
      setBlockedAnims((prev) => prev.filter((b) => now - b.startTime < 240));
      setTick((t) => t + 1);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [exitingAnims.length, blockedAnims.length]);

  const maxDim = Math.max(cols - 1, rows - 1, 1);
  const cellSize = isPreviewCard
    ? Math.min(30, Math.max(16, Math.floor(160 / maxDim)))
    : levelId === 1
    ? 34
    : Math.min(34, Math.max(21, Math.floor(245 / maxDim)));

  const pad = isPreviewCard ? 30 : Math.min(46, Math.max(28, Math.floor(cellSize * 1.3)));
  const boardWidth = (cols - 1) * cellSize + pad * 2;
  const boardHeight = (rows - 1) * cellSize + pad * 2;

  const toPx = (gx: number, gy: number): Point => [
    pad + gx * cellSize,
    pad + gy * cellSize,
  ];

  const handlePointerDown = (arrow: ArrowDef) => {
    if (isPreviewCard || !onTapArrow) return;
    if (removedIds.has(arrow.id)) return;

    const result = onTapArrow(arrow);
    const cells = expandWaypoints(arrow.waypoints);
    const dir = getArrowDirection(cells);
    const head = cells[cells.length - 1];

    if (result === 'clear') {
      setExitingAnims((prev) => [
        ...prev,
        {
          arrow,
          cells,
          dir,
          startTime: performance.now(),
          tapPoint: toPx(head[0], head[1]),
        },
      ]);
    } else if (result === 'blocked') {
      setBlockedAnims((prev) => [
        ...prev.filter((b) => b.arrowId !== arrow.id),
        {
          arrowId: arrow.id,
          startTime: performance.now(),
        },
      ]);
    }
  };

  const now = performance.now();

  const renderArrowGeometry = (
    cells: Point[],
    shiftSteps: number,
    color: string,
    opacity: number = 1,
    isHinted: boolean = false
  ) => {
    const dir = getArrowDirection(cells);
    const extended: Point[] = [...cells];
    const last = cells[cells.length - 1];
    for (let s = 1; s <= 14; s++) {
      extended.push([last[0] + dir[0] * s, last[1] + dir[1] * s]);
    }

    const totalLen = cells.length - 1;
    const visibleLen = totalLen * (0.25 + 0.75 * introProgress);
    const startDist = shiftSteps + (totalLen - visibleLen) * 0.5;
    const endDist = shiftSteps + totalLen - (totalLen - visibleLen) * 0.5;

    const shaftEndDist = Math.max(startDist + 0.05, endDist - 0.12);

    const { pts } = getSubTrackPoints(extended, startDist, shaftEndDist, toPx);
    const { headPx, angleDeg } = getSubTrackPoints(extended, startDist, endDist, toPx);
    const dPath = buildRoundedPath(pts, Math.min(5.5, cellSize * 0.22));
    const arrowScale = Math.max(0.68, Math.min(1.05, cellSize / 30));

    return (
      <g style={{ opacity }}>
        {isHinted && (
          <path
            d={dPath}
            fill="none"
            stroke="#38BDF8"
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulse opacity-40"
          />
        )}
        <path
          d={dPath}
          fill="none"
          stroke={color}
          strokeWidth={isPreviewCard ? 2.2 : Math.max(2.2, Math.min(3.0, cellSize * 0.11))}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {introProgress > 0.65 && (
          <g transform={`translate(${headPx[0].toFixed(2)}, ${headPx[1].toFixed(2)}) rotate(${angleDeg.toFixed(2)})`}>
            <polygon
              points={`${(2.5 * arrowScale).toFixed(1)},0 ${(-7.5 * arrowScale).toFixed(1)},${(-5.2 * arrowScale).toFixed(1)} ${(-7.5 * arrowScale).toFixed(1)},${(5.2 * arrowScale).toFixed(1)}`}
              fill={color}
              stroke={color}
              strokeWidth={0.7}
              strokeLinejoin="round"
            />
          </g>
        )}
      </g>
    );
  };

  const showLevel1Tutorial = !isPreviewCard && levelId === 1 && removedIds.size === 0;

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <svg
        width={boardWidth}
        height={boardHeight}
        viewBox={`0 0 ${boardWidth} ${boardHeight}`}
        className="overflow-visible touch-manipulation"
      >
        <defs>
          <linearGradient id="boxGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <filter id="boxShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* 1. Dot Matrix */}
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((__, c) => {
            const [cx, cy] = toPx(c, r);
            return (
              <circle
                key={`dot_${c}_${r}`}
                cx={cx}
                cy={cy}
                r={1.7}
                fill="#CBD5E1"
              />
            );
          })
        )}

        {/* 2. Obstacle Boxes ("Har panch level ke bad box Banna chahie") */}
        {boxes.map((box) => {
          const p0 = toPx(box.x, box.y);
          const p1 = toPx(box.x + box.w - 1, box.y + box.h - 1);
          const cx = (p0[0] + p1[0]) / 2;
          const cy = (p0[1] + p1[1]) / 2;
          const bw = (box.w - 1) * cellSize + cellSize * 0.88;
          const bh = (box.h - 1) * cellSize + cellSize * 0.88;
          const bx = cx - bw / 2;
          const by = cy - bh / 2;

          return (
            <g key={box.id} filter="url(#boxShadow)">
              {/* Outer Crate Box */}
              <rect
                x={bx}
                y={by}
                width={bw}
                height={bh}
                rx={6}
                fill="url(#boxGrad)"
                stroke="#64748B"
                strokeWidth={1.8}
              />
              {/* Inset border */}
              <rect
                x={bx + 3.5}
                y={by + 3.5}
                width={bw - 7}
                height={bh - 7}
                rx={4}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={1.2}
                strokeDasharray="4 2"
                opacity={0.8}
              />
              {/* Center Cross / Rivet Details */}
              <line
                x1={bx + 5}
                y1={by + 5}
                x2={bx + bw - 5}
                y2={by + bh - 5}
                stroke="#334155"
                strokeWidth={1.2}
              />
              <line
                x1={bx + bw - 5}
                y1={by + 5}
                x2={bx + 5}
                y2={by + bh - 5}
                stroke="#334155"
                strokeWidth={1.2}
              />
              {/* Center Lock / Obstacle Icon */}
              <circle cx={cx} cy={cy} r={7} fill="#0F172A" stroke="#F59E0B" strokeWidth={1.2} />
              <text
                x={cx}
                y={cy + 3}
                textAnchor="middle"
                fontSize="8"
                fontWeight="bold"
                fill="#FBBF24"
              >
                ✕
              </text>
            </g>
          );
        })}

        {/* 3. Ruler Guides */}
        {showRulerGuides &&
          !isPreviewCard &&
          arrows.map((arrow) => {
            if (removedIds.has(arrow.id)) return null;
            const cells = expandWaypoints(arrow.waypoints);
            const head = cells[cells.length - 1];
            const dir = getArrowDirection(cells);
            const [hx, hy] = toPx(head[0], head[1]);
            const [ex, ey] = toPx(
              head[0] + dir[0] * Math.max(cols, rows),
              head[1] + dir[1] * Math.max(cols, rows)
            );
            return (
              <line
                key={`guide_${arrow.id}`}
                x1={hx}
                y1={hy}
                x2={ex}
                y2={ey}
                stroke="#6366F1"
                strokeWidth={1.3}
                strokeDasharray="3 4"
                opacity={0.45}
              />
            );
          })}

        {/* 4. Active Arrows */}
        {arrows.map((arrow) => {
          if (removedIds.has(arrow.id)) return null;
          const cells = expandWaypoints(arrow.waypoints);
          const blockedAnim = blockedAnims.find((b) => b.arrowId === arrow.id);

          let shiftSteps = 0;
          if (blockedAnim) {
            const elapsed = now - blockedAnim.startTime;
            const t = Math.min(1, elapsed / 220);
            shiftSteps = Math.sin(t * Math.PI) * 0.28;
          }

          const isRed = allFlashRed || redArrowIds.has(arrow.id);
          const isHinted = hintArrowId === arrow.id;
          const strokeColor = isRed
            ? '#EE2B2B'
            : isHinted
            ? '#0284C7'
            : introProgress < 0.7
            ? '#64748B'
            : '#09152E';

          const pts = cells.map(([x, y]) => toPx(x, y));
          const hitPath = buildRoundedPath(pts, 5.5);

          return (
            <g
              key={arrow.id}
              onClick={() => handlePointerDown(arrow)}
              className={isPreviewCard ? '' : 'cursor-pointer'}
            >
              {renderArrowGeometry(cells, shiftSteps, strokeColor, 1, isHinted)}
              {!isPreviewCard && (
                <path
                  d={hitPath}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={Math.max(26, cellSize * 0.85)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </g>
          );
        })}

        {/* 5. Exiting Blue Arrows */}
        {exitingAnims.map((anim) => {
          const elapsed = now - anim.startTime;
          const progress = Math.min(1, elapsed / 320);
          const eased = 1 - Math.pow(1 - progress, 2.2);
          const travelSteps = eased * (anim.cells.length + 5.5);
          const opacity = progress > 0.65 ? Math.max(0, 1 - (progress - 0.65) / 0.35) : 1;

          return (
            <g key={`exit_${anim.arrow.id}_${anim.startTime}`} className="pointer-events-none">
              {progress < 0.55 && (
                <circle
                  cx={anim.tapPoint[0]}
                  cy={anim.tapPoint[1]}
                  r={12 + progress * 14}
                  fill="#94A3B8"
                  opacity={0.22 * (1 - progress / 0.55)}
                />
              )}
              {renderArrowGeometry(anim.cells, travelSteps, '#007AFF', opacity, false)}
            </g>
          );
        })}
      </svg>

      {showLevel1Tutorial && (
        <div
          onClick={() => {
            const midArrow = arrows[1] || arrows[0];
            if (midArrow) handlePointerDown(midArrow);
          }}
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer"
          style={{ top: `${boardHeight - 36}px` }}
        >
          <div className="absolute -top-20 left-1/2 translate-x-1 animate-bounce pointer-events-none">
            <svg width="46" height="46" viewBox="0 0 48 48" fill="none" className="drop-shadow-md">
              <path
                d="M19 8C19 5.79086 20.7909 4 23 4C25.2091 4 27 5.79086 27 8V20H29C31.2091 20 33 21.7909 33 24V25H35C37.2091 25 39 26.7909 39 29V34C39 40.6274 33.6274 46 27 46H21C15.5 46 12 42 10.5 37L7.5 28.5C6.8 26.5 8 24 10.2 23.5C12.2 23 14.2 24 15 26L19 31V8Z"
                fill="white"
                stroke="#334155"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[10px] border-b-[#1D82F5]" />
          <div className="bg-[#1D82F5] text-white font-semibold text-[15px] px-6 py-3 rounded-xl shadow-lg shadow-blue-500/25 whitespace-nowrap">
            Tap to remove
          </div>
        </div>
      )}
    </div>
  );
};
