import React from 'react';

export const AppMazeLogo: React.FC<{ size?: number }> = ({ size = 92 }) => (
  <div
    style={{ width: size, height: size }}
    className="bg-white rounded-[22px] shadow-[0_12px_32px_rgba(0,110,255,0.18)] p-2.5 flex items-center justify-center border border-slate-100"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <g
        fill="none"
        stroke="#0B1933"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 8 22 L 8 8 L 32 8" />
        <polygon points="36,8 29,4 29,12" fill="#0B1933" stroke="none" />

        <path d="M 44 8 L 68 8 L 68 20 L 50 20" />
        <polygon points="46,20 53,16 53,24" fill="#0B1933" stroke="none" />

        <path d="M 76 8 L 92 8 L 92 34" />
        <polygon points="92,38 88,31 96,31" fill="#0B1933" stroke="none" />

        <path d="M 20 20 L 38 20 L 38 34 L 18 34" />
        <polygon points="14,34 21,30 21,38" fill="#0B1933" stroke="none" />

        <path d="M 8 44 L 8 68 L 22 68" />
        <polygon points="26,68 19,64 19,72" fill="#0B1933" stroke="none" />

        <path d="M 80 24 L 80 44 L 62 44" />
        <polygon points="58,44 65,40 65,48" fill="#0B1933" stroke="none" />

        <path d="M 22 48 L 22 56 L 38 56 L 38 82 L 18 82" />
        <polygon points="14,82 21,78 21,86" fill="#0B1933" stroke="none" />

        <path d="M 8 78 L 8 92 L 46 92" />
        <polygon points="50,92 43,88 43,96" fill="#0B1933" stroke="none" />

        <path d="M 92 66 L 92 92 L 62 92" />
        <polygon points="58,92 65,88 65,96" fill="#0B1933" stroke="none" />

        <path d="M 78 68 L 78 80 L 52 80 L 52 66" />
        <polygon points="52,62 48,69 56,69" fill="#0B1933" stroke="none" />
      </g>

      <g
        fill="none"
        stroke="#0084FF"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 8 34 L 28 34 L 28 46 L 50 46 L 50 32 L 68 32 L 68 56 L 88 56" />
        <polygon points="94,56 85,50 85,62" fill="#0084FF" stroke="none" />
      </g>
    </svg>
  </div>
);

export const BackgroundEmbossedArrows: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
    <svg
      viewBox="0 0 300 300"
      className="absolute -top-8 -left-10 w-72 h-72 opacity-80"
    >
      <defs>
        <filter id="softShadow1" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="4" dy="10" stdDeviation="10" floodColor="#CBD5E1" floodOpacity="0.45" />
        </filter>
      </defs>
      <path
        d="M -20 40 L 140 160 L 105 205 L 245 215 L 205 80 L 170 125 L 10 5 Z"
        fill="#F8FAFC"
        filter="url(#softShadow1)"
      />
    </svg>

    <svg
      viewBox="0 0 300 300"
      className="absolute bottom-14 -right-8 w-80 h-80 opacity-80"
    >
      <defs>
        <filter id="softShadow2" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="-2" dy="10" stdDeviation="10" floodColor="#CBD5E1" floodOpacity="0.45" />
        </filter>
      </defs>
      <path
        d="M 40 280 L 185 155 L 220 195 L 245 60 L 110 75 L 145 115 L 0 240 Z"
        fill="#F8FAFC"
        filter="url(#softShadow2)"
      />
    </svg>
  </div>
);

