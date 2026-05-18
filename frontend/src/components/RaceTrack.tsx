"use client";

import { useEffect, useState, useRef } from "react";
import MatchScoreboard from "./MatchScoreboard";

// ─── Constants ───────────────────────────────────────────────────────────────
// Absolute LP scale: Iron IV = 0, each tier = 400, each division = 100
// Track shows Iron → Challenger
const TRACK_MIN = 0;
const TRACK_MAX = 3200;

// Milestones: every division of every tier
// major = tier start (IV) → big dot + tier label; minor = III/II/I → small dim tick with label
const MILESTONES = [
  // Iron
  { label: "IR", absLp: 0, color: "#6b7280", major: true },
  { label: "III", absLp: 100, color: "#6b7280", major: false },
  { label: "II", absLp: 200, color: "#6b7280", major: false },
  { label: "I", absLp: 300, color: "#6b7280", major: false },
  // Bronze
  { label: "BR", absLp: 400, color: "#b45309", major: true },
  { label: "III", absLp: 500, color: "#b45309", major: false },
  { label: "II", absLp: 600, color: "#b45309", major: false },
  { label: "I", absLp: 700, color: "#b45309", major: false },
  // Silver
  { label: "SL", absLp: 800, color: "#94a3b8", major: true },
  { label: "III", absLp: 900, color: "#94a3b8", major: false },
  { label: "II", absLp: 1000, color: "#94a3b8", major: false },
  { label: "I", absLp: 1100, color: "#94a3b8", major: false },
  // Gold
  { label: "GO", absLp: 1200, color: "#f59e0b", major: true },
  { label: "III", absLp: 1300, color: "#f59e0b", major: false },
  { label: "II", absLp: 1400, color: "#f59e0b", major: false },
  { label: "I", absLp: 1500, color: "#f59e0b", major: false },
  // Platinum
  { label: "PL", absLp: 1600, color: "#22d3ee", major: true },
  { label: "III", absLp: 1700, color: "#22d3ee", major: false },
  { label: "II", absLp: 1800, color: "#22d3ee", major: false },
  { label: "I", absLp: 1900, color: "#22d3ee", major: false },
  // Emerald
  { label: "EM", absLp: 2000, color: "#10b981", major: true },
  { label: "III", absLp: 2100, color: "#10b981", major: false },
  { label: "II", absLp: 2200, color: "#10b981", major: false },
  { label: "I", absLp: 2300, color: "#10b981", major: false },
  // Diamond
  { label: "D4", absLp: 2400, color: "#818cf8", major: true },
  { label: "III", absLp: 2500, color: "#818cf8", major: false },
  { label: "II", absLp: 2600, color: "#818cf8", major: false },
  { label: "D1", absLp: 2700, color: "#a78bfa", major: true },
  // Master+
  { label: "MA", absLp: 2800, color: "#a855f7", major: true },
];

const PLAYER_COLORS: Record<string, { gradient: string, dot: string }> = {
  "RGB AGD ADHD": { gradient: "linear-gradient(90deg, rgba(244,63,94,0.9), rgba(251,113,133,0.6))", dot: "#f43f5e" },
  "RobertoCatetas": { gradient: "linear-gradient(90deg, rgba(14,165,233,0.9), rgba(56,189,248,0.6))", dot: "#0ea5e9" },
  "crisus22": { gradient: "linear-gradient(90deg, rgba(168,85,247,0.9), rgba(196,132,251,0.6))", dot: "#a855f7" },
  "cosspeciales1": { gradient: "linear-gradient(90deg, rgba(16,185,129,0.9), rgba(52,211,153,0.6))", dot: "#10b981" },
  "Paul Kellerman": { gradient: "linear-gradient(90deg, rgba(249,115,22,0.9), rgba(253,186,116,0.6))", dot: "#f97316" },
  "Mateusz Gotówa": { gradient: "linear-gradient(90deg, rgba(234,179,8,0.9), rgba(253,224,71,0.6))", dot: "#eab308" },
};

