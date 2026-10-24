import React, { useRef, useEffect } from 'react';
import { Club, Player } from '../game/footballData';
import { MatchPlayerState } from '../game/matchEngine';
import confetti from 'canvas-confetti';
import {
  Pause,
  RotateCcw,
  Flame,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Zap,
  Play,
  Clock,
  Activity,
} from 'lucide-react';

interface MatchHUDProps {
  homeClub: Club;
  awayClub: Club;
  homeScore: number;
  awayScore: number;
  matchTimeMinutes: number;
  halfRealElapsedSeconds: number;
  halfDurationRealMinutes: number;
  currentHalf: 1 | 2;
  isHalfTimeBreak: boolean;
  isGoalScored: boolean;
  lastScorer: string | null;
  activePlayer: Player;
  activePlayerState: MatchPlayerState;
  homePlayers: MatchPlayerState[];
  awayPlayers: MatchPlayerState[];
  ballPos: { x: number; z: number };
  pitchLength: number;
  pitchWidth: number;
  isPaused: boolean;
  isFullTime: boolean;
  shootCharge: number;
  homeShots: number;
  awayShots: number;
  homePossessionSeconds: number;
  awayPossessionSeconds: number;
  onPauseToggle: () => void;
  onRestart: () => void;
  onExit: () => void;
  onStartSecondHalf: () => void;
  // Touch inputs
  onTouchMove: (x: number, z: number) => void;
  onTouchPass: () => void;
  onTouchThrough: () => void;
  onTouchShootStart: () => void;
  onTouchShootEnd: () => void;
  onTouchSprint: (active: boolean) => void;
  onTouchTackle: () => void;
  onTouchSwitch: () => void;
}

