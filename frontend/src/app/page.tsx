"use client";

import { useEffect, useState } from "react";
import RaceTrack from "@/components/RaceTrack";
import LPChart from "@/components/LPChart";
import MainsWidget from "@/components/MainsWidget";
import { Gamepad2, RefreshCcw } from "lucide-react";

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = () => {
    setLoading(true);
    fetch("http://localhost:3001/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch leaderboard", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeaderboard();
    // Auto refresh every 15 seconds
    const interval = setInterval(fetchLeaderboard, 15_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen p-8 md:p-12 lg:p-20 max-w-[1400px] mx-auto relative">
      <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-4 flex items-center gap-5 drop-shadow-[0_0_25px_rgba(56,189,248,0.5)]">
            <Gamepad2 className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
            LoL Tracker
          </h1>
          <p className="text-slate-300 text-xl ml-2 font-semibold tracking-widest uppercase">
            Private 4-Player Leaderboard
          </p>
        </div>
        
        <button 
          onClick={fetchLeaderboard}
          disabled={loading}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900/60 hover:bg-slate-800/80 text-cyan-400 rounded-2xl border border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300 font-bold uppercase tracking-[0.15em] text-sm disabled:opacity-50 backdrop-blur-md"
        >
          <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Updating...' : 'Refresh Data'}
        </button>
      </header>

      {/* RACE TRACK – full width for maximum bar accuracy */}
      <div className="relative z-10 mb-8">
        <RaceTrack />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* LEFT COLUMN - CHART */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          <LPChart />
        </div>

        {/* RIGHT COLUMN - WIDGETS & FUN */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-8">
          {/* Double Image Row */}
          <div className="grid grid-cols-2 gap-6 h-[350px]">
            {/* Highlight Panel */}
            <div className="glass-panel rounded-3xl relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/40 transition-colors duration-700 z-10 pointer-events-none"></div>
              
              <div className="absolute top-0 inset-x-0 p-5 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-transparent z-20 pointer-events-none">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
                  <span className="w-1.5 h-4 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></span>
                  Highlight
                </h3>
              </div>
              
              <img 
                src="/animation.gif" 
                alt="Highlight Animation" 
                className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105 z-0"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-3xl pointer-events-none z-30"></div>
            </div>

            {/* Dyszaki Panel */}
            <div className="glass-panel rounded-3xl relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/40 transition-colors duration-700 z-10 pointer-events-none"></div>
              
              <div className="absolute top-0 inset-x-0 p-5 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-transparent z-20 pointer-events-none">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
                  <span className="w-1.5 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                  Dyszaki
                </h3>
              </div>
              
              <img 
                src="/background.jpg" 
                alt="Dyszaki Kondziaki" 
                className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105 z-0"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-3xl pointer-events-none z-30"></div>
            </div>
          </div>

          {/* Pyk Pyk Pyk Panel */}
          <div className="glass-panel rounded-3xl relative overflow-hidden group shadow-2xl h-[300px]">
            <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/40 transition-colors duration-700 z-10 pointer-events-none"></div>
            
            <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-transparent z-20 pointer-events-none">
              <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3 drop-shadow-md">
                <span className="w-2 h-6 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]"></span>
                Pyk pyk pyk
              </h3>
            </div>
            
            <img 
              src="/extra_image.jpg" 
              alt="Pyk pyk pyk" 
              className="absolute inset-0 w-full h-full object-cover object-top transform transition-transform duration-700 group-hover:scale-105 z-0"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-3xl pointer-events-none z-30"></div>
          </div>


        </div>
      </div>
      
      {/* NEW SECTION: Mains Widget */}
      <MainsWidget />
      
      {/* Decorative background elements */}
      <div className="fixed top-1/4 -left-64 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-1/4 -right-64 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
    </main>
  );
}
