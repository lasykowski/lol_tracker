"use client";

import { useEffect, useState } from "react";
import { Swords, Activity, Target } from "lucide-react";

interface ZacStat {
  player: string;
  games: number;
  winrate: string;
  kda: string;
}

export default function ZacWidget() {
  const [stats, setStats] = useState<ZacStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/api/stats/zac")
      .then((res) => res.json())
      .then((json) => {
        // Sort by KDA or Winrate (e.g. by KDA descending)
        const sorted = json.sort((a: ZacStat, b: ZacStat) => parseFloat(b.kda) - parseFloat(a.kda));
        setStats(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch Zac stats", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="h-48 glass-panel rounded-2xl flex items-center justify-center text-slate-400">Loading Zac Stats...</div>;
  }

  if (stats.length === 0) {
    return (
      <div className="h-48 glass-panel rounded-2xl flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <Swords className="w-8 h-8 mb-2 opacity-50" />
        <p>No Zac games found in recent match history.</p>
      </div>
    );
  }

  const bestPlayer = stats[0];

  return (
    <div className="glass-panel rounded-3xl p-6 lg:p-8 relative overflow-hidden group">
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-green-500/10 rounded-full blur-[60px] group-hover:bg-green-500/20 transition-all duration-700"></div>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-slate-900/80 flex items-center justify-center border border-slate-700/80 shadow-xl overflow-hidden backdrop-blur-sm z-10">
          <img 
            src="https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/Zac.png" 
            alt="Zac" 
            className="w-14 h-14 scale-110 object-cover opacity-90 hover:scale-125 hover:opacity-100 transition-transform duration-500"
          />
        </div>
        <div className="z-10">
          <h3 className="text-2xl font-black text-white leading-none tracking-tight">Zac OTP Race</h3>
          <p className="text-sm text-green-400 font-bold mt-1.5 uppercase tracking-widest">Best Performing</p>
        </div>
      </div>

      <div className="bg-slate-900/40 rounded-2xl p-5 border border-slate-800/60 mb-6 backdrop-blur-md relative z-10 shadow-inner group-hover:border-green-500/30 transition-colors duration-500">
        <div className="text-xs text-slate-400 mb-2 uppercase tracking-widest font-bold">Current Leader</div>
        <div className="text-2xl font-black text-white neon-text tracking-wide">{bestPlayer.player}</div>
        
        <div className="flex gap-6 mt-4">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 flex items-center gap-1.5 font-bold uppercase"><Target className="w-3.5 h-3.5"/> KDA</span>
            <span className="font-black text-white text-lg">{bestPlayer.kda}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 flex items-center gap-1.5 font-bold uppercase"><Activity className="w-3.5 h-3.5"/> WR</span>
            <span className="font-black text-emerald-400 text-lg">{bestPlayer.winrate}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 flex items-center gap-1.5 font-bold uppercase"><Swords className="w-3.5 h-3.5"/> Games</span>
            <span className="font-black text-white text-lg">{bestPlayer.games}</span>
          </div>
        </div>
      </div>
      
      {stats.length > 1 && (
        <div className="space-y-3 mt-6 z-10 relative">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">Runners Up</div>
          {stats.slice(1).map((stat, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm bg-slate-900/20 px-4 py-2.5 rounded-xl border border-slate-800/30">
              <span className="text-slate-300 font-medium">{stat.player}</span>
              <span className="text-slate-400 font-mono font-bold bg-slate-800/50 px-2 py-1 rounded">{stat.kda} KDA</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