export const MatchHUD: React.FC<MatchHUDProps> = ({
  homeClub,
  awayClub,
  homeScore,
  awayScore,
  matchTimeMinutes,
  halfRealElapsedSeconds,
  halfDurationRealMinutes,
  currentHalf,
  isHalfTimeBreak,
  isGoalScored,
  lastScorer,
  activePlayer,
  activePlayerState,
  homePlayers,
  awayPlayers,
  ballPos,
  pitchLength,
  pitchWidth,
  isPaused,
  isFullTime,
  shootCharge,
  homeShots,
  awayShots,
  homePossessionSeconds,
  awayPossessionSeconds,
  onPauseToggle,
  onRestart,
  onExit,
  onStartSecondHalf,
  onTouchMove,
  onTouchPass,
  onTouchThrough,
  onTouchShootStart,
  onTouchShootEnd,
  onTouchSprint,
  onTouchTackle,
  onTouchSwitch,
}) => {
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Goal Confetti
  useEffect(() => {
    if (isGoalScored) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });
    }
  }, [isGoalScored]);

  // Render 2D Radar Minimap
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pitch green background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Center Line & Circle
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 4);
    ctx.lineTo(canvas.width / 2, canvas.height - 4);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 12, 0, Math.PI * 2);
    ctx.stroke();

    const scaleX = (canvas.width - 12) / pitchLength;
    const scaleZ = (canvas.height - 12) / pitchWidth;
    const offsetX = canvas.width / 2;
    const offsetZ = canvas.height / 2;

    // Home Players (Cyan dots)
    ctx.fillStyle = '#06b6d4';
    homePlayers.forEach((p) => {
      const px = p.position.x * scaleX + offsetX;
      const pz = p.position.z * scaleZ + offsetZ;
      ctx.beginPath();
      ctx.arc(px, pz, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Away Players (Red dots)
    ctx.fillStyle = '#ef4444';
    awayPlayers.forEach((p) => {
      const px = p.position.x * scaleX + offsetX;
      const pz = p.position.z * scaleZ + offsetZ;
      ctx.beginPath();
      ctx.arc(px, pz, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ball (Bright Yellow/White Glowing dot)
    const bx = ballPos.x * scaleX + offsetX;
    const bz = ballPos.z * scaleZ + offsetZ;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(bx, bz, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }, [homePlayers, awayPlayers, ballPos, pitchLength, pitchWidth]);

  // In-Game Match Clock (00:00 to 90:00)
  const totalMatchSecs = Math.min(90 * 60, Math.floor(matchTimeMinutes * 60));
  const inGameMins = Math.floor(totalMatchSecs / 60);
  const inGameSecs = totalMatchSecs % 60;
  const inGameTimeFormatted = `${inGameMins.toString().padStart(2, '0')}:${inGameSecs.toString().padStart(2, '0')}`;

  // Real-world Time in Current Half (0:00 to 5:00)
  const maxHalfRealSecs = halfDurationRealMinutes * 60; // 300s
  const currentHalfRealSecs = Math.min(maxHalfRealSecs, Math.floor(halfRealElapsedSeconds));
  const realMins = Math.floor(currentHalfRealSecs / 60);
  const realSecs = currentHalfRealSecs % 60;
  const realHalfTimeFormatted = `${realMins}:${realSecs.toString().padStart(2, '0')} / ${halfDurationRealMinutes}:00`;

  // Possession calculation
  const totalPossession = Math.max(1, homePossessionSeconds + awayPossessionSeconds);
  const homePossessionPct = Math.round((homePossessionSeconds / totalPossession) * 100);
  const awayPossessionPct = 100 - homePossessionPct;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 md:p-6 z-20">
      {/* --- TOP BROADCAST SCOREBOARD --- */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        {/* Official Scoreboard Pill */}
        <div className="flex items-center shadow-2xl rounded-2xl overflow-hidden border border-white/20 bg-slate-950/90 backdrop-blur-md">
          {/* Home Team */}
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-900 border-r border-white/10">
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/30"
              style={{ backgroundColor: homeClub.primaryColor }}
            />
            <span className="font-display font-black text-white text-base md:text-lg tracking-wider">
              {homeClub.shortName}
            </span>
            <span className="font-score font-bold text-2xl md:text-3xl text-cyan-400 ml-2">
              {homeScore}
            </span>
          </div>

          <span className="text-gray-500 font-bold px-1 text-xs">-</span>

          {/* Away Team */}
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-900 border-l border-white/10">
            <span className="font-score font-bold text-2xl md:text-3xl text-white mr-2">
              {awayScore}
            </span>
            <span className="font-display font-black text-white text-base md:text-lg tracking-wider">
              {awayClub.shortName}
            </span>
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/30"
              style={{ backgroundColor: awayClub.primaryColor }}
            />
          </div>

          {/* In-Game Match Clock (e.g. 23:45) */}
          <div className="px-3 md:px-4 py-2 bg-emerald-950/80 border-l border-white/10 flex flex-col items-center">
            <span className="font-mono font-bold text-emerald-400 text-sm md:text-base leading-none">
              {inGameTimeFormatted}
            </span>
            <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest mt-0.5">
              {currentHalf === 1 ? '1ST HALF' : '2ND HALF'}
            </span>
          </div>

          {/* Real 5-Minute Half Progress Timer */}
          <div className="hidden sm:flex px-3 py-2 bg-slate-900/90 border-l border-white/10 flex-col items-center">
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300 leading-none">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{realHalfTimeFormatted}</span>
            </div>
            <span className="text-[8px] font-mono text-gray-400 uppercase tracking-wider mt-0.5">
              5 MIN = 45M
            </span>
          </div>
        </div>

        {/* Top Right: Pause Button */}
        <button
          onClick={onPauseToggle}
          className="p-3 rounded-2xl bg-slate-950/80 border border-white/20 text-white hover:border-cyan-400 transition cursor-pointer active:scale-95 shadow-xl"
        >
          <Pause className="w-5 h-5" />
        </button>
      </div>

      {/* --- GOAL BANNER POPUP --- */}
      {isGoalScored && (
        <div className="self-center flex flex-col items-center justify-center animate-bounce z-40">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 px-8 py-3 rounded-3xl border-2 border-emerald-300 shadow-[0_0_50px_rgba(16,185,129,0.8)]">
            <h1 className="text-4xl md:text-6xl font-black font-display text-white tracking-widest text-center drop-shadow-lg">
              ⚽ GOOOAAALLL!!!
            </h1>
            <p className="text-center font-mono font-bold text-white text-lg tracking-wider mt-1">
              {lastScorer}
            </p>
          </div>
        </div>
      )}

      {/* --- BOTTOM TELEMETRY, RADAR & CONTROLS --- */}
      <div className="flex items-end justify-between w-full pointer-events-auto">
        {/* Left: Active Player Card & Virtual D-Pad */}
        <div className="flex flex-col gap-2">
          {/* Active Player Status Badge */}
          <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-2.5 shadow-xl max-w-xs">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-display font-black text-black text-base shadow-md">
              {activePlayer.number}
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-white text-sm truncate">
                {activePlayer.name}
              </span>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-cyan-400 font-bold">{activePlayer.position}</span>
                <span className="text-gray-400">•</span>
                <span className="text-amber-400 font-bold">{activePlayer.overall} OVR</span>
              </div>
              {/* Stamina Bar */}
              <div className="w-28 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all"
                  style={{ width: `${activePlayerState?.stamina || 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Mobile Directional Controls */}
          <div className="grid grid-cols-3 gap-1.5 w-36 h-36 p-1 bg-slate-950/60 rounded-3xl border border-white/10 backdrop-blur-sm">
            <div />
            <button
              onTouchStart={() => onTouchMove(0, -1)}
              onTouchEnd={() => onTouchMove(0, 0)}
              className="rounded-xl bg-slate-800/80 active:bg-cyan-500/60 flex items-center justify-center text-white"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <div />
            <button
              onTouchStart={() => onTouchMove(-1, 0)}
              onTouchEnd={() => onTouchMove(0, 0)}
              className="rounded-xl bg-slate-800/80 active:bg-cyan-500/60 flex items-center justify-center text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onTouchStart={() => onTouchMove(0, 0)}
              className="rounded-xl bg-slate-900/60 flex items-center justify-center text-xs text-gray-500 font-mono"
            >
              MOVE
            </button>
            <button
              onTouchStart={() => onTouchMove(1, 0)}
              onTouchEnd={() => onTouchMove(0, 0)}
              className="rounded-xl bg-slate-800/80 active:bg-cyan-500/60 flex items-center justify-center text-white"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div />
            <button
              onTouchStart={() => onTouchMove(0, 1)}
              onTouchEnd={() => onTouchMove(0, 0)}
              className="rounded-xl bg-slate-800/80 active:bg-cyan-500/60 flex items-center justify-center text-white"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <div />
          </div>
        </div>

        {/* Center: 2D Radar Minimap */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative w-36 h-24 md:w-48 md:h-32 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-950">
            <canvas ref={radarCanvasRef} width={180} height={120} className="w-full h-full" />
          </div>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            PITCH RADAR
          </span>
        </div>

        {/* Right: Touch Football Action Buttons */}
        <div className="flex flex-col items-end gap-2">
          {/* Dynamic Shoot Power Gauge */}
          {shootCharge > 0.05 && (
            <div className="w-32 bg-slate-950/80 border border-amber-400 p-1.5 rounded-xl flex flex-col gap-1">
              <span className="text-[10px] font-black font-display text-amber-400 text-center uppercase tracking-wider">
                SHOT POWER
              </span>
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 rounded-full"
                  style={{ width: `${shootCharge * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {/* Through Ball */}
            <button
              onTouchStart={(e) => { e.preventDefault(); onTouchThrough(); }}
              onClick={onTouchThrough}
              className="w-16 h-14 rounded-2xl bg-purple-600/80 border-2 border-purple-400 text-white font-display font-black text-xs active:bg-purple-400 active:scale-95 shadow-lg backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer"
            >
              <span>THRU</span>
              <span className="text-[9px] text-purple-200">BALL (L)</span>
            </button>

            {/* Shoot (Hold to charge) */}
            <button
              onTouchStart={(e) => { e.preventDefault(); onTouchShootStart(); }}
              onTouchEnd={(e) => { e.preventDefault(); onTouchShootEnd(); }}
              onMouseDown={onTouchShootStart}
              onMouseUp={onTouchShootEnd}
              className="w-16 h-14 rounded-2xl bg-rose-600/80 border-2 border-rose-400 text-white font-display font-black text-xs active:bg-rose-400 active:scale-95 shadow-lg backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer"
            >
              <Flame className="w-4 h-4 text-yellow-300" />
              <span>SHOOT (J)</span>
            </button>

            {/* Ground Pass */}
            <button
              onTouchStart={(e) => { e.preventDefault(); onTouchPass(); }}
              onClick={onTouchPass}
              className="w-16 h-14 rounded-2xl bg-blue-600/80 border-2 border-blue-400 text-white font-display font-black text-xs active:bg-blue-400 active:scale-95 shadow-lg backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer"
            >
              <span>PASS</span>
              <span className="text-[9px] text-blue-200">SHORT (K)</span>
            </button>

            {/* Sprint / Tackle */}
            <button
              onTouchStart={(e) => { e.preventDefault(); onTouchSprint(true); }}
              onTouchEnd={(e) => { e.preventDefault(); onTouchSprint(false); }}
              onMouseDown={() => onTouchSprint(true)}
              onMouseUp={() => onTouchSprint(false)}
              className="w-16 h-14 rounded-2xl bg-emerald-600/80 border-2 border-emerald-400 text-white font-display font-black text-xs active:bg-emerald-400 active:scale-95 shadow-lg backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer"
            >
              <Zap className="w-4 h-4 text-yellow-300" />
              <span>SPRINT</span>
            </button>
          </div>

          {/* Switch Player / Slide Tackle */}
          <div className="flex gap-2">
            <button
              onClick={onTouchSwitch}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/20 text-xs font-display font-bold text-cyan-300 active:scale-95 cursor-pointer"
            >
              SWITCH (E)
            </button>
            <button
              onClick={onTouchTackle}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/20 text-xs font-display font-bold text-amber-300 active:scale-95 cursor-pointer"
            >
              SLIDE TACKLE
            </button>
          </div>
        </div>
      </div>

      {/* --- HALF TIME BREAK OVERLAY (1-Half: 5 Minutes Completed) --- */}
      {isHalfTimeBreak && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center pointer-events-auto z-50 p-4">
          <div className="bg-slate-950 border-2 border-emerald-400 rounded-3xl p-6 md:p-8 max-w-lg w-full flex flex-col items-center gap-6 shadow-2xl">
            <div className="text-center">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                ⏱️ 1-HALF COMPLETED (5 MIN = 45M)
              </span>
              <h2 className="text-3xl md:text-4xl font-black font-display text-white tracking-widest">
                HALF TIME! (45:00)
              </h2>
            </div>

            {/* Scorecard */}
            <div className="flex items-center justify-center gap-6 bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 w-full">
              <div className="flex flex-col items-center">
                <span className="font-display font-black text-lg text-white">{homeClub.shortName}</span>
                <span className="font-score font-black text-5xl text-cyan-400">{homeScore}</span>
              </div>
              <span className="text-2xl font-bold text-gray-500">-</span>
              <div className="flex flex-col items-center">
                <span className="font-display font-black text-lg text-white">{awayClub.shortName}</span>
                <span className="font-score font-black text-5xl text-white">{awayScore}</span>
              </div>
            </div>

            {/* Half Time Match Statistics */}
            <div className="w-full bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 font-mono text-xs">
              <div className="flex justify-between text-gray-400 font-bold border-b border-white/10 pb-1.5">
                <span>{homeClub.shortName}</span>
                <span className="uppercase text-gray-200">1ST HALF STATS</span>
                <span>{awayClub.shortName}</span>
              </div>
              <div className="flex justify-between text-white font-bold">
                <span>{homeShots}</span>
                <span className="text-gray-400">SHOTS</span>
                <span>{awayShots}</span>
              </div>
              <div className="flex justify-between text-white font-bold">
                <span>{homePossessionPct}%</span>
                <span className="text-gray-400">POSSESSION</span>
                <span>{awayPossessionPct}%</span>
              </div>
            </div>

            {/* Start 2nd Half Button */}
            <button
              onClick={onStartSecondHalf}
              className="w-full py-4 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-black font-black font-display text-lg rounded-2xl hover:brightness-110 active:scale-95 transition shadow-[0_0_30px_rgba(16,185,129,0.5)] cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-black" />
              START 2ND HALF ⚽ (5 MIN = 45M)
            </button>
          </div>
        </div>
      )}

      {/* --- PAUSE MODAL --- */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center pointer-events-auto z-50 p-4">
          <div className="bg-slate-950 border-2 border-cyan-500/50 rounded-3xl p-6 md:p-8 max-w-sm w-full flex flex-col items-center gap-5 shadow-2xl">
            <h2 className="text-3xl font-black font-display text-white tracking-wider">
              MATCH PAUSED
            </h2>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={onPauseToggle}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-black font-display text-lg rounded-xl hover:brightness-110 active:scale-95 transition shadow-lg cursor-pointer"
              >
                RESUME MATCH
              </button>
              <button
                onClick={onRestart}
                className="w-full py-3.5 bg-slate-900 border border-white/20 text-white font-bold font-display rounded-xl hover:border-cyan-400 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                RESTART MATCH
              </button>
              <button
                onClick={onExit}
                className="w-full py-3.5 bg-red-950/60 border border-red-500/50 text-red-300 font-bold font-display rounded-xl hover:bg-red-900 transition cursor-pointer"
              >
                RETURN TO MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FULL TIME RESULTS MODAL --- */}
      {isFullTime && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center pointer-events-auto z-50 p-4">
          <div className="bg-slate-950 border-2 border-cyan-400 rounded-3xl p-6 md:p-8 max-w-md w-full flex flex-col items-center gap-6 shadow-2xl">
            <h2 className="text-3xl font-black font-display text-white tracking-widest text-center">
              FULL TIME! 🏆 (90:00)
            </h2>

            {/* Scorecard */}
            <div className="flex items-center justify-center gap-4 bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 w-full">
              <div className="flex flex-col items-center">
                <span className="font-display font-black text-xl text-white">{homeClub.shortName}</span>
                <span className="font-score font-black text-5xl text-cyan-400">{homeScore}</span>
              </div>
              <span className="text-2xl font-bold text-gray-500">-</span>
              <div className="flex flex-col items-center">
                <span className="font-display font-black text-xl text-white">{awayClub.shortName}</span>
                <span className="font-score font-black text-5xl text-white">{awayScore}</span>
              </div>
            </div>

            {/* Full Match Statistics */}
            <div className="w-full bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between text-gray-400 font-bold border-b border-white/10 pb-1.5">
                <span>{homeClub.shortName}</span>
                <span className="uppercase text-gray-200">MATCH STATS</span>
                <span>{awayClub.shortName}</span>
              </div>
              <div className="flex justify-between text-white font-bold">
                <span>{homeShots}</span>
                <span className="text-gray-400">TOTAL SHOTS</span>
                <span>{awayShots}</span>
              </div>
              <div className="flex justify-between text-white font-bold">
                <span>{homePossessionPct}%</span>
                <span className="text-gray-400">POSSESSION</span>
                <span>{awayPossessionPct}%</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-white/10">
                <span>TOTAL TIME</span>
                <span className="text-white">10 MIN (90M MATCH)</span>
              </div>
            </div>

            <div className="text-center font-mono text-xs text-gray-300">
              Match Reward: <span className="text-emerald-400 font-bold">+2,500 Coins</span> • +350 XP
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={onRestart}
                className="flex-1 py-3 bg-slate-900 border border-white/20 text-white font-bold font-display rounded-xl hover:border-cyan-400 transition cursor-pointer"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-black font-display rounded-xl hover:brightness-110 transition shadow-lg cursor-pointer"
              >
                EXIT TO HUB
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
