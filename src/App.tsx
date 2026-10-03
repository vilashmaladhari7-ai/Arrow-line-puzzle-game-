import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Settings,
  Heart,
  Clock,
  Info,
  Home,
  Calendar,
  User,
  ChevronRight,
  Volume2,
  VolumeX,
  Vibrate,
  HelpCircle,
  Shield,
  Sliders,
  Ban,
  Trophy,
  Gamepad2,
  Check,
  Sparkles,
  RotateCcw,
  Infinity as InfinityIcon,
  Flame,
  Package,
} from 'lucide-react';
import {
  ArrowDef,
  LevelDef,
  generateSolvableLevel,
  getBlockingArrowId,
} from './data/levels';
import {
  DAILY_MONTHS,
  getSortedLeaderboard,
} from './data/tournament';
import { ArrowBoard } from './components/ArrowBoard';
import { ConfettiCanvas } from './components/ConfettiCanvas';
import {
  AppMazeLogo,
  BackgroundEmbossedArrows,
  GoldStarCoin,
  TrophyIllustration,
  TournamentMedalsCluster,
  TournamentArrowTrophy,
  RankBadge,
  ArrowScoreIcon,
} from './components/GameArtwork';
import { sound } from './utils/sound';

type ScreenState =
  | 'SPLASH'
  | 'GAME'
  | 'LEVEL_COMPLETED'
  | 'MAIN_TABS'
  | 'AWARDS'
  | 'ACHIEVEMENTS'
  | 'TOURNAMENT';

type MainTab = 'MAIN' | 'DAILY' | 'ME';

