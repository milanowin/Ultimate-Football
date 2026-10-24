import React, { useState } from 'react';
import { footballAudio } from '../game/footballAudio';
import confetti from 'canvas-confetti';
import { Flame, RotateCcw, X } from 'lucide-react';

interface PenaltyModalProps {
  onClose: () => void;
  onWinPrize: (coins: number) => void;
}

export const PenaltyModal: React.FC<PenaltyModalProps> = ({ onClose, onWinPrize }) => {
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [cpuScore, setCpuScore] = useState<number>(0);
  const [attempts, setAttempts] = useState<('scored' | 'missed')[]>([]);
  const [cpuAttempts, setCpuAttempts] = useState<('scored' | 'missed')[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<'TL' | 'TR' | 'BL' | 'BR' | 'C'>('C');
  const [roundOver, setRoundOver] = useState<boolean>(false);
  const [resultText, setResultText] = useState<string>('SELECT TARGET & SHOOT!');

  const handleShoot = () => {
    footballAudio.playKick(0.9);

    // Goalkeeper guesses a spot
    const spots: ('TL' | 'TR' | 'BL' | 'BR' | 'C')[] = ['TL', 'TR', 'BL', 'BR', 'C'];
    const gkDive = spots[Math.floor(Math.random() * spots.length)];

    let userScored = false;
    if (selectedTarget !== gkDive) {
      userScored = true;
      setPlayerScore((prev) => prev + 1);
      setAttempts((prev) => [...prev, 'scored']);
      setResultText('GOAL! PERFECT STRIKE! ⚽');
      footballAudio.playNetRattle();
      footballAudio.cheerGoal();
    } else {
      setAttempts((prev) => [...prev, 'missed']);
      setResultText('SAVED BY GOALKEEPER! 🧤');
      footballAudio.playWhistle('short');
    }

    // CPU takes turn
    setTimeout(() => {
      const cpuSuccess = Math.random() > 0.35;
      if (cpuSuccess) {
        setCpuScore((prev) => prev + 1);
        setCpuAttempts((prev) => [...prev, 'scored']);
      } else {
        setCpuAttempts((prev) => [...prev, 'missed']);
      }

      if (attempts.length + 1 >= 5) {
        setRoundOver(true);
        if (playerScore + (userScored ? 1 : 0) > cpuScore + (cpuSuccess ? 1 : 0)) {
          confetti();
          onWinPrize(5000);
          setResultText('YOU WON THE PENALTY SHOOTOUT! +5,000 COINS 🏆');
        } else {
          setResultText('SHOOTOUT FINISHED!');
        }
      }
    }, 800);
  };

  const handleReset = () => {
    setPlayerScore(0);
    setCpuScore(0);
    setAttempts([]);
    setCpuAttempts([]);
    setRoundOver(false);
    setResultText('SELECT TARGET & SHOOT!');
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 z-50">
      <div className="bg-slate-950 border-2 border-emerald-400 rounded-3xl p-6 md:p-8 max-w-lg w-full flex flex-col items-center gap-5 shadow-[0_0_60px_rgba(16,185,129,0.4)]">
        <div className="flex items-center justify-between w-full">
          <h2 className="text-2xl font-black font-display text-white tracking-wider flex items-center gap-2">
            <Flame className="w-6 h-6 text-emerald-400" />
            PENALTY SHOOTOUT
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scoreboard */}
        <div className="flex items-center justify-around w-full bg-slate-900 border border-white/10 rounded-2xl p-3 text-center">
          <div>
            <span className="text-xs font-mono text-cyan-400 font-bold block">YOU</span>
            <span className="text-3xl font-score font-black text-white">{playerScore}</span>
            <div className="flex gap-1 justify-center mt-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    attempts[i] === 'scored'
                      ? 'bg-emerald-400'
                      : attempts[i] === 'missed'
                      ? 'bg-rose-500'
                      : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <span className="text-xl font-black text-gray-500">-</span>

          <div>
            <span className="text-xs font-mono text-rose-400 font-bold block">CPU</span>
            <span className="text-3xl font-score font-black text-white">{cpuScore}</span>
            <div className="flex gap-1 justify-center mt-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    cpuAttempts[i] === 'scored'
                      ? 'bg-emerald-400'
                      : cpuAttempts[i] === 'missed'
                      ? 'bg-rose-500'
                      : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Goal Target Grid */}
        <div className="relative w-full h-44 bg-slate-900 border-4 border-white rounded-t-xl overflow-hidden shadow-inner flex flex-col justify-between p-3">
          {/* Net grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

          {/* Top Row Targets */}
          <div className="flex justify-between z-10">
            <button
              onClick={() => setSelectedTarget('TL')}
              className={`w-12 h-12 rounded-xl border-2 font-display font-black text-xs transition cursor-pointer ${
                selectedTarget === 'TL'
                  ? 'border-emerald-400 bg-emerald-500/40 text-emerald-300 scale-105'
                  : 'border-white/20 bg-black/40 text-gray-400'
              }`}
            >
              TOP L
            </button>
            <button
              onClick={() => setSelectedTarget('C')}
              className={`w-12 h-12 rounded-xl border-2 font-display font-black text-xs transition cursor-pointer ${
                selectedTarget === 'C'
                  ? 'border-emerald-400 bg-emerald-500/40 text-emerald-300 scale-105'
                  : 'border-white/20 bg-black/40 text-gray-400'
              }`}
            >
              MID
            </button>
            <button
              onClick={() => setSelectedTarget('TR')}
              className={`w-12 h-12 rounded-xl border-2 font-display font-black text-xs transition cursor-pointer ${
                selectedTarget === 'TR'
                  ? 'border-emerald-400 bg-emerald-500/40 text-emerald-300 scale-105'
                  : 'border-white/20 bg-black/40 text-gray-400'
              }`}
            >
              TOP R
            </button>
          </div>

          {/* Bottom Row Targets */}
          <div className="flex justify-between z-10">
            <button
              onClick={() => setSelectedTarget('BL')}
              className={`w-12 h-12 rounded-xl border-2 font-display font-black text-xs transition cursor-pointer ${
                selectedTarget === 'BL'
                  ? 'border-emerald-400 bg-emerald-500/40 text-emerald-300 scale-105'
                  : 'border-white/20 bg-black/40 text-gray-400'
              }`}
            >
              BOT L
            </button>
            <button
              onClick={() => setSelectedTarget('BR')}
              className={`w-12 h-12 rounded-xl border-2 font-display font-black text-xs transition cursor-pointer ${
                selectedTarget === 'BR'
                  ? 'border-emerald-400 bg-emerald-500/40 text-emerald-300 scale-105'
                  : 'border-white/20 bg-black/40 text-gray-400'
              }`}
            >
              BOT R
            </button>
          </div>
        </div>

        {/* Status text */}
        <span className="font-display font-black text-sm text-center text-amber-300 tracking-wider">
          {resultText}
        </span>

        {/* Shoot Button */}
        {!roundOver ? (
          <button
            onClick={handleShoot}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-400 to-cyan-500 text-black font-black font-display text-lg rounded-xl hover:brightness-110 active:scale-95 transition shadow-lg cursor-pointer"
          >
            TAKE PENALTY SHOT ⚽
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="w-full py-3.5 bg-slate-800 border border-white/20 text-white font-bold font-display rounded-xl hover:border-emerald-400 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            PLAY AGAIN
          </button>
        )}
      </div>
    </div>
  );
};
