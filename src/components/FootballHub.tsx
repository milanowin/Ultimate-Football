import React, { useState } from 'react';
import { Club, CLUBS, Player, ALL_PLAYERS } from '../game/footballData';
import { CARD_PACKS, CardPack, openPack, calculateSquadChemistry } from '../game/ultimateTeam';
import { CustomPlayerProfile } from '../game/playerCareer';
import { footballAudio } from '../game/footballAudio';
import {
  Play,
  Layers,
  User,
  ShoppingBag,
  Award,
  Settings,
  Flame,
  Zap,
  Shield,
  Sparkles,
  Trophy,
  Check,
  ChevronRight,
  TrendingUp,
  Clock,
} from 'lucide-react';

interface FootballHubProps {
  coins: number;
  onUpdateCoins: (newCoins: number) => void;
  ultimateSquad: Player[];
  onUpdateSquad: (newSquad: Player[]) => void;
  careerProfile: CustomPlayerProfile;
  onUpdateCareerProfile: (newProfile: CustomPlayerProfile) => void;
  onStartMatch: (homeClub: Club, awayClub: Club, customSquad?: Player[]) => void;
  onStartPenaltyShootout: () => void;
}

type HubTab = 'play' | 'ultimate' | 'career' | 'market' | 'settings';

export const FootballHub: React.FC<FootballHubProps> = ({
  coins,
  onUpdateCoins,
  ultimateSquad,
  onUpdateSquad,
  careerProfile,
  onUpdateCareerProfile,
  onStartMatch,
  onStartPenaltyShootout,
}) => {
  const [activeTab, setActiveTab] = useState<HubTab>('play');

  // Kick-Off setup
  const [selectedHomeClubId, setSelectedHomeClubId] = useState<string>('real-madrid');
  const [selectedAwayClubId, setSelectedAwayClubId] = useState<string>('barcelona');

  // Pack Opening state
  const [openedPlayers, setOpenedPlayers] = useState<Player[] | null>(null);
  const [isOpeningPack, setIsOpeningPack] = useState<boolean>(false);

  const homeClub = CLUBS[selectedHomeClubId] || CLUBS['real-madrid'];
  const awayClub = CLUBS[selectedAwayClubId] || CLUBS['barcelona'];
  const squadChemistry = calculateSquadChemistry(ultimateSquad);

  const handleOpenPack = (pack: CardPack) => {
    if (coins < pack.priceCoins) return;
    footballAudio.playClick();
    onUpdateCoins(coins - pack.priceCoins);

    setIsOpeningPack(true);
    setTimeout(() => {
      const players = openPack(pack);
      setOpenedPlayers(players);
      setIsOpeningPack(false);

      // Add highest rated player to squad if not already present
      const topPlayer = players[0];
      if (!ultimateSquad.some((p) => p.id === topPlayer.id)) {
        onUpdateSquad([...ultimateSquad.slice(0, 5), topPlayer]);
      }
    }, 1200);
  };

  const handleBuyPlayer = (player: Player) => {
    if (coins < player.priceCoins) return;
    footballAudio.playPackReveal();
    onUpdateCoins(coins - player.priceCoins);
    if (!ultimateSquad.some((p) => p.id === player.id)) {
      onUpdateSquad([...ultimateSquad, player]);
    }
  };

  const handleUpgradeCareerStat = (statKey: keyof typeof careerProfile.stats) => {
    if (careerProfile.skillPoints <= 0) return;
    footballAudio.playClick();
    const currentVal = careerProfile.stats[statKey];
    if (currentVal >= 99) return;

    const newStats = {
      ...careerProfile.stats,
      [statKey]: currentVal + 2,
    };

    onUpdateCareerProfile({
      ...careerProfile,
      overall: careerProfile.overall + 1,
      skillPoints: careerProfile.skillPoints - 1,
      stats: newStats,
    });
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-4 md:p-8 pointer-events-auto select-none overflow-hidden bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent">
      {/* --- TOP BRANDING & COINS HEADER --- */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-300">
            <span className="font-display font-black text-black text-xl">FC</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black font-display tracking-wider bg-gradient-to-r from-emerald-400 via-white to-cyan-400 bg-clip-text text-transparent">
              ULTIMATE FC 3D
            </h1>
            <p className="text-xs text-gray-400 tracking-widest font-mono">
              NEXT-GEN FOOTBALL SIMULATOR
            </p>
          </div>
        </div>

        {/* Currency & Level Profile */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-400/50 rounded-2xl px-4 py-2 shadow-lg">
            <span className="text-amber-400 font-bold font-mono">🪙</span>
            <span className="font-mono font-black text-white text-base md:text-lg">
              {coins.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 border border-emerald-500/40 rounded-2xl px-3.5 py-2 shadow-lg">
            <span className="text-xs text-emerald-400 font-bold font-display">CHEM</span>
            <span className="font-mono font-black text-emerald-300 text-base">
              {squadChemistry}/33
            </span>
          </div>
        </div>
      </div>

      {/* --- CENTER DYNAMIC CONTENT BY TAB --- */}
      <div className="flex-1 flex items-center justify-center my-4 overflow-y-auto">
        {/* 1. PLAY / KICK-OFF TAB */}
        {activeTab === 'play' && (
          <div className="bg-slate-950/90 backdrop-blur-xl border-2 border-emerald-500/40 rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-black font-display text-white flex items-center gap-2">
                <Play className="w-7 h-7 text-emerald-400" />
                MATCH DAY KICK-OFF
              </h2>
              <button
                onClick={onStartPenaltyShootout}
                className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 font-display font-black text-xs hover:bg-amber-500/30 transition cursor-pointer"
              >
                PENALTY SHOOTOUT
              </button>
            </div>

            {/* Club Head to Head Matchup Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Club */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  HOME TEAM
                </span>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl border border-white/30"
                    style={{ backgroundColor: homeClub.primaryColor }}
                  />
                  <div>
                    <h3 className="font-display font-black text-xl text-white">
                      {homeClub.name}
                    </h3>
                    <span className="text-xs text-gray-400 font-mono">
                      {homeClub.stadiumName} • {homeClub.rating} OVR
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
                  {Object.values(CLUBS).slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedHomeClubId(c.id)}
                      className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedHomeClubId === c.id
                          ? 'bg-cyan-500 text-black font-display font-black'
                          : 'bg-slate-800 text-gray-300 hover:text-white'
                      }`}
                    >
                      {c.shortName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Away Club */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                <span className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
                  AWAY TEAM
                </span>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl border border-white/30"
                    style={{ backgroundColor: awayClub.primaryColor }}
                  />
                  <div>
                    <h3 className="font-display font-black text-xl text-white">
                      {awayClub.name}
                    </h3>
                    <span className="text-xs text-gray-400 font-mono">
                      {awayClub.league} • {awayClub.rating} OVR
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
                  {Object.values(CLUBS).slice(4, 8).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedAwayClubId(c.id)}
                      className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedAwayClubId === c.id
                          ? 'bg-rose-500 text-black font-display font-black'
                          : 'bg-slate-800 text-gray-300 hover:text-white'
                      }`}
                    >
                      {c.shortName}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Match Duration Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs font-mono">
              <span className="text-gray-300 font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                HALF LENGTH:
              </span>
              <span className="text-emerald-400 font-bold">
                1-Half 5 Min (45m) • 2-Half 5 Min (45m) = 10 Min Match (90m)
              </span>
            </div>

            {/* Launch Match Button */}
            <button
              onClick={() => {
                footballAudio.playKick(0.8);
                onStartMatch(homeClub, awayClub);
              }}
              className="w-full py-4 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-black font-black font-display text-xl rounded-2xl hover:brightness-110 active:scale-98 transition shadow-[0_0_30px_rgba(16,185,129,0.5)] cursor-pointer flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6 fill-black" />
              START MATCH (PLAY)
            </button>
          </div>
        )}

        {/* 2. ULTIMATE TEAM & PACKS TAB */}
        {activeTab === 'ultimate' && (
          <div className="bg-slate-950/90 backdrop-blur-xl border-2 border-amber-500/40 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-black font-display text-white flex items-center gap-2">
                  <Sparkles className="w-7 h-7 text-amber-400" />
                  ULTIMATE TEAM PACK STORE
                </h2>
                <span className="text-xs text-amber-300 font-mono">
                  OPEN PACKS • REVEAL SUPERSTARS • BUILD CHEMISTRY
                </span>
              </div>
              <button
                onClick={() => {
                  onStartMatch(homeClub, awayClub, ultimateSquad);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-black font-display font-black text-sm hover:brightness-110 transition cursor-pointer shadow-lg"
              >
                PLAY WITH MY SQUAD
              </button>
            </div>

            {/* Pack Opening Reveal Modal */}
            {openedPlayers && (
              <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-950/80 via-slate-900 to-slate-950 border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)] flex flex-col items-center gap-4">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-300 font-black">
                  ★ NEW WALKOUT UNLOCKED ★
                </span>
                <div className="flex items-center gap-4 flex-wrap justify-center">
                  {openedPlayers.map((p) => (
                    <div
                      key={p.id}
                      className="w-36 p-3 rounded-2xl bg-gradient-to-b from-amber-500 via-amber-700 to-amber-950 border-2 border-amber-200 text-black shadow-xl flex flex-col items-center text-center animate-pulse"
                    >
                      <span className="text-3xl font-black font-score text-white drop-shadow">
                        {p.overall}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-200 uppercase">
                        {p.position}
                      </span>
                      <h4 className="font-display font-black text-sm text-white mt-2 truncate w-full">
                        {p.name}
                      </h4>
                      <span className="text-[10px] text-amber-100 font-mono">{p.nation}</span>
                      <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-white mt-2 w-full pt-1 border-t border-amber-300/40">
                        <span>PAC {p.stats.pace}</span>
                        <span>SHO {p.stats.shooting}</span>
                        <span>PAS {p.stats.passing}</span>
                        <span>DRI {p.stats.dribbling}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setOpenedPlayers(null)}
                  className="px-6 py-2 bg-amber-400 text-black font-display font-black rounded-xl text-xs hover:bg-amber-300 transition cursor-pointer"
                >
                  SEND TO CLUB SQUAD
                </button>
              </div>
            )}

            {/* Packs Store Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CARD_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border-2 border-white/10 hover:border-amber-400/60 transition flex flex-col justify-between"
                >
                  <div className="flex flex-col gap-2">
                    <div
                      className="w-12 h-16 rounded-lg mx-auto shadow-lg flex items-center justify-center font-display font-black text-black text-xs"
                      style={{ backgroundColor: pack.accentColor }}
                    >
                      PACK
                    </div>
                    <h3 className="font-display font-black text-lg text-white text-center mt-2">
                      {pack.name}
                    </h3>
                    <p className="text-xs text-gray-300 text-center leading-relaxed">
                      {pack.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenPack(pack)}
                    disabled={coins < pack.priceCoins || isOpeningPack}
                    className={`mt-4 py-3 rounded-xl font-display font-black text-xs transition cursor-pointer ${
                      coins >= pack.priceCoins
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:brightness-110 shadow-md'
                        : 'bg-slate-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    OPEN PACK • {pack.priceCoins.toLocaleString()} COINS
                  </button>
                </div>
              ))}
            </div>

            {/* Current Ultimate Squad Carousel */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-display font-black text-gray-300 uppercase tracking-wider mb-3">
                MY ACTIVE SQUAD ({ultimateSquad.length} PLAYERS)
              </h3>
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {ultimateSquad.map((p) => (
                  <div
                    key={p.id}
                    className="min-w-[110px] p-2.5 rounded-xl bg-slate-900 border border-amber-400/40 flex flex-col items-center text-center shadow-md"
                  >
                    <span className="font-score font-black text-2xl text-amber-400 leading-none">
                      {p.overall}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">{p.position}</span>
                    <span className="font-display font-bold text-xs text-white truncate w-full mt-1">
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. PLAYER CAREER MODE TAB */}
        {activeTab === 'career' && (
          <div className="bg-slate-950/90 backdrop-blur-xl border-2 border-cyan-500/40 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-black font-display text-white flex items-center gap-2">
                  <User className="w-7 h-7 text-cyan-400" />
                  PLAYER CAREER HUB
                </h2>
                <span className="text-xs text-cyan-300 font-mono">
                  {careerProfile.name} • {careerProfile.position} • {careerProfile.overall} OVR
                </span>
              </div>
              <button
                onClick={() => {
                  onStartMatch(homeClub, awayClub);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-display font-black text-sm hover:brightness-110 transition cursor-pointer shadow-lg"
              >
                PLAY CAREER MATCH
              </button>
            </div>

            {/* Player Stats Grid & Upgrade Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Career Trophies & Form */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  CAREER RECORD
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                    <span className="text-2xl font-black font-score text-white">{careerProfile.careerStats.matchesPlayed}</span>
                    <span className="text-[10px] font-mono text-gray-400 block">MATCHES</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                    <span className="text-2xl font-black font-score text-emerald-400">{careerProfile.careerStats.goals}</span>
                    <span className="text-[10px] font-mono text-gray-400 block">GOALS</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                    <span className="text-2xl font-black font-score text-amber-400">{careerProfile.careerStats.trophies}</span>
                    <span className="text-[10px] font-mono text-gray-400 block">TROPHIES</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-gray-300 pt-2 border-t border-white/10">
                  <span>Market Value:</span>
                  <span className="font-bold text-emerald-400">${(careerProfile.marketValue / 1000000).toFixed(1)}M</span>
                </div>
              </div>

              {/* Attributes Training & Skill Points */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                    ATTRIBUTES TRAINING
                  </span>
                  <span className="text-xs font-mono text-white bg-cyan-500/20 px-2.5 py-0.5 rounded-full border border-cyan-400/40">
                    {careerProfile.skillPoints} SP Available
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {[
                    { key: 'pace', name: 'PACE', val: careerProfile.stats.pace },
                    { key: 'shooting', name: 'SHOOTING', val: careerProfile.stats.shooting },
                    { key: 'passing', name: 'PASSING', val: careerProfile.stats.passing },
                    { key: 'dribbling', name: 'DRIBBLING', val: careerProfile.stats.dribbling },
                    { key: 'physical', name: 'PHYSICAL', val: careerProfile.stats.physical },
                  ].map((attr) => (
                    <div key={attr.key} className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-gray-300 w-24">
                        {attr.name}
                      </span>
                      <div className="flex-1 mx-3 h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${attr.val}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-white w-8">
                        {attr.val}
                      </span>
                      <button
                        onClick={() => handleUpgradeCareerStat(attr.key as keyof typeof careerProfile.stats)}
                        disabled={careerProfile.skillPoints <= 0}
                        className="px-2 py-0.5 rounded-md bg-cyan-500 text-black font-display font-black text-xs hover:bg-cyan-400 disabled:opacity-30 cursor-pointer"
                      >
                        +2
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. TRANSFER MARKET TAB */}
        {activeTab === 'market' && (
          <div className="bg-slate-950/90 backdrop-blur-xl border-2 border-emerald-500/40 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-4">
            <h2 className="text-2xl font-black font-display text-white flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-emerald-400" />
              GLOBAL TRANSFER MARKET
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ALL_PLAYERS.slice(0, 8).map((player) => {
                const isOwned = ultimateSquad.some((p) => p.id === player.id);
                return (
                  <div
                    key={player.id}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 rounded-xl bg-amber-500/20 border border-amber-400 flex flex-col items-center justify-center">
                        <span className="font-score font-black text-2xl text-amber-300 leading-none">
                          {player.overall}
                        </span>
                        <span className="text-[10px] font-mono text-white font-bold">{player.position}</span>
                      </div>
                      <div>
                        <h4 className="font-display font-black text-sm text-white">
                          {player.name}
                        </h4>
                        <span className="text-xs text-gray-400 font-mono">
                          {player.nation} • PAC {player.stats.pace} • SHO {player.stats.shooting}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuyPlayer(player)}
                      disabled={isOwned || coins < player.priceCoins}
                      className={`px-4 py-2 rounded-xl font-display font-black text-xs transition cursor-pointer ${
                        isOwned
                          ? 'bg-slate-800 text-gray-500 cursor-not-allowed'
                          : coins >= player.priceCoins
                          ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-md'
                          : 'bg-slate-800 text-red-400 cursor-not-allowed'
                      }`}
                    >
                      {isOwned ? 'OWNED' : `${player.priceCoins.toLocaleString()} 🪙`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* --- BOTTOM DOCK NAVIGATION --- */}
      <div className="flex items-center justify-center gap-2 md:gap-4 bg-slate-950/80 backdrop-blur-xl border border-white/15 rounded-2xl px-3 md:px-6 py-2.5 shadow-2xl self-center">
        <button
          onClick={() => { footballAudio.playClick(); setActiveTab('play'); }}
          className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-black font-display transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'play' ? 'bg-emerald-500 text-black shadow-[0_0_15px_#10b981]' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Play className="w-4 h-4" />
          KICK-OFF
        </button>

        <button
          onClick={() => { footballAudio.playClick(); setActiveTab('ultimate'); }}
          className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-black font-display transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ultimate' ? 'bg-amber-400 text-black shadow-[0_0_15px_#f59e0b]' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          ULTIMATE TEAM
        </button>

        <button
          onClick={() => { footballAudio.playClick(); setActiveTab('career'); }}
          className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-black font-display transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'career' ? 'bg-cyan-400 text-black shadow-[0_0_15px_#06b6d4]' : 'text-gray-300 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          PLAYER CAREER
        </button>

        <button
          onClick={() => { footballAudio.playClick(); setActiveTab('market'); }}
          className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-black font-display transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'market' ? 'bg-emerald-500 text-black shadow-[0_0_15px_#10b981]' : 'text-gray-300 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          TRANSFERS
        </button>
      </div>
    </div>
  );
};