export const GoldStarCoin: React.FC<{ size?: number }> = ({ size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" className="drop-shadow-md">
    <defs>
      <linearGradient id="goldCoinGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="55%" stopColor="#FACC15" />
        <stop offset="100%" stopColor="#EAB308" />
      </linearGradient>
      <linearGradient id="goldStarInner" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="54" fill="url(#goldCoinGrad)" stroke="#F59E0B" strokeWidth="3" />
    <circle cx="60" cy="60" r="46" fill="none" stroke="#FEF08A" strokeWidth="1.5" opacity="0.7" />
    <polygon
      points="60,24 70.5,45.5 94,49 77,65.5 81,89 60,78 39,89 43,65.5 26,49 49.5,45.5"
      fill="url(#goldStarInner)"
    />
  </svg>
);

export const TrophyIllustration: React.FC<{
  variant: 'gold' | 'silhouette' | 'silver';
  size?: number;
}> = ({ variant, size = 120 }) => {
  const isGold = variant === 'gold';
  const isSilhouette = variant === 'silhouette';

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="drop-shadow-md">
      <defs>
        <linearGradient id="trophyGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="trophySilhouette" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E3A5F" />
          <stop offset="50%" stopColor="#0F2540" />
          <stop offset="100%" stopColor="#071324" />
        </linearGradient>
        <linearGradient id="trophySilver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="50%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
      </defs>

      <path
        d="M 34 30 C 16 30, 16 58, 38 62"
        fill="none"
        stroke={isGold ? 'url(#trophyGold)' : isSilhouette ? '#152C4A' : 'url(#trophySilver)'}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 86 30 C 104 30, 104 58, 82 62"
        fill="none"
        stroke={isGold ? 'url(#trophyGold)' : isSilhouette ? '#152C4A' : 'url(#trophySilver)'}
        strokeWidth="6"
        strokeLinecap="round"
      />

      <path
        d="M 30 20 L 90 20 L 84 54 C 81 70, 68 78, 60 78 C 52 78, 39 70, 36 54 Z"
        fill={isGold ? 'url(#trophyGold)' : isSilhouette ? 'url(#trophySilhouette)' : 'url(#trophySilver)'}
      />

      <rect
        x="27"
        y="16"
        width="66"
        height="6"
        rx="3"
        fill={isGold ? '#FDE047' : isSilhouette ? '#254773' : '#E2E8F0'}
      />

      <path
        d="M 54 76 L 66 76 L 69 94 L 51 94 Z"
        fill={isGold ? 'url(#trophyGold)' : isSilhouette ? 'url(#trophySilhouette)' : 'url(#trophySilver)'}
      />

      <rect
        x="40"
        y="93"
        width="40"
        height="7"
        rx="2"
        fill={isGold ? '#D97706' : isSilhouette ? '#173152' : '#94A3B8'}
      />
      <rect
        x="32"
        y="100"
        width="56"
        height="9"
        rx="3"
        fill={isGold ? '#78350F' : isSilhouette ? '#091628' : '#64748B'}
      />
    </svg>
  );
};

export const TournamentMedalsCluster: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <div
    style={{ transform: `scale(${scale})` }}
    className="relative flex items-center justify-center h-32 w-64 select-none"
  >
    <div className="relative -mr-5 mt-3 z-10">
      <CrownMedal color="silver" size={78} />
    </div>
    <div className="relative z-20 -mt-2">
      <CrownMedal color="gold" size={96} />
    </div>
    <div className="relative -ml-5 mt-3 z-10">
      <CrownMedal color="bronze" size={78} />
    </div>
  </div>
);

