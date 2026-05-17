"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function LPChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChartData = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}` + "/api/players/history-all", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch chart data", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchChartData();
    const iv = setInterval(fetchChartData, 15_000); // refresh every 15 seconds
    return () => clearInterval(iv);
  }, []);

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-slate-400">Loading chart data...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-400">No historical data available yet.</div>;
  }

  // We need to extract player names from the first data point keys (excluding 'date')
  const players = Object.keys(data[0] || {}).filter((k) => k !== "date");
  
  // Custom vibrant colors for the 4 players
  const colors = ["#0ea5e9", "#f43f5e", "#10b981", "#a855f7"];

  // Reverse absolute LP into Polish tier strings
  const getTierName = (absLp: number) => {
    if (absLp >= 2800) return `Master+ ${absLp - 2800} LP`;
    const tiers = ['Żelazo', 'Brąz', 'Srebro', 'Złoto', 'Platyna', 'Szmaragd', 'Diament'];
    const ranks = ['IV', 'III', 'II', 'I'];
    const tierIdx = Math.floor(absLp / 400);
    const rem = absLp % 400;
    const rankIdx = Math.floor(rem / 100);
    const lp = rem % 100;
    return `${tiers[tierIdx]} ${ranks[rankIdx]} ${lp} LP`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = new Date(label);
      const formattedDate = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth()+1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      
      return (
        <div className="glass-panel p-4 rounded-xl border border-white/10 shadow-2xl backdrop-blur-xl">
          <p className="mb-3 font-semibold text-slate-400 text-xs tracking-wider uppercase">{formattedDate}</p>
          <div className="flex flex-col gap-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm font-bold">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }}></div>
                <span className="text-slate-200">{entry.name}:</span>
                <span style={{ color: entry.color }}>{getTierName(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-3xl p-6 lg:p-8 mt-8 relative overflow-hidden group">
      {/* Decorative background blur */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-700"></div>
      
      <div className="mb-10 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl lg:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <div className="w-2 h-8 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
            LP w czasie (Ostatnie 7 dni)
          </h3>
          <p className="text-slate-400 mt-2 font-medium text-sm lg:text-base">Wykres na żywo pokazujący przeskoki rangi w prawdziwym czasie.</p>
        </div>
      </div>

      <div className="h-[450px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <defs>
              {players.map((player, idx) => (
                <linearGradient key={`grad-${player}`} id={`color-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0.0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="rgba(255,255,255,0.2)" 
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600 }} 
              tickMargin={15}
              minTickGap={30}
              tickFormatter={(val) => {
                const d = new Date(val);
                return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth()+1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:00`;
              }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.2)" 
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600 }}
              tickMargin={15}
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => getTierName(val).replace(' LP', '')}
              width={110}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '5 5' }} />
            <Legend 
              wrapperStyle={{ paddingTop: '25px', fontWeight: 600, fontSize: '14px' }} 
              iconType="circle" 
            />
            
            {players.map((player, idx) => (
              <Area 
                key={player}
                type="stepAfter" 
                dataKey={player} 
                stroke={colors[idx % colors.length]} 
                fill={`url(#color-${idx})`}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#0f172a', stroke: colors[idx % colors.length] }}
                activeDot={{ r: 7, strokeWidth: 0, fill: colors[idx % colors.length], style: { filter: `drop-shadow(0px 0px 8px ${colors[idx % colors.length]})` } }}
                connectNulls
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