const PLAYER_EMOJI: Record<string, string> = {
  "RGB AGD ADHD": "💀",
  "RobertoCatetas": "🔥",
  "crisus22": "🏳️‍🌈",
  "cosspeciales1": "💣",
  "Paul Kellerman": "🕵️",
  "Mateusz Gotówa": "💸",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getAbsoluteLp(tier: string, rank: string, lp: number): number {
  const tiers: Record<string, number> = {
    IRON: 0, BRONZE: 400, SILVER: 800, GOLD: 1200,
    PLATINUM: 1600, EMERALD: 2000, DIAMOND: 2400,
    MASTER: 2800, GRANDMASTER: 2800, CHALLENGER: 2800, UNRANKED: 0,
  };
  const ranks: Record<string, number> = { IV: 0, III: 100, II: 200, I: 300, "": 0 };
  const base = tiers[tier] ?? 0;
  if (["MASTER", "GRANDMASTER", "CHALLENGER"].includes(tier)) return base + lp;
  return base + (ranks[rank] ?? 0) + lp;
}

function formatRankLabel(tier: string, rank: string, lp: number): string {
  const names: Record<string, string> = {
    IRON: "Żelazo", BRONZE: "Brąz", SILVER: "Srebro", GOLD: "Złoto",
    PLATINUM: "Platyna", EMERALD: "Szmaragd", DIAMOND: "Diament",
    MASTER: "Master", GRANDMASTER: "Grandmaster", CHALLENGER: "Challenger",
    UNRANKED: "Unranked",
  };
  const t = names[tier] ?? tier;
  if (["MASTER", "GRANDMASTER", "CHALLENGER"].includes(tier)) return `${t} ${lp} LP`;
  if (!rank) return "Unranked";
  return `${t} ${rank} · ${lp} LP`;
}

// Converts absolute LP to % position on track bar
function toPercent(absLp: number): number {
  const clamped = Math.min(Math.max(absLp, TRACK_MIN), TRACK_MAX);
  return ((clamped - TRACK_MIN) / (TRACK_MAX - TRACK_MIN)) * 100;
}

// Fix champion name for DDragon URL (handles most edge cases)
function ddragonName(name: string): string {
  const overrides: Record<string, string> = {
    "Nunu & Willump": "Nunu",
    "Renata Glasc": "Renata",
    "Wukong": "MonkeyKing",
    "LeBlanc": "Leblanc",
    "Lee Sin": "LeeSin",
    "Cho'Gath": "Chogath",
    "Dr. Mundo": "DrMundo",
    "Vel'Koz": "Velkoz",
    "Kog'Maw": "KogMaw",
    "Rek'Sai": "RekSai",
    "Kai'Sa": "Kaisa",
    "Kha'Zix": "Khazix",
    "K'Sante": "KSante",
    "Bel'Veth": "Belveth",
    "Aurelion Sol": "AurelionSol",
    "Twisted Fate": "TwistedFate",
    "Master Yi": "MasterYi",
    "Miss Fortune": "MissFortune",
    "Xin Zhao": "XinZhao",
    "Tahm Kench": "TahmKench",
    "Jarvan IV": "JarvanIV",
    "Hecarim": "Hecarim",
  };
  const trimmed = name.trim();
  if (overrides[trimmed]) return overrides[trimmed];
  // Remove spaces and apostrophes
  return trimmed.replace(/[\s']/g, "");
}

function champIconUrl(name: string, version: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${ddragonName(name)}.png`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function RaceTrack() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ddVersion, setDdVersion] = useState("14.24.1"); // fallback
  const [hoveredMatchKey, setHoveredMatchKey] = useState<string | null>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (matchId: string, playerIdx: number) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setHoveredMatchKey(`${matchId}-${playerIdx}`);
    }, 500); // 500ms delay as requested
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setHoveredMatchKey(null);
    }, 150); // slight delay before closing to allow moving mouse into tooltip if needed
  };

  // Fetch latest DDragon version once
  useEffect(() => {
    fetch("https://ddragon.leagueoflegends.com/api/versions.json")
      .then(r => r.json())
      .then((versions: string[]) => { if (versions[0]) setDdVersion(versions[0]); })
      .catch(() => {}); // keep fallback if offline
  }, []);

  const fetchData = () => {
    fetch("/api/players/race-track", { cache: "no-store" })
      .then(r => r.json())
      .then(d => { setPlayers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 15_000); // refresh every 15 seconds
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="glass-panel rounded-3xl p-6 lg:p-8 relative z-50">
      {/* Glow */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-600/10 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-2 h-7 bg-gradient-to-b from-amber-400 to-rose-500 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.7)]" />
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Race Track</h2>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-slate-500 text-sm font-bold tracking-widest uppercase animate-pulse">
          Loading...
        </div>
      ) : (
        <div>
          {/* ── Milestone bar ──────────────────────────────────────── */}
          <div className="relative h-10 mb-1 mx-1 ml-[216px]">
            {/* Track line */}
            <div className="absolute top-[6px] left-0 right-0 h-px bg-white/10" />

            {MILESTONES.map((m) => {
              const pct = toPercent(m.absLp);
              return m.major ? (
                // Major: tier start – large dot + label
                <div
                  key={m.absLp}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                >
                  <div
                    className="w-3 h-3 rounded-full border-2 border-slate-900"
                    style={{ backgroundColor: m.color, boxShadow: `0 0 6px ${m.color}88` }}
                  />
                  <span
                    className="text-[10px] font-black mt-1 tracking-wider"
                    style={{ color: m.color }}
                  >
                    {m.label}
                  </span>
                </div>
              ) : (
                // Minor: division tick – tiny dim dot, no label
                <div
                  key={m.absLp}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: m.color, opacity: 0.4 }}
                  />
                </div>
              );
            })}
          </div>

          {/* ── Tier separator lines on main track ────────────────── */}

          {/* ── Player rows ───────────────────────────────────────── */}
          <div className="space-y-8 mt-6">
            {(() => {
              // Defined pairs
              const pairDefinitions = [
                ["RGB AGD ADHD", "RobertoCatetas"],
                ["crisus22", "cosspeciales1"],
                ["Mateusz Gotówa", "Paul Kellerman"],
              ];

              // Group fetched players into these pairs
              const groupedPairs = pairDefinitions.map(pairRiotIds => {
                const pairPlayers = pairRiotIds
                  .map(riotId => players.find(p => p.riotId === riotId))
                  .filter(Boolean);
                
                const sumLp = pairPlayers.reduce((sum, p) => sum + getAbsoluteLp(p.tier, p.rank, p.lp), 0);
                
                return {
                  riotIds: pairRiotIds,
                  players: pairPlayers,
                  sumLp,
                };
              });

              // Sort pairs by sum of LP
              groupedPairs.sort((a, b) => b.sumLp - a.sumLp);

              return groupedPairs.map((pair, pairIdx) => (
                <div key={pairIdx} className="relative p-5 rounded-3xl bg-slate-800/20 border border-slate-700/50 shadow-inner space-y-6">
                  {/* Pair connecting line on the left */}
                  <div className="absolute left-9 top-12 bottom-12 w-px bg-slate-700/50" />
                  
                  {pair.players.map((player, idx) => {
                    // Find global index for colors
                    const globalIdx = players.findIndex(p => p.riotId === player.riotId);
                    
                    const absLp = getAbsoluteLp(player.tier, player.rank, player.lp);
                    const pct = toPercent(absLp);
                    const color = PLAYER_COLORS[player.riotId] || { gradient: "linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))", dot: "#fff" };
                    const winRate = player.wins + player.losses > 0
                      ? Math.round(player.wins / (player.wins + player.losses) * 100)
                      : 0;

                    return (
                      <div key={player.id} className={`space-y-2 relative ${hoveredMatchKey?.endsWith('-' + globalIdx) ? 'z-[99]' : 'z-10'}`}>
                        {/* Name + bar */}
                        <div className="flex items-center gap-3">
                          {/* Avatar dot */}
                          <div
                            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-black text-sm shadow-lg border-2 border-white/20 z-10"
                            style={{ backgroundColor: color.dot }}
                          >
                            {player.riotId.charAt(0).toUpperCase()}
                          </div>

                          {/* Name + WR */}
                          <div className="w-40 flex-shrink-0">
                            <div className="text-sm font-bold text-slate-200 truncate">
                              {PLAYER_EMOJI[player.riotId] ? `${PLAYER_EMOJI[player.riotId]} ` : ""}{player.riotId}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {player.wins}W {player.losses}L · {winRate}%
                            </div>
                          </div>

                          {/* Track */}
                          <div className="relative flex-1 h-10 bg-slate-900/70 rounded-xl border border-white/5 overflow-hidden">
                            {/* Tier separator lines */}
                            {MILESTONES.map(m => (
                              <div
                                key={m.absLp}
                                className="absolute top-0 bottom-0 w-px"
                                style={{
                                  left: `${toPercent(m.absLp)}%`,
                                  backgroundColor: m.color,
                                  opacity: 0.2,
                                }}
                              />
                            ))}

                            {/* Filled bar */}
                            <div
                              className="absolute inset-y-0 left-0 rounded-xl flex items-center overflow-hidden transition-all duration-700 ease-out"
                              style={{ width: `${pct}%`, background: color.gradient }}
                            >
                              {/* Shine effect */}
                              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                              {/* Label – only show if bar is wide enough */}
                              {pct > 12 && (
                                <span className="relative ml-auto mr-3 text-white font-black text-xs tracking-wide drop-shadow whitespace-nowrap">
                                  {formatRankLabel(player.tier, player.rank, player.lp)}
                                </span>
                              )}
                            </div>

                            {/* If bar too small, show label outside */}
                            {pct <= 12 && (
                              <span
                                className="absolute inset-y-0 flex items-center text-white font-black text-xs tracking-wide drop-shadow whitespace-nowrap ml-2"
                                style={{ left: `${pct}%` }}
                              >
                                {formatRankLabel(player.tier, player.rank, player.lp)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Champion icons – last 10 ranked matches */}
                        {player.recentChampions?.length > 0 && (
                          <div className="flex items-center gap-2 pl-[204px]">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                              Ostatnie {player.recentChampions.length}:
                            </span>
                            <div className="flex gap-1.5 flex-wrap">
                              {player.recentChampions.map((c: any, i: number) => {
                                const isRemake = c.remake === true;
                                // Determine border/shadow colors
                                const borderColor = isRemake
                                  ? "rgba(156,163,175,0.6)"
                                  : c.win
                                  ? "rgba(52,211,153,0.8)"
                                  : "rgba(239,68,68,0.5)";
                                const boxShadow = isRemake
                                  ? "0 0 4px rgba(156,163,175,0.3)"
                                  : c.win
                                  ? "0 0 6px rgba(52,211,153,0.4)"
                                  : "0 0 4px rgba(239,68,68,0.3)";
                                const stripeColor = isRemake ? "#9ca3af" : c.win ? "#34d399" : "#ef4444";

                                // LP badge
                                let lpLabel: string | null = null;
                                let lpColor = "";
                                if (c.lpChange !== null && c.lpChange !== undefined) {
                                  if (isRemake) {
                                    lpLabel = "±0";
                                    lpColor = "text-slate-400";
                                  } else if (c.lpChange > 0) {
                                    lpLabel = `+${c.lpChange}`;
                                    lpColor = "text-emerald-400";
                                  } else if (c.lpChange < 0) {
                                    lpLabel = `${c.lpChange}`;
                                    lpColor = "text-red-400";
                                  } else {
                                    lpLabel = "±0";
                                    lpColor = "text-slate-400";
                                  }
                                }

                                const title = isRemake
                                  ? `${c.championName} – Remake`
                                  : `${c.championName} – ${c.win ? "Wygrana" : "Przegrana"}`;

                                return (
                                  <div
                                    key={i}
                                    className="flex flex-col items-center gap-0.5"
                                  >
                                    <div
                                      title={title}
                                      className="relative w-8 h-8 rounded-lg flex-shrink-0 transition-transform duration-150 hover:scale-110"
                                      style={{
                                        border: `2px solid ${borderColor}`,
                                        boxShadow: boxShadow,
                                        zIndex: hoveredMatchKey === `${c.matchId}-${globalIdx}` ? 100 : 1,
                                        filter: isRemake ? "grayscale(0.6) brightness(0.75)" : undefined,
                                      }}
                                      onMouseEnter={() => handleMouseEnter(c.matchId, globalIdx)}
                                      onMouseLeave={handleMouseLeave}
                                    >
                                      <img
                                        src={champIconUrl(c.championName, ddVersion)}
                                        alt={c.championName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // fallback with raw name
                                          const t = e.target as HTMLImageElement;
                                          if (!t.dataset.fallback) {
                                            t.dataset.fallback = "1";
                                            t.src = `https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/champion/${c.championName}.png`;
                                          }
                                        }}
                                      />
                                      {/* W/L/Remake stripe */}
                                      <div
                                        className="absolute bottom-0 inset-x-0 h-[3px] rounded-b-sm"
                                        style={{ backgroundColor: stripeColor }}
                                      />

                                      {/* Hover Scoreboard Tooltip */}
                                      {hoveredMatchKey === `${c.matchId}-${globalIdx}` && c.matchId && (
                                        <div
                                          className="absolute top-10 left-1/2 -translate-x-1/2 z-[999]"
                                          onMouseEnter={() => handleMouseEnter(c.matchId, globalIdx)}
                                          onMouseLeave={handleMouseLeave}
                                        >
                                          <MatchScoreboard matchId={c.matchId} />
                                        </div>
                                      )}
                                    </div>

                                    {/* LP change badge */}
                                    {lpLabel && (
                                      <span className={`text-[9px] font-black leading-none ${lpColor}`}>
                                        {lpLabel}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