export const CrownMedal: React.FC<{
  color: 'gold' | 'silver' | 'bronze';
  size?: number;
}> = ({ color, size = 80 }) => {
  const palette = {
    gold: {
      outer: '#F59E0B',
      inner: '#FBBF24',
      highlight: '#FEF08A',
      stroke: '#B45309',
    },
    silver: {
      outer: '#94A3B8',
      inner: '#CBD5E1',
      highlight: '#F8FAFC',
      stroke: '#475569',
    },
    bronze: {
      outer: '#C26D38',
      inner: '#E08A53',
      highlight: '#FBD3B7',
      stroke: '#7C3A16',
    },
  }[color];

  return (
    <svg width={size} height={size * 1.18} viewBox="0 0 100 118" className="drop-shadow-lg">
      <g transform="translate(22, 82) rotate(18)">
        <polygon points="0,0 20,0 20,30 10,23 0,30" fill="#2563EB" />
        <rect x="6" y="0" width="8" height="26" fill="#F8FAFC" opacity="0.85" />
      </g>
      <g transform="translate(58, 88) rotate(-18)">
        <polygon points="0,0 20,0 20,30 10,23 0,30" fill="#DC2626" />
        <rect x="6" y="0" width="8" height="26" fill="#F8FAFC" opacity="0.85" />
      </g>

      <circle
        cx="50"
        cy="50"
        r="43"
        fill={palette.outer}
        stroke={palette.highlight}
        strokeWidth="2.5"
      />
      <circle
        cx="50"
        cy="50"
        r="34"
        fill={palette.inner}
        stroke={palette.stroke}
        strokeWidth="1.5"
      />

      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const cx = 50 + Math.cos(rad) * 38.5;
        const cy = 50 + Math.sin(rad) * 38.5;
        return <circle key={deg} cx={cx} cy={cy} r="2" fill={palette.highlight} />;
      })}

      <path
        d="M 32 60 L 29 41 L 41 49 L 50 36 L 59 49 L 71 41 L 68 60 Z"
        fill={palette.highlight}
        stroke={palette.stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const TournamentArrowTrophy: React.FC<{ size?: number }> = ({ size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" className="drop-shadow-md">
    <path
      d="M 30 34 C 14 34, 14 60, 36 64"
      fill="none"
      stroke="#F59E0B"
      strokeWidth="7"
      strokeLinecap="round"
    />
    <path
      d="M 90 34 C 106 34, 106 60, 84 64"
      fill="none"
      stroke="#F59E0B"
      strokeWidth="7"
      strokeLinecap="round"
    />
    <path
      d="M 28 22 L 92 22 L 86 58 C 82 74, 68 80, 60 80 C 52 80, 38 74, 34 58 Z"
      fill="#FBBF24"
    />
    <path
      d="M 48 56 L 68 38 M 68 38 L 55 38 M 68 38 L 68 51"
      fill="none"
      stroke="#FEF08A"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="52" y="78" width="16" height="16" fill="#F59E0B" />
    <rect x="38" y="92" width="44" height="10" rx="5" fill="#D97706" />
  </svg>
);

export const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank <= 3) {
    const colors = {
      1: { bg: '#FBBF24', border: '#D97706', text: '#92400E' },
      2: { bg: '#CBD5E1', border: '#64748B', text: '#334155' },
      3: { bg: '#E08A53', border: '#9A3412', text: '#7C2D12' },
    }[rank as 1 | 2 | 3];

    return (
      <div className="relative flex items-center justify-center w-9 h-9">
        <div className="absolute -left-1 w-2.5 h-4 bg-blue-500 rounded-l-sm -rotate-12 opacity-80" />
        <div className="absolute -right-1 w-2.5 h-4 bg-red-500 rounded-r-sm rotate-12 opacity-80" />
        <div
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          className="relative z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-sm"
        >
          {rank}
        </div>
      </div>
    );
  }

  if (rank <= 10) {
    return (
      <div className="relative flex items-center justify-center w-9 h-9">
        <div className="w-7 h-7 rounded-full bg-[#E69A68] border-2 border-[#B86535] text-[#69300F] flex items-center justify-center font-bold text-xs shadow-xs">
          {rank}
        </div>
      </div>
    );
  }

  return (
    <div className="w-9 text-center font-semibold text-sm text-slate-600 tabular-nums">
      {rank}
    </div>
  );
};

export const ArrowScoreIcon: React.FC<{
  variant?: 'dark' | 'blue' | 'orange';
  size?: number;
}> = ({ variant = 'dark', size = 18 }) => {
  const bg =
    variant === 'blue' ? '#FFFFFF' : variant === 'orange' ? '#FFFFFF' : '#475569';
  const fg =
    variant === 'blue' ? '#2563EB' : variant === 'orange' ? '#D97706' : '#FFFFFF';

  return (
    <span
      style={{ width: size, height: size, backgroundColor: bg }}
      className="inline-flex items-center justify-center rounded-full shrink-0"
    >
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 14 14" fill="none">
        <path
          d="M 3 11 L 11 3 M 11 3 L 5 3 M 11 3 L 11 9"
          stroke={fg}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};