export function App() {
  const [screen, setScreen] = useState<ScreenState>('SPLASH');
  const [activeTab, setActiveTab] = useState<MainTab>('MAIN');

  const [currentLevelNum, setCurrentLevelNum] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('arrow_puzzle_level');
      if (saved) return Math.max(1, parseInt(saved, 10));
    } catch {}
    return 1;
  });

  const [tournamentScore, setTournamentScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('arrow_puzzle_score');
      if (saved) return parseInt(saved, 10);
    } catch {}
    return 0;
  });

  const [rankDelta, setRankDelta] = useState<number>(9);
  const [customLevelInput, setCustomLevelInput] = useState<string>('');

  const [activeLevel, setActiveLevel] = useState<LevelDef>(() => generateSolvableLevel(1));
  const [isDailyMode, setIsDailyMode] = useState<boolean>(false);
  const [activeDailyKey, setActiveDailyKey] = useState<string>('2026-10-03');

  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [redArrowIds, setRedArrowIds] = useState<Set<string>>(new Set());
  const [lives, setLives] = useState<number>(3);
  const [lostHeartIndex, setLostHeartIndex] = useState<number | null>(null);
  const [allFlashRed, setAllFlashRed] = useState<boolean>(false);
  const [showOutOfLivesModal, setShowOutOfLivesModal] = useState<boolean>(false);
  const [showPraiseBadge, setShowPraiseBadge] = useState<boolean>(false);
  const [showHardLevelBanner, setShowHardLevelBanner] = useState<boolean>(false);

  // Power-ups
  const [hintsLeft, setHintsLeft] = useState<number>(2);
  const [hintArrowId, setHintArrowId] = useState<string | null>(null);
  const [showRulerGuides, setShowRulerGuides] = useState<boolean>(false);

  // Daily Challenges State
  const [monthIdx, setMonthIdx] = useState<number>(2);
  const [selectedDay, setSelectedDay] = useState<number>(3);
  const [completedDailyDates, setCompletedDailyDates] = useState<Set<string>>(new Set());
  const [hasSeenDailyIntro, setHasSeenDailyIntro] = useState<boolean>(false);
  const [dailyIntroSlide, setDailyIntroSlide] = useState<number | null>(null);

  // Tournament State
  const [hasSeenTournamentIntro, setHasSeenTournamentIntro] = useState<boolean>(false);
  const [tournamentIntroSlide, setTournamentIntroSlide] = useState<number | null>(null);

  // Awards sub-tab
  const [awardsTab, setAwardsTab] = useState<'DAILY' | 'EVENTS'>('DAILY');

  // Settings & Modals
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [infoModalType, setInfoModalType] = useState<
    null | 'HELP' | 'ABOUT' | 'PRIVACY_RIGHTS' | 'PRIVACY_PREFS' | 'REMOVE_ADS'
  >(null);
  const [soundOn, setSoundOn] = useState<boolean>(sound.soundEnabled);
  const [hapticsOn, setHapticsOn] = useState<boolean>(sound.hapticsEnabled);
  const [adsRemoved, setAdsRemoved] = useState<boolean>(false);

  const leaderboardContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (screen === 'SPLASH') {
      const timer = setTimeout(() => {
        startCampaignLevel(currentLevelNum);
      }, 1300);
      return () => clearTimeout(timer);
    }
  }, [screen, currentLevelNum]);

  useEffect(() => {
    try {
      localStorage.setItem('arrow_puzzle_level', String(currentLevelNum));
      localStorage.setItem('arrow_puzzle_score', String(tournamentScore));
    } catch {}
  }, [currentLevelNum, tournamentScore]);

  useEffect(() => {
    if (screen === 'TOURNAMENT' && leaderboardContainerRef.current) {
      const meRow = leaderboardContainerRef.current.querySelector('[data-me-row="true"]');
      if (meRow) {
        meRow.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [screen, tournamentIntroSlide]);

  const startCampaignLevel = (lvlNum: number) => {
    const lvl = generateSolvableLevel(lvlNum, 0);
    setIsDailyMode(false);
    setActiveLevel(lvl);
    setRemovedIds(new Set());
    setRedArrowIds(new Set());
    setLives(3);
    setLostHeartIndex(null);
    setAllFlashRed(false);
    setShowOutOfLivesModal(false);
    setShowPraiseBadge(false);
    setHintArrowId(null);
    setShowRulerGuides(false);
    setScreen('GAME');

    if (lvl.isHardLevel) {
      setShowHardLevelBanner(true);
      setTimeout(() => setShowHardLevelBanner(false), 2400);
    } else {
      setShowHardLevelBanner(false);
    }
  };

  const startDailyChallenge = (monthKey: string, day: number) => {
    const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;
    const seedOffset = day * 31 + monthIdx * 1000;
    const lvl = generateSolvableLevel(5 + (day % 6), seedOffset);
    setIsDailyMode(true);
    setActiveDailyKey(dateKey);
    setActiveLevel(lvl);
    setRemovedIds(new Set());
    setRedArrowIds(new Set());
    setLives(3);
    setLostHeartIndex(null);
    setAllFlashRed(false);
    setShowOutOfLivesModal(false);
    setShowPraiseBadge(false);
    setHintArrowId(null);
    setShowRulerGuides(false);
    setShowHardLevelBanner(false);
    setScreen('GAME');
  };

  const handleTapArrow = (arrow: ArrowDef): 'clear' | 'blocked' | 'ignored' => {
    if (showOutOfLivesModal || showPraiseBadge || removedIds.has(arrow.id)) {
      return 'ignored';
    }

    const remainingArrows = activeLevel.arrows.filter((a) => !removedIds.has(a.id));
    const blockerId = getBlockingArrowId(
      arrow,
      remainingArrows,
      activeLevel.cols,
      activeLevel.rows,
      activeLevel.boxes
    );

    if (blockerId === null) {
      const nextRemoved = new Set(removedIds);
      nextRemoved.add(arrow.id);
      setRemovedIds(nextRemoved);

      if (redArrowIds.has(arrow.id)) {
        const nextRed = new Set(redArrowIds);
        nextRed.delete(arrow.id);
        setRedArrowIds(nextRed);
      }
      if (hintArrowId === arrow.id) {
        setHintArrowId(null);
      }

      sound.playArrowSlide(nextRemoved.size);

      if (nextRemoved.size === activeLevel.arrows.length) {
        // Hard levels award bonus tournament score (+15 points!)
        const pointsEarned = activeLevel.arrows.length + (activeLevel.isHardLevel ? 15 : 0);
        const prevRank = getSortedLeaderboard(tournamentScore).myRank;
        const newScore = tournamentScore + pointsEarned;
        const newRank = getSortedLeaderboard(newScore).myRank;
        const climbed = Math.max(0, prevRank - newRank);

        setTournamentScore(newScore);
        setRankDelta(activeLevel.id === 1 ? 9 : climbed);

        if (isDailyMode) {
          setCompletedDailyDates((prev) => {
            const next = new Set(prev);
            next.add(activeDailyKey);
            return next;
          });
        } else {
          setCurrentLevelNum((prev) => Math.max(prev, activeLevel.id + 1));
        }

        if (activeLevel.id === 1 && !isDailyMode) {
          setTimeout(() => {
            sound.playVictoryFanfare();
            setScreen('LEVEL_COMPLETED');
          }, 380);
        } else {
          setTimeout(() => {
            setShowPraiseBadge(true);
            sound.playPraise();
          }, 260);
          setTimeout(() => {
            setShowPraiseBadge(false);
            sound.playVictoryFanfare();
            setScreen('LEVEL_COMPLETED');
          }, 1250);
        }
      }

      return 'clear';
    } else {
      sound.playArrowBlocked();
      setRedArrowIds((prev) => {
        const next = new Set(prev);
        next.add(arrow.id);
        return next;
      });

      const nextLives = Math.max(0, lives - 1);
      setLostHeartIndex(nextLives);
      setLives(nextLives);

      if (nextLives === 0) {
        setAllFlashRed(true);
        setTimeout(() => {
          setShowOutOfLivesModal(true);
        }, 420);
      }

      return 'blocked';
    }
  };

  const handleUseHint = () => {
    sound.playClick();
    if (hintsLeft <= 0) {
      setHintsLeft(2);
      return;
    }
    const remainingArrows = activeLevel.arrows.filter((a) => !removedIds.has(a.id));
    const unblocked = remainingArrows.find(
      (a) =>
        getBlockingArrowId(
          a,
          remainingArrows,
          activeLevel.cols,
          activeLevel.rows,
          activeLevel.boxes
        ) === null
    );
    if (unblocked) {
      setHintArrowId(unblocked.id);
      setHintsLeft((h) => Math.max(0, h - 1));
    }
  };

  const handleSelectTab = (tab: MainTab) => {
    sound.playClick();
    setActiveTab(tab);
    setScreen('MAIN_TABS');
    if (tab === 'DAILY' && !hasSeenDailyIntro) {
      setHasSeenDailyIntro(true);
      setDailyIntroSlide(0);
    }
  };

  const handleOpenTournament = () => {
    sound.playClick();
    setScreen('TOURNAMENT');
    if (!hasSeenTournamentIntro) {
      setHasSeenTournamentIntro(true);
      setTournamentIntroSlide(0);
    }
  };

  const { list: leaderboardList, myRank } = getSortedLeaderboard(tournamentScore);
  const currentMonth = DAILY_MONTHS[monthIdx];
  const monthCompletedCount = Array.from(completedDailyDates).filter((k) =>
    k.startsWith(currentMonth.key)
  ).length;

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-0 sm:p-4 font-sans antialiased select-none">
      <div className="relative w-full max-w-[420px] h-screen sm:h-[844px] sm:max-h-[94vh] bg-white sm:rounded-[38px] shadow-2xl overflow-hidden flex flex-col border border-slate-200/80">
        {/* 1. SPLASH SCREEN */}
        {screen === 'SPLASH' && (
          <div
            onClick={() => startCampaignLevel(currentLevelNum)}
            className="relative flex-1 bg-white flex flex-col items-center justify-center cursor-pointer"
          >
            <BackgroundEmbossedArrows />
            <div className="relative z-10 animate-bounce">
              <AppMazeLogo size={96} />
            </div>
            <div className="relative z-10 mt-6 flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <InfinityIcon className="w-4 h-4 text-[#1D82F5]" />
              <span>INFINITE LEVELS WITH BOSS BOXES</span>
            </div>
          </div>
        )}

        {/* 2. ACTIVE GAMEPLAY SCREEN */}
        {screen === 'GAME' && (
          <div className="relative flex-1 bg-white flex flex-col justify-between overflow-hidden">
            {allFlashRed && (
              <div
                className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
                style={{
                  boxShadow: 'inset 0 0 65px 18px rgba(239, 68, 68, 0.55)',
                }}
              />
            )}

            {/* Hard Level / Boss Banner Toast (Every 5th level) */}
            {showHardLevelBanner && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
                <div className="bg-gradient-to-r from-red-600 via-amber-600 to-orange-500 text-white font-extrabold text-xs px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-white/30 whitespace-nowrap">
                  <Flame className="w-4 h-4 fill-white" />
                  <span>HARD LEVEL • BOX OBSTACLES AHEAD!</span>
                </div>
              </div>
            )}

            {/* Top Header Bar */}
            <div>
              <div className="h-14 px-4 flex items-center justify-between">
                {activeLevel.id === 1 && !isDailyMode ? (
                  <div className="w-10" />
                ) : (
                  <button
                    onClick={() => {
                      sound.playClick();
                      setScreen('MAIN_TABS');
                    }}
                    className="w-11 h-11 -ml-2 flex items-center justify-center text-[#1D82F5] hover:bg-slate-100 rounded-full transition-colors"
                    aria-label="Back to Main"
                  >
                    <ChevronLeft className="w-7 h-7 stroke-[2.2]" />
                  </button>
                )}

                <h1 className="text-[18px] font-bold text-[#0F172A] tracking-tight flex items-center gap-1.5">
                  {isDailyMode
                    ? `Daily • ${currentMonth.name.slice(0, 3)} ${selectedDay}`
                    : `Level ${activeLevel.id}`}
                  {activeLevel.isHardLevel && (
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-400 animate-pulse" />
                  )}
                </h1>

                {activeLevel.id === 1 && !isDailyMode ? (
                  <div className="w-10" />
                ) : (
                  <button
                    onClick={() => {
                      sound.playClick();
                      setShowSettingsModal(true);
                    }}
                    className="w-11 h-11 -mr-2 flex items-center justify-center text-[#1D82F5] hover:bg-slate-100 rounded-full transition-colors"
                    aria-label="Settings"
                  >
                    <Settings className="w-6 h-6 stroke-[2]" />
                  </button>
                )}
              </div>

              {/* Sub-Header Status Row: Remaining Arrows | 3 Hearts | Difficulty */}
              {(activeLevel.id > 1 || isDailyMode) && (
                <div className="px-4 py-1.5 flex items-center justify-between">
                  <div className="bg-[#F1F5F9] rounded-full px-3 py-1 flex items-center gap-1.5 min-w-[64px]">
                    <ArrowScoreIcon variant="dark" size={18} />
                    <span className="text-sm font-bold text-slate-700 tabular-nums">
                      {Math.max(0, activeLevel.arrows.length - removedIds.size)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map((idx) => {
                      const isAlive = idx < lives;
                      const isJustLost = lostHeartIndex === idx && !isAlive;
                      return (
                        <div
                          key={idx}
                          className={`transition-transform duration-300 ${
                            isJustLost ? 'scale-125' : 'scale-100'
                          }`}
                        >
                          <Heart
                            className={`w-7 h-7 transition-colors duration-200 ${
                              isAlive
                                ? 'fill-[#EE3A3A] text-[#EE3A3A]'
                                : 'fill-[#E2E8F0] text-[#E2E8F0]'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Difficulty Badge (Stylized Flame Pill on every 5th Hard level!) */}
                  {activeLevel.isHardLevel ? (
                    <div className="bg-gradient-to-r from-red-500 to-amber-500 text-white rounded-full px-3 py-1 text-xs font-extrabold flex items-center gap-1 shadow-xs animate-pulse">
                      <Flame className="w-3.5 h-3.5 fill-white" />
                      <span>HARD</span>
                    </div>
                  ) : (
                    <div className="bg-[#F1F5F9] rounded-full px-3.5 py-1 text-xs font-semibold text-slate-500">
                      {activeLevel.difficulty}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Center Interactive Puzzle Grid (with Box Obstacles on every 5th level) */}
            <div className="relative flex-1 flex items-center justify-center px-4">
              <ArrowBoard
                levelId={activeLevel.id}
                cols={activeLevel.cols}
                rows={activeLevel.rows}
                arrows={activeLevel.arrows}
                boxes={activeLevel.boxes}
                removedIds={removedIds}
                redArrowIds={redArrowIds}
                allFlashRed={allFlashRed}
                hintArrowId={hintArrowId}
                showRulerGuides={showRulerGuides}
                onTapArrow={handleTapArrow}
              />

              {showPraiseBadge && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="flex flex-col items-center animate-bounce">
                    <div className="text-5xl mb-2 drop-shadow-md">
                      {activeLevel.praiseEmoji}
                    </div>
                    <div className="bg-white px-5 py-2 rounded-2xl shadow-[0_8px_30px_rgba(0,115,255,0.22)] border border-blue-50">
                      <span className="text-[19px] font-extrabold text-[#1D82F5] whitespace-nowrap">
                        {activeLevel.praiseText}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Power-Up Controls */}
            {(activeLevel.id > 1 || isDailyMode) ? (
              <div className="pb-10 pt-2 flex items-center justify-center gap-12">
                <button
                  onClick={handleUseHint}
                  className="relative w-16 h-16 rounded-full bg-white shadow-[0_6px_24px_rgba(148,163,184,0.32)] border border-slate-100 flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="Use Hint"
                >
                  <span className="text-2xl">💡</span>
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#1D82F5] text-white text-xs font-bold flex items-center justify-center border-2 border-white tabular-nums">
                    {hintsLeft > 0 ? hintsLeft : '+'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setShowRulerGuides((prev) => !prev);
                  }}
                  className={`relative w-16 h-16 rounded-full shadow-[0_6px_24px_rgba(148,163,184,0.32)] border flex items-center justify-center active:scale-95 transition-all ${
                    showRulerGuides
                      ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-400/40'
                      : 'bg-white border-slate-100'
                  }`}
                  aria-label="Toggle Ruler Guides"
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <g transform="rotate(-35 14 14)">
                      <rect
                        x="4"
                        y="9"
                        width="20"
                        height="10"
                        rx="2.5"
                        fill="#818CF8"
                        stroke="#4F46E5"
                        strokeWidth="1.8"
                      />
                      <line x1="8" y1="9" x2="8" y2="13" stroke="white" strokeWidth="1.6" />
                      <line x1="12" y1="9" x2="12" y2="15" stroke="white" strokeWidth="1.6" />
                      <line x1="16" y1="9" x2="16" y2="13" stroke="white" strokeWidth="1.6" />
                      <line x1="20" y1="9" x2="20" y2="15" stroke="white" strokeWidth="1.6" />
                    </g>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="h-20" />
            )}

            {/* Out of Lives Modal */}
            {showOutOfLivesModal && (
              <div className="absolute inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-6">
                <div className="w-full max-w-[330px] bg-white rounded-[28px] p-6 flex flex-col items-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <h2 className="text-[22px] font-bold text-slate-900 mb-5">
                    Out of Lives!
                  </h2>

                  <div className="relative w-28 h-28 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-7">
                    <Heart className="w-14 h-14 fill-[#EE3A3A] text-[#EE3A3A] drop-shadow-xs" />
                    <span className="absolute top-1 right-1 px-2.5 py-1 rounded-full bg-[#1D82F5] text-white text-xs font-bold shadow-sm">
                      +1
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setLives(1);
                      setAllFlashRed(false);
                      setShowOutOfLivesModal(false);
                    }}
                    className="w-full h-12 rounded-full bg-[#1D82F5] hover:bg-[#166FD8] text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all mb-3"
                  >
                    <span>Get More Lives</span>
                    <span className="inline-flex items-center justify-center w-5 h-4 bg-white/20 rounded text-[10px]">
                      ▶
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setRemovedIds(new Set());
                      setRedArrowIds(new Set());
                      setLives(3);
                      setLostHeartIndex(null);
                      setAllFlashRed(false);
                      setShowOutOfLivesModal(false);
                    }}
                    className="w-full py-2.5 text-[15px] font-bold text-[#1D82F5] hover:text-blue-700 transition-colors"
                  >
                    Restart Game
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. LEVEL COMPLETED SCREEN */}
        {screen === 'LEVEL_COMPLETED' && (
          <div className="relative flex-1 sunburst-blue flex flex-col items-center justify-between py-10 px-6 overflow-hidden text-white">
            <div className="absolute inset-[-50%] sunburst-rays-blue pointer-events-none z-0" />
            <ConfettiCanvas />

            <div className="relative z-10 mt-2 text-center">
              {activeLevel.isHardLevel && (
                <div className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-950 font-black text-xs px-3 py-1 rounded-full mb-1 shadow-md">
                  <Flame className="w-3.5 h-3.5 fill-amber-950" />
                  <span>HARD LEVEL CLEARED • +15 BONUS SCORE!</span>
                </div>
              )}
              <h1 className="text-[30px] font-extrabold tracking-tight drop-shadow-xs">
                Level Completed!
              </h1>
            </div>

            <div className="relative z-10 w-full flex flex-col items-center my-auto">
              <div className="bg-white rounded-[26px] shadow-xl p-3 flex items-center justify-center mb-6">
                <ArrowBoard
                  levelId={activeLevel.id}
                  cols={activeLevel.cols}
                  rows={activeLevel.rows}
                  arrows={activeLevel.arrows}
                  boxes={activeLevel.boxes}
                  removedIds={new Set()}
                  redArrowIds={new Set()}
                  allFlashRed={false}
                  hintArrowId={null}
                  showRulerGuides={false}
                  isPreviewCard={true}
                />
              </div>

              {activeLevel.id !== 2 && (
                <div className="w-full max-w-[330px]">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      <span>9d 09h</span>
                    </div>
                    <button
                      onClick={handleOpenTournament}
                      className="bg-white text-[#1D82F5] font-bold text-xs px-4 py-1.5 rounded-full shadow-xs hover:bg-blue-50 active:scale-95 transition-all"
                    >
                      See All
                    </button>
                  </div>

                  <div className="bg-white/20 backdrop-blur-md rounded-2xl overflow-hidden border border-white/25 divide-y divide-white/15">
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-white/95">Position</span>
                      <div className="flex items-center gap-2">
                        {rankDelta > 0 && (
                          <span className="bg-[#22C55E] text-white text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            ▲{rankDelta}
                          </span>
                        )}
                        <span className="text-[15px] font-bold tabular-nums">{myRank}</span>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-white/95">Total Score</span>
                      <div className="flex items-center gap-1.5">
                        <ArrowScoreIcon variant="blue" size={18} />
                        <span className="text-[15px] font-bold tabular-nums">
                          {tournamentScore}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative z-10 w-full max-w-[320px] flex flex-col items-center gap-3">
              <button
                onClick={() => {
                  sound.playClick();
                  if (isDailyMode) {
                    setActiveTab('DAILY');
                    setScreen('MAIN_TABS');
                  } else {
                    startCampaignLevel(currentLevelNum);
                  }
                }}
                className="w-full py-2.5 rounded-full bg-white text-[#1D82F5] shadow-lg flex flex-col items-center justify-center active:scale-[0.98] transition-transform"
              >
                <span className="text-[16px] font-extrabold leading-tight flex items-center gap-1.5">
                  <span>{isDailyMode ? 'Back to Calendar' : 'Next Game'}</span>
                  {currentLevelNum % 5 === 0 && !isDailyMode && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                      🔥 Hard
                    </span>
                  )}
                </span>
                <span className="text-xs font-semibold text-slate-400 leading-tight mt-0.5">
                  {isDailyMode ? 'Daily Completed' : `Level ${currentLevelNum}`}
                </span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('MAIN');
                  setScreen('MAIN_TABS');
                }}
                className="py-1.5 px-6 text-[15px] font-bold text-white/95 hover:text-white transition-colors"
              >
                Main
              </button>
            </div>
          </div>
        )}

        {/* 4. MAIN TABS VIEW */}
        {screen === 'MAIN_TABS' && (
          <div className="relative flex-1 flex flex-col justify-between overflow-hidden bg-white">
            {activeTab === 'MAIN' && (
              <div className="relative flex-1 flex flex-col items-center justify-between pt-8 pb-6 px-5 overflow-y-auto">
                <BackgroundEmbossedArrows />

                {/* Top Dual Cards */}
                <div className="relative z-10 w-full grid grid-cols-2 gap-3.5 mt-2">
                  <div
                    onClick={() => handleSelectTab('DAILY')}
                    className="cursor-pointer rounded-[22px] p-4 text-white flex flex-col items-center justify-between min-h-[196px] shadow-[0_10px_25px_rgba(29,130,245,0.28)] active:scale-[0.98] transition-transform"
                    style={{
                      background: 'linear-gradient(180deg, #4DA6FF 0%, #1D7BF2 100%)',
                    }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/95 flex items-center justify-center shadow-xs mt-1">
                      <div className="w-7 h-7 rounded-md bg-amber-400 flex items-center justify-center text-white font-bold text-sm">
                        ★
                      </div>
                    </div>

                    <div className="text-center my-2">
                      <div className="text-[10px] font-bold tracking-wider uppercase text-white/80 mb-0.5">
                        DAILY CHALLENGE
                      </div>
                      <div className="text-[16px] font-bold text-white">
                        October 3
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playClick();
                        startDailyChallenge('2026-10', 3);
                      }}
                      className="bg-white text-[#1D82F5] font-bold text-xs px-6 py-2 rounded-full shadow-xs hover:bg-blue-50 transition-colors"
                    >
                      Play
                    </button>
                  </div>

                  <div
                    onClick={handleOpenTournament}
                    className="relative cursor-pointer rounded-[22px] p-4 text-white flex flex-col items-center justify-between min-h-[196px] shadow-[0_10px_25px_rgba(217,115,48,0.28)] active:scale-[0.98] transition-transform"
                    style={{
                      background: 'linear-gradient(180deg, #E89A5E 0%, #D6712E 100%)',
                    }}
                  >
                    <div className="self-end bg-black/15 rounded-full px-2 py-0.5 flex items-center gap-1 text-[10px] font-semibold">
                      <Clock className="w-3 h-3 text-amber-200" />
                      <span>9d 09h</span>
                    </div>

                    <div className="flex items-end gap-0.5 h-9 mt-0.5">
                      <div className="w-3.5 h-5 bg-amber-300 rounded-t-xs flex items-center justify-center text-[9px] font-extrabold text-amber-900">
                        2
                      </div>
                      <div className="w-4 h-7 bg-yellow-300 rounded-t-xs flex flex-col items-center justify-center text-[10px] font-extrabold text-amber-900">
                        <span className="text-[7px] -mb-0.5">★</span>1
                      </div>
                      <div className="w-3.5 h-4 bg-amber-400 rounded-t-xs flex items-center justify-center text-[9px] font-extrabold text-amber-900">
                        3
                      </div>
                    </div>

                    <div className="text-center my-1">
                      <div className="text-[10px] font-bold tracking-wider uppercase text-white/85 mb-1">
                        TOURNAMENT
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <ArrowScoreIcon variant="orange" size={18} />
                        <span className="text-[16px] font-extrabold tabular-nums">
                          {tournamentScore}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTournament();
                      }}
                      className="bg-white text-[#D6712E] font-bold text-xs px-6 py-2 rounded-full shadow-xs hover:bg-amber-50 transition-colors"
                    >
                      Play
                    </button>
                  </div>
                </div>

                {/* Brand Title */}
                <div className="relative z-10 my-auto py-8 text-center">
                  <h1 className="text-[36px] font-extrabold text-[#0B1933] tracking-tight">
                    Arrow Puzzle
                  </h1>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-amber-600" />
                      Boss Boxes Every 5 Levels
                    </span>
                  </div>
                </div>

                {/* Bottom Primary CTA */}
                <div className="relative z-10 w-full max-w-[330px] mb-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      startCampaignLevel(currentLevelNum);
                    }}
                    className={`w-full py-3 rounded-full text-white shadow-lg flex flex-col items-center justify-center active:scale-[0.98] transition-all ${
                      currentLevelNum % 5 === 0
                        ? 'bg-gradient-to-r from-red-600 via-amber-600 to-orange-500 shadow-orange-500/30'
                        : 'bg-[#1D82F5] hover:bg-[#166FD8] shadow-blue-500/25'
                    }`}
                  >
                    <span className="text-[16px] font-bold leading-tight flex items-center gap-1.5">
                      <span>New Game</span>
                      {currentLevelNum % 5 === 0 && (
                        <Flame className="w-4 h-4 fill-white animate-pulse" />
                      )}
                    </span>
                    <span className="text-xs font-medium text-white/90 leading-tight mt-0.5">
                      Level {currentLevelNum} {currentLevelNum % 5 === 0 ? '(🔥 Hard Boss Box)' : ''}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: DAILY CHALLENGES */}
            {activeTab === 'DAILY' && (
              <div className="relative flex-1 flex flex-col justify-between bg-white overflow-y-auto">
                <div
                  className="relative pt-4 pb-6 px-4 flex flex-col items-center text-white overflow-hidden"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 65%, #68B8FF 0%, #1D82F5 70%, #0E64D2 100%)',
                  }}
                >
                  <div className="absolute top-6 left-10 w-16 h-16 rounded-full bg-white/10 blur-xs pointer-events-none" />
                  <div className="absolute bottom-4 right-12 w-24 h-24 rounded-full bg-white/10 blur-xs pointer-events-none" />

                  <h2 className="relative z-10 text-[17px] font-bold mb-4">
                    Daily Challenges
                  </h2>

                  <div className="relative z-10 w-full flex items-center justify-between px-2">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setMonthIdx((i) => Math.max(0, i - 1));
                        setSelectedDay(1);
                      }}
                      disabled={monthIdx === 0}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-opacity ${
                        monthIdx === 0 ? 'opacity-25' : 'hover:bg-white/15'
                      }`}
                      aria-label="Previous Month"
                    >
                      <ChevronLeft className="w-7 h-7" />
                    </button>

                    <div className="my-1">
                      <TrophyIllustration
                        variant={
                          monthCompletedCount >= currentMonth.daysInMonth
                            ? 'gold'
                            : 'silhouette'
                        }
                        size={112}
                      />
                    </div>

                    <button
                      onClick={() => {
                        sound.playClick();
                        setMonthIdx((i) => Math.min(DAILY_MONTHS.length - 1, i + 1));
                        setSelectedDay(3);
                      }}
                      disabled={monthIdx === DAILY_MONTHS.length - 1}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-opacity ${
                        monthIdx === DAILY_MONTHS.length - 1
                          ? 'opacity-25'
                          : 'hover:bg-white/15'
                      }`}
                      aria-label="Next Month"
                    >
                      <ChevronRight className="w-7 h-7" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 px-6 pt-5 pb-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-[19px] font-extrabold text-slate-900">
                        {currentMonth.name} {currentMonth.year}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold">
                          ★
                        </span>
                        <span className="text-[15px] font-bold text-slate-800 tabular-nums">
                          {monthCompletedCount}/{currentMonth.daysInMonth}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 mb-3">
                      <span>S</span>
                      <span>M</span>
                      <span>T</span>
                      <span>W</span>
                      <span>T</span>
                      <span>F</span>
                      <span>S</span>
                    </div>

                    <div className="grid grid-cols-7 gap-y-2 text-center">
                      {Array.from({ length: currentMonth.firstDayOfWeek }).map((_, i) => (
                        <div key={`empty_${i}`} className="h-10" />
                      ))}
                      {Array.from({ length: currentMonth.daysInMonth }).map((_, idx) => {
                        const day = idx + 1;
                        const dateKey = `${currentMonth.key}-${String(day).padStart(2, '0')}`;
                        const isCompleted = completedDailyDates.has(dateKey);
                        const isSelected = selectedDay === day;
                        const isUnlocked =
                          currentMonth.key !== '2026-10' || day <= 3 || isCompleted;

                        return (
                          <div
                            key={day}
                            className="flex items-center justify-center h-10"
                          >
                            <button
                              onClick={() => {
                                sound.playClick();
                                setSelectedDay(day);
                              }}
                              className={`relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all tabular-nums ${
                                isSelected
                                  ? 'bg-[#1D82F5] text-white shadow-md shadow-blue-500/25'
                                  : isCompleted
                                  ? 'bg-amber-100 text-amber-800'
                                  : isUnlocked
                                  ? 'text-slate-800 hover:bg-slate-100'
                                  : 'text-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {day}
                              {isCompleted && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] flex items-center justify-center shadow-2xs">
                                  ★
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => {
                        sound.playClick();
                        startDailyChallenge(currentMonth.key, selectedDay);
                      }}
                      className="w-full h-12 rounded-full bg-[#1D82F5] hover:bg-[#166FD8] text-white font-bold text-[16px] shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
                    >
                      Play
                    </button>
                  </div>
                </div>

                {dailyIntroSlide !== null && (
                  <div className="absolute inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-6">
                    <div className="w-full max-w-[330px] bg-white rounded-[28px] p-6 flex flex-col items-center text-center shadow-2xl">
                      <h3 className="text-[20px] font-extrabold text-slate-900 mb-5">
                        Welcome to Daily Challenges
                      </h3>

                      <div className="w-36 h-36 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-5">
                        {dailyIntroSlide === 0 ? (
                          <GoldStarCoin size={116} />
                        ) : (
                          <TrophyIllustration variant="gold" size={116} />
                        )}
                      </div>

                      <p className="text-sm text-slate-500 leading-relaxed px-2 mb-5">
                        {dailyIntroSlide === 0
                          ? 'Complete daily challenges every day and win gold stars!'
                          : 'Collect all stars for a given month and win a unique monthly trophy!'}
                      </p>

                      <div className="flex items-center gap-2 mb-5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dailyIntroSlide === 0 ? 'bg-[#1D82F5]' : 'bg-slate-200'
                          }`}
                        />
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dailyIntroSlide === 1 ? 'bg-[#1D82F5]' : 'bg-slate-200'
                          }`}
                        />
                      </div>

                      <button
                        onClick={() => {
                          sound.playClick();
                          if (dailyIntroSlide === 0) {
                            setDailyIntroSlide(1);
                          } else {
                            setDailyIntroSlide(null);
                          }
                        }}
                        className="w-full h-12 rounded-full bg-[#1D82F5] hover:bg-[#166FD8] text-white font-bold text-[15px] shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
                      >
                        {dailyIntroSlide === 0 ? 'Continue' : 'OK'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: "ME" PROFILE & SETTINGS */}
            {activeTab === 'ME' && (
              <div className="flex-1 bg-[#F2F4F8] flex flex-col overflow-y-auto">
                <div className="bg-white py-3.5 px-4 text-center border-b border-slate-100">
                  <h2 className="text-[17px] font-bold text-slate-900">Me</h2>
                </div>

                <div className="p-4 space-y-3.5">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setScreen('AWARDS');
                    }}
                    className="w-full bg-white rounded-2xl p-4 flex items-center justify-between shadow-2xs hover:bg-slate-50/80 active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-amber-500 fill-amber-400" />
                      </div>
                      <span className="text-[17px] font-semibold text-slate-900">
                        Awards
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setScreen('ACHIEVEMENTS');
                    }}
                    className="w-full bg-white rounded-2xl p-4 flex items-center justify-between shadow-2xs hover:bg-slate-50/80 active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-lime-600" />
                      </div>
                      <span className="text-[17px] font-semibold text-slate-900">
                        Achievements
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setShowSettingsModal(true);
                    }}
                    className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-2xs hover:bg-slate-50/80 active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-[#3898FF] text-white flex items-center justify-center">
                        <Settings className="w-5 h-5" />
                      </div>
                      <span className="text-[15px] font-medium text-slate-900">
                        Settings
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </button>

                  <div className="bg-white rounded-2xl shadow-2xs divide-y divide-slate-100 overflow-hidden">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setInfoModalType('HELP');
                      }}
                      className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-[#34D399] text-white flex items-center justify-center">
                          <HelpCircle className="w-5 h-5" />
                        </div>
                        <span className="text-[15px] font-medium text-slate-900">
                          Help
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>

                    <button
                      onClick={() => {
                        sound.playClick();
                        setInfoModalType('ABOUT');
                      }}
                      className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-[#3898FF] text-white flex items-center justify-center">
                          <Info className="w-5 h-5" />
                        </div>
                        <span className="text-[15px] font-medium text-slate-900">
                          About Game
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>

                    <button
                      onClick={() => {
                        sound.playClick();
                        setInfoModalType('PRIVACY_RIGHTS');
                      }}
                      className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-[#6366F1] text-white flex items-center justify-center">
                          <Shield className="w-5 h-5" />
                        </div>
                        <span className="text-[15px] font-medium text-slate-900">
                          Privacy Rights
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>

                    <button
                      onClick={() => {
                        sound.playClick();
                        setInfoModalType('PRIVACY_PREFS');
                      }}
                      className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-[#34D399] text-white flex items-center justify-center">
                          <Sliders className="w-5 h-5" />
                        </div>
                        <span className="text-[15px] font-medium text-slate-900">
                          Privacy Preferences
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setInfoModalType('REMOVE_ADS');
                    }}
                    className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-2xs hover:bg-slate-50/80 active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-[#F43F5E] text-white flex items-center justify-center">
                        <Ban className="w-5 h-5" />
                      </div>
                      <span className="text-[15px] font-medium text-slate-900">
                        {adsRemoved ? 'Ad-Free Enabled' : 'Remove Ads'}
                      </span>
                    </div>
                    {adsRemoved && <Check className="w-5 h-5 text-emerald-500" />}
                  </button>
                </div>
              </div>
            )}

            {/* Bottom 3-Tab Navigation Bar */}
            <nav className="h-16 bg-white border-t border-slate-200 grid grid-cols-3 items-center shrink-0 z-20">
              <button
                onClick={() => handleSelectTab('MAIN')}
                className={`flex flex-col items-center justify-center h-full transition-colors ${
                  activeTab === 'MAIN' ? 'text-[#1D82F5]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="text-[11px] font-semibold mt-1">Main</span>
              </button>

              <button
                onClick={() => handleSelectTab('DAILY')}
                className={`flex flex-col items-center justify-center h-full transition-colors ${
                  activeTab === 'DAILY' ? 'text-[#1D82F5]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[11px] font-semibold mt-1">Daily</span>
              </button>

              <button
                onClick={() => handleSelectTab('ME')}
                className={`flex flex-col items-center justify-center h-full transition-colors ${
                  activeTab === 'ME' ? 'text-[#1D82F5]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-[11px] font-semibold mt-1">Me</span>
              </button>
            </nav>
          </div>
        )}

        {/* 5. AWARDS SCREEN */}
        {screen === 'AWARDS' && (
          <div className="flex-1 bg-white flex flex-col justify-between overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="h-14 px-4 flex items-center justify-between">
                <button
                  onClick={() => {
                    sound.playClick();
                    setScreen('MAIN_TABS');
                  }}
                  className="w-10 h-10 -ml-2 flex items-center justify-center text-[#1D82F5] rounded-full hover:bg-slate-100"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <h2 className="text-[17px] font-bold text-slate-900">Awards</h2>
                <div className="w-10" />
              </div>

              <div className="px-4 mt-1 mb-6">
                <div className="bg-[#F1F5F9] p-1 rounded-full grid grid-cols-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setAwardsTab('DAILY');
                    }}
                    className={`py-1.5 rounded-full text-xs font-bold transition-all ${
                      awardsTab === 'DAILY'
                        ? 'bg-[#1D82F5] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setAwardsTab('EVENTS');
                    }}
                    className={`py-1.5 rounded-full text-xs font-bold transition-all ${
                      awardsTab === 'EVENTS'
                        ? 'bg-[#1D82F5] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Events
                  </button>
                </div>
              </div>

              {awardsTab === 'DAILY' ? (
                <div className="px-5">
                  <h3 className="text-[22px] font-extrabold text-slate-900 mb-5">
                    2026
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {[...DAILY_MONTHS].reverse().map((m) => {
                      const count = Array.from(completedDailyDates).filter((k) =>
                        k.startsWith(m.key)
                      ).length;
                      return (
                        <div
                          key={m.key}
                          onClick={() => {
                            sound.playClick();
                            const idx = DAILY_MONTHS.findIndex((x) => x.key === m.key);
                            if (idx >= 0) setMonthIdx(idx);
                            setActiveTab('DAILY');
                            setScreen('MAIN_TABS');
                          }}
                          className="cursor-pointer flex flex-col items-center group"
                        >
                          <div className="mb-2 group-hover:scale-105 transition-transform">
                            <TrophyIllustration
                              variant={count >= m.daysInMonth ? 'gold' : 'silver'}
                              size={88}
                            />
                          </div>
                          <div className="text-xs font-bold text-slate-800">
                            {m.name}
                          </div>
                          <div className="text-[11px] font-medium text-slate-400 tabular-nums mt-0.5">
                            {count} of {m.daysInMonth}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="px-5">
                  <h3 className="text-[22px] font-extrabold text-slate-900 mb-5">
                    Tournament Medals
                  </h3>
                  <div className="bg-slate-50 rounded-2xl p-6 flex flex-col items-center text-center border border-slate-100">
                    <TournamentMedalsCluster scale={0.95} />
                    <p className="text-sm font-bold text-slate-800 mt-3">
                      October 2026 League
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Current Rank #{myRank} • Score: {tournamentScore} pts
                    </p>
                  </div>
                </div>
              )}
            </div>

            <nav className="h-16 bg-white border-t border-slate-200 grid grid-cols-3 items-center shrink-0">
              <button
                onClick={() => handleSelectTab('MAIN')}
                className="flex flex-col items-center justify-center h-full text-slate-400"
              >
                <Home className="w-5 h-5" />
                <span className="text-[11px] font-semibold mt-1">Main</span>
              </button>
              <button
                onClick={() => handleSelectTab('DAILY')}
                className="flex flex-col items-center justify-center h-full text-slate-400"
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[11px] font-semibold mt-1">Daily</span>
              </button>
              <button
                onClick={() => handleSelectTab('ME')}
                className="flex flex-col items-center justify-center h-full text-[#1D82F5]"
              >
                <User className="w-5 h-5" />
                <span className="text-[11px] font-semibold mt-1">Me</span>
              </button>
            </nav>
          </div>
        )}

        {/* 6. ACHIEVEMENTS SCREEN */}
        {screen === 'ACHIEVEMENTS' && (
          <div className="flex-1 bg-[#F2F4F8] flex flex-col overflow-hidden">
            <div className="h-14 bg-white px-4 flex items-center justify-between border-b border-slate-100">
              <button
                onClick={() => {
                  sound.playClick();
                  setScreen('MAIN_TABS');
                }}
                className="w-10 h-10 -ml-2 flex items-center justify-center text-[#1D82F5] rounded-full hover:bg-slate-100"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <h2 className="text-[17px] font-bold text-slate-900">Achievements</h2>
              <div className="w-10" />
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {[
                {
                  title: 'First Untangle',
                  desc: 'Complete Level 1',
                  progress: Math.min(1, currentLevelNum - 1),
                  goal: 1,
                },
                {
                  title: 'Box Breaker',
                  desc: 'Defeat your first Box Obstacle on Level 5',
                  progress: currentLevelNum > 5 ? 1 : 0,
                  goal: 1,
                },
                {
                  title: 'Boss Vanquisher',
                  desc: 'Conquer 5 Hard Box Levels (Level 25+)',
                  progress: Math.min(5, Math.floor((currentLevelNum - 1) / 5)),
                  goal: 5,
                },
                {
                  title: 'Arrow Collector',
                  desc: 'Clear 50 arrows across levels',
                  progress: Math.min(50, tournamentScore),
                  goal: 50,
                },
                {
                  title: 'Daily Challenger',
                  desc: 'Complete 3 Daily Challenge puzzles',
                  progress: Math.min(3, completedDailyDates.size),
                  goal: 3,
                },
              ].map((ach) => {
                const done = ach.progress >= ach.goal;
                const pct = Math.min(100, Math.round((ach.progress / ach.goal) * 100));
                return (
                  <div
                    key={ach.title}
                    className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-2xs"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        done
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {ach.title}
                        </h4>
                        <span className="text-xs font-bold text-slate-500 tabular-nums">
                          {ach.progress}/{ach.goal}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 mb-2">{ach.desc}</p>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            done ? 'bg-emerald-500' : 'bg-[#1D82F5]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. TOURNAMENT LEADERBOARD */}
        {screen === 'TOURNAMENT' && (
          <div className="relative flex-1 bg-white flex flex-col justify-between overflow-hidden">
            <div className="relative sunburst-orange pt-3 pb-4 px-4 flex flex-col items-center text-white overflow-hidden shrink-0">
              <div className="absolute inset-[-50%] sunburst-rays-orange pointer-events-none z-0" />

              <div className="relative z-10 w-full flex items-center justify-between mb-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    setScreen('MAIN_TABS');
                  }}
                  className="w-10 h-10 -ml-2 flex items-center justify-center text-white hover:bg-white/15 rounded-full"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>

                <h2 className="text-[18px] font-bold">Tournament</h2>

                <button
                  onClick={() => {
                    sound.playClick();
                    setTournamentIntroSlide(0);
                  }}
                  className="w-10 h-10 -mr-2 flex items-center justify-center text-white hover:bg-white/15 rounded-full"
                  aria-label="How Does It Work"
                >
                  <Info className="w-6 h-6" />
                </button>
              </div>

              <div className="relative z-10 bg-black/20 rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-semibold mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-200" />
                <span>9d 09h</span>
              </div>

              <div className="relative z-10 -my-1">
                <TournamentMedalsCluster scale={0.95} />
              </div>
            </div>

            <div
              ref={leaderboardContainerRef}
              className="flex-1 overflow-y-auto px-3 py-2 divide-y divide-slate-100"
            >
              {leaderboardList.map((entry) => (
                <div
                  key={entry.id}
                  data-me-row={entry.isMe ? 'true' : undefined}
                  className={`flex items-center justify-between px-3 py-3 transition-colors ${
                    entry.isMe
                      ? 'bg-[#E8F1FE] rounded-xl border border-blue-200/70 font-bold'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <RankBadge rank={entry.rank} />
                    <span
                      className={`text-[15px] truncate ${
                        entry.isMe
                          ? 'font-extrabold text-slate-900'
                          : 'font-semibold text-slate-800'
                      }`}
                    >
                      {entry.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <ArrowScoreIcon variant="dark" size={17} />
                    <span className="text-[15px] font-bold text-slate-800 tabular-nums min-w-[34px] text-right">
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <button
                onClick={() => {
                  sound.playClick();
                  startCampaignLevel(currentLevelNum);
                }}
                className="w-full h-12 rounded-full bg-[#1D82F5] hover:bg-[#166FD8] text-white font-bold text-[16px] shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
              >
                Play
              </button>
            </div>

            {tournamentIntroSlide !== null && (
              <div className="absolute inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-6">
                <div className="w-full max-w-[330px] bg-white rounded-[28px] p-6 flex flex-col items-center text-center shadow-2xl">
                  <h3 className="text-[20px] font-extrabold text-slate-900 mb-5">
                    How Does It Work?
                  </h3>

                  <div className="w-40 h-40 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-5 overflow-visible">
                    {tournamentIntroSlide === 0 ? (
                      <TournamentMedalsCluster scale={0.85} />
                    ) : (
                      <TournamentArrowTrophy size={118} />
                    )}
                  </div>

                  <p className="text-sm text-slate-500 leading-relaxed px-2 mb-5">
                    {tournamentIntroSlide === 0
                      ? 'Participate in the tournament and win a unique reward!'
                      : 'Complete levels and get as many points as possible! Hard levels award bonus scores!'}
                  </p>

                  <div className="flex items-center gap-2 mb-5">
                    {[0, 1].map((dot) => (
                      <span
                        key={dot}
                        className={`w-2 h-2 rounded-full ${
                          tournamentIntroSlide === dot
                            ? 'bg-[#1D82F5]'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      if (tournamentIntroSlide === 0) {
                        setTournamentIntroSlide(1);
                      } else {
                        setTournamentIntroSlide(null);
                      }
                    }}
                    className="w-full h-12 rounded-full bg-[#1D82F5] hover:bg-[#166FD8] text-white font-bold text-[15px] shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 8. SETTINGS MODAL: Sound, Haptics & HARD LEVEL SELECTOR */}
        {showSettingsModal && (
          <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-6">
            <div className="w-full max-w-[340px] bg-white rounded-[28px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[20px] font-extrabold text-slate-900">
                  Settings
                </h3>
                <button
                  onClick={() => {
                    sound.playClick();
                    setShowSettingsModal(false);
                  }}
                  className="text-sm font-bold text-[#1D82F5] px-2 py-1"
                >
                  Done
                </button>
              </div>

              <div className="space-y-4">
                {/* Sound Effects */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    {soundOn ? (
                      <Volume2 className="w-5 h-5 text-[#1D82F5]" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-slate-400" />
                    )}
                    <span className="text-[15px] font-semibold text-slate-800">
                      Sound Effects
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const next = !soundOn;
                      setSoundOn(next);
                      sound.setSoundEnabled(next);
                      if (next) sound.playClick();
                    }}
                    className={`w-12 h-7 rounded-full p-1 transition-colors ${
                      soundOn ? 'bg-[#1D82F5]' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                        soundOn ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Haptics */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <Vibrate
                      className={`w-5 h-5 ${
                        hapticsOn ? 'text-[#1D82F5]' : 'text-slate-400'
                      }`}
                    />
                    <span className="text-[15px] font-semibold text-slate-800">
                      Vibration
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const next = !hapticsOn;
                      setHapticsOn(next);
                      sound.setHapticsEnabled(next);
                      sound.playClick();
                    }}
                    className={`w-12 h-7 rounded-full p-1 transition-colors ${
                      hapticsOn ? 'bg-[#1D82F5]' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                        hapticsOn ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* HARD LEVEL JUMP (Every 5th level highlighted) */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      Select Level (🔥 = Box Hard)
                    </span>
                    <span className="text-xs font-bold text-[#1D82F5] tabular-nums">
                      Max: ∞
                    </span>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const num = parseInt(customLevelInput, 10);
                      if (!isNaN(num) && num > 0) {
                        sound.playClick();
                        setCurrentLevelNum(num);
                        setShowSettingsModal(false);
                        startCampaignLevel(num);
                      }
                    }}
                    className="flex gap-2 mb-3"
                  >
                    <input
                      type="number"
                      min={1}
                      placeholder="Enter level (e.g. 5, 10, 15...)"
                      value={customLevelInput}
                      onChange={(e) => setCustomLevelInput(e.target.value)}
                      className="flex-1 bg-slate-100 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#1D82F5]"
                    />
                    <button
                      type="submit"
                      className="bg-[#1D82F5] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95"
                    >
                      Jump
                    </button>
                  </form>

                  <div className="grid grid-cols-5 gap-1.5 mb-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 50, 100].map((lvl) => {
                      const isHard = lvl % 5 === 0;
                      return (
                        <button
                          key={lvl}
                          onClick={() => {
                            sound.playClick();
                            setCurrentLevelNum(lvl);
                            setShowSettingsModal(false);
                            startCampaignLevel(lvl);
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-0.5 ${
                            activeLevel.id === lvl && !isDailyMode
                              ? 'bg-[#1D82F5] text-white ring-2 ring-blue-300'
                              : isHard
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isHard && <Flame className="w-2.5 h-2.5 text-red-500 fill-red-400" />}
                          <span>{lvl}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {screen === 'GAME' && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      setShowSettingsModal(false);
                      setRemovedIds(new Set());
                      setRedArrowIds(new Set());
                      setLives(3);
                      setAllFlashRed(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restart Current Level</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info & Help Modals */}
        {infoModalType !== null && (
          <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-6">
            <div className="w-full max-w-[330px] bg-white rounded-[28px] p-6 shadow-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1D82F5] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7" />
              </div>

              <h3 className="text-[19px] font-extrabold text-slate-900 mb-2">
                {infoModalType === 'HELP' && 'How to Play'}
                {infoModalType === 'ABOUT' && 'Arrow Puzzle (Boss Boxes)'}
                {infoModalType === 'PRIVACY_RIGHTS' && 'Privacy Rights'}
                {infoModalType === 'PRIVACY_PREFS' && 'Privacy Preferences'}
                {infoModalType === 'REMOVE_ADS' && 'Remove Ads'}
              </h3>

              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                {infoModalType === 'HELP' &&
                  'Tap any arrow whose arrowhead has a clear, unblocked path. Every 5 levels (Level 5, 10, 15...), obstacle boxes appear on the board, blocking straight exits and increasing difficulty!'}
                {infoModalType === 'ABOUT' &&
                  'Untangle bent and interlocking arrows across infinite levels with challenging Box Obstacles on every 5th boss stage.'}
                {infoModalType === 'PRIVACY_RIGHTS' &&
                  'Your level progression, high scores, and daily stars are saved locally on your device.'}
                {infoModalType === 'PRIVACY_PREFS' &&
                  'Personalized tracking is disabled by default for a private, uninterrupted gaming experience.'}
                {infoModalType === 'REMOVE_ADS' &&
                  'Enjoy infinite puzzle solving with zero banner or interstitial advertisements!'}
              </p>

              <button
                onClick={() => {
                  sound.playClick();
                  if (infoModalType === 'REMOVE_ADS') {
                    setAdsRemoved(true);
                  }
                  setInfoModalType(null);
                }}
                className="w-full h-11 rounded-full bg-[#1D82F5] text-white font-bold text-sm shadow-md shadow-blue-500/20"
              >
                {infoModalType === 'REMOVE_ADS' ? 'Activate Ad-Free' : 'Got It'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
