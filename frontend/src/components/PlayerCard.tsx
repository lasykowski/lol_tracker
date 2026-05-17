"use client";

import { Trophy, TrendingUp, TrendingDown, Target } from "lucide-react";

interface PlayerProps {
  player: {
    id: number;
    riotId: string;
    tagline: string;
    tier: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
  };
  rankPosition: number;
}

export default function PlayerCard({ player, rankPosition }: PlayerProps) {
  const totalGames = player.wins + player.losses;
  const winrate = totalGames > 0 ? Math.round((player.wins / totalGames) * 100) : 0;
  
  const getRankColor = (tier: string) => {
    switch (tier) {
      case "CHALLENGER": return "text-cyan-400";
      case "GRANDMASTER": return "text-red-500";
      case "MASTER": return "text-purple-500";
      case "DIAMOND": return "text-blue-400";
      case "EMERALD": return "text-emerald-400";
      case "PLATINUM": return "text-teal-400";
      case "GOLD": return "text-yellow-400";
      case "SILVER": return "text-gray-400";
      case "BRONZE": return "text-orange-600";
      case "IRON": return "text-gray-500";
      default: return "text-gray-300";
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 lg:p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(6,182,212,0.3)] relative overflow-hidden group">
      {/* Background glow based on rank */}
      <div className={`absolute -right-20 -top-20 w-56 h-56 opacity-10 rounded-full blur-[80px] group-hover:opacity-30 transition-all duration-700 bg-current ${getRankColor(player.tier)}`} />
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900/80 flex items-center justify-center font-black text-2xl border border-slate-700 shadow-inner text-white backdrop-blur-md z-10">
            {rankPosition}
          </div>
          <div className="z-10">
            <h2 className="text-2xl font-black text-white tracking-wide drop-shadow-md">
              {player.riotId} <span className="text-slate-400 text-base font-medium">#{player.tagline}</span>
            </h2>
            <div className={`font-bold flex items-center gap-1.5 mt-1 ${getRankColor(player.tier)} drop-shadow-sm`}>
              <Trophy className="w-5 h-5" />
              <span className="tracking-wide">{player.tier} {player.rank}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right z-10">
          <div className="text-4xl lg:text-5xl font-black text-white neon-text tracking-tighter">{player.lp}</div>
          <div className="text-sm text-slate-300 uppercase tracking-[0.2em] font-bold mt-1">LP</div>
        </div>
      </div>

      <div className="space-y-4 z-10 relative">
        {/* Progress Bar for LP */}
        <div className="w-full h-3 bg-slate-900/60 rounded-full overflow-hidden border border-slate-800/50">
          <div 
            className={`h-full rounded-full transition-all duration-1000 relative ${
              player.lp >= 100 ? "bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]" : "bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)]"
            }`}
            style={{ width: `${Math.min(Math.max(player.lp, 0), 100)}%` }}
          >
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
            </div>
          </div>
        </div>

        <div className="flex justify-between text-base font-semibold bg-slate-900/30 p-3 rounded-xl border border-slate-800/50 backdrop-blur-sm">
          <div className="flex gap-4">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-slate-400" />
              {totalGames}
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              {player.wins}W
            </span>
            <span className="text-red-400 flex items-center gap-1">
              {player.losses}L
            </span>
          </div>
          <div className={`flex items-center gap-1.5 ${winrate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
            {winrate >= 50 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {winrate}% WR
          </div>
        </div>
      </div>
    </div>
  );
}
