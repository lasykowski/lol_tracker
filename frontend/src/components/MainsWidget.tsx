"use client";

import { useEffect, useState } from "react";
import { Swords, Activity, Target } from "lucide-react";

interface MainStat {
  player: string;
  riotId: string;
  champName: string;
  games: number;
  winrate: number;
  kda: string;
  wins: number;
  losses: number;
}

const getChampConfig = (champName: string) => {
  switch (champName) {
    case 'Yasuo':
      return {
        bgGlow: 'bg-blue-500/20 group-hover:bg-blue-500/30',
        borderColor: 'group-hover:border-blue-500/50',
        textColor: 'text-blue-400'
      };
    case 'Nidalee':
      return {
        bgGlow: 'bg-amber-500/20 group-hover:bg-amber-500/30',
        borderColor: 'group-hover:border-amber-500/50',
        textColor: 'text-amber-400'
      };
    case 'Zac':
      return {
        bgGlow: 'bg-emerald-500/20 group-hover:bg-emerald-500/30',
        borderColor: 'group-hover:border-emerald-500/50',
        textColor: 'text-emerald-400'
      };
    case 'Qiyana':
      return {
        bgGlow: 'bg-cyan-500/20 group-hover:bg-cyan-500/30',
        borderColor: 'group-hover:border-cyan-500/50',
        textColor: 'text-cyan-400'
      };
    default:
      return {
        bgGlow: 'bg-slate-500/20 group-hover:bg-slate-500/30',
        borderColor: 'group-hover:border-slate-500/50',
        textColor: 'text-slate-400'
      };
  }
};

export default function MainsWidget() {
  const [stats, setStats] = useState<MainStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [ddVersion, setDdVersion] = useState("14.24.1");

  // Fetch latest DDragon version once
  useEffect(() => {
    fetch("https://ddragon.leagueoflegends.com/api/versions.json")
      .then(r => r.json())
      .then((versions: string[]) => { if (versions[0]) setDdVersion(versions[0]); })
      .catch(() => {});
  }, []);

  const fetchStats = () => {
    fetch("/api/stats/otp", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Oops, we haven't got JSON!");
        }
        return res.json();
      })
      .then((json) => {
        setStats(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch mains stats:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
    const iv = setInterval(fetchStats, 15_000); // refresh every 15 seconds
    return () => clearInterval(iv);
  }, []);

  if (loading) {
    return (
      <div className="h-48 glass-panel rounded-3xl flex items-center justify-center text-slate-400 font-bold tracking-widest uppercase">
        Loading OTP Stats...
      </div>
    );
  }

  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 relative z-10 mt-16">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-3 h-10 bg-gradient-to-b from-purple-400 to-pink-600 rounded-full shadow-[0_0_15px_rgba(192,38,211,0.8)]"></div>
        <h2 className="text-3xl font-black text-white uppercase tracking-widest drop-shadow-md">OTP Performance</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const config = getChampConfig(stat.champName);
          
          return (
            <div key={idx} className={`glass-panel rounded-3xl p-6 relative overflow-hidden group border border-slate-700/50 transition-colors duration-500 ${config.borderColor} hover:-translate-y-2 hover:shadow-2xl`}>
              <div className={`absolute -right-10 -bottom-10 w-48 h-48 rounded-full blur-[60px] transition-all duration-700 ${config.bgGlow}`}></div>
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-slate-900/80 flex items-center justify-center border border-slate-700/80 shadow-xl overflow-hidden backdrop-blur-sm">
                  <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/champion/${stat.champName}.png`} 
                    alt={stat.champName} 
                    className="w-16 h-16 scale-110 object-cover opacity-90 group-hover:scale-125 group-hover:opacity-100 transition-transform duration-500"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-wide truncate max-w-[150px]">{stat.riotId}</h3>
                  <div className={`text-sm font-bold uppercase tracking-widest ${config.textColor}`}>
                    {stat.champName} OTP
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/60 backdrop-blur-md relative z-10 shadow-inner">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1"><Target className="w-3 h-3"/> KDA</span>
                    <span className="font-black text-white text-lg">{stat.kda}</span>
                  </div>
                  <div className="flex flex-col items-center border-x border-slate-800">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> WR</span>
                    <span className={`font-black text-lg ${stat.winrate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>{stat.winrate}%</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1"><Swords className="w-3 h-3"/> Games</span>
                    <span className="font-black text-white text-lg">{stat.games}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
