import React, { useEffect, useState } from 'react';

interface MatchScoreboardProps {
  matchId: string;
}

export default function MatchScoreboard({ matchId }: MatchScoreboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ddVersion, setDdVersion] = useState("14.24.1");

  useEffect(() => {
    fetch("https://ddragon.leagueoflegends.com/api/versions.json")
      .then(r => r.json())
      .then(versions => { if (versions[0]) setDdVersion(versions[0]); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/match/${matchId}`)
      .then(r => r.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch match details", err);
        setLoading(false);
      });
  }, [matchId]);

  if (loading || !data || !data.info) {
    return (
      <div className="w-[600px] bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl flex items-center justify-center animate-pulse">
        <div className="text-cyan-400 font-bold uppercase tracking-widest text-sm">
          Fetching advanced intel...
        </div>
      </div>
    );
  }

  const participants = data.info.participants;
  const blueTeam = participants.filter((p: any) => p.teamId === 100);
  const redTeam = participants.filter((p: any) => p.teamId === 200);

  const maxDamage = Math.max(...participants.map((p: any) => p.totalDamageDealtToChampions));
  
  // Helpers
  const getItemIcon = (itemId: number) => {
    if (itemId === 0) return null;
    return `https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/item/${itemId}.png`;
  };

  const getChampIcon = (champName: string) => {
    let fixedName = champName;
    if (fixedName === "FiddleSticks") fixedName = "Fiddlesticks";
    return `https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/champion/${fixedName}.png`;
  };

  const renderTeam = (team: any[], isBlue: boolean) => {
    const isWin = team[0]?.win;
    const teamColor = isBlue ? "blue" : "red";
    const headerColor = isWin ? "text-emerald-400" : "text-rose-400";
    const bgColor = isBlue ? "bg-blue-900/10" : "bg-rose-900/10";

    return (
      <div className={`mb-4 last:mb-0 rounded-xl overflow-hidden ${bgColor} border border-slate-800`}>
        <div className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${headerColor} border-b border-slate-800 bg-slate-950/50 flex justify-between`}>
          <span>{isWin ? "Victory" : "Defeat"} ({isBlue ? "Blue Team" : "Red Team"})</span>
        </div>
        
        <div className="divide-y divide-slate-800/50">
          {team.map((p: any, idx: number) => {
            const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
            const damagePercent = maxDamage > 0 ? (p.totalDamageDealtToChampions / maxDamage) * 100 : 0;
            const isMainPlayer = ["RGB AGD ADHD", "RobertoCatetas", "crisus22", "cosspeciales1", "Paul Kellerman", "Mateusz Gotówa"].includes(p.riotIdGameName);

            return (
              <div key={idx} className={`flex items-center gap-3 p-2 hover:bg-slate-800/40 transition-colors ${isMainPlayer ? 'bg-slate-800/30' : ''}`}>
                {/* Champ Icon */}
                <div className="relative w-10 h-10 flex-shrink-0">
                  <img src={getChampIcon(p.championName)} alt={p.championName} className="w-full h-full rounded-md border border-slate-700" />
                  <div className="absolute -bottom-1 -right-1 bg-slate-900 text-[9px] font-bold px-1 rounded-sm border border-slate-700 text-slate-300">
                    {p.champLevel}
                  </div>
                </div>

                {/* Name & KDA */}
                <div className="w-28 flex-shrink-0">
                  <div className={`text-xs font-bold truncate ${isMainPlayer ? 'text-white' : 'text-slate-400'}`}>
                    {p.riotIdGameName || p.summonerName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    <span className="text-emerald-400">{p.kills}</span> / <span className="text-rose-400">{p.deaths}</span> / <span className="text-cyan-400">{p.assists}</span>
                  </div>
                </div>

                {/* Damage Bar */}
                <div className="w-24 flex-shrink-0 flex flex-col justify-center gap-1">
                  <div className="text-[10px] text-slate-400 text-center font-mono">
                    {p.totalDamageDealtToChampions.toLocaleString()}
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${teamColor === 'blue' ? 'bg-blue-500' : 'bg-rose-500'}`} 
                      style={{ width: `${damagePercent}%` }}
                    />
                  </div>
                </div>

                {/* CS */}
                <div className="w-12 flex-shrink-0 text-center">
                  <div className="text-[10px] text-slate-400">{cs} CS</div>
                </div>

                {/* Items */}
                <div className="flex gap-1">
                  {[p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map((item, i) => (
                    <div key={i} className={`w-6 h-6 rounded bg-slate-800/80 border border-slate-700/50 flex-shrink-0 ${i === 6 ? 'rounded-full' : ''} overflow-hidden`}>
                      {item !== 0 && (
                        <img src={getItemIcon(item)!} alt="item" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-[600px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50">
      {renderTeam(blueTeam, true)}
      {renderTeam(redTeam, false)}
    </div>
  );
}
